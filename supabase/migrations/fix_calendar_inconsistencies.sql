/*
  FIX SCRIPT: CALENDAR EVENTS CONSISTENCY
  
  Actions:
  1. Fix "SCHEDULED_BUT_PENDING_VOTES":
     Update status to 'pending' for events that are 'scheduled' but were initiated by the client.
     Logic: If the inviter (from participants) is NOT the coach, it's a client request -> pending.
  
  2. Backfill "MISSING_INVITER_IN_PARTICIPANTS":
     If `invited_by_user_id` is NULL in participants, try to populate it using `created_by_user_id` from the parent event, if available.
*/

BEGIN;

-- 1. Fix Status: Client-initiated events should be 'pending', not 'scheduled'.
-- We identify client-initiated events by checking if the inviter is NOT the coach.
-- Or if invited_by_user_id is the client_id.
UPDATE calendar_events e
SET status = 'pending'
WHERE e.status = 'scheduled'
  AND e.event_type IN ('meet', 'consultation')
  AND EXISTS (
      SELECT 1
      FROM calendar_event_participants p
      WHERE p.event_id = e.id
        AND p.invited_by_user_id IS NOT NULL
        AND p.invited_by_user_id != e.coach_id
  );

-- 2. Backfill invited_by_user_id from created_by_user_id (if available in calendar_events)
-- This assumes that if created_by_user_id exists, that user is the inviter for all participants of that event.
UPDATE calendar_event_participants p
SET invited_by_user_id = e.created_by_user_id
FROM calendar_events e
WHERE p.event_id = e.id
  AND p.invited_by_user_id IS NULL
  AND e.created_by_user_id IS NOT NULL;

-- 3. Safety Check / Log
DO $$
DECLARE
    fixed_status_count INT;
    fixed_inviter_count INT;
BEGIN
    -- This is just for verification, won't output to global results in all clients but useful if run in a block that supports it.
    -- We'll just commit.
END $$;

COMMIT;
