import { useState, useEffect, useCallback, useRef } from 'react';
import { queueService, conversionService, downloadService, torrentService, QueueItem, JobStatus, TorrentStatus, ConversionOptions } from '../services/api';
import websocketService, { JobUpdate } from '../services/websocket';

// ============================================
// useQueue Hook - WebSocket only (no polling)
// ============================================
export function useQueue(_pollInterval = 5000) {
  const [jobs, setJobs] = useState<QueueItem[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [wsConnected, setWsConnected] = useState(false);

  // Fetch jobs only once on mount
  const fetchJobs = useCallback(async () => {
    try {
      const [jobsRes, statsRes] = await Promise.all([
        queueService.getAll(),
        queueService.getStats(),
      ]);
      setJobs(jobsRes.data.jobs || []);
      setStats(statsRes.data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch only
  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // Handle WebSocket updates - NO POLLING
  useEffect(() => {
    const unsubscribe = websocketService.onJobUpdate((update: JobUpdate) => {
      console.log('📨 Job update via WebSocket:', update);

      setJobs(prevJobs => {
        const existingIndex = prevJobs.findIndex(j => j.job_id === update.job_id);
        const existingJob = existingIndex >= 0 ? prevJobs[existingIndex] : null;

        // Extract thumbnail from metadata or keep existing
        const thumbnail = update.metadata?.thumbnail
          || update.metadata?.thumbnail_url
          || (existingJob as any)?.thumbnail
          || undefined;

        const newJob = {
          job_id: update.job_id,
          type: update.type as 'conversion' | 'download' | 'torrent',
          status: update.status as QueueItem['status'],
          progress: update.progress,
          output_path: update.metadata?.output_path,
          error: update.error || undefined,
          title: update.metadata?.title || (existingJob as any)?.title || update.file_name || undefined,
          name: update.file_name || (existingJob as any)?.name || undefined,
          thumbnail: thumbnail,
          // Keep additional metadata
          duration: update.metadata?.duration || (existingJob as any)?.duration,
          format: update.metadata?.format || (existingJob as any)?.format,
        } as QueueItem;

        if (existingIndex >= 0) {
          const updated = [...prevJobs];
          updated[existingIndex] = { ...prevJobs[existingIndex], ...newJob };
          return updated;
        } else {
          return [newJob, ...prevJobs];
        }
      });
    });

    // Track connection status
    setWsConnected(websocketService.isConnected());
    const connectionCheck = setInterval(() => {
      setWsConnected(websocketService.isConnected());
    }, 5000);

    return () => {
      unsubscribe();
      clearInterval(connectionCheck);
    };
  }, []);

  const removeJob = useCallback(async (jobId: string) => {
    try {
      await queueService.remove(jobId);
      setJobs((prev) => prev.filter((j) => j.job_id !== jobId));
    } catch (err: any) {
      setError(err.message);
    }
  }, []);

  return { jobs, stats, loading, error, refresh: fetchJobs, removeJob, wsConnected };
}

// ============================================
// useJobStatus Hook - Poll single job status
// ============================================
export function useJobStatus(jobId: string | null, type: 'conversion' | 'download' | 'torrent', pollInterval = 1000) {
  const [status, setStatus] = useState<JobStatus | TorrentStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchStatus = useCallback(async () => {
    if (!jobId) return;

    try {
      let response;
      switch (type) {
        case 'conversion':
          response = await conversionService.getStatus(jobId);
          break;
        case 'download':
          response = await downloadService.getStatus(jobId);
          break;
        case 'torrent':
          response = await torrentService.getStatus(jobId);
          break;
      }
      setStatus(response.data);
      setError(null);

      // Stop polling if completed or failed
      if (['completed', 'failed'].includes(response.data.status)) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [jobId, type]);

  useEffect(() => {
    if (!jobId) {
      setStatus(null);
      return;
    }

    setLoading(true);
    fetchStatus();
    intervalRef.current = setInterval(fetchStatus, pollInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [jobId, fetchStatus, pollInterval]);

  return { status, loading, error, refresh: fetchStatus };
}

// ============================================
// useUpload Hook - Handle file uploads
// ============================================
export function useUpload() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const upload = useCallback(async (
    file: File,
    options?: ConversionOptions,
    onProgress?: (progress: number) => void
  ) => {
    setUploading(true);
    setProgress(0);
    setError(null);

    try {
      const response = await conversionService.upload(file, options, (prog) => {
        setProgress(prog);
        onProgress?.(prog);
      });
      return response.data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setUploading(false);
    }
  }, []);

  return { upload, uploading, progress, error };
}

// ============================================
// useConversion Hook - Handle conversions
// ============================================
export function useConversion() {
  const [converting, setConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startConversion = useCallback(async (filePath: string, profile: string, ffmpegParams?: string) => {
    setConverting(true);
    setError(null);

    try {
      const response = await conversionService.convert(filePath, profile, ffmpegParams);
      return response.data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setConverting(false);
    }
  }, []);

  return { startConversion, converting, error };
}

// ============================================
// useDownload Hook - Handle URL downloads
// ============================================
export function useDownload() {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getInfo = useCallback(async (url: string) => {
    try {
      const response = await downloadService.getInfo(url);
      return response.data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, []);

  const startDownload = useCallback(async (url: string, format?: string, convertTo?: string) => {
    setDownloading(true);
    setError(null);

    try {
      const response = await downloadService.start(url, format, convertTo);
      return response.data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setDownloading(false);
    }
  }, []);

  return { getInfo, startDownload, downloading, error };
}

// ============================================
// useTorrent Hook - Handle torrent downloads
// ============================================
export function useTorrent() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addMagnet = useCallback(async (magnetUrl: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await torrentService.addMagnet(magnetUrl);
      return response.data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const addFile = useCallback(async (file: File) => {
    setLoading(true);
    setError(null);

    try {
      const response = await torrentService.addFile(file);
      return response.data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const parseFile = useCallback(async (file: File) => {
    try {
      const response = await torrentService.parse(file);
      return response.data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, []);

  const parseMagnet = useCallback(async (magnetUrl: string) => {
    try {
      const response = await torrentService.parseMagnet(magnetUrl);
      return response.data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, []);

  const selectFiles = useCallback(async (jobId: string, fileIndices: number[], convertTo?: string) => {
    try {
      const response = await torrentService.selectFiles(jobId, fileIndices, convertTo);
      return response.data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, []);

  const pause = useCallback(async (jobId: string) => {
    try {
      await torrentService.pause(jobId);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, []);

  const resume = useCallback(async (jobId: string) => {
    try {
      await torrentService.resume(jobId);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, []);

  const remove = useCallback(async (jobId: string, deleteFiles = false) => {
    try {
      await torrentService.remove(jobId, deleteFiles);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, []);

  const listTorrents = useCallback(async () => {
    try {
      const response = await torrentService.list();
      return response.data.torrents || [];
    } catch (err: any) {
      setError(err.message);
      return [];
    }
  }, []);

  return {
    addMagnet,
    addFile,
    parseFile,
    parseMagnet,
    selectFiles,
    pause,
    resume,
    remove,
    listTorrents,
    loading,
    error,
  };
}
