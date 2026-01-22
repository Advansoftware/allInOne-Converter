"""
AllOne Converter - Streamer Microservice
Handles HLS streaming and video preview generation
"""
import os
import uuid
import asyncio
import subprocess
import json
import hashlib
from typing import Optional
from pathlib import Path
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse, StreamingResponse
from pydantic import BaseModel
from pydantic_settings import BaseSettings
import redis
import aiofiles


class Settings(BaseSettings):
    redis_host: str = "redis"
    redis_port: int = 6379
    storage_path: str = "/app/storage"
    cache_path: str = "/app/cache"
    
    class Config:
        env_file = ".env"


settings = Settings()
app = FastAPI(title="AllOne Streamer Service", version="1.0.0")

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


class StreamRequest(BaseModel):
    file_path: str
    quality: Optional[str] = "720p"


class PreviewRequest(BaseModel):
    file_path: str
    start_time: Optional[str] = "00:00:00"
    duration: Optional[int] = 30  # seconds


QUALITY_PRESETS = {
    "360p": {
        "resolution": "640x360",
        "bitrate": "800k",
        "audio_bitrate": "96k"
    },
    "480p": {
        "resolution": "854x480",
        "bitrate": "1400k",
        "audio_bitrate": "128k"
    },
    "720p": {
        "resolution": "1280x720",
        "bitrate": "2800k",
        "audio_bitrate": "128k"
    },
    "1080p": {
        "resolution": "1920x1080",
        "bitrate": "5000k",
        "audio_bitrate": "192k"
    }
}


def get_cache_key(file_path: str, quality: str) -> str:
    """Generate cache key for HLS stream"""
    hash_input = f"{file_path}:{quality}:{os.path.getmtime(file_path) if os.path.exists(file_path) else ''}"
    return hashlib.md5(hash_input.encode()).hexdigest()


def get_hls_dir(cache_key: str) -> str:
    """Get HLS directory for cached stream"""
    return os.path.join(settings.cache_path, "hls", cache_key)


async def generate_hls(file_path: str, cache_key: str, quality: str):
    """Generate HLS stream from video file"""
    hls_dir = get_hls_dir(cache_key)
    os.makedirs(hls_dir, exist_ok=True)
    
    preset = QUALITY_PRESETS.get(quality, QUALITY_PRESETS["720p"])
    
    playlist_path = os.path.join(hls_dir, "playlist.m3u8")
    segment_path = os.path.join(hls_dir, "segment_%03d.ts")
    
    # Build FFmpeg command
    cmd = [
        "ffmpeg", "-y",
        "-i", file_path,
        "-c:v", "libx264",
        "-preset", "veryfast",
        "-tune", "zerolatency",
        "-crf", "23",
        "-vf", f"scale={preset['resolution']}",
        "-b:v", preset["bitrate"],
        "-c:a", "aac",
        "-b:a", preset["audio_bitrate"],
        "-f", "hls",
        "-hls_time", "4",
        "-hls_list_size", "0",
        "-hls_segment_filename", segment_path,
        playlist_path
    ]
    
    # Set status in Redis
    redis_client.hset(f"stream:{cache_key}", mapping={
        "status": "generating",
        "progress": 0,
        "file_path": file_path,
        "quality": quality
    })
    
    try:
        # Get video duration
        duration_result = subprocess.run([
            "ffprobe", "-v", "error",
            "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1",
            file_path
        ], capture_output=True, text=True)
        duration = float(duration_result.stdout.strip()) if duration_result.stdout.strip() else 0
        
        # Run FFmpeg
        process = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        
        await process.wait()
        
        if process.returncode == 0:
            redis_client.hset(f"stream:{cache_key}", mapping={
                "status": "ready",
                "progress": 100,
                "playlist": playlist_path
            })
        else:
            stderr = await process.stderr.read()
            redis_client.hset(f"stream:{cache_key}", mapping={
                "status": "failed",
                "error": stderr.decode()[:500]
            })
            
    except Exception as e:
        redis_client.hset(f"stream:{cache_key}", mapping={
            "status": "failed",
            "error": str(e)
        })


