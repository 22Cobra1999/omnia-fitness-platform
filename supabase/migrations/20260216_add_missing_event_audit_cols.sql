-- Migration: Add missing audit and initiator columns to calendar_events
-- Date: 2026-02-16

-- 1. Add columns to calendar_events
ALTER TABLE public.calendar_events
  ADD COLUMN IF NOT EXISTS invited_by_user_id UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS created_by_user_id UUID REFERENCES auth.users(id);

-- 2. Backfill for existing records (Best effort)
-- We assume coach_id is the creator/inviter for legacy records where this is null
UPDATE public.calendar_events
SET 
  created_by_user_id = COALESCE(created_by_user_id, coach_id),
  invited_by_user_id = COALESCE(invited_by_user_id, coach_id)
WHERE created_by_user_id IS NULL OR invited_by_user_id IS NULL;

-- 3. Add comments for documentation
COMMENT ON COLUMN public.calendar_events.invited_by_user_id IS 'ID of the user who initiated the invitation (coach or client)';
COMMENT ON COLUMN public.calendar_events.created_by_user_id IS 'ID of the user who physically created the record';

-- 4. Reload config
NOTIFY pgrst, 'reload config';
