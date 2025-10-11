-- =====================================================
-- MIGRACIÓN COMPLETA: client_exercise_progress + exercise_intensity_levels
-- =====================================================
-- Este script ejecuta la migración completa de las tablas obsoletas
-- a las nuevas tablas del esquema modular

-- =====================================================
-- PASO 1: EJECUTAR MIGRACIÓN DE INTENSIDADES PRIMERO
-- =====================================================

\echo 'Paso 1: Migrando exercise_intensity_levels → intensidades...'
\i migrate-exercise-intensity-levels-to-intensidades.sql

-- =====================================================
-- PASO 2: EJECUTAR MIGRACIÓN DE PROGRESO
-- =====================================================

\echo 'Paso 2: Migrando client_exercise_progress → ejecuciones_ejercicio...'
\i migrate-client-exercise-progress-to-ejecuciones.sql

-- =====================================================
-- PASO 3: VERIFICACIÓN FINAL
-- =====================================================

\echo 'Paso 3: Verificación final...'

DO $$
DECLARE
    v_total_ejecuciones INTEGER;
    v_total_intensidades INTEGER;
    v_ejecuciones_con_intensidad INTEGER;
    v_ejercicios_con_intensidades INTEGER;
BEGIN
    -- Contar registros en nuevas tablas
    SELECT COUNT(*) INTO v_total_ejecuciones FROM ejecuciones_ejercicio;
    SELECT COUNT(*) INTO v_total_intensidades FROM intensidades;
    SELECT COUNT(*) INTO v_ejecuciones_con_intensidad FROM ejecuciones_ejercicio WHERE intensidad_aplicada IS NOT NULL;
    SELECT COUNT(DISTINCT ejercicio_id) INTO v_ejercicios_con_intensidades FROM intensidades;
    
    RAISE NOTICE '=========================================';
    RAISE NOTICE 'MIGRACIÓN COMPLETADA';
    RAISE NOTICE '=========================================';
    RAISE NOTICE 'Total ejecuciones: %', v_total_ejecuciones;
    RAISE NOTICE 'Total intensidades: %', v_total_intensidades;
    RAISE NOTICE 'Ejecuciones con intensidad: %', v_ejecuciones_con_intensidad;
    RAISE NOTICE 'Ejercicios con intensidades: %', v_ejercicios_con_intensidades;
    RAISE NOTICE '=========================================';
    
    IF v_total_ejecuciones > 0 AND v_total_intensidades > 0 THEN
        RAISE NOTICE '✅ Migración exitosa - Sistema listo para usar';
    ELSE
        RAISE WARNING '⚠️  Migración completada pero sin datos - Verificar configuración';
    END IF;
END $$;

-- =====================================================
-- PASO 4: MOSTRAR ESTADÍSTICAS FINALES
-- =====================================================

SELECT 
    'ESTADÍSTICAS FINALES' as info,
    'ejecuciones_ejercicio' as tabla, 
    COUNT(*) as registros,
    COUNT(CASE WHEN completado THEN 1 END) as completadas,
    COUNT(CASE WHEN intensidad_aplicada IS NOT NULL THEN 1 END) as con_intensidad
FROM ejecuciones_ejercicio

UNION ALL

SELECT 
    'ESTADÍSTICAS FINALES' as info,
    'intensidades' as tabla, 
    COUNT(*) as registros,
    COUNT(DISTINCT ejercicio_id) as ejercicios_unicos,
    COUNT(CASE WHEN nombre IN ('Principiante', 'Intermedio', 'Avanzado') THEN 1 END) as niveles_estandar
FROM intensidades;









































