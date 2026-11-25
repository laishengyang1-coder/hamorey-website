-- TencentDB MySQL. Install before releasing the API. Existing warranty records are untouched.
CREATE TABLE IF NOT EXISTS certificate_jobs (
    warranty_record_id VARCHAR(191) PRIMARY KEY,
    revision VARCHAR(64) NOT NULL,
    requested_by VARCHAR(191),
    requested_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    next_attempt_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    attempts INT UNSIGNED NOT NULL DEFAULT 0,
    INDEX idx_certificate_jobs_due (next_attempt_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
