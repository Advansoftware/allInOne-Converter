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
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import CloudSyncOutlinedIcon from "@mui/icons-material/CloudSyncOutlined";
import DeleteIcon from "@mui/icons-material/Delete";
import FolderIcon from "@mui/icons-material/Folder";
import PreviewIcon from "@mui/icons-material/Preview";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import React from "react";

interface UploadItem {
  id: string;
  name: string;
  date: string;
  thumbnail: string;
  progress: number;
  status: "enviando" | "convertendo" | "pronto" | "torrent";
  type?: "conversion" | "download" | "torrent";
  downloadUrl?: string;
}

interface UploadQueueProps {
  uploads: UploadItem[];
  onDownload: (id: string) => void;
  onOpenTorrent?: (id: string) => void;
  onRemove?: (id: string) => void;
  onPreview?: (id: string) => void;
}

export default function UploadQueue({
  uploads,
  onDownload,
  onOpenTorrent,
  onRemove,
  onPreview,
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
      case "enviando":
        return (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <CloudSyncOutlinedIcon
              fontSize="small"
              sx={{ color: theme.palette.primary.main }}
            />
            <Typography variant="body2">{item.progress}%</Typography>
          </Box>
        );
      case "convertendo":
        return (
          <Typography sx={{ color: "#fbc02d" }}>
            Processando {item.progress}%
          </Typography>
        );
      case "pronto":
        return <Typography sx={{ color: "#4CAF50" }}>Concluído</Typography>;
      default:
        return null;
    }
  };

  return (
    <Box sx={{ width: "100%", mt: 4 }}>
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
                sx={{
                  "&:hover": { backgroundColor: "rgba(255,255,255,0.05)" },
                  borderBottom: "1px solid #3F3F3F",
                }}
              >
                <TableCell padding="checkbox">
                  <Checkbox color="primary" />
                </TableCell>

                <TableCell component="th" scope="row">
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    {/* Thumbnail with progress circle */}
                    <Box sx={{ position: "relative", width: 120, height: 68 }}>
                      <Box
                        component="img"
                        src={row.thumbnail}
                        alt={row.name}
                        sx={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          borderRadius: 1,
                          opacity: row.status === "pronto" ? 1 : 0.7,
                        }}
                        onError={(e: any) => {
                          e.target.src = "/src/assets/modalImage.svg";
                        }}
                      />
                      {row.status !== "pronto" && (
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
                              }}
                            >
                              {row.progress.toFixed(0)}%
                            </Typography>
                          </Box>
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
                        {row.name}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>

                <TableCell sx={{ color: "#fff" }}>
                  <Typography
                    variant="body2"
                    sx={{ textTransform: "capitalize" }}
                  >
                    {row.type || "conversão"}
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
                        onClick={() => onOpenTorrent(row.id)}
                        sx={{ color: "#FF9800" }}
                      >
                        <FolderIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}

                  {onPreview && (
                    <Tooltip title="Preview">
                      <IconButton
                        size="small"
                        onClick={() => onPreview(row.id)}
                        sx={{ color: "#aaa" }}
                      >
                        <PreviewIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}

                  {row.status === "pronto" && (
                    <Tooltip title="Baixar arquivo convertido">
                      <IconButton
                        size="small"
                        onClick={() => onDownload(row.id)}
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
                        onClick={() => onRemove(row.id)}
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
