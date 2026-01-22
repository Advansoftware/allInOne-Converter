<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class StreamController extends Controller
{
    protected $streamerUrl;

    public function __construct()
    {
        $this->streamerUrl = env('STREAMER_SERVICE_URL', 'http://streamer:8000');
    }

    /**
     * Prepare HLS stream
     */
    public function prepare(Request $request)
    {
        $request->validate([
            'file_path' => 'required|string',
        ]);

        try {
            $response = Http::timeout(30)->post("{$this->streamerUrl}/stream/prepare", [
                'file_path' => $request->file_path,
                'quality' => $request->quality ?? '720p',
            ]);

            return response()->json($response->json());
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Get stream status
     */
    public function status($streamId)
    {
        try {
            $response = Http::timeout(10)->get("{$this->streamerUrl}/stream/{$streamId}/status");
            return response()->json($response->json());
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Create preview
     */
    public function preview(Request $request)
    {
        $request->validate([
            'file_path' => 'required|string',
        ]);

        try {
            $response = Http::timeout(60)->post("{$this->streamerUrl}/preview", [
                'file_path' => $request->file_path,
                'start_time' => $request->start_time ?? '00:00:00',
                'duration' => $request->duration ?? 30,
            ]);

            return response()->json($response->json());
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Generate thumbnail
     */
    public function thumbnail(Request $request)
    {
        $request->validate([
            'file_path' => 'required|string',
        ]);

        try {
            $response = Http::timeout(30)->get("{$this->streamerUrl}/thumbnail", [
                'file_path' => $request->file_path,
                'time' => $request->time ?? '00:00:01',
            ]);

            if ($response->successful()) {
                return response($response->body(), 200)
                    ->header('Content-Type', 'image/jpeg');
            }

            return response()->json(['error' => 'Failed to generate thumbnail'], 500);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Proxy HLS playlist
     */
    public function playlist($streamId)
    {
        try {
            $response = Http::timeout(10)->get("{$this->streamerUrl}/stream/{$streamId}/playlist.m3u8");
            
            return response($response->body(), $response->status())
                ->header('Content-Type', 'application/vnd.apple.mpegurl')
                ->header('Access-Control-Allow-Origin', '*');
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Proxy HLS segment
     */
    public function segment($streamId, $segment)
    {
        try {
            $response = Http::timeout(30)->get("{$this->streamerUrl}/stream/{$streamId}/{$segment}");
            
            return response($response->body(), $response->status())
                ->header('Content-Type', 'video/mp2t')
                ->header('Access-Control-Allow-Origin', '*');
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Delete preview cache
     */
    public function deletePreview($previewId)
    {
        try {
            $response = Http::timeout(10)->delete("{$this->streamerUrl}/cache/preview/{$previewId}");
            return response()->json($response->json());
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Cleanup cache
     */
    public function cleanupCache(Request $request)
    {
        try {
            $response = Http::timeout(60)->post("{$this->streamerUrl}/cache/cleanup", [
                'max_age_hours' => $request->max_age_hours ?? 24,
            ]);

            return response()->json($response->json());
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Stream video file directly by job ID
     */
    public function streamByJobId($jobId)
    {
        try {
            // Get job info from Redis
            $redis = \Illuminate\Support\Facades\Redis::connection('jobs');
            $jobData = $redis->get("job:{$jobId}");
            
            // Also check hash format used by downloader
            if (!$jobData) {
                $hashData = $redis->hgetall("download:job:{$jobId}");
                if (!empty($hashData)) {
                    $jobData = json_encode($hashData);
                }
            }
            
            if (!$jobData) {
                return response()->json(['error' => 'Job not found'], 404);
            }
            
            $data = is_string($jobData) ? json_decode($jobData, true) : $jobData;
            
            // For streaming, we allow any status that has output_path (even during download)
            $filePath = $data['output_path'] ?? null;
            if (!$filePath || !file_exists($filePath)) {
                return response()->json(['error' => 'File not available yet'], 404);
            }
            
            // Get file info
            $mimeType = mime_content_type($filePath);
            $fileSize = filesize($filePath);
            $fileName = basename($filePath);
            
            // Handle range requests for video seeking
            $headers = [
                'Content-Type' => $mimeType,
                'Accept-Ranges' => 'bytes',
                'Content-Disposition' => "inline; filename=\"{$fileName}\"",
                'Access-Control-Allow-Origin' => '*',
            ];
            
            if (request()->header('Range')) {
                return $this->streamWithRange($filePath, $fileSize, $mimeType, $headers);
            }
            
            $headers['Content-Length'] = $fileSize;
            
            return response()->stream(function () use ($filePath) {
                $handle = fopen($filePath, 'rb');
                while (!feof($handle)) {
                    echo fread($handle, 8192);
                    flush();
                }
                fclose($handle);
            }, 200, $headers);
            
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
    
    /**
     * Handle range requests for video seeking
     */
    private function streamWithRange($filePath, $fileSize, $mimeType, $headers)
    {
        $range = request()->header('Range');
        
        // Parse range header
        preg_match('/bytes=(\d+)-(\d*)/', $range, $matches);
        $start = intval($matches[1]);
        $end = isset($matches[2]) && $matches[2] !== '' ? intval($matches[2]) : $fileSize - 1;
        
        // Validate range
        if ($start > $end || $start > $fileSize - 1 || $end > $fileSize - 1) {
            return response('', 416)->header('Content-Range', "bytes */{$fileSize}");
        }
        
        $length = $end - $start + 1;
        
        $headers['Content-Length'] = $length;
        $headers['Content-Range'] = "bytes {$start}-{$end}/{$fileSize}";
        
        return response()->stream(function () use ($filePath, $start, $length) {
            $handle = fopen($filePath, 'rb');
            fseek($handle, $start);
            $remaining = $length;
            
            while ($remaining > 0 && !feof($handle)) {
                $chunk = fread($handle, min(8192, $remaining));
                echo $chunk;
                flush();
                $remaining -= strlen($chunk);
            }
            
            fclose($handle);
        }, 206, $headers);
    }
}
