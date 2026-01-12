-- Trigger to deduct credits when RSVP is confirmed
-- This ensures credits are only used when the meet is actually confirmed by the coach.

CREATE OR REPLACE FUNCTION public.deduct_meet_credit_on_confirm()
RETURNS TRIGGER AS $$
DECLARE
  v_coach_id UUID;
  v_ledger_exists BOOLEAN;
BEGIN
  -- Only proceed if status changed to 'confirmed'
  IF NEW.rsvp_status = 'confirmed' AND (OLD.rsvp_status IS DISTINCT FROM 'confirmed') THEN
    
    -- Get coach_id from the event
    SELECT coach_id INTO v_coach_id
    FROM public.calendar_events
    WHERE id = NEW.event_id;

    -- Check if ledger entry exists
    SELECT EXISTS (
        SELECT 1 FROM public.client_meet_credits_ledger
        WHERE coach_id = v_coach_id AND client_id = NEW.client_id
    ) INTO v_ledger_exists;

    IF v_ledger_exists THEN
        -- Update the ledger: increment used, recalculate available
        UPDATE public.client_meet_credits_ledger
        SET 
            meet_credits_used = meet_credits_used + 1,
            meet_credits_available = GREATEST(meet_credits_total - (meet_credits_used + 1), 0),
            updated_at = NOW()
        WHERE coach_id = v_coach_id AND client_id = NEW.client_id;
    END IF;
    
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists to allow re-runs
DROP TRIGGER IF EXISTS trg_deduct_credit_on_confirm ON public.calendar_event_participants;

-- Create Trigger
CREATE TRIGGER trg_deduct_credit_on_confirm
AFTER UPDATE ON public.calendar_event_participants
FOR EACH ROW
EXECUTE FUNCTION public.deduct_meet_credit_on_confirm();
