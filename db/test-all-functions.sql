-- =====================================================
-- PROBAR TODAS LAS FUNCIONES DEL SISTEMA MODULAR
-- =====================================================

-- =====================================================
-- 1. PROBAR FUNCIÓN DE PROGRESO
-- =====================================================
SELECT 'PROGRESO DEL CLIENTE (EJERCICIO 1)' as test_name;
SELECT get_progreso_cliente_ejercicio(62, 1) as resultado;

SELECT 'PROGRESO DEL CLIENTE (EJERCICIO 2)' as test_name;
SELECT get_progreso_cliente_ejercicio(62, 2) as resultado;

-- =====================================================
-- 2. PROBAR FUNCIÓN DE EJERCICIOS DEL DÍA
-- =====================================================
SELECT 'EJERCICIOS DEL DÍA 1, PERÍODO 1' as test_name;
SELECT get_ejercicios_del_dia_completo(1, 1) as resultado;

SELECT 'EJERCICIOS DEL DÍA 2, PERÍODO 1' as test_name;
SELECT get_ejercicios_del_dia_completo(1, 2) as resultado;

-- =====================================================
-- 3. PROBAR FUNCIÓN DE GENERAR PERÍODOS
-- =====================================================
SELECT 'GENERAR PERÍODOS PARA ENROLLMENT 62' as test_name;
SELECT generar_periodos_para_enrollment(62) as resultado;

-- =====================================================
-- 4. PROBAR FUNCIÓN DE GENERAR EJECUCIONES
-- =====================================================
SELECT 'GENERAR EJECUCIONES PARA PERÍODO 1' as test_name;
SELECT generar_ejecuciones_para_periodo(1) as resultado;

-- =====================================================
-- 5. MOSTRAR EJECUCIONES ACTUALES
-- =====================================================
SELECT 'EJECUCIONES ACTUALES' as test_name;
SELECT 
    ee.id,
    ee.periodo_id,
    ee.ejercicio_id,
    ed.nombre_ejercicio,
    ee.fecha_ejecucion,
    ee.completado,
    ee.intensidad_aplicada
FROM ejecuciones_ejercicio ee
JOIN ejercicios_detalles ed ON ed.id = ee.ejercicio_id
ORDER BY ee.periodo_id, ee.fecha_ejecucion;

-- =====================================================
-- 6. MOSTRAR PERÍODOS ACTUALES
-- =====================================================
SELECT 'PERÍODOS ACTUALES' as test_name;
SELECT 
    pa.id,
    pa.enrollment_id,
    pa.numero_periodo,
    pa.fecha_inicio,
    pa.fecha_fin,
    ae.status as enrollment_status
FROM periodos_asignados pa
JOIN activity_enrollments ae ON ae.id = pa.enrollment_id
ORDER BY pa.enrollment_id, pa.numero_periodo;

-- =====================================================
-- 7. MOSTRAR EJERCICIOS Y ORGANIZACIONES
-- =====================================================
SELECT 'EJERCICIOS Y ORGANIZACIONES' as test_name;
SELECT 
    ed.id as ejercicio_id,
    ed.nombre_ejercicio,
    ed.tipo,
    oe.bloque,
    oe.dia,
    oe.semana,
    oe.numero_periodo
FROM ejercicios_detalles ed
JOIN organizacion_ejercicios oe ON oe.ejercicio_id = ed.id
ORDER BY oe.numero_periodo, oe.dia;

-- =====================================================
-- 8. ESTADO FINAL DEL SISTEMA
-- =====================================================
SELECT 'ESTADO FINAL DEL SISTEMA' as test_name;
SELECT 
    'Enrollments' as tabla, COUNT(*) as cantidad FROM activity_enrollments
UNION ALL
SELECT 
    'Períodos' as tabla, COUNT(*) as cantidad FROM periodos_asignados
UNION ALL
SELECT 
    'Ejercicios' as tabla, COUNT(*) as cantidad FROM ejercicios_detalles
UNION ALL
SELECT 
    'Organizaciones' as tabla, COUNT(*) as cantidad FROM organizacion_ejercicios
UNION ALL
SELECT 
    'Ejecuciones' as tabla, COUNT(*) as cantidad FROM ejecuciones_ejercicio
UNION ALL
SELECT 
    'Ejecuciones Completadas' as tabla, COUNT(*) as cantidad FROM ejecuciones_ejercicio WHERE completado = TRUE;
