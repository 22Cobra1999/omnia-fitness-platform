-- Query SIMPLIFICADA para "Actividades de hoy" - Solo columnas esenciales
-- Para la vista principal, los detalles se ven al entrar a cada actividad

SELECT 
    ed.id,
    ed.nombre_ejercicio as name,
    ed.tipo as type,
    ed.intensidad as default_intensity,
    
    -- Detalles de series desde tabla intensidades
    i.detalle_series,
    
    -- Información del período (solo número para agrupación)
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
ORDER BY 
    pa.numero_periodo,
    ed.id;

-- Columnas retornadas:
-- id: ID del ejercicio
-- name: Nombre del ejercicio (ej: "Press de Banca")
-- type: Tipo de ejercicio (ej: "fuerza", "descanso")
-- intensidad: Intensidad por defecto (ej: "Principiante")
-- detalle_series: Array JSON con todos los bloques de series
-- numero_periodo: Número del período actual para agrupación







































