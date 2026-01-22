<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;

class QueueController extends Controller
{
    /**
     * Get Redis connection without prefix for microservices jobs
     */
    private function redis()
    {
        return Redis::connection('jobs');
    }

    /**
     * Convert thumbnail path to URL
     */
    private function thumbnailToUrl($jobData)
    {
        if (!empty($jobData['thumbnail'])) {
            $thumbnailPath = $jobData['thumbnail'];
            // If it's already a URL, keep it
            if (str_starts_with($thumbnailPath, 'http')) {
                return $jobData;
            }
            // Convert local path to API URL
            // Extract just the filename from the path
            $filename = basename($thumbnailPath);
            $jobData['thumbnail'] = url("/api/thumbnails/{$filename}");
        }
        return $jobData;
    }

    /**
     * Get all jobs in queue
     */
    public function index(Request $request)
    {
        $type = $request->query('type'); // conversion, download, torrent
        $status = $request->query('status'); // pending, processing, completed, failed
        $limit = $request->query('limit', 50);

        $jobs = [];
        $redis = $this->redis();

        // Get conversion jobs from Redis
        $conversionKeys = $redis->keys('conversion:job:*');
        foreach ($conversionKeys as $key) {
            $jobData = $redis->hgetall($key);
            if ($jobData) {
                $jobData['type'] = 'conversion';
                $jobData = $this->thumbnailToUrl($jobData);
                $jobs[] = $jobData;
            }
        }

        // Get download jobs from Redis
        $downloadKeys = $redis->keys('download:job:*');
        foreach ($downloadKeys as $key) {
            $jobData = $redis->hgetall($key);
            if ($jobData) {
                $jobData['type'] = 'download';
                $jobData = $this->thumbnailToUrl($jobData);
                $jobs[] = $jobData;
            }
        }

        // Get torrent jobs from Redis
        $torrentKeys = $redis->keys('torrent:job:*');
        foreach ($torrentKeys as $key) {
            $jobData = $redis->hgetall($key);
            if ($jobData) {
                $jobData['type'] = 'torrent';
                $jobData = $this->thumbnailToUrl($jobData);
                $jobs[] = $jobData;
            }
        }

        // Filter by type
        if ($type) {
            $jobs = array_filter($jobs, fn($job) => $job['type'] === $type);
        }

        // Filter by status
        if ($status) {
            $jobs = array_filter($jobs, fn($job) => ($job['status'] ?? '') === $status);
        }

        // Sort by most recent first (assuming job_id contains timestamp or uuid)
        usort($jobs, fn($a, $b) => strcmp($b['job_id'] ?? '', $a['job_id'] ?? ''));

        // Limit results
        $jobs = array_slice(array_values($jobs), 0, $limit);

        return response()->json([
            'jobs' => $jobs,
            'total' => count($jobs),
        ]);
    }

    /**
     * Get specific job status
     */
    public function show($jobId)
    {
        $redis = $this->redis();

        // Try to find in conversion jobs
        $jobData = $redis->hgetall("conversion:job:{$jobId}");
        if ($jobData) {
            $jobData['type'] = 'conversion';
            $jobData = $this->thumbnailToUrl($jobData);
            return response()->json($jobData);
        }

        // Try download jobs
        $jobData = $redis->hgetall("download:job:{$jobId}");
        if ($jobData) {
            $jobData['type'] = 'download';
            $jobData = $this->thumbnailToUrl($jobData);
            return response()->json($jobData);
        }

        // Try torrent jobs
        $jobData = $redis->hgetall("torrent:job:{$jobId}");
        if ($jobData) {
            $jobData['type'] = 'torrent';
            $jobData = $this->thumbnailToUrl($jobData);
            return response()->json($jobData);
        }

        return response()->json(['error' => 'Job not found'], 404);
    }

    /**
     * Serve cached thumbnail
     */
    public function serveThumbnail($filename)
    {
        // Sanitize filename to prevent directory traversal
        $filename = basename($filename);
        $storagePath = env('STORAGE_PATH', '/app/storage');
        $thumbnailPath = $storagePath . '/thumbnails/' . $filename;
        
        if (!file_exists($thumbnailPath)) {
            return response()->json(['error' => 'Thumbnail not found'], 404);
        }
        
        return response()->file($thumbnailPath, [
            'Content-Type' => 'image/jpeg',
            'Cache-Control' => 'public, max-age=31536000', // Cache for 1 year
        ]);
    }

