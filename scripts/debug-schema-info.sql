-- Debug Schema and Permissions
-- Purpose: Verify 'client_id' exists and 'authenticated' role has permissions.

BEGIN;

-- 1. List all columns for the table
DO $$
DECLARE
    r RECORD;
BEGIN
    RAISE NOTICE '--- COLUMNS IN calendar_events ---';
    FOR r IN 
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'calendar_events'
    LOOP
        RAISE NOTICE '% (%): %', r.column_name, r.data_type, r.is_nullable;
    END LOOP;
END $$;

-- 2. Check Permissions for 'authenticated' role
DO $$
DECLARE
    r RECORD;
BEGIN
    RAISE NOTICE '--- PERMISSIONS FOR authenticated ROLE ---';
    -- Check table level
    FOR r IN 
        SELECT grantee, privilege_type 
        FROM information_schema.role_table_grants 
        WHERE table_name = 'calendar_events' AND grantee = 'authenticated'
    LOOP
        RAISE NOTICE 'Table Level: % - %', r.grantee, r.privilege_type;
    END LOOP;

    -- Check column level (if any specific grants exist, though table level usually covers it)
    FOR r IN 
        SELECT grantee, column_name, privilege_type 
        FROM information_schema.column_privileges
        WHERE table_name = 'calendar_events' AND grantee = 'authenticated'
    LOOP
        RAISE NOTICE 'Column Level: % - % - %', r.grantee, r.column_name, r.privilege_type;
    END LOOP;
END $$;

ROLLBACK;
