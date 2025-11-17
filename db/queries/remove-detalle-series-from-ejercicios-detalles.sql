-- Script para eliminar la columna detalle_series de ejercicios_detalles
-- Ya no es necesaria porque las series están en la tabla intensidades
-- IMPORTANTE: Ejecutar primero add-intensidad-to-ejercicios-detalles.sql

-- 1. Verificar que la columna intensidad existe
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default 
FROM 
    information_schema.columns 
WHERE 
    table_name = 'ejercicios_detalles' 
    AND column_name = 'intensidad';

-- 2. Verificar estructura actual
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default 
FROM 
    information_schema.columns 
WHERE 
    table_name = 'ejercicios_detalles' 
    AND column_name = 'detalle_series';

-- 2. Verificar que intensidades tiene los datos
SELECT 
    'VERIFICACION INTENSIDADES' as seccion,
    COUNT(*) as total_intensidades,
    COUNT(DISTINCT ejercicio_id) as ejercicios_unicos
FROM intensidades;

-- 3. Eliminar la columna detalle_series de ejercicios_detalles
ALTER TABLE ejercicios_detalles DROP COLUMN IF EXISTS detalle_series;

-- 4. Verificar que se eliminó correctamente
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

-- 5. Verificar que intensidades sigue intacta
SELECT 
    'VERIFICACION POST-ELIMINACION' as seccion,
    COUNT(*) as total_intensidades,
    COUNT(DISTINCT ejercicio_id) as ejercicios_unicos,
    COUNT(DISTINCT intensidad) as intensidades_unicas
FROM intensidades;

-- 6. Mostrar ejemplo de datos finales
SELECT 
    ed.id,
    ed.nombre_ejercicio,
    ed.tipo,
    ed.calorias as calorias_ejercicio,
    i.intensidad,
    i.detalle_series as series_intensidad,
    i.calorias as calorias_intensidad
FROM ejercicios_detalles ed
LEFT JOIN intensidades i ON ed.id = i.ejercicio_id
WHERE ed.activity_id = 59
ORDER BY ed.id, i.intensidad
LIMIT 10;
