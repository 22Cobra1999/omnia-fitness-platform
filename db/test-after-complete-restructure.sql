-- Script para probar después de la reestructuración completa
-- Ejecutar después de complete-restructure-ejercicios-detalles.sql

-- 1. Verificar estructura final de ejercicios_detalles
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
    ed.intensidad as intensidad_ejercicio,
    ed.video_url,
    i.intensidad as intensidad_tabla,
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
    intensidad,
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

-- 6. Verificar que la intensidad del ejercicio coincide con alguna intensidad de la tabla
SELECT 
    ed.id,
    ed.nombre_ejercicio,
    ed.intensidad as intensidad_ejercicio,
    COUNT(i.intensidad) as intensidades_disponibles,
    STRING_AGG(i.intensidad, ', ') as intensidades_tabla
FROM ejercicios_detalles ed
LEFT JOIN intensidades i ON ed.id = i.ejercicio_id
WHERE ed.activity_id = 59
GROUP BY ed.id, ed.nombre_ejercicio, ed.intensidad
ORDER BY ed.id
LIMIT 10;

































