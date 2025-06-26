import { Box, Typography, Grid, Button } from "@mui/material";
import ProgressStatus from "./ProgressStatus";
import DownloadIcon from "@mui/icons-material/Download";
import CloudSyncOutlinedIcon from "@mui/icons-material/CloudSyncOutlined";
import React, { useState } from "react";

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
  return (
    <Box sx={{ background: "#232323", borderRadius: 2, p: 3, mt: 4 }}>
      <Typography variant="h6" sx={{ color: "#fff", mb: 2 }}>
        FILA DE CONVERSÃO
      </Typography>
      {uploads.length === 0 && (
        <Typography color="#aaa">Nenhum arquivo na fila.</Typography>
      )}

      {uploads.map((item) => (
        <Grid
          container
          alignItems="center"
          spacing={2}
          sx={{ mb: 2, background: "#181818", borderRadius: 2, p: 1 }}
          key={item.id}
        >
          <Grid item md={3} sx={{ position: "relative" }}>
            <Box
              component="img"
              src={item.thumbnail}
              alt={item.name}
              sx={{
                width: 270,
                height: 153,
                objectFit: "cover",
                borderRadius: 1,
                display: "block",
              }}
            />
            {item.status !== "pronto" && (
              <Box
                sx={{
                  position: "absolute",
                  left: 10,
                  top: 10,
                  width: 270,
                  height: 153,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  pointerEvents: "none",
                }}
              >
                <Box
                  sx={{
                    width: 72,
                    height: 72,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <ProgressStatus porcentage={item.progress} />
                </Box>
              </Box>
            )}
          </Grid>
          <Grid item md={6}>
            <Typography sx={{ color: "#fff", fontWeight: 500 }}>
              {item.name}
            </Typography>
            <Typography variant="caption" sx={{ color: "#aaa" }}>
              {item.date}
            </Typography>
          </Grid>
          <Grid item>
            {item.status === "enviando" && (
              <>
                <CloudSyncOutlinedIcon htmlColor="#7184fb" />
                <Typography
                  variant="caption"
                  color="textSecondary"
                  sx={{ ml: 1 }}
                >
                  {statusText[item.status]}
                </Typography>
              </>
            )}
            {item.status === "convertendo" && (
              <Typography variant="caption" color="textSecondary">
                {statusText[item.status]}
              </Typography>
            )}
            {item.status === "pronto" && (
              <Button
                variant="text"
                startIcon={<DownloadIcon />}
                onClick={() => onDownload(item.id)}
                sx={{ color: "#fff" }}
              >
                {statusText[item.status]}
              </Button>
            )}
          </Grid>
        </Grid>
      ))}
    </Box>
  );
}
