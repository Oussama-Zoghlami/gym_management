-- Add subscription-related fields to users table
ALTER TABLE users ADD COLUMN stripe_customer_id VARCHAR(255);
ALTER TABLE users ADD COLUMN subscribed_gym_id INTEGER;
ALTER TABLE users ADD CONSTRAINT fk_users_subscribed_gym FOREIGN KEY (subscribed_gym_id) REFERENCES gyms(id);

-- Create subscriptions table
CREATE TABLE subscriptions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id INTEGER NOT NULL,
    gym_id INTEGER NOT NULL,
    stripe_customer_id VARCHAR(255) NOT NULL,
    stripe_subscription_id VARCHAR(255) NOT NULL,
    plan ENUM('MONTHLY', 'ANNUAL') NOT NULL,
    status ENUM('ACTIVE', 'INACTIVE', 'CANCELED', 'PENDING', 'PAST_DUE', 'TRIALING') NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    start_date DATETIME NOT NULL,
    end_date DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_subscriptions_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_subscriptions_gym FOREIGN KEY (gym_id) REFERENCES gyms(id),
    UNIQUE KEY uk_user_gym_active (user_id, gym_id, status)
);
