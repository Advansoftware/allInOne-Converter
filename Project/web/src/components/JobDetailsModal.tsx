import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  IconButton,
  Divider,
  Chip,
  LinearProgress,
  Paper,
  Grid,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import DownloadIcon from "@mui/icons-material/Download";
import PreviewIcon from "@mui/icons-material/Preview";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import CloudDownloadIcon from "@mui/icons-material/CloudDownload";
import SyncIcon from "@mui/icons-material/Sync";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import ImageIcon from "@mui/icons-material/Image";

export interface JobDetails {
  id: string;
  name: string;
  date: string;
  thumbnail: string;
  progress: number;
  status: "downloading" | "converting" | "completed" | "failed" | "pending";
  type?: "conversion" | "download" | "torrent";
  downloadUrl?: string;
  error?: string;
  // Extended details from API
  duration?: string;
  format?: string;
  resolution?: string;
  fileSize?: string;
  createdAt?: string;
  completedAt?: string;
  sourceUrl?: string;
}

interface JobDetailsModalProps {
  open: boolean;
  onClose: () => void;
  job: JobDetails | null;
  onDownload?: (id: string) => void;
  onPreview?: (id: string) => void;
}

const statusConfig = {
  pending: {
    label: "Aguardando",
    color: "#888",
    icon: <HourglassEmptyIcon />,
  },
  downloading: {
    label: "Baixando",
    color: "#FF0000",
    icon: <CloudDownloadIcon />,
  },
  converting: {
    label: "Convertendo",
    color: "#9C27B0",
    icon: <SyncIcon />,
  },
  completed: {
    label: "Concluído",
    color: "#4CAF50",
    icon: <CheckCircleIcon />,
  },
  failed: {
    label: "Falhou",
    color: "#f44336",
    icon: <ErrorIcon />,
  },
};

const typeLabels: Record<string, string> = {
  conversion: "Conversão",
  download: "Download",
  torrent: "Torrent",
};

