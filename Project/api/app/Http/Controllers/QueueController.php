<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;

class QueueController extends Controller
{
    /**
     * Get Redis connection without prefix for microservices jobs
     */
    private function redis()
    {
        return Redis::connection('jobs');
    }

    /**
     * Get all jobs in queue
     */
    public function index(Request $request)
    {
        $type = $request->query('type'); // conversion, download, torrent
        $status = $request->query('status'); // pending, processing, completed, failed
        $limit = $request->query('limit', 50);

        $jobs = [];
        $redis = $this->redis();

        // Get conversion jobs from Redis
        $conversionKeys = $redis->keys('conversion:job:*');
        foreach ($conversionKeys as $key) {
            $jobData = $redis->hgetall($key);
            if ($jobData) {
                $jobData['type'] = 'conversion';
                $jobs[] = $jobData;
            }
        }

        // Get download jobs from Redis
        $downloadKeys = $redis->keys('download:job:*');
        foreach ($downloadKeys as $key) {
            $jobData = $redis->hgetall($key);
            if ($jobData) {
                $jobData['type'] = 'download';
                $jobs[] = $jobData;
            }
        }

        // Get torrent jobs from Redis
        $torrentKeys = $redis->keys('torrent:job:*');
        foreach ($torrentKeys as $key) {
            $jobData = $redis->hgetall($key);
            if ($jobData) {
                $jobData['type'] = 'torrent';
                $jobs[] = $jobData;
            }
        }

        // Filter by type
        if ($type) {
            $jobs = array_filter($jobs, fn($job) => $job['type'] === $type);
        }

        // Filter by status
        if ($status) {
            $jobs = array_filter($jobs, fn($job) => ($job['status'] ?? '') === $status);
        }

        // Sort by most recent first (assuming job_id contains timestamp or uuid)
        usort($jobs, fn($a, $b) => strcmp($b['job_id'] ?? '', $a['job_id'] ?? ''));

        // Limit results
        $jobs = array_slice(array_values($jobs), 0, $limit);

        return response()->json([
            'jobs' => $jobs,
            'total' => count($jobs),
        ]);
    }

    /**
     * Get specific job status
     */
    public function show($jobId)
    {
        $redis = $this->redis();

        // Try to find in conversion jobs
        $jobData = $redis->hgetall("conversion:job:{$jobId}");
        if ($jobData) {
            $jobData['type'] = 'conversion';
            return response()->json($jobData);
        }

        // Try download jobs
        $jobData = $redis->hgetall("download:job:{$jobId}");
        if ($jobData) {
            $jobData['type'] = 'download';
            return response()->json($jobData);
        }

        // Try torrent jobs
        $jobData = $redis->hgetall("torrent:job:{$jobId}");
        if ($jobData) {
            $jobData['type'] = 'torrent';
            return response()->json($jobData);
        }

        return response()->json(['error' => 'Job not found'], 404);
    }

    /**
     * Cancel/remove a job
     */
    public function destroy($jobId)
    {
        $redis = $this->redis();

        // Try to remove from all job types
        $redis->del("conversion:job:{$jobId}");
        $redis->del("download:job:{$jobId}");
        $redis->del("torrent:job:{$jobId}");

        return response()->json(['status' => 'removed']);
    }

    /**
     * Get queue statistics
     */
    public function stats()
    {
        $redis = $this->redis();

        $stats = [
            'conversion' => [
                'pending' => 0,
                'processing' => 0,
                'completed' => 0,
                'failed' => 0,
            ],
            'download' => [
                'pending' => 0,
                'processing' => 0,
                'completed' => 0,
                'failed' => 0,
            ],
            'torrent' => [
                'pending' => 0,
                'downloading' => 0,
                'completed' => 0,
                'failed' => 0,
            ],
        ];

        // Count conversion jobs
        $conversionKeys = $redis->keys('conversion:job:*');
        foreach ($conversionKeys as $key) {
            $status = $redis->hget($key, 'status');
            if (isset($stats['conversion'][$status])) {
                $stats['conversion'][$status]++;
            }
        }

        // Count download jobs
        $downloadKeys = $redis->keys('download:job:*');
        foreach ($downloadKeys as $key) {
            $status = $redis->hget($key, 'status');
            if (isset($stats['download'][$status])) {
                $stats['download'][$status]++;
            }
        }

        // Count torrent jobs
        $torrentKeys = $redis->keys('torrent:job:*');
        foreach ($torrentKeys as $key) {
            $status = $redis->hget($key, 'status');
            if (isset($stats['torrent'][$status])) {
                $stats['torrent'][$status]++;
            }
        }

        return response()->json($stats);
    }
}
