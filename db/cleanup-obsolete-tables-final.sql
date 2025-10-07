-- =====================================================
-- LIMPIEZA FINAL DE TABLAS OBSOLETAS
-- =====================================================
-- Como los IDs no coinciden, eliminamos las tablas obsoletas

-- =====================================================
-- PASO 1: VERIFICAR ESTADO ANTES DE LIMPIAR
-- =====================================================

DO $$
DECLARE
    v_client_progress_count INTEGER := 0;
    v_intensity_levels_count INTEGER := 0;
    v_fitness_exercises_count INTEGER := 0;
    v_fitness_details_count INTEGER := 0;
    v_activity_calendar_count INTEGER := 0;
    v_customizations_count INTEGER := 0;
BEGIN
    RAISE NOTICE '=========================================';
    RAISE NOTICE 'ESTADO ANTES DE LIMPIEZA';
    RAISE NOTICE '=========================================';
    
    -- Verificar cada tabla obsoleta
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'client_exercise_progress') THEN
        SELECT COUNT(*) INTO v_client_progress_count FROM client_exercise_progress;
        RAISE NOTICE 'client_exercise_progress: % registros', v_client_progress_count;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'exercise_intensity_levels') THEN
        SELECT COUNT(*) INTO v_intensity_levels_count FROM exercise_intensity_levels;
        RAISE NOTICE 'exercise_intensity_levels: % registros', v_intensity_levels_count;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'fitness_exercises') THEN
        SELECT COUNT(*) INTO v_fitness_exercises_count FROM fitness_exercises;
        RAISE NOTICE 'fitness_exercises: % registros', v_fitness_exercises_count;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'fitness_program_details') THEN
        SELECT COUNT(*) INTO v_fitness_details_count FROM fitness_program_details;
        RAISE NOTICE 'fitness_program_details: % registros', v_fitness_details_count;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'activity_calendar') THEN
        SELECT COUNT(*) INTO v_activity_calendar_count FROM activity_calendar;
        RAISE NOTICE 'activity_calendar: % registros', v_activity_calendar_count;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'client_exercise_customizations') THEN
        SELECT COUNT(*) INTO v_customizations_count FROM client_exercise_customizations;
        RAISE NOTICE 'client_exercise_customizations: % registros', v_customizations_count;
    END IF;
    
    RAISE NOTICE '=========================================';
    RAISE NOTICE 'NOTA: Los datos en exercise_intensity_levels no se pueden migrar';
    RAISE NOTICE 'porque los IDs no coinciden con ejercicios_detalles';
    RAISE NOTICE 'Se crearán intensidades por defecto en su lugar';
    RAISE NOTICE '=========================================';
END $$;

-- =====================================================
-- PASO 2: ELIMINAR TRIGGERS Y FUNCIONES OBSOLETAS
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
DROP TRIGGER IF EXISTS trigger_update_fitness_exercises_updated_at ON fitness_exercises;
DROP TRIGGER IF EXISTS trigger_update_fitness_program_details_updated_at ON fitness_program_details;

-- Eliminar funciones obsoletas
DROP FUNCTION IF EXISTS generate_client_exercise_customizations();
DROP FUNCTION IF EXISTS generate_exercises_for_activity();
DROP FUNCTION IF EXISTS update_client_exercise_customizations_updated_at();
DROP FUNCTION IF EXISTS update_client_exercise_progress_updated_at();
DROP FUNCTION IF EXISTS update_exercise_intensity_levels_updated_at();
DROP FUNCTION IF EXISTS update_fitness_exercises_updated_at();
DROP FUNCTION IF EXISTS update_fitness_program_details_updated_at();

-- =====================================================
-- PASO 3: ELIMINAR TABLAS OBSOLETAS
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
-- PASO 4: VERIFICAR LIMPIEZA
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
-- PASO 5: MOSTRAR ESTADO FINAL
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

































