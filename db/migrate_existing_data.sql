-- Script de migración para mover datos existentes a las nuevas tablas
-- IMPORTANTE: Ejecutar después de crear las nuevas tablas y hacer backup de los datos existentes

-- 1. Migrar datos de períodos desde la tabla actual (ajustar según tu esquema actual)
-- Asumiendo que tienes una tabla 'activities' o similar con información de períodos
INSERT INTO periods (activity_id, periods_count)
SELECT 
    id as activity_id,
    COALESCE(periods_count, 1) as periods_count
FROM activities 
WHERE id NOT IN (SELECT activity_id FROM periods)
ON CONFLICT (activity_id) DO UPDATE SET
    periods_count = EXCLUDED.periods_count,
    updated_at = CURRENT_TIMESTAMP;

-- 2. Migrar datos de planificación de ejercicios desde el sistema actual
-- Asumiendo que tienes una tabla con la estructura de semanas y días
-- NOTA: Este es un ejemplo - ajustar según tu esquema actual
/*
INSERT INTO exercise_planning (activity_id, week_number, monday, tuesday, wednesday, thursday, friday, saturday, sunday)
SELECT 
    activity_id,
    week_number,
    COALESCE(monday_exercises, '{}') as monday,
    COALESCE(tuesday_exercises, '{}') as tuesday,
    COALESCE(wednesday_exercises, '{}') as wednesday,
    COALESCE(thursday_exercises, '{}') as thursday,
    COALESCE(friday_exercises, '{}') as friday,
    COALESCE(saturday_exercises, '{}') as saturday,
    COALESCE(sunday_exercises, '{}') as sunday
FROM current_schedule_table  -- Reemplazar con el nombre de tu tabla actual
ON CONFLICT (activity_id, week_number) DO UPDATE SET
    monday = EXCLUDED.monday,
    tuesday = EXCLUDED.tuesday,
    wednesday = EXCLUDED.wednesday,
    thursday = EXCLUDED.thursday,
    friday = EXCLUDED.friday,
    saturday = EXCLUDED.saturday,
    sunday = EXCLUDED.sunday,
    updated_at = CURRENT_TIMESTAMP;
*/

-- 3. Migrar datos de progreso de clientes desde el sistema actual
-- Asumiendo que tienes una tabla con ejecuciones o progreso actual
/*
INSERT INTO client_progress (activity_id, client_id, date, exercises_done, exercises_not_done, details_series, minutes_json, calories_json)
SELECT 
    activity_id,
    client_id,
    execution_date as date,
    ARRAY(SELECT exercise_id FROM exercise_executions WHERE ...) as exercises_done,
    ARRAY(SELECT exercise_id FROM planned_exercises WHERE ... AND NOT IN (SELECT exercise_id FROM exercise_executions WHERE ...)) as exercises_not_done,
    details_json as details_series,
    minutes_data as minutes_json,
    calories_data as calories_json
FROM current_progress_table  -- Reemplazar con el nombre de tu tabla actual
WHERE execution_date IS NOT NULL;
*/

-- 4. Verificar la migración
SELECT 'Datos migrados' as status, 
       (SELECT COUNT(*) FROM periods) as periods_count,
       (SELECT COUNT(*) FROM exercise_planning) as planning_count,
       (SELECT COUNT(*) FROM client_progress) as progress_count;

-- 5. Mostrar estadísticas de migración
SELECT 
    'Periods' as tabla,
    COUNT(*) as total_registros,
    COUNT(DISTINCT activity_id) as actividades_unicas
FROM periods
UNION ALL
SELECT 
    'Exercise Planning' as tabla,
    COUNT(*) as total_registros,
    COUNT(DISTINCT activity_id) as actividades_unicas
FROM exercise_planning
UNION ALL
SELECT 
    'Client Progress' as tabla,
    COUNT(*) as total_registros,
    COUNT(DISTINCT activity_id) as actividades_unicas
FROM client_progress;

-- 6. Verificar integridad de datos
-- Verificar que todas las activities en exercise_planning tengan un período definido
SELECT 
    ep.activity_id,
    ep.week_number,
    p.periods_count
FROM exercise_planning ep
LEFT JOIN periods p ON ep.activity_id = p.activity_id
WHERE p.activity_id IS NULL;

-- Verificar que no haya semanas mayores al número de períodos
SELECT 
    ep.activity_id,
    ep.week_number,
    p.periods_count
FROM exercise_planning ep
JOIN periods p ON ep.activity_id = p.activity_id
WHERE ep.week_number > p.periods_count;






















