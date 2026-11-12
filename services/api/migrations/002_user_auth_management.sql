-- =========================================================================
-- Acquisition Sourcing & Underwriting Platform (v1.0)
-- Migration 002: User Authentication, Email Verification & Token Lifecycle
-- Target: PostgreSQL 16 + PostGIS 3 on Oracle OCI ARM64
-- =========================================================================

CREATE TABLE IF NOT EXISTS users (
    user_id VARCHAR(64) PRIMARY KEY,
    username VARCHAR(64) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role team_role NOT NULL DEFAULT 'PRINCIPAL',
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    preferences_id VARCHAR(64)
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users (LOWER(email));
CREATE INDEX IF NOT EXISTS idx_users_username ON users (LOWER(username));

-- Verification Tokens Table
CREATE TABLE IF NOT EXISTS email_verification_tokens (
    token VARCHAR(128) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Password Reset Tokens Table
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    token VARCHAR(128) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed default institutional test personas if not present
INSERT INTO users (user_id, username, email, password_hash, role, is_verified, is_active, preferences_id)
VALUES 
    ('usr_principal_01', 'principal', 'principal@asup.internal', '$2b$12$e8oYkQk3k8iC7lqO0t5Sg.jLhQ.Kx7O2mQhZ.5xR1lGqXoZlQnF1W', 'PRINCIPAL', TRUE, TRUE, 'pref_principal'),
    ('usr_analyst_01', 'analyst', 'analyst@asup.internal', '$2b$12$e8oYkQk3k8iC7lqO0t5Sg.jLhQ.Kx7O2mQhZ.5xR1lGqXoZlQnF1W', 'ANALYST', TRUE, TRUE, 'pref_analyst'),
    ('usr_counsel_01', 'counsel', 'counsel@asup.internal', '$2b$12$e8oYkQk3k8iC7lqO0t5Sg.jLhQ.Kx7O2mQhZ.5xR1lGqXoZlQnF1W', 'COUNSEL', TRUE, TRUE, 'pref_counsel'),
    ('usr_cpa_01', 'cpa', 'cpa@asup.internal', '$2b$12$e8oYkQk3k8iC7lqO0t5Sg.jLhQ.Kx7O2mQhZ.5xR1lGqXoZlQnF1W', 'CPA', TRUE, TRUE, 'pref_cpa'),
    ('usr_lender_01', 'lender', 'lender@asup.internal', '$2b$12$e8oYkQk3k8iC7lqO0t5Sg.jLhQ.Kx7O2mQhZ.5xR1lGqXoZlQnF1W', 'LENDER_BROKER', TRUE, TRUE, 'pref_lender')
ON CONFLICT (user_id) DO NOTHING;
