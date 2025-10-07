-- Script para limpiar la tabla ejercicios_detalles
-- Elimina columnas obsoletas que ya no se necesitan con el nuevo sistema

-- IMPORTANTE: Hacer backup antes de ejecutar este script
-- CREATE TABLE ejercicios_detalles_backup AS SELECT * FROM ejercicios_detalles;

-- 1. Verificar estructura actual antes de limpiar
SELECT 
    'ANTES DE LA LIMPIEZA - Estructura actual:' as estado,
    column_name as nombre_columna,
    data_type as tipo_dato
FROM information_schema.columns 
WHERE table_name = 'ejercicios_detalles'
ORDER BY ordinal_position;

-- 2. Eliminar columnas obsoletas relacionadas con semanas, días y períodos
-- (Estas columnas ya no se necesitan porque ahora tenemos las tablas especializadas)

-- Eliminar columna 'semana' si existe
ALTER TABLE ejercicios_detalles DROP COLUMN IF EXISTS semana;

-- Eliminar columna 'dia' si existe
ALTER TABLE ejercicios_detalles DROP COLUMN IF EXISTS dia;

-- Eliminar columna 'día' si existe (con tilde)
ALTER TABLE ejercicios_detalles DROP COLUMN IF EXISTS día;

-- Eliminar columna 'periodos' si existe
ALTER TABLE ejercicios_detalles DROP COLUMN IF EXISTS periodos;

-- Eliminar columna 'periodo' si existe
ALTER TABLE ejercicios_detalles DROP COLUMN IF EXISTS periodo;

-- Eliminar columnas en inglés si existen
ALTER TABLE ejercicios_detalles DROP COLUMN IF EXISTS week;
ALTER TABLE ejercicios_detalles DROP COLUMN IF EXISTS day;
ALTER TABLE ejercicios_detalles DROP COLUMN IF EXISTS period;

-- Eliminar columnas de fecha específicas si existen
ALTER TABLE ejercicios_detalles DROP COLUMN IF EXISTS fecha_semana;
ALTER TABLE ejercicios_detalles DROP COLUMN IF EXISTS fecha_dia;
ALTER TABLE ejercicios_detalles DROP COLUMN IF EXISTS fecha_periodo;

-- Eliminar columnas de número si existen
ALTER TABLE ejercicios_detalles DROP COLUMN IF EXISTS numero_semana;
ALTER TABLE ejercicios_detalles DROP COLUMN IF EXISTS numero_dia;
ALTER TABLE ejercicios_detalles DROP COLUMN IF EXISTS numero_periodo;

-- 3. Verificar estructura después de la limpieza
SELECT 
    'DESPUÉS DE LA LIMPIEZA - Estructura actualizada:' as estado,
    column_name as nombre_columna,
    data_type as tipo_dato
FROM information_schema.columns 
WHERE table_name = 'ejercicios_detalles'
ORDER BY ordinal_position;

-- 4. Verificar que los datos siguen intactos
SELECT 
    'Verificación de datos después de la limpieza:' as estado,
    COUNT(*) as total_registros
FROM ejercicios_detalles;

-- 5. Mostrar algunas filas de ejemplo después de la limpieza
SELECT 
    'Ejemplos de datos después de la limpieza:' as estado,
    *
FROM ejercicios_detalles 
LIMIT 5;

-- 6. Verificar que no hay columnas obsoletas restantes
SELECT 
    'Verificación de columnas obsoletas restantes:' as estado,
    column_name as nombre_columna
FROM information_schema.columns 
WHERE table_name = 'ejercicios_detalles'
    AND column_name IN ('semana', 'dia', 'día', 'periodos', 'periodo', 'week', 'day', 'period')
ORDER BY column_name;

-- 7. Mostrar resumen de la limpieza
SELECT 
    'LIMPIEZA COMPLETADA' as estado,
    NOW() as fecha_limpieza,
    'Columnas obsoletas eliminadas exitosamente' as resultado;






















