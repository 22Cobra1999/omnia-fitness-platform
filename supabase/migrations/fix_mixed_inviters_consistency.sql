/*
  FIX: MIXED INVITERS CONSISTENCY
  
  Problem: For events created by the Client (`created_by_user_id` != `coach_id`), 
  we currently have:
  - Client participant row: invited_by = Client (Correct)
  - Coach participant row: invited_by = Coach (Defaulted by previous script)
  
  This creates a "MIXED_INVITERS" status in the analysis (2 distinct inviters).
  
  Solution: 
  For all events created by the Client, update ALL participants (including the Coach)
  to show they were invited by the Client.
*/

BEGIN;

UPDATE calendar_event_participants p
SET 
    invited_by_user_id = e.created_by_user_id,
    invited_by_role = 'client'
FROM calendar_events e
WHERE p.event_id = e.id
  -- Only for events created by the client (someone other than the coach)
  AND e.created_by_user_id IS NOT NULL 
  AND e.created_by_user_id != e.coach_id
  -- Update if the inviter is not already the creator
  AND (p.invited_by_user_id IS DISTINCT FROM e.created_by_user_id);

COMMIT;
