-- Add available_days column if it does not exist
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'activities' AND column_name = 'available_days') THEN
        ALTER TABLE activities ADD COLUMN available_days TEXT[];
        RAISE NOTICE 'Column available_days added to activities table.';
    END IF;
END $$;

-- Add available_hours column if it does not exist
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'activities' AND column_name = 'available_hours') THEN
        ALTER TABLE activities ADD COLUMN available_hours TEXT[];
        RAISE NOTICE 'Column available_hours added to activities table.';
    END IF;
END $$;

-- Add consultation_type column if it does not exist
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'activities' AND column_name = 'consultation_type') THEN
        ALTER TABLE activities ADD COLUMN consultation_type TEXT;
        RAISE NOTICE 'Column consultation_type added to activities table.';
    END IF;
END $$;

-- Add videocall_duration column if it does not exist (renamed from consultation_duration)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'activities' AND column_name = 'videocall_duration') THEN
        ALTER TABLE activities ADD COLUMN videocall_duration INTEGER;
        RAISE NOTICE 'Column videocall_duration added to activities table.';
    END IF;
END $$;

-- Add rich_description column if it does not exist
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'activities' AND column_name = 'rich_description') THEN
        ALTER TABLE activities ADD COLUMN rich_description TEXT;
        RAISE NOTICE 'Column rich_description added to activities table.';
    END IF;
END $$;

-- Set default values for new columns if they are null
UPDATE activities
SET
    available_days = COALESCE(available_days, ARRAY['lun', 'mar', 'mié', 'jue', 'vie']),
    available_hours = COALESCE(available_hours, ARRAY['mañana', 'tarde']),
    consultation_type = COALESCE(consultation_type, 'message'),
    videocall_duration = COALESCE(videocall_duration, 30),
    rich_description = COALESCE(rich_description, '');

RAISE NOTICE 'Default values set for new columns in activities table.';
