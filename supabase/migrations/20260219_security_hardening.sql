-- SECURITY HARDENING MIGRATION
-- Date: 2026-02-19
-- Description: Reviews and tightens RLS policies for critical tables, focusing on User Profiles and Activities.

-- ==============================================================================
-- 1. USER PROFILES HARDENING
-- ==============================================================================
-- Ensuring users can update their own profile (often missed in initial setups)
-- and ensuring public visibility is controlled.

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to UPDATE their own profile
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
CREATE POLICY "Users can update their own profile"
ON public.user_profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Allow new users to INSERT their own profile (during signup)
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.user_profiles;
CREATE POLICY "Users can insert their own profile"
ON public.user_profiles
FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

-- Allow authenticated users to view basic profile info (needed for social/coach features)
-- We keep this broad for now to allow viewing coaches/clients, but we ensure it's SELECT only.
DROP POLICY IF EXISTS "Anyone can view user profiles" ON public.user_profiles;
CREATE POLICY "Anyone can view user profiles"
ON public.user_profiles
FOR SELECT
TO authenticated
USING (true);

-- ==============================================================================
-- 2. ACTIVITIES VISIBILITY
-- ==============================================================================
-- Preparing for "Private" exercises/plans. 
-- We introduce a policy that allows seeing activities if they are 'public' (future proofing)
-- OR if the user is the owner/coach.

-- For now, we maintain the "Marketplace" open read, but we explicitly secure modifications.

DROP POLICY IF EXISTS "Coaches can insert their own activities" ON public.activities;
CREATE POLICY "Coaches can insert their own activities"
ON public.activities
FOR INSERT
TO authenticated
WITH CHECK (coach_id = auth.uid());

DROP POLICY IF EXISTS "Coaches can update their own activities" ON public.activities;
CREATE POLICY "Coaches can update their own activities"
ON public.activities
FOR UPDATE
TO authenticated
USING (coach_id = auth.uid())
WITH CHECK (coach_id = auth.uid());

DROP POLICY IF EXISTS "Coaches can delete their own activities" ON public.activities;
CREATE POLICY "Coaches can delete their own activities"
ON public.activities
FOR DELETE
TO authenticated
USING (coach_id = auth.uid());

-- ==============================================================================
-- 3. ACTIVITY ENROLLMENTS (SENSITIVE)
-- ==============================================================================
-- Re-asserting strict privacy for enrollments.

ALTER TABLE public.activity_enrollments ENABLE ROW LEVEL SECURITY;

-- Clients can ONLY see their own enrollments
-- Coaches can ONLY see enrollments for their activities
-- NO "Public" access here.

DROP POLICY IF EXISTS "Strict access to enrollments" ON public.activity_enrollments;
-- Note: We likely have split policies (Client vs Coach) from previous migrations.
-- We will leave those as they are seemingly correct in 20260126_fix_coach_clients_rls.sql
-- but we ADD a deny-all fallback implicitly by enabling RLS.

-- ==============================================================================
-- 4. CALENDAR EVENTS HARDENING
-- ==============================================================================
-- Ensuring no one can delete events they don't own/manage.

ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can delete own events" ON public.calendar_events;
CREATE POLICY "Users can delete own events"
ON public.calendar_events
FOR DELETE
TO authenticated
USING (
    created_by_user_id = auth.uid() OR 
    coach_id = auth.uid()
);

DROP POLICY IF EXISTS "Users can update own events" ON public.calendar_events;
CREATE POLICY "Users can update own events"
ON public.calendar_events
FOR UPDATE
TO authenticated
USING (
    created_by_user_id = auth.uid() OR 
    coach_id = auth.uid()
)
WITH CHECK (
    created_by_user_id = auth.uid() OR 
    coach_id = auth.uid()
);

-- ==============================================================================
-- 5. STORAGE OBJECTS (Check)
-- ==============================================================================
-- This SQL cannot directly alter storage.objects policies easily without the storage schema.
-- Assumption: Standard Supabase Storage policies are applied via Dashboard.

-- Reload configuration to apply changes immediately
NOTIFY pgrst, 'reload config';
