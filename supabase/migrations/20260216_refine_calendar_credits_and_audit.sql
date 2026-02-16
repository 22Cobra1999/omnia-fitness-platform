-- Migration: Refine calendar credits and add cancellation audit tracking
-- Date: 2026-02-16

-- 1. Add audit columns to calendar_events
ALTER TABLE public.calendar_events
  ADD COLUMN IF NOT EXISTS cancelled_by_user_id UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;

-- 2. Add audit column to participants to track credit deduction and avoid double-count
ALTER TABLE public.calendar_event_participants
  ADD COLUMN IF NOT EXISTS credits_deducted BOOLEAN NOT NULL DEFAULT FALSE;

-- 3. Refine the credit deduction trigger function
CREATE OR REPLACE FUNCTION public.deduct_meet_credit_on_confirm()
RETURNS TRIGGER AS $$
DECLARE
    v_coach_id UUID;
    v_ledger_exists BOOLEAN;
    v_is_bilateral_confirmation BOOLEAN;
BEGIN
    -- Only proceed if the participant status changed to 'confirmed' OR 'accepted'
    -- AND credits haven't been deducted yet.
    IF (NEW.rsvp_status = 'confirmed' OR NEW.rsvp_status = 'accepted') 
       AND (OLD.rsvp_status IS DISTINCT FROM 'confirmed' AND OLD.rsvp_status IS DISTINCT FROM 'accepted')
       AND (NEW.credits_deducted = FALSE) THEN
    
        -- Logic: We only deduct when BOTH a coach and a client are confirmed.
        -- Check if there is already a confirmed participant of the OTHER role.
        -- We get the coach_id first.
        SELECT coach_id INTO v_coach_id
        FROM public.calendar_events
        WHERE id = NEW.event_id;

        -- We check if this event now has at least one confirmed coach and one confirmed client.
        -- Case A: NEW is a client confirming. Check if any coach is already confirmed.
        -- Case B: NEW is a coach confirming. Check if any client is already confirmed.
        -- Actually, Case B (Coach confirming) is simpler: since there's typically one coach, 
        -- we check if the current NEW (if it is a coach) has a client already confirmed, 
        -- OR if current NEW (if it is client) has a coach already confirmed.

        SELECT EXISTS (
            SELECT 1 
            FROM public.calendar_event_participants cep
            WHERE cep.event_id = NEW.event_id
              AND (cep.rsvp_status = 'confirmed' OR cep.rsvp_status = 'accepted')
              AND cep.role != NEW.role
        ) INTO v_is_bilateral_confirmation;

        -- If bilateral confirmation is achieved:
        IF v_is_bilateral_confirmation THEN
            -- Find the client participant to apply deduction (if not already done)
            -- Note: We only deduct from the client.
            -- We need to identify who the client is.
            DECLARE
                v_client_user_id UUID;
            BEGIN
                SELECT user_id INTO v_client_user_id
                FROM public.calendar_event_participants
                WHERE event_id = NEW.event_id
                  AND role = 'client'
                  AND (rsvp_status = 'confirmed' OR rsvp_status = 'accepted')
                  AND credits_deducted = FALSE
                LIMIT 1;

                IF v_client_user_id IS NOT NULL THEN
                    -- Check if ledger exists
                    SELECT EXISTS (
                        SELECT 1 FROM public.client_meet_credits_ledger
                        WHERE coach_id = v_coach_id AND client_id = v_client_user_id
                    ) INTO v_ledger_exists;

                    IF v_ledger_exists THEN
                        -- 1. Deduct credits from ledger
                        UPDATE public.client_meet_credits_ledger
                        SET 
                            meet_credits_used = meet_credits_used + 1,
                            meet_credits_available = GREATEST(meet_credits_total - (meet_credits_used + 1), 0),
                            updated_at = NOW()
                        WHERE coach_id = v_coach_id AND client_id = v_client_user_id;

                        -- 2. Mark participant as deducted to prevent double-count
                        UPDATE public.calendar_event_participants
                        SET credits_deducted = TRUE
                        WHERE event_id = NEW.event_id AND user_id = v_client_user_id;
                    END IF;
                END IF;
            END;
        END IF;
    END IF;

    -- If the participant status is cancelled/declined, ensure we don't accidentally deduct later
    -- Or we could add logic to refund here if it was already deducted.
    -- For now, the user requested that if it wasn't accepted it shouldn't have been consumed.

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Trigger for Credit Refund on Event Cancellation (Full Event)
CREATE OR REPLACE FUNCTION public.refund_meet_credits_on_cancel()
RETURNS TRIGGER AS $$
DECLARE
    v_participant RECORD;
    v_ledger_exists BOOLEAN;
    v_hours_until_start NUMERIC;
    v_cancellation_window_hours INT := 24;
