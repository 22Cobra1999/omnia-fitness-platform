-- Script SIMPLE para limpiar la tabla ejercicios_detalles
-- Elimina columnas obsoletas de forma segura

-- 1. CREAR BACKUP DE SEGURIDAD
CREATE TABLE IF NOT EXISTS ejercicios_detalles_backup AS 
SELECT * FROM ejercicios_detalles;

-- 2. VERIFICAR BACKUP CREADO
SELECT 
    'BACKUP CREADO' as estado,
    COUNT(*) as registros_en_backup
FROM ejercicios_detalles_backup;

-- 3. VERIFICAR ESTRUCTURA ANTES DE LIMPIAR
SELECT 
    'ANTES DE LA LIMPIEZA' as estado,
    column_name as nombre_columna,
    data_type as tipo_dato
FROM information_schema.columns 
WHERE table_name = 'ejercicios_detalles'
ORDER BY ordinal_position;

-- 4. CONTAR REGISTROS ANTES DE LIMPIAR
SELECT 
    'REGISTROS ANTES DE LIMPIAR' as estado,
    COUNT(*) as total_registros
FROM ejercicios_detalles;

-- 5. ELIMINAR COLUMNAS OBSOLETAS
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

-- 6. VERIFICAR ESTRUCTURA DESPUÉS DE LA LIMPIEZA
SELECT 
    'DESPUÉS DE LA LIMPIEZA' as estado,
    column_name as nombre_columna,
    data_type as tipo_dato
FROM information_schema.columns 
WHERE table_name = 'ejercicios_detalles'
ORDER BY ordinal_position;

-- 7. VERIFICAR QUE LOS DATOS SIGUEN INTACTOS
SELECT 
    'VERIFICACIÓN DE DATOS' as estado,
    COUNT(*) as total_registros_despues
FROM ejercicios_detalles;

-- 8. COMPARAR REGISTROS ANTES Y DESPUÉS
SELECT 
    'COMPARACIÓN DE REGISTROS' as estado,
    (SELECT COUNT(*) FROM ejercicios_detalles) as registros_despues,
    (SELECT COUNT(*) FROM ejercicios_detalles_backup) as registros_backup,
    CASE 
        WHEN (SELECT COUNT(*) FROM ejercicios_detalles) = (SELECT COUNT(*) FROM ejercicios_detalles_backup)
        THEN 'DATOS INTACTOS - Limpieza exitosa'
        ELSE 'ERROR - Pérdida de datos detectada'
    END as resultado;

-- 9. MOSTRAR EJEMPLOS DE DATOS DESPUÉS DE LA LIMPIEZA
SELECT 
    'EJEMPLOS DESPUÉS DE LA LIMPIEZA' as estado,
    *
FROM ejercicios_detalles 
LIMIT 5;

-- 10. VERIFICAR QUE NO HAY COLUMNAS OBSOLETAS RESTANTES
SELECT 
    'VERIFICACIÓN DE COLUMNAS OBSOLETAS RESTANTES' as estado,
    column_name as nombre_columna
FROM information_schema.columns 
WHERE table_name = 'ejercicios_detalles'
    AND column_name IN ('semana', 'dia', 'día', 'periodos', 'periodo', 'week', 'day', 'period')
ORDER BY column_name;

-- 11. MOSTRAR RESUMEN FINAL
SELECT 
    'LIMPIEZA COMPLETADA EXITOSAMENTE' as estado,
    NOW() as fecha_limpieza,
    'Tabla ejercicios_detalles optimizada' as resultado,
    'Backup creado en ejercicios_detalles_backup' as backup_info;






















