-- FIX CALENDAR EVENTS RLS (NUCLEAR CLEANUP & FIX)
-- This script:
-- 1. DROPS ALL existing policies on 'calendar_events' and 'calendar_event_participants' dynamically.
--    (This prevents "Policy already exists" errors and removes any hidden recursive policies).
-- 2. Defines SECURITY DEFINER functions to break recursion safely.
-- 3. Recreates clean, secure policies.

BEGIN;

-- =========================================================================
-- STEP 1: DROP ALL EXISTING POLICIES (NUCLEAR OPTION)
-- =========================================================================
DO $$ 
DECLARE 
    r RECORD;
BEGIN 
    -- Drop policies for calendar_events
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'calendar_events') LOOP 
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.calendar_events'; 
    END LOOP;
    
    -- Drop policies for calendar_event_participants
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'calendar_event_participants') LOOP 
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.calendar_event_participants'; 
    END LOOP;
END $$;

-- =========================================================================
-- STEP 2: DEFINE RECURSION-BREAKING FUNCTIONS (SECURITY DEFINER)
-- =========================================================================

-- Helper 1: Check if user is a participant (Bypasses RLS on participants table)
CREATE OR REPLACE FUNCTION public.is_calendar_participant(check_event_id uuid, check_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Confirmed column is 'client_id'
  RETURN EXISTS (
    SELECT 1 
    FROM calendar_event_participants 
    WHERE event_id = check_event_id 
    AND client_id = check_user_id
  );
END;
$$;

-- Helper 2: Check if user is the coach/owner (Bypasses RLS on events table)
CREATE OR REPLACE FUNCTION public.is_event_owner(check_event_id uuid, check_coach_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM calendar_events 
    WHERE id = check_event_id 
    AND coach_id = check_coach_id
  );
END;
$$;

-- =========================================================================
-- STEP 3: CREATE CLEAN POLICIES
-- =========================================================================

-- A. CALENDAR_EVENTS
CREATE POLICY "Coach can view own events" ON public.calendar_events
FOR SELECT TO authenticated USING ( coach_id = auth.uid() );

CREATE POLICY "Client can view own events" ON public.calendar_events
FOR SELECT TO authenticated USING ( client_id = auth.uid() );

CREATE POLICY "Participants can view events" ON public.calendar_events
FOR SELECT TO authenticated USING ( is_calendar_participant(id, auth.uid()) );

CREATE POLICY "Users can view open events" ON public.calendar_events
FOR SELECT TO authenticated USING ( is_free = true OR status = 'open' );

-- B. CALENDAR_EVENT_PARTICIPANTS
CREATE POLICY "User can view own participation" ON public.calendar_event_participants
FOR SELECT TO authenticated USING ( client_id = auth.uid() );

CREATE POLICY "Coach can view participants of their events" ON public.calendar_event_participants
FOR SELECT TO authenticated USING ( is_event_owner(event_id, auth.uid()) );

COMMIT;

-- Notify Supabase to reload schema cache
NOTIFY pgrst, 'reload schema';
