-- Script para verificar la estructura de ejercicios_detalles
-- Antes de ejecutar los scripts de población

-- 1. Verificar estructura de la tabla ejercicios_detalles
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

-- 2. Verificar datos existentes en ejercicios_detalles
SELECT 
    'DATOS EJERCICIOS_DETALLES' as seccion,
    COUNT(*) as total_ejercicios,
    COUNT(DISTINCT activity_id) as actividades_unicas
FROM ejercicios_detalles;

-- 3. Mostrar ejemplo de datos de ejercicios_detalles
SELECT 
    id,
    activity_id,
    nombre_ejercicio,
    tipo,
    descripcion,
    equipo,
    body_parts,
    calorias,
    detalle_series,
    video_url,
    created_by
FROM ejercicios_detalles
WHERE activity_id = 59
LIMIT 5;

-- 4. Verificar que detalle_series es JSONB válido
SELECT 
    id,
    nombre_ejercicio,
    detalle_series,
    jsonb_typeof(detalle_series) as tipo_json,
    jsonb_array_length(detalle_series) as cantidad_series
FROM ejercicios_detalles
WHERE activity_id = 59
LIMIT 3;

-- 5. Verificar que calorias es INTEGER
SELECT 
    id,
    nombre_ejercicio,
    calorias,
    pg_typeof(calorias) as tipo_calorias
FROM ejercicios_detalles
WHERE activity_id = 59
LIMIT 3;








































