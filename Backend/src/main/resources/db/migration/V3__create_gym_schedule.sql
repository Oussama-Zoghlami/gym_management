CREATE TABLE IF NOT EXISTS gym_schedule (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  gym_id INT NOT NULL,
  day_of_week VARCHAR(16) NOT NULL,
  open_time TIME NOT NULL,
  close_time TIME NOT NULL,
  note VARCHAR(255),
  CONSTRAINT fk_gym_schedule_gym FOREIGN KEY (gym_id) REFERENCES gyms(id) ON DELETE CASCADE
);

-- Optional index for faster lookups
CREATE INDEX IF NOT EXISTS idx_gym_schedule_gym ON gym_schedule(gym_id);


