-- V6: Add unique 3-digit code to gyms and backfill existing rows

ALTER TABLE gyms ADD COLUMN IF NOT EXISTS code VARCHAR(3);

-- Backfill codes for existing rows deterministically based on id
UPDATE gyms
SET code = LPAD(CAST(MOD(id, 1000) AS CHAR), 3, '0')
WHERE code IS NULL;

-- Enforce not null and uniqueness
ALTER TABLE gyms MODIFY COLUMN code VARCHAR(3) NOT NULL;
ALTER TABLE gyms ADD CONSTRAINT uk_gym_code UNIQUE (code);


