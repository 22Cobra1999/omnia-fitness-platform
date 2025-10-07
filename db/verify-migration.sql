-- =====================================================
-- VERIFICAR MIGRACIÓN COMPLETA
-- =====================================================

-- =====================================================
-- ESTADÍSTICAS GENERALES
-- =====================================================

SELECT 
    'ESTADÍSTICAS GENERALES' as info,
    'ejercicios_detalles' as tabla, COUNT(*) as registros FROM ejercicios_detalles
UNION ALL
SELECT 
    'ESTADÍSTICAS GENERALES' as info,
    'organizacion_ejercicios' as tabla, COUNT(*) as registros FROM organizacion_ejercicios
UNION ALL
SELECT 
    'ESTADÍSTICAS GENERALES' as info,
    'intensidades' as tabla, COUNT(*) as registros FROM intensidades
UNION ALL
SELECT 
    'ESTADÍSTICAS GENERALES' as info,
    'ejecuciones_ejercicio' as tabla, COUNT(*) as registros FROM ejecuciones_ejercicio
UNION ALL
SELECT 
    'ESTADÍSTICAS GENERALES' as info,
    'periodos_asignados' as tabla, COUNT(*) as registros FROM periodos_asignados
UNION ALL
SELECT 
    'ESTADÍSTICAS GENERALES' as info,
    'activity_enrollments' as tabla, COUNT(*) as registros FROM activity_enrollments;

-- =====================================================
-- EJERCICIOS POR TIPO
-- =====================================================

SELECT 
    'EJERCICIOS POR TIPO' as info,
    tipo,
    COUNT(*) as cantidad
FROM ejercicios_detalles
GROUP BY tipo
ORDER BY cantidad DESC;

-- =====================================================
-- EJERCICIOS POR NOMBRE
-- =====================================================

SELECT 
    'EJERCICIOS POR NOMBRE' as info,
    nombre_ejercicio,
    COUNT(*) as cantidad
FROM ejercicios_detalles
GROUP BY nombre_ejercicio
ORDER BY cantidad DESC;

-- =====================================================
-- ORGANIZACIONES POR BLOQUE
-- =====================================================

SELECT 
    'ORGANIZACIONES POR BLOQUE' as info,
    bloque,
    COUNT(*) as cantidad
FROM organizacion_ejercicios
GROUP BY bloque
ORDER BY bloque;

-- =====================================================
-- INTENSIDADES POR NIVEL
-- =====================================================

SELECT 
    'INTENSIDADES POR NIVEL' as info,
    nombre,
    COUNT(*) as cantidad
FROM intensidades
GROUP BY nombre
ORDER BY cantidad DESC;

-- =====================================================
-- EJECUCIONES POR ESTADO
-- =====================================================

SELECT 
    'EJECUCIONES POR ESTADO' as info,
    completado,
    COUNT(*) as cantidad
FROM ejecuciones_ejercicio
GROUP BY completado;

-- =====================================================
-- EJECUCIONES POR INTENSIDAD
-- =====================================================

SELECT 
    'EJECUCIONES POR INTENSIDAD' as info,
    intensidad_aplicada,
    COUNT(*) as cantidad
FROM ejecuciones_ejercicio
GROUP BY intensidad_aplicada
ORDER BY cantidad DESC;

-- =====================================================
-- MUESTRA DE EJECUCIONES
-- =====================================================

SELECT 
    'MUESTRA DE EJECUCIONES' as info,
    ee.id,
    ee.periodo_id,
    ed.nombre_ejercicio,
    ee.intensidad_aplicada,
    ee.fecha_ejecucion,
    ee.completado
FROM ejecuciones_ejercicio ee
JOIN ejercicios_detalles ed ON ed.id = ee.ejercicio_id
ORDER BY ee.fecha_ejecucion
LIMIT 10;

-- =====================================================
-- VERIFICAR FUNCIONES
-- =====================================================

-- Probar función de progreso
SELECT 
    'FUNCIÓN DE PROGRESO' as info,
    get_progreso_cliente_ejercicio(62, 167) as resultado;

-- Probar función de ejercicios del día
SELECT 
    'FUNCIÓN EJERCICIOS DEL DÍA' as info,
    get_ejercicios_del_dia_completo(1, 1) as resultado;
