"""
AllOne Converter - Conversion Microservice
Handles video/audio conversion using FFmpeg
"""
import os
import uuid
import asyncio
import subprocess
import json
from typing import Optional
from fastapi import FastAPI, HTTPException, BackgroundTasks, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from pydantic import BaseModel
from pydantic_settings import BaseSettings
import redis
import aiofiles


class Settings(BaseSettings):
    redis_host: str = "redis"
    redis_port: int = 6379
    storage_path: str = "/app/storage"
    
    class Config:
        env_file = ".env"


settings = Settings()
app = FastAPI(title="AllOne Converter Service", version="1.0.0")

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


class ConversionRequest(BaseModel):
    input_path: str
    output_format: str
    ffmpeg_params: Optional[str] = None
    job_id: Optional[str] = None


class ConversionStatus(BaseModel):
    job_id: str
    status: str  # pending, processing, completed, failed
    progress: float
    output_path: Optional[str] = None
    error: Optional[str] = None


CONVERSION_PROFILES = {
    "youtube_hd": {
        "name": "YouTube HD (MP4)",
        "extension": "mp4",
        "params": "-c:v libx264 -preset fast -crf 23 -c:a aac -b:a 192k -vf scale=1920:1080"
    },
    "instagram_story": {
        "name": "Instagram Story (MP4)",
        "extension": "mp4",
        "params": "-c:v libx264 -preset fast -crf 25 -c:a aac -b:a 128k -vf scale=1080:1920"
    },
    "audio_mp3": {
        "name": "Áudio MP3",
        "extension": "mp3",
        "params": "-vn -ar 44100 -ac 2 -b:a 192k"
    },
    "gif": {
        "name": "GIF Animado",
        "extension": "gif",
        "params": "-vf scale=480:-1 -r 10"
    },
    "hls": {
        "name": "HLS Streaming",
        "extension": "m3u8",
        "params": "-c:v libx264 -c:a aac -f hls -hls_time 4 -hls_list_size 0 -hls_segment_filename"
    },
    "webm": {
        "name": "WebM (VP9)",
        "extension": "webm",
        "params": "-c:v libvpx-vp9 -crf 30 -b:v 0 -c:a libopus"
    },
    "thumbnail": {
        "name": "Thumbnail",
        "extension": "jpg",
        "params": "-ss 00:00:01 -vframes 1 -vf scale=320:180"
    }
}


def get_job_key(job_id: str) -> str:
    return f"conversion:job:{job_id}"


def update_job_status(job_id: str, status: str, progress: float = 0, 
                      output_path: str = None, error: str = None,
                      thumbnail: str = None, title: str = None):
    """Update job status in Redis"""
    job_data = {
        "job_id": job_id,
        "status": status,
        "progress": progress,
        "output_path": output_path or "",
        "error": error or ""
    }
    
    # Add optional fields
    if thumbnail:
        job_data["thumbnail"] = thumbnail
    if title:
        job_data["title"] = title
    
    redis_client.hset(get_job_key(job_id), mapping=job_data)
    redis_client.expire(get_job_key(job_id), 86400)  # 24h expiry
    
    # Publish status update
    redis_client.publish(f"conversion:status:{job_id}", json.dumps(job_data))


def get_video_duration(input_path: str) -> float:
    """Get video duration using ffprobe"""
    try:
        result = subprocess.run([
            "ffprobe", "-v", "error", "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1", input_path
        ], capture_output=True, text=True)
        return float(result.stdout.strip())
    except:
        return 0


def get_media_info(input_path: str) -> dict:
    """Get media information using ffprobe"""
    try:
        result = subprocess.run([
            "ffprobe", "-v", "quiet", "-print_format", "json",
            "-show_format", "-show_streams", input_path
        ], capture_output=True, text=True)
        return json.loads(result.stdout)
    except Exception as e:
        return {"error": str(e)}


