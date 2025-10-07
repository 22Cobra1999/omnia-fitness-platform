-- Add 'video_url' column to fitness_program_details if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='fitness_program_details' AND column_name='video_url') THEN
        ALTER TABLE fitness_program_details ADD COLUMN video_url TEXT;
    END IF;
END
$$;

-- Add 'video_url' column to nutrition_program_details if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='nutrition_program_details' AND column_name='video_url') THEN
        ALTER TABLE nutrition_program_details ADD COLUMN video_url TEXT;
    END IF;
END
$$;
