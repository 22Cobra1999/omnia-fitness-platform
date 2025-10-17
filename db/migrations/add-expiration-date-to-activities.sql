-- Add expiration_date column to activities table
ALTER TABLE activities
ADD COLUMN expiration_date TIMESTAMP WITH TIME ZONE;

-- Optional: Add a comment for clarity
COMMENT ON COLUMN activities.expiration_date IS 'Date when the activity or program expires, if applicable.';
