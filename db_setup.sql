-- ============================================================
-- BreatheX AI Database Setup (Reference Only)
-- NOTE: Tables are auto-created by backend on startup.
-- This file is for manual reference or migrations.
-- ============================================================

CREATE DATABASE IF NOT EXISTS respiratory_ai;

USE respiratory_ai;

CREATE TABLE IF NOT EXISTS users (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(100)  NOT NULL,
    email       VARCHAR(100)  NOT NULL UNIQUE,
    password    VARCHAR(255)  NOT NULL,
    created_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email (email)
);

CREATE TABLE IF NOT EXISTS predictions (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    user_id     INT           NOT NULL,
    filename    TEXT          NOT NULL,
    result      VARCHAR(50)   NOT NULL,
    confidence  FLOAT         NOT NULL,
    all_scores  TEXT,
    created_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id)
);
