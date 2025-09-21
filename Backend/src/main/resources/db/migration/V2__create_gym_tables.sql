-- V2: initial gym tables (idempotent)

CREATE TABLE IF NOT EXISTS gyms (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  address VARCHAR(500),
  latitude DOUBLE,
  longitude DOUBLE,
  description TEXT,
  phone VARCHAR(50),
  email VARCHAR(255),
  admin_id INT,
  CONSTRAINT fk_gym_admin FOREIGN KEY (admin_id) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS gym_photos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  url VARCHAR(512) NOT NULL,
  gym_id INT NOT NULL,
  CONSTRAINT fk_photo_gym FOREIGN KEY (gym_id) REFERENCES gyms(id) ON DELETE CASCADE
) ENGINE=InnoDB;


