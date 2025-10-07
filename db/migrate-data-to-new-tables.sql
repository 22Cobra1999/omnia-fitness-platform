-- Temporarily disable RLS for activities_base to allow migration
ALTER TABLE activities_base DISABLE ROW LEVEL SECURITY;

-- Migrate data from old 'activities' table to new normalized tables
DO $$
DECLARE
    activity_record RECORD;
    v_activity_id BIGINT;
BEGIN
    -- Check if the old 'activities' table exists and has data
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'activities') THEN
        RAISE NOTICE 'Migrating data from old "activities" table...';

        FOR activity_record IN SELECT * FROM public.activities
        LOOP
            -- Insert into activities_base
            INSERT INTO public.activities_base (
                id, title, description, type, difficulty, price, coach_id, is_public, created_at, updated_at,
                program_rating, total_program_reviews, coach_rating
            ) VALUES (
                activity_record.id,
                activity_record.title,
                activity_record.description,
                COALESCE(activity_record.type, activity_record.category, 'other'), -- Use type, then category, then 'other'
                COALESCE(activity_record.level, activity_record.difficulty, 'beginner'),
                COALESCE(activity_record.price, 0),
                activity_record.coach_id,
                COALESCE(activity_record.is_public, TRUE),
                COALESCE(activity_record.created_at, NOW()),
                COALESCE(activity_record.updated_at, NOW()),
                activity_record.program_rating,
                activity_record.total_program_reviews,
                activity_record.coach_rating
            )
            ON CONFLICT (id) DO UPDATE SET
                title = EXCLUDED.title,
                description = EXCLUDED.description,
                type = EXCLUDED.type,
                difficulty = EXCLUDED.difficulty,
                price = EXCLUDED.price,
                coach_id = EXCLUDED.coach_id,
                is_public = EXCLUDED.is_public,
                updated_at = EXCLUDED.updated_at,
                program_rating = EXCLUDED.program_rating,
                total_program_reviews = EXCLUDED.total_program_reviews,
                coach_rating = EXCLUDED.coach_rating;

            v_activity_id := activity_record.id;

            -- Insert into activity_media
            IF activity_record.image_url IS NOT NULL OR activity_record.video_url IS NOT NULL OR activity_record.vimeo_id IS NOT NULL OR activity_record.pdf_url IS NOT NULL THEN
                INSERT INTO public.activity_media (activity_id, image_url, video_url, vimeo_id, pdf_url)
                VALUES (v_activity_id, activity_record.image_url, activity_record.video_url, activity_record.vimeo_id, activity_record.pdf_url)
                ON CONFLICT (activity_id) DO UPDATE SET
                    image_url = EXCLUDED.image_url,
                    video_url = EXCLUDED.video_url,
                    vimeo_id = EXCLUDED.vimeo_id,
                    pdf_url = EXCLUDED.pdf_url;
            END IF;

            -- Insert into activity_program_info (if applicable, based on type or existing columns)
            IF activity_record.type IN ('fitness', 'nutrition', 'program') OR activity_record.duration_minutes IS NOT NULL OR activity_record.calories IS NOT NULL OR activity_record.program_duration IS NOT NULL OR activity_record.rich_description IS NOT NULL THEN
                INSERT INTO public.activity_program_info (activity_id, duration, calories, program_duration, rich_description, interactive_pauses)
                VALUES (
                    v_activity_id,
                    COALESCE(activity_record.duration_minutes, activity_record.duration), -- Use duration_minutes if exists, else generic duration
                    activity_record.calories,
                    activity_record.program_duration,
                    activity_record.rich_description,
                    COALESCE(activity_record.interactive_pauses, FALSE)
                )
                ON CONFLICT (activity_id) DO UPDATE SET
                    duration = EXCLUDED.duration,
                    calories = EXCLUDED.calories,
                    program_duration = EXCLUDED.program_duration,
                    rich_description = EXCLUDED.rich_description,
                    interactive_pauses = EXCLUDED.interactive_pauses;
            END IF;

            -- Insert into activity_availability (if applicable, based on type or existing columns)
            IF activity_record.availability_type IS NOT NULL OR activity_record.session_type IS NOT NULL THEN
                INSERT INTO public.activity_availability (activity_id, availability_type, session_type, available_slots, available_days, available_hours)
                VALUES (
                    v_activity_id,
                    COALESCE(activity_record.availability_type, 'immediate_purchase'),
                    COALESCE(activity_record.session_type, 'individual'),
                    activity_record.available_slots,
                    activity_record.available_days,
                    activity_record.available_hours
                )
                ON CONFLICT (activity_id) DO UPDATE SET
                    availability_type = EXCLUDED.availability_type,
                    session_type = EXCLUDED.session_type,
                    available_slots = EXCLUDED.available_slots,
                    available_days = EXCLUDED.available_days,
                    available_hours = EXCLUDED.available_hours;
            END IF;

            -- Insert into activity_consultation_info (if type is 'consultation' or related fields exist)
            IF activity_record.type = 'consultation' OR activity_record.includes_videocall IS NOT NULL OR activity_record.includes_message IS NOT NULL THEN
                INSERT INTO public.activity_consultation_info (activity_id, includes_videocall, includes_message, videocall_duration, available_days, available_hours, expiration_date)
                VALUES (
                    v_activity_id,
                    COALESCE(activity_record.includes_videocall, FALSE),
                    COALESCE(activity_record.includes_message, FALSE),
                    activity_record.videocall_duration,
                    activity_record.consultation_available_days, -- Assuming specific column for consultation days
                    activity_record.consultation_available_hours, -- Assuming specific column for consultation hours
                    activity_record.expiration_date
                )
                ON CONFLICT (activity_id) DO UPDATE SET
                    includes_videocall = EXCLUDED.includes_videocall,
                    includes_message = EXCLUDED.includes_message,
                    videocall_duration = EXCLUDED.videocall_duration,
                    available_days = EXCLUDED.available_days,
                    available_hours = EXCLUDED.available_hours,
                    expiration_date = EXCLUDED.expiration_date;
            END IF;

            -- Insert into activity_tags (if tags column exists and is an array)
            IF activity_record.tags IS NOT NULL AND jsonb_typeof(activity_record.tags) = 'array' THEN
                INSERT INTO public.activity_tags (activity_id, tag_type, tag_value)
                SELECT v_activity_id, 'general', tag_value
                FROM jsonb_array_elements_text(activity_record.tags) AS tag_value
                ON CONFLICT (activity_id, tag_type, tag_value) DO NOTHING;
            END IF;

        END LOOP;
        RAISE NOTICE 'Data migration completed.';
    ELSE
        RAISE NOTICE 'Old "activities" table does not exist. Skipping migration.';
    END IF;
END $$;

-- Re-enable RLS for activities_base
ALTER TABLE activities_base ENABLE ROW LEVEL SECURITY;
