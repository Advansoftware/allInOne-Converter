-- AllOne Converter Database Initialization

SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- Jobs table for tracking all conversion/download jobs
CREATE TABLE IF NOT EXISTS `jobs_queue` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `job_id` VARCHAR(255) NOT NULL UNIQUE,
    `type` ENUM('conversion', 'download', 'torrent') NOT NULL,
    `status` ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
    `progress` DECIMAL(5,2) DEFAULT 0,
    `input_path` TEXT,
    `output_path` TEXT,
    `options` JSON,
    `error` TEXT,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_status` (`status`),
    INDEX `idx_type` (`type`),
    INDEX `idx_job_id` (`job_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Torrents table for torrent management
CREATE TABLE IF NOT EXISTS `torrents` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `job_id` VARCHAR(255) NOT NULL UNIQUE,
    `name` VARCHAR(500),
    `info_hash` VARCHAR(64),
    `magnet_url` TEXT,
    `status` ENUM('metadata', 'downloading', 'paused', 'completed', 'failed') DEFAULT 'metadata',
    `progress` DECIMAL(5,2) DEFAULT 0,
    `download_rate` BIGINT DEFAULT 0,
    `upload_rate` BIGINT DEFAULT 0,
    `num_peers` INT DEFAULT 0,
    `num_seeds` INT DEFAULT 0,
    `total_size` BIGINT DEFAULT 0,
    `downloaded_size` BIGINT DEFAULT 0,
    `files` JSON,
    `selected_files` JSON,
    `download_path` TEXT,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_status` (`status`),
    INDEX `idx_info_hash` (`info_hash`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Conversion profiles
CREATE TABLE IF NOT EXISTS `conversion_profiles` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL,
    `slug` VARCHAR(255) NOT NULL UNIQUE,
    `description` TEXT,
    `extension` VARCHAR(20),
    `ffmpeg_params` TEXT,
    `is_active` BOOLEAN DEFAULT TRUE,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default conversion profiles
INSERT INTO `conversion_profiles` (`name`, `slug`, `description`, `extension`, `ffmpeg_params`) VALUES
('YouTube HD (MP4)', 'youtube_hd', 'Vídeo em 1080p, codec H.264, áudio AAC.', 'mp4', '-c:v libx264 -preset fast -crf 23 -c:a aac -b:a 192k -vf scale=1920:1080'),
('Instagram Story (MP4)', 'instagram_story', 'Vídeo vertical 1080x1920, codec H.264, áudio AAC.', 'mp4', '-c:v libx264 -preset fast -crf 25 -c:a aac -b:a 128k -vf scale=1080:1920'),
('Áudio MP3', 'audio_mp3', 'Extrai apenas o áudio em MP3, 192kbps.', 'mp3', '-vn -ar 44100 -ac 2 -b:a 192k'),
('GIF Animado', 'gif', 'Converte para GIF animado, 480px de largura.', 'gif', '-vf scale=480:-1 -r 10'),
('WebM (VP9)', 'webm', 'Formato WebM com codec VP9.', 'webm', '-c:v libvpx-vp9 -crf 30 -b:v 0 -c:a libopus'),
('HLS Streaming', 'hls', 'Formato HLS para streaming adaptativo.', 'm3u8', '-c:v libx264 -c:a aac -f hls -hls_time 4 -hls_list_size 0');
