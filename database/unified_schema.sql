-- ============================================================
-- Himalix Unified Platform — Database Schema
-- Merges: himalix_lab_db (Portfolio CMS) + himalix_db (Store)
-- MySQL 8.0+ / MariaDB 10.4+
-- ============================================================

DROP DATABASE IF EXISTS himalix_db;
CREATE DATABASE himalix_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE himalix_db;

-- ############################################################
-- SHARED: USERS (canonical auth table — from Store, enriched)
-- ############################################################
CREATE TABLE users (
    id              INT           NOT NULL AUTO_INCREMENT,
    email           VARCHAR(255)  NOT NULL,
    password_hash   VARCHAR(255)  DEFAULT NULL,
    google_id       VARCHAR(255)  DEFAULT NULL,
    avatar_url      VARCHAR(500)  DEFAULT NULL,
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


-- ############################################################
-- LABS: Portfolio / Landing CMS Tables
-- ############################################################

-- Landing page CMS content (key-value per section)
CREATE TABLE landing_content (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    section       VARCHAR(50)  NOT NULL,
    content_key   VARCHAR(100) NOT NULL,
    content_value LONGTEXT,
    content_type  ENUM('text', 'html', 'json') DEFAULT 'text',
    updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_section_key (section, content_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Services offered by Himalix Labs
CREATE TABLE services (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    title         VARCHAR(255) NOT NULL,
    subtitle      VARCHAR(255),
    description   TEXT,
    icon_class    VARCHAR(100),
    features      JSON,
    link_url      VARCHAR(500),
    display_order INT DEFAULT 0,
    is_active     BOOLEAN DEFAULT TRUE,
    updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Team members
CREATE TABLE team_members (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    name          VARCHAR(255) NOT NULL,
    role          VARCHAR(100) NOT NULL,
    bio           TEXT,
    image_url     VARCHAR(500),
    social_links  JSON,
    display_order INT DEFAULT 0,
    is_active     BOOLEAN DEFAULT TRUE,
    updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Client testimonials
CREATE TABLE testimonials (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    client_name   VARCHAR(255) NOT NULL,
    client_title  VARCHAR(255),
    company       VARCHAR(255),
    content       TEXT NOT NULL,
    rating        INT DEFAULT 5,
    image_url     VARCHAR(500),
    is_active     BOOLEAN DEFAULT TRUE,
    display_order INT DEFAULT 0,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Labs-specific site settings (separate from store settings)
CREATE TABLE labs_site_settings (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    setting_key    VARCHAR(100) UNIQUE NOT NULL,
    setting_value  LONGTEXT,
    setting_type   ENUM('text', 'image', 'json', 'boolean') DEFAULT 'text',
    updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Contact form messages (from Labs landing page)
CREATE TABLE contact_messages (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    name       VARCHAR(255) NOT NULL,
    email      VARCHAR(255) NOT NULL,
    subject    VARCHAR(255),
    message    TEXT NOT NULL,
    is_read    BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ############################################################
-- STORE: E-commerce Tables
-- ############################################################

-- Products catalog
CREATE TABLE products (
    id               INT           NOT NULL AUTO_INCREMENT,
    name             VARCHAR(255)  NOT NULL,
    sku              VARCHAR(100)  NOT NULL,
    description      TEXT          DEFAULT NULL,
    technical_specs  JSON          DEFAULT NULL,
    price            DECIMAL(10,2) NOT NULL,
    stock_quantity   INT           NOT NULL DEFAULT 0,
    image_url        VARCHAR(500)  DEFAULT NULL,
    category         VARCHAR(100)  DEFAULT NULL,
    stock_type       VARCHAR(20)   NOT NULL DEFAULT 'in_stock',
    outsource_days   INT           NOT NULL DEFAULT 0,
    cost_price       DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    image_urls       JSON          DEFAULT NULL,
    created_at       TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_products_sku (sku)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Shopping cart items
CREATE TABLE cart_items (
    id         INT       NOT NULL AUTO_INCREMENT,
    user_id    INT       NOT NULL,
    product_id INT       NOT NULL,
    quantity   INT       NOT NULL DEFAULT 1,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_cart_items_user_product (user_id, product_id),
    CONSTRAINT fk_cart_items_user    FOREIGN KEY (user_id)    REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_cart_items_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Orders
CREATE TABLE orders (
    id               INT           NOT NULL AUTO_INCREMENT,
    user_id          INT           DEFAULT NULL,
    total_amount     DECIMAL(10,2) NOT NULL,
    status           VARCHAR(50)   NOT NULL DEFAULT 'pending',
    tracking_code    VARCHAR(100)  NOT NULL,
    shipping_address TEXT          DEFAULT NULL,
    payment_method   VARCHAR(50)   NOT NULL DEFAULT 'cash',
    payment_status   VARCHAR(50)   NOT NULL DEFAULT 'unpaid',
    created_at       TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Order line items
CREATE TABLE order_items (
    id         INT            NOT NULL AUTO_INCREMENT,
    order_id   INT            NOT NULL,
    product_id INT            NOT NULL,
    quantity   INT            NOT NULL DEFAULT 1,
    price      DECIMAL(10,2)  NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_order_items_order   FOREIGN KEY (order_id)   REFERENCES orders (id) ON DELETE CASCADE,
    CONSTRAINT fk_order_items_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Product reviews
CREATE TABLE reviews (
    id         INT       NOT NULL AUTO_INCREMENT,
    user_id    INT       NOT NULL,
    product_id INT       NOT NULL,
    rating     INT       NOT NULL,
    comment    TEXT      DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_reviews_user    FOREIGN KEY (user_id)    REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_reviews_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Wallet transaction ledger
CREATE TABLE wallet_transactions (
    id           INT            NOT NULL AUTO_INCREMENT,
    user_id      INT            NOT NULL,
    amount       DECIMAL(10,2)  NOT NULL,
    type         ENUM('deposit', 'purchase', 'refund', 'referral', 'social') NOT NULL,
    reference_id VARCHAR(100)   DEFAULT NULL,
    created_at   TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_wallet_transactions_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Social media follow claims (Instagram/Facebook credit tracking)
CREATE TABLE social_claims (
    user_id    INT         NOT NULL,
    platform   VARCHAR(50) NOT NULL,
    claimed_at TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, platform),
    CONSTRAINT fk_social_claims_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Store system settings (key-value)
CREATE TABLE settings (
    key_name  VARCHAR(255) NOT NULL,
    key_value TEXT         DEFAULT NULL,
    PRIMARY KEY (key_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Email notification receivers
CREATE TABLE email_notification_receivers (
    id                        INT          NOT NULL AUTO_INCREMENT,
    email_address             VARCHAR(255) NOT NULL,
    notify_on_order_placed    TINYINT(1)   NOT NULL DEFAULT 1,
    notify_on_low_stock       TINYINT(1)   NOT NULL DEFAULT 1,
    notify_on_user_registered TINYINT(1)   NOT NULL DEFAULT 1,
    PRIMARY KEY (id),
    UNIQUE KEY uq_receivers_email (email_address)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
