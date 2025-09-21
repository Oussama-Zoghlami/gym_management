-- Create conversation_deletions table to track who deleted conversations
CREATE TABLE conversation_deletions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id INTEGER NOT NULL,
    other_user_id INTEGER NOT NULL,
    gym_id INTEGER NOT NULL,
    deleted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_conv_deletions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_conv_deletions_other_user FOREIGN KEY (other_user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_conv_deletions_gym FOREIGN KEY (gym_id) REFERENCES gyms(id) ON DELETE CASCADE,
    UNIQUE KEY uk_user_other_gym (user_id, other_user_id, gym_id)
);
