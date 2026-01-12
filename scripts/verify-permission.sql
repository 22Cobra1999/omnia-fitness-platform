DO $$
DECLARE
    v_client_id UUID := '00dedc23-0b17-4e50-b84e-b2e8100dc93c';
    v_coach_id UUID := 'b16c4f8c-f47b-4df0-ad2b-13dcbd76263f';
    v_event_id UUID;
BEGIN
    -- Establecer configuración de usuario autenticado
    PERFORM set_config('request.jwt.claims', '{"sub": "' || v_client_id || '", "role": "authenticated"}', true);
    PERFORM set_config('role', 'authenticated', true);

    -- Test Case 1: Null Description, Null Activity ID (simulating NaN -> null)
    -- Also testing specific future date
    INSERT INTO public.calendar_events (
        coach_id,
        client_id,
        title,
        description,
        activity_id,
        start_time,
        end_time,
        event_type,
        status
    ) VALUES (
        v_coach_id,
        v_client_id,
        'Test Payload Match',
        NULL, -- description is null
        NULL, -- activity_id is null
        '2026-01-13T12:00:00.000Z',
        '2026-01-13T12:30:00.000Z',
        'consultation',
        'scheduled'
    ) RETURNING id INTO v_event_id;

    RAISE NOTICE 'Insert SUCCESS. Event ID: %', v_event_id;

    -- Cleanup
    DELETE FROM public.calendar_events WHERE id = v_event_id;

EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Insert FAILED with error: % %', SQLSTATE, SQLERRM;
END $$;
