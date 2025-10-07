-- =====================================================
-- DEBUG: DIAGNOSTICAR PROBLEMA DE MIGRACIÓN DE INTENSIDADES
-- =====================================================

-- =====================================================
-- PASO 1: VERIFICAR SI LOS fitness_exercise_id EXISTEN EN ejercicios_detalles
-- =====================================================

SELECT 
    'VERIFICACIÓN DE EJERCICIOS' as info,
    eil.fitness_exercise_id,
    ed.id as ejercicio_detalle_id,
    ed.nombre_ejercicio,
    CASE 
        WHEN ed.id IS NOT NULL THEN '✅ EXISTE'
        ELSE '❌ NO EXISTE'
    END as estado
FROM exercise_intensity_levels eil
LEFT JOIN ejercicios_detalles ed ON ed.id = eil.fitness_exercise_id
ORDER BY eil.fitness_exercise_id
LIMIT 20;

-- =====================================================
-- PASO 2: CONTAR CUÁNTOS EJERCICIOS EXISTEN
-- =====================================================

DO $$
DECLARE
    v_total_intensities INTEGER;
    v_exercicios_existentes INTEGER;
    v_ejercicios_inexistentes INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_total_intensities FROM exercise_intensity_levels;
    
    SELECT COUNT(*) INTO v_exercicios_existentes
    FROM exercise_intensity_levels eil
    JOIN ejercicios_detalles ed ON ed.id = eil.fitness_exercise_id;
    
    SELECT COUNT(*) INTO v_ejercicios_inexistentes
    FROM exercise_intensity_levels eil
    LEFT JOIN ejercicios_detalles ed ON ed.id = eil.fitness_exercise_id
    WHERE ed.id IS NULL;
    
    RAISE NOTICE '=========================================';
    RAISE NOTICE 'DIAGNÓSTICO DE EJERCICIOS';
    RAISE NOTICE '=========================================';
    RAISE NOTICE 'Total intensidades: %', v_total_intensities;
    RAISE NOTICE 'Ejercicios existentes: %', v_exercicios_existentes;
    RAISE NOTICE 'Ejercicios inexistentes: %', v_ejercicios_inexistentes;
    RAISE NOTICE '=========================================';
END $$;

-- =====================================================
-- PASO 3: MOSTRAR EJERCICIOS QUE NO EXISTEN
-- =====================================================

SELECT 
    'EJERCICIOS INEXISTENTES' as info,
    eil.fitness_exercise_id,
    eil.level_name,
    eil.detalle_series
FROM exercise_intensity_levels eil
LEFT JOIN ejercicios_detalles ed ON ed.id = eil.fitness_exercise_id
WHERE ed.id IS NULL
ORDER BY eil.fitness_exercise_id;

-- =====================================================
-- PASO 4: MOSTRAR EJERCICIOS QUE SÍ EXISTEN
-- =====================================================

SELECT 
    'EJERCICIOS EXISTENTES' as info,
    eil.fitness_exercise_id,
    ed.nombre_ejercicio,
    eil.level_name,
    eil.detalle_series
FROM exercise_intensity_levels eil
JOIN ejercicios_detalles ed ON ed.id = eil.fitness_exercise_id
ORDER BY eil.fitness_exercise_id
LIMIT 10;

-- =====================================================
-- PASO 5: VERIFICAR RANGO DE IDs EN ejercicios_detalles
-- =====================================================

SELECT 
    'RANGO DE IDs EN ejercicios_detalles' as info,
    MIN(id) as min_id,
    MAX(id) as max_id,
    COUNT(*) as total_ejercicios
FROM ejercicios_detalles;

-- =====================================================
-- PASO 6: VERIFICAR RANGO DE IDs EN exercise_intensity_levels
-- =====================================================

SELECT 
    'RANGO DE IDs EN exercise_intensity_levels' as info,
    MIN(fitness_exercise_id) as min_fitness_exercise_id,
    MAX(fitness_exercise_id) as max_fitness_exercise_id,
    COUNT(DISTINCT fitness_exercise_id) as ejercicios_unicos
FROM exercise_intensity_levels;

































