-- Omnia Fitness Platform Database Schema
-- PostgreSQL / PLpgSQL

-- Drop tables if they exist (for fresh installation)
DROP TABLE IF EXISTS exercises CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create users table for coaches and clients
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('coach', 'client')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on email for faster lookups
CREATE INDEX idx_users_email ON users(email);

-- Create index on role for filtering
CREATE INDEX idx_users_role ON users(role);

-- Create exercises table
CREATE TABLE exercises (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100) NOT NULL,
  difficulty_level VARCHAR(20) DEFAULT 'intermediate' CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on category for filtering
CREATE INDEX idx_exercises_category ON exercises(category);

-- Create index on difficulty level
CREATE INDEX idx_exercises_difficulty ON exercises(difficulty_level);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exercises_updated_at
    BEFORE UPDATE ON exercises
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for testing

-- Sample users (coaches and clients)
INSERT INTO users (name, email, password, role) VALUES
  ('John Coach', 'john.coach@example.com', 'hashed_password_1', 'coach'),
  ('Sarah Coach', 'sarah.coach@example.com', 'hashed_password_2', 'coach'),
  ('Mike Client', 'mike.client@example.com', 'hashed_password_3', 'client'),
  ('Emma Client', 'emma.client@example.com', 'hashed_password_4', 'client');

-- Sample exercises
INSERT INTO exercises (name, description, category, difficulty_level) VALUES
  ('Push-ups', 'Classic bodyweight exercise for upper body strength', 'Strength', 'beginner'),
  ('Squats', 'Fundamental lower body exercise', 'Strength', 'beginner'),
  ('Deadlift', 'Compound exercise for full body strength', 'Strength', 'advanced'),
  ('Running', 'Cardiovascular endurance exercise', 'Cardio', 'intermediate'),
  ('Burpees', 'Full body explosive movement', 'HIIT', 'intermediate'),
  ('Plank', 'Core stability exercise', 'Core', 'beginner'),
  ('Pull-ups', 'Upper body pulling exercise', 'Strength', 'advanced'),
  ('Lunges', 'Single-leg lower body exercise', 'Strength', 'intermediate');

-- Grant permissions (adjust based on your database user)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_db_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_db_user;

-- Display success message
DO $$
BEGIN
  RAISE NOTICE 'Database schema created successfully!';
  RAISE NOTICE 'Sample data inserted: % users, % exercises', 
    (SELECT COUNT(*) FROM users), 
    (SELECT COUNT(*) FROM exercises);
END $$;
