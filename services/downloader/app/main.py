"""
AllOne Converter - Downloader Microservice
Handles video downloads from URLs using yt-dlp
"""
import os
import uuid
import asyncio
import json
import re
from typing import Optional, List
from datetime import datetime, timezone
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from pydantic_settings import BaseSettings
import redis
import httpx
import yt_dlp
import pusher


class Settings(BaseSettings):
    redis_host: str = "redis"
    redis_port: int = 6379
    storage_path: str = "/app/storage"
    converter_service_url: str = "http://converter:8000"
    pusher_host: str = "websocket"
    pusher_port: int = 6001
    pusher_app_id: str = "100001"  # Must match Soketi config
    pusher_key: str = "allone-key"
    pusher_secret: str = "allone-secret"
    
    class Config:
        env_file = ".env"


settings = Settings()
app = FastAPI(title="AllOne Downloader Service", version="1.0.0")

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

# Pusher client for broadcasting (same as torrent service)
pusher_client = pusher.Pusher(
    app_id=settings.pusher_app_id,
    key=settings.pusher_key,
    secret=settings.pusher_secret,
    host=settings.pusher_host,
    port=settings.pusher_port,
    ssl=False
)


class DownloadRequest(BaseModel):
    url: str
    format: Optional[str] = "best"
    convert_to: Optional[str] = None
    job_id: Optional[str] = None


class DownloadStatus(BaseModel):
    job_id: str
    status: str  # pending, downloading, converting, completed, failed
    progress: float
    title: Optional[str] = None
    output_path: Optional[str] = None
    error: Optional[str] = None
    thumbnail: Optional[str] = None


class VideoInfo(BaseModel):
    url: str
    title: str
    duration: Optional[float] = None
    thumbnail: Optional[str] = None
    formats: List[dict] = []
    description: Optional[str] = None


def get_job_key(job_id: str) -> str:
    return f"download:job:{job_id}"


def get_thumbnail_path(job_id: str) -> str:
    """Get local thumbnail path for a job"""
    thumb_dir = os.path.join(settings.storage_path, "thumbnails")
    os.makedirs(thumb_dir, exist_ok=True)
    return os.path.join(thumb_dir, f"{job_id}.jpg")


async def download_thumbnail(url: str, job_id: str) -> Optional[str]:
    """Download thumbnail and save locally, return local path or URL"""
    if not url:
        return None
    
    local_path = get_thumbnail_path(job_id)
    
    # Check if already cached
    if os.path.exists(local_path):
        return f"/api/thumbnails/{job_id}.jpg"
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url)
            if response.status_code == 200:
                with open(local_path, 'wb') as f:
                    f.write(response.content)
                return f"/api/thumbnails/{job_id}.jpg"
    except Exception as e:
        print(f"Failed to download thumbnail: {e}")
    
    # Fallback to original URL if download fails
    return url


