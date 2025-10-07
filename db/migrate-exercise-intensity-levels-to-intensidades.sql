-- =====================================================
-- MIGRACIÓN: exercise_intensity_levels → intensidades
-- =====================================================
-- Este script migra datos de exercise_intensity_levels a intensidades
-- con mejoras de nombre y orden

-- =====================================================
-- PASO 1: VERIFICAR EXISTENCIA DE TABLAS
-- =====================================================

DO $$
DECLARE
    v_exercise_intensity_levels_exists BOOLEAN;
    v_intensidades_exists BOOLEAN;
    v_ejercicios_detalles_exists BOOLEAN;
    v_count_intensity_levels INTEGER;
    v_count_intensidades INTEGER;
BEGIN
    -- Verificar existencia de tablas
    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'exercise_intensity_levels') INTO v_exercise_intensity_levels_exists;
    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'intensidades') INTO v_intensidades_exists;
    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ejercicios_detalles') INTO v_ejercicios_detalles_exists;
    
    RAISE NOTICE '=========================================';
    RAISE NOTICE 'VERIFICACIÓN DE TABLAS';
    RAISE NOTICE '=========================================';
    RAISE NOTICE 'exercise_intensity_levels existe: %', v_exercise_intensity_levels_exists;
    RAISE NOTICE 'intensidades existe: %', v_intensidades_exists;
    RAISE NOTICE 'ejercicios_detalles existe: %', v_ejercicios_detalles_exists;
    
    IF NOT v_intensidades_exists THEN
        RAISE EXCEPTION '❌ Tabla intensidades no existe. Debe crearse primero.';
    END IF;
    
    IF NOT v_ejercicios_detalles_exists THEN
        RAISE EXCEPTION '❌ Tabla ejercicios_detalles no existe. Debe crearse primero.';
    END IF;
    
    -- Contar registros existentes
    IF v_exercise_intensity_levels_exists THEN
        SELECT COUNT(*) INTO v_count_intensity_levels FROM exercise_intensity_levels;
        RAISE NOTICE 'Registros en exercise_intensity_levels: %', v_count_intensity_levels;
    ELSE
        v_count_intensity_levels := 0;
        RAISE NOTICE 'exercise_intensity_levels no existe - no hay datos que migrar';
    END IF;
    
    SELECT COUNT(*) INTO v_count_intensidades FROM intensidades;
    RAISE NOTICE 'Registros en intensidades: %', v_count_intensidades;
    
    RAISE NOTICE '=========================================';
END $$;

-- =====================================================
-- PASO 2: MIGRAR DATOS DE exercise_intensity_levels
-- =====================================================

DO $$
DECLARE
    v_migrated_count INTEGER := 0;
    v_error_count INTEGER := 0;
    v_record RECORD;
    v_ejercicio_id INTEGER;
    v_orden_counter INTEGER;
BEGIN
    -- Solo proceder si exercise_intensity_levels existe y tiene datos
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'exercise_intensity_levels') THEN
        
        RAISE NOTICE 'Iniciando migración de exercise_intensity_levels...';
        
        -- Migrar cada registro de exercise_intensity_levels
        FOR v_record IN 
            SELECT 
                eil.*,
                ed.id as ejercicio_id
            FROM exercise_intensity_levels eil
            LEFT JOIN ejercicios_detalles ed ON ed.nombre_ejercicio = eil.exercise_name
            WHERE ed.id IS NOT NULL
            ORDER BY eil.exercise_name, eil.level_order
        LOOP
            BEGIN
                -- Determinar el orden basado en level_order o crear uno secuencial
                v_orden_counter := COALESCE(v_record.level_order, 1);
                
                -- Mejorar el nombre de la intensidad
                DECLARE
                    v_nombre_mejorado TEXT;
                BEGIN
                    v_nombre_mejorado := CASE 
                        WHEN LOWER(v_record.level_name) LIKE '%beginner%' OR LOWER(v_record.level_name) LIKE '%principiante%' THEN 'Principiante'
                        WHEN LOWER(v_record.level_name) LIKE '%intermediate%' OR LOWER(v_record.level_name) LIKE '%intermedio%' THEN 'Intermedio'
                        WHEN LOWER(v_record.level_name) LIKE '%advanced%' OR LOWER(v_record.level_name) LIKE '%avanzado%' THEN 'Avanzado'
                        WHEN LOWER(v_record.level_name) LIKE '%expert%' OR LOWER(v_record.level_name) LIKE '%experto%' THEN 'Experto'
                        ELSE INITCAP(TRIM(v_record.level_name))
                    END;
                    
                    -- Insertar en intensidades
                    INSERT INTO intensidades (
                        ejercicio_id,
                        nombre,
                        orden,
                        reps,
                        series,
                        peso,
                        duracion_minutos,
                        descanso_segundos,
                        created_at,
                        updated_at,
                        created_by
                    ) VALUES (
                        v_record.ejercicio_id,
                        v_nombre_mejorado,
                        v_orden_counter,
                        v_record.recommended_reps,
                        v_record.recommended_sets,
                        v_record.recommended_weight,
                        v_record.duration_minutes,
                        v_record.rest_seconds,
                        v_record.created_at,
                        v_record.updated_at,
                        v_record.created_by
                    );
                    
                    v_migrated_count := v_migrated_count + 1;
                    
                EXCEPTION WHEN unique_violation THEN
                    -- Si ya existe una intensidad con el mismo nombre para este ejercicio, actualizar
                    UPDATE intensidades SET
                        orden = v_orden_counter,
                        reps = v_record.recommended_reps,
                        series = v_record.recommended_sets,
                        peso = v_record.recommended_weight,
                        duracion_minutos = v_record.duration_minutes,
                        descanso_segundos = v_record.rest_seconds,
                        updated_at = NOW()
                    WHERE ejercicio_id = v_record.ejercicio_id 
                    AND nombre = v_nombre_mejorado;
                    
                    v_migrated_count := v_migrated_count + 1;
                    RAISE NOTICE 'Actualizada intensidad existente: % para ejercicio %', v_nombre_mejorado, v_record.ejercicio_id;
                    
                END;
                
            EXCEPTION WHEN OTHERS THEN
                v_error_count := v_error_count + 1;
                RAISE WARNING 'Error migrando intensidad ID %: %', v_record.id, SQLERRM;
            END;
        END LOOP;
        
        RAISE NOTICE 'Migración completada:';
        RAISE NOTICE '  - Intensidades migradas: %', v_migrated_count;
        RAISE NOTICE '  - Errores: %', v_error_count;
        
    ELSE
        RAISE NOTICE 'exercise_intensity_levels no existe - saltando migración';
    END IF;
