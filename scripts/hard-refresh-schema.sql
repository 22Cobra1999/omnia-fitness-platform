-- Hard Schema Refresh
-- Adding and dropping a column forces PostgREST to notice a schema change.

ALTER TABLE public.calendar_events ADD COLUMN IF NOT EXISTS _force_schema_refresh text;

-- Verify it exists (optional, just to ensure DDL ran)
DO $$
BEGIN
    RAISE NOTICE 'Column _force_schema_refresh added.';
END $$;

-- Drop it immediately
ALTER TABLE public.calendar_events DROP COLUMN IF EXISTS _force_schema_refresh;

NOTIFY pgrst, 'reload schema';