BEGIN
    -- Only proceed if status changed to 'cancelled'
    IF (NEW.status = 'cancelled') AND (OLD.status IS DISTINCT FROM 'cancelled') THEN
        
        -- Calculate hours until start
        v_hours_until_start := EXTRACT(EPOCH FROM (NEW.start_time - NOW())) / 3600;

        -- Find participants that had credits deducted
        FOR v_participant IN 
            SELECT * FROM public.calendar_event_participants 
            WHERE event_id = NEW.id 
              AND role = 'client' 
              AND credits_deducted = TRUE
        LOOP
            -- Check if we should refund (based on 24h window)
            IF v_hours_until_start >= v_cancellation_window_hours THEN
                -- Return credit to ledger
                SELECT EXISTS (
                    SELECT 1 FROM public.client_meet_credits_ledger
                    WHERE coach_id = NEW.coach_id AND client_id = v_participant.user_id
                ) INTO v_ledger_exists;

                IF v_ledger_exists THEN
                    UPDATE public.client_meet_credits_ledger
                    SET 
                        meet_credits_used = GREATEST(meet_credits_used - 1, 0),
                        meet_credits_available = meet_credits_available + 1,
                        updated_at = NOW()
                    WHERE coach_id = NEW.coach_id AND client_id = v_participant.user_id;

                    -- Mark as NOT deducted
                    UPDATE public.calendar_event_participants
                    SET credits_deducted = FALSE
                    WHERE id = v_participant.id;
                END IF;
            END IF;
        END LOOP;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_refund_credits_on_cancel ON public.calendar_events;
CREATE TRIGGER trg_refund_credits_on_cancel
AFTER UPDATE ON public.calendar_events
FOR EACH ROW
EXECUTE FUNCTION public.refund_meet_credits_on_cancel();

-- 6. Individual Refund Trigger (When RSVP goes to 'declined')
CREATE OR REPLACE FUNCTION public.refund_meet_credits_on_decline()
RETURNS TRIGGER AS $$
DECLARE
    v_coach_id UUID;
    v_start_time TIMESTAMP;
    v_hours_until_start NUMERIC;
    v_cancellation_window_hours INT := 24;
    v_ledger_exists BOOLEAN;
BEGIN
    -- Only proceed if rsvp_status changed to 'declined' and credits WERE deducted
    IF (NEW.rsvp_status = 'declined') AND (OLD.rsvp_status IS DISTINCT FROM 'declined') AND (OLD.credits_deducted = TRUE) THEN
        
        -- Get event info
        SELECT coach_id, start_time INTO v_coach_id, v_start_time
        FROM public.calendar_events
        WHERE id = NEW.event_id;

        -- Calculate hours until start
        v_hours_until_start := EXTRACT(EPOCH FROM (v_start_time - NOW())) / 3600;

        -- Check if we should refund (based on 24h window)
        IF v_hours_until_start >= v_cancellation_window_hours THEN
            -- Check ledger
            SELECT EXISTS (
                SELECT 1 FROM public.client_meet_credits_ledger
                WHERE coach_id = v_coach_id AND client_id = NEW.user_id
            ) INTO v_ledger_exists;

            IF v_ledger_exists THEN
                UPDATE public.client_meet_credits_ledger
                SET 
                    meet_credits_used = GREATEST(meet_credits_used - 1, 0),
                    meet_credits_available = meet_credits_available + 1,
                    updated_at = NOW()
                WHERE coach_id = v_coach_id AND client_id = NEW.user_id;

                -- Mark as NOT deducted
                NEW.credits_deducted := FALSE;
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_refund_credits_on_decline ON public.calendar_event_participants;
CREATE TRIGGER trg_refund_credits_on_decline
BEFORE UPDATE ON public.calendar_event_participants
FOR EACH ROW
EXECUTE FUNCTION public.refund_meet_credits_on_decline();

-- 7. Ensure the main deduction trigger is active
DROP TRIGGER IF EXISTS trg_deduct_credit_on_confirm ON public.calendar_event_participants;
CREATE TRIGGER trg_deduct_credit_on_confirm
AFTER INSERT OR UPDATE ON public.calendar_event_participants
FOR EACH ROW
EXECUTE FUNCTION public.deduct_meet_credit_on_confirm();

-- 7. Reload config
NOTIFY pgrst, 'reload config';
