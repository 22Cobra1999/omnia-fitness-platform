-- Dump Policies
-- List all RLS policies for the calendar_events table

SELECT policyname, cmd, roles, qual, with_check
FROM pg_policies
WHERE tablename = 'calendar_events';
