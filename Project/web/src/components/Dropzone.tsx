import { useEffect } from "react";
import {
  Box,
  Button,
  Grid,
  Typography,
} from "@mui/material";
import { useDropzone, DropzoneOptions } from "react-dropzone";
import ModalImage from "../assets/modalImage.svg";

interface DropzoneProps {
  disabled?: boolean;
  setStarter?: (value: boolean) => void;
  files?: File[];
  onDrop?: (acceptedFiles: File[]) => void;
}

const Dropzone = ({
  disabled = false,
  setStarter,
  files,
  onDrop,
}: DropzoneProps) => {
  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    accept: { "video/*": [], "audio/*": [], "image/*": [] },
    maxFiles: 1,
    disabled,
    multiple: false,
    noClick: true,
    noKeyboard: true,
    onDrop,
  } as DropzoneOptions);

  useEffect(() => {
    if (disabled && setStarter) {
      setStarter(true);
    }
  }, [disabled, setStarter]);

  return (
    <Box
      {...getRootProps()}
      sx={{
        border: isDragActive ? "3px solid #FF0000" : "2px dashed #FF0000",
        borderRadius: 4,
        background: isDragActive ? "rgba(255,0,0,0.04)" : "rgba(24,26,32,0.98)",
        boxShadow: isDragActive
          ? "0 0 24px 0 #FF0000"
          : "0 2px 12px 0 rgba(255,0,0,0.08)",
        p: 4,
        transition: "all 0.18s",
        cursor: disabled ? "not-allowed" : "pointer",
        textAlign: "center",
        mb: 2,
      }}
    >
      <input {...getInputProps()} />
      <Grid item xs={12} sx={{ textAlign: "center" }}>
        <Box
          component="img"
          src={ModalImage}
          alt="Modal Image"
          sx={{
            width: "10rem",
            filter: "drop-shadow(0 2px 12px #ff000055)",
          }}
        />
      </Grid>
      <Grid item>
        <Typography
          variant="h5"
          sx={{ color: "#FF0000", fontWeight: 700, mb: 1 }}
        >
          Arraste e solte os arquivos de vídeo para enviar
        </Typography>
        <Typography variant="body2" sx={{ color: "#fff", opacity: 0.7, mb: 2 }}>
          Ou clique no botão abaixo para selecionar
        </Typography>
      </Grid>
      <Grid item xs={12} textAlign="center">
        <Button
          autoFocus
          onClick={open}
          variant="contained"
          color="primary"
          disabled={disabled}
          sx={{
            background: "#FF0000",
            fontWeight: 700,
            borderRadius: 2,
            px: 3,
            py: 1.2,
            fontSize: 16,
            boxShadow: "0 2px 8px 0 rgba(255,0,0,0.10)",
            "&:hover": {
              background: "#d90000",
              boxShadow: "0 4px 16px 0 rgba(255,0,0,0.18)",
            },
          }}
        >
          Selecionar Arquivos
        </Button>
      </Grid>
    </Box>
  );
};

export default Dropzone;
