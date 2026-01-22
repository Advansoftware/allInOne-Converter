<?php

namespace App\Http\Controllers;

use App\Jobs\ProcessMedia;
use App\Events\JobStatusUpdated;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;

class MediaController extends Controller
{
    /**
     * Submit media for processing (URL, file, or torrent)
     * Single endpoint - closes modal immediately, updates via WebSocket
     */
    public function submit(Request $request)
    {
        $request->validate([
            'url' => 'nullable|string',
            'file' => 'nullable|file|max:5242880', // 5GB max
            'magnet' => 'nullable|string',
            'profile' => 'nullable|string',
            'format' => 'nullable|string',
        ]);

        $jobId = Str::uuid()->toString();
        $source = null;
        $input = null;
        $fileName = null;

        // Determine source type
        if ($request->hasFile('file')) {
            // File upload
            $file = $request->file('file');
            $fileName = $file->getClientOriginalName();
            $path = $file->storeAs('uploads', $jobId . '_' . $fileName, 'public');
            
            $source = 'file';
            $input = Storage::disk('public')->path($path);

            // Emit upload complete immediately
            event(new JobStatusUpdated(
                $jobId,
                'file',
                'queued',
                100,
                $fileName,
                null,
                ['size' => $file->getSize()]
            ));

        } elseif ($request->filled('url')) {
            // URL download (YouTube, etc)
            $url = $request->input('url');
            
            // Check if it's a magnet link
            if (Str::startsWith($url, 'magnet:')) {
                $source = 'torrent';
                $input = $url;
                $fileName = 'Torrent';
            } else {
                $source = 'url';
                $input = $url;
                $fileName = $this->extractFileName($url);
            }

            // Emit queued event
            event(new JobStatusUpdated(
                $jobId,
                $source,
                'queued',
                0,
                $fileName,
                null,
                ['url' => $url]
            ));

        } elseif ($request->filled('magnet')) {
            // Magnet link
            $source = 'torrent';
            $input = $request->input('magnet');
            $fileName = 'Torrent';

            event(new JobStatusUpdated(
                $jobId,
                'torrent',
                'queued',
                0,
                $fileName
            ));

        } else {
            return response()->json([
                'error' => 'No file, URL, or magnet link provided'
            ], 400);
        }

        // Dispatch job to queue
        ProcessMedia::dispatch(
            $jobId,
            $source,
            $input,
            $request->input('profile'),
            [
                'format' => $request->input('format'),
            ]
        );

        // Return immediately - frontend will get updates via WebSocket
        return response()->json([
            'success' => true,
            'job_id' => $jobId,
            'source' => $source,
            'file_name' => $fileName,
            'status' => 'queued',
            'message' => 'Job queued successfully. Updates will be sent via WebSocket.'
        ]);
    }

    /**
     * Get job status (fallback for when WebSocket is not available)
     */
    public function status(string $jobId)
    {
        // TODO: Implement Redis-based status storage
        return response()->json([
            'job_id' => $jobId,
            'status' => 'unknown',
            'message' => 'Use WebSocket for real-time updates'
        ]);
    }

    /**
     * Download completed file
     */
    public function download(string $jobId)
    {
        // Find file in storage
        $files = Storage::disk('public')->files('completed');
        
        foreach ($files as $file) {
            if (Str::contains($file, $jobId)) {
                return Storage::disk('public')->download($file);
            }
        }

        return response()->json(['error' => 'File not found'], 404);
    }

    /**
     * Get Pusher/WebSocket config for frontend
     */
    public function websocketConfig()
    {
        return response()->json([
            'key' => env('PUSHER_APP_KEY', 'allone-key'),
            'host' => env('PUSHER_HOST', 'localhost'),
            'port' => env('PUSHER_PORT', 6001),
            'cluster' => 'mt1',
            'forceTLS' => false,
            'encrypted' => false,
        ]);
    }

    protected function extractFileName(string $url): string
    {
        // Try to extract filename from URL
        $parsed = parse_url($url);
        $path = $parsed['path'] ?? '';
        $filename = basename($path);
        
        if (empty($filename) || $filename === '/') {
            // For YouTube and similar
            if (Str::contains($url, 'youtube.com') || Str::contains($url, 'youtu.be')) {
                return 'YouTube Video';
            }
            return 'Video';
        }
        
        return $filename;
    }
}
