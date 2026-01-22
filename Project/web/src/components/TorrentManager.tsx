import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Checkbox,
  Button,
  LinearProgress,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import FolderIcon from "@mui/icons-material/Folder";
import VideoFileIcon from "@mui/icons-material/VideoFile";
import AudioFileIcon from "@mui/icons-material/AudioFile";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import DownloadIcon from "@mui/icons-material/Download";
import PauseIcon from "@mui/icons-material/Pause";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import DeleteIcon from "@mui/icons-material/Delete";
import PreviewIcon from "@mui/icons-material/Preview";
import SpeedIcon from "@mui/icons-material/Speed";
import PeopleIcon from "@mui/icons-material/People";
import { useTorrent, useJobStatus } from "../hooks/useApi";
import { TorrentStatus, TorrentFile } from "../services/api";
import HLSPlayer from "./HLSPlayer";
import { streamService } from "../services/api";

interface TorrentManagerProps {
  open: boolean;
  onClose: () => void;
  jobId: string;
  onComplete?: (files: string[]) => void;
}

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const formatSpeed = (bytesPerSec: number): string => {
  return formatBytes(bytesPerSec) + "/s";
};

const getFileIcon = (filename: string) => {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  const videoExts = ["mp4", "mkv", "avi", "mov", "webm", "flv", "wmv"];
  const audioExts = ["mp3", "flac", "wav", "aac", "ogg", "m4a"];

  if (videoExts.includes(ext))
    return <VideoFileIcon sx={{ color: "#FF0000" }} />;
  if (audioExts.includes(ext))
    return <AudioFileIcon sx={{ color: "#4CAF50" }} />;
  return <InsertDriveFileIcon sx={{ color: "#9E9E9E" }} />;
};

