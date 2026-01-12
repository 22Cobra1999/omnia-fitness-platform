-- List Triggers
-- Simple script to list triggers to debug log.

DELETE FROM public.debug_log_table;

DO $$
DECLARE
    r RECORD;
BEGIN
    INSERT INTO public.debug_log_table (log_key, log_value) VALUES ('START', 'Listing Triggers...');

    FOR r IN 
        SELECT trigger_name, action_statement, action_orientation, action_timing
        FROM information_schema.triggers 
        WHERE event_object_table = 'calendar_events'
    LOOP
        INSERT INTO public.debug_log_table (log_key, log_value) 
        VALUES ('TRIGGER', r.trigger_name || ' (' || r.action_timing || ' ' || r.action_orientation || ') -> ' || substring(r.action_statement from 1 for 100));
    END LOOP;

    INSERT INTO public.debug_log_table (log_key, log_value) VALUES ('END', 'Finished Listing Triggers');
END $$;
