<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Str;

class ConversionController extends Controller
{
    protected $converterUrl;
    protected $downloaderUrl;
    protected $torrentUrl;
    protected $streamerUrl;

    public function __construct()
    {
        $this->converterUrl = env('CONVERTER_SERVICE_URL', 'http://converter:8000');
        $this->downloaderUrl = env('DOWNLOADER_SERVICE_URL', 'http://downloader:8000');
        $this->torrentUrl = env('TORRENT_SERVICE_URL', 'http://torrent:8000');
        $this->streamerUrl = env('STREAMER_SERVICE_URL', 'http://streamer:8000');
    }

    /**
     * Get conversion profiles
     */
    public function profiles()
    {
        try {
            $response = Http::timeout(10)->get("{$this->converterUrl}/profiles");
            return response()->json($response->json());
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Upload file for conversion
     */
    public function upload(Request $request)
    {
        $request->validate([
            'file' => 'required|file|max:2097152', // 2GB max
        ]);

        $file = $request->file('file');
        $jobId = Str::uuid()->toString();
        
        // Store file in shared storage
        $storagePath = env('STORAGE_PATH', '/app/storage');
        $uploadsDir = $storagePath . '/uploads';
        
        if (!is_dir($uploadsDir)) {
            mkdir($uploadsDir, 0755, true);
        }
        
        $filename = "{$jobId}_{$file->getClientOriginalName()}";
        $fullPath = $uploadsDir . '/' . $filename;
        $file->move($uploadsDir, $filename);

        // Get conversion options from request
        $outputFormat = $request->input('format', 'mp4');
        $ffmpegParams = $request->input('ffmpeg_params');

        // Store initial job in Redis
        $redis = Redis::connection('jobs');
        $redis->hset("conversion:job:{$jobId}", [
            'job_id' => $jobId,
            'status' => 'pending',
            'progress' => 0,
            'title' => $file->getClientOriginalName(),
            'input_path' => $fullPath,
            'output_path' => '',
            'thumbnail' => '',
            'error' => '',
        ]);
        $redis->expire("conversion:job:{$jobId}", 86400);

        // Start conversion in converter service
        try {
            $response = Http::timeout(30)->post("{$this->converterUrl}/convert", [
                'job_id' => $jobId,
                'input_path' => $fullPath,
                'output_format' => $outputFormat,
                'ffmpeg_params' => $ffmpegParams,
            ]);
            
            $result = $response->json();
            
            return response()->json([
                'job_id' => $result['job_id'] ?? $jobId,
                'file_path' => $fullPath,
                'filename' => $file->getClientOriginalName(),
                'size' => filesize($fullPath),
                'status' => 'converting',
            ]);
        } catch (\Exception $e) {
            // Update job as failed
            $redis->hset("conversion:job:{$jobId}", 'status', 'failed');
            $redis->hset("conversion:job:{$jobId}", 'error', $e->getMessage());
            
            return response()->json([
                'job_id' => $jobId,
                'file_path' => $fullPath,
                'filename' => $file->getClientOriginalName(),
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Start conversion
     */
    public function convert(Request $request)
    {
        $request->validate([
            'file_path' => 'required|string',
            'profile' => 'required|string',
        ]);

        try {
            $response = Http::timeout(30)->post("{$this->converterUrl}/convert", [
                'input_path' => $request->file_path,
                'output_format' => $request->profile,
                'ffmpeg_params' => $request->ffmpeg_params ?? null,
            ]);

            return response()->json($response->json());
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Get conversion status
     */
    public function status($jobId)
    {
        try {
            $response = Http::timeout(10)->get("{$this->converterUrl}/status/{$jobId}");
            return response()->json($response->json());
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Download converted/downloaded file
     */
    public function download($jobId)
    {
        try {
            // First, try to get job info from Redis (works for all job types)
            $redis = Redis::connection('jobs');
            $jobData = $redis->get("job:{$jobId}");
            
            // Also check hash format
            if (!$jobData) {
                $hashData = $redis->hgetall("download:job:{$jobId}");
                if (!empty($hashData)) {
                    $jobData = json_encode($hashData);
                }
            }
            
            if ($jobData) {
                $data = is_string($jobData) ? json_decode($jobData, true) : $jobData;
                
                // Check if job is completed
                $status = $data['status'] ?? null;
                if ($status !== 'completed') {
                    return response()->json([
                        'error' => 'Job not completed yet',
                        'status' => $status
                    ], 400);
                }
                
                // Get the output path
                $filePath = $data['output_path'] ?? null;
                if (!$filePath || !file_exists($filePath)) {
                    return response()->json(['error' => 'File not found', 'path' => $filePath], 404);
                }
                
                // Get filename for download
                $filename = $data['title'] ?? $data['name'] ?? basename($filePath);
                // Add extension if missing
                if (!pathinfo($filename, PATHINFO_EXTENSION)) {
                    $filename .= '.' . pathinfo($filePath, PATHINFO_EXTENSION);
                }
                
                return response()->download($filePath, $filename);
            }
            
            // Fallback: Try converter service directly (legacy support)
            $response = Http::timeout(10)->get("{$this->converterUrl}/status/{$jobId}");
            $data = $response->json();

            if (!isset($data['status']) || $data['status'] !== 'completed') {
                return response()->json(['error' => 'Conversion not completed'], 400);
            }

            $filePath = $data['output_path'] ?? null;
            if (!$filePath || !file_exists($filePath)) {
                return response()->json(['error' => 'File not found'], 404);
            }

            return response()->download($filePath);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}
