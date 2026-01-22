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
from datetime import datetime
from fastapi import FastAPI, HTTPException, BackgroundTasks, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from pydantic_settings import BaseSettings
import redis
import httpx
import aiofiles

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


def update_job_status(job_id: str, data: dict):
    """Update job status in Redis"""
    for key, value in data.items():
        if isinstance(value, (list, dict)):
            data[key] = json.dumps(value)
    
    redis_client.hset(get_job_key(job_id), mapping=data)
    redis_client.expire(get_job_key(job_id), 86400 * 7)  # 7 days expiry
    
    # Publish status update
    redis_client.publish(f"torrent:status:{job_id}", json.dumps(data))


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


async def monitor_torrent(job_id: str, handle):
    """Monitor torrent download progress"""
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
            
            update_job_status(job_id, {
                "job_id": job_id,
                "status": torrent_status,
                "progress": status.progress * 100,
                "download_rate": status.download_rate,
                "upload_rate": status.upload_rate,
                "num_peers": status.num_peers,
                "num_seeds": status.num_seeds,
                "name": info.name() if info else "Loading metadata...",
                "files": files,
                "error": ""
            })
            
            if status.state in [lt.torrent_status.finished, lt.torrent_status.seeding]:
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
    """Add torrent from magnet URL"""
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
        
        handle = session.add_torrent(params)
        active_torrents[job_id] = handle
        
        update_job_status(job_id, {
            "job_id": job_id,
            "status": "metadata",
            "progress": 0,
            "name": "Loading metadata...",
            "files": []
        })
        
        # Start monitoring
        asyncio.create_task(monitor_torrent(job_id, handle))
        
    except Exception as e:
        update_job_status(job_id, {
            "job_id": job_id,
            "status": "failed",
            "error": str(e)
        })


async def add_torrent_from_file(job_id: str, torrent_path: str):
    """Add torrent from .torrent file"""
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
        
        handle = session.add_torrent({
            'ti': info,
            'save_path': save_path
        })
        active_torrents[job_id] = handle
        
        files = []
        for i in range(info.num_files()):
            file_info = info.file_at(i)
            files.append({
                "index": i,
                "name": file_info.path,
                "size": file_info.size,
                "priority": 4,
                "progress": 0
            })
        
        update_job_status(job_id, {
            "job_id": job_id,
            "status": "downloading",
            "progress": 0,
            "name": info.name(),
            "files": files
        })
        
        # Start monitoring
        asyncio.create_task(monitor_torrent(job_id, handle))
        
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
    """Select which files to download from torrent"""
    if request.job_id not in active_torrents:
        raise HTTPException(status_code=404, detail="Torrent not found")
    
    handle = active_torrents[request.job_id]
    
    if not handle.has_metadata():
        raise HTTPException(status_code=400, detail="Metadata not yet available")
    
    info = handle.get_torrent_info()
    
    # Set file priorities
    for i in range(info.num_files()):
        if i in request.file_indices:
            handle.file_priority(i, 4)  # High priority
        else:
            handle.file_priority(i, 0)  # Skip
    
    return {"status": "ok", "selected": request.file_indices}


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
async def remove_torrent(job_id: str, delete_files: bool = False):
    """Remove torrent"""
    if job_id in active_torrents:
        session = get_session()
        handle = active_torrents[job_id]
        
        if delete_files:
            session.remove_torrent(handle, lt.options_t.delete_files)
        else:
            session.remove_torrent(handle)
        
        del active_torrents[job_id]
    
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
    """List all active torrents"""
    torrents = []
    
    for job_id in active_torrents:
        job_data = redis_client.hgetall(get_job_key(job_id))
        if job_data:
            torrents.append({
                "job_id": job_id,
                "name": job_data.get("name", "Unknown"),
                "status": job_data.get("status", "unknown"),
                "progress": float(job_data.get("progress", 0))
            })
    
    return {"torrents": torrents}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
