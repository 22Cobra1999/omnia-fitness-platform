-- Script SEGURO para limpiar la tabla ejercicios_detalles
-- Incluye backup automático y validaciones

-- 1. CREAR BACKUP DE SEGURIDAD
-- Crear tabla de backup con timestamp
CREATE TABLE IF NOT EXISTS ejercicios_detalles_backup_$(date +%Y%m%d_%H%M%S) AS 
SELECT * FROM ejercicios_detalles;

-- 2. VERIFICAR BACKUP CREADO
SELECT 
    'BACKUP CREADO' as estado,
    COUNT(*) as registros_en_backup
FROM ejercicios_detalles_backup_$(date +%Y%m%d_%H%M%S);

-- 3. VERIFICAR ESTRUCTURA ANTES DE LIMPIAR
SELECT 
    'ANTES DE LA LIMPIEZA' as estado,
    column_name as nombre_columna,
    data_type as tipo_dato,
    is_nullable as permite_nulo
FROM information_schema.columns 
WHERE table_name = 'ejercicios_detalles'
ORDER BY ordinal_position;

-- 4. CONTAR REGISTROS ANTES DE LIMPIAR
SELECT 
    'REGISTROS ANTES DE LIMPIAR' as estado,
    COUNT(*) as total_registros
FROM ejercicios_detalles;

-- 5. ELIMINAR COLUMNAS OBSOLETAS DE FORMA SEGURA
-- (Solo elimina si existen)

DO $$
BEGIN
    -- Eliminar columna 'semana' si existe
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ejercicios_detalles' AND column_name = 'semana') THEN
        ALTER TABLE ejercicios_detalles DROP COLUMN semana;
        RAISE NOTICE 'Columna "semana" eliminada';
    END IF;

    -- Eliminar columna 'dia' si existe
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ejercicios_detalles' AND column_name = 'dia') THEN
        ALTER TABLE ejercicios_detalles DROP COLUMN dia;
        RAISE NOTICE 'Columna "dia" eliminada';
    END IF;

    -- Eliminar columna 'día' si existe (con tilde)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ejercicios_detalles' AND column_name = 'día') THEN
        ALTER TABLE ejercicios_detalles DROP COLUMN día;
        RAISE NOTICE 'Columna "día" eliminada';
    END IF;

    -- Eliminar columna 'periodos' si existe
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ejercicios_detalles' AND column_name = 'periodos') THEN
        ALTER TABLE ejercicios_detalles DROP COLUMN periodos;
        RAISE NOTICE 'Columna "periodos" eliminada';
    END IF;

    -- Eliminar columna 'periodo' si existe
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ejercicios_detalles' AND column_name = 'periodo') THEN
        ALTER TABLE ejercicios_detalles DROP COLUMN periodo;
        RAISE NOTICE 'Columna "periodo" eliminada';
    END IF;

    -- Eliminar columnas en inglés si existen
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ejercicios_detalles' AND column_name = 'week') THEN
        ALTER TABLE ejercicios_detalles DROP COLUMN week;
        RAISE NOTICE 'Columna "week" eliminada';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ejercicios_detalles' AND column_name = 'day') THEN
        ALTER TABLE ejercicios_detalles DROP COLUMN day;
        RAISE NOTICE 'Columna "day" eliminada';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ejercicios_detalles' AND column_name = 'period') THEN
        ALTER TABLE ejercicios_detalles DROP COLUMN period;
        RAISE NOTICE 'Columna "period" eliminada';
    END IF;

    -- Eliminar columnas de fecha específicas si existen
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ejercicios_detalles' AND column_name = 'fecha_semana') THEN
        ALTER TABLE ejercicios_detalles DROP COLUMN fecha_semana;
        RAISE NOTICE 'Columna "fecha_semana" eliminada';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ejercicios_detalles' AND column_name = 'fecha_dia') THEN
        ALTER TABLE ejercicios_detalles DROP COLUMN fecha_dia;
        RAISE NOTICE 'Columna "fecha_dia" eliminada';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ejercicios_detalles' AND column_name = 'fecha_periodo') THEN
        ALTER TABLE ejercicios_detalles DROP COLUMN fecha_periodo;
        RAISE NOTICE 'Columna "fecha_periodo" eliminada';
    END IF;

    -- Eliminar columnas de número si existen
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ejercicios_detalles' AND column_name = 'numero_semana') THEN
        ALTER TABLE ejercicios_detalles DROP COLUMN numero_semana;
        RAISE NOTICE 'Columna "numero_semana" eliminada';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ejercicios_detalles' AND column_name = 'numero_dia') THEN
        ALTER TABLE ejercicios_detalles DROP COLUMN numero_dia;
        RAISE NOTICE 'Columna "numero_dia" eliminada';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ejercicios_detalles' AND column_name = 'numero_periodo') THEN
        ALTER TABLE ejercicios_detalles DROP COLUMN numero_periodo;
        RAISE NOTICE 'Columna "numero_periodo" eliminada';
    END IF;

    RAISE NOTICE 'Limpieza de columnas obsoletas completada';
END $$;

-- 6. VERIFICAR ESTRUCTURA DESPUÉS DE LA LIMPIEZA
SELECT 
    'DESPUÉS DE LA LIMPIEZA' as estado,
    column_name as nombre_columna,
    data_type as tipo_dato,
    is_nullable as permite_nulo
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
    (SELECT COUNT(*) FROM ejercicios_detalles_backup_$(date +%Y%m%d_%H%M%S)) as registros_backup,
    CASE 
        WHEN (SELECT COUNT(*) FROM ejercicios_detalles) = (SELECT COUNT(*) FROM ejercicios_detalles_backup_$(date +%Y%m%d_%H%M%S))
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
    'Backup creado en ejercicios_detalles_backup_$(date +%Y%m%d_%H%M%S)' as backup_info;






















