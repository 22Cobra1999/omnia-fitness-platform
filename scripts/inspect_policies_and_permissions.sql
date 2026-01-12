-- Inspect Policies and Permissions (Logged)
-- Lists all RLS policies, grants, and column info for calendar_events to debug_log_table.



-- Ensure table exists (idempotent-ish)
CREATE TABLE IF NOT EXISTS public.debug_log_table (
    id serial PRIMARY KEY,
    log_key text,
    log_value text,
    created_at timestamp with time zone DEFAULT now()
);

DELETE FROM public.debug_log_table WHERE true;

DO $$
DECLARE
    r RECORD;
BEGIN
    INSERT INTO public.debug_log_table (log_key, log_value) VALUES ('START', 'Starting Policy Inspection');

    -- 1. RLS POLICIES
    FOR r IN 
        SELECT policyname, permissive, cmd, qual, with_check 
        FROM pg_policies 
        WHERE tablename = 'calendar_events'
    LOOP
        INSERT INTO public.debug_log_table (log_key, log_value) 
        VALUES ('POLICY', 
            'Name: ' || r.policyname || 
            ' | Perm: ' || r.permissive || 
            ' | Cmd: ' || r.cmd || 
            ' | Using: ' || COALESCE(r.qual::text, 'NULL') || 
            ' | Check: ' || COALESCE(r.with_check::text, 'NULL')
        );
    END LOOP;

    -- 2. TABLE GRANTS
    FOR r IN 
        SELECT grantee, privilege_type
        FROM information_schema.role_table_grants 
        WHERE table_name = 'calendar_events'
    LOOP
        INSERT INTO public.debug_log_table (log_key, log_value) 
        VALUES ('GRANT', 'Grantee: ' || r.grantee || ' | Priv: ' || r.privilege_type);
    END LOOP;

    -- 3. COLUMN INFO
    FOR r IN 
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'calendar_events'
    LOOP
        INSERT INTO public.debug_log_table (log_key, log_value) 
        VALUES ('COLUMN', r.column_name || ' (' || r.data_type || ', null=' || r.is_nullable || ')');
    END LOOP;

    INSERT INTO public.debug_log_table (log_key, log_value) VALUES ('END', 'Finished Inspection');
END $$;


