import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Button,
  LinearProgress,
  Chip,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Checkbox,
  Select,
  InputLabel,
  FormControl,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";
import DeleteIcon from "@mui/icons-material/Delete";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import FolderIcon from "@mui/icons-material/Folder";
import CloudDownloadIcon from "@mui/icons-material/CloudDownload";
import DownloadIcon from "@mui/icons-material/Download";
import SpeedIcon from "@mui/icons-material/Speed";
import PeopleIcon from "@mui/icons-material/People";
import RefreshIcon from "@mui/icons-material/Refresh";
import LinkIcon from "@mui/icons-material/Link";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import VideoFileIcon from "@mui/icons-material/VideoFile";
import AudioFileIcon from "@mui/icons-material/AudioFile";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import PreviewIcon from "@mui/icons-material/Preview";
import TransformIcon from "@mui/icons-material/Transform";
import { useDropzone } from "react-dropzone";
import { torrentService, TorrentFile } from "../services/api";
import VideoPreviewDialog from "../components/VideoPreviewDialog";
import websocketService from "../services/websocket";

interface TorrentJob {
  job_id: string;
  name: string;
  status: string;
  progress: number;
  download_rate?: number;
  upload_rate?: number;
  num_peers?: number;
  num_seeds?: number;
  files?: TorrentFile[];
  error?: string;
}

const formatBytes = (bytes: number): string => {
  if (!bytes || bytes === 0) return "0 B";
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
  const videoExts = ["mp4", "mkv", "avi", "mov", "webm", "flv", "wmv", "m4v"];
  const audioExts = ["mp3", "flac", "wav", "aac", "ogg", "m4a", "wma"];

  if (videoExts.includes(ext))
    return <VideoFileIcon sx={{ color: "#FF0000" }} />;
  if (audioExts.includes(ext))
    return <AudioFileIcon sx={{ color: "#4CAF50" }} />;
  return <InsertDriveFileIcon sx={{ color: "#9E9E9E" }} />;
};

const isMediaFile = (filename: string): boolean => {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  const mediaExts = [
    "mp4",
    "mkv",
    "avi",
    "mov",
    "webm",
    "flv",
    "wmv",
    "m4v",
    "mp3",
    "flac",
    "wav",
    "aac",
    "ogg",
    "m4a",
    "wma",
  ];
  return mediaExts.includes(ext);
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "downloading":
      return "info";
    case "completed":
      return "success";
    case "paused":
      return "warning";
    case "failed":
      return "error";
    case "metadata":
      return "secondary";
    case "waiting_selection":
      return "warning";
    case "converting":
      return "info";
    default:
      return "default";
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case "downloading":
      return "Baixando";
    case "completed":
      return "Concluído";
    case "paused":
      return "Pausado";
    case "failed":
      return "Falhou";
    case "metadata":
      return "Obtendo metadados...";
    case "checking":
      return "Verificando...";
    case "allocating":
      return "Alocando...";
    case "waiting_selection":
      return "Aguardando seleção";
    case "converting":
      return "Convertendo...";
    default:
      return status;
  }
};

