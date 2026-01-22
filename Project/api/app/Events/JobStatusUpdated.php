<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class JobStatusUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public string $jobId;
    public string $type;
    public string $status;
    public int $progress;
    public ?string $fileName;
    public ?string $error;
    public ?array $metadata;

    /**
     * Create a new event instance.
     */
    public function __construct(
        string $jobId,
        string $type,
        string $status,
        int $progress = 0,
        ?string $fileName = null,
        ?string $error = null,
        ?array $metadata = null
    ) {
        $this->jobId = $jobId;
        $this->type = $type;
        $this->status = $status;
        $this->progress = $progress;
        $this->fileName = $fileName;
        $this->error = $error;
        $this->metadata = $metadata;
    }

    /**
     * Get the channels the event should broadcast on.
     */
    public function broadcastOn(): Channel
    {
        return new Channel('jobs');
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'job.updated';
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        return [
            'job_id' => $this->jobId,
            'type' => $this->type,
            'status' => $this->status,
            'progress' => $this->progress,
            'file_name' => $this->fileName,
            'error' => $this->error,
            'metadata' => $this->metadata,
            'timestamp' => now()->toIso8601String(),
        ];
    }
}