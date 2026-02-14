-- Create a function to handle RSVP updates with credit logic
CREATE OR REPLACE FUNCTION update_rsvp_and_credits(
    p_event_id UUID,
    p_user_id UUID,
    p_status TEXT -- 'confirmed', 'declined', 'cancelled'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_event RECORD;
    v_old_rsvp TEXT;
    v_credits_to_return INT := 0;
    v_cancellation_window_hours INT := 24; -- Configurable?
    v_hours_until_start NUMERIC;
    v_user_profile RECORD;
BEGIN
    -- 1. Get Event Details
    SELECT * INTO v_event FROM calendar_events WHERE id = p_event_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Event not found';
    END IF;

    -- 2. Get Current RSVP
    SELECT rsvp_status INTO v_old_rsvp
    FROM calendar_event_participants
    WHERE calendar_event_id = p_event_id AND (user_id = p_user_id OR client_id = p_user_id);

    -- 3. Logic for DECLLINING/CANCELLING
    IF p_status IN ('declined', 'cancelled') THEN
        -- Check if it was previously confirmed/accepted
        IF v_old_rsvp IN ('confirmed', 'accepted') THEN
            -- Calculate hours until start
            v_hours_until_start := EXTRACT(EPOCH FROM (v_event.start_time - NOW())) / 3600;

            -- IF > 24 hours, RETURN CREDIT
            IF v_hours_until_start >= v_cancellation_window_hours THEN
                v_credits_to_return := 1;
            ELSE
                 -- Late cancellation -> No credit return (Per Policy)
                 v_credits_to_return := 0;
            END IF;

            -- UPDATE USER CREDITS
            IF v_credits_to_return > 0 THEN
                UPDATE profiles
                SET meet_credits = meet_credits + v_credits_to_return
                WHERE id = p_user_id;
            END IF;
        END IF;

    -- 4. Logic for ACCEPTING (Consuming Credit)
    ELSIF p_status IN ('accepted', 'confirmed') AND v_old_rsvp NOT IN ('accepted', 'confirmed') THEN
         -- Check if user has credits
         SELECT * INTO v_user_profile FROM profiles WHERE id = p_user_id;
         IF v_user_profile.meet_credits > 0 THEN
             UPDATE profiles
             SET meet_credits = meet_credits - 1
             WHERE id = p_user_id;
         ELSE
             RAISE EXCEPTION 'Insufficient credits';
         END IF;
    END IF;

    -- 5. UPDATE RSVP
    UPDATE calendar_event_participants
    SET rsvp_status = p_status,
        updated_at = NOW()
    WHERE calendar_event_id = p_event_id AND (user_id = p_user_id OR client_id = p_user_id);

    -- 6. Update Event Status if needed (e.g. revive cancelled event logic handled elsewhere or here?)
    -- For now, we assume this function is primarily for RSVP.
    -- If event was cancelled and user accepts, we might need to revive it?
    -- Logic from frontend: "if ((newStatus === 'accepted'...) && selectedMeetEvent.status === 'cancelled')"
    -- We can handle that here too for safety.

    IF (p_status IN ('accepted', 'confirmed')) AND v_event.status = 'cancelled' THEN
        UPDATE calendar_events
        SET status = 'confirmed',
            lifecycle_data = public.jsonb_set(
                public.jsonb_set(lifecycle_data, '{cancelled_at}', 'null'),
                '{cancelled_by}', 'null'
            )
        WHERE id = p_event_id;
    END IF;


    RETURN jsonb_build_object(
        'success', true,
        'credits_returned', v_credits_to_return,
        'new_status', p_status
    );
END;
$$;
