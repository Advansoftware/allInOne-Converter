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
}
