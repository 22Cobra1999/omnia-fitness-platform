-- Add videocall_duration column if it does not exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'activities' AND column_name = 'videocall_duration') THEN
        ALTER TABLE activities
        ADD COLUMN videocall_duration INTEGER;
        RAISE NOTICE 'Column videocall_duration added to activities table.';
    ELSE
        RAISE NOTICE 'Column videocall_duration already exists in activities table.';
    END IF;
END
$$;

-- Add rich_description column if it does not exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'activities' AND column_name = 'rich_description') THEN
        ALTER TABLE activities
        ADD COLUMN rich_description TEXT;
        RAISE NOTICE 'Column rich_description added to activities table.';
    ELSE
        RAISE NOTICE 'Column rich_description already exists in activities table.';
    END IF;
END
$$;
