-- Query FINAL corregida para obtener actividades de hoy
-- Usando la tabla "intensidades" que contiene detalle_series con peso, series, repeticiones

SELECT 
    -- Información del ejercicio
    ed.id as ejercicio_id,
    ed.nombre_ejercicio as name,
    ed.tipo as type,
    ed.intensidad as default_intensity,
    
    -- Información de intensidad (series, reps, peso desde tabla intensidades)
    i.detalle_series,
    i.duracion_minutos,
    i.calorias,
    
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
    ae.status as enrollment_status
    
FROM ejercicios_detalles ed
JOIN periodos_asignados pa ON ed.activity_id = pa.activity_id
JOIN activities a ON ed.activity_id = a.id
JOIN activity_enrollments ae ON a.id = ae.activity_id
LEFT JOIN intensidades i ON (
    ed.id = i.ejercicio_id 
    AND i.intensidad = ed.intensidad  -- Usar la intensidad del ejercicio
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

-- Query alternativa más simple para el frontend:
SELECT 
    ed.id as ejercicio_id,
    ed.nombre_ejercicio as name,
    ed.tipo as type,
    ed.intensidad as default_intensity,
    
    -- Extraer el primer detalle de series para mostrar en la UI
    i.detalle_series->0->>'series' as series,
    i.detalle_series->0->>'repeticiones' as reps,
    i.detalle_series->0->>'peso' as weight,
    
    i.duracion_minutos,
    i.calorias,
    
    a.title as activity_title,
    pa.numero_periodo
    
FROM ejercicios_detalles ed
JOIN periodos_asignados pa ON ed.activity_id = pa.activity_id
JOIN activities a ON ed.activity_id = a.id
JOIN activity_enrollments ae ON a.id = ae.activity_id
LEFT JOIN intensidades i ON (
    ed.id = i.ejercicio_id 
    AND i.intensidad = ed.intensidad
)
WHERE 
    ae.client_id = 'CLIENT_ID_AQUI'
    AND ae.status = 'activa'
    AND pa.fecha_inicio <= CURRENT_DATE
    AND pa.fecha_fin >= CURRENT_DATE
ORDER BY pa.numero_periodo, ed.id;
