async def generate_thumbnail_for_job(job_id: str, input_path: str) -> str:
    """Generate a thumbnail for a job and return the path"""
    try:
        thumb_dir = os.path.join(settings.storage_path, "thumbnails")
        os.makedirs(thumb_dir, exist_ok=True)
        
        output_path = os.path.join(thumb_dir, f"{job_id}.jpg")
        
        # Check if file is a video by looking at streams
        info = get_media_info(input_path)
        has_video = False
        if "streams" in info:
            for stream in info["streams"]:
                if stream.get("codec_type") == "video":
                    has_video = True
                    break
        
        if not has_video:
            return ""
        
        # Generate thumbnail at 1 second mark
        cmd = [
            "ffmpeg", "-y", "-i", input_path,
            "-ss", "00:00:01", "-vframes", "1",
            "-vf", "scale=320:180:force_original_aspect_ratio=decrease,pad=320:180:(ow-iw)/2:(oh-ih)/2",
            output_path
        ]
        
        process = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        await process.wait()
        
        if process.returncode == 0 and os.path.exists(output_path):
            return output_path
        return ""
    except Exception as e:
        print(f"Error generating thumbnail: {e}")
        return ""


async def run_conversion(job_id: str, input_path: str, output_path: str, 
                         ffmpeg_params: str):
    """Run FFmpeg conversion with progress tracking"""
    update_job_status(job_id, "processing", 0)
    
    # Generate thumbnail first
    thumbnail_path = await generate_thumbnail_for_job(job_id, input_path)
    if thumbnail_path:
        # Update job with thumbnail and publish update
        redis_client.hset(get_job_key(job_id), "thumbnail", thumbnail_path)
        # Publish thumbnail update so WebSocket relay can forward it
        job_data = redis_client.hgetall(get_job_key(job_id))
        job_data["thumbnail"] = thumbnail_path
        redis_client.publish(f"conversion:status:{job_id}", json.dumps(job_data))
    
    duration = get_video_duration(input_path)
    
    # Build FFmpeg command
    cmd = ["ffmpeg", "-y", "-i", input_path, "-progress", "pipe:1"]
    cmd.extend(ffmpeg_params.split())
    cmd.append(output_path)
    
    try:
        process = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        
        current_time = 0
        while True:
            line = await process.stdout.readline()
            if not line:
                break
            
            line = line.decode().strip()
            if line.startswith("out_time_ms="):
                try:
                    time_ms = int(line.split("=")[1])
                    current_time = time_ms / 1000000
                    if duration > 0:
                        progress = min((current_time / duration) * 100, 99)
                        update_job_status(job_id, "processing", progress)
                except:
                    pass
        
        await process.wait()
        
        if process.returncode == 0:
            update_job_status(job_id, "completed", 100, output_path)
        else:
            stderr = await process.stderr.read()
            update_job_status(job_id, "failed", 0, error=stderr.decode())
            
    except Exception as e:
        update_job_status(job_id, "failed", 0, error=str(e))


@app.get("/")
async def root():
    return {"service": "converter", "status": "running", "version": "1.0.0"}


@app.get("/health")
async def health():
    try:
        redis_client.ping()
        return {"status": "healthy", "redis": "connected"}
    except:
        return JSONResponse(status_code=503, content={"status": "unhealthy"})


@app.get("/profiles")
async def get_profiles():
    """Get available conversion profiles"""
    return CONVERSION_PROFILES


