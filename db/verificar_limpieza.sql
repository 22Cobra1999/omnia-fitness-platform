-- Script de verificación para revisar el estado de la limpieza
-- Este script te permite verificar si la limpieza se ejecutó correctamente

-- 1. Verificar si la tabla ejercicios_detalles existe
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ejercicios_detalles')
        THEN '✅ Tabla ejercicios_detalles EXISTE'
        ELSE '❌ Tabla ejercicios_detalles NO EXISTE'
    END as estado_tabla;

-- 2. Verificar si el backup existe
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ejercicios_detalles_backup')
        THEN '✅ Backup CREADO - ejercicios_detalles_backup'
        ELSE '❌ Backup NO EXISTE'
    END as estado_backup;

-- 3. Mostrar estructura actual de ejercicios_detalles
SELECT 
    'ESTRUCTURA ACTUAL DE ejercicios_detalles:' as informacion,
    column_name as nombre_columna,
    data_type as tipo_dato,
    is_nullable as permite_nulo
FROM information_schema.columns 
WHERE table_name = 'ejercicios_detalles'
ORDER BY ordinal_position;

-- 4. Verificar que no hay columnas obsoletas
SELECT 
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ NO HAY COLUMNAS OBSOLETAS'
        ELSE '❌ AÚN HAY COLUMNAS OBSOLETAS'
    END as estado_columnas_obsoletas,
    STRING_AGG(column_name, ', ') as columnas_obsoletas_encontradas
FROM information_schema.columns 
WHERE table_name = 'ejercicios_detalles'
    AND column_name IN ('semana', 'dia', 'día', 'periodos', 'periodo', 'week', 'day', 'period');

-- 5. Contar registros en ambas tablas
SELECT 
    'CONTEO DE REGISTROS:' as informacion,
    (SELECT COUNT(*) FROM ejercicios_detalles) as ejercicios_detalles_actual,
    (SELECT COUNT(*) FROM ejercicios_detalles_backup) as ejercicios_detalles_backup,
    CASE 
        WHEN (SELECT COUNT(*) FROM ejercicios_detalles) = (SELECT COUNT(*) FROM ejercicios_detalles_backup)
        THEN '✅ DATOS INTACTOS'
        ELSE '❌ PÉRDIDA DE DATOS'
    END as estado_datos;

-- 6. Mostrar ejemplos de datos actuales
SELECT 
    'EJEMPLOS DE DATOS ACTUALES:' as informacion,
    *
FROM ejercicios_detalles 
LIMIT 3;

-- 7. Verificar que las nuevas tablas existen
SELECT 
    'VERIFICACIÓN DE NUEVAS TABLAS:' as informacion,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'periodos') THEN '✅ periodos' ELSE '❌ periodos' END as tabla_periodos,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'planificacion_ejercicios') THEN '✅ planificacion_ejercicios' ELSE '❌ planificacion_ejercicios' END as tabla_planificacion,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'progreso_cliente') THEN '✅ progreso_cliente' ELSE '❌ progreso_cliente' END as tabla_progreso;

-- 8. Resumen final del sistema
SELECT 
    'RESUMEN FINAL DEL SISTEMA:' as informacion,
    (SELECT COUNT(*) FROM periodos) as periodos_creados,
    (SELECT COUNT(*) FROM planificacion_ejercicios) as planificaciones_creadas,
    (SELECT COUNT(*) FROM progreso_cliente) as progresos_creados,
    (SELECT COUNT(*) FROM ejercicios_detalles) as ejercicios_detalles_limpios;

-- 9. Verificar integridad del sistema
SELECT 
    'VERIFICACIÓN DE INTEGRIDAD:' as informacion,
    CASE 
        WHEN (SELECT COUNT(*) FROM ejercicios_detalles) > 0 
        THEN '✅ ejercicios_detalles tiene datos'
        ELSE '❌ ejercicios_detalles está vacía'
    END as estado_ejercicios_detalles,
    CASE 
        WHEN (SELECT COUNT(*) FROM periodos) > 0 
        THEN '✅ periodos tiene datos'
        ELSE '❌ periodos está vacía'
    END as estado_periodos,
    CASE 
        WHEN (SELECT COUNT(*) FROM planificacion_ejercicios) > 0 
        THEN '✅ planificacion_ejercicios tiene datos'
        ELSE '❌ planificacion_ejercicios está vacía'
    END as estado_planificacion,
    CASE 
        WHEN (SELECT COUNT(*) FROM progreso_cliente) > 0 
        THEN '✅ progreso_cliente tiene datos'
        ELSE '❌ progreso_cliente está vacía'
    END as estado_progreso;




























