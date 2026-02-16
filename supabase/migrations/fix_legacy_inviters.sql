/*
  FINAL CLEANUP: LEGACY MISSING INVITERS
  
  This script handles the remaining "MISSING_INVITER_IN_PARTICIPANTS" rows.
  Since these are likely legacy events created before we tracked `created_by` or `invited_by`,
  we default to assuming the **Coach** was the inviter (as they own the calendar).
  
  This ensures the UI logic (which relies on invited_by) has a fallback.
*/

BEGIN;

-- Update participants with NULL inviter
-- Set inviter to the event's coach
UPDATE calendar_event_participants p
SET 
  invited_by_user_id = e.coach_id,
  invited_by_role = 'coach'
FROM calendar_events e
WHERE p.event_id = e.id
  AND p.invited_by_user_id IS NULL;

-- Safety check (optional logging, implied by commit)
COMMIT;
