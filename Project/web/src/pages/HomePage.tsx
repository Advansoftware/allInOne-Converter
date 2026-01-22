import React from "react";
import { Box, Container, Typography, Chip } from "@mui/material";
import { Circle as CircleIcon } from "@mui/icons-material";
import MediaInput from "../components/MediaInput";
import QueueList from "../components/QueueList";
import useQueue from "../hooks/useQueue";

export const HomePage: React.FC = () => {
  const {
    queue,
    connected,
    submitUrl,
    submitFile,
    removeItem,
    getDownloadUrl,
  } = useQueue();

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: "#121212",
        color: "#fff",
        py: 4,
      }}
    >
      <Container maxWidth="md">
        {/* Header */}
        <Box sx={{ textAlign: "center", mb: 4 }}>
          <Typography
            variant="h3"
            sx={{
              fontWeight: 700,
              color: "#FF0000",
              mb: 1,
            }}
          >
            AllOne Converter
          </Typography>
          <Typography variant="body1" sx={{ color: "text.secondary" }}>
            Converta vídeos, baixe do YouTube, e muito mais
          </Typography>

          {/* Connection status */}
          <Chip
            icon={<CircleIcon sx={{ fontSize: 12 }} />}
            label={connected ? "Conectado" : "Desconectado"}
            size="small"
            sx={{
              mt: 2,
              backgroundColor: connected
                ? "rgba(0,255,0,0.1)"
                : "rgba(255,0,0,0.1)",
              color: connected ? "#00FF00" : "#FF0000",
              "& .MuiChip-icon": {
                color: connected ? "#00FF00" : "#FF0000",
              },
            }}
          />
        </Box>

        {/* Input Area */}
        <Box sx={{ mb: 4 }}>
          <MediaInput onSubmitUrl={submitUrl} onSubmitFile={submitFile} />
        </Box>

        {/* Queue */}
        <Box>
          <Typography
            variant="h6"
            sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}
          >
            Fila de Processamento
            {queue.length > 0 && (
              <Chip
                label={queue.length}
                size="small"
                sx={{
                  backgroundColor: "#FF0000",
                  color: "#fff",
                  fontWeight: 600,
                }}
              />
            )}
          </Typography>

          <QueueList
            items={queue}
            onRemove={removeItem}
            getDownloadUrl={getDownloadUrl}
          />
        </Box>
      </Container>
    </Box>
  );
};

export default HomePage;
