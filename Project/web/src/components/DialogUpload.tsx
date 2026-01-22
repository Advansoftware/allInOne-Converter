import * as Mui from "@mui/material/styles";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import Typography from "@mui/material/Typography";
import { Box, TextField, Button, useMediaQuery, Fade, Slide } from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import LinkIcon from "@mui/icons-material/Link";
import VideoFileIcon from "@mui/icons-material/VideoFile";
import { useEffect, useState, forwardRef } from "react";
import { useDropzone } from "react-dropzone";
import AdvancedConversionModal from "./AdvancedConversionModal";

const Transition = forwardRef(function Transition(props: any, ref: React.Ref<unknown>) {
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
        background: "linear-gradient(90deg, rgba(255,0,0,0.1) 0%, transparent 100%)",
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
              color: "#FF0000" 
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
  addUpload: (file: { name: string; thumbnail: string }) => void;
}

export default function DialogUpload({
  open,
  setOpen,
  addUpload,
}: DialogUploadProps) {
  const theme = Mui.useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [url, setUrl] = useState("");
  const [video, setVideo] = useState<File[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);

  const { getRootProps, getInputProps, open: openFileDialog } = useDropzone({
    accept: { "video/*": [], "audio/*": [], "image/*": [] },
    maxFiles: 1,
    multiple: false,
    noClick: true,
    noKeyboard: true,
    onDrop: (acceptedFiles) => {
      setVideo(acceptedFiles);
    },
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false),
  });

  const handleClose = () => {
    setOpen(false);
    setShowAdvanced(false);
    setVideo([]);
    setUrl("");
  };

  useEffect(() => {
    if (video.length > 0 && !showAdvanced) {
      setShowAdvanced(true);
    }
  }, [video]);

  const handleAdvancedConvert = (options: any) => {
    if (video.length > 0) {
      const file = video[0];
      const thumbnail =
        file.type.startsWith("image/") || file.type.startsWith("video/")
          ? URL.createObjectURL(file)
          : "/src/assets/modalImage.svg";
      addUpload({ name: file.name, thumbnail });
      setOpen(false);
      setShowAdvanced(false);
      setVideo([]);
    }
  };

  const handleUrlSubmit = () => {
    if (url.trim()) {
      addUpload({ name: url, thumbnail: "/src/assets/modalImage.svg" });
      setOpen(false);
      setUrl("");
    }
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
      >
        <BootstrapDialogTitle id="customized-dialog-title" onClose={handleClose}>
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
                "&::before": isDragActive ? {
                  content: '""',
                  position: "absolute",
                  inset: 0,
                  background: "radial-gradient(circle at center, rgba(255,0,0,0.1) 0%, transparent 70%)",
                  animation: "pulse 2s infinite",
                } : {},
              }}
            >
              <input {...getInputProps()} />
              
              <Box
                sx={{
                  width: 72,
                  height: 72,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, rgba(255,0,0,0.15) 0%, rgba(255,0,0,0.05) 100%)",
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
                Suporta vídeos, áudios e imagens
              </Typography>

              <Button
                onClick={openFileDialog}
                variant="contained"
                startIcon={<CloudUploadIcon />}
                sx={{
                  background: "linear-gradient(135deg, #FF0000 0%, #cc0000 100%)",
                  fontWeight: 600,
                  borderRadius: 2,
                  px: 4,
                  py: 1.2,
                  fontSize: 15,
                  textTransform: "none",
                  boxShadow: "0 4px 20px rgba(255,0,0,0.3)",
                  "&:hover": {
                    background: "linear-gradient(135deg, #ff1a1a 0%, #e60000 100%)",
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
              <Box sx={{ flex: 1, height: 1, background: "rgba(255,255,255,0.1)" }} />
              <Typography 
                sx={{ 
                  color: "rgba(255,255,255,0.4)", 
                  fontSize: 13,
                  fontWeight: 500,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                }}
              >
                ou cole uma URL
              </Typography>
              <Box sx={{ flex: 1, height: 1, background: "rgba(255,255,255,0.1)" }} />
            </Box>

            {/* URL Input */}
            <Box sx={{ display: "flex", gap: 1.5 }}>
              <StyledTextField
                fullWidth
                placeholder="https://youtube.com/watch?v=..."
                variant="outlined"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleUrlSubmit()}
                InputProps={{
                  startAdornment: (
                    <LinkIcon sx={{ color: "rgba(255,255,255,0.3)", mr: 1.5 }} />
                  ),
                }}
              />
              <Button
                onClick={handleUrlSubmit}
                disabled={!url.trim()}
                variant="contained"
                sx={{
                  minWidth: 56,
                  height: 56,
                  borderRadius: 3,
                  background: url.trim() 
                    ? "linear-gradient(135deg, #FF0000 0%, #cc0000 100%)"
                    : "rgba(255,255,255,0.05)",
                  boxShadow: url.trim() ? "0 4px 16px rgba(255,0,0,0.3)" : "none",
                  "&:hover": {
                    background: "linear-gradient(135deg, #ff1a1a 0%, #e60000 100%)",
                    boxShadow: "0 6px 20px rgba(255,0,0,0.4)",
                  },
                  "&:disabled": {
                    background: "rgba(255,255,255,0.05)",
                  },
                  transition: "all 0.2s ease",
                }}
              >
                <CloudUploadIcon />
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
    </div>
  );
}
