-- Consultas útiles para trabajar con las nuevas tablas

-- 1. Obtener la planificación completa de una actividad
SELECT 
    ep.activity_id,
    ep.week_number,
    jsonb_pretty(monday) as lunes,
    jsonb_pretty(tuesday) as martes,
    jsonb_pretty(wednesday) as miercoles,
    jsonb_pretty(thursday) as jueves,
    jsonb_pretty(friday) as viernes,
    jsonb_pretty(saturday) as sabado,
    jsonb_pretty(sunday) as domingo
FROM exercise_planning ep
WHERE ep.activity_id = 101
ORDER BY ep.week_number;

-- 2. Obtener el progreso de un cliente específico
SELECT 
    cp.client_id,
    cp.date,
    cp.exercises_done,
    cp.exercises_not_done,
    jsonb_pretty(cp.details_series) as detalles_series,
    jsonb_pretty(cp.minutes_json) as minutos,
    jsonb_pretty(cp.calories_json) as calorias
FROM client_progress cp
WHERE cp.client_id = 202
ORDER BY cp.date DESC;

-- 3. Comparar planificación vs progreso de un cliente
SELECT 
    ep.week_number,
    ep.monday->>'exercises' as ejercicios_planificados_lunes,
    cp.exercises_done as ejercicios_completados,
    cp.exercises_not_done as ejercicios_pendientes
FROM exercise_planning ep
LEFT JOIN client_progress cp ON ep.activity_id = cp.activity_id 
    AND cp.date = '2025-01-25'  -- Fecha específica
WHERE ep.activity_id = 101
ORDER BY ep.week_number;

-- 4. Estadísticas de progreso por actividad
SELECT 
    cp.activity_id,
    COUNT(DISTINCT cp.client_id) as clientes_unicos,
    COUNT(*) as registros_progreso,
    AVG(array_length(cp.exercises_done, 1)) as promedio_ejercicios_completados,
    AVG(array_length(cp.exercises_not_done, 1)) as promedio_ejercicios_pendientes
FROM client_progress cp
GROUP BY cp.activity_id
ORDER BY cp.activity_id;

-- 5. Obtener ejercicios de un día específico para una semana
SELECT 
    ep.activity_id,
    ep.week_number,
    CASE 
        WHEN EXTRACT(DOW FROM '2025-01-25'::date) = 1 THEN jsonb_pretty(ep.monday)
        WHEN EXTRACT(DOW FROM '2025-01-25'::date) = 2 THEN jsonb_pretty(ep.tuesday)
        WHEN EXTRACT(DOW FROM '2025-01-25'::date) = 3 THEN jsonb_pretty(ep.wednesday)
        WHEN EXTRACT(DOW FROM '2025-01-25'::date) = 4 THEN jsonb_pretty(ep.thursday)
        WHEN EXTRACT(DOW FROM '2025-01-25'::date) = 5 THEN jsonb_pretty(ep.friday)
        WHEN EXTRACT(DOW FROM '2025-01-25'::date) = 6 THEN jsonb_pretty(ep.saturday)
        WHEN EXTRACT(DOW FROM '2025-01-25'::date) = 0 THEN jsonb_pretty(ep.sunday)
    END as ejercicios_del_dia
FROM exercise_planning ep
WHERE ep.activity_id = 101
ORDER BY ep.week_number;

-- 6. Calcular total de minutos y calorías por cliente
SELECT 
    cp.client_id,
    cp.date,
    SUM(
        CASE 
            WHEN cp.minutes_json ? exercise_id::text 
            THEN (cp.minutes_json->exercise_id::text)::integer 
            ELSE 0 
        END
    ) as total_minutos,
    SUM(
        CASE 
            WHEN cp.calories_json ? exercise_id::text 
            THEN (cp.calories_json->exercise_id::text)::integer 
            ELSE 0 
        END
    ) as total_calorias
FROM client_progress cp,
     unnest(cp.exercises_done) as exercise_id
GROUP BY cp.client_id, cp.date
ORDER BY cp.date DESC;

-- 7. Obtener ejercicios pendientes de un cliente
SELECT DISTINCT
    cp.client_id,
    unnest(cp.exercises_not_done) as ejercicio_pendiente,
    cp.date
FROM client_progress cp
WHERE cp.client_id = 202
ORDER BY cp.date DESC, ejercicio_pendiente;

-- 8. Verificar consistencia de datos
-- Ejercicios que están en progreso pero no en planificación
SELECT DISTINCT
    cp.activity_id,
    cp.client_id,
    unnest(cp.exercises_done || cp.exercises_not_done) as ejercicio_id
FROM client_progress cp
WHERE NOT EXISTS (
    SELECT 1 
    FROM exercise_planning ep 
    WHERE ep.activity_id = cp.activity_id 
    AND (
        ep.monday->'exercises' @> to_jsonb(unnest(cp.exercises_done || cp.exercises_not_done))::text
        OR ep.tuesday->'exercises' @> to_jsonb(unnest(cp.exercises_done || cp.exercises_not_done))::text
        OR ep.wednesday->'exercises' @> to_jsonb(unnest(cp.exercises_done || cp.exercises_not_done))::text
        OR ep.thursday->'exercises' @> to_jsonb(unnest(cp.exercises_done || cp.exercises_not_done))::text
        OR ep.friday->'exercises' @> to_jsonb(unnest(cp.exercises_done || cp.exercises_not_done))::text
        OR ep.saturday->'exercises' @> to_jsonb(unnest(cp.exercises_done || cp.exercises_not_done))::text
        OR ep.sunday->'exercises' @> to_jsonb(unnest(cp.exercises_done || cp.exercises_not_done))::text
    )
);

-- 9. Resumen de actividad por cliente
SELECT 
    cp.activity_id,
    cp.client_id,
    COUNT(*) as dias_trabajados,
    SUM(array_length(cp.exercises_done, 1)) as total_ejercicios_completados,
    SUM(array_length(cp.exercises_not_done, 1)) as total_ejercicios_pendientes,
    MIN(cp.date) as primera_fecha,
    MAX(cp.date) as ultima_fecha
FROM client_progress cp
GROUP BY cp.activity_id, cp.client_id
ORDER BY cp.activity_id, cp.client_id;





























