import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Dialog,
  Box,
  IconButton,
  Typography,
  Slider,
  CircularProgress,
  Tooltip,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import VolumeDownIcon from "@mui/icons-material/VolumeDown";
import VolumeOffIcon from "@mui/icons-material/VolumeOff";
import VolumeMuteIcon from "@mui/icons-material/VolumeMute";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import FullscreenExitIcon from "@mui/icons-material/FullscreenExit";
import SettingsIcon from "@mui/icons-material/Settings";
import PictureInPictureAltIcon from "@mui/icons-material/PictureInPictureAlt";
import Forward10Icon from "@mui/icons-material/Forward10";
import Replay10Icon from "@mui/icons-material/Replay10";
import Forward5Icon from "@mui/icons-material/Forward5";
import Replay5Icon from "@mui/icons-material/Replay5";
import SkipNextIcon from "@mui/icons-material/SkipNext";
import SkipPreviousIcon from "@mui/icons-material/SkipPrevious";
import SlowMotionVideoIcon from "@mui/icons-material/SlowMotionVideo";
import ClosedCaptionIcon from "@mui/icons-material/ClosedCaption";
import ClosedCaptionDisabledIcon from "@mui/icons-material/ClosedCaptionDisabled";
import BrandingWatermarkIcon from "@mui/icons-material/BrandingWatermark";
import TheaterComedyIcon from "@mui/icons-material/TheaterComedy";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import CheckIcon from "@mui/icons-material/Check";

interface VideoPreviewDialogProps {
  open: boolean;
  onClose: () => void;
  jobId: string;
  name: string;
  status: string;
  outputPath?: string;
  customStreamUrl?: string; // For torrent streaming or other custom sources
}

