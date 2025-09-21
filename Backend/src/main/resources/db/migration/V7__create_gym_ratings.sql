-- V7: Create gym_ratings table for rating system

CREATE TABLE gym_ratings (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    gym_id INT NOT NULL,
    user_id INT NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    CONSTRAINT fk_gym_rating_gym FOREIGN KEY (gym_id) REFERENCES gyms(id) ON DELETE CASCADE,
    CONSTRAINT fk_gym_rating_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- Unique constraint to prevent duplicate ratings from same user for same gym
    CONSTRAINT uk_gym_rating_user_gym UNIQUE (gym_id, user_id)
);

-- Index for better query performance
CREATE INDEX idx_gym_ratings_gym_id ON gym_ratings(gym_id);
CREATE INDEX idx_gym_ratings_user_id ON gym_ratings(user_id);
CREATE INDEX idx_gym_ratings_rating ON gym_ratings(rating);
