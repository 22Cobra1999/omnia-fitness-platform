-- Script para probar después de eliminar detalle_series de ejercicios_detalles
-- Ejecutar después de remove-detalle-series-from-ejercicios-detalles.sql

-- 1. Verificar estructura de ejercicios_detalles (sin detalle_series)
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default 
FROM 
    information_schema.columns 
WHERE 
    table_name = 'ejercicios_detalles' 
ORDER BY 
    ordinal_position;

-- 2. Verificar que intensidades sigue intacta
SELECT 
    'VERIFICACION INTENSIDADES' as seccion,
    COUNT(*) as total_intensidades,
    COUNT(DISTINCT ejercicio_id) as ejercicios_unicos,
    COUNT(DISTINCT intensidad) as intensidades_unicas
FROM intensidades;

-- 3. Query completa con JOINs (debería funcionar igual)
SELECT 
    oe.activity_id,
    oe.semana,
    oe.dia,
    ed.nombre_ejercicio,
    ed.descripcion,
    ed.tipo,
    ed.equipo,
    ed.body_parts,
    ed.calorias as calorias_ejercicio,
    -- ed.detalle_series as series_ejercicio, -- Ya no existe
    ed.video_url,
    i.intensidad,
    i.detalle_series as series_intensidad,
    i.duracion_minutos,
    i.calorias as calorias_intensidad
FROM organizacion_ejercicios oe
LEFT JOIN ejercicios_detalles ed ON oe.ejercicio_id = ed.id
LEFT JOIN intensidades i ON ed.id = i.ejercicio_id
WHERE oe.activity_id = 59
ORDER BY oe.semana, oe.dia, ed.nombre_ejercicio, i.intensidad
LIMIT 10;

-- 4. Verificar que no hay referencias a detalle_series en ejercicios_detalles
SELECT 
    id,
    nombre_ejercicio,
    tipo,
    calorias,
    video_url
FROM ejercicios_detalles
WHERE activity_id = 59
LIMIT 5;

-- 5. Verificar que las series están solo en intensidades
SELECT 
    ejercicio_id,
    nombre_ejercicio,
    intensidad,
    detalle_series,
    calorias
FROM intensidades
WHERE ejercicio_id IN (255, 256, 257)
ORDER BY ejercicio_id, intensidad
LIMIT 10;

































