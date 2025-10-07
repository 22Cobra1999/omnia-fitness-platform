-- Add client_id to fitness_program_details if it doesn't exist
ALTER TABLE fitness_program_details
ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES auth.users(id);

-- Add client_id to nutrition_program_details if it doesn't exist
ALTER TABLE nutrition_program_details
ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES auth.users(id);

-- Add new_column to fitness_program_details if it doesn't exist
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='fitness_program_details' AND column_name='new_column') THEN
        ALTER TABLE fitness_program_details ADD COLUMN new_column TEXT;
    END IF;
END $$;

-- Add new_column to nutrition_program_details if it doesn't exist
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='nutrition_program_details' AND column_name='new_column') THEN
        ALTER TABLE nutrition_program_details ADD COLUMN new_column TEXT;
    END IF;
END $$;