END $$;

-- =====================================================
-- PASO 3: CREAR INTENSIDADES POR DEFECTO SI NO EXISTEN
-- =====================================================

DO $$
DECLARE
    v_ejercicio RECORD;
    v_intensidades_count INTEGER;
BEGIN
    RAISE NOTICE 'Verificando ejercicios sin intensidades...';
    
    -- Para cada ejercicio que no tenga intensidades, crear las básicas
    FOR v_ejercicio IN 
        SELECT ed.id, ed.nombre_ejercicio
        FROM ejercicios_detalles ed
        WHERE NOT EXISTS (
            SELECT 1 FROM intensidades i WHERE i.ejercicio_id = ed.id
        )
    LOOP
        -- Crear intensidades básicas
        INSERT INTO intensidades (ejercicio_id, nombre, orden, reps, series, peso, duracion_minutos, descanso_segundos) VALUES
        (v_ejercicio.id, 'Principiante', 1, 8, 3, 0, NULL, 90),
        (v_ejercicio.id, 'Intermedio', 2, 12, 3, 0, NULL, 60),
        (v_ejercicio.id, 'Avanzado', 3, 15, 4, 0, NULL, 45);
        
        RAISE NOTICE 'Creadas intensidades por defecto para ejercicio: %', v_ejercicio.nombre_ejercicio;
    END LOOP;
    
    SELECT COUNT(*) INTO v_intensidades_count FROM intensidades;
    RAISE NOTICE 'Total de intensidades después de migración: %', v_intensidades_count;
END $$;

-- =====================================================
-- PASO 4: VERIFICAR MIGRACIÓN
-- =====================================================

DO $$
DECLARE
    v_total_intensidades INTEGER;
    v_intensidades_por_ejercicio INTEGER;
    v_ejercicios_sin_intensidades INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_total_intensidades FROM intensidades;
    
    SELECT COUNT(DISTINCT ejercicio_id) INTO v_intensidades_por_ejercicio FROM intensidades;
    
    SELECT COUNT(*) INTO v_ejercicios_sin_intensidades 
    FROM ejercicios_detalles ed 
    WHERE NOT EXISTS (SELECT 1 FROM intensidades i WHERE i.ejercicio_id = ed.id);
    
    RAISE NOTICE '=========================================';
    RAISE NOTICE 'VERIFICACIÓN POST-MIGRACIÓN';
    RAISE NOTICE '=========================================';
    RAISE NOTICE 'Total intensidades: %', v_total_intensidades;
    RAISE NOTICE 'Ejercicios con intensidades: %', v_intensidades_por_ejercicio;
    RAISE NOTICE 'Ejercicios sin intensidades: %', v_ejercicios_sin_intensidades;
    RAISE NOTICE '=========================================';
END $$;

-- =====================================================
-- PASO 5: MOSTRAR MUESTRA DE INTENSIDADES MIGRADAS
-- =====================================================

SELECT 
    'MUESTRA DE INTENSIDADES MIGRADAS' as info,
    i.id,
    ed.nombre_ejercicio,
    i.nombre as intensidad,
    i.orden,
    i.reps,
    i.series,
    i.peso,
    i.duracion_minutos,
    i.descanso_segundos
FROM intensidades i
JOIN ejercicios_detalles ed ON ed.id = i.ejercicio_id
ORDER BY ed.nombre_ejercicio, i.orden
LIMIT 15;


































