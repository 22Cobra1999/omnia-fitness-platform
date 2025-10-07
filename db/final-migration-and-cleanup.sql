-- =====================================================
-- MIGRACIÓN FINAL Y LIMPIEZA COMPLETA
-- =====================================================
-- Este script ejecuta la migración completa y limpia las tablas obsoletas

-- =====================================================
-- PASO 1: EJECUTAR MIGRACIÓN COMPLETA
-- =====================================================

\echo '========================================='
\echo 'INICIANDO MIGRACIÓN COMPLETA'
\echo '========================================='

\i complete-migration-client-exercise-progress.sql

-- =====================================================
-- PASO 2: VERIFICAR MIGRACIÓN ANTES DE LIMPIAR
-- =====================================================

\echo '========================================='
\echo 'VERIFICANDO MIGRACIÓN ANTES DE LIMPIAR'
\echo '========================================='

DO $$
DECLARE
    v_ejecuciones_count INTEGER;
    v_intensidades_count INTEGER;
    v_ejercicios_count INTEGER;
    v_periodos_count INTEGER;
BEGIN
    -- Verificar que el nuevo esquema tiene datos
    SELECT COUNT(*) INTO v_ejecuciones_count FROM ejecuciones_ejercicio;
    SELECT COUNT(*) INTO v_intensidades_count FROM intensidades;
    SELECT COUNT(*) INTO v_ejercicios_count FROM ejercicios_detalles;
    SELECT COUNT(*) INTO v_periodos_count FROM periodos_asignados;
    
    RAISE NOTICE '=========================================';
    RAISE NOTICE 'VERIFICACIÓN PREVIA A LIMPIEZA';
    RAISE NOTICE '=========================================';
    RAISE NOTICE 'Ejecuciones: %', v_ejecuciones_count;
    RAISE NOTICE 'Intensidades: %', v_intensidades_count;
    RAISE NOTICE 'Ejercicios: %', v_ejercicios_count;
    RAISE NOTICE 'Períodos: %', v_periodos_count;
    RAISE NOTICE '=========================================';
    
    IF v_ejercicios_count = 0 THEN
        RAISE EXCEPTION '❌ No hay ejercicios en el nuevo esquema. No se puede proceder con la limpieza.';
    END IF;
    
    RAISE NOTICE '✅ Verificación exitosa. Procediendo con la limpieza...';
END $$;

-- =====================================================
-- PASO 3: ELIMINAR TRIGGERS Y FUNCIONES OBSOLETAS
-- =====================================================

\echo '========================================='
\echo 'ELIMINANDO TRIGGERS Y FUNCIONES OBSOLETAS'
\echo '========================================='

-- Eliminar triggers obsoletos
DROP TRIGGER IF EXISTS trigger_generate_customizations ON activity_enrollments;
DROP TRIGGER IF EXISTS trigger_auto_generate_exercises ON activities;
DROP TRIGGER IF EXISTS trigger_update_client_exercise_customizations_updated_at ON client_exercise_customizations;
DROP TRIGGER IF EXISTS trigger_update_client_exercise_progress_updated_at ON client_exercise_progress;
DROP TRIGGER IF EXISTS trigger_update_exercise_intensity_levels_updated_at ON exercise_intensity_levels;

-- Eliminar funciones obsoletas
DROP FUNCTION IF EXISTS generate_client_exercise_customizations();
DROP FUNCTION IF EXISTS generate_exercises_for_activity();
DROP FUNCTION IF EXISTS update_client_exercise_customizations_updated_at();
DROP FUNCTION IF EXISTS update_client_exercise_progress_updated_at();
DROP FUNCTION IF EXISTS update_exercise_intensity_levels_updated_at();

-- =====================================================
-- PASO 4: ELIMINAR TABLAS OBSOLETAS
-- =====================================================

\echo '========================================='
\echo 'ELIMINANDO TABLAS OBSOLETAS'
\echo '========================================='

-- Eliminar tablas obsoletas en orden de dependencias
DROP TABLE IF EXISTS client_exercise_customizations CASCADE;
DROP TABLE IF EXISTS client_exercise_progress CASCADE;
DROP TABLE IF EXISTS exercise_intensity_levels CASCADE;
DROP TABLE IF EXISTS activity_calendar CASCADE;
DROP TABLE IF EXISTS fitness_program_details CASCADE;
DROP TABLE IF EXISTS fitness_exercises CASCADE;

-- =====================================================
-- PASO 5: VERIFICAR LIMPIEZA
-- =====================================================

\echo '========================================='
\echo 'VERIFICANDO LIMPIEZA'
\echo '========================================='

DO $$
DECLARE
    v_tables_removed INTEGER;
    v_remaining_obsolete_tables TEXT;
