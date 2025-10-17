CREATE TABLE IF NOT EXISTS public.activity_surveys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    activity_id INT NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    enrollment_id UUID NOT NULL REFERENCES public.activity_enrollments(id) ON DELETE CASCADE,
    difficulty_rating INT CHECK (difficulty_rating >= 1 AND difficulty_rating <= 5),
    coach_method_rating INT CHECK (coach_method_rating >= 1 AND coach_method_rating <= 5),
    would_repeat BOOLEAN,
    comments TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (activity_id, client_id) -- Ensures one survey per client per activity
);

-- RLS for activity_surveys table
ALTER TABLE public.activity_surveys ENABLE ROW LEVEL SECURITY;

-- Policy for clients to read their own surveys
DROP POLICY IF EXISTS "Clients can read their own activity surveys" ON public.activity_surveys;
CREATE POLICY "Clients can read their own activity surveys"
ON public.activity_surveys FOR SELECT
TO authenticated
USING (auth.uid() = client_id);

-- Policy for clients to insert their own surveys
DROP POLICY IF EXISTS "Clients can insert their own activity surveys" ON public.activity_surveys;
CREATE POLICY "Clients can insert their own activity surveys"
ON public.activity_surveys FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = client_id);

-- Policy for clients to update their own surveys
DROP POLICY IF EXISTS "Clients can update their own activity surveys" ON public.activity_surveys;
CREATE POLICY "Clients can update their own activity surveys"
ON public.activity_surveys FOR UPDATE
TO authenticated
USING (auth.uid() = client_id);

-- Policy for coaches to read surveys of their clients' activities
DROP POLICY IF EXISTS "Coaches can read surveys for their activities" ON public.activity_surveys;
CREATE POLICY "Coaches can read surveys for their activities"
ON public.activity_surveys FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.activities act
        WHERE act.id = activity_surveys.activity_id
        AND act.coach_id = auth.uid()
    )
);

-- Policy for admins to read all surveys
DROP POLICY IF EXISTS "Admins can read all activity surveys" ON public.activity_surveys;
CREATE POLICY "Admins can read all activity surveys"
ON public.activity_surveys FOR SELECT
TO authenticated
USING (auth.role() = 'admin');

-- Policy for admins to insert/update/delete all surveys
DROP POLICY IF EXISTS "Admins can manage all activity surveys" ON public.activity_surveys;
CREATE POLICY "Admins can manage all activity surveys"
ON public.activity_surveys FOR ALL
TO authenticated
USING (auth.role() = 'admin');
