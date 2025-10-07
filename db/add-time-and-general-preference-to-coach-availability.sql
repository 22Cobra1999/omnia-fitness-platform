ALTER TABLE coach_availability
ADD COLUMN IF NOT EXISTS day_of_week INTEGER,
ADD COLUMN IF NOT EXISTS start_time TIME,
ADD COLUMN IF NOT EXISTS end_time TIME,
ADD COLUMN IF NOT EXISTS is_general_preference BOOLEAN DEFAULT FALSE;

-- Optional: Add a unique constraint for general preferences to ensure only one exists per coach
-- This assumes that for general preferences, day_of_week, start_time, end_time will be fixed dummy values.
-- For example, day_of_week = 0, start_time = '00:00:00', end_time = '23:59:59'
-- ALTER TABLE coach_availability
-- ADD CONSTRAINT unique_general_preference_per_coach UNIQUE (coach_id, day_of_week, start_time, end_time)
-- WHERE is_general_preference = TRUE;

-- Update existing rows to set default values for new columns if needed
UPDATE coach_availability
SET
    day_of_week = COALESCE(day_of_week, 0), -- Default to 0 (e.g., for general availability)
    start_time = COALESCE(start_time, '00:00:00'),
    end_time = COALESCE(end_time, '23:59:59')
WHERE
    day_of_week IS NULL OR start_time IS NULL OR end_time IS NULL;

-- Ensure existing consultation_type is an array if it's not already
ALTER TABLE coach_availability
ALTER COLUMN consultation_type TYPE TEXT[] USING ARRAY[consultation_type::text];

-- If you had single string values like 'message' or 'videocall' and want to convert them to arrays:
-- UPDATE coach_availability
-- SET consultation_type = ARRAY[consultation_type::text]
-- WHERE pg_typeof(consultation_type) = 'text'::regtype;
