ALTER TABLE users
  ADD COLUMN IF NOT EXISTS gym_id INT NULL;

ALTER TABLE users
  ADD CONSTRAINT fk_user_gym
  FOREIGN KEY (gym_id) REFERENCES gyms(id)
  ON DELETE SET NULL;

CREATE INDEX idx_users_gym_id ON users(gym_id);