-- Query Revised: Availability with Multiple Rules & Override Logic
WITH params AS (
    SELECT 
        'b16c4f8c-f47b-4df0-ad2b-13dcbd76263f'::uuid as coach_id,
        '2026-02-01'::date as start_date,
        '2026-02-28'::date as end_date
),
date_series AS (
    SELECT generate_series(p.start_date, p.end_date, '1 day'::interval)::date AS d
    FROM params p
),
-- 1. Fetch potential rules for each day
potential_rules AS (
    SELECT 
        ds.d as day_date,
        r.id as rule_id,
        r.start_time,
        r.end_time,
        r.scope
    FROM date_series ds
    CROSS JOIN params p
    JOIN coach_availability_rules r ON r.coach_id = p.coach_id
    WHERE r.weekday = EXTRACT(DOW FROM ds.d)
    AND (
        r.scope = 'always' OR 
        (r.scope = 'month' AND r.year = EXTRACT(YEAR FROM ds.d) AND r.month = EXTRACT(MONTH FROM ds.d))
    )
),
-- 2. Determine if a day has specific overrides
day_has_override AS (
    SELECT day_date 
    FROM potential_rules 
    WHERE scope = 'month' 
    GROUP BY day_date
),
-- 3. Filter active rules:
--    - If day has override, keep ONLY 'month' rules.
--    - If day has NO override, keep 'always' rules.
active_daily_rules AS (
    SELECT pr.*
    FROM potential_rules pr
    LEFT JOIN day_has_override dho ON pr.day_date = dho.day_date
    WHERE 
        (dho.day_date IS NOT NULL AND pr.scope = 'month') -- Override exists: take specific
        OR 
        (dho.day_date IS NULL AND pr.scope = 'always')    -- No override: take generic
),
-- 4. Generate slots (now supporting multiple rules per day)
base_slots AS (
    SELECT 
        adr.day_date,
        t.slot_timestamp as slot_start,
        (t.slot_timestamp + interval '30 minutes') as slot_end
    FROM active_daily_rules adr
    CROSS JOIN LATERAL generate_series(
        (adr.day_date + adr.start_time::time)::timestamp, 
        (adr.day_date + adr.end_time::time - interval '30 minutes')::timestamp, 
        interval '30 minutes'
    ) AS t(slot_timestamp)
),
-- 5. Status against events
slot_status AS (
    SELECT 
        bs.day_date,
        bs.slot_start,
        bs.slot_end,
        CASE 
            WHEN ce.id IS NOT NULL THEN 'OCUPADO'
            ELSE 'LIBRE'
        END as status,
        ce.title as event_title
    FROM base_slots bs
    CROSS JOIN params p
    LEFT JOIN calendar_events ce 
        ON ce.coach_id = p.coach_id
        AND ce.status != 'cancelled'
        AND ce.start_time < bs.slot_end 
        AND (ce.end_time IS NULL OR ce.end_time > bs.slot_start)
),
-- 6. Summary
daily_summary AS (
    SELECT 
        day_date,
        COUNT(DISTINCT slot_start) FILTER (WHERE status = 'LIBRE') * 30 as minutos_disponibles,
        COUNT(DISTINCT slot_start) FILTER (WHERE status = 'OCUPADO') * 30 as minutos_ocupados,
        STRING_AGG(DISTINCT event_title, ', ') as eventos
    FROM slot_status
    GROUP BY day_date
),
-- Get rules info aggregated (since now multiple rules can exist per day)
rules_info AS (
    SELECT 
        day_date, 
        STRING_AGG(start_time::text || '-' || end_time::text, ', ') as rangos_horarios,
        STRING_AGG(DISTINCT scope, ', ') as tipos_regla
    FROM active_daily_rules
    GROUP BY day_date
)
SELECT 
    ds.day_date,
    to_char(ds.day_date, 'Day') as nombre_dia,
    ri.rangos_horarios,
    ri.tipos_regla,
    ds.minutos_disponibles,
    ds.minutos_ocupados,
    CASE 
        WHEN ds.minutos_disponibles = 0 THEN 'SIN DISPO'
        WHEN ds.minutos_disponibles < 120 THEN '🔴 ROJO (Menos de 2h)'
        ELSE '🟠 NARANJA (2h o más)'
    END as color_indicador,
    COALESCE(ds.eventos, '-') as detalle_ocupacion
FROM daily_summary ds
JOIN rules_info ri ON ri.day_date = ds.day_date
ORDER BY ds.day_date;
