import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Grid,
  Paper,
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";

interface Profile {
  id: string;
  name: string;
  description: string;
  ffmpeg: string;
}

interface ConversionModalProps {
  open: boolean;
  profiles: Profile[];
  onClose: () => void;
  onSelect: (profile: Profile) => void;
}

const ConversionModal: React.FC<ConversionModalProps> = ({
  open,
  profiles,
  onClose,
  onSelect,
}) => {
  const [selected, setSelected] = React.useState<string>("");

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { background: "#23242b", borderRadius: 3, p: 2 },
      }}
    >
      <DialogTitle
        sx={{ color: "#FF0000", fontWeight: 700, textAlign: "center" }}
      >
        Escolha o Perfil de Conversão
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={2}>
          {profiles.map((profile) => (
            <Grid item xs={12} key={profile.id}>
              <Paper
                elevation={selected === profile.id ? 8 : 2}
                sx={{
                  p: 2,
                  borderRadius: 2,
                  background: selected === profile.id ? "#181A20" : "#23242b",
                  border:
                    selected === profile.id
                      ? "2px solid #FF0000"
                      : "1px solid #333",
                  cursor: "pointer",
                  transition: "all 0.18s",
                  "&:hover": {
                    border: "2px solid #FF0000",
                    background: "#181A20",
                  },
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                }}
                onClick={() => setSelected(profile.id)}
              >
                <Box>
                  <Typography
                    sx={{ color: "#FF0000", fontWeight: 700, fontSize: 18 }}
                  >
                    {profile.name}
                  </Typography>
                  <Typography
                    sx={{ color: "#fff", opacity: 0.8, fontSize: 15 }}
                  >
                    {profile.description}
                  </Typography>
                  <Typography
                    sx={{
                      color: "#aaa",
                      fontSize: 13,
                      mt: 1,
                      fontFamily: "monospace",
                    }}
                  >
                    {profile.ffmpeg}
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </DialogContent>
      <DialogActions sx={{ justifyContent: "center", pb: 2 }}>
        <Button onClick={onClose} sx={{ color: "#fff" }}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          startIcon={<DownloadIcon />}
          disabled={!selected}
          sx={{
            background: "#FF0000",
            color: "#fff",
            fontWeight: 700,
            borderRadius: 2,
            px: 3,
            "&:hover": { background: "#d90000" },
          }}
          onClick={() => {
            const profile = profiles.find((p) => p.id === selected);
            if (profile) onSelect(profile);
          }}
        >
          Confirmar Perfil
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConversionModal;
