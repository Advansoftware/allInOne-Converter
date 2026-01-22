import { useState, useEffect } from "react";
import { Box, Typography } from "@mui/material";
import ConverterPageButton from "./ConverterPageButton";
import UploadQueue from "./UploadQueue";
import DialogUpload from "./DialogUpload";
import TorrentManager from "./TorrentManager";
import { useQueue } from "../hooks/useApi";
import { QueueItem } from "../services/api";

function Dashboard() {
  const [open, setOpen] = useState(false);
  const [torrentJobId, setTorrentJobId] = useState<string | null>(null);
  const { jobs, stats, loading, refresh, removeJob } = useQueue(2000);

  // Transform queue items to upload format
  const uploads = jobs.map((job: QueueItem) => ({
    id: job.job_id,
    name: (job as any).title || (job as any).name || job.job_id.slice(0, 8),
    date: new Date().toLocaleDateString(),
    thumbnail: (job as any).thumbnail || "/src/assets/modalImage.svg",
    progress: job.progress,
    status: mapStatus(job.status, job.type),
    type: job.type,
    downloadUrl: job.output_path,
  }));

  function mapStatus(
    status: string,
    type: string,
  ): "enviando" | "convertendo" | "pronto" | "torrent" {
    if (type === "torrent") return "torrent" as any;
    switch (status) {
      case "pending":
      case "downloading":
        return "enviando";
      case "processing":
      case "converting":
        return "convertendo";
      case "completed":
        return "pronto";
      default:
        return "enviando";
    }
  }

  const handleDownload = (id: string) => {
    const job = jobs.find((j: QueueItem) => j.job_id === id);
    if (job?.output_path) {
      window.open(
        `http://localhost:8080/api/conversion/download/${id}`,
        "_blank",
      );
    }
  };

  const handleOpenTorrent = (jobId: string) => {
    setTorrentJobId(jobId);
  };

  const handleRemove = async (id: string) => {
    await removeJob(id);
  };

  const addUpload = (file: {
    name: string;
    thumbnail: string;
    jobId?: string;
    type?: string;
  }) => {
    // The queue hook will automatically pick up new jobs
    refresh();

    // If it's a torrent, open the manager
    if (file.type === "torrent" && file.jobId) {
      setTorrentJobId(file.jobId);
    }
  };

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: { xs: 2, sm: 4 },
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Typography
          variant="h4"
          color="text.primary"
          sx={{ fontSize: { xs: 24, sm: 28, md: 32 } }}
        >
          Painel do Canal
        </Typography>

        {stats && (
          <Box sx={{ display: "flex", gap: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Processando:{" "}
              {(stats.conversion?.processing || 0) +
                (stats.download?.processing || 0)}
            </Typography>
            <Typography variant="body2" color="success.main">
              Concluídos:{" "}
              {(stats.conversion?.completed || 0) +
                (stats.download?.completed || 0)}
            </Typography>
          </Box>
        )}
      </Box>

      <ConverterPageButton setOpen={setOpen} />

      <DialogUpload open={open} setOpen={setOpen} addUpload={addUpload} />

      <UploadQueue
        uploads={uploads}
        onDownload={handleDownload}
        onOpenTorrent={handleOpenTorrent}
        onRemove={handleRemove}
      />

      {torrentJobId && (
        <TorrentManager
          open={!!torrentJobId}
          onClose={() => setTorrentJobId(null)}
          jobId={torrentJobId}
        />
      )}
    </Box>
  );
}

export default Dashboard;
