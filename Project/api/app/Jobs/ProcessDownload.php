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

class ProcessDownload implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $timeout = 3600;

    protected string $jobId;
    protected string $url;
    protected ?string $format;
    protected ?string $convertTo;

    public function __construct(
        string $jobId,
        string $url,
        ?string $format = null,
        ?string $convertTo = null
    ) {
        $this->jobId = $jobId;
        $this->url = $url;
        $this->format = $format;
        $this->convertTo = $convertTo;
    }

    public function handle(): void
    {
        $downloaderUrl = env('DOWNLOADER_SERVICE_URL', 'http://downloader:8000');

        try {
            // Emit starting event
            event(new JobStatusUpdated(
                $this->jobId,
                'download',
                'processing',
                0,
                null,
                null,
                ['url' => $this->url]
            ));

            // Start download
            $response = Http::timeout(3600)->post("{$downloaderUrl}/download", [
                'url' => $this->url,
                'format' => $this->format ?? 'best',
                'convert_to' => $this->convertTo,
                'job_id' => $this->jobId,
            ]);

            if (!$response->successful()) {
                throw new \Exception('Download service error: ' . $response->body());
            }

            $data = $response->json();

            // Poll for status until complete
            $maxAttempts = 360; // 1 hour max
            $attempt = 0;

            while ($attempt < $maxAttempts) {
                $statusResponse = Http::timeout(30)->get("{$downloaderUrl}/status/{$this->jobId}");
                
                if (!$statusResponse->successful()) {
                    throw new \Exception('Status check failed');
                }

                $status = $statusResponse->json();
                $currentStatus = $status['status'] ?? 'unknown';
                $progress = $status['progress'] ?? 0;

                // Emit progress update
                event(new JobStatusUpdated(
                    $this->jobId,
                    'download',
                    $currentStatus,
                    $progress,
                    $status['file_name'] ?? null,
                    $status['error'] ?? null,
                    $status
                ));

                if ($currentStatus === 'completed') {
                    Log::info("Download completed: {$this->jobId}");
                    return;
                }

                if ($currentStatus === 'failed') {
                    throw new \Exception($status['error'] ?? 'Download failed');
                }

                sleep(2);
                $attempt++;
            }

            throw new \Exception('Download timeout');

        } catch (\Exception $e) {
            Log::error("Download failed: {$this->jobId} - {$e->getMessage()}");

            event(new JobStatusUpdated(
                $this->jobId,
                'download',
                'failed',
                0,
                null,
                $e->getMessage()
            ));

            throw $e;
        }
    }
}
