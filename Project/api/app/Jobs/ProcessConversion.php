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

class ProcessConversion implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $timeout = 7200;

    protected string $jobId;
    protected string $filePath;
    protected string $profile;
    protected ?string $ffmpegParams;

    public function __construct(
        string $jobId,
        string $filePath,
        string $profile,
        ?string $ffmpegParams = null
    ) {
        $this->jobId = $jobId;
        $this->filePath = $filePath;
        $this->profile = $profile;
        $this->ffmpegParams = $ffmpegParams;
    }

    public function handle(): void
    {
        $converterUrl = env('CONVERTER_SERVICE_URL', 'http://converter:8000');

        try {
            // Emit starting event
            event(new JobStatusUpdated(
                $this->jobId,
                'conversion',
                'processing',
                0,
                basename($this->filePath)
            ));

            // Start conversion
            $response = Http::timeout(7200)->post("{$converterUrl}/convert", [
                'file_path' => $this->filePath,
                'profile' => $this->profile,
                'ffmpeg_params' => $this->ffmpegParams,
                'job_id' => $this->jobId,
            ]);

            if (!$response->successful()) {
                throw new \Exception('Converter service error: ' . $response->body());
            }

            // Poll for status until complete
            $maxAttempts = 720; // 2 hours max
            $attempt = 0;

            while ($attempt < $maxAttempts) {
                $statusResponse = Http::timeout(30)->get("{$converterUrl}/status/{$this->jobId}");
                
                if (!$statusResponse->successful()) {
                    throw new \Exception('Status check failed');
                }

                $status = $statusResponse->json();
                $currentStatus = $status['status'] ?? 'unknown';
                $progress = $status['progress'] ?? 0;

                // Emit progress update
                event(new JobStatusUpdated(
                    $this->jobId,
                    'conversion',
                    $currentStatus,
                    $progress,
                    $status['output_file'] ?? null,
                    $status['error'] ?? null,
                    $status
                ));

                if ($currentStatus === 'completed') {
                    Log::info("Conversion completed: {$this->jobId}");
                    return;
                }

                if ($currentStatus === 'failed') {
                    throw new \Exception($status['error'] ?? 'Conversion failed');
                }

                sleep(2);
                $attempt++;
            }

            throw new \Exception('Conversion timeout');

        } catch (\Exception $e) {
            Log::error("Conversion failed: {$this->jobId} - {$e->getMessage()}");

            event(new JobStatusUpdated(
                $this->jobId,
                'conversion',
                'failed',
                0,
                null,
                $e->getMessage()
            ));

            throw $e;
        }
    }
}
