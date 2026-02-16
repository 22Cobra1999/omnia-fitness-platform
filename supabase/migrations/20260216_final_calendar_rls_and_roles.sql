-- Migration: Final fix for calendar_event_participants RLS and Roles
-- Date: 2026-02-16

-- 1. Ensure Role constraint is consistent
DO $$ 
BEGIN
    ALTER TABLE public.calendar_event_participants 
    DROP CONSTRAINT IF EXISTS calendar_event_participants_role_check;

    ALTER TABLE public.calendar_event_participants
    ADD CONSTRAINT calendar_event_participants_role_check 
    CHECK (role IN ('coach', 'client', 'host', 'participant', 'guest'));
END $$;

-- 2. Consolidate RLS policies for participants
-- Overwrite previous policies to ensure a clean state
DROP POLICY IF EXISTS "Coaches can manage participants of their events" ON public.calendar_event_participants;
DROP POLICY IF EXISTS "Coaches can insert participants of their events" ON public.calendar_event_participants;
DROP POLICY IF EXISTS "Coaches can update participants of their events" ON public.calendar_event_participants;

-- Allow coach (owner) to do EVERYTHING with participants of their events
CREATE POLICY "Coaches full access to event participants"
  ON public.calendar_event_participants
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.calendar_events ce
      WHERE ce.id = calendar_event_participants.event_id
      AND ce.coach_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.calendar_events ce
      WHERE ce.id = calendar_event_participants.event_id
      AND ce.coach_id = auth.uid()
    )
  );

-- 3. Ensure clients can still see and update their own RSVP
DROP POLICY IF EXISTS "Clients can view their own participation" ON public.calendar_event_participants;
CREATE POLICY "Clients can view their own participation"
  ON public.calendar_event_participants
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Clients can update their own participation" ON public.calendar_event_participants;
CREATE POLICY "Clients can update their own participation"
  ON public.calendar_event_participants
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Reload config
NOTIFY pgrst, 'reload config';
