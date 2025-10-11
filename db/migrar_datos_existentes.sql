-- Script de migración para mover datos existentes a las nuevas tablas en español
-- IMPORTANTE: Ejecutar después de crear las nuevas tablas y hacer backup de los datos existentes

-- 1. Migrar datos de períodos desde la tabla actual (ajustar según tu esquema actual)
-- Asumiendo que tienes una tabla 'activities' o similar con información de períodos
/*
INSERT INTO periodos (actividad_id, cantidad_periodos)
SELECT 
    id as actividad_id,
    COALESCE(periods_count, 1) as cantidad_periodos
FROM activities 
WHERE id NOT IN (SELECT actividad_id FROM periodos)
ON CONFLICT (actividad_id) DO UPDATE SET
    cantidad_periodos = EXCLUDED.cantidad_periodos,
    fecha_actualizacion = CURRENT_TIMESTAMP;
*/

-- 2. Migrar datos de planificación de ejercicios desde el sistema actual
-- Asumiendo que tienes una tabla con la estructura de semanas y días
-- NOTA: Este es un ejemplo - ajustar según tu esquema actual
/*
INSERT INTO planificacion_ejercicios (actividad_id, numero_semana, lunes, martes, miercoles, jueves, viernes, sabado, domingo)
SELECT 
    activity_id as actividad_id,
    week_number as numero_semana,
    COALESCE(monday_exercises, '{}') as lunes,
    COALESCE(tuesday_exercises, '{}') as martes,
    COALESCE(wednesday_exercises, '{}') as miercoles,
    COALESCE(thursday_exercises, '{}') as jueves,
    COALESCE(friday_exercises, '{}') as viernes,
    COALESCE(saturday_exercises, '{}') as sabado,
    COALESCE(sunday_exercises, '{}') as domingo
FROM current_schedule_table  -- Reemplazar con el nombre de tu tabla actual
ON CONFLICT (actividad_id, numero_semana) DO UPDATE SET
    lunes = EXCLUDED.lunes,
    martes = EXCLUDED.martes,
    miercoles = EXCLUDED.miercoles,
    jueves = EXCLUDED.jueves,
    viernes = EXCLUDED.viernes,
    sabado = EXCLUDED.sabado,
    domingo = EXCLUDED.domingo,
    fecha_actualizacion = CURRENT_TIMESTAMP;
*/

-- 3. Migrar datos de progreso de clientes desde el sistema actual
-- Asumiendo que tienes una tabla con ejecuciones o progreso actual
/*
INSERT INTO progreso_cliente (actividad_id, cliente_id, fecha, ejercicios_completados, ejercicios_pendientes, detalles_series, minutos_json, calorias_json)
SELECT 
    activity_id as actividad_id,
    client_id as cliente_id,
    execution_date as fecha,
    ARRAY(SELECT exercise_id FROM exercise_executions WHERE ...) as ejercicios_completados,
    ARRAY(SELECT exercise_id FROM planned_exercises WHERE ... AND NOT IN (SELECT exercise_id FROM exercise_executions WHERE ...)) as ejercicios_pendientes,
    details_json as detalles_series,
    minutes_data as minutos_json,
    calories_data as calorias_json
FROM current_progress_table  -- Reemplazar con el nombre de tu tabla actual
WHERE execution_date IS NOT NULL;
*/

-- 4. Verificar la migración
SELECT 'Datos migrados' as estado, 
       (SELECT COUNT(*) FROM periodos) as cantidad_periodos,
       (SELECT COUNT(*) FROM planificacion_ejercicios) as cantidad_planificaciones,
       (SELECT COUNT(*) FROM progreso_cliente) as cantidad_progresos;

-- 5. Mostrar estadísticas de migración
SELECT 
    'Periodos' as tabla,
    COUNT(*) as total_registros,
    COUNT(DISTINCT actividad_id) as actividades_unicas
FROM periodos
UNION ALL
SELECT 
    'Planificacion Ejercicios' as tabla,
    COUNT(*) as total_registros,
    COUNT(DISTINCT actividad_id) as actividades_unicas
FROM planificacion_ejercicios
UNION ALL
SELECT 
    'Progreso Cliente' as tabla,
    COUNT(*) as total_registros,
    COUNT(DISTINCT actividad_id) as actividades_unicas
FROM progreso_cliente;

-- 6. Verificar integridad de datos
-- Verificar que todas las actividades en planificacion_ejercicios tengan un período definido
SELECT 
    pe.actividad_id,
    pe.numero_semana,
    p.cantidad_periodos
FROM planificacion_ejercicios pe
LEFT JOIN periodos p ON pe.actividad_id = p.actividad_id
WHERE p.actividad_id IS NULL;

-- Verificar que no haya semanas mayores al número de períodos
SELECT 
    pe.actividad_id,
    pe.numero_semana,
    p.cantidad_periodos
FROM planificacion_ejercicios pe
JOIN periodos p ON pe.actividad_id = p.actividad_id
WHERE pe.numero_semana > p.cantidad_periodos;

-- 7. Verificar consistencia de fechas
SELECT 
    pc.actividad_id,
    pc.cliente_id,
    pc.fecha,
    COUNT(*) as registros_duplicados
FROM progreso_cliente pc
GROUP BY pc.actividad_id, pc.cliente_id, pc.fecha
HAVING COUNT(*) > 1;

-- 8. Mostrar resumen final de migración
SELECT 
    'Resumen de migración completada' as estado,
    NOW() as fecha_migracion,
    (SELECT COUNT(*) FROM periodos) as periodos_migrados,
    (SELECT COUNT(*) FROM planificacion_ejercicios) as planificaciones_migradas,
    (SELECT COUNT(*) FROM progreso_cliente) as progresos_migrados;





