    /**
     * Cancel/remove a job and delete ALL associated files (video, thumbnail, cache, etc.)
     */
    public function destroy($jobId)
    {
        $redis = $this->redis();
        $filesDeleted = [];
        $storagePath = env('STORAGE_PATH', '/app/storage');

        // Try to get job data before deleting to find files
        $jobTypes = ['conversion', 'download', 'torrent'];
        
        foreach ($jobTypes as $type) {
            $jobData = $redis->hgetall("{$type}:job:{$jobId}");
            if ($jobData && !empty($jobData['output_path'])) {
                $filePath = $jobData['output_path'];
                
                // Delete the main output file if it exists
                if (file_exists($filePath)) {
                    @unlink($filePath);
                    $filesDeleted[] = $filePath;
                }
                
                // Delete any related files in the same directory (same job_id prefix)
                $directory = dirname($filePath);
                if (is_dir($directory)) {
                    $files = glob($directory . '/' . $jobId . '*');
                    foreach ($files as $file) {
                        if (is_file($file)) {
                            @unlink($file);
                            $filesDeleted[] = $file;
                        }
                    }
                }
            }
            
            // Delete the Redis key
            $redis->del("{$type}:job:{$jobId}");
        }
        
        // Also delete from legacy Redis key format
        $redis->del("job:{$jobId}");
        
        // Delete cached thumbnail
        $thumbnailPath = $storagePath . '/thumbnails/' . $jobId . '.jpg';
        if (file_exists($thumbnailPath)) {
            @unlink($thumbnailPath);
            $filesDeleted[] = $thumbnailPath;
        }
        
        // Delete any HLS/streaming cache for this job
        $hlsCachePath = $storagePath . '/cache/hls/' . $jobId;
        if (is_dir($hlsCachePath)) {
            $this->deleteDirectory($hlsCachePath);
            $filesDeleted[] = $hlsCachePath;
        }
        
        // Delete any preview cache for this job  
        $previewCachePath = $storagePath . '/cache/preview/' . $jobId;
        if (is_dir($previewCachePath)) {
            $this->deleteDirectory($previewCachePath);
            $filesDeleted[] = $previewCachePath;
        }
        
        // Clean up downloads folder - any file starting with job_id
        $downloadDirs = [
            $storagePath . '/downloads',
            $storagePath . '/converted',
            $storagePath . '/torrents',
        ];
        
        foreach ($downloadDirs as $dir) {
            if (is_dir($dir)) {
                $files = glob($dir . '/' . $jobId . '*');
                foreach ($files as $file) {
                    if (is_file($file)) {
                        @unlink($file);
                        $filesDeleted[] = $file;
                    } elseif (is_dir($file)) {
                        $this->deleteDirectory($file);
                        $filesDeleted[] = $file;
                    }
                }
            }
        }

        return response()->json([
            'status' => 'removed',
            'job_id' => $jobId,
            'files_deleted' => count($filesDeleted),
            'deleted_items' => $filesDeleted,
        ]);
    }
    
    /**
     * Recursively delete a directory
     */
    private function deleteDirectory($dir)
    {
        if (!is_dir($dir)) {
            return false;
        }
        
        $files = array_diff(scandir($dir), ['.', '..']);
        foreach ($files as $file) {
            $path = $dir . '/' . $file;
            if (is_dir($path)) {
                $this->deleteDirectory($path);
            } else {
                @unlink($path);
            }
        }
        
        return @rmdir($dir);
    }

    /**
     * Get queue statistics
     */
    public function stats()
    {
        $redis = $this->redis();

        $stats = [
            'conversion' => [
                'pending' => 0,
                'processing' => 0,
                'completed' => 0,
                'failed' => 0,
            ],
            'download' => [
                'pending' => 0,
                'processing' => 0,
                'completed' => 0,
                'failed' => 0,
            ],
            'torrent' => [
                'pending' => 0,
                'downloading' => 0,
                'completed' => 0,
                'failed' => 0,
            ],
        ];

        // Count conversion jobs
        $conversionKeys = $redis->keys('conversion:job:*');
        foreach ($conversionKeys as $key) {
            $status = $redis->hget($key, 'status');
            if (isset($stats['conversion'][$status])) {
                $stats['conversion'][$status]++;
            }
        }

        // Count download jobs
        $downloadKeys = $redis->keys('download:job:*');
        foreach ($downloadKeys as $key) {
            $status = $redis->hget($key, 'status');
            if (isset($stats['download'][$status])) {
                $stats['download'][$status]++;
            }
        }

        // Count torrent jobs
        $torrentKeys = $redis->keys('torrent:job:*');
        foreach ($torrentKeys as $key) {
            $status = $redis->hget($key, 'status');
            if (isset($stats['torrent'][$status])) {
                $stats['torrent'][$status]++;
            }
        }

        return response()->json($stats);
    }
}
