-- Ensure RLS policies exist so clients can see meets they participate in

-- calendar_event_participants: client SELECT + coach SELECT/INSERT/UPDATE
ALTER TABLE public.calendar_event_participants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Clients can view their own participation" ON public.calendar_event_participants;
CREATE POLICY "Clients can view their own participation"
  ON public.calendar_event_participants
  FOR SELECT
  TO authenticated
  USING (auth.uid() = client_id);

DROP POLICY IF EXISTS "Coaches can view participants of their events" ON public.calendar_event_participants;
CREATE POLICY "Coaches can view participants of their events"
  ON public.calendar_event_participants
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.calendar_events ce
      WHERE ce.id = calendar_event_participants.event_id
        AND ce.coach_id = auth.uid()
    )
  );

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

-- calendar_events: client SELECT via participation
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Clients can view events they participate in" ON public.calendar_events;
CREATE POLICY "Clients can view events they participate in"
  ON public.calendar_events
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.calendar_event_participants cep
      WHERE cep.event_id = calendar_events.id
        AND cep.client_id = auth.uid()
    )
  );
