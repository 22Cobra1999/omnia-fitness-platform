-- Fix Missing client_id
-- The column was found to be missing from the table definition.

DO $$
BEGIN
    RAISE NOTICE 'Adding client_id column...';
    ALTER TABLE public.calendar_events 
    ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES auth.users(id);

    COMMENT ON COLUMN public.calendar_events.client_id IS 'Reference to the client user';
END $$;

NOTIFY pgrst, 'reload schema';
