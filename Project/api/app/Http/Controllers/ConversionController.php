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
        
        // Store file locally first
        $path = $file->storeAs('uploads', "{$jobId}_{$file->getClientOriginalName()}", 'public');
        $fullPath = storage_path("app/public/{$path}");

        return response()->json([
            'job_id' => $jobId,
            'file_path' => $fullPath,
            'filename' => $file->getClientOriginalName(),
            'size' => $file->getSize(),
        ]);
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
     * Download converted file
     */
    public function download($jobId)
    {
        try {
            $response = Http::timeout(10)->get("{$this->converterUrl}/status/{$jobId}");
            $data = $response->json();

            if ($data['status'] !== 'completed') {
                return response()->json(['error' => 'Conversion not completed'], 400);
            }

            $filePath = $data['output_path'];
            if (!file_exists($filePath)) {
                return response()->json(['error' => 'File not found'], 404);
            }

            return response()->download($filePath);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}