async def generate_preview(file_path: str, start_time: str, duration: int) -> str:
    """Generate a short preview clip for streaming"""
    preview_hash = hashlib.md5(f"{file_path}:{start_time}:{duration}".encode()).hexdigest()
    preview_dir = os.path.join(settings.cache_path, "previews", preview_hash)
    os.makedirs(preview_dir, exist_ok=True)
    
    playlist_path = os.path.join(preview_dir, "playlist.m3u8")
    segment_path = os.path.join(preview_dir, "segment_%03d.ts")
    
    # Check if already exists
    if os.path.exists(playlist_path):
        return preview_hash
    
    cmd = [
        "ffmpeg", "-y",
        "-ss", start_time,
        "-i", file_path,
        "-t", str(duration),
        "-c:v", "libx264",
        "-preset", "ultrafast",
        "-crf", "28",
        "-vf", "scale=854:480",
        "-c:a", "aac",
        "-b:a", "96k",
        "-f", "hls",
        "-hls_time", "2",
        "-hls_list_size", "0",
        "-hls_segment_filename", segment_path,
        playlist_path
    ]
    
    process = await asyncio.create_subprocess_exec(
        *cmd,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE
    )
    
    await process.wait()
    
    if process.returncode != 0:
        stderr = await process.stderr.read()
        raise Exception(f"Preview generation failed: {stderr.decode()[:200]}")
    
    return preview_hash


@app.get("/")
async def root():
    return {"service": "streamer", "status": "running", "version": "1.0.0"}


@app.get("/health")
async def health():
    try:
        redis_client.ping()
        return {"status": "healthy", "redis": "connected"}
    except:
        return JSONResponse(status_code=503, content={"status": "unhealthy"})


@app.post("/stream/prepare")
async def prepare_stream(request: StreamRequest, background_tasks: BackgroundTasks):
    """Prepare HLS stream from video file"""
    if not os.path.exists(request.file_path):
        raise HTTPException(status_code=404, detail="File not found")
    
    cache_key = get_cache_key(request.file_path, request.quality)
    
    # Check if already cached
    stream_data = redis_client.hgetall(f"stream:{cache_key}")
    if stream_data and stream_data.get("status") == "ready":
        return {
            "stream_id": cache_key,
            "status": "ready",
            "playlist_url": f"/stream/{cache_key}/playlist.m3u8"
        }
    
    # Start generation in background
    background_tasks.add_task(generate_hls, request.file_path, cache_key, request.quality)
    
    return {
        "stream_id": cache_key,
        "status": "generating",
        "playlist_url": f"/stream/{cache_key}/playlist.m3u8"
    }


@app.get("/stream/{stream_id}/status")
async def stream_status(stream_id: str):
    """Get stream generation status"""
    stream_data = redis_client.hgetall(f"stream:{stream_id}")
    
    if not stream_data:
        raise HTTPException(status_code=404, detail="Stream not found")
    
    return stream_data


@app.get("/stream/{stream_id}/playlist.m3u8")
async def get_playlist(stream_id: str):
    """Get HLS playlist"""
    hls_dir = get_hls_dir(stream_id)
    playlist_path = os.path.join(hls_dir, "playlist.m3u8")
    
    if not os.path.exists(playlist_path):
        # Check if generating
        stream_data = redis_client.hgetall(f"stream:{stream_id}")
        if stream_data and stream_data.get("status") == "generating":
            raise HTTPException(status_code=202, detail="Stream is being generated")
        raise HTTPException(status_code=404, detail="Playlist not found")
    
    return FileResponse(
        playlist_path,
        media_type="application/vnd.apple.mpegurl",
        headers={"Access-Control-Allow-Origin": "*"}
    )


@app.get("/stream/{stream_id}/{segment}")
async def get_segment(stream_id: str, segment: str):
    """Get HLS segment"""
    hls_dir = get_hls_dir(stream_id)
    segment_path = os.path.join(hls_dir, segment)
    
    if not os.path.exists(segment_path):
        raise HTTPException(status_code=404, detail="Segment not found")
    
    return FileResponse(
        segment_path,
        media_type="video/mp2t",
        headers={"Access-Control-Allow-Origin": "*"}
    )