def broadcast_job_update(job_id: str, status: str, progress: float = 0,
                         title: str = None, output_path: str = None,
                         error: str = None, thumbnail: str = None):
    """Broadcast job update via Pusher/Soketi WebSocket"""
    try:
        event_data = {
            "job_id": job_id,
            "type": "download",
            "status": status,
            "progress": int(progress),
            "file_name": title or "",
            "error": error,
            "metadata": {
                "output_path": output_path or "",
                "thumbnail": thumbnail or "",
                "title": title or ""
            },
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        pusher_client.trigger('jobs', 'job.updated', event_data)
        print(f"📡 Broadcast: {job_id} - {status} - {progress}%")
    except Exception as e:
        print(f"Failed to broadcast job update: {e}")


def update_job_status(job_id: str, status: str, progress: float = 0,
                      title: str = None, output_path: str = None, 
                      error: str = None, thumbnail: str = None):
    """Update job status in Redis and broadcast via WebSocket"""
    job_data = {
        "job_id": job_id,
        "status": status,
        "progress": progress,
        "title": title or "",
        "output_path": output_path or "",
        "error": error or "",
        "thumbnail": thumbnail or ""
    }
    redis_client.hset(get_job_key(job_id), mapping=job_data)
    redis_client.expire(get_job_key(job_id), 86400)  # 24h expiry
    
    # Publish status update to Redis
    redis_client.publish(f"download:status:{job_id}", json.dumps(job_data))
    
    # Broadcast via Pusher/WebSocket
    broadcast_job_update(job_id, status, progress, title, output_path, error, thumbnail)


class DownloadProgressHook:
    def __init__(self, job_id: str):
        self.job_id = job_id
        self.title = None
        self.thumbnail = None
    
    def __call__(self, d):
        if d['status'] == 'downloading':
            progress = 0
            if 'total_bytes' in d and d['total_bytes']:
                progress = (d['downloaded_bytes'] / d['total_bytes']) * 100
            elif 'total_bytes_estimate' in d and d['total_bytes_estimate']:
                progress = (d['downloaded_bytes'] / d['total_bytes_estimate']) * 100
            
            update_job_status(
                self.job_id, 
                "downloading", 
                progress, 
                title=self.title,
                thumbnail=self.thumbnail
            )
        
        elif d['status'] == 'finished':
            update_job_status(
                self.job_id, 
                "downloading", 
                99, 
                title=self.title,
                thumbnail=self.thumbnail
            )


async def run_download(job_id: str, url: str, format_id: str, convert_to: str = None):
    """Run download with yt-dlp"""
    update_job_status(job_id, "pending", 0)
    
    download_dir = os.path.join(settings.storage_path, "downloads")
    os.makedirs(download_dir, exist_ok=True)
    
    output_template = os.path.join(download_dir, f"{job_id}_%(title)s.%(ext)s")
    
    progress_hook = DownloadProgressHook(job_id)
    
    ydl_opts = {
        'format': 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',  # Prefer MP4
        'outtmpl': output_template,
        'progress_hooks': [progress_hook],
        'noplaylist': True,
        'quiet': True,
        'no_warnings': True,
        'js_runtimes': {'node': {}},  # Use Node.js for JS challenges (required for YouTube)
        'extractor_args': {
            'youtube': {
                'player_client': ['android', 'web'],  # Use multiple clients for better format availability
            }
        },
        'http_headers': {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
        'retries': 3,
        'fragment_retries': 3,
        'file_access_retries': 3,
        'ignoreerrors': False,
        'no_check_certificate': True,
    }
    
    try:
        # PRIORITY 1: Get info (title + thumbnail) FIRST before anything else
        # This provides immediate feedback to the user
        info_opts = {
            'quiet': True,
            'no_warnings': True,
            'skip_download': True,
            'js_runtimes': {'node': {}},  # Use Node.js for JS challenges (required for YouTube)
        }
        
        # Check if thumbnail already cached
        cached_thumb = get_thumbnail_path(job_id)
        local_thumbnail = None
        if os.path.exists(cached_thumb):
            local_thumbnail = f"/api/thumbnails/{job_id}.jpg"
        
        with yt_dlp.YoutubeDL(info_opts) as ydl_info:
            info = ydl_info.extract_info(url, download=False)
            progress_hook.title = info.get('title', 'Unknown')
            original_thumbnail = info.get('thumbnail')
            
            # Use cached thumbnail or download new one
            if local_thumbnail:
                progress_hook.thumbnail = local_thumbnail
            elif original_thumbnail:
                # Download and cache thumbnail in background
                progress_hook.thumbnail = await download_thumbnail(original_thumbnail, job_id)
            
            # Immediately send the title and thumbnail to frontend
            update_job_status(
                job_id, 
                "downloading", 
                0, 
                title=progress_hook.title,
                thumbnail=progress_hook.thumbnail
            )
        
        # Now start the actual download
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            # Download
            ydl.download([url])
            
            # Find downloaded file
            downloaded_file = None
            for file in os.listdir(download_dir):
                if file.startswith(job_id):
                    downloaded_file = os.path.join(download_dir, file)
                    break
            
            if not downloaded_file:
                raise Exception("Downloaded file not found")
            
            # Convert if requested
            if convert_to:
                update_job_status(
                    job_id, 
                    "converting", 
                    0, 
                    title=progress_hook.title,
                    thumbnail=progress_hook.thumbnail
                )
                
                async with httpx.AsyncClient(timeout=3600) as client:
                    response = await client.post(
                        f"{settings.converter_service_url}/convert",
                        json={
                            "input_path": downloaded_file,
                            "output_format": convert_to,
                            "job_id": f"conv_{job_id}"
                        }
                    )
                    
                    if response.status_code == 200:
                        conv_data = response.json()
                        # Wait for conversion
                        while True:
                            await asyncio.sleep(2)
                            status_resp = await client.get(
                                f"{settings.converter_service_url}/status/{conv_data['job_id']}"
                            )
                            if status_resp.status_code == 200:
                                status_data = status_resp.json()
                                if status_data['status'] == 'completed':
                                    downloaded_file = status_data['output_path']
                                    break
                                elif status_data['status'] == 'failed':
                                    raise Exception(status_data.get('error', 'Conversion failed'))
                                else:
                                    update_job_status(
                                        job_id, 
                                        "converting", 
                                        status_data['progress'],
                                        title=progress_hook.title,
                                        thumbnail=progress_hook.thumbnail
                                    )
            
            update_job_status(
                job_id, 
                "completed", 
                100, 
                title=progress_hook.title,
                output_path=downloaded_file,
                thumbnail=progress_hook.thumbnail
            )
            
    except Exception as e:
        update_job_status(job_id, "failed", 0, error=str(e))


@app.get("/")
async def root():
    return {"service": "downloader", "status": "running", "version": "1.0.0"}


@app.get("/health")
async def health():
    try:
        redis_client.ping()
        return {"status": "healthy", "redis": "connected"}
    except:
        return JSONResponse(status_code=503, content={"status": "unhealthy"})


@app.post("/info")
async def get_video_info(url: str):
    """Get video information from URL"""
    ydl_opts = {
        'quiet': True,
        'no_warnings': True,
        'skip_download': True,
    }
    
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            
            formats = []
            for f in info.get('formats', []):
                formats.append({
                    'format_id': f.get('format_id'),
                    'ext': f.get('ext'),
                    'resolution': f.get('resolution', 'audio only'),
                    'filesize': f.get('filesize'),
                    'vcodec': f.get('vcodec'),
                    'acodec': f.get('acodec'),
                })
            
            return VideoInfo(
                url=url,
                title=info.get('title', 'Unknown'),
                duration=info.get('duration'),
                thumbnail=info.get('thumbnail'),
                formats=formats,
                description=info.get('description')
            )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/download")
async def download(request: DownloadRequest):
    """Start a download job - returns immediately"""
    job_id = request.job_id or str(uuid.uuid4())
    
    # Validate URL
    if not request.url:
        raise HTTPException(status_code=400, detail="URL is required")
    
    # Initialize job in Redis FIRST
    update_job_status(job_id, "pending", 0)
    
    # Start download in background using asyncio.create_task
    # This returns immediately without waiting
    asyncio.create_task(
        run_download(
            job_id, 
            request.url, 
            request.format,
            request.convert_to
        )
    )
    
    return {"job_id": job_id, "status": "pending"}


@app.get("/status/{job_id}")
async def get_status(job_id: str):
    """Get download job status"""
    job_data = redis_client.hgetall(get_job_key(job_id))
    
    if not job_data:
        raise HTTPException(status_code=404, detail="Job not found")
    
    return DownloadStatus(
        job_id=job_data.get("job_id", job_id),
        status=job_data.get("status", "unknown"),
        progress=float(job_data.get("progress", 0)),
        title=job_data.get("title") or None,
        output_path=job_data.get("output_path") or None,
        error=job_data.get("error") or None,
        thumbnail=job_data.get("thumbnail") or None
    )


@app.get("/supported")
async def supported_sites():
    """Get list of supported sites"""
    # Return a sample of popular supported sites
    return {
        "popular": [
            "youtube.com",
            "vimeo.com",
            "dailymotion.com",
            "twitter.com",
            "instagram.com",
            "tiktok.com",
            "facebook.com",
            "twitch.tv"
        ],
        "note": "yt-dlp supports 1000+ sites. Check https://github.com/yt-dlp/yt-dlp/blob/master/supportedsites.md"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
