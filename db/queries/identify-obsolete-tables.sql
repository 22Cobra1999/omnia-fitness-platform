-- =====================================================
-- IDENTIFICAR TABLAS OBSOLETAS Y MIGRAR fitness_exercises
-- =====================================================

-- =====================================================
-- PASO 1: VERIFICAR QUÉ TABLAS EXISTEN
-- =====================================================

SELECT 
    'TABLAS EXISTENTES' as info,
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'fitness_exercises',
    'fitness_program_details', 
    'activity_calendar',
    'client_exercise_progress',
    'exercise_intensity_levels',
    'client_exercise_customizations',
    'ejercicios_detalles',
    'organizacion_ejercicios',
    'periodos_asignados',
    'ejecuciones_ejercicio',
    'intensidades'
)
ORDER BY table_name;

-- =====================================================
-- PASO 2: VERIFICAR ESTRUCTURA DE fitness_exercises SI EXISTE
-- =====================================================

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'fitness_exercises') THEN
        RAISE NOTICE 'fitness_exercises existe - mostrando estructura:';
        
        -- Mostrar estructura
        PERFORM 1;
    ELSE
        RAISE NOTICE 'fitness_exercises NO existe';
    END IF;
END $$;

-- Mostrar estructura de fitness_exercises si existe
SELECT 
    'fitness_exercises structure' as info,
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'fitness_exercises' 
ORDER BY ordinal_position;

-- =====================================================
-- PASO 3: VERIFICAR DATOS EN fitness_exercises SI EXISTE
-- =====================================================

SELECT 
    'fitness_exercises sample data' as info,
    COUNT(*) as total_rows
FROM fitness_exercises;

-- Mostrar muestra de datos
SELECT 
    'fitness_exercises sample' as info,
    id,
    activity_id,
    client_id,
    coach_id,
    semana,
    mes,
    día,
    bloque,
    nombre_actividad,
    tipo_ejercicio
FROM fitness_exercises 
LIMIT 5;

-- =====================================================
-- PASO 4: IDENTIFICAR TABLAS OBSOLETAS
-- =====================================================

DO $$
DECLARE
    v_fitness_exercises_exists BOOLEAN;
    v_fitness_program_details_exists BOOLEAN;
    v_activity_calendar_exists BOOLEAN;
    v_client_exercise_progress_exists BOOLEAN;
    v_exercise_intensity_levels_exists BOOLEAN;
    v_client_exercise_customizations_exists BOOLEAN;
BEGIN
    -- Verificar existencia de tablas
    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'fitness_exercises') INTO v_fitness_exercises_exists;
    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'fitness_program_details') INTO v_fitness_program_details_exists;
    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'activity_calendar') INTO v_activity_calendar_exists;
    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'client_exercise_progress') INTO v_client_exercise_progress_exists;
    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'exercise_intensity_levels') INTO v_exercise_intensity_levels_exists;
    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'client_exercise_customizations') INTO v_client_exercise_customizations_exists;
    
    RAISE NOTICE '=========================================';
    RAISE NOTICE 'ANÁLISIS DE TABLAS OBSOLETAS';
    RAISE NOTICE '=========================================';
    RAISE NOTICE 'fitness_exercises: %', v_fitness_exercises_exists;
    RAISE NOTICE 'fitness_program_details: %', v_fitness_program_details_exists;
    RAISE NOTICE 'activity_calendar: %', v_activity_calendar_exists;
    RAISE NOTICE 'client_exercise_progress: %', v_client_exercise_progress_exists;
    RAISE NOTICE 'exercise_intensity_levels: %', v_exercise_intensity_levels_exists;
    RAISE NOTICE 'client_exercise_customizations: %', v_client_exercise_customizations_exists;
    RAISE NOTICE '=========================================';
    
    -- Recomendaciones
    IF v_fitness_exercises_exists THEN
        RAISE NOTICE '✅ fitness_exercises: MIGRAR a ejercicios_detalles + organizacion_ejercicios';
    END IF;
    
    IF v_fitness_program_details_exists THEN
        RAISE NOTICE '✅ fitness_program_details: MIGRAR a ejercicios_detalles + organizacion_ejercicios';
    END IF;
    
    IF v_activity_calendar_exists THEN
        RAISE NOTICE '✅ activity_calendar: REEMPLAZADO por periodos_asignados + ejecuciones_ejercicio';
    END IF;
    
    IF v_client_exercise_progress_exists THEN
        RAISE NOTICE '✅ client_exercise_progress: REEMPLAZADO por ejecuciones_ejercicio';
    END IF;
    
    IF v_exercise_intensity_levels_exists THEN
        RAISE NOTICE '✅ exercise_intensity_levels: REEMPLAZADO por intensidades';
    END IF;
    
    IF v_client_exercise_customizations_exists THEN
        RAISE NOTICE '✅ client_exercise_customizations: REEMPLAZADO por ejecuciones_ejercicio';
    END IF;
    
    RAISE NOTICE '=========================================';
    RAISE NOTICE 'TABLAS QUE SE PUEDEN ELIMINAR DESPUÉS DE MIGRAR:';
    RAISE NOTICE '- fitness_exercises';
    RAISE NOTICE '- fitness_program_details';
    RAISE NOTICE '- activity_calendar';
    RAISE NOTICE '- client_exercise_progress';
    RAISE NOTICE '- exercise_intensity_levels';
    RAISE NOTICE '- client_exercise_customizations';
    RAISE NOTICE '=========================================';
END $$;
