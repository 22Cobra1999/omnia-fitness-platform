-- Query para obtener actividades de hoy con detalles de ejercicios
-- Esta query debe usarse en el componente TodayScreen para mostrar:
-- - Nombre del ejercicio
-- - Series, reps, peso
-- - Tipo de ejercicio
-- - Sin estrellas (solo calificación por programa completo)

SELECT 
    -- Información del ejercicio
    ed.id as ejercicio_id,
    ed.nombre_ejercicio as name,
    ed.tipo as type,
    ed.series,
    ed.reps,
    ed.peso as weight,
    ed.duracion as duration,
    ed.equipamiento as equipment,
    
    -- Información del período
    pa.id as periodo_id,
    pa.numero_periodo,
    pa.fecha_inicio,
    pa.fecha_fin,
    
    -- Información de la actividad
    a.id as activity_id,
    a.title as activity_title,
    a.type as activity_type,
    a.coach_id,
    
    -- Información del cliente
    ae.client_id,
    ae.status as enrollment_status,
    
    -- Información de ejecución (para tracking de progreso)
    ee.id as execution_id,
    ee.completado as completed,
    ee.intensidad_aplicada as applied_intensity,
    ee.created_at as execution_created_at
    
FROM ejercicios_detalles ed
JOIN periodos_asignados pa ON ed.activity_id = pa.activity_id
JOIN activities a ON ed.activity_id = a.id
JOIN activity_enrollments ae ON a.id = ae.activity_id
LEFT JOIN ejecuciones_ejercicio ee ON (
    ed.id = ee.ejercicio_id 
    AND pa.id = ee.periodo_id 
    AND ae.client_id = ee.client_id
)
WHERE 
    -- Solo actividades activas del cliente actual
    ae.client_id = 'CLIENT_ID_AQUI' -- Reemplazar con el ID del cliente
    AND ae.status = 'activa'
    
    -- Solo ejercicios de períodos que están activos hoy
    AND pa.fecha_inicio <= CURRENT_DATE
    AND pa.fecha_fin >= CURRENT_DATE
    
    -- Solo ejercicios del período actual
    AND pa.numero_periodo = (
        SELECT numero_periodo 
        FROM periodos_asignados pa2 
        WHERE pa2.activity_id = a.id 
        AND pa2.fecha_inicio <= CURRENT_DATE 
        AND pa2.fecha_fin >= CURRENT_DATE
        ORDER BY numero_periodo 
        LIMIT 1
    )

ORDER BY 
    pa.numero_periodo,
    ed.id;

-- Query alternativa más simple si solo necesitas los ejercicios de hoy:
SELECT 
    ed.nombre_ejercicio as title,
    ed.nombre_ejercicio as name,  -- Para el campo name que usa el componente
    ed.tipo as type,
    ed.series,
    ed.reps,
    ed.peso as weight,
    ed.duracion as duration,
    a.title as activity_title,
    pa.numero_periodo
FROM ejercicios_detalles ed
JOIN periodos_asignados pa ON ed.activity_id = pa.activity_id
JOIN activities a ON ed.activity_id = a.id
JOIN activity_enrollments ae ON a.id = ae.activity_id
WHERE 
    ae.client_id = 'CLIENT_ID_AQUI'
    AND ae.status = 'activa'
    AND pa.fecha_inicio <= CURRENT_DATE
    AND pa.fecha_fin >= CURRENT_DATE
ORDER BY pa.numero_periodo, ed.id;







































