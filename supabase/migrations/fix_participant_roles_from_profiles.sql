/*
  FIX: STANDARDIZE PARTICIPANT ROLES
  
  Problem: Legacy events use roles 'host' and 'participant'.
  New logic expects 'coach' and 'client'.
  
  Solution: Update calendar_event_participants.role to match the 
  actual user_profiles.role of the user.
  
  This ensures that:
  - Updates 'host'/'participant' -> 'coach'/'client'
  - Corrects any mismatches (e.g. a Coach labeled as 'client')
*/

BEGIN;

UPDATE calendar_event_participants p
SET role = up.role
FROM user_profiles up
WHERE p.user_id = up.id
  -- Only update if the role is different from the profile role
  -- This covers 'host', 'participant', and any wrong assignments
  AND p.role IS DISTINCT FROM up.role;

COMMIT;
