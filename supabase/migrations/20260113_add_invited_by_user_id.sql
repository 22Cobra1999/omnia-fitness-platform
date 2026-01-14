-- Add invited_by_user_id to calendar_event_participants
ALTER TABLE public.calendar_event_participants
ADD COLUMN IF NOT EXISTS invited_by_user_id UUID REFERENCES auth.users(id);

-- Add comment
COMMENT ON COLUMN public.calendar_event_participants.invited_by_user_id IS 'ID of the user who invited this participant (e.g. coach or client)';

-- Backfill logic (optional/best-effort)
-- For existing rows which are 'coach', invited_by_user_id = self (coach)? Or NULL?
-- For 'client' participants, invited_by_user_id = coach_id (from event) IF event was created by coach.
-- Since we don't have creator_id on event, we assume coach_id for now for existing events.

DO $$
BEGIN
    UPDATE public.calendar_event_participants cmp
    SET invited_by_user_id = ce.coach_id
    FROM public.calendar_events ce
    WHERE cmp.event_id = ce.id
    AND cmp.invited_by_user_id IS NULL;
END $$;
