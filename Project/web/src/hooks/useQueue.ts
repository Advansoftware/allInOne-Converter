import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import websocketService, { JobUpdate } from '../services/websocket';

export interface QueueItem {
  id: string;
  type: 'file' | 'url' | 'torrent';
  status: 'queued' | 'uploading' | 'downloading' | 'converting' | 'completed' | 'failed';
  progress: number;
  fileName: string;
  error?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export function useQueue() {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [connected, setConnected] = useState(false);

  // Handle WebSocket updates
  useEffect(() => {
    const unsubscribe = websocketService.onJobUpdate((update: JobUpdate) => {
      setQueue(prevQueue => {
        const existingIndex = prevQueue.findIndex(item => item.id === update.job_id);

        const newItem: QueueItem = {
          id: update.job_id,
          type: update.type as QueueItem['type'],
          status: update.status as QueueItem['status'],
          progress: update.progress,
          fileName: update.file_name || 'Unknown',
          error: update.error || undefined,
          metadata: update.metadata || undefined,
          createdAt: existingIndex >= 0
            ? prevQueue[existingIndex].createdAt
            : new Date(),
        };

        if (existingIndex >= 0) {
          // Update existing item
          const newQueue = [...prevQueue];
          newQueue[existingIndex] = newItem;
          return newQueue;
        } else {
          // Add new item at the beginning
          return [newItem, ...prevQueue];
        }
      });
    });

    // Check connection status periodically
    const connectionCheck = setInterval(() => {
      setConnected(websocketService.isConnected());
    }, 1000);

    return () => {
      unsubscribe();
      clearInterval(connectionCheck);
    };
  }, []);

  // Submit new media (file, URL, or magnet)
  const submitMedia = useCallback(async (
    input: File | string,
    options?: {
      profile?: string;
      format?: string;
    }
  ) => {
    const formData = new FormData();

    if (input instanceof File) {
      formData.append('file', input);
    } else if (input.startsWith('magnet:')) {
      formData.append('magnet', input);
    } else {
      formData.append('url', input);
    }

    if (options?.profile) {
      formData.append('profile', options.profile);
    }
    if (options?.format) {
      formData.append('format', options.format);
    }

    const response = await api.post('/media/submit', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    return response.data;
  }, []);

  // Submit URL
  const submitUrl = useCallback(async (
    url: string,
    options?: { profile?: string; format?: string }
  ) => {
    const response = await api.post('/media/submit', {
      url,
      profile: options?.profile,
      format: options?.format,
    });

    return response.data;
  }, []);

  // Submit file with upload progress
  const submitFile = useCallback(async (
    file: File,
    onProgress?: (progress: number) => void,
    options?: { profile?: string }
  ) => {
    const formData = new FormData();
    formData.append('file', file);

    if (options?.profile) {
      formData.append('profile', options.profile);
    }

    // Add to queue immediately with upload status
    const tempId = `temp-${Date.now()}`;
    setQueue(prev => [{
      id: tempId,
      type: 'file',
      status: 'uploading',
      progress: 0,
      fileName: file.name,
      createdAt: new Date(),
    }, ...prev]);

    try {
      const response = await api.post('/media/submit', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress?.(progress);

            // Update temp item progress
            setQueue(prev => prev.map(item =>
              item.id === tempId
                ? { ...item, progress }
                : item
            ));
          }
        },
      });

      // Remove temp item - real updates will come via WebSocket
      setQueue(prev => prev.filter(item => item.id !== tempId));

      return response.data;
    } catch (error) {
      // Update temp item to failed
      setQueue(prev => prev.map(item =>
        item.id === tempId
          ? { ...item, status: 'failed', error: 'Upload failed' }
          : item
      ));
      throw error;
    }
  }, []);

  // Remove item from queue
  const removeItem = useCallback((jobId: string) => {
    setQueue(prev => prev.filter(item => item.id !== jobId));
  }, []);

  // Clear completed items
  const clearCompleted = useCallback(() => {
    setQueue(prev => prev.filter(item =>
      item.status !== 'completed' && item.status !== 'failed'
    ));
  }, []);

  // Get download URL
  const getDownloadUrl = useCallback((jobId: string) => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
    return `${apiUrl}/api/media/download/${jobId}`;
  }, []);

  return {
    queue,
    connected,
    submitMedia,
    submitUrl,
    submitFile,
    removeItem,
    clearCompleted,
    getDownloadUrl,
  };
}

export default useQueue;
