<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class DownloadController extends Controller
{
    protected $downloaderUrl;

    public function __construct()
    {
        $this->downloaderUrl = env('DOWNLOADER_SERVICE_URL', 'http://downloader:8000');
    }

    /**
     * Get video info from URL
     */
    public function info(Request $request)
    {
        $request->validate([
            'url' => 'required|url',
        ]);

        try {
            $response = Http::timeout(30)->post("{$this->downloaderUrl}/info", null, [
                'query' => ['url' => $request->url]
            ]);

            return response()->json($response->json());
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Start download
     */
    public function download(Request $request)
    {
        $request->validate([
            'url' => 'required|url',
        ]);

        try {
            $response = Http::timeout(30)->post("{$this->downloaderUrl}/download", [
                'url' => $request->url,
                'format' => $request->format ?? 'best',
                'convert_to' => $request->convert_to ?? null,
            ]);

            return response()->json($response->json());
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Get download status
     */
    public function status($jobId)
    {
        try {
            $response = Http::timeout(10)->get("{$this->downloaderUrl}/status/{$jobId}");
            return response()->json($response->json());
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Get supported sites
     */
    public function supportedSites()
    {
        try {
            $response = Http::timeout(10)->get("{$this->downloaderUrl}/supported");
            return response()->json($response->json());
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}
