<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ConversionController;
use App\Http\Controllers\DownloadController;
use App\Http\Controllers\TorrentController;
use App\Http\Controllers\StreamController;
use App\Http\Controllers\QueueController;
use App\Http\Controllers\MediaController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Health check
Route::get('/health', function () {
    return response()->json([
        'status' => 'healthy',
        'service' => 'api-gateway',
        'timestamp' => now()->toIso8601String(),
    ]);
});

// ============================================
// MAIN ENDPOINT - Single entry point for all media
// ============================================
Route::prefix('media')->group(function () {
    Route::post('/submit', [MediaController::class, 'submit']);
    Route::get('/status/{jobId}', [MediaController::class, 'status']);
    Route::get('/download/{jobId}', [MediaController::class, 'download']);
    Route::get('/websocket-config', [MediaController::class, 'websocketConfig']);
});

// Legacy test route
Route::get('/teste', function () {
    return response()->json(['message' => 'AllOne Converter API', 'status' => 'Connected']);
});

// Conversion routes
Route::prefix('conversion')->group(function () {
    Route::get('/profiles', [ConversionController::class, 'profiles']);
    Route::post('/upload', [ConversionController::class, 'upload']);
    Route::post('/convert', [ConversionController::class, 'convert']);
    Route::get('/status/{jobId}', [ConversionController::class, 'status']);
    Route::get('/download/{jobId}', [ConversionController::class, 'download']);
});

// Download routes (yt-dlp)
Route::prefix('download')->group(function () {
    Route::post('/info', [DownloadController::class, 'info']);
    Route::post('/start', [DownloadController::class, 'download']);
    Route::get('/status/{jobId}', [DownloadController::class, 'status']);
    Route::get('/supported', [DownloadController::class, 'supportedSites']);
});

// Torrent routes
Route::prefix('torrent')->group(function () {
    Route::post('/add/magnet', [TorrentController::class, 'addMagnet']);
    Route::post('/add/file', [TorrentController::class, 'addFile']);
    Route::post('/parse', [TorrentController::class, 'parse']);
    Route::post('/parse/magnet', [TorrentController::class, 'parseMagnet']);
    Route::get('/status/{jobId}', [TorrentController::class, 'status']);
    Route::post('/select-files', [TorrentController::class, 'selectFiles']);
    Route::post('/pause/{jobId}', [TorrentController::class, 'pause']);
    Route::post('/resume/{jobId}', [TorrentController::class, 'resume']);
    Route::delete('/{jobId}', [TorrentController::class, 'remove']);
    Route::get('/files/{jobId}', [TorrentController::class, 'files']);
    Route::get('/list', [TorrentController::class, 'list']);
});

// Stream routes
Route::prefix('stream')->group(function () {
    Route::post('/prepare', [StreamController::class, 'prepare']);
    Route::get('/status/{streamId}', [StreamController::class, 'status']);
    Route::post('/preview', [StreamController::class, 'preview']);
    Route::get('/thumbnail', [StreamController::class, 'thumbnail']);
    Route::get('/{streamId}/playlist.m3u8', [StreamController::class, 'playlist']);
    Route::get('/{streamId}/{segment}', [StreamController::class, 'segment']);
    Route::delete('/preview/{previewId}', [StreamController::class, 'deletePreview']);
    Route::post('/cache/cleanup', [StreamController::class, 'cleanupCache']);
});

// Queue routes
Route::prefix('queue')->group(function () {
    Route::get('/', [QueueController::class, 'index']);
    Route::get('/stats', [QueueController::class, 'stats']);
    Route::get('/{jobId}', [QueueController::class, 'show']);
    Route::delete('/{jobId}', [QueueController::class, 'destroy']);
});

// Auth routes (protected)
Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});
