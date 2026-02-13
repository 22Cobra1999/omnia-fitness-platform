-- Optimization: Create Availability RPC (FINAL CORRECTED VERSION)
-- Supports multiple rules per day and scope overrides
-- "working_date" alias used internally to avoid ambiguity with output param "day_date"

CREATE OR REPLACE FUNCTION get_coach_availability_summary(
    p_coach_id UUID,
    p_start_date DATE,
    p_end_date DATE
)
RETURNS TABLE (
    day_date DATE,
    total_minutes_available INTEGER,
    has_slots BOOLEAN
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH date_series AS (
        SELECT generate_series(p_start_date, p_end_date, '1 day'::interval)::date AS d
    ),
    -- 1. Fetch potential rules for each day
    potential_rules AS (
        SELECT 
            ds.d as working_date, -- Renamed to avoid collision with output param day_date
            r.id as rule_id,
            r.start_time,
            r.end_time,
            r.scope
        FROM date_series ds
        JOIN coach_availability_rules r ON r.coach_id = p_coach_id
        WHERE r.weekday = EXTRACT(DOW FROM ds.d)
        AND (
            r.scope = 'always' OR 
            (r.scope = 'month' AND r.year = EXTRACT(YEAR FROM ds.d) AND r.month = EXTRACT(MONTH FROM ds.d))
        )
    ),
    -- 2. Determine if a day has specific overrides
    day_has_override AS (
        SELECT working_date 
        FROM potential_rules 
        WHERE scope = 'month' 
        GROUP BY working_date
    ),
    -- 3. Filter active rules
    active_daily_rules AS (
        SELECT pr.*
        FROM potential_rules pr
        LEFT JOIN day_has_override dho ON pr.working_date = dho.working_date
        WHERE 
            (dho.working_date IS NOT NULL AND pr.scope = 'month') 
            OR 
            (dho.working_date IS NULL AND pr.scope = 'always')    
    ),
    -- 4. Generate slots (support multiple rules)
    base_slots AS (
        SELECT 
            adr.working_date,
            t.slot_timestamp as slot_start,
            (t.slot_timestamp + interval '30 minutes') as slot_end
        FROM active_daily_rules adr
        CROSS JOIN LATERAL generate_series(
            (adr.working_date + adr.start_time::time)::timestamp, 
            (adr.working_date + adr.end_time::time - interval '30 minutes')::timestamp, 
            interval '30 minutes'
        ) AS t(slot_timestamp)
    ),
    -- 5. Find booked slots
    booked_slots AS (
        SELECT 
            bs.working_date,
            bs.slot_start
        FROM base_slots bs
        JOIN calendar_events ce ON ce.coach_id = p_coach_id
        WHERE ce.status != 'cancelled'
        AND ce.start_time < bs.slot_end 
        AND (ce.end_time IS NULL OR ce.end_time > bs.slot_start)
    ),
    -- 6. Calculate available slots
    available_slots AS (
        SELECT 
            bs.working_date,
            count(DISTINCT bs.slot_start) as free_slots
        FROM base_slots bs
        LEFT JOIN booked_slots b ON b.slot_start = bs.slot_start
        WHERE b.slot_start IS NULL
        -- Filter out slots that are in the past or within 30 mins from now (using AR timezone as base)
        AND bs.slot_start > (timezone('America/Argentina/Buenos_Aires', now())::timestamp + interval '30 minutes')
        GROUP BY bs.working_date
    )
    SELECT 
        ds.d as day_date,
        COALESCE(av.free_slots, 0)::INTEGER * 30, -- Maps to total_minutes_available
        (COALESCE(av.free_slots, 0) > 0)          -- Maps to has_slots
    FROM date_series ds
    LEFT JOIN available_slots av ON av.working_date = ds.d
    ORDER BY ds.d;
END;
$$;

GRANT EXECUTE ON FUNCTION get_coach_availability_summary(UUID, DATE, DATE) TO authenticated;
