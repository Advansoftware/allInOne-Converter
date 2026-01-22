"""
AllOne Converter - Torrent Microservice
Handles torrent downloads using libtorrent
"""
import os
import uuid
import asyncio
import json
import hashlib
import tempfile
from typing import Optional, List
from datetime import datetime, timezone
from fastapi import FastAPI, HTTPException, BackgroundTasks, UploadFile, File, Form, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel
from pydantic_settings import BaseSettings
import redis
import httpx
import aiofiles
import pusher

# Try to import libtorrent, fallback to mock if not available
try:
    import libtorrent as lt
    LIBTORRENT_AVAILABLE = True
except ImportError:
    LIBTORRENT_AVAILABLE = False


class Settings(BaseSettings):
    redis_host: str = "redis"
    redis_port: int = 6379
    storage_path: str = "/app/storage"
    download_path: str = "/app/downloads"
    converter_service_url: str = "http://converter:8000"
    streamer_service_url: str = "http://streamer:8000"
    pusher_app_id: str = "100001"
    pusher_key: str = "allone-key"
    pusher_secret: str = "allone-secret"
    pusher_host: str = "websocket"
    pusher_port: int = 6001
    
    class Config:
        env_file = ".env"


settings = Settings()
app = FastAPI(title="AllOne Torrent Service", version="1.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Redis connection
redis_client = redis.Redis(
    host=settings.redis_host,
    port=settings.redis_port,
    decode_responses=True
)

# Pusher client for broadcasting
pusher_client = pusher.Pusher(
    app_id=settings.pusher_app_id,
    key=settings.pusher_key,
    secret=settings.pusher_secret,
    host=settings.pusher_host,
    port=settings.pusher_port,
    ssl=False
)

# Torrent session
torrent_session = None
active_torrents = {}


class TorrentRequest(BaseModel):
    magnet_url: Optional[str] = None
    torrent_file: Optional[str] = None
    job_id: Optional[str] = None


class TorrentFile(BaseModel):
    index: int
    name: str
    size: int
    priority: int  # 0=skip, 1=normal, 4=high
    progress: float


class TorrentInfo(BaseModel):
    job_id: str
    name: str
    total_size: int
    files: List[TorrentFile]
    info_hash: str
    num_files: int


class TorrentStatus(BaseModel):
    job_id: str
    status: str  # metadata, downloading, paused, completed, failed
    progress: float
    download_rate: float  # bytes/sec
    upload_rate: float
    num_peers: int
    num_seeds: int
    name: Optional[str] = None
    files: List[TorrentFile] = []
    error: Optional[str] = None


class FileSelectRequest(BaseModel):
    job_id: str
    file_indices: List[int]
    convert_to: Optional[str] = None


def get_job_key(job_id: str) -> str:
    return f"torrent:job:{job_id}"


def broadcast_job_update(job_id: str, status: str, progress: float = 0,
                         file_name: str = None, error: str = None,
                         thumbnail: str = None, download_rate: float = 0,
                         upload_rate: float = 0, num_peers: int = 0, 
                         num_seeds: int = 0, files: list = None):
    """Broadcast job update via Pusher/Soketi"""
    try:
        # Convert thumbnail path to URL if it exists
        thumbnail_url = None
        if thumbnail:
            filename = os.path.basename(thumbnail)
            thumbnail_url = f"http://localhost:8080/api/thumbnails/{filename}"
        
        event_data = {
            "job_id": job_id,
            "type": "torrent",
            "status": status,
            "progress": int(progress),
            "file_name": file_name,
            "error": error,
            "metadata": {
                "thumbnail": thumbnail_url,
                "download_rate": download_rate,
                "upload_rate": upload_rate,
                "num_peers": num_peers,
                "num_seeds": num_seeds,
                "files": files
            },
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        pusher_client.trigger('jobs', 'job.updated', event_data)
    except Exception as e:
        print(f"Failed to broadcast torrent job update: {e}")


def update_job_status(job_id: str, data: dict):
    """Update job status in Redis and broadcast via WebSocket"""
    # Get data before JSON serialization
    file_name = data.get("name")
    status = data.get("status", "unknown")
    progress = float(data.get("progress", 0))
    error = data.get("error")
    thumbnail = data.get("thumbnail")
    download_rate = float(data.get("download_rate", 0))
    upload_rate = float(data.get("upload_rate", 0))
    num_peers = int(data.get("num_peers", 0))
    num_seeds = int(data.get("num_seeds", 0))
    files = data.get("files")  # Already a list
    
    # Serialize lists/dicts for Redis
    data_for_redis = data.copy()
    for key, value in data_for_redis.items():
        if isinstance(value, (list, dict)):
            data_for_redis[key] = json.dumps(value)
    
    redis_client.hset(get_job_key(job_id), mapping=data_for_redis)
    redis_client.expire(get_job_key(job_id), 86400 * 7)  # 7 days expiry
    
    # Publish status update via Redis
    redis_client.publish(f"torrent:status:{job_id}", json.dumps(data_for_redis))
    
    # Broadcast via Pusher/WebSocket with all data
    broadcast_job_update(job_id, status, progress, file_name, error, thumbnail,
                         download_rate, upload_rate, num_peers, num_seeds, files)

def get_session():
    """Get or create libtorrent session"""
    global torrent_session
    
    if not LIBTORRENT_AVAILABLE:
        return None
    
    if torrent_session is None:
        torrent_session = lt.session()
        torrent_session.listen_on(6881, 6891)
        
        # Configure session
        settings_pack = {
            'user_agent': 'AllOne/1.0',
            'listen_interfaces': '0.0.0.0:6881',
            'download_rate_limit': 0,  # unlimited
            'upload_rate_limit': 0,
            'active_downloads': 8,
            'active_seeds': 8,
            'active_limit': 20,
        }
        torrent_session.apply_settings(settings_pack)
    
    return torrent_session


async def monitor_torrent_metadata(job_id: str, handle):
    """Monitor only until metadata is available, then pause and wait for selection"""
    while True:
        try:
            if not handle.is_valid():
                break
            
            if handle.has_metadata():
                # Got metadata, pause and set all files to skip
                handle.pause()
                info = handle.get_torrent_info()
                
                for i in range(info.num_files()):
                    handle.file_priority(i, 0)
                
                files = []
                for i in range(info.num_files()):
                    file_info = info.file_at(i)
                    files.append({
                        "index": i,
                        "name": file_info.path,
                        "size": file_info.size,
                        "priority": 0,
                        "progress": 0
                    })
                
                update_job_status(job_id, {
                    "job_id": job_id,
                    "status": "waiting_selection",
                    "progress": 0,
                    "name": info.name(),
                    "files": files,
                    "waiting_selection": "true"
                })
                break
            
            await asyncio.sleep(1)
            
        except Exception as e:
            update_job_status(job_id, {
                "job_id": job_id,
                "status": "failed",
                "progress": 0,
                "error": str(e)
            })
            break


def is_media_file(filename: str) -> bool:
    """Check if file is a media file (video/audio)"""
    ext = filename.split(".")[-1].lower()
    media_exts = ["mp4", "mkv", "avi", "mov", "webm", "flv", "wmv", "m4v",
                  "mp3", "flac", "wav", "aac", "ogg", "m4a", "wma"]
    return ext in media_exts


def get_first_media_file(job_id: str, files: list) -> Optional[str]:
    """Get the first media file from the torrent"""
    download_dir = os.path.join(settings.download_path, job_id)
    
    for f in files:
        if is_media_file(f.get("name", "")):
            file_path = os.path.join(download_dir, f["name"])
            if os.path.exists(file_path):
                return file_path
    return None


async def on_torrent_complete(job_id: str, handle, convert_to: str = None):
    """Handle torrent completion - generate thumbnail and start conversion"""
    try:
        info = handle.get_torrent_info()
        download_dir = os.path.join(settings.download_path, job_id)
        
        # Get files list
        files = []
        for i in range(info.num_files()):
            if handle.file_priority(i) > 0:  # Only selected files
                file_info = info.file_at(i)
                files.append({
                    "index": i,
                    "name": file_info.path,
                    "size": file_info.size
                })
        
        # Find first media file for thumbnail
        first_media = get_first_media_file(job_id, files)
        
        if first_media:
            # Generate thumbnail using streamer service
            await generate_thumbnail_via_streamer(job_id, first_media)
        
        # Start conversion if configured
        if convert_to and first_media:
            await start_conversion(job_id, first_media, convert_to)
                
    except Exception as e:
        print(f"on_torrent_complete error: {e}")


async def generate_thumbnail_via_streamer(job_id: str, file_path: str, time: str = "00:00:10"):
    """Generate thumbnail using the streamer service"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{settings.streamer_service_url}/thumbnail",
                params={"file_path": file_path, "time": time},
                timeout=30
            )
            if response.status_code == 200:
                # Save thumbnail locally with job_id name
                thumbnail_dir = "/app/storage/thumbnails"
                os.makedirs(thumbnail_dir, exist_ok=True)
                thumbnail_path = os.path.join(thumbnail_dir, f"{job_id}.jpg")
                
                async with aiofiles.open(thumbnail_path, 'wb') as f:
                    await f.write(response.content)
                
                update_job_status(job_id, {"thumbnail": f"/api/thumbnails/{job_id}.jpg"})
                print(f"Thumbnail generated for {job_id}")
    except Exception as e:
        print(f"Thumbnail generation failed: {e}")


async def start_conversion(job_id: str, input_path: str, output_format: str):
    """Start conversion using the converter service"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{settings.converter_service_url}/convert",
                json={
                    "job_id": job_id,
                    "input_path": input_path,
                    "output_format": output_format,
                    "source": "torrent"
                },
                timeout=30
            )
            if response.status_code == 200:
                update_job_status(job_id, {"status": "converting"})
                print(f"Conversion started for {job_id}")
    except Exception as e:
        print(f"Conversion start failed: {e}")


async def monitor_torrent(job_id: str, handle, convert_to: str = None):
    """Monitor torrent download progress"""
    thumbnail_generated = False
    
    while True:
        try:
            if not handle.is_valid():
                break
            
            status = handle.status()
            info = handle.get_torrent_info() if handle.has_metadata() else None
            
            files = []
            if info:
                for i in range(info.num_files()):
                    file_info = info.file_at(i)
                    piece_length = info.piece_length()
                    file_progress = 0
                    
                    if status.pieces:
                        # Calculate file progress based on pieces
                        file_begin = file_info.offset // piece_length
                        file_end = (file_info.offset + file_info.size) // piece_length
                        pieces_have = sum(1 for p in range(file_begin, file_end + 1) 
                                         if p < len(status.pieces) and status.pieces[p])
                        total_pieces = file_end - file_begin + 1
                        file_progress = (pieces_have / total_pieces * 100) if total_pieces > 0 else 0
                    
                    files.append({
                        "index": i,
                        "name": file_info.path,
                        "size": file_info.size,
                        "priority": handle.file_priority(i),
                        "progress": file_progress
                    })
            
            state_map = {
                lt.torrent_status.checking_files: "checking",
                lt.torrent_status.downloading_metadata: "metadata",
                lt.torrent_status.downloading: "downloading",
                lt.torrent_status.finished: "completed",
                lt.torrent_status.seeding: "completed",
                lt.torrent_status.allocating: "allocating",
                lt.torrent_status.checking_resume_data: "checking"
            }
            
            torrent_status = state_map.get(status.state, "unknown")
            progress = status.progress * 100
            
            update_job_status(job_id, {
                "job_id": job_id,
                "status": torrent_status,
                "progress": progress,
                "download_rate": status.download_rate,
                "upload_rate": status.upload_rate,
                "num_peers": status.num_peers,
                "num_seeds": status.num_seeds,
                "name": info.name() if info else "Loading metadata...",
                "files": files,
                "error": "",
                "convert_to": convert_to or ""
            })
            
            # Generate thumbnail early when we have enough data (>10%)
            if not thumbnail_generated and progress > 10 and info:
                # Find first media file
                download_dir = os.path.join(settings.download_path, job_id)
                for f in files:
                    if is_media_file(f.get("name", "")) and f.get("priority", 0) > 0:
                        file_path = os.path.join(download_dir, f["name"])
                        if os.path.exists(file_path) and os.path.getsize(file_path) > 1024 * 1024:  # >1MB
                            asyncio.create_task(generate_thumbnail_via_streamer(job_id, file_path, "00:00:05"))
                            thumbnail_generated = True
                            break
            
            if status.state in [lt.torrent_status.finished, lt.torrent_status.seeding]:
                # Torrent completed - generate thumbnail and start conversion if configured
                await on_torrent_complete(job_id, handle, convert_to)
                break
            
            await asyncio.sleep(1)
            
        except Exception as e:
            update_job_status(job_id, {
                "job_id": job_id,
                "status": "failed",
                "progress": 0,
                "error": str(e)
            })
            break


async def add_torrent_from_magnet(job_id: str, magnet_url: str):
    """Add torrent from magnet URL - starts paused waiting for file selection"""
    session = get_session()
    
    if not session:
        update_job_status(job_id, {
            "job_id": job_id,
            "status": "failed",
            "error": "libtorrent not available"
        })
        return
    
    try:
        params = lt.parse_magnet_uri(magnet_url)
        params.save_path = os.path.join(settings.download_path, job_id)
        os.makedirs(params.save_path, exist_ok=True)
        
        # Add torrent but start paused
        params.flags |= lt.torrent_flags.paused
        params.flags |= lt.torrent_flags.auto_managed
        
        handle = session.add_torrent(params)
        active_torrents[job_id] = handle
        
        update_job_status(job_id, {
            "job_id": job_id,
            "status": "metadata",
            "progress": 0,
            "name": "Loading metadata...",
            "files": [],
            "waiting_selection": "true"
        })
        
        # Start metadata monitoring only - will pause after getting metadata
        asyncio.create_task(monitor_torrent_metadata(job_id, handle))
        
    except Exception as e:
        update_job_status(job_id, {
            "job_id": job_id,
            "status": "failed",
            "error": str(e)
        })


async def add_torrent_from_file(job_id: str, torrent_path: str):
    """Add torrent from .torrent file - starts paused waiting for file selection"""
    session = get_session()
    
    if not session:
        update_job_status(job_id, {
            "job_id": job_id,
            "status": "failed",
            "error": "libtorrent not available"
        })
        return
    
    try:
        info = lt.torrent_info(torrent_path)
        
        save_path = os.path.join(settings.download_path, job_id)
        os.makedirs(save_path, exist_ok=True)
        
        # Add torrent but paused and with all files set to skip (priority 0)
        handle = session.add_torrent({
            'ti': info,
            'save_path': save_path,
            'flags': lt.torrent_flags.paused | lt.torrent_flags.auto_managed
        })
        active_torrents[job_id] = handle
        
        # Set all files to NOT download (priority 0) until user selects
        for i in range(info.num_files()):
            handle.file_priority(i, 0)
        
        files = []
        for i in range(info.num_files()):
            file_info = info.file_at(i)
            files.append({
                "index": i,
                "name": file_info.path,
                "size": file_info.size,
                "priority": 0,
                "progress": 0
            })
        
        update_job_status(job_id, {
            "job_id": job_id,
            "status": "waiting_selection",
            "progress": 0,
            "name": info.name(),
            "files": files,
            "waiting_selection": "true"
        })
        
        # Don't start monitoring yet - wait for file selection
        
    except Exception as e:
        update_job_status(job_id, {
            "job_id": job_id,
            "status": "failed",
            "error": str(e)
        })


def parse_torrent_file(torrent_data: bytes) -> dict:
    """Parse torrent file and extract info"""
    try:
        import bencodepy
        decoded = bencodepy.decode(torrent_data)
        info = decoded.get(b'info', {})
        
        files = []
        if b'files' in info:
            # Multi-file torrent
            for i, f in enumerate(info[b'files']):
                path = '/'.join(p.decode() for p in f[b'path'])
                files.append({
                    "index": i,
                    "name": path,
                    "size": f[b'length'],
                    "priority": 4,
                    "progress": 0
                })
        else:
            # Single file
            files.append({
                "index": 0,
                "name": info.get(b'name', b'unknown').decode(),
                "size": info.get(b'length', 0),
                "priority": 4,
                "progress": 0
            })
        
        # Calculate info hash
        import hashlib
        info_hash = hashlib.sha1(bencodepy.encode(info)).hexdigest()
        
        return {
            "name": info.get(b'name', b'unknown').decode(),
            "files": files,
            "info_hash": info_hash,
            "total_size": sum(f['size'] for f in files),
            "num_files": len(files)
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid torrent file: {str(e)}")


@app.get("/")
async def root():
    return {
        "service": "torrent",
        "status": "running",
        "version": "1.0.0",
        "libtorrent": LIBTORRENT_AVAILABLE
    }


@app.get("/health")
async def health():
    try:
        redis_client.ping()
        return {
            "status": "healthy",
            "redis": "connected",
            "libtorrent": LIBTORRENT_AVAILABLE
        }
    except:
        return JSONResponse(status_code=503, content={"status": "unhealthy"})


@app.post("/add/magnet")
async def add_magnet(magnet_url: str, background_tasks: BackgroundTasks):
    """Add torrent from magnet URL"""
    job_id = str(uuid.uuid4())
    
    if not magnet_url.startswith("magnet:"):
        raise HTTPException(status_code=400, detail="Invalid magnet URL")
    
    background_tasks.add_task(add_torrent_from_magnet, job_id, magnet_url)
    
    return {"job_id": job_id, "status": "pending"}


@app.post("/add/file")
async def add_torrent_file(
    file: UploadFile = File(...),
    background_tasks: BackgroundTasks = None
):
    """Add torrent from .torrent file"""
    job_id = str(uuid.uuid4())
    
    if not file.filename.endswith('.torrent'):
        raise HTTPException(status_code=400, detail="Invalid file type")
    
    # Save torrent file
    torrent_dir = os.path.join(settings.storage_path, "torrents")
    os.makedirs(torrent_dir, exist_ok=True)
    
    torrent_path = os.path.join(torrent_dir, f"{job_id}.torrent")
    
    content = await file.read()
    async with aiofiles.open(torrent_path, 'wb') as f:
        await f.write(content)
    
    background_tasks.add_task(add_torrent_from_file, job_id, torrent_path)
    
    return {"job_id": job_id, "status": "pending"}


@app.post("/parse")
async def parse_torrent(file: UploadFile = File(...)):
    """Parse torrent file and return info without downloading"""
    if not file.filename.endswith('.torrent'):
        raise HTTPException(status_code=400, detail="Invalid file type")
    
    content = await file.read()
    info = parse_torrent_file(content)
    
    return TorrentInfo(
        job_id="",
        name=info["name"],
        total_size=info["total_size"],
        files=[TorrentFile(**f) for f in info["files"]],
        info_hash=info["info_hash"],
        num_files=info["num_files"]
    )


@app.post("/parse/magnet")
async def parse_magnet(magnet_url: str):
    """Parse magnet URL and return basic info"""
    if not magnet_url.startswith("magnet:"):
        raise HTTPException(status_code=400, detail="Invalid magnet URL")
    
    # Extract info from magnet URL
    import urllib.parse
    parsed = urllib.parse.urlparse(magnet_url)
    params = urllib.parse.parse_qs(parsed.query)
    
    name = params.get('dn', ['Unknown'])[0]
    
    # Extract info hash
    xt = params.get('xt', [''])[0]
    info_hash = ""
    if xt.startswith('urn:btih:'):
        info_hash = xt[9:]
    
    return {
        "name": name,
        "info_hash": info_hash,
        "is_magnet": True,
        "note": "Full file list available after download starts"
    }


@app.get("/status/{job_id}")
async def get_status(job_id: str):
    """Get torrent status"""
    job_data = redis_client.hgetall(get_job_key(job_id))
    
    if not job_data:
        raise HTTPException(status_code=404, detail="Job not found")
    
    files = []
    if job_data.get("files"):
        try:
            files = json.loads(job_data["files"])
        except:
            files = []
    
    return TorrentStatus(
        job_id=job_data.get("job_id", job_id),
        status=job_data.get("status", "unknown"),
        progress=float(job_data.get("progress", 0)),
        download_rate=float(job_data.get("download_rate", 0)),
        upload_rate=float(job_data.get("upload_rate", 0)),
        num_peers=int(job_data.get("num_peers", 0)),
        num_seeds=int(job_data.get("num_seeds", 0)),
        name=job_data.get("name"),
        files=[TorrentFile(**f) for f in files],
        error=job_data.get("error") or None
    )


@app.post("/select-files")
async def select_files(request: FileSelectRequest, background_tasks: BackgroundTasks):
    """Select which files to download from torrent and START downloading"""
    if request.job_id not in active_torrents:
        raise HTTPException(status_code=404, detail="Torrent not found")
    
    handle = active_torrents[request.job_id]
    
    if not handle.has_metadata():
        raise HTTPException(status_code=400, detail="Metadata not yet available")
    
    info = handle.get_torrent_info()
    
    # Set file priorities - only selected files will download
    for i in range(info.num_files()):
        if i in request.file_indices:
            handle.file_priority(i, 4)  # High priority
        else:
            handle.file_priority(i, 0)  # Skip
    
    # Resume the torrent to start downloading
    handle.resume()
    
    # Update status
    update_job_status(request.job_id, {
        "status": "downloading",
        "waiting_selection": "",
        "convert_to": request.convert_to or ""
    })
    
    # Start monitoring the download progress
    asyncio.create_task(monitor_torrent(request.job_id, handle, request.convert_to))
    
    return {"status": "downloading", "selected": request.file_indices}


@app.post("/pause/{job_id}")
async def pause_torrent(job_id: str):
    """Pause torrent download"""
    if job_id not in active_torrents:
        raise HTTPException(status_code=404, detail="Torrent not found")
    
    handle = active_torrents[job_id]
    handle.pause()
    
    update_job_status(job_id, {"status": "paused"})
    
    return {"status": "paused"}


@app.post("/resume/{job_id}")
async def resume_torrent(job_id: str):
    """Resume torrent download"""
    if job_id not in active_torrents:
        raise HTTPException(status_code=404, detail="Torrent not found")
    
    handle = active_torrents[job_id]
    handle.resume()
    
    update_job_status(job_id, {"status": "downloading"})
    
    return {"status": "resumed"}


@app.delete("/{job_id}")
async def remove_torrent(job_id: str):
    """Remove torrent and all associated files"""
    import shutil
    
    if job_id in active_torrents:
        session = get_session()
        handle = active_torrents[job_id]
        # Always delete files
        session.remove_torrent(handle, lt.options_t.delete_files)
        del active_torrents[job_id]
    
    # Also delete download directory if exists
    download_dir = os.path.join(settings.download_path, job_id)
    if os.path.exists(download_dir):
        shutil.rmtree(download_dir, ignore_errors=True)
    
    redis_client.delete(get_job_key(job_id))
    
    return {"status": "removed"}


@app.get("/files/{job_id}")
async def list_files(job_id: str):
    """List downloaded files for a torrent"""
    download_dir = os.path.join(settings.download_path, job_id)
    
    if not os.path.exists(download_dir):
        raise HTTPException(status_code=404, detail="Download directory not found")
    
    files = []
    for root, dirs, filenames in os.walk(download_dir):
        for filename in filenames:
            filepath = os.path.join(root, filename)
            rel_path = os.path.relpath(filepath, download_dir)
            files.append({
                "name": rel_path,
                "path": filepath,
                "size": os.path.getsize(filepath)
            })
    
    return {"files": files}


@app.get("/list")
async def list_torrents():
    """List all torrents (active and completed)"""
    torrents = []
    seen_ids = set()
    
    # First, get active torrents from memory
    for job_id in active_torrents:
        job_data = redis_client.hgetall(get_job_key(job_id))
        if job_data:
            seen_ids.add(job_id)
            torrents.append({
                "job_id": job_id,
                "name": job_data.get("name", "Unknown"),
                "status": job_data.get("status", "unknown"),
                "progress": float(job_data.get("progress", 0)),
                "download_rate": float(job_data.get("download_rate", 0)),
                "upload_rate": float(job_data.get("upload_rate", 0)),
                "num_peers": int(job_data.get("num_peers", 0)),
                "num_seeds": int(job_data.get("num_seeds", 0)),
            })
    
    # Also scan Redis for any completed torrents not in active_torrents
    # This ensures completed torrents remain visible
    for key in redis_client.scan_iter(match="torrent:job:*"):
        job_id = key.replace("torrent:job:", "")
        if job_id not in seen_ids:
            job_data = redis_client.hgetall(key)
            if job_data:
                torrents.append({
                    "job_id": job_id,
                    "name": job_data.get("name", "Unknown"),
                    "status": job_data.get("status", "unknown"),
                    "progress": float(job_data.get("progress", 0)),
                    "download_rate": 0,
                    "upload_rate": 0,
                    "num_peers": 0,
                    "num_seeds": 0,
                })
    
    return {"torrents": torrents}


@app.get("/stream/{job_id}/{file_index}")
async def stream_torrent_file(job_id: str, file_index: int, request: Request):
    """Stream a file from torrent (supports partial downloads)"""
    
    # Get job info from Redis
    job_data = redis_client.hgetall(get_job_key(job_id))
    if not job_data:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # Get files list
    files = []
    if job_data.get("files"):
        try:
            files = json.loads(job_data["files"])
        except:
            pass
    
    if file_index >= len(files):
        raise HTTPException(status_code=404, detail="File not found")
    
    file_info = files[file_index]
    file_name = file_info.get("name", "")
    
    # Construct file path
    download_dir = os.path.join(settings.download_path, job_id)
    file_path = os.path.join(download_dir, file_name)
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found on disk")
    
    file_size = os.path.getsize(file_path)
    
    # Get content type based on extension
    ext = file_name.split(".")[-1].lower()
    content_types = {
        "mp4": "video/mp4",
        "mkv": "video/x-matroska",
        "avi": "video/x-msvideo",
        "webm": "video/webm",
        "mov": "video/quicktime",
        "mp3": "audio/mpeg",
        "flac": "audio/flac",
        "wav": "audio/wav",
    }
    content_type = content_types.get(ext, "application/octet-stream")
    
    # Handle range requests for seeking
    range_header = request.headers.get("range")
    
    if range_header:
        # Parse range header
        range_match = range_header.replace("bytes=", "").split("-")
        start = int(range_match[0]) if range_match[0] else 0
        end = int(range_match[1]) if range_match[1] else file_size - 1
        
        # Don't go beyond what's downloaded
        if end >= file_size:
            end = file_size - 1
        
        content_length = end - start + 1
        
        async def stream_range():
            async with aiofiles.open(file_path, "rb") as f:
                await f.seek(start)
                remaining = content_length
                chunk_size = 65536  # 64KB chunks
                while remaining > 0:
                    read_size = min(chunk_size, remaining)
                    data = await f.read(read_size)
                    if not data:
                        break
                    remaining -= len(data)
                    yield data
        
        return StreamingResponse(
            stream_range(),
            status_code=206,
            media_type=content_type,
            headers={
                "Content-Range": f"bytes {start}-{end}/{file_size}",
                "Accept-Ranges": "bytes",
                "Content-Length": str(content_length),
            }
        )
    else:
        # Full file stream
        async def stream_full():
            async with aiofiles.open(file_path, "rb") as f:
                chunk_size = 65536
                while True:
                    data = await f.read(chunk_size)
                    if not data:
                        break
                    yield data
        
        return StreamingResponse(
            stream_full(),
            media_type=content_type,
            headers={
                "Accept-Ranges": "bytes",
                "Content-Length": str(file_size),
            }
        )


@app.get("/stream-compat/{job_id}/{file_index}")
async def stream_torrent_file_compat(job_id: str, file_index: int, request: Request):
    """Stream a file with browser-compatible transcoding via streamer service
    Redirects to streamer's transmux endpoint for MKV and other formats
    """
    # Get job info from Redis
    job_data = redis_client.hgetall(get_job_key(job_id))
    if not job_data:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # Get files list
    files = []
    if job_data.get("files"):
        try:
            files = json.loads(job_data["files"])
        except:
            pass
    
    if file_index >= len(files):
        raise HTTPException(status_code=404, detail="File not found")
    
    file_info = files[file_index]
    file_name = file_info.get("name", "")
    
    # Construct file path
    download_dir = os.path.join(settings.download_path, job_id)
    file_path = os.path.join(download_dir, file_name)
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found on disk")
    
    ext = file_name.split(".")[-1].lower()
    
    # For browser-compatible formats, just stream directly
    if ext in ["mp4", "webm"]:
        # Use normal stream endpoint
        return await stream_torrent_file(job_id, file_index, request)
    
    # For MKV and other formats, proxy to streamer service
    async def proxy_stream():
        async with httpx.AsyncClient(timeout=None) as client:
            async with client.stream(
                "GET",
                f"{settings.streamer_service_url}/transmux",
                params={"file_path": file_path}
            ) as response:
                async for chunk in response.aiter_bytes(65536):
                    yield chunk
    
    return StreamingResponse(
        proxy_stream(),
        media_type="video/mp4",
        headers={
            "Access-Control-Allow-Origin": "*",
        }
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
