-- Script para probar la query final con la nueva estructura
-- Ejecutar después de execute-complete-setup.sql

-- 1. Verificar estructura de la nueva tabla
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default 
FROM 
    information_schema.columns 
WHERE 
    table_name = 'intensidades' 
ORDER BY 
    ordinal_position;

-- 2. Verificar datos creados
SELECT 
    'DATOS INTENSIDADES' as seccion,
    COUNT(*) as total_intensidades,
    COUNT(DISTINCT ejercicio_id) as ejercicios_unicos,
    COUNT(DISTINCT intensidad) as intensidades_unicas
FROM intensidades;

-- 3. Query completa con JOINs (como la que mostraste)
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
    ed.detalle_series as series_ejercicio,
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
LIMIT 20;

-- 4. Verificar que no hay duplicados
SELECT 
    ejercicio_id,
    intensidad,
    COUNT(*) as cantidad
FROM intensidades
GROUP BY ejercicio_id, intensidad
HAVING COUNT(*) > 1;

-- 5. Mostrar ejemplo de escalado de peso
SELECT 
    ed.nombre_ejercicio,
    ed.detalle_series as series_originales,
    i.intensidad,
    i.detalle_series as series_intensidad,
    ed.calorias as calorias_originales,
    i.calorias as calorias_intensidad
FROM ejercicios_detalles ed
LEFT JOIN intensidades i ON ed.id = i.ejercicio_id
WHERE ed.id = 255 -- Press de Banca
ORDER BY i.intensidad;

































