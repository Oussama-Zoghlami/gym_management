-- V11: Add password reset fields to users table
-- This migration adds fields for password reset functionality

ALTER TABLE users ADD COLUMN reset_password_token VARCHAR(255);
ALTER TABLE users ADD COLUMN reset_password_token_expiry DATETIME;

-- Add index for better performance on token lookups
CREATE INDEX idx_users_reset_token ON users(reset_password_token);
