-- =====================================================
-- POBLAR DATOS DE EJEMPLO PARA VERIFICAR FUNCIONAMIENTO
-- =====================================================
-- Este script crea datos de ejemplo para probar el nuevo sistema

-- =====================================================
-- PASO 1: VERIFICAR QUE LAS TABLAS ESTÁN VACÍAS
-- =====================================================

DO $$
DECLARE
    v_ejecuciones_count INTEGER;
    v_intensidades_count INTEGER;
    v_ejercicios_count INTEGER;
    v_periodos_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_ejecuciones_count FROM ejecuciones_ejercicio;
    SELECT COUNT(*) INTO v_intensidades_count FROM intensidades;
    SELECT COUNT(*) INTO v_ejercicios_count FROM ejercicios_detalles;
    SELECT COUNT(*) INTO v_periodos_count FROM periodos_asignados;
    
    RAISE NOTICE '=========================================';
    RAISE NOTICE 'ESTADO ACTUAL DE LAS TABLAS';
    RAISE NOTICE '=========================================';
    RAISE NOTICE 'Ejecuciones: %', v_ejecuciones_count;
    RAISE NOTICE 'Intensidades: %', v_intensidades_count;
    RAISE NOTICE 'Ejercicios: %', v_ejercicios_count;
    RAISE NOTICE 'Períodos: %', v_periodos_count;
    RAISE NOTICE '=========================================';
END $$;

-- =====================================================
-- PASO 2: CREAR INTENSIDADES DE EJEMPLO
-- =====================================================

-- Crear intensidades para ejercicios existentes
INSERT INTO intensidades (ejercicio_id, nombre, orden, reps, series, peso, duracion_minutos, descanso_segundos)
SELECT 
    ed.id as ejercicio_id,
    'Principiante' as nombre,
    1 as orden,
    8 as reps,
    3 as series,
    0 as peso,
    NULL as duracion_minutos,
    90 as descanso_segundos
FROM ejercicios_detalles ed
WHERE NOT EXISTS (
    SELECT 1 FROM intensidades i 
    WHERE i.ejercicio_id = ed.id AND i.nombre = 'Principiante'
)
LIMIT 5;

INSERT INTO intensidades (ejercicio_id, nombre, orden, reps, series, peso, duracion_minutos, descanso_segundos)
SELECT 
    ed.id as ejercicio_id,
    'Intermedio' as nombre,
    2 as orden,
    12 as reps,
    3 as series,
    0 as peso,
    NULL as duracion_minutos,
    60 as descanso_segundos
FROM ejercicios_detalles ed
WHERE NOT EXISTS (
    SELECT 1 FROM intensidades i 
    WHERE i.ejercicio_id = ed.id AND i.nombre = 'Intermedio'
)
LIMIT 5;

INSERT INTO intensidades (ejercicio_id, nombre, orden, reps, series, peso, duracion_minutos, descanso_segundos)
SELECT 
    ed.id as ejercicio_id,
    'Avanzado' as nombre,
    3 as orden,
    15 as reps,
    4 as series,
    0 as peso,
    NULL as duracion_minutos,
    45 as descanso_segundos
FROM ejercicios_detalles ed
WHERE NOT EXISTS (
    SELECT 1 FROM intensidades i 
    WHERE i.ejercicio_id = ed.id AND i.nombre = 'Avanzado'
)
LIMIT 5;

-- =====================================================
-- PASO 3: CREAR EJECUCIONES DE EJEMPLO
-- =====================================================

-- Crear ejecuciones para períodos existentes
INSERT INTO ejecuciones_ejercicio (
    periodo_id,
    ejercicio_id,
    intensidad_aplicada,
    duracion,
    calorias_estimadas,
    fecha_ejecucion,
    completado,
    peso_usado,
    repeticiones_realizadas,
    series_completadas,
    tiempo_real_segundos,
    nota_cliente
)
SELECT 
    pa.id as periodo_id,
    ed.id as ejercicio_id,
    'Intermedio' as intensidad_aplicada,
    30 as duracion,
    200 as calorias_estimadas,
    CURRENT_DATE as fecha_ejecucion,
    false as completado,
    50.0 as peso_usado,
    12 as repeticiones_realizadas,
    3 as series_completadas,
    1800 as tiempo_real_segundos,
    'Ejercicio de ejemplo' as nota_cliente
FROM periodos_asignados pa
JOIN ejercicios_detalles ed ON ed.activity_id = (
    SELECT ae.activity_id 
    FROM activity_enrollments ae 
    WHERE ae.id = pa.enrollment_id
)
WHERE NOT EXISTS (
    SELECT 1 FROM ejecuciones_ejercicio ee 
    WHERE ee.periodo_id = pa.id AND ee.ejercicio_id = ed.id
)
LIMIT 10;

-- =====================================================
-- PASO 4: VERIFICAR DATOS CREADOS
-- =====================================================

DO $$
DECLARE
    v_ejecuciones_count INTEGER;
    v_intensidades_count INTEGER;
    v_ejercicios_count INTEGER;
    v_periodos_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_ejecuciones_count FROM ejecuciones_ejercicio;
    SELECT COUNT(*) INTO v_intensidades_count FROM intensidades;
    SELECT COUNT(*) INTO v_ejercicios_count FROM ejercicios_detalles;
    SELECT COUNT(*) INTO v_periodos_count FROM periodos_asignados;
    
    RAISE NOTICE '=========================================';
    RAISE NOTICE 'DATOS CREADOS EXITOSAMENTE';
    RAISE NOTICE '=========================================';
    RAISE NOTICE 'Ejecuciones: %', v_ejecuciones_count;
    RAISE NOTICE 'Intensidades: %', v_intensidades_count;
    RAISE NOTICE 'Ejercicios: %', v_ejercicios_count;
    RAISE NOTICE 'Períodos: %', v_periodos_count;
    RAISE NOTICE '=========================================';
END $$;

-- =====================================================
-- PASO 5: MOSTRAR MUESTRA DE DATOS CREADOS
-- =====================================================

-- Muestra de intensidades creadas
SELECT 
    'INTENSIDADES CREADAS' as info,
    i.id,
    ed.nombre_ejercicio,
    i.nombre as intensidad,
    i.orden,
    i.reps,
    i.series,
    i.peso,
    i.descanso_segundos
FROM intensidades i
JOIN ejercicios_detalles ed ON ed.id = i.ejercicio_id
ORDER BY ed.nombre_ejercicio, i.orden
LIMIT 10;

-- Muestra de ejecuciones creadas
SELECT 
    'EJECUCIONES CREADAS' as info,
    ee.id,
    ed.nombre_ejercicio,
    ee.intensidad_aplicada,
    ee.completado,
    ee.fecha_ejecucion,
    ee.peso_usado,
    ee.repeticiones_realizadas,
    ee.series_completadas
FROM ejecuciones_ejercicio ee
JOIN ejercicios_detalles ed ON ed.id = ee.ejercicio_id
ORDER BY ee.created_at DESC
LIMIT 10;


































