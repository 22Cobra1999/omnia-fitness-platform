-- Consultas útiles para trabajar con las nuevas tablas en español

-- 1. Obtener la planificación completa de una actividad
SELECT 
    pe.actividad_id,
    pe.numero_semana,
    jsonb_pretty(pe.lunes) as ejercicios_lunes,
    jsonb_pretty(pe.martes) as ejercicios_martes,
    jsonb_pretty(pe.miercoles) as ejercicios_miercoles,
    jsonb_pretty(pe.jueves) as ejercicios_jueves,
    jsonb_pretty(pe.viernes) as ejercicios_viernes,
    jsonb_pretty(pe.sabado) as ejercicios_sabado,
    jsonb_pretty(pe.domingo) as ejercicios_domingo
FROM planificacion_ejercicios pe
WHERE pe.actividad_id = 101
ORDER BY pe.numero_semana;

-- 2. Obtener el progreso de un cliente específico
SELECT 
    pc.cliente_id,
    pc.fecha,
    pc.ejercicios_completados,
    pc.ejercicios_pendientes,
    jsonb_pretty(pc.detalles_series) as detalles_series,
    jsonb_pretty(pc.minutos_json) as minutos_por_ejercicio,
    jsonb_pretty(pc.calorias_json) as calorias_por_ejercicio
FROM progreso_cliente pc
WHERE pc.cliente_id = 202
ORDER BY pc.fecha DESC;

-- 3. Comparar planificación vs progreso de un cliente
SELECT 
    pe.numero_semana,
    pe.lunes->>'ejercicios' as ejercicios_planificados_lunes,
    pc.ejercicios_completados as ejercicios_completados,
    pc.ejercicios_pendientes as ejercicios_pendientes
FROM planificacion_ejercicios pe
LEFT JOIN progreso_cliente pc ON pe.actividad_id = pc.actividad_id 
    AND pc.fecha = '2025-01-25'  -- Fecha específica
WHERE pe.actividad_id = 101
ORDER BY pe.numero_semana;

-- 4. Estadísticas de progreso por actividad
SELECT 
    pc.actividad_id,
    COUNT(DISTINCT pc.cliente_id) as clientes_unicos,
    COUNT(*) as registros_progreso,
    AVG(array_length(pc.ejercicios_completados, 1)) as promedio_ejercicios_completados,
    AVG(array_length(pc.ejercicios_pendientes, 1)) as promedio_ejercicios_pendientes
FROM progreso_cliente pc
GROUP BY pc.actividad_id
ORDER BY pc.actividad_id;

-- 5. Obtener ejercicios de un día específico para una semana
SELECT 
    pe.actividad_id,
    pe.numero_semana,
    CASE 
        WHEN EXTRACT(DOW FROM '2025-01-25'::date) = 1 THEN jsonb_pretty(pe.lunes)
        WHEN EXTRACT(DOW FROM '2025-01-25'::date) = 2 THEN jsonb_pretty(pe.martes)
        WHEN EXTRACT(DOW FROM '2025-01-25'::date) = 3 THEN jsonb_pretty(pe.miercoles)
        WHEN EXTRACT(DOW FROM '2025-01-25'::date) = 4 THEN jsonb_pretty(pe.jueves)
        WHEN EXTRACT(DOW FROM '2025-01-25'::date) = 5 THEN jsonb_pretty(pe.viernes)
        WHEN EXTRACT(DOW FROM '2025-01-25'::date) = 6 THEN jsonb_pretty(pe.sabado)
        WHEN EXTRACT(DOW FROM '2025-01-25'::date) = 0 THEN jsonb_pretty(pe.domingo)
    END as ejercicios_del_dia
FROM planificacion_ejercicios pe
WHERE pe.actividad_id = 101
ORDER BY pe.numero_semana;

-- 6. Calcular total de minutos y calorías por cliente
SELECT 
    pc.cliente_id,
    pc.fecha,
    SUM(
        CASE 
            WHEN pc.minutos_json ? ejercicio_id::text 
            THEN (pc.minutos_json->ejercicio_id::text)::integer 
            ELSE 0 
        END
    ) as total_minutos,
    SUM(
        CASE 
            WHEN pc.calorias_json ? ejercicio_id::text 
            THEN (pc.calorias_json->ejercicio_id::text)::integer 
            ELSE 0 
        END
    ) as total_calorias
FROM progreso_cliente pc,
     unnest(pc.ejercicios_completados) as ejercicio_id
GROUP BY pc.cliente_id, pc.fecha
ORDER BY pc.fecha DESC;

-- 7. Obtener ejercicios pendientes de un cliente
SELECT DISTINCT
    pc.cliente_id,
    unnest(pc.ejercicios_pendientes) as ejercicio_pendiente,
    pc.fecha
FROM progreso_cliente pc
WHERE pc.cliente_id = 202
ORDER BY pc.fecha DESC, ejercicio_pendiente;

-- 8. Resumen de actividad por cliente
SELECT 
    pc.actividad_id,
    pc.cliente_id,
    COUNT(*) as dias_trabajados,
    SUM(array_length(pc.ejercicios_completados, 1)) as total_ejercicios_completados,
    SUM(array_length(pc.ejercicios_pendientes, 1)) as total_ejercicios_pendientes,
    MIN(pc.fecha) as primera_fecha,
    MAX(pc.fecha) as ultima_fecha
FROM progreso_cliente pc
GROUP BY pc.actividad_id, pc.cliente_id
ORDER BY pc.actividad_id, pc.cliente_id;

-- 9. Obtener todas las actividades con sus períodos
SELECT 
    p.actividad_id,
    p.cantidad_periodos,
    COUNT(pe.numero_semana) as semanas_planificadas
FROM periodos p
LEFT JOIN planificacion_ejercicios pe ON p.actividad_id = pe.actividad_id
GROUP BY p.actividad_id, p.cantidad_periodos
ORDER BY p.actividad_id;

-- 10. Verificar ejercicios que están en progreso pero no en planificación
SELECT DISTINCT
    pc.actividad_id,
    pc.cliente_id,
    unnest(pc.ejercicios_completados || pc.ejercicios_pendientes) as ejercicio_id
FROM progreso_cliente pc
WHERE NOT EXISTS (
    SELECT 1 
    FROM planificacion_ejercicios pe 
    WHERE pe.actividad_id = pc.actividad_id 
    AND (
        pe.lunes->'ejercicios' @> to_jsonb(unnest(pc.ejercicios_completados || pc.ejercicios_pendientes))::text
        OR pe.martes->'ejercicios' @> to_jsonb(unnest(pc.ejercicios_completados || pc.ejercicios_pendientes))::text
        OR pe.miercoles->'ejercicios' @> to_jsonb(unnest(pc.ejercicios_completados || pc.ejercicios_pendientes))::text
        OR pe.jueves->'ejercicios' @> to_jsonb(unnest(pc.ejercicios_completados || pc.ejercicios_pendientes))::text
        OR pe.viernes->'ejercicios' @> to_jsonb(unnest(pc.ejercicios_completados || pc.ejercicios_pendientes))::text
        OR pe.sabado->'ejercicios' @> to_jsonb(unnest(pc.ejercicios_completados || pc.ejercicios_pendientes))::text
        OR pe.domingo->'ejercicios' @> to_jsonb(unnest(pc.ejercicios_completados || pc.ejercicios_pendientes))::text
    )
);






























