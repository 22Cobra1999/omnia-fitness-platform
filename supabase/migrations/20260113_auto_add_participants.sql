-- Trigger: Auto-add participants to calendar_event_participants on calendar_events INSERT
-- This ensures that when an event is created (by API or SQL), the corresponding participants are also created.

CREATE OR REPLACE FUNCTION public.auto_add_calendar_participants()
RETURNS TRIGGER AS $$
BEGIN
    -- 1. Add the Client (if client_id is present)
    IF NEW.client_id IS NOT NULL THEN
        INSERT INTO public.calendar_event_participants (
            event_id,
            client_id,
            participant_role,
            rsvp_status,
            invited_by_user_id,
            invited_by_role
        )
        VALUES (
            NEW.id,
            NEW.client_id,
            'client',
            'confirmed', -- Assume confirmed if they created it or were assigned? Or 'pending'? Let's go with 'confirmed' for now or default to 'pending' if invited by coach?
            -- Logic: If created_by_user_id (if we had it) == client_id, then confirmed. 
            -- But we don't have created_by reliably.
            -- Simplify: 'confirmed' for the client if existing logic implies booking.
            -- Actually, usually booking = confirmed.
            'confirmed', 
            NEW.coach_id, -- Invited by Coach (or self if booking? doesn't matter much for visibility)
            'coach'
        )
        ON CONFLICT DO NOTHING;
    END IF;

    -- 2. Add the Coach
    IF NEW.coach_id IS NOT NULL THEN
        INSERT INTO public.calendar_event_participants (
            event_id,
            client_id,
            participant_role,
            rsvp_status,
            invited_by_user_id,
            invited_by_role,
            is_host
        )
        VALUES (
            NEW.id,
            NEW.coach_id,
            'coach',
            'confirmed',
            NEW.coach_id,
            'coach',
            TRUE
        )
        ON CONFLICT DO NOTHING;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Remove valid trigger if exists to avoid duplication errors during repeated runs
DROP TRIGGER IF EXISTS trg_auto_add_calendar_participants ON public.calendar_events;

CREATE TRIGGER trg_auto_add_calendar_participants
    AFTER INSERT ON public.calendar_events
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_add_calendar_participants();
