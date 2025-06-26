import { Box, Typography, Grid, Button, useTheme } from "@mui/material";
import ProgressStatus from "./ProgressStatus";
import DownloadIcon from "@mui/icons-material/Download";
import CloudSyncOutlinedIcon from "@mui/icons-material/CloudSyncOutlined";
import React from "react";

interface UploadItem {
  id: string;
  name: string;
  date: string;
  thumbnail: string;
  progress: number;
  status: "enviando" | "convertendo" | "pronto";
  downloadUrl?: string;
}

interface UploadQueueProps {
  uploads: UploadItem[];
  onDownload: (id: string) => void;
}

const statusText = {
  enviando: "Enviando",
  convertendo: "Convertendo",
  pronto: "Fazer Download",
};

export default function UploadQueue({ uploads, onDownload }: UploadQueueProps) {
  const theme = useTheme();
  return (
    <Box
      sx={{
        background: "#181A20",
        borderRadius: 4,
        p: { xs: 2, md: 4 },
        mt: 4,
        boxShadow: "0 4px 32px 0 rgba(0,0,0,0.18)",
        minHeight: 320,
        maxWidth: 900,
        mx: "auto",
      }}
    >
      <Typography
        variant="h5"
        sx={{
          color: "#fff",
          mb: 3,
          fontWeight: 700,
          letterSpacing: 1,
          textAlign: "center",
        }}
      >
        Fila de Conversão
      </Typography>
      {uploads.length === 0 && (
        <Typography color="#aaa" sx={{ textAlign: "center", mt: 6 }}>
          Nenhum arquivo na fila.
        </Typography>
      )}
      <Grid container spacing={2}>
        {uploads.map((item) => (
          <Grid item xs={12} key={item.id}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                background: "#23242b",
                borderRadius: 3,
                boxShadow: "0 2px 8px 0 rgba(0,0,0,0.10)",
                p: { xs: 2, md: 3 },
                position: "relative",
                minHeight: 100,
                mb: 2,
                gap: 2,
              }}
            >
              <Box
                component="img"
                src={item.thumbnail}
                alt={item.name}
                sx={{
                  width: 180, // 120 * 1.5
                  height: 120, // 80 * 1.5
                  objectFit: "cover",
                  borderRadius: 2,
                  boxShadow: "0 1px 6px 0 rgba(0,0,0,0.10)",
                  mr: 3,
                  border:
                    item.status === "pronto"
                      ? "2px solid #FF0000"
                      : "2px solid #23242b",
                  transition: "border 0.2s",
                  flexShrink: 0,
                }}
              />
              {item.status !== "pronto" && (
                <Box
                  sx={{
                    position: "absolute",
                    left: 25,
                    top: 26,
                    width: 182,
                    height: 120,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    pointerEvents: "none",
                    background: "rgba(24,26,32,0.60)",
                    borderRadius: 2,
                  }}
                >
                  <Box
                    sx={{
                      width: 72,
                      height: 72,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "rgba(0,0,0,0.10)",
                      borderRadius: "50%",
                    }}
                  >
                    <ProgressStatus porcentage={item.progress} />
                  </Box>
                </Box>
              )}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  sx={{
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: 18,
                    mb: 0.5,
                    textOverflow: "ellipsis",
                    overflow: "hidden",
                    whiteSpace: "nowrap",
                  }}
                  title={item.name}
                >
                  {item.name}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: "#aaa", fontSize: 13 }}
                >
                  {item.date}
                </Typography>
              </Box>
              <Box sx={{ minWidth: 160, textAlign: "right" }}>
                {item.status === "enviando" && (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <CloudSyncOutlinedIcon
                      htmlColor="#FF0000"
                      fontSize="small"
                    />
                    <Typography
                      variant="caption"
                      color="textSecondary"
                      sx={{ ml: 0.5, color: "#FF0000", fontWeight: 600 }}
                    >
                      {statusText[item.status]}
                    </Typography>
                  </Box>
                )}
                {item.status === "convertendo" && (
                  <Typography
                    variant="caption"
                    color="textSecondary"
                    sx={{ color: "#fbc02d", fontWeight: 600 }}
                  >
                    {statusText[item.status]}
                  </Typography>
                )}
                {item.status === "pronto" && (
                  <Button
                    variant="contained"
                    startIcon={<DownloadIcon />}
                    onClick={() => onDownload(item.id)}
                    color="primary"
                    sx={{
                      color: "#fff",
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
                    {statusText[item.status]}
                  </Button>
                )}
              </Box>
            </Box>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

// Animação pulse para status
const style = document.createElement("style");
style.innerHTML = `@keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(255,0,0,0.18); } 100% { box-shadow: 0 0 0 8px rgba(255,0,0,0.04); } }`;
document.head.appendChild(style);
