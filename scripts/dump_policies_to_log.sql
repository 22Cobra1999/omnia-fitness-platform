-- Dump Policies to Debug Log (Clean)
-- List all RLS policies for the calendar_events table and store in debug_log_table
-- CLEARS THE TABLE FIRST to avoid confusion.

TRUNCATE TABLE public.debug_log_table;

DO $$
DECLARE
    r RECORD;
BEGIN
    INSERT INTO public.debug_log_table (log_key, log_value) VALUES ('START_POLICIES', 'Dumping Policies for calendar_events (Clean Run)');

    FOR r IN 
        SELECT policyname, cmd, roles, qual, with_check
        FROM pg_policies
        WHERE tablename = 'calendar_events'
    LOOP
        INSERT INTO public.debug_log_table (log_key, log_value) 
        VALUES ('POLICY', 
            'Name: ' || r.policyname || 
            ' | Cmd: ' || r.cmd || 
            ' | Roles: ' || COALESCE(array_to_string(r.roles, ','), 'PUBLIC') || 
            ' | Qual: ' || COALESCE(r.qual, 'NULL') || 
            ' | Check: ' || COALESCE(r.with_check, 'NULL')
        );
    END LOOP;

    INSERT INTO public.debug_log_table (log_key, log_value) VALUES ('END_POLICIES', 'Finished Dumping Policies');
END $$;
