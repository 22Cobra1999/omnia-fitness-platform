-- Add columns for program rating and total reviews to the activities table
ALTER TABLE activities
ADD COLUMN IF NOT EXISTS program_rating NUMERIC(3, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS total_program_reviews INTEGER DEFAULT 0;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_activities_program_stats ON activities(program_rating, total_program_reviews);

-- Update existing activities with initial calculated values
-- This part should ideally be run once after adding the columns
-- For program_rating (average difficulty_rating from activity_surveys)
UPDATE activities
SET
  program_rating = COALESCE((
    SELECT AVG((metadata->>'difficulty_rating')::numeric)
    FROM activity_surveys
    WHERE activity_id = activities.id
  ), 0.00),
  total_program_reviews = COALESCE((
    SELECT COUNT(*)
    FROM activity_enrollments
    WHERE activity_id = activities.id
  ), 0);
