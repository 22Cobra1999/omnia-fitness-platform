-- Setup Debug Logging
-- Creates a table to store debug info since we can't see RAISE NOTICE output.

DROP TABLE IF EXISTS public.debug_log_table;
CREATE TABLE public.debug_log_table (
    id serial PRIMARY KEY,
    log_key text,
    log_value text,
    created_at timestamp with time zone DEFAULT now()
);

-- Grant access to authenticated users to read/write this table (for valid permissions check)
ALTER TABLE public.debug_log_table ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for authenticated" ON public.debug_log_table FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON public.debug_log_table FOR ALL TO anon USING (true) WITH CHECK (true); -- Just in case

-- Populate with Schema Information
DO $$
DECLARE
    r RECORD;
BEGIN
    INSERT INTO public.debug_log_table (log_key, log_value) VALUES ('START', 'Starting Debug Audit');

    -- 1. Check Columns
    FOR r IN 
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'calendar_events'
    LOOP
        INSERT INTO public.debug_log_table (log_key, log_value) 
        VALUES ('COLUMN', r.column_name || ' (' || r.data_type || ', null=' || r.is_nullable || ')');
    END LOOP;

    -- 2. Check Permissions for 'authenticated'
    FOR r IN 
        SELECT grantee, privilege_type 
        FROM information_schema.role_table_grants 
        WHERE table_name = 'calendar_events' AND grantee = 'authenticated'
    LOOP
        INSERT INTO public.debug_log_table (log_key, log_value) 
        VALUES ('TABLE_GRANT', 'Grantee: ' || r.grantee || ', Priv: ' || r.privilege_type);
    END LOOP;

     -- 3. Check Column Permissions
    FOR r IN 
        SELECT grantee, column_name, privilege_type 
        FROM information_schema.column_privileges
        WHERE table_name = 'calendar_events' AND grantee = 'authenticated'
    LOOP
        INSERT INTO public.debug_log_table (log_key, log_value) 
        VALUES ('COLUMN_GRANT', 'Grantee: ' || r.grantee || ', Col: ' || r.column_name || ', Priv: ' || r.privilege_type);
    END LOOP;
    
    INSERT INTO public.debug_log_table (log_key, log_value) VALUES ('END', 'Finished Debug Audit');
END $$;
