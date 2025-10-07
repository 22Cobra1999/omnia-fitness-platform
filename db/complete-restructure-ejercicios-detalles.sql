-- Script completo para reestructurar ejercicios_detalles
-- Ejecutar en Supabase SQL Editor

-- PASO 1: Agregar columna intensidad a ejercicios_detalles
-- 1. Verificar estructura actual
SELECT 
    'ESTRUCTURA ANTES' as seccion,
    column_name, 
    data_type, 
    is_nullable, 
    column_default 
FROM 
    information_schema.columns 
WHERE 
    table_name = 'ejercicios_detalles' 
    AND column_name IN ('intensidad', 'detalle_series')
ORDER BY 
    column_name;

-- 2. Agregar columna intensidad a ejercicios_detalles
ALTER TABLE ejercicios_detalles 
ADD COLUMN IF NOT EXISTS intensidad TEXT DEFAULT 'Principiante';

-- 3. Agregar constraint para intensidad válida
ALTER TABLE ejercicios_detalles 
ADD CONSTRAINT IF NOT EXISTS valid_intensidad_ejercicios 
CHECK (intensidad IN ('Bajo', 'Medio', 'Alto', 'Principiante', 'Intermedio', 'Avanzado'));

-- 4. Actualizar intensidad basada en detalle_series existente
-- Asumimos que los ejercicios existentes son de intensidad "Principiante"
UPDATE ejercicios_detalles 
SET intensidad = 'Principiante'
WHERE intensidad IS NULL OR intensidad = 'Principiante';

-- PASO 2: Verificar que intensidad se agregó correctamente
SELECT 
    'VERIFICACION INTENSIDAD' as seccion,
    COUNT(*) as total_ejercicios,
    COUNT(CASE WHEN intensidad IS NOT NULL THEN 1 END) as con_intensidad,
    COUNT(CASE WHEN intensidad IS NULL THEN 1 END) as sin_intensidad
FROM ejercicios_detalles
WHERE activity_id = 59;

-- PASO 3: Eliminar columna detalle_series de ejercicios_detalles
-- 1. Verificar que intensidad existe antes de eliminar detalle_series
SELECT 
    'VERIFICACION PRE-ELIMINACION' as seccion,
    column_name, 
    data_type, 
    is_nullable, 
    column_default 
FROM 
    information_schema.columns 
WHERE 
    table_name = 'ejercicios_detalles' 
    AND column_name = 'intensidad';

-- 2. Eliminar la columna detalle_series de ejercicios_detalles
ALTER TABLE ejercicios_detalles DROP COLUMN IF EXISTS detalle_series;

-- PASO 4: Verificar resultado final
-- 1. Verificar estructura final
SELECT 
    'ESTRUCTURA FINAL' as seccion,
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

-- 3. Mostrar ejemplo de datos finales
SELECT 
    ed.id,
    ed.nombre_ejercicio,
    ed.tipo,
    ed.calorias as calorias_ejercicio,
    ed.intensidad as intensidad_ejercicio,
    i.intensidad as intensidad_tabla,
    i.detalle_series as series_intensidad,
    i.calorias as calorias_intensidad
FROM ejercicios_detalles ed
LEFT JOIN intensidades i ON ed.id = i.ejercicio_id
WHERE ed.activity_id = 59
ORDER BY ed.id, i.intensidad
LIMIT 10;

-- 4. Verificar que no hay referencias a detalle_series en ejercicios_detalles
SELECT 
    'VERIFICACION FINAL' as seccion,
    COUNT(*) as total_ejercicios,
    COUNT(CASE WHEN intensidad IS NOT NULL THEN 1 END) as con_intensidad
FROM ejercicios_detalles
WHERE activity_id = 59;


































