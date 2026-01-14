-- Trigger: Bump participant updated_at when a Reschedule Request is created/updated
-- This ensures the notification bubbles up to the top of the list.

CREATE OR REPLACE FUNCTION public.bump_participant_on_reschedule()
RETURNS TRIGGER AS $$
BEGIN
    -- Update all participants for this event to set updated_at = NOW()
    UPDATE public.calendar_event_participants
    SET updated_at = NOW()
    WHERE event_id = NEW.event_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_bump_participant_on_reschedule ON public.calendar_event_reschedule_requests;

CREATE TRIGGER trg_bump_participant_on_reschedule
    AFTER INSERT OR UPDATE ON public.calendar_event_reschedule_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.bump_participant_on_reschedule();
