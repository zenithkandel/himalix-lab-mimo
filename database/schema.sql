-- Himalix Labs Database Schema
-- MySQL 5.7+ / MariaDB 10.2+

DROP DATABASE IF EXISTS himalix_lab_db;
CREATE DATABASE himalix_lab_db DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE himalix_lab_db;

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE users (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    email         VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role          ENUM('admin', 'editor') DEFAULT 'admin',
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================================
-- LANDING CONTENT  (CMS for all editable text)
-- ============================================================
CREATE TABLE landing_content (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    section       VARCHAR(50) NOT NULL,
    content_key   VARCHAR(100) NOT NULL,
    content_value LONGTEXT,
    content_type  ENUM('text', 'html', 'json') DEFAULT 'text',
    updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_section_key (section, content_key)
) ENGINE=InnoDB;

-- ============================================================
-- SERVICES
-- ============================================================
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
) ENGINE=InnoDB;

-- ============================================================
-- TEAM MEMBERS
-- ============================================================
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
) ENGINE=InnoDB;

-- ============================================================
-- TESTIMONIALS
-- ============================================================
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
) ENGINE=InnoDB;

-- ============================================================
-- SITE SETTINGS
-- ============================================================
CREATE TABLE site_settings (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    setting_key    VARCHAR(100) UNIQUE NOT NULL,
    setting_value  LONGTEXT,
    setting_type   ENUM('text', 'image', 'json', 'boolean') DEFAULT 'text',
    updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================================
-- CONTACT MESSAGES
-- ============================================================
CREATE TABLE contact_messages (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    name       VARCHAR(255) NOT NULL,
    email      VARCHAR(255) NOT NULL,
    subject    VARCHAR(255),
    message    TEXT NOT NULL,
    is_read    BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;
