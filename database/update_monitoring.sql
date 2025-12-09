
-- Aggiornamento Schema: Monitoraggio e Report

-- 4. Diary Entries (Diario Giornaliero)
CREATE TABLE IF NOT EXISTS `diary_entries` (
    `id` VARCHAR(191) PRIMARY KEY,
    `athlete_id` VARCHAR(191) NOT NULL,
    `date` DATE NOT NULL,
    
    `hrv` FLOAT NULL COMMENT 'rMSSD ms',
    `hrr` INT NULL COMMENT 'Resting Heart Rate',
    `traffic_light` ENUM('GREEN', 'YELLOW', 'RED') DEFAULT 'GREEN',
    `notes` TEXT NULL,
    
    -- Detailed Metrics (Optional, extracted from JSON if needed heavily)
    `sdnn` FLOAT NULL,
    `pnn50` FLOAT NULL,
    `cv` FLOAT NULL,
    `mean_rr` FLOAT NULL,
    
    -- Subjective Data
    `sleep_quality` TINYINT UNSIGNED NULL,
    `sleep_duration` FLOAT NULL,
    `rpe` TINYINT UNSIGNED NULL,
    `soreness` TINYINT UNSIGNED NULL,
    `fatigue` TINYINT UNSIGNED NULL,
    `stress` TINYINT UNSIGNED NULL,
    
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE KEY `idx_athlete_date` (`athlete_id`, `date`),
    KEY `idx_athlete_monitor` (`athlete_id`, `date`), -- For range queries (last 30 days)
    CONSTRAINT `fk_athlete_diary` FOREIGN KEY (`athlete_id`) REFERENCES `athletes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Reports
CREATE TABLE IF NOT EXISTS `reports` (
    `id` VARCHAR(191) PRIMARY KEY,
    `athlete_id` VARCHAR(191) NOT NULL,
    `date` DATE NOT NULL,
    `content` TEXT,
    `generated_by` ENUM('AI', 'COACH') DEFAULT 'AI',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    KEY `idx_athlete_reports` (`athlete_id`, `date`),
    CONSTRAINT `fk_athlete_reports` FOREIGN KEY (`athlete_id`) REFERENCES `athletes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
