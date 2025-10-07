-- =====================================================
-- VERIFICACIÓN DETALLADA DE DATOS EN TABLAS OBSOLETAS
-- =====================================================
-- Este script verifica exactamente qué datos hay en cada tabla obsoleta

-- =====================================================
-- PASO 1: VERIFICAR EXISTENCIA Y CONTAR REGISTROS
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
    RAISE NOTICE 'VERIFICACIÓN DETALLADA DE DATOS';
    RAISE NOTICE '=========================================';
    
    -- Verificar client_exercise_progress
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'client_exercise_progress') THEN
        SELECT COUNT(*) INTO v_client_progress_count FROM client_exercise_progress;
        RAISE NOTICE 'client_exercise_progress: % registros', v_client_progress_count;
        
        -- Mostrar muestra de datos si hay registros
        IF v_client_progress_count > 0 THEN
            RAISE NOTICE 'Muestra de client_exercise_progress:';
            FOR rec IN SELECT id, fitness_exercise_id, client_id, intensity_level_id, completed FROM client_exercise_progress LIMIT 5 LOOP
                RAISE NOTICE '  ID: %, Exercise: %, Client: %, Intensity: %, Completed: %', 
                    rec.id, rec.fitness_exercise_id, rec.client_id, rec.intensity_level_id, rec.completed;
            END LOOP;
        END IF;
    ELSE
        RAISE NOTICE 'client_exercise_progress: TABLA NO EXISTE';
    END IF;
    
    -- Verificar exercise_intensity_levels
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'exercise_intensity_levels') THEN
        SELECT COUNT(*) INTO v_intensity_levels_count FROM exercise_intensity_levels;
        RAISE NOTICE 'exercise_intensity_levels: % registros', v_intensity_levels_count;
        
        -- Mostrar muestra de datos si hay registros
        IF v_intensity_levels_count > 0 THEN
            RAISE NOTICE 'Muestra de exercise_intensity_levels:';
            FOR rec IN SELECT id, fitness_exercise_id, level_name, detalle_series, duracion_min FROM exercise_intensity_levels LIMIT 5 LOOP
                RAISE NOTICE '  ID: %, Exercise: %, Level: %, Series: %, Duration: %', 
                    rec.id, rec.fitness_exercise_id, rec.level_name, rec.detalle_series, rec.duracion_min;
            END LOOP;
        END IF;
    ELSE
        RAISE NOTICE 'exercise_intensity_levels: TABLA NO EXISTE';
    END IF;
    
    -- Verificar fitness_exercises
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'fitness_exercises') THEN
        SELECT COUNT(*) INTO v_fitness_exercises_count FROM fitness_exercises;
        RAISE NOTICE 'fitness_exercises: % registros', v_fitness_exercises_count;
        
        -- Mostrar muestra de datos si hay registros
        IF v_fitness_exercises_count > 0 THEN
            RAISE NOTICE 'Muestra de fitness_exercises:';
            FOR rec IN SELECT id, activity_id, client_id, nombre_actividad, tipo_ejercicio FROM fitness_exercises LIMIT 5 LOOP
                RAISE NOTICE '  ID: %, Activity: %, Client: %, Nombre: %, Tipo: %', 
                    rec.id, rec.activity_id, rec.client_id, rec.nombre_actividad, rec.tipo_ejercicio;
            END LOOP;
        END IF;
    ELSE
        RAISE NOTICE 'fitness_exercises: TABLA NO EXISTE';
    END IF;
    
    -- Verificar fitness_program_details
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'fitness_program_details') THEN
        SELECT COUNT(*) INTO v_fitness_details_count FROM fitness_program_details;
        RAISE NOTICE 'fitness_program_details: % registros', v_fitness_details_count;
        
        -- Mostrar muestra de datos si hay registros
        IF v_fitness_details_count > 0 THEN
            RAISE NOTICE 'Muestra de fitness_program_details:';
            FOR rec IN SELECT id, activity_id, nombre_actividad, tipo_ejercicio, client_id FROM fitness_program_details LIMIT 5 LOOP
                RAISE NOTICE '  ID: %, Activity: %, Nombre: %, Tipo: %, Client: %', 
                    rec.id, rec.activity_id, rec.nombre_actividad, rec.tipo_ejercicio, rec.client_id;
            END LOOP;
        END IF;
    ELSE
        RAISE NOTICE 'fitness_program_details: TABLA NO EXISTE';
    END IF;
    
    -- Verificar activity_calendar
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'activity_calendar') THEN
        SELECT COUNT(*) INTO v_activity_calendar_count FROM activity_calendar;
        RAISE NOTICE 'activity_calendar: % registros', v_activity_calendar_count;
    ELSE
        RAISE NOTICE 'activity_calendar: TABLA NO EXISTE';
    END IF;
    
    -- Verificar client_exercise_customizations
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'client_exercise_customizations') THEN
        SELECT COUNT(*) INTO v_customizations_count FROM client_exercise_customizations;
        RAISE NOTICE 'client_exercise_customizations: % registros', v_customizations_count;
    ELSE
        RAISE NOTICE 'client_exercise_customizations: TABLA NO EXISTE';
    END IF;
    
    RAISE NOTICE '=========================================';
    RAISE NOTICE 'RESUMEN TOTAL:';
    RAISE NOTICE 'client_exercise_progress: %', v_client_progress_count;
    RAISE NOTICE 'exercise_intensity_levels: %', v_intensity_levels_count;
    RAISE NOTICE 'fitness_exercises: %', v_fitness_exercises_count;
    RAISE NOTICE 'fitness_program_details: %', v_fitness_details_count;
    RAISE NOTICE 'activity_calendar: %', v_activity_calendar_count;
    RAISE NOTICE 'client_exercise_customizations: %', v_customizations_count;
    RAISE NOTICE '=========================================';
    
    -- Determinar si hay datos que migrar
    IF v_client_progress_count > 0 OR v_intensity_levels_count > 0 OR 
       v_fitness_exercises_count > 0 OR v_fitness_details_count > 0 OR
       v_activity_calendar_count > 0 OR v_customizations_count > 0 THEN
        RAISE NOTICE '⚠️  HAY DATOS QUE NECESITAN SER MIGRADOS ANTES DE LIMPIAR';
        RAISE NOTICE '   Ejecutar scripts de migración primero';
    ELSE
        RAISE NOTICE '✅ TODAS LAS TABLAS OBSOLETAS ESTÁN VACÍAS - Se puede proceder con la limpieza';
    END IF;
END $$;

-- =====================================================
-- PASO 2: VERIFICAR ESTRUCTURA DE TABLAS OBSOLETAS
-- =====================================================

-- Mostrar estructura de client_exercise_progress si existe
SELECT 
    'client_exercise_progress structure' as info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'client_exercise_progress' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Mostrar estructura de exercise_intensity_levels si existe
SELECT 
    'exercise_intensity_levels structure' as info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'exercise_intensity_levels' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Mostrar estructura de fitness_exercises si existe
SELECT 
    'fitness_exercises structure' as info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'fitness_exercises' 
AND table_schema = 'public'
ORDER BY ordinal_position;

































