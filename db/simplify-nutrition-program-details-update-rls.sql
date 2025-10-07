-- Policy for SELECT on nutrition_program_details
DROP POLICY IF EXISTS "Clients can view their nutrition program details" ON nutrition_program_details;
CREATE POLICY "Clients can view their nutrition program details"
ON nutrition_program_details FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM activity_enrollments ae
    WHERE ae.id = enrollment_id AND ae.client_id = auth.uid()
  )
);

-- Policy for UPDATE on nutrition_program_details
DROP POLICY IF EXISTS "Clients can update their nutrition program details" ON nutrition_program_details;
CREATE POLICY "Clients can update their nutrition program details"
ON nutrition_program_details FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM activity_enrollments ae
    WHERE ae.id = enrollment_id AND ae.client_id = auth.uid()
  )
) WITH CHECK (
  EXISTS (
    SELECT 1
    FROM activity_enrollments ae
    WHERE ae.id = enrollment_id AND ae.client_id = auth.uid()
  )
);

-- Policy for INSERT on nutrition_program_details (only for duplicate_program_details_on_enrollment function)
DROP POLICY IF EXISTS "Coaches can insert nutrition program details" ON nutrition_program_details;
CREATE POLICY "Coaches can insert nutrition program details"
ON nutrition_program_details FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM activity_enrollments ae
    JOIN activities a ON ae.activity_id = a.id
    WHERE ae.id = enrollment_id AND a.coach_id = auth.uid()
  ) OR (SELECT auth.role() = 'service_role') -- Allow service_role for RPC calls
);

-- Policy for DELETE on nutrition_program_details (only for coaches or admin)
DROP POLICY IF EXISTS "Coaches can delete nutrition program details" ON nutrition_program_details;
CREATE POLICY "Coaches can delete nutrition program details"
ON nutrition_program_details FOR DELETE
USING (
  EXISTS (
    SELECT 1
    FROM activity_enrollments ae
    JOIN activities a ON ae.activity_id = a.id
    WHERE ae.id = enrollment_id AND a.coach_id = auth.uid()
  ) OR (SELECT auth.role() = 'service_role') -- Allow service_role for RPC calls
);
