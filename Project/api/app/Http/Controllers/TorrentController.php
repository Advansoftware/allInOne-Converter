<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class TorrentController extends Controller
{
    protected $torrentUrl;

    public function __construct()
    {
        $this->torrentUrl = env('TORRENT_SERVICE_URL', 'http://torrent:8000');
    }

    /**
     * Add torrent from magnet URL
     */
    public function addMagnet(Request $request)
    {
        $request->validate([
            'magnet_url' => 'required|string|starts_with:magnet:',
        ]);

        try {
            $response = Http::timeout(30)->post("{$this->torrentUrl}/add/magnet", null, [
                'query' => ['magnet_url' => $request->magnet_url]
            ]);

            return response()->json($response->json());
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Add torrent from file
     */
    public function addFile(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:torrent',
        ]);

        try {
            $file = $request->file('file');
            
            $response = Http::timeout(30)
                ->attach('file', file_get_contents($file->path()), $file->getClientOriginalName())
                ->post("{$this->torrentUrl}/add/file");

            return response()->json($response->json());
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Parse torrent file without downloading
     */
    public function parse(Request $request)
    {
        $request->validate([
            'file' => 'required|file',
        ]);

        try {
            $file = $request->file('file');
            
            $response = Http::timeout(30)
                ->attach('file', file_get_contents($file->path()), $file->getClientOriginalName())
                ->post("{$this->torrentUrl}/parse");

            return response()->json($response->json());
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Parse magnet URL
     */
    public function parseMagnet(Request $request)
    {
        $request->validate([
            'magnet_url' => 'required|string|starts_with:magnet:',
        ]);

        try {
            $response = Http::timeout(10)->post("{$this->torrentUrl}/parse/magnet", null, [
                'query' => ['magnet_url' => $request->magnet_url]
            ]);

            return response()->json($response->json());
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Get torrent status
     */
    public function status($jobId)
    {
        try {
            $response = Http::timeout(10)->get("{$this->torrentUrl}/status/{$jobId}");
            return response()->json($response->json());
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Select files to download
     */
    public function selectFiles(Request $request)
    {
        $request->validate([
            'job_id' => 'required|string',
            'file_indices' => 'required|array',
        ]);

        try {
            $response = Http::timeout(10)->post("{$this->torrentUrl}/select-files", [
                'job_id' => $request->job_id,
                'file_indices' => $request->file_indices,
                'convert_to' => $request->convert_to ?? null,
            ]);

            return response()->json($response->json());
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Pause torrent
     */
    public function pause($jobId)
    {
        try {
            $response = Http::timeout(10)->post("{$this->torrentUrl}/pause/{$jobId}");
            return response()->json($response->json());
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Resume torrent
     */
    public function resume($jobId)
    {
        try {
            $response = Http::timeout(10)->post("{$this->torrentUrl}/resume/{$jobId}");
            return response()->json($response->json());
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Remove torrent
     */
    public function remove(Request $request, $jobId)
    {
        try {
            $deleteFiles = $request->query('delete_files', false);
            $response = Http::timeout(10)->delete("{$this->torrentUrl}/{$jobId}", [
                'query' => ['delete_files' => $deleteFiles]
            ]);

            return response()->json($response->json());
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * List files from torrent
     */
    public function files($jobId)
    {
        try {
            $response = Http::timeout(10)->get("{$this->torrentUrl}/files/{$jobId}");
            return response()->json($response->json());
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * List all active torrents
     */
    public function list()
    {
        try {
            $response = Http::timeout(10)->get("{$this->torrentUrl}/list");
            return response()->json($response->json());
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}