@app.post("/preview")
async def create_preview(request: PreviewRequest):
    """Create a short preview clip for streaming"""
    if not os.path.exists(request.file_path):
        raise HTTPException(status_code=404, detail="File not found")
    
    try:
        preview_id = await generate_preview(
            request.file_path,
            request.start_time,
            request.duration
        )
        
        return {
            "preview_id": preview_id,
            "playlist_url": f"/preview/{preview_id}/playlist.m3u8"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/preview/{preview_id}/playlist.m3u8")
async def get_preview_playlist(preview_id: str):
    """Get preview HLS playlist"""
    preview_dir = os.path.join(settings.cache_path, "previews", preview_id)
    playlist_path = os.path.join(preview_dir, "playlist.m3u8")
    
    if not os.path.exists(playlist_path):
        raise HTTPException(status_code=404, detail="Preview not found")
    
    return FileResponse(
        playlist_path,
        media_type="application/vnd.apple.mpegurl",
        headers={"Access-Control-Allow-Origin": "*"}
    )


@app.get("/preview/{preview_id}/{segment}")
async def get_preview_segment(preview_id: str, segment: str):
    """Get preview HLS segment"""
    preview_dir = os.path.join(settings.cache_path, "previews", preview_id)
    segment_path = os.path.join(preview_dir, segment)
    
    if not os.path.exists(segment_path):
        raise HTTPException(status_code=404, detail="Segment not found")
    
    return FileResponse(
        segment_path,
        media_type="video/mp2t",
        headers={"Access-Control-Allow-Origin": "*"}
    )


@app.get("/thumbnail")
async def generate_thumbnail(file_path: str, time: str = "00:00:01"):
    """Generate thumbnail from video"""
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    
    thumb_hash = hashlib.md5(f"{file_path}:{time}".encode()).hexdigest()
    thumb_dir = os.path.join(settings.cache_path, "thumbnails")
    os.makedirs(thumb_dir, exist_ok=True)
    
    thumb_path = os.path.join(thumb_dir, f"{thumb_hash}.jpg")
    
    if not os.path.exists(thumb_path):
        cmd = [
            "ffmpeg", "-y",
            "-ss", time,
            "-i", file_path,
            "-vframes", "1",
            "-vf", "scale=320:180",
            thumb_path
        ]
        
        result = subprocess.run(cmd, capture_output=True)
        
        if result.returncode != 0:
            raise HTTPException(status_code=500, detail="Failed to generate thumbnail")
    
    return FileResponse(thumb_path, media_type="image/jpeg")


@app.delete("/cache/preview/{preview_id}")
async def delete_preview(preview_id: str):
    """Delete preview cache"""
    preview_dir = os.path.join(settings.cache_path, "previews", preview_id)
    
    if os.path.exists(preview_dir):
        import shutil
        shutil.rmtree(preview_dir)
    
    return {"status": "deleted"}


@app.delete("/cache/stream/{stream_id}")
async def delete_stream(stream_id: str):
    """Delete stream cache"""
    hls_dir = get_hls_dir(stream_id)
    
    if os.path.exists(hls_dir):
        import shutil
        shutil.rmtree(hls_dir)
    
    redis_client.delete(f"stream:{stream_id}")
    
    return {"status": "deleted"}


@app.post("/cache/cleanup")
async def cleanup_cache(max_age_hours: int = 24):
    """Clean up old cache files"""
    import time
    import shutil
    
    now = time.time()
    max_age_seconds = max_age_hours * 3600
    deleted = 0
    
    for cache_type in ["hls", "previews", "thumbnails"]:
        cache_dir = os.path.join(settings.cache_path, cache_type)
        if not os.path.exists(cache_dir):
            continue
        
        for item in os.listdir(cache_dir):
            item_path = os.path.join(cache_dir, item)
            try:
                if os.path.isdir(item_path):
                    mtime = os.path.getmtime(item_path)
                    if now - mtime > max_age_seconds:
                        shutil.rmtree(item_path)
                        deleted += 1
                elif os.path.isfile(item_path):
                    mtime = os.path.getmtime(item_path)
                    if now - mtime > max_age_seconds:
                        os.remove(item_path)
                        deleted += 1
            except Exception:
                pass
    
    return {"deleted": deleted}


@app.get("/transmux")
async def transmux_video(file_path: str):
    """Transmux video file to browser-compatible MP4 format (no re-encoding video)
    Used for MKV and other non-browser-native formats
    """
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    
    ext = file_path.split(".")[-1].lower()
    
    # For already compatible formats, just stream the file directly
    if ext in ["mp4", "webm"]:
        return FileResponse(file_path, media_type=f"video/{ext}")
    
    def generate():
        cmd = [
            "ffmpeg",
            "-i", file_path,
            "-c:v", "copy",  # Copy video stream (no re-encoding)
            "-c:a", "aac",   # Convert audio to AAC (browser compatible)
            "-b:a", "192k",
            "-movflags", "frag_keyframe+empty_moov+faststart",
            "-f", "mp4",
            "-"
        ]
        
        process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.DEVNULL,
            bufsize=65536
        )
        
        try:
            while True:
                chunk = process.stdout.read(65536)
                if not chunk:
                    break
                yield chunk
        finally:
            process.terminate()
            process.wait()
    
    return StreamingResponse(
        generate(),
        media_type="video/mp4",
        headers={
            "Access-Control-Allow-Origin": "*",
        }
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
