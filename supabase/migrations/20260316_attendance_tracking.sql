-- Migration: Add attendance tracking to calendar events
-- Date: 2026-03-16

-- 1. Add attendance_status column to calendar_event_participants
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'calendar_event_participants' 
        AND column_name = 'attendance_status'
    ) THEN
        ALTER TABLE public.calendar_event_participants 
        ADD COLUMN attendance_status TEXT DEFAULT 'pending' 
        CHECK (attendance_status IN ('pending', 'present', 'absent'));
    END IF;
END $$;

COMMENT ON COLUMN public.calendar_event_participants.attendance_status IS 'Estado de asistencia a la sesión: pending, present, absent';

-- 2. Add last_sync_attendance_at to calendar_events if we want to track Google Meet sync
ALTER TABLE public.calendar_events
ADD COLUMN IF NOT EXISTS last_sync_attendance_at TIMESTAMPTZ;

-- 3. Add attendance_minutes to calendar_event_participants
ALTER TABLE public.calendar_event_participants 
ADD COLUMN IF NOT EXISTS attendance_minutes INTEGER DEFAULT 0;

COMMENT ON COLUMN public.calendar_event_participants.attendance_minutes IS 'Minutos que el participante estuvo conectado a la reunión';
