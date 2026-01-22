import React, { useState, useCallback, useRef } from "react";
import {
  Box,
  Paper,
  TextField,
  Button,
  IconButton,
  Typography,
  CircularProgress,
  Snackbar,
  Alert,
} from "@mui/material";
import {
  CloudUpload as UploadIcon,
  Send as SendIcon,
  AttachFile as FileIcon,
} from "@mui/icons-material";
import { useDropzone } from "react-dropzone";

interface MediaInputProps {
  onSubmitUrl: (url: string) => Promise<any>;
  onSubmitFile: (
    file: File,
    onProgress?: (progress: number) => void,
  ) => Promise<any>;
  disabled?: boolean;
}

export const MediaInput: React.FC<MediaInputProps> = ({
  onSubmitUrl,
  onSubmitFile,
  disabled = false,
}) => {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmitUrl = async () => {
    if (!url.trim()) return;

    setLoading(true);
    setError(null);

    try {
      await onSubmitUrl(url.trim());
      setUrl("");
      setSuccess(true);
    } catch (err: any) {
      setError(
        err.response?.data?.error || err.message || "Erro ao enviar URL",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = useCallback(
    async (file: File) => {
      setLoading(true);
      setUploadProgress(0);
      setError(null);

      try {
        await onSubmitFile(file, (progress) => {
          setUploadProgress(progress);
        });
        setSuccess(true);
      } catch (err: any) {
        setError(
          err.response?.data?.error || err.message || "Erro ao enviar arquivo",
        );
      } finally {
        setLoading(false);
        setUploadProgress(0);
      }
    },
    [onSubmitFile],
  );

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        handleFileUpload(acceptedFiles[0]);
      }
    },
    [handleFileUpload],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    noClick: true,
    disabled: disabled || loading,
  });

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && url.trim()) {
      handleSubmitUrl();
    }
  };

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
      e.target.value = ""; // Reset input
    }
  };

  return (
    <>
      <Paper
        {...getRootProps()}
        elevation={3}
        sx={{
          p: 3,
          backgroundColor: isDragActive
            ? "rgba(255,0,0,0.1)"
            : "rgba(255,255,255,0.05)",
          border: isDragActive
            ? "2px dashed #FF0000"
            : "2px dashed rgba(255,255,255,0.2)",
          borderRadius: 3,
          transition: "all 0.3s ease",
        }}
      >
        <input {...getInputProps()} />
        <input
          ref={fileInputRef}
          type="file"
          hidden
          accept="video/*,audio/*,.torrent"
          onChange={handleFileChange}
        />

        {isDragActive ? (
          <Box sx={{ textAlign: "center", py: 4 }}>
            <UploadIcon sx={{ fontSize: 48, color: "#FF0000", mb: 1 }} />
            <Typography variant="h6" color="primary">
              Solte o arquivo aqui
            </Typography>
          </Box>
        ) : (
          <Box>
            {/* URL Input */}
            <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
              <TextField
                fullWidth
                placeholder="Cole uma URL do YouTube, Vimeo, ou link magnet..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={disabled || loading}
                variant="outlined"
                size="medium"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    backgroundColor: "rgba(255,255,255,0.05)",
                    "& fieldset": {
                      borderColor: "rgba(255,255,255,0.2)",
                    },
                    "&:hover fieldset": {
                      borderColor: "rgba(255,0,0,0.5)",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "#FF0000",
                    },
                  },
                }}
              />

              <Button
                variant="contained"
                onClick={handleSubmitUrl}
                disabled={!url.trim() || loading}
                sx={{
                  backgroundColor: "#FF0000",
                  minWidth: 56,
                  height: 56,
                  "&:hover": {
                    backgroundColor: "#CC0000",
                  },
                }}
              >
                {loading && !uploadProgress ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  <SendIcon />
                )}
              </Button>
            </Box>

            {/* Divider */}
            <Box sx={{ display: "flex", alignItems: "center", my: 2 }}>
              <Box
                sx={{
                  flex: 1,
                  height: 1,
                  backgroundColor: "rgba(255,255,255,0.1)",
                }}
              />
              <Typography sx={{ px: 2, color: "text.secondary" }}>
                ou
              </Typography>
              <Box
                sx={{
                  flex: 1,
                  height: 1,
                  backgroundColor: "rgba(255,255,255,0.1)",
                }}
              />
            </Box>

            {/* File Upload Button */}
            <Button
              fullWidth
              variant="outlined"
              onClick={handleFileClick}
              disabled={disabled || loading}
              startIcon={
                uploadProgress > 0 ? (
                  <CircularProgress
                    size={20}
                    variant="determinate"
                    value={uploadProgress}
                  />
                ) : (
                  <FileIcon />
                )
              }
              sx={{
                borderColor: "rgba(255,255,255,0.3)",
                color: "text.primary",
                py: 1.5,
                "&:hover": {
                  borderColor: "#FF0000",
                  backgroundColor: "rgba(255,0,0,0.1)",
                },
              }}
            >
              {uploadProgress > 0
                ? `Enviando... ${uploadProgress}%`
                : "Selecionar arquivo (ou arraste aqui)"}
            </Button>

            <Typography
              variant="caption"
              sx={{
                display: "block",
                mt: 1,
                textAlign: "center",
                color: "text.secondary",
              }}
            >
              Suporta vídeos, áudios, arquivos .torrent e links magnet
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Success Snackbar */}
      <Snackbar
        open={success}
        autoHideDuration={3000}
        onClose={() => setSuccess(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="success" onClose={() => setSuccess(false)}>
          Adicionado à fila! Acompanhe o progresso abaixo.
        </Alert>
      </Snackbar>

      {/* Error Snackbar */}
      <Snackbar
        open={!!error}
        autoHideDuration={5000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Snackbar>
    </>
  );
};

export default MediaInput;
