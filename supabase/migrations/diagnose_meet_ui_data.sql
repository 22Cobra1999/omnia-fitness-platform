/*
  DIAGNOSTIC QUERY: UI DATA VERIFICATION
  
  Fetches exactly what the UI needs to render:
  - Event Details (Title, Status, Dates)
  - Participant List (Names, Roles, RSVP, Who Invited Whom)
  
  Targeting the reported problematic event: 'Meet prueba cobro' (87b7d04d-4c6b-4fed-8a86-822464f7b560)
  and others for comparison.
*/

SELECT 
    e.title,
    e.status as event_status,
    e.start_time,
    e.end_time,
    
    -- Participant Details
    p.user_id,
    p.role as participant_role, -- 'host', 'participant', 'client', 'coach' ??
    p.rsvp_status,
    p.is_creator,
    p.invited_by_user_id,
    
    -- We'll try to join with user_profiles if it exists to get names, 
    -- otherwise we rely on IDs.
    -- (Assuming user_profiles table exists based on previous context)
    up.full_name,
    up.email,
    up.role as user_profile_role -- 'coach' or 'client' in the system
    
FROM calendar_events e
JOIN calendar_event_participants p ON e.id = p.event_id
LEFT JOIN user_profiles up ON p.user_id = up.id
WHERE e.start_time >= '2026-02-15 00:00:00' AND e.start_time < '2026-02-16 00:00:00'
ORDER BY e.start_time;