@app.post("/convert")
async def convert(request: ConversionRequest, background_tasks: BackgroundTasks):
    """Start a conversion job"""
    job_id = request.job_id or str(uuid.uuid4())
    
    if not os.path.exists(request.input_path):
        raise HTTPException(status_code=404, detail="Input file not found")
    
    # Get profile or use custom params
    if request.output_format in CONVERSION_PROFILES:
        profile = CONVERSION_PROFILES[request.output_format]
        extension = profile["extension"]
        params = profile["params"]
    else:
        extension = request.output_format
        params = request.ffmpeg_params or ""
    
    # Generate output path
    input_name = os.path.splitext(os.path.basename(request.input_path))[0]
    output_filename = f"{input_name}_{job_id}.{extension}"
    output_path = os.path.join(settings.storage_path, "converted", output_filename)
    
    # Ensure output directory exists
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    # Special handling for HLS
    if request.output_format == "hls":
        hls_dir = os.path.join(settings.storage_path, "hls", job_id)
        os.makedirs(hls_dir, exist_ok=True)
        segment_path = os.path.join(hls_dir, "segment_%03d.ts")
        output_path = os.path.join(hls_dir, "playlist.m3u8")
        params = f"-c:v libx264 -c:a aac -f hls -hls_time 4 -hls_list_size 0 -hls_segment_filename {segment_path}"
    
    # Initialize job
    update_job_status(job_id, "pending", 0)
    
    # Start conversion in background
    background_tasks.add_task(run_conversion, job_id, request.input_path, output_path, params)
    
    return {"job_id": job_id, "status": "pending"}


@app.post("/upload")
async def upload_file(file: UploadFile = File(...), profile: str = Form(None)):
    """Upload a file for conversion"""
    job_id = str(uuid.uuid4())
    
    # Save uploaded file
    upload_dir = os.path.join(settings.storage_path, "uploads")
    os.makedirs(upload_dir, exist_ok=True)
    
    file_path = os.path.join(upload_dir, f"{job_id}_{file.filename}")
    
    async with aiofiles.open(file_path, 'wb') as f:
        content = await file.read()
        await f.write(content)
    
    return {
        "job_id": job_id,
        "file_path": file_path,
        "filename": file.filename,
        "size": len(content)
    }


@app.get("/status/{job_id}")
async def get_status(job_id: str):
    """Get conversion job status"""
    job_data = redis_client.hgetall(get_job_key(job_id))
    
    if not job_data:
        raise HTTPException(status_code=404, detail="Job not found")
    
    return ConversionStatus(
        job_id=job_data.get("job_id", job_id),
        status=job_data.get("status", "unknown"),
        progress=float(job_data.get("progress", 0)),
        output_path=job_data.get("output_path") or None,
        error=job_data.get("error") or None
    )


@app.get("/info")
async def get_info(path: str):
    """Get media file information"""
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="File not found")
    
    return get_media_info(path)


@app.post("/thumbnail")
async def generate_thumbnail(input_path: str, time: str = "00:00:01"):
    """Generate a thumbnail from video"""
    if not os.path.exists(input_path):
        raise HTTPException(status_code=404, detail="File not found")
    
    job_id = str(uuid.uuid4())
    thumb_dir = os.path.join(settings.storage_path, "thumbnails")
    os.makedirs(thumb_dir, exist_ok=True)
    
    output_path = os.path.join(thumb_dir, f"{job_id}.jpg")
    
    cmd = [
        "ffmpeg", "-y", "-i", input_path,
        "-ss", time, "-vframes", "1",
        "-vf", "scale=320:180",
        output_path
    ]
    
    result = subprocess.run(cmd, capture_output=True)
    
    if result.returncode == 0:
        return {"thumbnail_path": output_path}
    else:
        raise HTTPException(status_code=500, detail="Failed to generate thumbnail")


@app.get("/download/{job_id}")
async def download_file(job_id: str):
    """Download converted file"""
    job_data = redis_client.hgetall(get_job_key(job_id))
    
    if not job_data:
        raise HTTPException(status_code=404, detail="Job not found")
    
    if job_data.get("status") != "completed":
        raise HTTPException(status_code=400, detail="Conversion not completed")
    
    output_path = job_data.get("output_path")
    if not output_path or not os.path.exists(output_path):
        raise HTTPException(status_code=404, detail="Output file not found")
    
    return FileResponse(
        output_path,
        filename=os.path.basename(output_path),
        media_type="application/octet-stream"
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
