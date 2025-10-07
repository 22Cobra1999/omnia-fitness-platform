-- This script ensures all necessary columns for the 'activities' table are present.
-- It's designed to be idempotent, meaning it can be run multiple times without issues.

-- Add 'rich_description' column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='activities' AND column_name='rich_description') THEN
        ALTER TABLE activities ADD COLUMN rich_description TEXT;
        RAISE NOTICE 'Column rich_description added to activities table.';
    END IF;
END
$$;

-- Add 'vimeo_id' column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='activities' AND column_name='vimeo_id') THEN
        ALTER TABLE activities ADD COLUMN vimeo_id TEXT;
        RAISE NOTICE 'Column vimeo_id added to activities table.';
    END IF;
END
$$;

-- Add 'pdf_url' column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='activities' AND column_name='pdf_url') THEN
        ALTER TABLE activities ADD COLUMN pdf_url TEXT;
        RAISE NOTICE 'Column pdf_url added to activities table.';
    END IF;
END
$$;

-- Add 'availability_type' column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='activities' AND column_name='availability_type') THEN
        ALTER TABLE activities ADD COLUMN availability_type TEXT DEFAULT 'immediate_purchase';
        RAISE NOTICE 'Column availability_type added to activities table.';
    END IF;
END
$$;

-- Add 'session_type' column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='activities' AND column_name='session_type') THEN
        ALTER TABLE activities ADD COLUMN session_type TEXT DEFAULT 'individual';
        RAISE NOTICE 'Column session_type added to activities table.';
    END IF;
END
$$;

-- Add 'available_slots' column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='activities' AND column_name='available_slots') THEN
        ALTER TABLE activities ADD COLUMN available_slots INTEGER;
        RAISE NOTICE 'Column available_slots added to activities table.';
    END IF;
END
$$;

-- Add 'program_duration' column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='activities' AND column_name='program_duration') THEN
        ALTER TABLE activities ADD COLUMN program_duration TEXT;
        RAISE NOTICE 'Column program_duration added to activities table.';
    END IF;
END
$$;

-- Add 'consultation_type' column if it doesn't exist (for activities table, distinct from coach_availability)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='activities' AND column_name='consultation_type') THEN
        ALTER TABLE activities ADD COLUMN consultation_type TEXT[];
        RAISE NOTICE 'Column consultation_type added to activities table.';
    END IF;
END
$$;

-- Add 'videocall_duration' column if it doesn't exist (for activities table, distinct from coach_availability)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='activities' AND column_name='videocall_duration') THEN
        ALTER TABLE activities ADD COLUMN videocall_duration INTEGER;
        RAISE NOTICE 'Column videocall_duration added to activities table.';
    END IF;
END
$$;

-- Add 'available_days' column if it doesn't exist (for activities table, distinct from coach_availability)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='activities' AND column_name='available_days') THEN
        ALTER TABLE activities ADD COLUMN available_days TEXT[];
        RAISE NOTICE 'Column available_days added to activities table.';
    END IF;
END
$$;

-- Add 'available_hours' column if it doesn't exist (for activities table, distinct from coach_availability)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='activities' AND column_name='available_hours') THEN
        ALTER TABLE activities ADD COLUMN available_hours TEXT[];
        RAISE NOTICE 'Column available_hours added to activities table.';
    END IF;
END
$$;
