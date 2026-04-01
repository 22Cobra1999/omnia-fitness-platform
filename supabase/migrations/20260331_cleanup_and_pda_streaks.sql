-- ==============================================================================
-- MIGRATION: CLEANUP AND PDA STREAK TRACKING
-- Drops temporary tables and adds streak snapshotting to daily progress.
-- ==============================================================================

-- 1. DROP TEMPORARY TABLES
DROP TABLE IF EXISTS public.pda_temp_recovery;
DROP TABLE IF EXISTS public.video_migration_log;

-- 2. ADD STREAK COLUMN TO PDA
ALTER TABLE public.progreso_diario_actividad 
ADD COLUMN IF NOT EXISTS streak INT DEFAULT 0;

-- 3. UPDATE STREAK TRIGGER TO PERSIST SNAPSHOTS
CREATE OR REPLACE FUNCTION public.tg_update_enrollment_streak()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
    v_streak_data RECORD;
BEGIN
    -- Recalculate streak for this enrollment
    SELECT * INTO v_streak_data FROM public.fn_calculate_enrollment_streak(NEW.enrollment_id);
    
    -- Update the main enrollment record
    UPDATE public.activity_enrollments
    SET current_streak = v_streak_data.new_streak,
        last_streak_date = v_streak_data.last_date
    WHERE id = NEW.enrollment_id;
    
    -- Update the daily progress record with the current streak snapshot
    -- We only update it if the record being inserted/updated is for TODAY or the latest record.
    -- To keep it simple and clean, we update the streak for the specific PDA record being touched.
    UPDATE public.progreso_diario_actividad
    SET streak = v_streak_data.new_streak
    WHERE id = NEW.id;
    
    RETURN NEW;
END;
$$;

-- 4. BACKFILL STREAKS FOR RECENT PDA RECORDS (Optional but recommended)
UPDATE public.progreso_diario_actividad pda
SET streak = (
    SELECT current_streak 
    FROM public.activity_enrollments 
    WHERE id = pda.enrollment_id
)
WHERE fecha = CURRENT_DATE;