const formatBytes = (bytes: number): string => {
  if (!bytes || bytes === 0) return "—";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const JobDetailsModal: React.FC<JobDetailsModalProps> = ({
  open,
  onClose,
  job,
  onDownload,
  onPreview,
}) => {
  if (!job) return null;

  const status = statusConfig[job.status] || statusConfig.pending;
  const isComplete = job.status === "completed";
  const hasFailed = job.status === "failed";
  const isProcessing = ["downloading", "converting"].includes(job.status);

  const handleCopyId = () => {
    navigator.clipboard.writeText(job.id);
  };

  const handleCopyError = () => {
    if (job.error) {
      navigator.clipboard.writeText(job.error);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: "#1a1a1a",
          backgroundImage: "none",
          borderRadius: 2,
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid rgba(255,255,255,0.1)",
          pb: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Detalhes do Job
          </Typography>
          <Chip
            icon={status.icon}
            label={status.label}
            size="small"
            sx={{
              backgroundColor: `${status.color}20`,
              color: status.color,
              "& .MuiChip-icon": { color: status.color },
            }}
          />
        </Box>
        <IconButton onClick={onClose} sx={{ color: "rgba(255,255,255,0.7)" }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ py: 3 }}>
        {/* Thumbnail and Basic Info */}
        <Box sx={{ display: "flex", gap: 3, mb: 3 }}>
          {/* Thumbnail */}
          <Box
            sx={{
              width: 200,
              height: 112,
              borderRadius: 1,
              overflow: "hidden",
              flexShrink: 0,
              backgroundColor: "#2a2a2a",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {job.thumbnail ? (
              <img
                src={job.thumbnail}
                alt={job.name}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            ) : (
              <ImageIcon sx={{ fontSize: 48, color: "#555" }} />
            )}
          </Box>

          {/* Basic Info */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 500,
                mb: 1,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {job.name || "Sem nome"}
            </Typography>

            <Box sx={{ display: "flex", gap: 1, mb: 2, flexWrap: "wrap" }}>
              <Chip
                label={typeLabels[job.type || "download"] || job.type}
                size="small"
                variant="outlined"
                sx={{ borderColor: "rgba(255,255,255,0.3)" }}
              />
              {job.format && (
                <Chip
                  label={job.format.toUpperCase()}
                  size="small"
                  variant="outlined"
                  sx={{ borderColor: "#FF0000", color: "#FF0000" }}
                />
              )}
              {job.resolution && (
                <Chip
                  label={job.resolution}
                  size="small"
                  variant="outlined"
                  sx={{ borderColor: "#2196F3", color: "#2196F3" }}
                />
              )}
            </Box>

            {/* Progress */}
            {isProcessing && (
              <Box>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 0.5,
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    Progresso
                  </Typography>
                  <Typography variant="body2" sx={{ color: status.color }}>
                    {job.progress.toFixed(1)}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={job.progress}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: "rgba(255,255,255,0.1)",
                    "& .MuiLinearProgress-bar": {
                      backgroundColor: status.color,
                      borderRadius: 4,
                    },
                  }}
                />
              </Box>
            )}
          </Box>
        </Box>

        <Divider sx={{ borderColor: "rgba(255,255,255,0.1)", my: 2 }} />

        {/* Details Grid */}
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <DetailItem
              label="Job ID"
              value={job.id}
              copyable
              onCopy={handleCopyId}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <DetailItem
              label="Tipo"
              value={typeLabels[job.type || "download"] || job.type || "—"}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <DetailItem label="Data" value={job.date || "—"} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <DetailItem
              label="Status"
              value={status.label}
              color={status.color}
            />
          </Grid>
          {job.duration && (
            <Grid item xs={12} sm={6}>
              <DetailItem label="Duração" value={job.duration} />
            </Grid>
          )}
          {job.fileSize && (
            <Grid item xs={12} sm={6}>
              <DetailItem label="Tamanho" value={job.fileSize} />
            </Grid>
          )}
          {job.sourceUrl && (
            <Grid item xs={12}>
              <DetailItem
                label="URL de Origem"
                value={job.sourceUrl}
                copyable
              />
            </Grid>
          )}
          {job.downloadUrl && (
            <Grid item xs={12}>
              <DetailItem
                label="Caminho do Arquivo"
                value={job.downloadUrl}
                copyable
              />
            </Grid>
          )}
        </Grid>

        {/* Error Section */}
        {hasFailed && job.error && (
          <Paper
            sx={{
              mt: 3,
              p: 2,
              backgroundColor: "rgba(244, 67, 54, 0.1)",
              border: "1px solid rgba(244, 67, 54, 0.3)",
              borderRadius: 1,
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: 2,
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 1.5,
                  flex: 1,
                }}
              >
                <ErrorIcon sx={{ color: "#f44336", mt: 0.3 }} />
                <Box>
                  <Typography
                    variant="subtitle2"
                    sx={{ color: "#f44336", fontWeight: 600, mb: 0.5 }}
                  >
                    Motivo do Erro
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: "rgba(255,255,255,0.8)",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                      fontFamily: "monospace",
                      fontSize: "0.85rem",
                    }}
                  >
                    {job.error}
                  </Typography>
                </Box>
              </Box>
              <IconButton
                size="small"
                onClick={handleCopyError}
                sx={{ color: "rgba(255,255,255,0.5)" }}
              >
                <ContentCopyIcon fontSize="small" />
              </IconButton>
            </Box>
          </Paper>
        )}
      </DialogContent>

      <DialogActions
        sx={{
          borderTop: "1px solid rgba(255,255,255,0.1)",
          px: 3,
          py: 2,
          gap: 1,
        }}
      >
        <Button onClick={onClose} sx={{ color: "rgba(255,255,255,0.7)" }}>
          Fechar
        </Button>

        {onPreview && (
          <Button
            variant="outlined"
            startIcon={<PreviewIcon />}
            onClick={() => {
              onPreview(job.id);
              onClose();
            }}
            sx={{
              borderColor: "rgba(255,255,255,0.3)",
              color: "#fff",
              "&:hover": { borderColor: "#fff" },
            }}
          >
            Preview
          </Button>
        )}

        {isComplete && onDownload && (
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={() => {
              onDownload(job.id);
              onClose();
            }}
            sx={{
              backgroundColor: "#FF0000",
              "&:hover": { backgroundColor: "#cc0000" },
            }}
          >
            Download
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

// Helper component for detail items
interface DetailItemProps {
  label: string;
  value: string;
  copyable?: boolean;
  onCopy?: () => void;
  color?: string;
}

const DetailItem: React.FC<DetailItemProps> = ({
  label,
  value,
  copyable,
  onCopy,
  color,
}) => {
  const handleCopy = () => {
    if (onCopy) {
      onCopy();
    } else {
      navigator.clipboard.writeText(value);
    }
  };

  return (
    <Paper
      sx={{
        p: 1.5,
        backgroundColor: "rgba(255,255,255,0.05)",
        borderRadius: 1,
      }}
    >
      <Typography
        variant="caption"
        sx={{ color: "rgba(255,255,255,0.5)", display: "block", mb: 0.5 }}
      >
        {label}
      </Typography>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Typography
          variant="body2"
          sx={{
            color: color || "#fff",
            fontWeight: 500,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            flex: 1,
          }}
        >
          {value}
        </Typography>
        {copyable && (
          <IconButton
            size="small"
            onClick={handleCopy}
            sx={{ color: "rgba(255,255,255,0.3)", p: 0.5 }}
          >
            <ContentCopyIcon sx={{ fontSize: 14 }} />
          </IconButton>
        )}
      </Box>
    </Paper>
  );
};

export default JobDetailsModal;
