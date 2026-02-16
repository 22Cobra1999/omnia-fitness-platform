/* 
  DIAGNOSTIC QUERY: PHANTOM DEDUCTIONS
  Finds events where a client is 'confirmed'/'accepted' (Triggering credit use)
  but the Coach has NOT yet confirmed.
*/

WITH EventParticipants AS (
    SELECT 
        event_id,
        user_id,
        role,
        rsvp_status,
        payment_status
    FROM calendar_event_participants
),
EventSummary AS (
    SELECT 
        ep.event_id,
        COUNT(*) FILTER (WHERE ep.role = 'coach' AND (ep.rsvp_status = 'confirmed' OR ep.rsvp_status = 'accepted')) as coach_confirmed_count,
        COUNT(*) FILTER (WHERE ep.role = 'client' AND (ep.rsvp_status = 'confirmed' OR ep.rsvp_status = 'accepted')) as client_confirmed_count,
        COUNT(*) FILTER (WHERE ep.role = 'coach' AND ep.rsvp_status = 'pending') as coach_pending_count
    FROM EventParticipants ep
    GROUP BY ep.event_id
)
SELECT 
    ce.id as event_id,
    ce.title,
    ce.start_time,
    ce.status as event_status,
    es.client_confirmed_count,
    es.coach_confirmed_count,
    es.coach_pending_count,
    CASE 
        WHEN es.client_confirmed_count > 0 AND es.coach_confirmed_count = 0 THEN 'CREDIT_DEDUCTED_WITHOUT_COACH_CONFIRMATION'
        WHEN es.client_confirmed_count > 0 AND es.coach_confirmed_count > 0 THEN 'MUTUALLY_CONFIRMED'
        ELSE 'NO_DEDUCTION_YET'
    END as deduction_state
FROM calendar_events ce
JOIN EventSummary es ON ce.id = es.event_id
WHERE ce.event_type IN ('meet', 'consultation')
  AND es.client_confirmed_count > 0
ORDER BY ce.created_at DESC;
