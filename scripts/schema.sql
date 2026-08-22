-- ==============================================================================
-- DATABASE SCHEMA MIGRATION FOR SEMI-AUTOMATED PAYMENT VERIFICATION ENGINE
-- Supports MySQL 5.7+ / MySQL 8.0+ / MariaDB / PostgreSQL
-- ==============================================================================

-- 1. Table for Email Parsed Received Payments
CREATE TABLE IF NOT EXISTS `payments_received` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `transaction_id` VARCHAR(100) NOT NULL UNIQUE,
  `amount` DECIMAL(12, 2) NOT NULL,
  `sender_info` VARCHAR(255) NULL,
  `status` ENUM('pending', 'claimed') NOT NULL DEFAULT 'pending',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_trx_status` (`transaction_id`, `status`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- 2. Table for User Submitted Deposit Requests
CREATE TABLE IF NOT EXISTS `user_deposits` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id` VARCHAR(100) NOT NULL,
  `submitted_tid` VARCHAR(100) NOT NULL,
  `submitted_amount` DECIMAL(12, 2) NOT NULL,
  `screenshot_path` VARCHAR(255) NULL,
  `status` ENUM('auto-approved', 'manual-review', 'rejected') NOT NULL DEFAULT 'manual-review',
  `processed_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_submitted_tid` (`submitted_tid`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Optional: User Accounts Balance Table
CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(100) PRIMARY KEY,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `balance` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
