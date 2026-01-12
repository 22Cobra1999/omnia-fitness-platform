-- Force Policy Replacement (v2)
-- Drops "Clients can create their own events"
-- Creates "Clients can create their own events v2" with correct check: (auth.uid() = client_id)

TRUNCATE TABLE public.debug_log_table;

DO $$
DECLARE
    r RECORD;
BEGIN
    INSERT INTO public.debug_log_table (log_key, log_value) VALUES ('START', 'Replacing Policy...');

    -- 1. Drop old policy
    DROP POLICY IF EXISTS "Clients can create their own events" ON public.calendar_events;
    INSERT INTO public.debug_log_table (log_key, log_value) VALUES ('ACTION', 'Dropped old policy');

    -- 1b. Drop new policy if it exists (for idempotency)
    DROP POLICY IF EXISTS "Clients can create their own events v2" ON public.calendar_events;
    INSERT INTO public.debug_log_table (log_key, log_value) VALUES ('ACTION', 'Dropped existing policy v2 (if any)');

    -- 2. Create new policy
    CREATE POLICY "Clients can create their own events v2"
    ON public.calendar_events
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = client_id);
    INSERT INTO public.debug_log_table (log_key, log_value) VALUES ('ACTION', 'Created new policy v2');

    -- 3. Verify immediately
    FOR r IN 
        SELECT policyname, with_check
        FROM pg_policies
        WHERE tablename = 'calendar_events'
    LOOP
        INSERT INTO public.debug_log_table (log_key, log_value) 
        VALUES ('VERIFY', r.policyname || ' -> Check: ' || COALESCE(r.with_check, 'NULL'));
    END LOOP;

END $$;

NOTIFY pgrst, 'reload schema';
