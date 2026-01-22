import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Checkbox,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import LinkIcon from "@mui/icons-material/Link";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import DownloadIcon from "@mui/icons-material/Download";
import FolderIcon from "@mui/icons-material/Folder";
import { useDropzone } from "react-dropzone";
import { useTorrent } from "../hooks/useApi";
import { TorrentFile } from "../services/api";
import AdvancedConversionModal from "./AdvancedConversionModal";

interface TorrentDialogProps {
  open: boolean;
  onClose: () => void;
  onTorrentAdded: (jobId: string, name: string) => void;
  initialMagnetUrl?: string;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div hidden={value !== index} {...other}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const TorrentDialog: React.FC<TorrentDialogProps> = ({
  open,
  onClose,
  onTorrentAdded,
  initialMagnetUrl = "",
}) => {
  const [tab, setTab] = useState(0);
  const [magnetUrl, setMagnetUrl] = useState(initialMagnetUrl);
  const [torrentFile, setTorrentFile] = useState<File | null>(null);
  const [parsedInfo, setParsedInfo] = useState<any>(null);
  const [selectedFiles, setSelectedFiles] = useState<number[]>([]);
  const [convertProfile, setConvertProfile] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update magnetUrl when initialMagnetUrl changes and auto-parse
  React.useEffect(() => {
    if (initialMagnetUrl && open) {
      setMagnetUrl(initialMagnetUrl);
      setTab(0); // Switch to magnet tab
      // Auto-parse the magnet
      handleParseMagnetAuto(initialMagnetUrl);
    }
  }, [initialMagnetUrl, open]);

  const handleParseMagnetAuto = async (url: string) => {
    if (!url.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const info = await parseMagnet(url);
      setParsedInfo(info);
    } catch (err: any) {
      setError(err.message || "Erro ao analisar magnet link");
    } finally {
      setLoading(false);
    }
  };
  const [showConversionModal, setShowConversionModal] = useState(false);
  const [pendingTorrentData, setPendingTorrentData] = useState<{
    type: "magnet" | "file";
    data: string | File;
  } | null>(null);

  const { addMagnet, addFile, parseFile, parseMagnet } = useTorrent();

  const {
    getRootProps,
    getInputProps,
    open: openFileDialog,
  } = useDropzone({
    accept: { "application/x-bittorrent": [".torrent"] },
    maxFiles: 1,
    onDrop: async (files) => {
      if (files[0]) {
        setTorrentFile(files[0]);
        setLoading(true);
        setError(null);
        try {
          const info = await parseFile(files[0]);
          setParsedInfo(info);
          setSelectedFiles(info.files?.map((_: any, i: number) => i) || []);
        } catch (err: any) {
          setError(err.message || "Erro ao analisar torrent");
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
      const info = await parseMagnet(magnetUrl);
      setParsedInfo(info);
      // Magnet URLs don't have file list until metadata is downloaded
    } catch (err: any) {
      setError(err.message || "Erro ao analisar magnet link");
    } finally {
      setLoading(false);
    }
  };

  const handleStartDownload = async () => {
    // Instead of starting immediately, open conversion modal first
    if (tab === 0 && magnetUrl) {
      setPendingTorrentData({ type: "magnet", data: magnetUrl });
      setShowConversionModal(true);
    } else if (tab === 1 && torrentFile) {
      setPendingTorrentData({ type: "file", data: torrentFile });
      setShowConversionModal(true);
    }
  };

  const handleConversionConfirm = async (options: any) => {
    if (!pendingTorrentData) return;

    setLoading(true);
    setError(null);
    setShowConversionModal(false);

    try {
      let result;
      if (pendingTorrentData.type === "magnet") {
        result = await addMagnet(pendingTorrentData.data as string);
      } else {
        result = await addFile(pendingTorrentData.data as File);
      }

      if (result) {
        onTorrentAdded(result.job_id, parsedInfo?.name || "Torrent");
        handleClose();
      }
    } catch (err: any) {
      setError(err.message || "Erro ao adicionar torrent");
    } finally {
      setLoading(false);
      setPendingTorrentData(null);
    }
  };

  const handleConversionClose = () => {
    setShowConversionModal(false);
    setPendingTorrentData(null);
  };

  const handleClose = () => {
    setMagnetUrl("");
    setTorrentFile(null);
    setParsedInfo(null);
    setSelectedFiles([]);
    setConvertProfile("");
    setError(null);
    setShowConversionModal(false);
    setPendingTorrentData(null);
    onClose();
  };

  const handleToggleFile = (index: number) => {
    setSelectedFiles((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index],
    );
  };

  const handleToggleAll = () => {
    if (!parsedInfo?.files) return;
    if (selectedFiles.length === parsedInfo.files.length) {
      setSelectedFiles([]);
    } else {
      setSelectedFiles(parsedInfo.files.map((_: any, i: number) => i));
    }
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
          <Typography variant="h6" sx={{ color: "#fff" }}>
            Adicionar Torrent
          </Typography>
        </Box>
        <IconButton onClick={handleClose} sx={{ color: "#fff" }}>
          <CloseIcon />
        </IconButton>
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
          <Tab icon={<LinkIcon />} label="Magnet Link" />
          <Tab icon={<UploadFileIcon />} label="Arquivo .torrent" />
        </Tabs>

        <TabPanel value={tab} index={0}>
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
              variant="contained"
              onClick={handleParseMagnet}
              disabled={!magnetUrl.trim() || loading}
              sx={{
                backgroundColor: "#FF0000",
                "&:hover": { backgroundColor: "#cc0000" },
              }}
            >
              {loading ? <CircularProgress size={24} /> : "Analisar"}
            </Button>
          </Box>
        </TabPanel>

        <TabPanel value={tab} index={1}>
          <Box
            {...getRootProps()}
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
            <input {...getInputProps()} />
            {torrentFile ? (
              <Box>
                <UploadFileIcon
                  sx={{ fontSize: 48, color: "#4CAF50", mb: 1 }}
                />
                <Typography sx={{ color: "#fff" }}>
                  {torrentFile.name}
                </Typography>
              </Box>
            ) : (
              <Box>
                <UploadFileIcon sx={{ fontSize: 48, color: "#aaa", mb: 1 }} />
                <Typography sx={{ color: "#aaa" }}>
                  Arraste um arquivo .torrent ou clique para selecionar
                </Typography>
              </Box>
            )}
          </Box>
        </TabPanel>

        {/* Parsed torrent info */}
        {parsedInfo && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" sx={{ color: "#fff", mb: 2 }}>
              {parsedInfo.name}
            </Typography>

            {parsedInfo.total_size && (
              <Typography variant="body2" sx={{ color: "#aaa", mb: 2 }}>
                Tamanho total: {formatBytes(parsedInfo.total_size)}
              </Typography>
            )}

            {parsedInfo.files && parsedInfo.files.length > 0 && (
              <TableContainer
                component={Paper}
                sx={{
                  backgroundColor: "rgba(255,255,255,0.05)",
                  maxHeight: 300,
                }}
              >
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell
                        padding="checkbox"
                        sx={{ backgroundColor: "#23242b" }}
                      >
                        <Checkbox
                          checked={
                            selectedFiles.length === parsedInfo.files.length
                          }
                          indeterminate={
                            selectedFiles.length > 0 &&
                            selectedFiles.length < parsedInfo.files.length
                          }
                          onChange={handleToggleAll}
                          sx={{ color: "rgba(255,255,255,0.5)" }}
                        />
                      </TableCell>
                      <TableCell
                        sx={{ color: "#aaa", backgroundColor: "#23242b" }}
                      >
                        Arquivo
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{ color: "#aaa", backgroundColor: "#23242b" }}
                      >
                        Tamanho
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {parsedInfo.files.map(
                      (file: TorrentFile, index: number) => (
                        <TableRow key={index}>
                          <TableCell padding="checkbox">
                            <Checkbox
                              checked={selectedFiles.includes(index)}
                              onChange={() => handleToggleFile(index)}
                              sx={{
                                color: "rgba(255,255,255,0.5)",
                                "&.Mui-checked": { color: "#FF0000" },
                              }}
                            />
                          </TableCell>
                          <TableCell sx={{ color: "#fff" }}>
                            {file.name}
                          </TableCell>
                          <TableCell align="right" sx={{ color: "#aaa" }}>
                            {formatBytes(file.size)}
                          </TableCell>
                        </TableRow>
                      ),
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {parsedInfo.is_magnet && (
              <Alert severity="info" sx={{ mt: 2 }}>
                A lista de arquivos estará disponível após o download dos
                metadados iniciar.
              </Alert>
            )}
          </Box>
        )}

        {/* Conversion option */}
        {parsedInfo && (
          <FormControl fullWidth sx={{ mt: 3 }}>
            <InputLabel sx={{ color: "rgba(255,255,255,0.7)" }}>
              Converter arquivos para
            </InputLabel>
            <Select
              value={convertProfile}
              onChange={(e) => setConvertProfile(e.target.value)}
              label="Converter arquivos para"
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
              <MenuItem value="">Manter formato original</MenuItem>
              <MenuItem value="youtube_hd">YouTube HD (MP4)</MenuItem>
              <MenuItem value="audio_mp3">Extrair áudio (MP3)</MenuItem>
              <MenuItem value="webm">WebM (VP9)</MenuItem>
            </Select>
          </FormControl>
        )}
      </DialogContent>

      <DialogActions
        sx={{ p: 3, borderTop: "1px solid rgba(255,255,255,0.1)" }}
      >
        <Button onClick={handleClose} sx={{ color: "#aaa" }}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          startIcon={
            loading ? <CircularProgress size={20} /> : <DownloadIcon />
          }
          onClick={handleStartDownload}
          disabled={
            loading || (tab === 0 && !magnetUrl) || (tab === 1 && !torrentFile)
          }
          sx={{
            backgroundColor: "#FF0000",
            "&:hover": { backgroundColor: "#cc0000" },
            "&:disabled": { backgroundColor: "rgba(255,0,0,0.3)" },
          }}
        >
          Configurar & Baixar
        </Button>
      </DialogActions>

      {/* Conversion Configuration Modal */}
      <AdvancedConversionModal
        open={showConversionModal}
        onClose={handleConversionClose}
        onConvert={handleConversionConfirm}
        sourceName={
          parsedInfo?.name || (tab === 0 ? magnetUrl : torrentFile?.name)
        }
      />
    </Dialog>
  );
};

export default TorrentDialog;
