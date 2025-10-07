-- Script final para probar la nueva estructura de intensidades con calorías
-- Ejecutar después de crear la nueva tabla

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

-- 2. Verificar datos existentes (si los hay)
SELECT 
    'DATOS EXISTENTES' as seccion,
    COUNT(*) as total_intensidades,
    COUNT(DISTINCT ejercicio_id) as ejercicios_unicos,
    COUNT(DISTINCT intensidad) as intensidades_unicas
FROM intensidades;

-- 3. Mostrar ejemplo de datos
SELECT 
    ejercicio_id,
    nombre_ejercicio,
    intensidad,
    detalle_series,
    duracion_minutos,
    calorias
FROM intensidades
LIMIT 5;

-- 4. Query de prueba con JOINs (estructura final)
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
ORDER BY oe.semana, oe.dia, i.intensidad
LIMIT 10;

-- 5. Verificar distribución por intensidad
SELECT 
    intensidad,
    COUNT(*) as cantidad,
    AVG(calorias) as calorias_promedio
FROM intensidades
GROUP BY intensidad
ORDER BY intensidad;

































