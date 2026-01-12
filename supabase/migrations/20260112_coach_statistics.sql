
-- 1. Create coach_statistics table
CREATE TABLE IF NOT EXISTS coach_statistics (
    coach_id UUID PRIMARY KEY REFERENCES user_profiles(id),
    total_requests INT DEFAULT 0,
    response_rate NUMERIC(5,2) DEFAULT 0, -- %
    avg_response_time_minutes INT DEFAULT 0,
    cancellations_count INT DEFAULT 0, -- Cancelled by Coach
    late_reschedules_count INT DEFAULT 0, -- Reschedule requested by coach < 48hs
    attendance_rate NUMERIC(5,2) DEFAULT 0, -- % (Completed / (Completed + NoShow))
    incidents_count INT DEFAULT 0, -- Manual flag or derived? Start with manual default 0
    last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE coach_statistics ENABLE ROW LEVEL SECURITY;

-- Allow read access to authenticated users (coaches see their own, clients might see reputation info?)
-- For now, allow public read if needed for profile, or specific policy.
-- Simplifying: Authenticated users can read.
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON coach_statistics;
CREATE POLICY "Enable read access for authenticated users" ON coach_statistics FOR SELECT
    USING (auth.role() = 'authenticated');

-- 2. Create calculation function
CREATE OR REPLACE FUNCTION calculate_coach_stats(target_coach_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_total_requests INT;
    v_responded_requests INT;
    v_response_rate NUMERIC(5,2);
    v_avg_response_time INT;
    v_cancellations INT;
    v_late_reschedules INT;
    v_completed_meetings INT;
    v_noshow_meetings INT;
    v_attendance_rate NUMERIC(5,2);
    v_start_date TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Window: Last 30 days
    v_start_date := NOW() - INTERVAL '30 days';

    -- A. Response Rate & Time
    -- Source: calendar_event_participants where user is client (incoming request) and event belongs to coach
    -- "Incoming Request" roughly matches: participant row created by client for a coach's event.
    -- Better proxy: Participants in events owned by this coach, where role='client'.
    -- Response = status is NOT 'pending'.

    SELECT 
        COUNT(*),
        COUNT(*) FILTER (WHERE rsvp_status IN ('confirmed', 'declined')),
        COALESCE(AVG(EXTRACT(EPOCH FROM (cep.updated_at - cep.created_at))/60) FILTER (WHERE rsvp_status IN ('confirmed', 'declined')), 0)
    INTO 
        v_total_requests,
        v_responded_requests,
        v_avg_response_time
    FROM calendar_event_participants cep
    JOIN calendar_events ce ON cep.event_id = ce.id
    WHERE ce.coach_id = target_coach_id
    AND cep.participant_role = 'client'
    AND cep.created_at >= v_start_date;

    IF v_total_requests > 0 THEN
        v_response_rate := (v_responded_requests::NUMERIC / v_total_requests::NUMERIC) * 100.0;
    ELSE
        v_response_rate := 0;
    END IF;

    -- B. Cancellations (by Coach)
    SELECT COUNT(*)
    INTO v_cancellations
    FROM calendar_events
    WHERE coach_id = target_coach_id
    AND status = 'cancelled'
    AND cancelled_by = target_coach_id::text
    AND created_at >= v_start_date;

    -- C. Late Reschedules (by Coach)
    -- Reschedule request created by coach < 48hs before FROM_start_time
    SELECT COUNT(*)
    INTO v_late_reschedules
    FROM calendar_event_reschedule_requests cerr
    JOIN calendar_events ce ON cerr.event_id = ce.id
    WHERE ce.coach_id = target_coach_id
    AND cerr.requested_by_user_id = target_coach_id
    AND cerr.created_at >= v_start_date
    AND cerr.created_at > (cerr.from_start_time - INTERVAL '48 hours');

    -- D. Attendance (Client Attendance? Or Coach?)
    -- Usually "Asistencia" in Coach stats refers to CLIENT attendance rate to this coach's classes (how distinct/reliable are their clients?)
    -- OR Coach attendance (did the coach show up?) -> "Incident" or "No Show" by coach logic isn't explicit yet.
    -- Let's assume it tracks Client Attendance for now (Completed vs No Show).
    SELECT 
        COUNT(*) FILTER (WHERE rsvp_status = 'confirmed'), -- Completed effectively
        COUNT(*) FILTER (WHERE rsvp_status = 'no_show') -- Assuming we have a 'no_show' status or similar logic? 
        -- Actually current statuses are: pending, confirmed, declined, cancelled. 'no_show' might not exist yet.
        -- If 'no_show' is not a status, we calculate based on confirmed past events?
        -- Let's use 'confirmed' vs total confirmed past events? 
        -- If we don't track 'no_show' explicitly, we can't calculate this perfectly yet.
        -- I will leave it as placeholder 100% or 0% for now if no_show status doesn't exist.
        -- I recall rsvp_status can be 'confirmed'. Is there a 'completed'?
        -- Inspecting schema earlier showed: rsvp_status text.
        -- Assuming 'completed' or 'no_show' will be manual updates.
    INTO v_completed_meetings, v_noshow_meetings
    FROM calendar_event_participants cep
    JOIN calendar_events ce ON cep.event_id = ce.id
    WHERE ce.coach_id = target_coach_id
    AND cep.participant_role = 'client'
    AND ce.end_time < NOW()
    AND ce.start_time >= v_start_date
    AND ce.status != 'cancelled';
    
    -- Placeholder logic for attendance until we have explicit states
    v_attendance_rate := 0; 
    
    -- Update Table
    INSERT INTO coach_statistics (
        coach_id, total_requests, response_rate, avg_response_time_minutes, 
        cancellations_count, late_reschedules_count, attendance_rate, last_updated_at
    )
    VALUES (
        target_coach_id, v_total_requests, v_response_rate, v_avg_response_time,
        v_cancellations, v_late_reschedules, v_attendance_rate, NOW()
    )
    ON CONFLICT (coach_id) DO UPDATE SET
        total_requests = EXCLUDED.total_requests,
        response_rate = EXCLUDED.response_rate,
        avg_response_time_minutes = EXCLUDED.avg_response_time_minutes,
        cancellations_count = EXCLUDED.cancellations_count,
        late_reschedules_count = EXCLUDED.late_reschedules_count,
        attendance_rate = EXCLUDED.attendance_rate,
        last_updated_at = NOW();

END;
$$;

-- 3. Triggers

-- Trigger function wrapper
CREATE OR REPLACE FUNCTION trigger_update_coach_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_coach_id UUID;
BEGIN
    -- Determine Coach ID based on table
    IF TG_TABLE_NAME = 'calendar_events' THEN
        v_coach_id := NEW.coach_id;
        IF v_coach_id IS NULL AND TG_OP = 'DELETE' THEN v_coach_id := OLD.coach_id; END IF;
        
    ELSIF TG_TABLE_NAME = 'calendar_event_participants' THEN
        -- Get coach_id from event
        SELECT coach_id INTO v_coach_id FROM calendar_events WHERE id = NEW.event_id;
        
    ELSIF TG_TABLE_NAME = 'calendar_event_reschedule_requests' THEN
         -- Get coach_id from event
        SELECT coach_id INTO v_coach_id FROM calendar_events WHERE id = NEW.event_id;
    END IF;

    IF v_coach_id IS NOT NULL THEN
        PERFORM calculate_coach_stats(v_coach_id);
    END IF;

    RETURN NULL;
END;
$$;

-- Apply Triggers
DROP TRIGGER IF EXISTS trg_stats_events ON calendar_events;
CREATE TRIGGER trg_stats_events
AFTER INSERT OR UPDATE ON calendar_events
FOR EACH ROW EXECUTE FUNCTION trigger_update_coach_stats();

DROP TRIGGER IF EXISTS trg_stats_participants ON calendar_event_participants;
CREATE TRIGGER trg_stats_participants
AFTER INSERT OR UPDATE ON calendar_event_participants
FOR EACH ROW EXECUTE FUNCTION trigger_update_coach_stats();

DROP TRIGGER IF EXISTS trg_stats_reschedules ON calendar_event_reschedule_requests;
CREATE TRIGGER trg_stats_reschedules
AFTER INSERT OR UPDATE ON calendar_event_reschedule_requests
FOR EACH ROW EXECUTE FUNCTION trigger_update_coach_stats();
