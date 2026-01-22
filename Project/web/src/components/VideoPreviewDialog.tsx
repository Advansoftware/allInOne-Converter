import React, { useState, useRef, useEffect } from "react";
import {
  Dialog,
  Box,
  IconButton,
  Typography,
  Slider,
  CircularProgress,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import VolumeOffIcon from "@mui/icons-material/VolumeOff";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import FullscreenExitIcon from "@mui/icons-material/FullscreenExit";
import SettingsIcon from "@mui/icons-material/Settings";
import PictureInPictureAltIcon from "@mui/icons-material/PictureInPictureAlt";
import Forward10Icon from "@mui/icons-material/Forward10";
import Replay10Icon from "@mui/icons-material/Replay10";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";

interface VideoPreviewDialogProps {
  open: boolean;
  onClose: () => void;
  jobId: string;
  name: string;
  status: string;
  outputPath?: string;
}

const formatTime = (seconds: number): string => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

const VideoPreviewDialog: React.FC<VideoPreviewDialogProps> = ({
  open,
  onClose,
  jobId,
  name,
  status,
  outputPath,
}) => {
  const apiBaseUrl = import.meta.env.VITE_API_URL || "http://localhost:8080";
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isBuffering, setIsBuffering] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);

  // Preview is available whenever we have a jobId (streaming works during download)
  // Only fails for 'failed' status
  const isPreviewAvailable = status !== "failed" && jobId;
  const streamUrl = isPreviewAvailable
    ? `${apiBaseUrl}/api/stream/video/${jobId}`
    : null;
  const [videoError, setVideoError] = useState(false);

  // Hide controls timer
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (showControls && isPlaying) {
      timer = setTimeout(() => setShowControls(false), 3000);
    }
    return () => clearTimeout(timer);
  }, [showControls, isPlaying]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open || !videoRef.current) return;

      switch (e.key) {
        case " ":
        case "k":
          e.preventDefault();
          togglePlay();
          break;
        case "ArrowLeft":
          e.preventDefault();
          videoRef.current.currentTime -= 10;
          break;
        case "ArrowRight":
          e.preventDefault();
          videoRef.current.currentTime += 10;
          break;
        case "ArrowUp":
          e.preventDefault();
          setVolume(Math.min(1, volume + 0.1));
          break;
        case "ArrowDown":
          e.preventDefault();
          setVolume(Math.max(0, volume - 0.1));
          break;
        case "m":
          setIsMuted(!isMuted);
          break;
        case "f":
          toggleFullscreen();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, volume, isMuted, isPlaying]);

  // Volume effect
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (isFullscreen) {
      document.exitFullscreen();
    } else {
      containerRef.current.requestFullscreen();
    }
    setIsFullscreen(!isFullscreen);
  };

  const handleSeek = (_: Event, value: number | number[]) => {
    if (!videoRef.current) return;
    const newTime = value as number;
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (_: Event, value: number | number[]) => {
    const newVolume = value as number;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const skip = (seconds: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime += seconds;
  };

  const speedOptions = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

  const handleSpeedChange = (speed: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
      setPlaybackRate(speed);
    }
    setShowSpeedMenu(false);
  };

  const togglePiP = async () => {
    if (!videoRef.current) return;
    if (document.pictureInPictureElement) {
      await document.exitPictureInPicture();
    } else {
      await videoRef.current.requestPictureInPicture();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xl"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: "#0f0f0f",
          backgroundImage: "none",
          borderRadius: 2,
          overflow: "hidden",
          m: 1,
        },
      }}
    >
      {/* Header - YouTube style with better contrast */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 2,
          py: 1.5,
          backgroundColor: "#212121",
          borderBottom: "1px solid rgba(255,255,255,0.15)",
        }}
      >
        <Typography
          variant="body1"
          sx={{
            color: "#fff",
            fontWeight: 500,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            flex: 1,
            mr: 2,
            fontSize: 14,
          }}
        >
          {name || "Preview"}
        </Typography>
        <IconButton
          onClick={onClose}
          size="small"
          sx={{
            color: "rgba(255,255,255,0.7)",
            "&:hover": { color: "#fff" },
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Video Container */}
      <Box
        ref={containerRef}
        sx={{
          position: "relative",
          width: "100%",
          aspectRatio: "16/9",
          backgroundColor: "#000",
          cursor: showControls ? "default" : "none",
        }}
        onMouseMove={() => setShowControls(true)}
        onMouseLeave={() => isPlaying && setShowControls(false)}
        onClick={togglePlay}
      >
        {!isPreviewAvailable || videoError ? (
          <Box
            sx={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {status === "failed" || videoError ? (
              <Box sx={{ textAlign: "center" }}>
                <ErrorOutlineIcon
                  sx={{ fontSize: 48, color: "#f44336", mb: 1 }}
                />
                <Typography color="error" fontSize={14}>
                  {videoError
                    ? "Erro ao carregar vídeo"
                    : "Processamento falhou"}
                </Typography>
              </Box>
            ) : (
              <Box sx={{ textAlign: "center" }}>
                <CircularProgress sx={{ color: "#ff0000", mb: 2 }} size={48} />
                <Typography color="text.secondary" fontSize={14}>
                  Preparando stream...
                </Typography>
              </Box>
            )}
          </Box>
        ) : (
          <>
            <video
              ref={videoRef}
              src={streamUrl!}
              autoPlay
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
              }}
              onTimeUpdate={() =>
                setCurrentTime(videoRef.current?.currentTime || 0)
              }
              onDurationChange={() =>
                setDuration(videoRef.current?.duration || 0)
              }
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onWaiting={() => setIsBuffering(true)}
              onPlaying={() => {
                setIsBuffering(false);
                setVideoError(false);
              }}
              onError={() => setVideoError(true)}
              onCanPlay={() => setVideoError(false)}
              onClick={(e) => e.stopPropagation()}
            />

            {/* Buffering indicator */}
            {isBuffering && (
              <Box
                sx={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                }}
              >
                <CircularProgress sx={{ color: "#ff0000" }} size={48} />
              </Box>
            )}

            {/* Center play button (when paused) */}
            {!isPlaying && !isBuffering && (
              <Box
                sx={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  opacity: showControls ? 1 : 0,
                  transition: "opacity 0.2s",
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  togglePlay();
                }}
              >
                <Box
                  sx={{
                    width: 68,
                    height: 48,
                    backgroundColor: "rgba(0,0,0,0.6)",
                    borderRadius: 2,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    "&:hover": { backgroundColor: "#ff0000" },
                    transition: "background 0.2s",
                  }}
                >
                  <PlayArrowIcon sx={{ color: "#fff", fontSize: 32 }} />
                </Box>
              </Box>
            )}

            {/* Controls overlay - YouTube style */}
            <Box
              sx={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                background: "linear-gradient(transparent, rgba(0,0,0,0.9))",
                opacity: showControls ? 1 : 0,
                transition: "opacity 0.3s",
                pt: 6,
                pb: 1,
                px: 1,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Progress bar */}
              <Box sx={{ px: 1, mb: 0.5 }}>
                <Slider
                  size="small"
                  value={currentTime}
                  max={duration || 100}
                  onChange={handleSeek}
                  sx={{
                    color: "#ff0000",
                    height: 3,
                    p: 0,
                    "& .MuiSlider-thumb": {
                      width: 12,
                      height: 12,
                      opacity: 0,
                      transition: "opacity 0.1s",
                      "&:hover, &.Mui-focusVisible": {
                        boxShadow: "0 0 0 8px rgba(255,0,0,0.16)",
                      },
                    },
                    "&:hover .MuiSlider-thumb": {
                      opacity: 1,
                    },
                    "&:hover": {
                      height: 5,
                    },
                    "& .MuiSlider-rail": {
                      backgroundColor: "rgba(255,255,255,0.2)",
                    },
                    "& .MuiSlider-track": {
                      backgroundColor: "#ff0000",
                      border: "none",
                    },
                  }}
                />
              </Box>

              {/* Control buttons */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                }}
              >
                {/* Play/Pause */}
                <IconButton onClick={togglePlay} sx={{ color: "#fff", p: 1 }}>
                  {isPlaying ? (
                    <PauseIcon fontSize="medium" />
                  ) : (
                    <PlayArrowIcon fontSize="medium" />
                  )}
                </IconButton>

                {/* Skip buttons */}
                <IconButton
                  onClick={() => skip(-10)}
                  sx={{ color: "#fff", p: 1 }}
                >
                  <Replay10Icon fontSize="small" />
                </IconButton>
                <IconButton
                  onClick={() => skip(10)}
                  sx={{ color: "#fff", p: 1 }}
                >
                  <Forward10Icon fontSize="small" />
                </IconButton>

                {/* Volume */}
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    "&:hover .volume-slider": { width: 60, opacity: 1 },
                  }}
                >
                  <IconButton
                    onClick={() => setIsMuted(!isMuted)}
                    sx={{ color: "#fff", p: 1 }}
                  >
                    {isMuted || volume === 0 ? (
                      <VolumeOffIcon fontSize="small" />
                    ) : (
                      <VolumeUpIcon fontSize="small" />
                    )}
                  </IconButton>
                  <Slider
                    className="volume-slider"
                    size="small"
                    value={isMuted ? 0 : volume}
                    min={0}
                    max={1}
                    step={0.1}
                    onChange={handleVolumeChange}
                    sx={{
                      width: 0,
                      opacity: 0,
                      transition: "width 0.2s, opacity 0.2s",
                      color: "#fff",
                      ml: 1,
                      "& .MuiSlider-thumb": { width: 12, height: 12 },
                    }}
                  />
                </Box>

                {/* Time display */}
                <Typography
                  sx={{
                    color: "#fff",
                    fontSize: 12,
                    ml: 1,
                    fontFamily: "Roboto, sans-serif",
                    letterSpacing: 0.5,
                  }}
                >
                  {formatTime(currentTime)} / {formatTime(duration)}
                </Typography>

                <Box sx={{ flex: 1 }} />

                {/* Settings (Speed) */}
                <Box sx={{ position: "relative" }}>
                  <IconButton
                    onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                    sx={{ color: "#fff", p: 1 }}
                  >
                    <SettingsIcon fontSize="small" />
                  </IconButton>
                  {showSpeedMenu && (
                    <Box
                      sx={{
                        position: "absolute",
                        bottom: "100%",
                        right: 0,
                        mb: 1,
                        backgroundColor: "rgba(28,28,28,0.95)",
                        borderRadius: 1,
                        overflow: "hidden",
                        minWidth: 120,
                      }}
                    >
                      <Typography
                        sx={{
                          color: "#fff",
                          fontSize: 12,
                          px: 2,
                          py: 1,
                          borderBottom: "1px solid rgba(255,255,255,0.1)",
                        }}
                      >
                        Velocidade
                      </Typography>
                      {speedOptions.map((speed) => (
                        <Box
                          key={speed}
                          onClick={() => handleSpeedChange(speed)}
                          sx={{
                            px: 2,
                            py: 0.75,
                            cursor: "pointer",
                            backgroundColor:
                              playbackRate === speed
                                ? "rgba(255,255,255,0.1)"
                                : "transparent",
                            "&:hover": {
                              backgroundColor: "rgba(255,255,255,0.1)",
                            },
                            color: playbackRate === speed ? "#3ea6ff" : "#fff",
                            fontSize: 13,
                          }}
                        >
                          {speed === 1 ? "Normal" : `${speed}x`}
                        </Box>
                      ))}
                    </Box>
                  )}
                </Box>

                {/* PiP */}
                <IconButton onClick={togglePiP} sx={{ color: "#fff", p: 1 }}>
                  <PictureInPictureAltIcon fontSize="small" />
                </IconButton>

                {/* Fullscreen */}
                <IconButton
                  onClick={toggleFullscreen}
                  sx={{ color: "#fff", p: 1 }}
                >
                  {isFullscreen ? (
                    <FullscreenExitIcon fontSize="small" />
                  ) : (
                    <FullscreenIcon fontSize="small" />
                  )}
                </IconButton>
              </Box>
            </Box>
          </>
        )}
      </Box>
    </Dialog>
  );
};

export default VideoPreviewDialog;
