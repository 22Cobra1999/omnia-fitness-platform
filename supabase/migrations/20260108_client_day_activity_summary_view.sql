-- Create a lightweight summary view for client calendar rendering
-- One row per client/day/activity OR client/day/calendar_event

DROP VIEW IF EXISTS public.client_day_activity_summary_v;

CREATE VIEW public.client_day_activity_summary_v AS
WITH
fitness AS (
  SELECT
    p.cliente_id AS client_id,
    p.fecha::date AS day,
    p.actividad_id::int AS activity_id,
    SUM(COALESCE(v.value::int, 0))::int AS fitness_mins
  FROM public.progreso_cliente p
  CROSS JOIN LATERAL jsonb_each_text(COALESCE(p.minutos_json::jsonb, '{}'::jsonb)) AS v(key, value)
  GROUP BY 1, 2, 3
),

nutri AS (
  SELECT
    n.cliente_id AS client_id,
    n.fecha::date AS day,
    n.actividad_id::int AS activity_id,
    SUM(COALESCE((m.value->>'minutos')::int, 0))::int AS nutri_mins
  FROM public.progreso_cliente_nutricion n
  CROSS JOIN LATERAL jsonb_each(COALESCE(n.macros::jsonb, '{}'::jsonb)) AS m(key, value)
  GROUP BY 1, 2, 3
),

activities_catalog AS (
  SELECT
    a.id::int AS activity_id,
    a.title AS activity_title,
    a.coach_id AS coach_id
  FROM public.activities a
),

activity_rows AS (
  SELECT
    ('act:' || f.client_id::text || ':' || f.day::text || ':' || f.activity_id::text) AS id,
    f.client_id,
    f.day,
    f.activity_id,
    NULL::uuid AS calendar_event_id,
    ac.activity_title,
    ac.coach_id,
    f.fitness_mins,
    0::int AS nutri_mins,
    0::int AS calendar_mins
  FROM fitness f
  LEFT JOIN activities_catalog ac ON ac.activity_id = f.activity_id

  UNION ALL

  SELECT
    ('act:' || n.client_id::text || ':' || n.day::text || ':' || n.activity_id::text) AS id,
    n.client_id,
    n.day,
    n.activity_id,
    NULL::uuid AS calendar_event_id,
    ac.activity_title,
    ac.coach_id,
    0::int AS fitness_mins,
    n.nutri_mins,
    0::int AS calendar_mins
  FROM nutri n
  LEFT JOIN activities_catalog ac ON ac.activity_id = n.activity_id
),

activity_agg AS (
  SELECT
    id,
    client_id,
    day,
    activity_id,
    NULL::uuid AS calendar_event_id,
    (array_agg(activity_title) FILTER (WHERE activity_title IS NOT NULL))[1] AS activity_title,
    (array_agg(coach_id) FILTER (WHERE coach_id IS NOT NULL))[1] AS coach_id,
    SUM(fitness_mins)::int AS fitness_mins,
    SUM(nutri_mins)::int AS nutri_mins,
    0::int AS calendar_mins
  FROM activity_rows
  GROUP BY 1, 2, 3, 4
),

event_rows AS (
  SELECT
    ('evt:' || e.id::text) AS id,
    p.client_id AS client_id,
    e.start_time::date AS day,
    e.activity_id::int AS activity_id,
    e.id AS calendar_event_id,
    e.title AS activity_title,
    e.coach_id AS coach_id,
    0::int AS fitness_mins,
    0::int AS nutri_mins,
    GREATEST(
      0,
      EXTRACT(epoch FROM (COALESCE(e.end_time, e.start_time + interval '30 minutes') - e.start_time)) / 60
    )::int AS calendar_mins
  FROM public.calendar_event_participants p
  JOIN public.calendar_events e ON e.id = p.event_id
  WHERE COALESCE(e.status, 'scheduled') <> 'cancelled'
)

SELECT
  id,
  client_id,
  day,
  activity_id,
  calendar_event_id,
  activity_title,
  coach_id,
  fitness_mins,
  nutri_mins,
  calendar_mins,
  (fitness_mins + nutri_mins + calendar_mins)::int AS total_mins
FROM activity_agg

UNION ALL

SELECT
  id,
  client_id,
  day,
  activity_id,
  calendar_event_id,
  activity_title,
  coach_id,
  fitness_mins,
  nutri_mins,
  calendar_mins,
  (fitness_mins + nutri_mins + calendar_mins)::int AS total_mins
FROM event_rows;

-- Recommended indexes for performance (safe to run multiple times)
CREATE INDEX IF NOT EXISTS idx_progreso_cliente_cliente_fecha
ON public.progreso_cliente (cliente_id, fecha);

CREATE INDEX IF NOT EXISTS idx_progreso_cliente_nutricion_cliente_fecha
ON public.progreso_cliente_nutricion (cliente_id, fecha);

CREATE INDEX IF NOT EXISTS idx_calendar_event_participants_client_event
ON public.calendar_event_participants (client_id, event_id);

CREATE INDEX IF NOT EXISTS idx_calendar_events_start_time
ON public.calendar_events (start_time);
