import {
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
  useTheme,
  Tooltip,
  CircularProgress,
  Skeleton,
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import CloudDownloadIcon from "@mui/icons-material/CloudDownload";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import SyncIcon from "@mui/icons-material/Sync";
import DeleteIcon from "@mui/icons-material/Delete";
import FolderIcon from "@mui/icons-material/Folder";
import PreviewIcon from "@mui/icons-material/Preview";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import ImageIcon from "@mui/icons-material/Image";
import TransformIcon from "@mui/icons-material/Transform";
import React from "react";

interface UploadItem {
  id: string;
  name: string;
  date: string;
  thumbnail: string;
  progress: number;
  status:
    | "uploading"
    | "downloading"
    | "converting"
    | "completed"
    | "failed"
    | "pending";
  type?: "conversion" | "download" | "torrent";
  downloadUrl?: string;
  error?: string;
}

interface UploadQueueProps {
  uploads: UploadItem[];
  onDownload: (id: string) => void;
  onOpenTorrent?: (id: string) => void;
  onRemove?: (id: string) => void;
  onPreview?: (id: string) => void;
  onConvert?: (id: string) => void;
  onRowClick?: (item: UploadItem) => void;
}

// Check if thumbnail is valid (not empty, not default)
const hasThumbnail = (thumbnail: string) => {
  return (
    thumbnail &&
    thumbnail !== "" &&
    !thumbnail.includes("modalImage.svg") &&
    thumbnail !== "/src/assets/modalImage.svg"
  );
};

export default function UploadQueue({
  uploads,
  onDownload,
  onOpenTorrent,
  onRemove,
  onPreview,
  onConvert,
  onRowClick,
}: UploadQueueProps) {
  const theme = useTheme();

  const getStatusDisplay = (item: UploadItem) => {
    if (item.type === "torrent") {
      return (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <FolderIcon fontSize="small" sx={{ color: "#FF9800" }} />
          <Typography variant="body2" sx={{ color: "#FF9800" }}>
            Torrent {item.progress.toFixed(0)}%
          </Typography>
        </Box>
      );
    }

    switch (item.status) {
      case "pending":
        return (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <CircularProgress size={16} sx={{ color: "#aaa" }} />
            <Typography variant="body2" sx={{ color: "#aaa" }}>
              Aguardando...
            </Typography>
          </Box>
        );
      case "uploading":
        return (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <CloudUploadIcon
              fontSize="small"
              sx={{ color: "#4CAF50", animation: "pulse 1.5s infinite" }}
            />
            <Typography variant="body2" sx={{ color: "#4CAF50" }}>
              Enviando {item.progress.toFixed(0)}%
            </Typography>
          </Box>
        );
      case "downloading":
        return (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <CloudDownloadIcon
              fontSize="small"
              sx={{ color: "#FF0000", animation: "pulse 1.5s infinite" }}
            />
            <Typography variant="body2" sx={{ color: "#FF0000" }}>
              Baixando {item.progress.toFixed(0)}%
            </Typography>
          </Box>
        );
      case "converting":
        return (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <SyncIcon
              fontSize="small"
              sx={{ color: "#fbc02d", animation: "spin 1s linear infinite" }}
            />
            <Typography variant="body2" sx={{ color: "#fbc02d" }}>
              Convertendo {item.progress.toFixed(0)}%
            </Typography>
          </Box>
        );
      case "completed":
        return (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <CheckCircleIcon fontSize="small" sx={{ color: "#4CAF50" }} />
            <Typography variant="body2" sx={{ color: "#4CAF50" }}>
              Concluído
            </Typography>
          </Box>
        );
      case "failed":
        return (
          <Tooltip title={item.error || "Erro desconhecido"}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <ErrorIcon fontSize="small" sx={{ color: "#f44336" }} />
              <Typography variant="body2" sx={{ color: "#f44336" }}>
                Falhou
              </Typography>
            </Box>
          </Tooltip>
        );
      default:
        return (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <CloudDownloadIcon fontSize="small" sx={{ color: "#FF0000" }} />
            <Typography variant="body2" sx={{ color: "#FF0000" }}>
              {item.progress.toFixed(0)}%
            </Typography>
          </Box>
        );
    }
  };

  // Render thumbnail with skeleton fallback
  const renderThumbnail = (item: UploadItem) => {
    const hasThumb = hasThumbnail(item.thumbnail);
    const isProcessing =
      item.status !== "completed" && item.status !== "failed";

    if (!hasThumb) {
      // Show skeleton while obtaining thumbnail
      return (
        <Box
          sx={{
            width: "100%",
            height: "100%",
            borderRadius: 1,
            background: "linear-gradient(145deg, #2a2a2a 0%, #1a1a1a 100%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 0.5,
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <ImageIcon sx={{ color: "rgba(255,255,255,0.3)", fontSize: 24 }} />
          <Typography
            variant="caption"
            sx={{
              color: "rgba(255,255,255,0.4)",
              fontSize: 9,
              textAlign: "center",
              px: 0.5,
            }}
          >
            {isProcessing ? "Obtendo miniatura..." : "Sem miniatura"}
          </Typography>
        </Box>
      );
    }

    return (
      <>
        <Box
          component="img"
          src={item.thumbnail}
          alt={item.name}
          sx={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            borderRadius: 1,
          }}
          onError={(e: any) => {
            e.target.style.display = "none";
          }}
        />
        {/* Overlay for better progress visibility */}
        {item.status !== "completed" && (
          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              borderRadius: 1,
              background: "rgba(0, 0, 0, 0.5)",
            }}
          />
        )}
      </>
    );
  };

  return (
    <Box sx={{ width: "100%", mt: 4 }}>
      <style>
        {`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>

      <Typography variant="h5" sx={{ mb: 2, fontWeight: 700, px: 1 }}>
        Fila de Processamento
      </Typography>

      <TableContainer
        component={Paper}
        sx={{
          backgroundColor: "transparent",
          backgroundImage: "none",
          boxShadow: "none",
        }}
      >
        <Table sx={{ minWidth: 650 }} aria-label="queue table">
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox color="primary" />
              </TableCell>
              <TableCell sx={{ color: "#aaa", fontSize: 13 }}>
                Arquivo
              </TableCell>
              <TableCell sx={{ color: "#aaa", fontSize: 13 }}>Tipo</TableCell>
              <TableCell sx={{ color: "#aaa", fontSize: 13 }}>Data</TableCell>
              <TableCell sx={{ color: "#aaa", fontSize: 13 }}>Status</TableCell>
              <TableCell align="right" sx={{ color: "#aaa", fontSize: 13 }}>
                Ações
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {uploads.map((row) => (
              <TableRow
                key={row.id}
                onClick={() => onRowClick?.(row)}
                sx={{
                  "&:hover": { backgroundColor: "rgba(255,255,255,0.05)" },
                  borderBottom: "1px solid #3F3F3F",
                  cursor: onRowClick ? "pointer" : "default",
                  transition: "background-color 0.15s",
                }}
              >
                <TableCell
                  padding="checkbox"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Checkbox color="primary" />
                </TableCell>

                <TableCell component="th" scope="row">
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    {/* Thumbnail with progress circle */}
                    <Box sx={{ position: "relative", width: 120, height: 68 }}>
                      {renderThumbnail(row)}
                      {row.status !== "completed" &&
                        row.status !== "failed" && (
                          <Box
                            sx={{
                              position: "absolute",
                              top: "50%",
                              left: "50%",
                              transform: "translate(-50%, -50%)",
                            }}
                          >
                            <CircularProgress
                              variant="determinate"
                              value={row.progress}
                              size={36}
                              thickness={4}
                              sx={{
                                color: "#FF0000",
                                "& .MuiCircularProgress-circle": {
                                  strokeLinecap: "round",
                                },
                              }}
                            />
                            <Box
                              sx={{
                                position: "absolute",
                                top: "50%",
                                left: "50%",
                                transform: "translate(-50%, -50%)",
                              }}
                            >
                              <Typography
                                variant="caption"
                                sx={{
                                  color: "#fff",
                                  fontWeight: 700,
                                  fontSize: 10,
                                  textShadow: "0 1px 3px rgba(0,0,0,0.8)",
                                }}
                              >
                                {row.progress.toFixed(0)}%
                              </Typography>
                            </Box>
                          </Box>
                        )}
                      {row.status === "completed" && (
                        <Box
                          sx={{
                            position: "absolute",
                            bottom: 4,
                            right: 4,
                            background: "rgba(76, 175, 80, 0.9)",
                            borderRadius: "50%",
                            width: 20,
                            height: 20,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <CheckCircleIcon
                            sx={{ fontSize: 14, color: "#fff" }}
                          />
                        </Box>
                      )}
                    </Box>
                    <Box sx={{ maxWidth: 250 }}>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 500, color: "#fff" }}
                        noWrap
                        title={row.name}
                      >
                        {row.name || (
                          <Skeleton
                            width={150}
                            sx={{ bgcolor: "rgba(255,255,255,0.1)" }}
                          />
                        )}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>

                <TableCell sx={{ color: "#fff" }}>
                  <Typography
                    variant="body2"
                    sx={{ textTransform: "capitalize" }}
                  >
                    {row.type === "download"
                      ? "Download"
                      : row.type === "torrent"
                        ? "Torrent"
                        : "Conversão"}
                  </Typography>
                </TableCell>

                <TableCell sx={{ color: "#fff" }}>
                  <Typography variant="body2">{row.date}</Typography>
                </TableCell>

                <TableCell>{getStatusDisplay(row)}</TableCell>

                <TableCell align="right">
                  {row.type === "torrent" && onOpenTorrent && (
                    <Tooltip title="Gerenciar Torrent">
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenTorrent(row.id);
                        }}
                        sx={{ color: "#FF9800" }}
                      >
                        <FolderIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}

                  {/* Preview only for conversion/download, not torrents */}
                  {onPreview &&
                    row.type !== "torrent" &&
                    row.status === "completed" && (
                      <Tooltip title="Preview">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            onPreview(row.id);
                          }}
                          sx={{ color: "#aaa" }}
                        >
                          <PreviewIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}

                  {/* Convert button - only for completed downloads */}
                  {row.type === "download" &&
                    row.status === "completed" &&
                    onConvert && (
                      <Tooltip title="Converter vídeo">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            onConvert(row.id);
                          }}
                          sx={{
                            color: "#9C27B0",
                            "&:hover": {
                              backgroundColor: "rgba(156, 39, 176, 0.1)",
                            },
                          }}
                        >
                          <TransformIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}

                  {/* Download only for conversion/download completed, not torrents */}
                  {row.status === "completed" && row.type !== "torrent" && (
                    <Tooltip title="Baixar arquivo">
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDownload(row.id);
                        }}
                        sx={{
                          color: "#FF0000",
                          backgroundColor: "rgba(255, 0, 0, 0.1)",
                          border: "1px solid rgba(255, 0, 0, 0.3)",
                          "&:hover": {
                            backgroundColor: "rgba(255, 0, 0, 0.2)",
                            transform: "scale(1.1)",
                          },
                          transition: "all 0.2s ease",
                          ml: 1,
                        }}
                      >
                        <DownloadIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}

                  {onRemove && (
                    <Tooltip title="Remover">
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemove(row.id);
                        }}
                        sx={{ color: "#aaa", "&:hover": { color: "#f44336" } }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {uploads.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                  <Typography color="text.secondary">
                    Nenhum item na fila
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
