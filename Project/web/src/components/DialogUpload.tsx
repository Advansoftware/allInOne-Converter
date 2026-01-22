import * as Mui from "@mui/material/styles";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import Typography from "@mui/material/Typography";
import {
  Box,
  TextField,
  Button,
  useMediaQuery,
  Slide,
  Chip,
  Tooltip,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import LinkIcon from "@mui/icons-material/Link";
import VideoFileIcon from "@mui/icons-material/VideoFile";
import FolderIcon from "@mui/icons-material/Folder";
import YouTubeIcon from "@mui/icons-material/YouTube";
import { useEffect, useState, forwardRef } from "react";
import { useDropzone } from "react-dropzone";
import AdvancedConversionModal from "./AdvancedConversionModal";
import TorrentDialog from "./TorrentDialog";
import { useDownload, useUpload } from "../hooks/useApi";

const Transition = forwardRef(function Transition(
  props: any,
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const BootstrapDialog = Mui.styled(Dialog)(({ theme }) => ({
  "& .MuiDialogContent-root": {
    padding: theme.spacing(3),
    background: `linear-gradient(145deg, ${theme.palette.background.paper} 0%, #1a1a1a 100%)`,
  },
  "& .MuiDialog-container": {
    backdropFilter: "blur(8px)",
    background: "rgba(0,0,0,0.7)",
  },
  "& .MuiPaper-root": {
    borderRadius: 16,
    boxShadow: "0 24px 80px rgba(255,0,0,0.15), 0 8px 32px rgba(0,0,0,0.4)",
    border: `1px solid rgba(255,0,0,0.2)`,
    background: `linear-gradient(145deg, ${theme.palette.background.paper} 0%, #1a1a1a 100%)`,
    backgroundImage: "none",
    overflow: "hidden",
  },
}));

const StyledTextField = Mui.styled(TextField)(({ theme }) => ({
  "& .MuiOutlinedInput-root": {
    borderRadius: 12,
    background: "rgba(255,255,255,0.03)",
    transition: "all 0.2s ease",
    "& fieldset": {
      borderColor: "rgba(255,255,255,0.1)",
      borderWidth: 2,
    },
    "&:hover fieldset": {
      borderColor: "rgba(255,0,0,0.4)",
    },
    "&.Mui-focused fieldset": {
      borderColor: "#FF0000",
      boxShadow: "0 0 20px rgba(255,0,0,0.2)",
    },
  },
  "& .MuiInputLabel-root": {
    color: "rgba(255,255,255,0.5)",
    "&.Mui-focused": {
      color: "#FF0000",
    },
  },
  "& .MuiOutlinedInput-input": {
    color: "#fff",
  },
}));

interface DialogTitleProps {
  id: string;
  children?: React.ReactNode;
  onClose: () => void;
}

function BootstrapDialogTitle(props: DialogTitleProps) {
  const { children, onClose, ...other } = props;
  return (
    <DialogTitle
      sx={{
        m: 0,
        p: 2.5,
        background:
          "linear-gradient(90deg, rgba(255,0,0,0.1) 0%, transparent 100%)",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        display: "flex",
        alignItems: "center",
        gap: 1.5,
      }}
      {...other}
    >
      <Box
        sx={{
          width: 40,
          height: 40,
          borderRadius: 2,
          background: "linear-gradient(135deg, #FF0000 0%, #cc0000 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 12px rgba(255,0,0,0.3)",
        }}
      >
        <CloudUploadIcon sx={{ color: "#fff", fontSize: 22 }} />
      </Box>
      <Typography
        sx={{
          color: "#fff",
          fontWeight: 700,
          fontSize: 20,
          letterSpacing: 0.5,
        }}
      >
        {children}
      </Typography>
      {onClose && (
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: "absolute",
            right: 12,
            top: 12,
            color: "rgba(255,255,255,0.5)",
            background: "rgba(255,255,255,0.05)",
            borderRadius: 2,
            width: 36,
            height: 36,
            "&:hover": {
              background: "rgba(255,0,0,0.2)",
              color: "#FF0000",
            },
            transition: "all 0.2s ease",
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      )}
    </DialogTitle>
  );
}

interface DialogUploadProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  addUpload: (file: {
    name: string;
    thumbnail: string;
    type?: string;
    jobId?: string;
  }) => void;
}

// Helper to detect URL type
const detectUrlType = (
  url: string,
): "magnet" | "torrent" | "youtube" | "url" | null => {
  if (!url.trim()) return null;
  if (url.startsWith("magnet:?")) return "magnet";
  if (url.match(/\.torrent(\?|$)/i)) return "torrent";
  if (
    url.match(/youtube\.com|youtu\.be|vimeo\.com|dailymotion\.com|twitch\.tv/i)
  )
    return "youtube";
  if (url.match(/^https?:\/\//i)) return "url";
  return null;
};

export default function DialogUpload({
  open,
  setOpen,
  addUpload,
}: DialogUploadProps) {
  const theme = Mui.useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [url, setUrl] = useState("");
  const [video, setVideo] = useState<File[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showTorrent, setShowTorrent] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const [urlType, setUrlType] = useState<
    "magnet" | "torrent" | "youtube" | "url" | null
  >(null);

  const { startDownload } = useDownload();
  const { upload } = useUpload();

  const {
    getRootProps,
    getInputProps,
    open: openFileDialog,
  } = useDropzone({
    accept: {
      "video/*": [],
      "audio/*": [],
      "image/*": [],
      "application/x-bittorrent": [".torrent"],
    },
    maxFiles: 1,
    multiple: false,
    noClick: true,
    noKeyboard: true,
    onDrop: (acceptedFiles) => {
      const file = acceptedFiles[0];
      if (file) {
        // Check if it's a torrent file
        if (
          file.name.endsWith(".torrent") ||
          file.type === "application/x-bittorrent"
        ) {
          setShowTorrent(true);
        } else {
          setVideo([file]);
        }
      }
    },
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false),
  });

  const handleClose = () => {
    setOpen(false);
    setShowAdvanced(false);
    setShowTorrent(false);
    setVideo([]);
    setUrl("");
    setUrlType(null);
  };

  useEffect(() => {
    if (video.length > 0 && !showAdvanced) {
      setShowAdvanced(true);
    }
  }, [video]);

  // Update URL type detection as user types
  useEffect(() => {
    setUrlType(detectUrlType(url));
  }, [url]);

  const handleAdvancedConvert = async (options: any) => {
    if (video.length > 0) {
      const file = video[0];
      try {
        const result = await upload(file);
        const thumbnail =
          file.type.startsWith("image/") || file.type.startsWith("video/")
            ? URL.createObjectURL(file)
            : "/src/assets/modalImage.svg";
        addUpload({
          name: file.name,
          thumbnail,
          type: "conversion",
          jobId: result.job_id,
        });
      } catch (err) {
        console.error("Upload failed:", err);
      }
      handleClose();
    }
  };

  const handleUrlSubmit = async () => {
    if (!url.trim()) return;

    // If it's a magnet link, open torrent dialog
    if (urlType === "magnet") {
      setShowTorrent(true);
      return;
    }

    // For URLs (YouTube, etc), use download service
    if (urlType === "youtube" || urlType === "url") {
      try {
        const result = await startDownload(url);
        addUpload({
          name: url,
          thumbnail: "/src/assets/modalImage.svg",
          type: "download",
          jobId: result.job_id,
        });
        handleClose();
      } catch (err) {
        console.error("Download failed:", err);
      }
    }
  };

  const handleTorrentAdded = (jobId: string, name: string) => {
    addUpload({
      name,
      thumbnail: "/src/assets/modalImage.svg",
      type: "torrent",
      jobId,
    });
    handleClose();
  };

  return (
    <div>
      <BootstrapDialog
        fullWidth
        scroll="body"
        maxWidth="sm"
        open={open}
        TransitionComponent={Transition}
        fullScreen={isMobile}
        disableScrollLock={true}
      >
        <BootstrapDialogTitle
          id="customized-dialog-title"
          onClose={handleClose}
        >
          Enviar Conteúdo
        </BootstrapDialogTitle>
        <DialogContent>
          <Box sx={{ py: 2 }}>
            {/* Drop Zone */}
            <Box
              {...getRootProps()}
              sx={{
                border: isDragActive
                  ? "2px solid #FF0000"
                  : "2px dashed rgba(255,255,255,0.15)",
                borderRadius: 3,
                background: isDragActive
                  ? "rgba(255,0,0,0.08)"
                  : "rgba(255,255,255,0.02)",
                p: { xs: 3, sm: 4 },
                textAlign: "center",
                cursor: "pointer",
                transition: "all 0.3s ease",
                position: "relative",
                overflow: "hidden",
                "&:hover": {
                  borderColor: "rgba(255,0,0,0.5)",
                  background: "rgba(255,0,0,0.04)",
                },
                "&::before": isDragActive
                  ? {
                      content: '""',
                      position: "absolute",
                      inset: 0,
                      background:
                        "radial-gradient(circle at center, rgba(255,0,0,0.1) 0%, transparent 70%)",
                      animation: "pulse 2s infinite",
                    }
                  : {},
              }}
            >
              <input {...getInputProps()} />

              <Box
                sx={{
                  width: 72,
                  height: 72,
                  borderRadius: "50%",
                  background:
                    "linear-gradient(135deg, rgba(255,0,0,0.15) 0%, rgba(255,0,0,0.05) 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  mx: "auto",
                  mb: 2,
                  border: "2px solid rgba(255,0,0,0.2)",
                }}
              >
                <VideoFileIcon sx={{ fontSize: 36, color: "#FF0000" }} />
              </Box>

              <Typography
                variant="h6"
                sx={{
                  color: "#fff",
                  fontWeight: 600,
                  mb: 0.5,
                  fontSize: { xs: 16, sm: 18 },
                }}
              >
                Arraste e solte seu arquivo aqui
              </Typography>

              <Typography
                variant="body2"
                sx={{
                  color: "rgba(255,255,255,0.5)",
                  mb: 2.5,
                  fontSize: { xs: 13, sm: 14 },
                }}
              >
                Suporta vídeos, áudios, imagens e arquivos .torrent
              </Typography>

              <Button
                onClick={openFileDialog}
                variant="contained"
                startIcon={<CloudUploadIcon />}
                sx={{
                  background:
                    "linear-gradient(135deg, #FF0000 0%, #cc0000 100%)",
                  fontWeight: 600,
                  borderRadius: 2,
                  px: 4,
                  py: 1.2,
                  fontSize: 15,
                  textTransform: "none",
                  boxShadow: "0 4px 20px rgba(255,0,0,0.3)",
                  "&:hover": {
                    background:
                      "linear-gradient(135deg, #ff1a1a 0%, #e60000 100%)",
                    boxShadow: "0 6px 24px rgba(255,0,0,0.4)",
                    transform: "translateY(-1px)",
                  },
                  transition: "all 0.2s ease",
                }}
              >
                Selecionar Arquivo
              </Button>
            </Box>

            {/* Divider */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                my: 3,
                gap: 2,
              }}
            >
              <Box
                sx={{ flex: 1, height: 1, background: "rgba(255,255,255,0.1)" }}
              />
              <Typography
                sx={{
                  color: "rgba(255,255,255,0.4)",
                  fontSize: 13,
                  fontWeight: 500,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                }}
              >
                ou cole uma URL / Magnet
              </Typography>
              <Box
                sx={{ flex: 1, height: 1, background: "rgba(255,255,255,0.1)" }}
              />
            </Box>

            {/* URL Input with type detection */}
            <Box sx={{ display: "flex", gap: 1.5, alignItems: "flex-start" }}>
              <Box sx={{ flex: 1 }}>
                <StyledTextField
                  fullWidth
                  placeholder="https://youtube.com/... ou magnet:?xt=..."
                  variant="outlined"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleUrlSubmit()}
                  InputProps={{
                    startAdornment:
                      urlType === "magnet" ? (
                        <FolderIcon sx={{ color: "#FF9800", mr: 1.5 }} />
                      ) : urlType === "youtube" ? (
                        <YouTubeIcon sx={{ color: "#FF0000", mr: 1.5 }} />
                      ) : (
                        <LinkIcon
                          sx={{ color: "rgba(255,255,255,0.3)", mr: 1.5 }}
                        />
                      ),
                  }}
                />
                {urlType && (
                  <Box sx={{ mt: 1, display: "flex", gap: 1 }}>
                    {urlType === "magnet" && (
                      <Chip
                        label="Magnet Link detectado"
                        size="small"
                        sx={{
                          backgroundColor: "rgba(255,152,0,0.2)",
                          color: "#FF9800",
                          fontSize: 11,
                        }}
                      />
                    )}
                    {urlType === "youtube" && (
                      <Chip
                        label="Vídeo de streaming"
                        size="small"
                        sx={{
                          backgroundColor: "rgba(255,0,0,0.2)",
                          color: "#FF5252",
                          fontSize: 11,
                        }}
                      />
                    )}
                  </Box>
                )}
              </Box>
              <Tooltip
                title={urlType === "magnet" ? "Adicionar Torrent" : "Baixar"}
              >
                <span>
                  <Button
                    onClick={handleUrlSubmit}
                    disabled={!url.trim()}
                    variant="contained"
                    sx={{
                      minWidth: 56,
                      height: 56,
                      borderRadius: 3,
                      background: url.trim()
                        ? urlType === "magnet"
                          ? "linear-gradient(135deg, #FF9800 0%, #F57C00 100%)"
                          : "linear-gradient(135deg, #FF0000 0%, #cc0000 100%)"
                        : "rgba(255,255,255,0.05)",
                      boxShadow: url.trim()
                        ? "0 4px 16px rgba(255,0,0,0.3)"
                        : "none",
                      "&:hover": {
                        background:
                          urlType === "magnet"
                            ? "linear-gradient(135deg, #FFA726 0%, #FB8C00 100%)"
                            : "linear-gradient(135deg, #ff1a1a 0%, #e60000 100%)",
                        boxShadow: "0 6px 20px rgba(255,0,0,0.4)",
                      },
                      "&:disabled": {
                        background: "rgba(255,255,255,0.05)",
                      },
                      transition: "all 0.2s ease",
                    }}
                  >
                    {urlType === "magnet" ? (
                      <FolderIcon />
                    ) : (
                      <CloudUploadIcon />
                    )}
                  </Button>
                </span>
              </Tooltip>
            </Box>

            {/* Torrent button */}
            <Box sx={{ mt: 3, textAlign: "center" }}>
              <Button
                variant="outlined"
                startIcon={<FolderIcon />}
                onClick={() => setShowTorrent(true)}
                sx={{
                  borderColor: "rgba(255,152,0,0.5)",
                  color: "#FF9800",
                  borderRadius: 2,
                  textTransform: "none",
                  "&:hover": {
                    borderColor: "#FF9800",
                    backgroundColor: "rgba(255,152,0,0.1)",
                  },
                }}
              >
                Adicionar Torrent
              </Button>
            </Box>
          </Box>
        </DialogContent>
      </BootstrapDialog>

      <AdvancedConversionModal
        open={showAdvanced}
        onClose={() => {
          setShowAdvanced(false);
          setVideo([]);
        }}
        onConvert={handleAdvancedConvert}
      />

      <TorrentDialog
        open={showTorrent}
        onClose={() => setShowTorrent(false)}
        onTorrentAdded={handleTorrentAdded}
      />
    </div>
  );
}