const TorrentsPage: React.FC = () => {
  const [torrents, setTorrents] = useState<TorrentJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedTorrent, setSelectedTorrent] = useState<TorrentJob | null>(
    null,
  );
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuTorrent, setMenuTorrent] = useState<TorrentJob | null>(null);
  const [previewJob, setPreviewJob] = useState<{
    id: string;
    name: string;
    fileIndex: number;
  } | null>(null);
  const torrentsRef = useRef<TorrentJob[]>([]);

  const apiBaseUrl = import.meta.env.VITE_API_URL || "http://localhost:8080";

  // Load initial torrents data
  const loadTorrents = useCallback(async () => {
    try {
      const response = await torrentService.list();
      const torrentList = response.data.torrents || [];

      // Get detailed status for each torrent
      const detailedTorrents = await Promise.all(
        torrentList.map(async (t: any) => {
          try {
            const statusRes = await torrentService.getStatus(t.job_id);
            return statusRes.data;
          } catch {
            return t;
          }
        }),
      );

      setTorrents(detailedTorrents);
      torrentsRef.current = detailedTorrents;
      setLoading(false);
    } catch (err) {
      console.error("Failed to load torrents:", err);
      setLoading(false);
    }
  }, []);

  // Initial load and WebSocket subscription
  useEffect(() => {
    loadTorrents();

    // Subscribe to WebSocket updates for torrents
    const unsubscribe = websocketService.onJobUpdate((update) => {
      if (update.type !== "torrent") return;

      setTorrents((prev) => {
        const index = prev.findIndex((t) => t.job_id === update.job_id);
        if (index === -1) {
          // New torrent, reload list
          loadTorrents();
          return prev;
        }

        // Update existing torrent with all available data
        const updated = [...prev];
        const metadata = update.metadata || {};
        updated[index] = {
          ...updated[index],
          status: update.status,
          progress: update.progress,
          name: update.file_name || updated[index].name,
          download_rate: metadata.download_rate ?? updated[index].download_rate,
          upload_rate: metadata.upload_rate ?? updated[index].upload_rate,
          num_peers: metadata.num_peers ?? updated[index].num_peers,
          num_seeds: metadata.num_seeds ?? updated[index].num_seeds,
          files: metadata.files ?? updated[index].files,
        };
        return updated;
      });
    });

    return () => {
      unsubscribe();
    };
  }, [loadTorrents]);

  const handlePause = async (jobId: string) => {
    try {
      await torrentService.pause(jobId);
      loadTorrents();
    } catch (err) {
      console.error("Failed to pause:", err);
    }
  };

  const handleResume = async (jobId: string) => {
    try {
      await torrentService.resume(jobId);
      loadTorrents();
    } catch (err) {
      console.error("Failed to resume:", err);
    }
  };

  const handleRemove = async (jobId: string, deleteFiles = false) => {
    try {
      await torrentService.remove(jobId, deleteFiles);
      loadTorrents();
      setMenuAnchor(null);
    } catch (err) {
      console.error("Failed to remove:", err);
    }
  };

  const handleMenuOpen = (
    event: React.MouseEvent<HTMLElement>,
    torrent: TorrentJob,
  ) => {
    setMenuAnchor(event.currentTarget);
    setMenuTorrent(torrent);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setMenuTorrent(null);
  };

  const handleViewFiles = (torrent: TorrentJob) => {
    setSelectedTorrent(torrent);
    handleMenuClose();
  };

  const activeTorrents = torrents.filter(
    (t) => t.status === "downloading",
  ).length;
  const totalDownloadRate = torrents.reduce(
    (sum, t) => sum + (t.download_rate || 0),
    0,
  );
  const totalUploadRate = torrents.reduce(
    (sum, t) => sum + (t.upload_rate || 0),
    0,
  );

  return (
    <Box>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h4" color="text.primary" sx={{ mb: 0.5 }}>
            Gerenciador de Torrents
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {torrents.length} torrent{torrents.length !== 1 ? "s" : ""} •
            {activeTorrents} ativo{activeTorrents !== 1 ? "s" : ""} • ↓{" "}
            {formatSpeed(totalDownloadRate)} • ↑ {formatSpeed(totalUploadRate)}
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Tooltip title="Atualizar">
            <IconButton onClick={loadTorrents} sx={{ color: "text.secondary" }}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setAddDialogOpen(true)}
            sx={{
              backgroundColor: "#FF0000",
              "&:hover": { backgroundColor: "#CC0000" },
            }}
          >
            Adicionar Torrent
          </Button>
        </Box>
      </Box>

      {/* Stats Cards */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 2,
          mb: 3,
        }}
      >
        <Paper sx={{ p: 2, backgroundColor: "rgba(255,255,255,0.05)" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <CloudDownloadIcon sx={{ color: "#4CAF50", fontSize: 32 }} />
            <Box>
              <Typography variant="h5" color="text.primary">
                {formatSpeed(totalDownloadRate)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Download
              </Typography>
            </Box>
          </Box>
        </Paper>
        <Paper sx={{ p: 2, backgroundColor: "rgba(255,255,255,0.05)" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <SpeedIcon sx={{ color: "#2196F3", fontSize: 32 }} />
            <Box>
              <Typography variant="h5" color="text.primary">
                {formatSpeed(totalUploadRate)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Upload
              </Typography>
            </Box>
          </Box>
        </Paper>
        <Paper sx={{ p: 2, backgroundColor: "rgba(255,255,255,0.05)" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <PeopleIcon sx={{ color: "#FF9800", fontSize: 32 }} />
            <Box>
              <Typography variant="h5" color="text.primary">
                {torrents.reduce((sum, t) => sum + (t.num_peers || 0), 0)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Peers conectados
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Box>

      {/* Torrents Table */}
      <TableContainer
        component={Paper}
        sx={{ backgroundColor: "rgba(255,255,255,0.03)" }}
      >
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ color: "text.secondary", fontWeight: 600 }}>
                Nome
              </TableCell>
              <TableCell sx={{ color: "text.secondary", fontWeight: 600 }}>
                Status
              </TableCell>
              <TableCell sx={{ color: "text.secondary", fontWeight: 600 }}>
                Progresso
              </TableCell>
              <TableCell sx={{ color: "text.secondary", fontWeight: 600 }}>
                Velocidade
              </TableCell>
              <TableCell sx={{ color: "text.secondary", fontWeight: 600 }}>
                Peers
              </TableCell>
              <TableCell
                sx={{ color: "text.secondary", fontWeight: 600 }}
                align="right"
              >
                Ações
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <CircularProgress size={32} sx={{ color: "#FF0000" }} />
                </TableCell>
              </TableRow>
            ) : torrents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                  <FolderIcon
                    sx={{ fontSize: 48, color: "text.disabled", mb: 1 }}
                  />
                  <Typography color="text.secondary">
                    Nenhum torrent ativo
                  </Typography>
                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={() => setAddDialogOpen(true)}
                    sx={{ mt: 2, borderColor: "#FF0000", color: "#FF0000" }}
                  >
                    Adicionar primeiro torrent
                  </Button>
                </TableCell>
              </TableRow>
            ) : (
              torrents.map((torrent) => (
                <TableRow
                  key={torrent.job_id}
                  hover
                  onClick={() => setSelectedTorrent(torrent)}
                  sx={{ cursor: "pointer" }}
                >
                  <TableCell>
                    <Box
                      sx={{ display: "flex", alignItems: "center", gap: 1.5 }}
                    >
                      <FolderIcon sx={{ color: "#FF0000" }} />
                      <Box>
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 500, color: "text.primary" }}
                        >
                          {torrent.name || "Carregando..."}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {torrent.files?.length || 0} arquivo(s)
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getStatusLabel(torrent.status)}
                      color={getStatusColor(torrent.status) as any}
                      size="small"
                      sx={{ fontWeight: 500 }}
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ width: 150 }}>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          mb: 0.5,
                        }}
                      >
                        <Typography variant="caption" color="text.primary">
                          {torrent.progress.toFixed(1)}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={torrent.progress}
                        sx={{
                          height: 6,
                          borderRadius: 3,
                          backgroundColor: "rgba(255,255,255,0.1)",
                          "& .MuiLinearProgress-bar": {
                            backgroundColor:
                              torrent.status === "completed"
                                ? "#4CAF50"
                                : "#FF0000",
                          },
                        }}
                      />
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" color="text.primary">
                        ↓ {formatSpeed(torrent.download_rate || 0)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        ↑ {formatSpeed(torrent.upload_rate || 0)}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.primary">
                      {torrent.num_peers || 0} / {torrent.num_seeds || 0}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "flex-end",
                        gap: 0.5,
                      }}
                    >
                      {torrent.status === "downloading" ? (
                        <Tooltip title="Pausar">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePause(torrent.job_id);
                            }}
                            sx={{ color: "text.secondary" }}
                          >
                            <PauseIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      ) : torrent.status === "paused" ? (
                        <Tooltip title="Continuar">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleResume(torrent.job_id);
                            }}
                            sx={{ color: "#4CAF50" }}
                          >
                            <PlayArrowIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      ) : null}
                      <Tooltip title="Mais opções">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMenuOpen(e, torrent);
                          }}
                          sx={{ color: "text.secondary" }}
                        >
                          <MoreVertIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Context Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: { backgroundColor: "#1a1a1a", minWidth: 180 },
        }}
      >
        <MenuItem onClick={() => handleViewFiles(menuTorrent!)}>
          <ListItemIcon>
            <FolderIcon fontSize="small" sx={{ color: "text.secondary" }} />
          </ListItemIcon>
          <ListItemText>Ver arquivos</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => menuTorrent && handleRemove(menuTorrent.job_id, false)}
        >
          <ListItemIcon>
            <DeleteIcon fontSize="small" sx={{ color: "#f44336" }} />
          </ListItemIcon>
          <ListItemText>Remover</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => menuTorrent && handleRemove(menuTorrent.job_id, true)}
        >
          <ListItemIcon>
            <DeleteIcon fontSize="small" sx={{ color: "#f44336" }} />
          </ListItemIcon>
          <ListItemText>Remover + arquivos</ListItemText>
        </MenuItem>
      </Menu>

      {/* Add Torrent Dialog */}
      <AddTorrentDialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        onAdded={loadTorrents}
      />

      {/* Files Dialog */}
      {selectedTorrent && (
        <TorrentFilesDialog
          open={!!selectedTorrent}
          onClose={() => setSelectedTorrent(null)}
          torrent={selectedTorrent}
          onPreview={(file) => {
            setPreviewJob({
              id: selectedTorrent.job_id,
              name: file.name,
              fileIndex: file.index,
            });
          }}
          onRefresh={loadTorrents}
        />
      )}

      {/* Video Preview */}
      {previewJob && (
        <VideoPreviewDialog
          open={!!previewJob}
          onClose={() => setPreviewJob(null)}
          jobId={previewJob.id}
          name={previewJob.name}
          status="completed"
          customStreamUrl={`${apiBaseUrl}/api/torrent/stream-compat/${previewJob.id}/${previewJob.fileIndex}`}
        />
      )}
    </Box>
  );
};

