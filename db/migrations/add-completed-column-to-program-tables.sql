-- Add 'completed' and 'completed_at' columns to fitness_program_details if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='fitness_program_details' AND column_name='completed') THEN
        ALTER TABLE fitness_program_details ADD COLUMN completed BOOLEAN DEFAULT FALSE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='fitness_program_details' AND column_name='completed_at') THEN
        ALTER TABLE fitness_program_details ADD COLUMN completed_at TIMESTAMP WITH TIME ZONE;
    END IF;
END
$$;

-- Add 'completed' and 'completed_at' columns to nutrition_program_details if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='nutrition_program_details' AND column_name='completed') THEN
        ALTER TABLE nutrition_program_details ADD COLUMN completed BOOLEAN DEFAULT FALSE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='nutrition_program_details' AND column_name='completed_at') THEN
        ALTER TABLE nutrition_program_details ADD COLUMN completed_at TIMESTAMP WITH TIME ZONE;
    END IF;
END
$$;
