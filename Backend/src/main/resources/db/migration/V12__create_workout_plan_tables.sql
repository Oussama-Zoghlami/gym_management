-- Create workout_plans table
CREATE TABLE workout_plans (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    exercises TEXT NOT NULL,
    duration INT NOT NULL,
    difficulty_level VARCHAR(20) NOT NULL,
    coach_id INT NOT NULL,
    gym_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL,
    FOREIGN KEY (coach_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (gym_id) REFERENCES gyms(id) ON DELETE CASCADE
);

-- Create workout_assignments table
CREATE TABLE workout_assignments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    workout_plan_id BIGINT NOT NULL,
    member_id INT NOT NULL,
    coach_id INT NOT NULL,
    status VARCHAR(20) NOT NULL,
    notes TEXT,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    FOREIGN KEY (workout_plan_id) REFERENCES workout_plans(id) ON DELETE CASCADE,
    FOREIGN KEY (member_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (coach_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Add indexes for better performance
CREATE INDEX idx_workout_plans_coach_id ON workout_plans(coach_id);
CREATE INDEX idx_workout_plans_gym_id ON workout_plans(gym_id);
CREATE INDEX idx_workout_assignments_member_id ON workout_assignments(member_id);
CREATE INDEX idx_workout_assignments_coach_id ON workout_assignments(coach_id);
CREATE INDEX idx_workout_assignments_workout_plan_id ON workout_assignments(workout_plan_id);
CREATE INDEX idx_workout_assignments_status ON workout_assignments(status);