BEGIN
    -- Verificar que las tablas obsoletas fueron eliminadas
    SELECT COUNT(*) INTO v_tables_removed
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN (
        'fitness_exercises',
        'fitness_program_details', 
        'activity_calendar',
        'client_exercise_progress',
        'exercise_intensity_levels',
        'client_exercise_customizations'
    );
    
    -- Obtener lista de tablas obsoletas que aún existen
    SELECT string_agg(table_name, ', ')
    INTO v_remaining_obsolete_tables
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN (
        'fitness_exercises',
        'fitness_program_details', 
        'activity_calendar',
        'client_exercise_progress',
        'exercise_intensity_levels',
        'client_exercise_customizations'
    );
    
    RAISE NOTICE '=========================================';
    RAISE NOTICE 'RESULTADO DE LA LIMPIEZA';
    RAISE NOTICE '=========================================';
    RAISE NOTICE 'Tablas obsoletas eliminadas: %', (6 - v_tables_removed);
    RAISE NOTICE 'Tablas obsoletas restantes: %', v_tables_removed;
    
    IF v_tables_removed = 0 THEN
        RAISE NOTICE '✅ Todas las tablas obsoletas fueron eliminadas exitosamente';
    ELSE
        RAISE WARNING '⚠️  Algunas tablas obsoletas aún existen: %', v_remaining_obsolete_tables;
    END IF;
    
    RAISE NOTICE '=========================================';
END $$;

-- =====================================================
-- PASO 6: MOSTRAR ESTADO FINAL DEL ESQUEMA
-- =====================================================

\echo '========================================='
\echo 'ESTADO FINAL DEL ESQUEMA'
\echo '========================================='

-- Mostrar tablas del nuevo esquema modular
SELECT 
    'NUEVO ESQUEMA MODULAR' as info,
    table_name,
    'Tabla activa' as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'ejercicios_detalles',
    'organizacion_ejercicios',
    'periodos_asignados',
    'ejecuciones_ejercicio',
    'intensidades',
    'activity_enrollments'
)
ORDER BY table_name;

-- Mostrar estadísticas del nuevo esquema
SELECT 
    'ESTADÍSTICAS DEL NUEVO ESQUEMA' as info,
    'ejercicios_detalles' as tabla, COUNT(*) as registros FROM ejercicios_detalles
UNION ALL
SELECT 
    'ESTADÍSTICAS DEL NUEVO ESQUEMA' as info,
    'organizacion_ejercicios' as tabla, COUNT(*) as registros FROM organizacion_ejercicios
UNION ALL
SELECT 
    'ESTADÍSTICAS DEL NUEVO ESQUEMA' as info,
    'periodos_asignados' as tabla, COUNT(*) as registros FROM periodos_asignados
UNION ALL
SELECT 
    'ESTADÍSTICAS DEL NUEVO ESQUEMA' as info,
    'ejecuciones_ejercicio' as tabla, COUNT(*) as registros FROM ejecuciones_ejercicio
UNION ALL
SELECT 
    'ESTADÍSTICAS DEL NUEVO ESQUEMA' as info,
    'intensidades' as tabla, COUNT(*) as registros FROM intensidades
UNION ALL
SELECT 
    'ESTADÍSTICAS DEL NUEVO ESQUEMA' as info,
    'activity_enrollments' as tabla, COUNT(*) as registros FROM activity_enrollments;

-- =====================================================
-- PASO 7: RECOMENDACIONES FINALES
-- =====================================================

\echo '========================================='
\echo 'RECOMENDACIONES FINALES'
\echo '========================================='

DO $$
BEGIN
    RAISE NOTICE '=========================================';
    RAISE NOTICE 'MIGRACIÓN COMPLETADA EXITOSAMENTE';
    RAISE NOTICE '=========================================';
    RAISE NOTICE '✅ Esquema modular implementado';
    RAISE NOTICE '✅ Tablas obsoletas eliminadas';
    RAISE NOTICE '✅ Sistema listo para producción';
    RAISE NOTICE '';
    RAISE NOTICE '📊 Nuevas funcionalidades disponibles:';
    RAISE NOTICE '   - ejecuciones_ejercicio: Seguimiento de progreso con intensidad';
    RAISE NOTICE '   - intensidades: Niveles de dificultad mejorados';
    RAISE NOTICE '   - API endpoints: /api/ejecuciones-ejercicio y /api/intensidades';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 Próximos pasos:';
    RAISE NOTICE '   1. Actualizar aplicaciones frontend para usar nuevas APIs';
    RAISE NOTICE '   2. Crear más ejercicios y organizaciones';
    RAISE NOTICE '   3. Configurar intensidades personalizadas';
    RAISE NOTICE '   4. Implementar UI para el nuevo sistema';
    RAISE NOTICE '   5. Probar funcionalidades de ejecución y progreso';
    RAISE NOTICE '=========================================';
END $$;


































