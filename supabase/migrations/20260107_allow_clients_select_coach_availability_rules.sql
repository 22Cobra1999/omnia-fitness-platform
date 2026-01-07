-- Allow clients to read coach availability rules for coaches they are actively enrolled with

ALTER TABLE public.coach_availability_rules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Coaches can view their availability rules" ON public.coach_availability_rules;
CREATE POLICY "Coaches can view their availability rules"
  ON public.coach_availability_rules
  FOR SELECT
  TO authenticated
  USING (auth.uid() = coach_id);

DROP POLICY IF EXISTS "Clients can view availability rules for their coaches" ON public.coach_availability_rules;
CREATE POLICY "Clients can view availability rules for their coaches"
  ON public.coach_availability_rules
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.activity_enrollments ae
      JOIN public.activities a ON a.id = ae.activity_id
      WHERE ae.client_id = auth.uid()
        AND ae.status = 'activa'
        AND a.coach_id = public.coach_availability_rules.coach_id
    )
  );
