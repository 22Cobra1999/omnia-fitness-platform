/*
  ANALYSIS QUERY: CALENDAR EVENTS STRUCTURE & CONSISTENCY
  
  This query aims to expose:
  1. Who is the "Organizer" vs "Coach" vs "Creator".
  2. Status mismatches between the Event and its Participants.
  3. Legacy data where `invited_by_user_id` might be missing.
  4. "Self-bookings" vs "Coach-invites".
*/

WITH ParticipantStats AS (
    SELECT 
        event_id,
        COUNT(*) as total_participants,
        SUM(CASE WHEN role = 'coach' THEN 1 ELSE 0 END) as coach_count,
        SUM(CASE WHEN role = 'client' THEN 1 ELSE 0 END) as client_count,
        
        -- Aggregated RSVPs
        SUM(CASE WHEN rsvp_status = 'pending' THEN 1 ELSE 0 END) as pending_rsvps,
        SUM(CASE WHEN rsvp_status = 'accepted' OR rsvp_status = 'confirmed' THEN 1 ELSE 0 END) as confirmed_rsvps,
        
        -- Inviter Analysis (from participants table)
        -- We assume the 'inviter' is consistent across participants for a single event, or we take the first non-null.
        MAX(invited_by_user_id::text) as inviter_id,
        COUNT(DISTINCT invited_by_user_id) as distinct_inviters
    FROM calendar_event_participants
    GROUP BY event_id
)
SELECT
    e.id,
    e.title,
    e.status as event_status,
    e.coach_id,
    ps.inviter_id as apparent_inviter_id,
    
    CASE 
        WHEN ps.inviter_id IS NULL THEN 'MISSING_INVITER_IN_PARTICIPANTS'
        WHEN ps.inviter_id = e.coach_id::text THEN 'COACH_INITIATED'
        WHEN ps.distinct_inviters > 1 THEN 'MIXED_INVITERS'
        ELSE 'CLIENT_INITIATED' -- Assuming different from coach_id means client
    END as initiation_type,
    
    CASE
        WHEN e.status = 'scheduled' AND ps.pending_rsvps > 0 THEN 'SCHEDULED_BUT_PENDING_VOTES'
        ELSE 'CONSISTENT'
    END as status_health
FROM calendar_events e
LEFT JOIN ParticipantStats ps ON e.id = ps.event_id
WHERE e.event_type IN ('meet', 'consultation')
ORDER BY e.created_at DESC;
