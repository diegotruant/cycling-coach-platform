-- Database Schema for Cycling Coach Platform
-- Optimized for Performance

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `diary_entries`;
DROP TABLE IF EXISTS `reports`;
DROP TABLE IF EXISTS `assignments`;
DROP TABLE IF EXISTS `mesocycles`;
DROP TABLE IF EXISTS `athletes`;

-- 1. Athletes
CREATE TABLE IF NOT EXISTS `athletes` (
  `id` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `email` VARCHAR(191) NOT NULL,
  `password_hash` VARCHAR(255) NULL,
  `status` ENUM('ACTIVE', 'ARCHIVED') DEFAULT 'ACTIVE',
  `dob` DATE NULL,
  `weight` FLOAT NULL COMMENT 'kg',
  `height` FLOAT NULL COMMENT 'cm',
  `sex` ENUM('M', 'F') NULL,
  `category` ENUM('OPEN', 'ELITE', 'MASTER', 'ELITE_MASTER') NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Metrics
  `ftp` INT UNSIGNED DEFAULT NULL,
  `cp` INT UNSIGNED DEFAULT NULL,
  `w_prime` INT UNSIGNED DEFAULT NULL,
  `p_max` INT UNSIGNED DEFAULT NULL,

  -- Extra Data (JSON)
  `extra_data` JSON NULL,
  
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Assignments
CREATE TABLE IF NOT EXISTS `assignments` (
  `id` VARCHAR(191) NOT NULL,
  `athlete_id` VARCHAR(191) NOT NULL,
  `date` DATE NOT NULL,
  
  `workout_id` VARCHAR(191) NULL,
  `workout_name` VARCHAR(255) NOT NULL,
  
  `status` ENUM('PENDING', 'COMPLETED', 'SKIPPED') DEFAULT 'PENDING',
  `notes` TEXT NULL,
  
  `assigned_by` VARCHAR(36) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  `workout_structure` JSON NULL,
  `activity_data` JSON NULL,
  
  PRIMARY KEY (`id`),
  KEY `fk_athlete_assignments` (`athlete_id`),
  KEY `idx_calendar_lookup` (`athlete_id`, `date`),
  CONSTRAINT `fk_athlete_assignments` FOREIGN KEY (`athlete_id`) REFERENCES `athletes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Mesocycles
CREATE TABLE IF NOT EXISTS `mesocycles` (
  `id` VARCHAR(191) NOT NULL,
  `athlete_id` VARCHAR(191) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `start_date` DATE NOT NULL,
  `end_date` DATE NOT NULL,
  `status` ENUM('PENDING_APPROVAL', 'APPROVED', 'ACTIVE', 'COMPLETED', 'CANCELLED') DEFAULT 'PENDING_APPROVAL',
  `structure` JSON NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  PRIMARY KEY (`id`),
  KEY `fk_athlete_mesocycles` (`athlete_id`),
  CONSTRAINT `fk_athlete_mesocycles` FOREIGN KEY (`athlete_id`) REFERENCES `athletes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Diary Entries
CREATE TABLE IF NOT EXISTS `diary_entries` (
    `id` VARCHAR(191) PRIMARY KEY,
    `athlete_id` VARCHAR(191) NOT NULL,
    `date` DATE NOT NULL,
    
    `hrv` FLOAT NULL COMMENT 'rMSSD ms',
    `hrr` INT NULL COMMENT 'Resting Heart Rate',
    `traffic_light` ENUM('GREEN', 'YELLOW', 'RED') DEFAULT 'GREEN',
    `notes` TEXT NULL,
    
    `sdnn` FLOAT NULL,
    `pnn50` FLOAT NULL,
    `cv` FLOAT NULL,
    `mean_rr` FLOAT NULL,
    
    `sleep_quality` TINYINT UNSIGNED NULL,
    `sleep_duration` FLOAT NULL,
    `rpe` TINYINT UNSIGNED NULL,
    `soreness` TINYINT UNSIGNED NULL,
    `fatigue` TINYINT UNSIGNED NULL,
    `stress` TINYINT UNSIGNED NULL,
    
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE KEY `idx_athlete_date` (`athlete_id`, `date`),
    KEY `idx_athlete_monitor` (`athlete_id`, `date`), 
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

SET FOREIGN_KEY_CHECKS = 1;