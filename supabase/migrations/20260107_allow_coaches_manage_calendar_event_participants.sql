ALTER TABLE public.calendar_event_participants ENABLE ROW LEVEL SECURITY;

-- Coaches can create participant rows for events they own
DROP POLICY IF EXISTS "Coaches can insert participants of their events" ON public.calendar_event_participants;
CREATE POLICY "Coaches can insert participants of their events"
  ON public.calendar_event_participants
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.calendar_events ce
      WHERE ce.id = calendar_event_participants.event_id
        AND ce.coach_id = auth.uid()
    )
  );

-- Coaches can update participant rows for events they own (needed for upsert)
DROP POLICY IF EXISTS "Coaches can update participants of their events" ON public.calendar_event_participants;
CREATE POLICY "Coaches can update participants of their events"
  ON public.calendar_event_participants
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.calendar_events ce
      WHERE ce.id = calendar_event_participants.event_id
        AND ce.coach_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.calendar_events ce
      WHERE ce.id = calendar_event_participants.event_id
        AND ce.coach_id = auth.uid()
    )
  );
