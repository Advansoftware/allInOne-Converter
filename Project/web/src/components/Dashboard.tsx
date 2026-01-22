import { useState, useEffect } from "react";
import { Box, Typography } from "@mui/material";
import ConverterPageButton from "./ConverterPageButton";
import UploadQueue from "./UploadQueue";
import DialogUpload from "./DialogUpload";
import TorrentManager from "./TorrentManager";
import ConfirmDeleteDialog from "./ConfirmDeleteDialog";
import VideoPreviewDialog from "./VideoPreviewDialog";
import AdvancedConversionModal from "./AdvancedConversionModal";
import JobDetailsModal, { JobDetails } from "./JobDetailsModal";
import { useQueue, useConversion } from "../hooks/useApi";
import { QueueItem } from "../services/api";

// Local upload item interface
interface LocalUpload {
  id: string;
  name: string;
  thumbnail: string;
  progress: number;
  status: "uploading" | "completed" | "failed";
  error?: string;
}

function Dashboard() {
  const [open, setOpen] = useState(false);
  const [torrentJobId, setTorrentJobId] = useState<string | null>(null);
  const [localUploads, setLocalUploads] = useState<LocalUpload[]>([]);
  const [previewJob, setPreviewJob] = useState<{
    id: string;
    name: string;
    status: string;
    outputPath?: string;
  } | null>(null);
  const [convertJob, setConvertJob] = useState<{
    id: string;
    name: string;
    filePath: string;
  } | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    id: string;
    name: string;
  }>({ open: false, id: "", name: "" });
  const [deleting, setDeleting] = useState(false);
  const [detailsJob, setDetailsJob] = useState<JobDetails | null>(null);
  const { jobs, stats, loading, refresh, removeJob } = useQueue(2000);
  const { startConversion } = useConversion();

  // Transform queue items to upload format
  // Combine local uploads with server jobs
  const serverUploads = jobs.map((job: QueueItem) => ({
    id: job.job_id,
    name: (job as any).title || (job as any).name || "",
    date: new Date().toLocaleDateString(),
    thumbnail: (job as any).thumbnail || "",
    progress:
      typeof job.progress === "string"
        ? parseFloat(job.progress) || 0
        : job.progress,
    status: mapStatus(String(job.status), job.type),
    type: job.type,
    downloadUrl: job.output_path,
    error: job.error,
  }));

  // Merge local uploads (uploading) with server uploads
  // Remove local uploads that have a matching server job
  const activeLocalUploads = localUploads.filter(
    (local) => !serverUploads.some((server) => server.id === local.id),
  );

  const uploads = [
    ...activeLocalUploads.map((u) => ({
      ...u,
      date: new Date().toLocaleDateString(),
      type: "conversion" as const,
      downloadUrl: undefined as string | undefined,
    })),
    ...serverUploads,
  ];

  function mapStatus(
    status: string,
    type: string,
  ):
    | "uploading"
    | "downloading"
    | "converting"
    | "completed"
    | "failed"
    | "pending" {
    switch (status) {
      case "pending":
        return "pending";
      case "uploading":
        return "uploading";
      case "downloading":
        return "downloading";
      case "processing":
      case "converting":
        return "converting";
      case "completed":
        return "completed";
      case "failed":
        return "failed";
      default:
        return "pending";
    }
  }

  // Functions to manage local uploads
  const addLocalUpload = (upload: LocalUpload) => {
    setLocalUploads((prev) => [upload, ...prev]);
  };

  const updateLocalUpload = (id: string, updates: Partial<LocalUpload>) => {
    setLocalUploads((prev) =>
      prev.map((u) => (u.id === id ? { ...u, ...updates } : u)),
    );
  };

  const removeLocalUpload = (id: string) => {
    setLocalUploads((prev) => prev.filter((u) => u.id !== id));
  };

  const handleDownload = (id: string) => {
    const job = jobs.find((j: QueueItem) => j.job_id === id);
    if (job?.output_path) {
      window.open(
        `http://localhost:8080/api/conversion/download/${id}`,
        "_blank",
      );
    }
  };

  const handleRowClick = (item: any) => {
    // Find the original job to get all available details
    const job = jobs.find((j: QueueItem) => j.job_id === item.id);
    setDetailsJob({
      id: item.id,
      name: item.name,
      date: item.date,
      thumbnail: item.thumbnail,
      progress: item.progress,
      status: item.status,
      type: item.type,
      downloadUrl: item.downloadUrl,
      error: item.error || (job as any)?.error,
      duration: (job as any)?.duration,
      format: (job as any)?.format,
      resolution: (job as any)?.resolution,
      fileSize: (job as any)?.fileSize,
      sourceUrl: (job as any)?.sourceUrl || (job as any)?.url,
    });
  };

  const handleOpenTorrent = (jobId: string) => {
    setTorrentJobId(jobId);
  };

  const handlePreview = (id: string) => {
    const upload = uploads.find((u) => u.id === id);
    if (upload) {
      setPreviewJob({
        id: upload.id,
        name: upload.name,
        status: upload.status,
        outputPath: upload.downloadUrl,
      });
    }
  };

  const handleRemoveClick = (id: string) => {
    const upload = uploads.find((u) => u.id === id);
    setDeleteDialog({
      open: true,
      id,
      name: upload?.name || id.slice(0, 8),
    });
  };

  const handleConfirmDelete = async () => {
    setDeleting(true);
    try {
      await removeJob(deleteDialog.id);
    } finally {
      setDeleting(false);
      setDeleteDialog({ open: false, id: "", name: "" });
    }
  };

  const handleCancelDelete = () => {
    setDeleteDialog({ open: false, id: "", name: "" });
  };

  const handleConvert = (id: string) => {
    const job = jobs.find((j: QueueItem) => j.job_id === id);
    if (job?.output_path) {
      setConvertJob({
        id,
        name: (job as any).title || (job as any).name || id.slice(0, 8),
        filePath: job.output_path,
      });
    }
  };

  const handleConversionSubmit = async (options: any) => {
    if (!convertJob) return;

    try {
      await startConversion(
        convertJob.filePath,
        options.format || "mp4",
        options.customArgs || undefined,
      );
      refresh();
    } catch (err) {
      console.error("Conversion failed:", err);
    } finally {
      setConvertJob(null);
    }
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

      <DialogUpload
        open={open}
        setOpen={setOpen}
        addUpload={addUpload}
        onUploadStart={(id, name, thumbnail) => {
          addLocalUpload({
            id,
            name,
            thumbnail,
            progress: 0,
            status: "uploading",
          });
        }}
        onUploadProgress={(id, progress) => {
          updateLocalUpload(id, { progress });
        }}
        onUploadComplete={(id, jobId) => {
          // Update the local upload with job id and mark for removal
          // The server job will appear and replace it
          updateLocalUpload(id, { id: jobId, status: "completed" });
          // Remove after a short delay to allow server job to appear
          setTimeout(() => removeLocalUpload(id), 1000);
        }}
        onUploadError={(id, error) => {
          updateLocalUpload(id, { status: "failed", error });
        }}
      />

      <UploadQueue
        uploads={uploads}
        onDownload={handleDownload}
        onOpenTorrent={handleOpenTorrent}
        onPreview={handlePreview}
        onRemove={handleRemoveClick}
        onConvert={handleConvert}
        onRowClick={handleRowClick}
      />

      <ConfirmDeleteDialog
        open={deleteDialog.open}
        itemName={deleteDialog.name}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        loading={deleting}
      />

      {previewJob && (
        <VideoPreviewDialog
          open={!!previewJob}
          onClose={() => setPreviewJob(null)}
          jobId={previewJob.id}
          name={previewJob.name}
          status={previewJob.status}
          outputPath={previewJob.outputPath}
        />
      )}

      {convertJob && (
        <AdvancedConversionModal
          open={!!convertJob}
          onClose={() => setConvertJob(null)}
          onConvert={handleConversionSubmit}
        />
      )}

      {torrentJobId && (
        <TorrentManager
          open={!!torrentJobId}
          onClose={() => setTorrentJobId(null)}
          jobId={torrentJobId}
        />
      )}

      <JobDetailsModal
        open={!!detailsJob}
        onClose={() => setDetailsJob(null)}
        job={detailsJob}
        onDownload={handleDownload}
        onPreview={handlePreview}
      />
    </Box>
  );
}

export default Dashboard;