const TorrentManager: React.FC<TorrentManagerProps> = ({
  open,
  onClose,
  jobId,
  onComplete,
}) => {
  const { status, loading } = useJobStatus(jobId, "torrent", 1000) as {
    status: TorrentStatus | null;
    loading: boolean;
  };
  const { selectFiles, pause, resume, remove } = useTorrent();

  const [selectedFiles, setSelectedFiles] = useState<number[]>([]);
  const [convertProfile, setConvertProfile] = useState<string>("");
  const [previewFile, setPreviewFile] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Auto-select all files initially
  useEffect(() => {
    if (status?.files && selectedFiles.length === 0) {
      setSelectedFiles(status.files.map((f) => f.index));
    }
  }, [status?.files]);

  const handleToggleFile = (index: number) => {
    setSelectedFiles((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index],
    );
  };

  const handleToggleAll = () => {
    if (!status?.files) return;
    if (selectedFiles.length === status.files.length) {
      setSelectedFiles([]);
    } else {
      setSelectedFiles(status.files.map((f) => f.index));
    }
  };

  const handleApplySelection = async () => {
    try {
      await selectFiles(jobId, selectedFiles, convertProfile || undefined);
    } catch (err) {
      console.error("Failed to select files:", err);
    }
  };

  const handlePause = async () => {
    try {
      await pause(jobId);
    } catch (err) {
      console.error("Failed to pause:", err);
    }
  };

  const handleResume = async () => {
    try {
      await resume(jobId);
    } catch (err) {
      console.error("Failed to resume:", err);
    }
  };

  const handleRemove = async () => {
    try {
      await remove(jobId, false);
      onClose();
    } catch (err) {
      console.error("Failed to remove:", err);
    }
  };

  const handlePreview = async (file: TorrentFile) => {
    // This would require the file to be partially downloaded
    // For now, show a message or implement preview logic
    setPreviewFile(file.name);

    // In a real implementation, you would:
    // 1. Check if enough of the file is downloaded
    // 2. Generate a preview stream
    // 3. Set the preview URL
  };

  const getStatusColor = (s: string) => {
    switch (s) {
      case "completed":
        return "success";
      case "downloading":
        return "primary";
      case "paused":
        return "warning";
      case "failed":
        return "error";
      default:
        return "default";
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: "#181A20",
            backgroundImage: "none",
            minHeight: "70vh",
          },
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <FolderIcon sx={{ color: "#FF0000" }} />
            <Box>
              <Typography variant="h6" sx={{ color: "#fff" }}>
                {status?.name || "Carregando..."}
              </Typography>
              <Box sx={{ display: "flex", gap: 1, mt: 0.5 }}>
                <Chip
                  size="small"
                  label={status?.status || "pending"}
                  color={getStatusColor(status?.status || "") as any}
                />
                {status && (
                  <>
                    <Chip
                      size="small"
                      icon={<SpeedIcon sx={{ fontSize: 16 }} />}
                      label={formatSpeed(status.download_rate)}
                      variant="outlined"
                      sx={{ color: "#4CAF50", borderColor: "#4CAF50" }}
                    />
                    <Chip
                      size="small"
                      icon={<PeopleIcon sx={{ fontSize: 16 }} />}
                      label={`${status.num_seeds} seeds / ${status.num_peers} peers`}
                      variant="outlined"
                      sx={{ color: "#2196F3", borderColor: "#2196F3" }}
                    />
                  </>
                )}
              </Box>
            </Box>
          </Box>
          <IconButton onClick={onClose} sx={{ color: "#fff" }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 3 }}>
          {/* Progress */}
          {status && (
            <Box sx={{ mb: 3 }}>
              <Box
                sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}
              >
                <Typography variant="body2" color="text.secondary">
                  Progresso geral
                </Typography>
                <Typography variant="body2" sx={{ color: "#FF0000" }}>
                  {status.progress.toFixed(1)}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={status.progress}
                sx={{
                  height: 8,
                  borderRadius: 1,
                  backgroundColor: "rgba(255,255,255,0.1)",
                  "& .MuiLinearProgress-bar": {
                    backgroundColor: "#FF0000",
                  },
                }}
              />
            </Box>
          )}

          {/* Actions */}
          <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
            {status?.status === "downloading" ? (
              <Button
                variant="outlined"
                startIcon={<PauseIcon />}
                onClick={handlePause}
                sx={{ color: "#FFC107", borderColor: "#FFC107" }}
              >
                Pausar
              </Button>
            ) : status?.status === "paused" ? (
              <Button
                variant="contained"
                startIcon={<PlayArrowIcon />}
                onClick={handleResume}
                sx={{ backgroundColor: "#4CAF50" }}
              >
                Retomar
              </Button>
            ) : null}

            <Button
              variant="outlined"
              startIcon={<DeleteIcon />}
              onClick={handleRemove}
              sx={{ color: "#f44336", borderColor: "#f44336" }}
            >
              Remover
            </Button>

            <Box sx={{ flex: 1 }} />

            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel sx={{ color: "rgba(255,255,255,0.7)" }}>
                Converter para
              </InputLabel>
              <Select
                value={convertProfile}
                onChange={(e) => setConvertProfile(e.target.value)}
                label="Converter para"
                sx={{
                  color: "#fff",
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: "rgba(255,255,255,0.2)",
                  },
                }}
              >
                <MenuItem value="">Manter original</MenuItem>
                <MenuItem value="youtube_hd">YouTube HD (MP4)</MenuItem>
                <MenuItem value="audio_mp3">Áudio MP3</MenuItem>
                <MenuItem value="webm">WebM (VP9)</MenuItem>
              </Select>
            </FormControl>

            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={handleApplySelection}
              disabled={selectedFiles.length === 0}
              sx={{
                backgroundColor: "#FF0000",
                "&:hover": { backgroundColor: "#cc0000" },
              }}
            >
              Aplicar seleção
            </Button>
          </Box>

          {/* File list */}
          <TableContainer
            component={Paper}
            sx={{
              backgroundColor: "transparent",
              backgroundImage: "none",
            }}
          >
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={
                        status?.files?.length === selectedFiles.length &&
                        selectedFiles.length > 0
                      }
                      indeterminate={
                        selectedFiles.length > 0 &&
                        selectedFiles.length < (status?.files?.length || 0)
                      }
                      onChange={handleToggleAll}
                      sx={{ color: "rgba(255,255,255,0.5)" }}
                    />
                  </TableCell>
                  <TableCell sx={{ color: "#aaa" }}>Arquivo</TableCell>
                  <TableCell sx={{ color: "#aaa" }} align="right">
                    Tamanho
                  </TableCell>
                  <TableCell sx={{ color: "#aaa" }} align="center">
                    Progresso
                  </TableCell>
                  <TableCell sx={{ color: "#aaa" }} align="center">
                    Ações
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {status?.files?.map((file) => (
                  <TableRow
                    key={file.index}
                    sx={{
                      "&:hover": {
                        backgroundColor: "rgba(255,255,255,0.05)",
                      },
                    }}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedFiles.includes(file.index)}
                        onChange={() => handleToggleFile(file.index)}
                        sx={{
                          color: "rgba(255,255,255,0.5)",
                          "&.Mui-checked": { color: "#FF0000" },
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1.5 }}
                      >
                        {getFileIcon(file.name)}
                        <Typography
                          variant="body2"
                          sx={{
                            color: "#fff",
                            maxWidth: 400,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                          title={file.name}
                        >
                          {file.name}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" sx={{ color: "#aaa" }}>
                        {formatBytes(file.size)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center" sx={{ width: 150 }}>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <LinearProgress
                          variant="determinate"
                          value={file.progress}
                          sx={{
                            flex: 1,
                            height: 6,
                            borderRadius: 1,
                            backgroundColor: "rgba(255,255,255,0.1)",
                            "& .MuiLinearProgress-bar": {
                              backgroundColor:
                                file.progress === 100 ? "#4CAF50" : "#FF0000",
                            },
                          }}
                        />
                        <Typography
                          variant="caption"
                          sx={{ color: "#aaa", minWidth: 40 }}
                        >
                          {file.progress.toFixed(0)}%
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Preview">
                        <IconButton
                          size="small"
                          onClick={() => handlePreview(file)}
                          disabled={file.progress < 5}
                          sx={{ color: "#aaa" }}
                        >
                          <PreviewIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
                {(!status?.files || status.files.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">
                        {loading
                          ? "Carregando metadados..."
                          : "Nenhum arquivo encontrado"}
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
      </Dialog>

      {/* Preview dialog */}
      {previewUrl && (
        <Dialog
          open={!!previewUrl}
          onClose={() => {
            setPreviewUrl(null);
            setPreviewFile(null);
          }}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              backgroundColor: "#000",
              backgroundImage: "none",
            },
          }}
        >
          <HLSPlayer
            src={previewUrl}
            title={previewFile || undefined}
            onClose={() => {
              setPreviewUrl(null);
              setPreviewFile(null);
            }}
            autoPlay
          />
        </Dialog>
      )}
    </>
  );
};

export default TorrentManager;