const formatTime = (seconds: number): string => {
  if (!seconds || isNaN(seconds)) return "0:00";
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

// YouTube-style volume icon based on level
const getVolumeIcon = (volume: number, isMuted: boolean) => {
  if (isMuted || volume === 0) return <VolumeOffIcon />;
  if (volume < 0.3) return <VolumeMuteIcon />;
  if (volume < 0.7) return <VolumeDownIcon />;
  return <VolumeUpIcon />;
};

const VideoPreviewDialog: React.FC<VideoPreviewDialogProps> = ({
  open,
  onClose,
  jobId,
  name,
  status,
  outputPath,
  customStreamUrl,
}) => {
  const apiBaseUrl = import.meta.env.VITE_API_URL || "http://localhost:8080";
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [bufferedPercent, setBufferedPercent] = useState(0);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverPosition, setHoverPosition] = useState(0);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [isTheaterMode, setIsTheaterMode] = useState(false);
  const [showSkipAnimation, setShowSkipAnimation] = useState<
    "forward" | "backward" | null
  >(null);
  const [doubleTapSide, setDoubleTapSide] = useState<"left" | "right" | null>(
    null,
  );

  // Preview is available whenever we have a jobId (streaming works during download)
  // Only fails for 'failed' status
  const isPreviewAvailable = status !== "failed" && (jobId || customStreamUrl);
  const streamUrl = customStreamUrl
    ? customStreamUrl
    : isPreviewAvailable
      ? `${apiBaseUrl}/api/stream/video/${jobId}`
      : null;
  const [videoError, setVideoError] = useState(false);

  // Reset state when dialog opens or job changes
  useEffect(() => {
    if (open) {
      setVideoError(false);
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
      setIsBuffering(false);
      setShowSpeedMenu(false);
      setShowSettingsMenu(false);
      setBufferedPercent(0);
    }
  }, [open, jobId]);

  // Hide controls timer with smart behavior
  const resetControlsTimer = useCallback(() => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    setShowControls(true);
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
        setShowVolumeSlider(false);
        setShowSpeedMenu(false);
        setShowSettingsMenu(false);
      }, 3000);
    }
  }, [isPlaying]);

  // Hide controls timer
  useEffect(() => {
    resetControlsTimer();
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [isPlaying, resetControlsTimer]);

  // Update buffered progress
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateBuffer = () => {
      if (video.buffered.length > 0) {
        const bufferedEnd = video.buffered.end(video.buffered.length - 1);
        const percent = (bufferedEnd / video.duration) * 100;
        setBufferedPercent(percent);
      }
    };

    video.addEventListener("progress", updateBuffer);
    return () => video.removeEventListener("progress", updateBuffer);
  }, [streamUrl]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open || !videoRef.current) return;

      switch (e.key.toLowerCase()) {
        case " ":
        case "k":
          e.preventDefault();
          togglePlay();
          break;
        case "arrowleft":
          e.preventDefault();
          skip(-10);
          break;
        case "arrowright":
          e.preventDefault();
          skip(10);
          break;
        case "j":
          e.preventDefault();
          skip(-10);
          break;
        case "l":
          e.preventDefault();
          skip(10);
          break;
        case "arrowup":
          e.preventDefault();
          setVolume((v) => Math.min(1, v + 0.1));
          break;
        case "arrowdown":
          e.preventDefault();
          setVolume((v) => Math.max(0, v - 0.1));
          break;
        case "m":
          setIsMuted(!isMuted);
          break;
        case "f":
          toggleFullscreen();
          break;
        case "t":
          setIsTheaterMode(!isTheaterMode);
          break;
        case "i":
          togglePiP();
          break;
        case "0":
        case "home":
          e.preventDefault();
          if (videoRef.current) videoRef.current.currentTime = 0;
          break;
        case "end":
          e.preventDefault();
          if (videoRef.current) videoRef.current.currentTime = duration;
          break;
        case ",":
          e.preventDefault();
          if (videoRef.current && !isPlaying) {
            videoRef.current.currentTime -= 1 / 30; // Previous frame (assuming 30fps)
          }
          break;
        case ".":
          e.preventDefault();
          if (videoRef.current && !isPlaying) {
            videoRef.current.currentTime += 1 / 30; // Next frame (assuming 30fps)
          }
          break;
        case "<":
          e.preventDefault();
          handleSpeedChange(Math.max(0.25, playbackRate - 0.25));
          break;
        case ">":
          e.preventDefault();
          handleSpeedChange(Math.min(2, playbackRate + 0.25));
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, volume, isMuted, isPlaying, isTheaterMode, duration, playbackRate]);

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
    // Show skip animation
    setShowSkipAnimation(seconds > 0 ? "forward" : "backward");
    setTimeout(() => setShowSkipAnimation(null), 500);
  };

  // Double tap to skip (like YouTube mobile)
  const handleDoubleTap = (side: "left" | "right") => {
    setDoubleTapSide(side);
    skip(side === "right" ? 10 : -10);
    setTimeout(() => setDoubleTapSide(null), 500);
  };

  // Handle progress bar hover for time preview
  const handleProgressHover = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current || !duration) return;
    const rect = progressRef.current.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const time = percent * duration;
    setHoverTime(time);
    setHoverPosition(e.clientX - rect.left);
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
      maxWidth={isTheaterMode ? false : "lg"}
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: "#0f0f0f",
          backgroundImage: "none",
          borderRadius: isTheaterMode ? 0 : 2,
          overflow: "hidden",
          m: isTheaterMode ? 0 : 2,
          maxHeight: isTheaterMode ? "100vh" : "90vh",
          width: isTheaterMode ? "100vw" : undefined,
        },
      }}
    >
      {/* Video Container */}
      <Box
        ref={containerRef}
        sx={{
          position: "relative",
          width: "100%",
          aspectRatio: "16/9",
          backgroundColor: "#000",
          cursor: showControls ? "default" : "none",
          overflow: "hidden",
        }}
        onMouseMove={resetControlsTimer}
        onMouseLeave={() => {
          if (isPlaying) {
            setShowControls(false);
            setShowVolumeSlider(false);
          }
        }}
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
                  sx={{ fontSize: 64, color: "#f44336", mb: 2 }}
                />
                <Typography color="error" fontSize={16} fontWeight={500}>
                  {videoError
                    ? "Erro ao carregar vídeo"
                    : "Processamento falhou"}
                </Typography>
                <Typography color="text.secondary" fontSize={13} mt={1}>
                  Tente novamente mais tarde
                </Typography>
              </Box>
            ) : (
              <Box sx={{ textAlign: "center" }}>
                <CircularProgress sx={{ color: "#ff0000", mb: 2 }} size={56} />
                <Typography color="text.secondary" fontSize={14}>
                  Preparando stream...
                </Typography>
              </Box>
            )}
          </Box>
        ) : (
          <>
            {/* Click zones for double-tap skip */}
            <Box
              sx={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "30%",
                height: "100%",
                zIndex: 1,
              }}
              onClick={togglePlay}
              onDoubleClick={() => handleDoubleTap("left")}
            />
            <Box
              sx={{
                position: "absolute",
                top: 0,
                left: "30%",
                width: "40%",
                height: "100%",
                zIndex: 1,
              }}
              onClick={togglePlay}
            />
            <Box
              sx={{
                position: "absolute",
                top: 0,
                right: 0,
                width: "30%",
                height: "100%",
                zIndex: 1,
              }}
              onClick={togglePlay}
              onDoubleClick={() => handleDoubleTap("right")}
            />

            {/* Double tap animation */}
            {doubleTapSide && (
              <Box
                sx={{
                  position: "absolute",
                  top: "50%",
                  [doubleTapSide]: "15%",
                  transform: "translateY(-50%)",
                  zIndex: 5,
                  animation: "ripple 0.5s ease-out",
                  "@keyframes ripple": {
                    "0%": {
                      transform: "translateY(-50%) scale(0.8)",
                      opacity: 1,
                    },
                    "100%": {
                      transform: "translateY(-50%) scale(1.5)",
                      opacity: 0,
                    },
                  },
                }}
              >
                <Box
                  sx={{
                    width: 100,
                    height: 100,
                    borderRadius: "50%",
                    backgroundColor: "rgba(255,255,255,0.3)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {doubleTapSide === "right" ? (
                    <Forward10Icon sx={{ fontSize: 40, color: "#fff" }} />
                  ) : (
                    <Replay10Icon sx={{ fontSize: 40, color: "#fff" }} />
                  )}
                </Box>
              </Box>
            )}

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
            />

            {/* Buffering indicator */}
            {isBuffering && (
              <Box
                sx={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  zIndex: 10,
                }}
              >
                <CircularProgress
                  sx={{ color: "#fff" }}
                  size={56}
                  thickness={3}
                />
              </Box>
            )}

            {/* Center play button (when paused) - YouTube style large button */}
            {!isPlaying && !isBuffering && (
              <Box
                sx={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  opacity: showControls ? 1 : 0,
                  transition: "opacity 0.2s",
                  zIndex: 10,
                  pointerEvents: "none",
                }}
              >
                <Box
                  sx={{
                    width: 80,
                    height: 80,
                    backgroundColor: "rgba(0,0,0,0.7)",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backdropFilter: "blur(4px)",
                  }}
                >
                  <PlayArrowIcon sx={{ color: "#fff", fontSize: 48 }} />
                </Box>
              </Box>
            )}

            {/* Top gradient for close button */}
            <Box
              sx={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: 80,
                background:
                  "linear-gradient(to bottom, rgba(0,0,0,0.7), transparent)",
                opacity: showControls ? 1 : 0,
                transition: "opacity 0.3s",
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                px: 2,
                pt: 1,
                zIndex: 15,
                pointerEvents: showControls ? "auto" : "none",
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
                  fontSize: 15,
                  textShadow: "0 1px 3px rgba(0,0,0,0.8)",
                  pt: 0.5,
                }}
              >
                {name || "Preview"}
              </Typography>
              <IconButton
                onClick={onClose}
                sx={{
                  color: "#fff",
                  "&:hover": { backgroundColor: "rgba(255,255,255,0.1)" },
                }}
              >
                <CloseIcon />
              </IconButton>
            </Box>

            {/* Controls overlay - Modern YouTube 2026 style */}
            <Box
              sx={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                background: "linear-gradient(transparent, rgba(0,0,0,0.9))",
                opacity: showControls ? 1 : 0,
                transition: "opacity 0.3s",
                pt: 8,
                pb: 1.5,
                px: 2,
                zIndex: 15,
                pointerEvents: showControls ? "auto" : "none",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Progress bar container */}
              <Box
                ref={progressRef}
                sx={{
                  position: "relative",
                  height: 20,
                  display: "flex",
                  alignItems: "center",
                  cursor: "pointer",
                  mb: 0.5,
                  "&:hover .progress-bar": {
                    height: 5,
                  },
                  "&:hover .progress-thumb": {
                    opacity: 1,
                    transform: "scale(1)",
                  },
                  "&:hover .hover-preview": {
                    opacity: 1,
                  },
                }}
                onMouseMove={handleProgressHover}
                onMouseLeave={() => setHoverTime(null)}
                onClick={(e) => {
                  if (!progressRef.current || !duration) return;
                  const rect = progressRef.current.getBoundingClientRect();
                  const percent = (e.clientX - rect.left) / rect.width;
                  const newTime = percent * duration;
                  if (videoRef.current) {
                    videoRef.current.currentTime = newTime;
                    setCurrentTime(newTime);
                  }
                }}
              >
                {/* Hover time preview tooltip */}
                {hoverTime !== null && (
                  <Box
                    className="hover-preview"
                    sx={{
                      position: "absolute",
                      bottom: 20,
                      left: hoverPosition,
                      transform: "translateX(-50%)",
                      backgroundColor: "rgba(28,28,28,0.95)",
                      color: "#fff",
                      px: 1.5,
                      py: 0.5,
                      borderRadius: 1,
                      fontSize: 13,
                      fontWeight: 500,
                      whiteSpace: "nowrap",
                      pointerEvents: "none",
                      zIndex: 20,
                    }}
                  >
                    {formatTime(hoverTime)}
                  </Box>
                )}

                {/* Background track */}
                <Box
                  sx={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    height: 3,
                    backgroundColor: "rgba(255,255,255,0.2)",
                    borderRadius: 1.5,
                  }}
                />

                {/* Buffered progress */}
                <Box
                  sx={{
                    position: "absolute",
                    left: 0,
                    width: `${bufferedPercent}%`,
                    height: 3,
                    backgroundColor: "rgba(255,255,255,0.4)",
                    borderRadius: 1.5,
                  }}
                />

                {/* Played progress */}
                <Box
                  className="progress-bar"
                  sx={{
                    position: "absolute",
                    left: 0,
                    width: `${duration ? (currentTime / duration) * 100 : 0}%`,
                    height: 3,
                    backgroundColor: "#ff0000",
                    borderRadius: 1.5,
                    transition: "height 0.1s",
                  }}
                />

                {/* Thumb/scrubber */}
                <Box
                  className="progress-thumb"
                  sx={{
                    position: "absolute",
                    left: `${duration ? (currentTime / duration) * 100 : 0}%`,
                    width: 14,
                    height: 14,
                    backgroundColor: "#ff0000",
                    borderRadius: "50%",
                    transform: "translateX(-50%) scale(0)",
                    opacity: 0,
                    transition: "opacity 0.1s, transform 0.1s",
                    boxShadow: "0 0 4px rgba(0,0,0,0.5)",
                  }}
                />
              </Box>

              {/* Control buttons row */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                }}
              >
                {/* Play/Pause */}
                <Tooltip
                  title={isPlaying ? "Pausar (k)" : "Reproduzir (k)"}
                  placement="top"
                >
                  <IconButton
                    onClick={togglePlay}
                    sx={{
                      color: "#fff",
                      p: 1,
                      "&:hover": { backgroundColor: "rgba(255,255,255,0.1)" },
                    }}
                  >
                    {isPlaying ? (
                      <PauseIcon sx={{ fontSize: 28 }} />
                    ) : (
                      <PlayArrowIcon sx={{ fontSize: 28 }} />
                    )}
                  </IconButton>
                </Tooltip>

                {/* Skip backward */}
                <Tooltip title="Voltar 10 segundos (←)" placement="top">
                  <IconButton
                    onClick={() => skip(-10)}
                    sx={{
                      color: "#fff",
                      p: 1,
                      "&:hover": { backgroundColor: "rgba(255,255,255,0.1)" },
                    }}
                  >
                    <Replay10Icon sx={{ fontSize: 24 }} />
                  </IconButton>
                </Tooltip>

                {/* Skip forward */}
                <Tooltip title="Avançar 10 segundos (→)" placement="top">
                  <IconButton
                    onClick={() => skip(10)}
                    sx={{
                      color: "#fff",
                      p: 1,
                      "&:hover": { backgroundColor: "rgba(255,255,255,0.1)" },
                    }}
                  >
                    <Forward10Icon sx={{ fontSize: 24 }} />
                  </IconButton>
                </Tooltip>

                {/* Volume control */}
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    position: "relative",
                  }}
                  onMouseEnter={() => setShowVolumeSlider(true)}
                  onMouseLeave={() => setShowVolumeSlider(false)}
                >
                  <Tooltip
                    title={isMuted ? "Ativar som (m)" : "Mudo (m)"}
                    placement="top"
                  >
                    <IconButton
                      onClick={() => setIsMuted(!isMuted)}
                      sx={{
                        color: "#fff",
                        p: 1,
                        "&:hover": { backgroundColor: "rgba(255,255,255,0.1)" },
                      }}
                    >
                      {getVolumeIcon(volume, isMuted)}
                    </IconButton>
                  </Tooltip>
                  <Box
                    sx={{
                      width: showVolumeSlider ? 70 : 0,
                      overflow: "hidden",
                      transition: "width 0.2s ease",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <Slider
                      size="small"
                      value={isMuted ? 0 : volume}
                      min={0}
                      max={1}
                      step={0.05}
                      onChange={handleVolumeChange}
                      sx={{
                        width: 60,
                        color: "#fff",
                        ml: 1,
                        "& .MuiSlider-thumb": {
                          width: 12,
                          height: 12,
                          "&:hover": {
                            boxShadow: "0 0 0 8px rgba(255,255,255,0.16)",
                          },
                        },
                        "& .MuiSlider-track": {
                          border: "none",
                        },
                        "& .MuiSlider-rail": {
                          backgroundColor: "rgba(255,255,255,0.3)",
                        },
                      }}
                    />
                  </Box>
                </Box>

                {/* Time display */}
                <Typography
                  sx={{
                    color: "#fff",
                    fontSize: 13,
                    ml: 1.5,
                    fontFamily: "Roboto, Arial, sans-serif",
                    fontWeight: 500,
                    letterSpacing: 0.3,
                    userSelect: "none",
                  }}
                >
                  {formatTime(currentTime)} / {formatTime(duration)}
                </Typography>

                <Box sx={{ flex: 1 }} />

                {/* Speed indicator (when not 1x) */}
                {playbackRate !== 1 && (
                  <Typography
                    onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                    sx={{
                      color: "#fff",
                      fontSize: 12,
                      px: 1,
                      py: 0.5,
                      backgroundColor: "rgba(255,255,255,0.2)",
                      borderRadius: 1,
                      cursor: "pointer",
                      fontWeight: 500,
                      "&:hover": { backgroundColor: "rgba(255,255,255,0.3)" },
                    }}
                  >
                    {playbackRate}x
                  </Typography>
                )}

                {/* Settings (Speed) */}
                <Box sx={{ position: "relative" }}>
                  <Tooltip title="Configurações" placement="top">
                    <IconButton
                      onClick={() => {
                        setShowSpeedMenu(!showSpeedMenu);
                        setShowSettingsMenu(false);
                      }}
                      sx={{
                        color: "#fff",
                        p: 1,
                        transform: showSpeedMenu
                          ? "rotate(30deg)"
                          : "rotate(0deg)",
                        transition: "transform 0.2s",
                        "&:hover": { backgroundColor: "rgba(255,255,255,0.1)" },
                      }}
                    >
                      <SettingsIcon sx={{ fontSize: 22 }} />
                    </IconButton>
                  </Tooltip>
                  {showSpeedMenu && (
                    <Box
                      sx={{
                        position: "absolute",
                        bottom: "100%",
                        right: 0,
                        mb: 1,
                        backgroundColor: "rgba(28,28,28,0.98)",
                        borderRadius: 2,
                        overflow: "hidden",
                        minWidth: 180,
                        boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
                        backdropFilter: "blur(8px)",
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1.5,
                          px: 2,
                          py: 1.5,
                          borderBottom: "1px solid rgba(255,255,255,0.1)",
                        }}
                      >
                        <SlowMotionVideoIcon
                          sx={{ color: "#fff", fontSize: 20 }}
                        />
                        <Typography
                          sx={{
                            color: "#fff",
                            fontSize: 14,
                            fontWeight: 500,
                          }}
                        >
                          Velocidade
                        </Typography>
                      </Box>
                      {speedOptions.map((speed) => (
                        <Box
                          key={speed}
                          onClick={() => handleSpeedChange(speed)}
                          sx={{
                            px: 2,
                            py: 1,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            backgroundColor:
                              playbackRate === speed
                                ? "rgba(255,255,255,0.1)"
                                : "transparent",
                            "&:hover": {
                              backgroundColor: "rgba(255,255,255,0.15)",
                            },
                            color: "#fff",
                            fontSize: 14,
                          }}
                        >
                          <span>{speed === 1 ? "Normal" : `${speed}x`}</span>
                          {playbackRate === speed && (
                            <CheckIcon
                              sx={{ fontSize: 18, color: "#3ea6ff" }}
                            />
                          )}
                        </Box>
                      ))}
                    </Box>
                  )}
                </Box>

                {/* Mini player / PiP */}
                <Tooltip title="Miniplayer (i)" placement="top">
                  <IconButton
                    onClick={togglePiP}
                    sx={{
                      color: "#fff",
                      p: 1,
                      "&:hover": { backgroundColor: "rgba(255,255,255,0.1)" },
                    }}
                  >
                    <PictureInPictureAltIcon sx={{ fontSize: 22 }} />
                  </IconButton>
                </Tooltip>

                {/* Theater mode */}
                <Tooltip title="Modo teatro (t)" placement="top">
                  <IconButton
                    onClick={() => setIsTheaterMode(!isTheaterMode)}
                    sx={{
                      color: "#fff",
                      p: 1,
                      "&:hover": { backgroundColor: "rgba(255,255,255,0.1)" },
                    }}
                  >
                    <BrandingWatermarkIcon sx={{ fontSize: 22 }} />
                  </IconButton>
                </Tooltip>

                {/* Fullscreen */}
                <Tooltip
                  title={
                    isFullscreen ? "Sair da tela cheia (f)" : "Tela cheia (f)"
                  }
                  placement="top"
                >
                  <IconButton
                    onClick={toggleFullscreen}
                    sx={{
                      color: "#fff",
                      p: 1,
                      "&:hover": { backgroundColor: "rgba(255,255,255,0.1)" },
                    }}
                  >
                    {isFullscreen ? (
                      <FullscreenExitIcon sx={{ fontSize: 26 }} />
                    ) : (
                      <FullscreenIcon sx={{ fontSize: 26 }} />
                    )}
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
          </>
        )}
      </Box>
    </Dialog>
  );
};

export default VideoPreviewDialog;
