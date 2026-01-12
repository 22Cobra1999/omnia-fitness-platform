-- Reproduce RLS Failure (With Logging)
-- Purpose: Simulate the exact user request in SQL and log success/failure/triggers.

TRUNCATE TABLE public.debug_log_table;

DO $$
DECLARE
    r RECORD;
    v_event_id uuid;
BEGIN
    INSERT INTO public.debug_log_table (log_key, log_value) VALUES ('START', 'Simulating Request...');

    -- 1. Simulate Auth User
    -- User ID from logs: 00dedc23-0b17-4e50-b84e-b2e8100dc93c
    PERFORM set_config('role', 'authenticated', true);
    PERFORM set_config('request.jwt.claim.sub', '00dedc23-0b17-4e50-b84e-b2e8100dc93c', true);

    INSERT INTO public.debug_log_table (log_key, log_value) VALUES ('INFO', 'Role set to authenticated, User ID 00dedc23...');

    -- 2. Attempt Insert (Matching Payload)
    BEGIN
        INSERT INTO public.calendar_events (
            coach_id,
            client_id,
            title,
            description,
            start_time,
            end_time,
            event_type,
            status,
            is_free
        ) VALUES (
            'b16c4f8c-f47b-4df0-ad2b-13dcbd76263f', -- coach_id
            '00dedc23-0b17-4e50-b84e-b2e8100dc93c', -- client_id (MATCHES USER)
            'Meet',
            NULL,
            '2026-01-20T11:30:00.000Z',
            '2026-01-20T12:00:00.000Z',
            'consultation',
            'scheduled',
            FALSE
        ) RETURNING id INTO v_event_id;

        INSERT INTO public.debug_log_table (log_key, log_value) VALUES ('SUCCESS', 'Inserted Event ID: ' || v_event_id);
    EXCEPTION WHEN OTHERS THEN
        INSERT INTO public.debug_log_table (log_key, log_value) VALUES ('ERROR', SQLERRM || ' (Code: ' || SQLSTATE || ')');
    END;

    -- 3. Check Triggers (Must switch back to superuser usually, but let's try reading schema here)
    -- Information schema is readable by everyone usually.
    FOR r IN 
        SELECT trigger_name, action_statement 
        FROM information_schema.triggers 
        WHERE event_object_table = 'calendar_events'
    LOOP
        INSERT INTO public.debug_log_table (log_key, log_value) 
        VALUES ('TRIGGER', r.trigger_name || ' -> ' || substring(r.action_statement from 1 for 50));
    END LOOP;

END $$;