// Add Torrent Dialog Component
interface AddTorrentDialogProps {
  open: boolean;
  onClose: () => void;
  onAdded: () => void;
}

const AddTorrentDialog: React.FC<AddTorrentDialogProps> = ({
  open,
  onClose,
  onAdded,
}) => {
  const [tab, setTab] = useState(0);
  const [magnetUrl, setMagnetUrl] = useState("");
  const [torrentFile, setTorrentFile] = useState<File | null>(null);
  const [parsedInfo, setParsedInfo] = useState<any>(null);
  const [selectedFiles, setSelectedFiles] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    getRootProps,
    getInputProps,
    open: openFileDialog,
  } = useDropzone({
    accept: { "application/x-bittorrent": [".torrent"] },
    maxFiles: 1,
    noClick: true,
    onDrop: async (files) => {
      if (files[0]) {
        setTorrentFile(files[0]);
        setLoading(true);
        setError(null);
        try {
          const response = await torrentService.parse(files[0]);
          setParsedInfo(response.data);
          setSelectedFiles(
            response.data.files?.map((_: any, i: number) => i) || [],
          );
        } catch (err: any) {
          setError(
            err.response?.data?.detail ||
              err.message ||
              "Erro ao analisar torrent",
          );
        } finally {
          setLoading(false);
        }
      }
    },
  });

  const handleParseMagnet = async () => {
    if (!magnetUrl.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const response = await torrentService.parseMagnet(magnetUrl);
      setParsedInfo(response.data);
    } catch (err: any) {
      setError(
        err.response?.data?.detail || err.message || "Erro ao analisar magnet",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleStartDownload = async () => {
    setLoading(true);
    setError(null);
    try {
      if (tab === 0 && magnetUrl) {
        await torrentService.addMagnet(magnetUrl);
      } else if (tab === 1 && torrentFile) {
        await torrentService.addFile(torrentFile);
      }
      onAdded();
      handleClose();
    } catch (err: any) {
      setError(
        err.response?.data?.detail ||
          err.message ||
          "Erro ao adicionar torrent",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setMagnetUrl("");
    setTorrentFile(null);
    setParsedInfo(null);
    setSelectedFiles([]);
    setError(null);
    onClose();
  };

  const handleToggleFile = (index: number) => {
    setSelectedFiles((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index],
    );
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: "#181A20",
          backgroundImage: "none",
          borderRadius: 3,
        },
      }}
    >
      <DialogTitle sx={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <CloudDownloadIcon sx={{ color: "#FF0000" }} />
          <Typography variant="h6">Adicionar Torrent</Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          sx={{
            "& .MuiTab-root": { color: "rgba(255,255,255,0.7)" },
            "& .Mui-selected": { color: "#FF0000" },
            "& .MuiTabs-indicator": { backgroundColor: "#FF0000" },
          }}
        >
          <Tab icon={<LinkIcon />} label="Magnet Link" iconPosition="start" />
          <Tab
            icon={<UploadFileIcon />}
            label="Arquivo .torrent"
            iconPosition="start"
          />
        </Tabs>

        {tab === 0 && (
          <Box sx={{ pt: 3 }}>
            <Box sx={{ display: "flex", gap: 2 }}>
              <TextField
                fullWidth
                placeholder="magnet:?xt=urn:btih:..."
                value={magnetUrl}
                onChange={(e) => setMagnetUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleParseMagnet()}
                InputProps={{
                  startAdornment: (
                    <LinkIcon sx={{ color: "rgba(255,255,255,0.3)", mr: 1 }} />
                  ),
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    color: "#fff",
                    "& fieldset": { borderColor: "rgba(255,255,255,0.2)" },
                    "&:hover fieldset": { borderColor: "rgba(255,0,0,0.5)" },
                    "&.Mui-focused fieldset": { borderColor: "#FF0000" },
                  },
                }}
              />
              <Button
                variant="outlined"
                onClick={handleParseMagnet}
                disabled={!magnetUrl.trim() || loading}
                sx={{
                  borderColor: "rgba(255,255,255,0.2)",
                  color: "text.secondary",
                }}
              >
                Analisar
              </Button>
            </Box>

            {parsedInfo && (
              <Paper
                sx={{ mt: 2, p: 2, backgroundColor: "rgba(255,255,255,0.05)" }}
              >
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                  {parsedInfo.name}
                </Typography>
                {parsedInfo.is_magnet && (
                  <Typography variant="body2" color="text.secondary">
                    Lista de arquivos disponível após iniciar o download
                  </Typography>
                )}
              </Paper>
            )}
          </Box>
        )}

        {tab === 1 && (
          <Box sx={{ pt: 3 }} {...getRootProps()}>
            <input {...getInputProps()} />
            <Box
              onClick={openFileDialog}
              sx={{
                border: "2px dashed rgba(255,255,255,0.2)",
                borderRadius: 2,
                p: 4,
                textAlign: "center",
                cursor: "pointer",
                transition: "all 0.2s",
                "&:hover": {
                  borderColor: "rgba(255,0,0,0.5)",
                  backgroundColor: "rgba(255,0,0,0.05)",
                },
              }}
            >
              <UploadFileIcon
                sx={{ fontSize: 48, color: "text.secondary", mb: 1 }}
              />
              <Typography variant="body1" color="text.primary">
                {torrentFile
                  ? torrentFile.name
                  : "Clique ou arraste um arquivo .torrent"}
              </Typography>
            </Box>

            {parsedInfo && parsedInfo.files && (
              <Paper
                sx={{
                  mt: 2,
                  backgroundColor: "rgba(255,255,255,0.03)",
                  maxHeight: 300,
                  overflow: "auto",
                }}
              >
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={
                            selectedFiles.length === parsedInfo.files.length
                          }
                          indeterminate={
                            selectedFiles.length > 0 &&
                            selectedFiles.length < parsedInfo.files.length
                          }
                          onChange={() => {
                            if (
                              selectedFiles.length === parsedInfo.files.length
                            ) {
                              setSelectedFiles([]);
                            } else {
                              setSelectedFiles(
                                parsedInfo.files.map((_: any, i: number) => i),
                              );
                            }
                          }}
                          sx={{
                            color: "#FF0000",
                            "&.Mui-checked": { color: "#FF0000" },
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ color: "text.secondary" }}>
                        Arquivo
                      </TableCell>
                      <TableCell sx={{ color: "text.secondary" }} align="right">
                        Tamanho
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {parsedInfo.files.map((file: any, index: number) => (
                      <TableRow key={index} hover>
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={selectedFiles.includes(index)}
                            onChange={() => handleToggleFile(index)}
                            sx={{
                              color: "#FF0000",
                              "&.Mui-checked": { color: "#FF0000" },
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            {getFileIcon(file.name)}
                            <Typography
                              variant="body2"
                              sx={{ wordBreak: "break-all" }}
                            >
                              {file.name}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" color="text.secondary">
                            {formatBytes(file.size)}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Paper>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions
        sx={{ p: 2, borderTop: "1px solid rgba(255,255,255,0.1)" }}
      >
        <Button onClick={handleClose} sx={{ color: "text.secondary" }}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={handleStartDownload}
          disabled={
            loading ||
            (tab === 0 && !magnetUrl.trim()) ||
            (tab === 1 && !torrentFile)
          }
          startIcon={
            loading ? (
              <CircularProgress size={18} color="inherit" />
            ) : (
              <CloudDownloadIcon />
            )
          }
          sx={{
            backgroundColor: "#FF0000",
            "&:hover": { backgroundColor: "#CC0000" },
          }}
        >
          Iniciar Download
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Torrent Files Dialog Component
interface TorrentFilesDialogProps {
  open: boolean;
  onClose: () => void;
  torrent: TorrentJob;
  onPreview: (file: TorrentFile) => void;
  onRefresh?: () => void;
}

const TorrentFilesDialog: React.FC<TorrentFilesDialogProps> = ({
  open,
  onClose,
  torrent,
  onPreview,
  onRefresh,
}) => {
  const apiBaseUrl = import.meta.env.VITE_API_URL || "http://localhost:8080";
  const isWaitingSelection = torrent.status === "waiting_selection";

  // State for file selection (when waiting_selection)
  const [selectedFiles, setSelectedFiles] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [convertTo, setConvertTo] = useState<string>("");

  // Available conversion formats
  const conversionFormats = [
    { value: "", label: "Sem conversão (manter original)" },
    { value: "mp4", label: "MP4 (H.264)" },
    { value: "mp4_h265", label: "MP4 (H.265/HEVC)" },
    { value: "webm", label: "WebM (VP9)" },
    { value: "mp3", label: "MP3 (Áudio)" },
    { value: "aac", label: "AAC (Áudio)" },
  ];

  // Initialize selected files when dialog opens
  useEffect(() => {
    if (isWaitingSelection && torrent.files) {
      // By default select all media files
      const mediaIndices = torrent.files
        .filter((f) => isMediaFile(f.name))
        .map((f) => f.index);
      setSelectedFiles(
        mediaIndices.length > 0
          ? mediaIndices
          : torrent.files.map((f) => f.index),
      );
    }
  }, [isWaitingSelection, torrent.files]);

  const handleToggleFile = (index: number) => {
    setSelectedFiles((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index],
    );
  };

  const handleSelectAll = () => {
    if (torrent.files) {
      if (selectedFiles.length === torrent.files.length) {
        setSelectedFiles([]);
      } else {
        setSelectedFiles(torrent.files.map((f) => f.index));
      }
    }
  };

  const handleStartDownload = async () => {
    if (selectedFiles.length === 0) {
      setError("Selecione pelo menos um arquivo");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Pass conversion format if selected
      await torrentService.selectFiles(
        torrent.job_id,
        selectedFiles,
        convertTo || undefined,
      );
      onRefresh?.();
      onClose();
    } catch (err: any) {
      console.error("Failed to start download:", err);
      setError(
        err.response?.data?.detail || err.message || "Erro ao iniciar download",
      );
    } finally {
      setLoading(false);
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
          backgroundColor: "#181A20",
          backgroundImage: "none",
          borderRadius: 3,
        },
      }}
    >
      <DialogTitle sx={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <FolderIcon sx={{ color: "#FF0000" }} />
          <Box>
            <Typography variant="h6">{torrent.name}</Typography>
            <Typography variant="caption" color="text.secondary">
              {torrent.files?.length || 0} arquivo(s)
              {isWaitingSelection
                ? ` • ${selectedFiles.length} selecionado(s)`
                : ` • ${torrent.progress.toFixed(1)}% concluído`}
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        {error && (
          <Alert severity="error" sx={{ m: 2 }}>
            {error}
          </Alert>
        )}

        {isWaitingSelection && (
          <Alert severity="info" sx={{ m: 2, mb: 0 }}>
            Selecione os arquivos que deseja baixar e clique em "Iniciar
            Download"
          </Alert>
        )}

        {isWaitingSelection && (
          <Box sx={{ px: 2, pt: 2 }}>
            <FormControl fullWidth size="small">
              <InputLabel sx={{ color: "text.secondary" }}>
                Converter para
              </InputLabel>
              <Select
                value={convertTo}
                label="Converter para"
                onChange={(e) => setConvertTo(e.target.value)}
                sx={{
                  color: "#fff",
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: "rgba(255,255,255,0.2)",
                  },
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: "rgba(255,0,0,0.5)",
                  },
                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#FF0000",
                  },
                }}
              >
                {conversionFormats.map((format) => (
                  <MenuItem key={format.value} value={format.value}>
                    {format.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        )}

        <Table>
          <TableHead>
            <TableRow>
              {isWaitingSelection && (
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={torrent.files?.length === selectedFiles.length}
                    indeterminate={
                      selectedFiles.length > 0 &&
                      selectedFiles.length < (torrent.files?.length || 0)
                    }
                    onChange={handleSelectAll}
                    sx={{
                      color: "#FF0000",
                      "&.Mui-checked": { color: "#FF0000" },
                    }}
                  />
                </TableCell>
              )}
              <TableCell sx={{ color: "text.secondary" }}>Arquivo</TableCell>
              <TableCell sx={{ color: "text.secondary" }} align="right">
                Tamanho
              </TableCell>
              {!isWaitingSelection && (
                <>
                  <TableCell sx={{ color: "text.secondary" }}>
                    Progresso
                  </TableCell>
                  <TableCell sx={{ color: "text.secondary" }} align="right">
                    Ações
                  </TableCell>
                </>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {torrent.files?.map((file) => (
              <TableRow key={file.index} hover>
                {isWaitingSelection && (
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selectedFiles.includes(file.index)}
                      onChange={() => handleToggleFile(file.index)}
                      sx={{
                        color: "#FF0000",
                        "&.Mui-checked": { color: "#FF0000" },
                      }}
                    />
                  </TableCell>
                )}
                <TableCell>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    {getFileIcon(file.name)}
                    <Typography variant="body2" sx={{ wordBreak: "break-all" }}>
                      {file.name}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2" color="text.secondary">
                    {formatBytes(file.size)}
                  </Typography>
                </TableCell>
                {!isWaitingSelection && (
                  <>
                    <TableCell>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          width: 120,
                        }}
                      >
                        <LinearProgress
                          variant="determinate"
                          value={file.progress}
                          sx={{
                            flex: 1,
                            height: 4,
                            borderRadius: 2,
                            backgroundColor: "rgba(255,255,255,0.1)",
                            "& .MuiLinearProgress-bar": {
                              backgroundColor:
                                file.progress === 100 ? "#4CAF50" : "#FF0000",
                            },
                          }}
                        />
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ minWidth: 35 }}
                        >
                          {file.progress.toFixed(0)}%
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "flex-end",
                          gap: 0.5,
                        }}
                      >
                        {/* Download individual file */}
                        {file.progress === 100 && (
                          <Tooltip title="Baixar arquivo">
                            <IconButton
                              size="small"
                              onClick={() => {
                                const url = `${apiBaseUrl}/api/torrent/stream/${torrent.job_id}/${file.index}`;
                                const a = document.createElement("a");
                                a.href = url;
                                a.download =
                                  file.name.split("/").pop() || file.name;
                                a.click();
                              }}
                              sx={{ color: "#4CAF50" }}
                            >
                              <DownloadIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        {file.progress > 10 && isMediaFile(file.name) && (
                          <Tooltip title="Preview">
                            <IconButton
                              size="small"
                              onClick={() => onPreview(file)}
                            >
                              <PreviewIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        <Tooltip title="Converter">
                          <IconButton
                            size="small"
                            disabled={
                              file.progress < 100 || !isMediaFile(file.name)
                            }
                          >
                            <TransformIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DialogContent>

      <DialogActions
        sx={{ p: 2, borderTop: "1px solid rgba(255,255,255,0.1)" }}
      >
        <Button onClick={onClose} sx={{ color: "text.secondary" }}>
          {isWaitingSelection ? "Cancelar" : "Fechar"}
        </Button>
        {isWaitingSelection && (
          <Button
            variant="contained"
            onClick={handleStartDownload}
            disabled={loading || selectedFiles.length === 0}
            startIcon={
              loading ? (
                <CircularProgress size={18} color="inherit" />
              ) : (
                <CloudDownloadIcon />
              )
            }
            sx={{
              backgroundColor: "#FF0000",
              "&:hover": { backgroundColor: "#CC0000" },
            }}
          >
            Iniciar Download ({selectedFiles.length} arquivo
            {selectedFiles.length !== 1 ? "s" : ""})
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default TorrentsPage;
