-- Ensure RLS is enabled on all relevant tables
ALTER TABLE IF EXISTS public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.activity_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_profiles ENABLE ROW LEVEL SECURITY;

-- 1. Policy for activities: Coaches can see their own activities, and anyone can see active activities (or we can keep it restricted to coach for now)
DROP POLICY IF EXISTS "Coaches can manage their own activities" ON public.activities;
CREATE POLICY "Coaches can manage their own activities"
    ON public.activities
    FOR ALL
    USING (coach_id = auth.uid());

DROP POLICY IF EXISTS "Anyone can view activities" ON public.activities;
CREATE POLICY "Anyone can view activities"
    ON public.activities
    FOR SELECT
    USING (true); -- Allow everyone to read activities for now, or refine if needed

-- 2. Policy for coaches to view enrollments of their activities
DROP POLICY IF EXISTS "Coaches can view enrollments of their activities" ON public.activity_enrollments;
CREATE POLICY "Coaches can view enrollments of their activities"
    ON public.activity_enrollments
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.activities
            WHERE public.activities.id = public.activity_enrollments.activity_id
            AND public.activities.coach_id = auth.uid()
        )
    );

-- 3. Policy for clients to view their own enrollments
DROP POLICY IF EXISTS "Clients can view their own enrollments" ON public.activity_enrollments;
CREATE POLICY "Clients can view their own enrollments"
    ON public.activity_enrollments
    FOR SELECT
    USING (auth.uid() = client_id);

-- 4. Fix RLS for user_profiles so coaches can see their clients' profiles
-- This uses a direct check on activity_enrollments to avoid recursion if possible
DROP POLICY IF EXISTS "Coaches can view profiles of their clients" ON public.user_profiles;
CREATE POLICY "Coaches can view profiles of their clients"
    ON public.user_profiles
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.activity_enrollments ae
            JOIN public.activities a ON a.id = ae.activity_id
            WHERE ae.client_id = public.user_profiles.id
            AND a.coach_id = auth.uid()
        )
    );

-- 5. Fallback policy for users to see their own profile
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
CREATE POLICY "Users can view their own profile"
    ON public.user_profiles
    FOR SELECT
    USING (auth.uid() = id);
