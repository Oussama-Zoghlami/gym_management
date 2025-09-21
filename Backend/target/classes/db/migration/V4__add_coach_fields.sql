-- Add optional coach fields and must_change_password flag
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS phone VARCHAR(50) NULL,
  ADD COLUMN IF NOT EXISTS speciality VARCHAR(255) NULL,
  ADD COLUMN IF NOT EXISTS must_change_password TINYINT(1) NOT NULL DEFAULT 0;


