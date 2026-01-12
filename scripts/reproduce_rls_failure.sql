-- Reproduce RLS Failure
-- Purpose: Simulate the exact user request in SQL to see if it fails and why.

BEGIN;

-- 1. Simulate Auth User
-- User ID from logs: 00dedc23-0b17-4e50-b84e-b2e8100dc93c
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" = '00dedc23-0b17-4e50-b84e-b2e8100dc93c';

RAISE NOTICE '--- Testing Insert as User 00dedc23... ---';

-- 2. Attempt Insert (Matching Payload)
-- Payload from logs: {coach_id: 'b16c4f8c...', client_id: '00dedc23...', title: 'Meet', ...}
INSERT INTO public.calendar_events (
    coach_id,
    client_id,
    title,
    description,
    start_time,
    end_time,
    event_type,
    status,
    is_free
) VALUES (
    'b16c4f8c-f47b-4df0-ad2b-13dcbd76263f', -- coach_id
    '00dedc23-0b17-4e50-b84e-b2e8100dc93c', -- client_id (MATCHES USER)
    'Meet',
    NULL,
    '2026-01-20T11:30:00.000Z',
    '2026-01-20T12:00:00.000Z',
    'consultation',
    'scheduled',
    FALSE
) RETURNING id;

ROLLBACK; -- Always rollback so we don't create junk data

-- 3. Check Triggers (Run as postgres/superuser to see them)
RESET ROLE;
DO $$
DECLARE
    r RECORD;
BEGIN
    RAISE NOTICE '--- Checking Triggers on calendar_events ---';
    FOR r IN 
        SELECT trigger_name, action_statement 
        FROM information_schema.triggers 
        WHERE event_object_table = 'calendar_events'
    LOOP
        RAISE NOTICE 'Trigger: % -> %', r.trigger_name, r.action_statement;
    END LOOP;
END $$;
