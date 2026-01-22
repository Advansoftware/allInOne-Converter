<?php

namespace App\Jobs;

use App\Events\JobStatusUpdated;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class ProcessMedia implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $timeout = 7200;

    protected string $jobId;
    protected string $source; // 'file', 'url', 'torrent'
    protected string $input;  // file path, URL, or magnet link
    protected ?string $profile;
    protected ?array $options;

    public function __construct(
        string $jobId,
        string $source,
        string $input,
        ?string $profile = null,
        ?array $options = null
    ) {
        $this->jobId = $jobId;
        $this->source = $source;
        $this->input = $input;
        $this->profile = $profile;
        $this->options = $options ?? [];
    }

    public function handle(): void
    {
        try {
            // Emit queued event
            $this->emit('queued', 0, 'Aguardando processamento...');

            switch ($this->source) {
                case 'url':
                    $this->processUrl();
                    break;
                case 'file':
                    $this->processFile();
                    break;
                case 'torrent':
                    $this->processTorrent();
                    break;
                default:
                    throw new \Exception("Unknown source type: {$this->source}");
            }

        } catch (\Exception $e) {
            Log::error("ProcessMedia failed: {$this->jobId} - {$e->getMessage()}");
            $this->emit('failed', 0, null, $e->getMessage());
            throw $e;
        }
    }

    protected function processUrl(): void
    {
        $downloaderUrl = env('DOWNLOADER_SERVICE_URL', 'http://downloader:8000');

        $this->emit('downloading', 0, 'Obtendo informações do vídeo...');

        // Get video info first
        $infoResponse = Http::timeout(60)->get("{$downloaderUrl}/info", [
            'url' => $this->input
        ]);

        $info = $infoResponse->json();
        $title = $info['title'] ?? 'video';

        $this->emit('downloading', 5, $title);

        // Start download
        $response = Http::timeout(30)->post("{$downloaderUrl}/download", [
            'url' => $this->input,
            'format' => $this->options['format'] ?? 'best',
            'job_id' => $this->jobId,
        ]);

        if (!$response->successful()) {
            throw new \Exception('Download failed: ' . $response->body());
        }

        // Poll for completion
        $this->pollStatus($downloaderUrl, 'downloading', $title);

        // If conversion is needed
        if ($this->profile && $this->profile !== 'original') {
            $this->runConversion($title);
        } else {
            $this->emit('completed', 100, $title);
        }
    }

    protected function processFile(): void
    {
        $fileName = basename($this->input);
        $this->emit('uploading', 100, $fileName);

        // If conversion is needed
        if ($this->profile && $this->profile !== 'original') {
            $this->runConversion($fileName);
        } else {
            $this->emit('completed', 100, $fileName);
        }
    }

    protected function processTorrent(): void
    {
        $torrentUrl = env('TORRENT_SERVICE_URL', 'http://torrent:8000');

        $this->emit('downloading', 0, 'Iniciando download torrent...');

        // Add torrent
        $response = Http::timeout(30)->post("{$torrentUrl}/add/magnet", [
            'magnet' => $this->input,
            'job_id' => $this->jobId,
        ]);

        if (!$response->successful()) {
            throw new \Exception('Torrent add failed: ' . $response->body());
        }

        $data = $response->json();
        $name = $data['name'] ?? 'torrent';

        // Poll for completion
        $this->pollTorrentStatus($torrentUrl, $name);

        $this->emit('completed', 100, $name);
    }

    protected function runConversion(string $fileName): void
    {
        $converterUrl = env('CONVERTER_SERVICE_URL', 'http://converter:8000');

        $this->emit('converting', 0, $fileName);

        // Start conversion
        $response = Http::timeout(30)->post("{$converterUrl}/convert", [
            'file_path' => $this->input,
            'profile' => $this->profile,
            'job_id' => $this->jobId,
        ]);

        if (!$response->successful()) {
            throw new \Exception('Conversion failed: ' . $response->body());
        }

        // Poll for completion
        $this->pollStatus($converterUrl, 'converting', $fileName);

        $this->emit('completed', 100, $fileName);
    }

    protected function pollStatus(string $serviceUrl, string $stage, string $fileName): void
    {
        $maxAttempts = 1800; // 1 hour with 2 second intervals
        $attempt = 0;

        while ($attempt < $maxAttempts) {
            try {
                $response = Http::timeout(30)->get("{$serviceUrl}/status/{$this->jobId}");
                
                if ($response->successful()) {
                    $status = $response->json();
                    $currentStatus = $status['status'] ?? 'unknown';
                    $progress = $status['progress'] ?? 0;

                    $this->emit($stage, $progress, $fileName, null, $status);

                    if ($currentStatus === 'completed') {
                        return;
                    }

                    if ($currentStatus === 'failed') {
                        throw new \Exception($status['error'] ?? 'Process failed');
                    }
                }
            } catch (\Illuminate\Http\Client\ConnectionException $e) {
                Log::warning("Status poll connection error: {$e->getMessage()}");
            }

            sleep(2);
            $attempt++;
        }

        throw new \Exception('Process timeout');
    }

    protected function pollTorrentStatus(string $serviceUrl, string $name): void
    {
        $maxAttempts = 43200; // 24 hours with 2 second intervals
        $attempt = 0;

        while ($attempt < $maxAttempts) {
            try {
                $response = Http::timeout(30)->get("{$serviceUrl}/status/{$this->jobId}");
                
                if ($response->successful()) {
                    $status = $response->json();
                    $currentStatus = $status['status'] ?? 'unknown';
                    $progress = (int)($status['progress'] ?? 0);
                    $downloadSpeed = $status['download_speed'] ?? 0;

                    $this->emit('downloading', $progress, $name, null, [
                        'download_speed' => $downloadSpeed,
                        'peers' => $status['peers'] ?? 0,
                    ]);

                    if ($currentStatus === 'completed' || $progress >= 100) {
                        return;
                    }

                    if ($currentStatus === 'failed') {
                        throw new \Exception($status['error'] ?? 'Torrent failed');
                    }
                }
            } catch (\Illuminate\Http\Client\ConnectionException $e) {
                Log::warning("Torrent status poll error: {$e->getMessage()}");
            }

            sleep(2);
            $attempt++;
        }

        throw new \Exception('Torrent download timeout');
    }

    protected function emit(
        string $status,
        int $progress,
        ?string $fileName = null,
        ?string $error = null,
        ?array $metadata = null
    ): void {
        event(new JobStatusUpdated(
            $this->jobId,
            $this->source,
            $status,
            $progress,
            $fileName,
            $error,
            $metadata
        ));
    }
}
