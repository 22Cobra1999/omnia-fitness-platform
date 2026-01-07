ALTER TABLE public.calendar_event_participants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Clients can insert their own participation" ON public.calendar_event_participants;
CREATE POLICY "Clients can insert their own participation"
  ON public.calendar_event_participants
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = client_id);

DROP POLICY IF EXISTS "Clients can update their own participation" ON public.calendar_event_participants;
CREATE POLICY "Clients can update their own participation"
  ON public.calendar_event_participants
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = client_id)
  WITH CHECK (auth.uid() = client_id);
