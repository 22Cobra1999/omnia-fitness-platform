-- Force schema cache reload by executing DDL
-- This is often more reliable than just NOTIFY if the listener isn't perfectly configured

NOTIFY pgrst, 'reload schema';

COMMENT ON TABLE public.calendar_events IS 'Calendar events for coaches and clients';
COMMENT ON COLUMN public.calendar_events.client_id IS 'Reference to the client user who participated or booked only if application';
