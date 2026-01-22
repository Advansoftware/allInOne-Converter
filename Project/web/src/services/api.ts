import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default api;

// ============================================
// Conversion Service
// ============================================
export interface ConversionOptions {
  format?: string;
  ffmpeg_params?: string;
}

export const conversionService = {
  getProfiles: () => api.get('/conversion/profiles'),

  upload: (file: File, options?: ConversionOptions, onProgress?: (progress: number) => void) => {
    const formData = new FormData();
    formData.append('file', file);

    // Add conversion options if provided
    if (options?.format) {
      formData.append('format', options.format);
    }
    if (options?.ffmpeg_params) {
      formData.append('ffmpeg_params', options.ffmpeg_params);
    }

    return api.post('/conversion/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });
  },

  convert: (filePath: string, profile: string, ffmpegParams?: string) =>
    api.post('/conversion/convert', { file_path: filePath, profile, ffmpeg_params: ffmpegParams }),

  getStatus: (jobId: string) => api.get(`/conversion/status/${jobId}`),

  download: (jobId: string) => api.get(`/conversion/download/${jobId}`, { responseType: 'blob' }),
};

// ============================================
// Download Service (yt-dlp)
// ============================================
export const downloadService = {
  getInfo: (url: string) => api.post('/download/info', { url }),

  start: (url: string, format?: string, convertTo?: string) =>
    api.post('/download/start', { url, format, convert_to: convertTo }),

  getStatus: (jobId: string) => api.get(`/download/status/${jobId}`),

  getSupportedSites: () => api.get('/download/supported'),
};

// ============================================
// Torrent Service
// ============================================
export const torrentService = {
  addMagnet: (magnetUrl: string) =>
    api.post('/torrent/add/magnet', { magnet_url: magnetUrl }),

  addFile: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/torrent/add/file', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  parse: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/torrent/parse', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  parseMagnet: (magnetUrl: string) =>
    api.post('/torrent/parse/magnet', { magnet_url: magnetUrl }),

  getStatus: (jobId: string) => api.get(`/torrent/status/${jobId}`),

  selectFiles: (jobId: string, fileIndices: number[], convertTo?: string) =>
    api.post('/torrent/select-files', { job_id: jobId, file_indices: fileIndices, convert_to: convertTo }),

  pause: (jobId: string) => api.post(`/torrent/pause/${jobId}`),

  resume: (jobId: string) => api.post(`/torrent/resume/${jobId}`),

  remove: (jobId: string, deleteFiles = false) =>
    api.delete(`/torrent/${jobId}`, { params: { delete_files: deleteFiles } }),

  getFiles: (jobId: string) => api.get(`/torrent/files/${jobId}`),

  list: () => api.get('/torrent/list'),
};

// ============================================
// Stream Service
// ============================================
export const streamService = {
  prepare: (filePath: string, quality = '720p') =>
    api.post('/stream/prepare', { file_path: filePath, quality }),

  getStatus: (streamId: string) => api.get(`/stream/status/${streamId}`),

  preview: (filePath: string, startTime = '00:00:00', duration = 30) =>
    api.post('/stream/preview', { file_path: filePath, start_time: startTime, duration }),

  getThumbnail: (filePath: string, time = '00:00:01') =>
    api.get('/stream/thumbnail', { params: { file_path: filePath, time }, responseType: 'blob' }),

  getPlaylistUrl: (streamId: string) => `${API_URL}/api/stream/${streamId}/playlist.m3u8`,

  deletePreview: (previewId: string) => api.delete(`/stream/preview/${previewId}`),

  cleanupCache: (maxAgeHours = 24) =>
    api.post('/stream/cache/cleanup', { max_age_hours: maxAgeHours }),
};

// ============================================
// Queue Service
// ============================================
export const queueService = {
  getAll: (type?: string, status?: string, limit = 50) =>
    api.get('/queue', { params: { type, status, limit } }),

  getStats: () => api.get('/queue/stats'),

  get: (jobId: string) => api.get(`/queue/${jobId}`),

  remove: (jobId: string) => api.delete(`/queue/${jobId}`),
};

// ============================================
// Types
// ============================================
export interface ConversionProfile {
  id: string;
  name: string;
  description: string;
  extension: string;
  params: string;
}

export interface JobStatus {
  job_id: string;
  status: 'pending' | 'processing' | 'downloading' | 'converting' | 'completed' | 'failed' | 'paused';
  progress: number;
  output_path?: string;
  error?: string;
  title?: string;
  thumbnail?: string;
}

export interface TorrentFile {
  index: number;
  name: string;
  size: number;
  priority: number;
  progress: number;
}

export interface TorrentStatus extends JobStatus {
  download_rate: number;
  upload_rate: number;
  num_peers: number;
  num_seeds: number;
  files: TorrentFile[];
  name?: string;
}

export interface QueueItem extends JobStatus {
  type: 'conversion' | 'download' | 'torrent';
}
