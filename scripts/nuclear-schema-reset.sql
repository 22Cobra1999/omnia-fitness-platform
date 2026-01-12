-- Nuclear Schema Reset
-- Rename the column and rename it back.
-- This forces Supabase/PostgREST to update the schema cache for this column.

DO $$
BEGIN
    RAISE NOTICE 'Renaming client_id to client_id_forced_refresh...';
    ALTER TABLE public.calendar_events RENAME COLUMN client_id TO client_id_forced_refresh;
    
    -- Rename back
    RAISE NOTICE 'Renaming back to client_id...';
    ALTER TABLE public.calendar_events RENAME COLUMN client_id_forced_refresh TO client_id;
END $$;

NOTIFY pgrst, 'reload schema';
