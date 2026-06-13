-- ============================================================
-- Himalix Auth Schema (Shared across all apps)
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
    id              INT           NOT NULL AUTO_INCREMENT,
    email           VARCHAR(255)  NOT NULL,
    name            VARCHAR(255)  DEFAULT NULL,
    password_hash   VARCHAR(255)  DEFAULT NULL,
    google_id       VARCHAR(255)  DEFAULT NULL,
    avatar_url      VARCHAR(500)  DEFAULT NULL,
    phone           VARCHAR(50)   DEFAULT NULL,
    address         TEXT          DEFAULT NULL,
    role            ENUM('user','admin') NOT NULL DEFAULT 'user',
    wallet_balance  DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    referral_code   VARCHAR(50)   DEFAULT NULL,
    referred_by     INT           DEFAULT NULL,
    created_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_users_email (email),
    UNIQUE KEY uq_users_google_id (google_id),
    UNIQUE KEY uq_users_referral_code (referral_code),
    CONSTRAINT fk_users_referred_by FOREIGN KEY (referred_by) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
