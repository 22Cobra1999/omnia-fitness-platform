/*
  FIX: MISSING PARTICIPANTS (RECOVERY MODE)
  
  Actions:
  1. Insert missing COACH participants (always known from coach_id).
  2. Insert missing CLIENT participants (inferred from created_by_user_id if not the coach).
  
  Note: Since the `client_id` column was dropped, we can only recover client participation
  if the client created the event themselves (common case).
  For events created by the coach FOR a client (without participants), the client link is lost 
  unless stored elsewhere (e.g. title/description parsing, which is unsafe here).
*/

BEGIN;

-- 1. Insert missing COACH participants
-- Every event should have the coach as a participant/host.
INSERT INTO calendar_event_participants (
    event_id, 
    user_id, 
    rsvp_status, 
    role, 
    is_creator,
    invited_by_user_id, 
    invited_by_role
)
SELECT 
    e.id, 
    e.coach_id, 
    'confirmed', 
    'coach', 
    (e.created_by_user_id = e.coach_id), -- is_creator if they created it
    e.coach_id, 
    'coach'
FROM calendar_events e
WHERE NOT EXISTS (
    SELECT 1 
    FROM calendar_event_participants p 
    WHERE p.event_id = e.id 
      AND p.user_id = e.coach_id
);

-- 2. Insert missing CLIENT participants (only if created by client)
-- If created_by_user_id is NOT the coach, it must be the client.
INSERT INTO calendar_event_participants (
    event_id, 
    user_id, 
    rsvp_status, 
    role, 
    is_creator,
    invited_by_user_id, 
    invited_by_role
)
SELECT 
    e.id, 
    e.created_by_user_id, 
    'confirmed', 
    'client', 
    true, 
    e.coach_id, 
    'coach'
FROM calendar_events e
WHERE e.created_by_user_id IS NOT NULL 
  AND e.created_by_user_id != e.coach_id
  AND NOT EXISTS (
    SELECT 1 
    FROM calendar_event_participants p 
    WHERE p.event_id = e.id 
      AND p.user_id = e.created_by_user_id
);

COMMIT;
