-- Fix: Ensure availability of ID generator for calendar_events
-- This fixes the "null value in column id" error by setting a default value.

-- 1. Enable pgcrypto extension if not active (provides gen_random_uuid on older PG versions, though usually built-in now)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Set the default value for the ID column
ALTER TABLE public.calendar_events 
ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- 3. Verify and fix other potential constraints
-- Ensure Created At defaults to NOW()
ALTER TABLE public.calendar_events 
ALTER COLUMN created_at SET DEFAULT NOW();

ALTER TABLE public.calendar_events 
ALTER COLUMN updated_at SET DEFAULT NOW();

-- Reload schema cache
NOTIFY pgrst, 'reload config';
