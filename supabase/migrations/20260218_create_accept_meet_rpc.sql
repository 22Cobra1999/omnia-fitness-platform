-- Function to allow a user (client or coach) to accept a meet invitation
-- and automatically confirm the event if it is a 1:1 meet.
-- Added p_user_id for cases where auth.uid() might be null in client calls.

CREATE OR REPLACE FUNCTION public.accept_meet_invitation(
    p_event_id UUID,
    p_user_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with privileges of the function creator (postgres), bypassing RLS
AS $$
DECLARE
    v_user_id UUID;
    v_event_type TEXT;
    v_is_grupal BOOLEAN;
    v_current_status TEXT;
    v_result JSONB;
BEGIN
    -- Determine which User ID to use
    v_user_id := COALESCE(auth.uid(), p_user_id);

    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'USER_NOT_IDENTIFIED',
            'message', 'No se pudo identificar al usuario (auth.uid() is null and p_user_id is null)'
        );
    END IF;

    -- 1. Verify the user is a participant of this event
    IF NOT EXISTS (
        SELECT 1 FROM public.calendar_event_participants
        WHERE event_id = p_event_id AND user_id = v_user_id
    ) THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'NOT_A_PARTICIPANT',
            'message', 'El usuario no es un participante de este evento',
            'debug_user_id', v_user_id,
            'debug_event_id', p_event_id
        );
    END IF;

    -- 2. Update the participant's status to 'accepted'
    UPDATE public.calendar_event_participants
    SET rsvp_status = 'accepted',
        updated_at = NOW()
    WHERE event_id = p_event_id AND user_id = v_user_id;

    -- 3. Get event details to decide if we should confirm the event
    SELECT event_type, status
    INTO v_event_type, v_current_status
    FROM public.calendar_events
    WHERE id = p_event_id;

    v_is_grupal := (v_event_type = 'workshop');

    -- 4. If it is NOT a group event (i.e. it's a 1:1 meet), update event status to 'confirmed'
    IF NOT v_is_grupal AND v_current_status != 'confirmed' THEN
        UPDATE public.calendar_events
        SET status = 'confirmed',
            updated_at = NOW()
        WHERE id = p_event_id;
        
        v_current_status := 'confirmed';
    END IF;

    -- 5. Return success and new status
    v_result := jsonb_build_object(
        'success', true,
        'event_id', p_event_id,
        'new_rsvp_status', 'accepted',
        'event_status', v_current_status
    );

    RETURN v_result;
END;
$$;
