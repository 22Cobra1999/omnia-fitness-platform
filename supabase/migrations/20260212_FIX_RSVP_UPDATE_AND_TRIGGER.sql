-- ==============================================================================
-- FINAL FIX FOR RSVP UPDATES AND CREDIT TRIGGERS
-- ==============================================================================

-- 1. DROP AND RECREATE THE UPDATE POLICY FOR PARTICIPANTS
DROP POLICY IF EXISTS "Clients can update their own participation" ON public.calendar_event_participants;

CREATE POLICY "Clients can update their own participation"
  ON public.calendar_event_participants
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 2. FIX THE TRIGGER FUNCTION (Use user_id instead of client_id)
CREATE OR REPLACE FUNCTION public.deduct_meet_credit_on_confirm()
RETURNS TRIGGER AS $$
DECLARE
    v_coach_id UUID;
    v_ledger_exists BOOLEAN;
BEGIN
    -- Only proceed if status changed to 'confirmed' OR 'accepted'
    IF (NEW.rsvp_status = 'confirmed' OR NEW.rsvp_status = 'accepted') 
       AND (OLD.rsvp_status IS DISTINCT FROM 'confirmed' AND OLD.rsvp_status IS DISTINCT FROM 'accepted') THEN
    
        -- Get coach_id from the event
        SELECT coach_id INTO v_coach_id
        FROM public.calendar_events
        WHERE id = NEW.event_id;

        -- Check if ledger entry exists using user_id not client_id
        SELECT EXISTS (
            SELECT 1 FROM public.client_meet_credits_ledger
            WHERE coach_id = v_coach_id AND client_id = NEW.user_id
        ) INTO v_ledger_exists;

        IF v_ledger_exists THEN
            -- Update the ledger
            UPDATE public.client_meet_credits_ledger
            SET 
                meet_credits_used = meet_credits_used + 1,
                meet_credits_available = GREATEST(meet_credits_total - (meet_credits_used + 1), 0),
                updated_at = NOW()
            WHERE coach_id = v_coach_id AND client_id = NEW.user_id;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. ENSURE TRIGGER EXISTS
DROP TRIGGER IF EXISTS trg_deduct_credit_on_confirm ON public.calendar_event_participants;

CREATE TRIGGER trg_deduct_credit_on_confirm
AFTER UPDATE ON public.calendar_event_participants
FOR EACH ROW
EXECUTE FUNCTION public.deduct_meet_credit_on_confirm();
