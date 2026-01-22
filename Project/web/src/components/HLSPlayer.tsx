import React, { useEffect, useRef, useState } from "react";
import {
  Box,
  IconButton,
  Slider,
  Typography,
  CircularProgress,
} from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import VolumeOffIcon from "@mui/icons-material/VolumeOff";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import CloseIcon from "@mui/icons-material/Close";

interface HLSPlayerProps {
  src: string;
  poster?: string;
  autoPlay?: boolean;
  onClose?: () => void;
  title?: string;
}

const HLSPlayer: React.FC<HLSPlayerProps> = ({
  src,
  poster,
  autoPlay = false,
  onClose,
  title,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(autoPlay);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showControls, setShowControls] = useState(true);
  const hideControlsTimeout = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const loadHls = async () => {
      // Check if HLS is natively supported
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = src;
      } else {
        // Dynamically import HLS.js
        try {
          const Hls = (await import("hls.js")).default;
          if (Hls.isSupported()) {
            const hls = new Hls({
              enableWorker: true,
              lowLatencyMode: true,
            });
            hls.loadSource(src);
            hls.attachMedia(video);
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
              setLoading(false);
              if (autoPlay) {
                video.play().catch(() => {});
              }
            });
            hls.on(
              Hls.Events.ERROR,
              (_event: string, data: { fatal: boolean }) => {
                if (data.fatal) {
                  setError("Erro ao carregar vídeo");
                  setLoading(false);
                }
              },
            );
          } else {
            setError("HLS não suportado neste navegador");
            setLoading(false);
          }
        } catch (err) {
          // Fallback: try direct source
          video.src = src;
        }
      }
    };

    loadHls();

    // Event listeners
    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      setLoading(false);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };

    const handlePlay = () => setPlaying(true);
    const handlePause = () => setPlaying(false);
    const handleWaiting = () => setLoading(true);
    const handleCanPlay = () => setLoading(false);
    const handleError = () => {
      setError("Erro ao reproduzir vídeo");
      setLoading(false);
    };

    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);
    video.addEventListener("waiting", handleWaiting);
    video.addEventListener("canplay", handleCanPlay);
    video.addEventListener("error", handleError);

    return () => {
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("waiting", handleWaiting);
      video.removeEventListener("canplay", handleCanPlay);
      video.removeEventListener("error", handleError);
    };
  }, [src, autoPlay]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (playing) {
      video.pause();
    } else {
      video.play().catch(() => {});
    }
  };

  const handleSeek = (_: Event, value: number | number[]) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = value as number;
  };

  const handleVolumeChange = (_: Event, value: number | number[]) => {
    const video = videoRef.current;
    if (!video) return;
    const vol = value as number;
    video.volume = vol;
    setVolume(vol);
    setMuted(vol === 0);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !muted;
    setMuted(!muted);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      containerRef.current.requestFullscreen();
    }
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (hideControlsTimeout.current) {
      clearTimeout(hideControlsTimeout.current);
    }
    hideControlsTimeout.current = setTimeout(() => {
      if (playing) {
        setShowControls(false);
      }
    }, 3000);
  };

  return (
    <Box
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => playing && setShowControls(false)}
      sx={{
        position: "relative",
        width: "100%",
        maxWidth: "100%",
        aspectRatio: "16/9",
        backgroundColor: "#000",
        borderRadius: 2,
        overflow: "hidden",
        cursor: showControls ? "default" : "none",
      }}
    >
      <video
        ref={videoRef}
        poster={poster}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
        }}
        onClick={togglePlay}
        playsInline
      />

      {/* Loading overlay */}
      {loading && (
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
          }}
        >
          <CircularProgress sx={{ color: "#FF0000" }} />
        </Box>
      )}

      {/* Error overlay */}
      {error && (
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            textAlign: "center",
          }}
        >
          <Typography color="error">{error}</Typography>
        </Box>
      )}

      {/* Controls */}
      <Box
        sx={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          background: "linear-gradient(transparent, rgba(0,0,0,0.8))",
          p: 2,
          opacity: showControls ? 1 : 0,
          transition: "opacity 0.3s ease",
        }}
      >
        {/* Title */}
        {title && (
          <Typography
            variant="subtitle1"
            sx={{ color: "#fff", mb: 1, fontWeight: 500 }}
          >
            {title}
          </Typography>
        )}

        {/* Progress bar */}
        <Slider
          value={currentTime}
          min={0}
          max={duration || 100}
          onChange={handleSeek}
          sx={{
            color: "#FF0000",
            height: 4,
            "& .MuiSlider-thumb": {
              width: 12,
              height: 12,
              transition: "0.2s",
              "&:hover": {
                boxShadow: "0 0 0 8px rgba(255, 0, 0, 0.16)",
              },
            },
            "& .MuiSlider-rail": {
              backgroundColor: "rgba(255,255,255,0.3)",
            },
          }}
        />

        {/* Controls row */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mt: 1,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <IconButton onClick={togglePlay} sx={{ color: "#fff" }}>
              {playing ? <PauseIcon /> : <PlayArrowIcon />}
            </IconButton>

            <IconButton onClick={toggleMute} sx={{ color: "#fff" }}>
              {muted ? <VolumeOffIcon /> : <VolumeUpIcon />}
            </IconButton>

            <Slider
              value={muted ? 0 : volume}
              min={0}
              max={1}
              step={0.1}
              onChange={handleVolumeChange}
              sx={{
                width: 80,
                color: "#fff",
                "& .MuiSlider-thumb": {
                  width: 12,
                  height: 12,
                },
              }}
            />

            <Typography variant="body2" sx={{ color: "#fff", ml: 2 }}>
              {formatTime(currentTime)} / {formatTime(duration)}
            </Typography>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <IconButton onClick={toggleFullscreen} sx={{ color: "#fff" }}>
              <FullscreenIcon />
            </IconButton>

            {onClose && (
              <IconButton onClick={onClose} sx={{ color: "#fff" }}>
                <CloseIcon />
              </IconButton>
            )}
          </Box>
        </Box>
      </Box>

      {/* Play button overlay */}
      {!playing && !loading && !error && (
        <Box
          onClick={togglePlay}
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 72,
            height: 72,
            borderRadius: "50%",
            backgroundColor: "rgba(255, 0, 0, 0.9)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            transition: "transform 0.2s, background-color 0.2s",
            "&:hover": {
              transform: "translate(-50%, -50%) scale(1.1)",
              backgroundColor: "#FF0000",
            },
          }}
        >
          <PlayArrowIcon sx={{ fontSize: 40, color: "#fff", ml: 0.5 }} />
        </Box>
      )}
    </Box>
  );
};

export default HLSPlayer;
