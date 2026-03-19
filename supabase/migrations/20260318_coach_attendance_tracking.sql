-- Migration: Track coach attendance minutes
-- Date: 2026-03-18

ALTER TABLE public.calendar_events 
ADD COLUMN IF NOT EXISTS coach_attendance_minutes INTEGER DEFAULT 0;

COMMENT ON COLUMN public.calendar_events.coach_attendance_minutes IS 'Minutos que el coach estuvo conectado a la reunión';

-- Trigger to recalculate stats when coach_attendance_minutes changes
CREATE OR REPLACE FUNCTION trg_update_stats_on_coach_attendance()
RETURNS TRIGGER AS $$
BEGIN
    IF (OLD.coach_attendance_minutes IS DISTINCT FROM NEW.coach_attendance_minutes) THEN
        PERFORM calculate_coach_stats(NEW.coach_id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_stats_coach_attendance ON public.calendar_events;
CREATE TRIGGER trg_stats_coach_attendance
AFTER UPDATE OF coach_attendance_minutes ON public.calendar_events
FOR EACH ROW
EXECUTE FUNCTION trg_update_stats_on_coach_attendance();
