import React from "react";
import {
  Box,
  Paper,
  Typography,
  LinearProgress,
  IconButton,
  Chip,
  Tooltip,
} from "@mui/material";
import {
  Download as DownloadIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  CloudDownload as CloudIcon,
  VideoFile as VideoIcon,
  Link as LinkIcon,
} from "@mui/icons-material";
import { QueueItem } from "../hooks/useQueue";

interface QueueListProps {
  items: QueueItem[];
  onRemove: (id: string) => void;
  getDownloadUrl: (id: string) => string;
}

const statusLabels: Record<string, string> = {
  queued: "Na fila",
  uploading: "Enviando",
  downloading: "Baixando",
  converting: "Convertendo",
  completed: "Pronto",
  failed: "Erro",
};

const statusColors: Record<
  string,
  "default" | "primary" | "secondary" | "success" | "error" | "info" | "warning"
> = {
  queued: "default",
  uploading: "info",
  downloading: "primary",
  converting: "secondary",
  completed: "success",
  failed: "error",
};

const TypeIcon: React.FC<{ type: string }> = ({ type }) => {
  switch (type) {
    case "url":
      return <LinkIcon sx={{ color: "#FF0000" }} />;
    case "torrent":
      return <CloudIcon sx={{ color: "#FF0000" }} />;
    default:
      return <VideoIcon sx={{ color: "#FF0000" }} />;
  }
};

export const QueueList: React.FC<QueueListProps> = ({
  items,
  onRemove,
  getDownloadUrl,
}) => {
  if (items.length === 0) {
    return (
      <Box sx={{ textAlign: "center", py: 4, color: "text.secondary" }}>
        <Typography>Nenhum item na fila</Typography>
        <Typography variant="body2" sx={{ mt: 1 }}>
          Envie um arquivo ou cole uma URL para começar
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      {items.map((item) => (
        <Paper
          key={item.id}
          elevation={2}
          sx={{
            p: 2,
            backgroundColor: "rgba(255,255,255,0.05)",
            borderRadius: 2,
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            {/* Icon */}
            <TypeIcon type={item.type} />

            {/* Info */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="body1"
                sx={{
                  fontWeight: 500,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {item.fileName}
              </Typography>

              {/* Progress bar */}
              {["uploading", "downloading", "converting"].includes(
                item.status,
              ) && (
                <Box sx={{ mt: 1 }}>
                  <LinearProgress
                    variant="determinate"
                    value={item.progress}
                    sx={{
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: "rgba(255,0,0,0.2)",
                      "& .MuiLinearProgress-bar": {
                        backgroundColor: "#FF0000",
                        borderRadius: 3,
                      },
                    }}
                  />
                  <Typography
                    variant="caption"
                    sx={{ color: "text.secondary" }}
                  >
                    {item.progress}%
                    {item.metadata?.download_speed && (
                      <> • {formatSpeed(item.metadata.download_speed)}</>
                    )}
                  </Typography>
                </Box>
              )}

              {/* Error message */}
              {item.error && (
                <Typography
                  variant="caption"
                  color="error"
                  sx={{ display: "block", mt: 0.5 }}
                >
                  {item.error}
                </Typography>
              )}
            </Box>

            {/* Status chip */}
            <Chip
              label={statusLabels[item.status] || item.status}
              color={statusColors[item.status] || "default"}
              size="small"
              icon={
                item.status === "completed" ? (
                  <CheckIcon />
                ) : item.status === "failed" ? (
                  <ErrorIcon />
                ) : undefined
              }
            />

            {/* Actions */}
            <Box sx={{ display: "flex", gap: 0.5 }}>
              {item.status === "completed" && (
                <Tooltip title="Download">
                  <IconButton
                    component="a"
                    href={getDownloadUrl(item.id)}
                    download
                    sx={{
                      color: "#FF0000",
                      backgroundColor: "rgba(255,0,0,0.1)",
                      "&:hover": {
                        backgroundColor: "rgba(255,0,0,0.2)",
                      },
                    }}
                  >
                    <DownloadIcon />
                  </IconButton>
                </Tooltip>
              )}

              {["completed", "failed"].includes(item.status) && (
                <Tooltip title="Remover">
                  <IconButton
                    onClick={() => onRemove(item.id)}
                    sx={{ color: "text.secondary" }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          </Box>
        </Paper>
      ))}
    </Box>
  );
};

function formatSpeed(bytesPerSecond: number): string {
  if (bytesPerSecond < 1024) {
    return `${bytesPerSecond} B/s`;
  } else if (bytesPerSecond < 1024 * 1024) {
    return `${(bytesPerSecond / 1024).toFixed(1)} KB/s`;
  } else {
    return `${(bytesPerSecond / (1024 * 1024)).toFixed(1)} MB/s`;
  }
}

export default QueueList;
