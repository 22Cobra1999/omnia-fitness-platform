-- =====================================================
-- MIGRACIÓN ESPECÍFICA: exercise_intensity_levels → intensidades
-- =====================================================

-- =====================================================
-- PASO 1: VERIFICAR DATOS A MIGRAR
-- =====================================================

DO $$
DECLARE
    v_intensity_levels_count INTEGER;
    v_intensidades_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_intensity_levels_count FROM exercise_intensity_levels;
    SELECT COUNT(*) INTO v_intensidades_count FROM intensidades;
    
    RAISE NOTICE '=========================================';
    RAISE NOTICE 'ESTADO ANTES DE MIGRACIÓN';
    RAISE NOTICE '=========================================';
    RAISE NOTICE 'exercise_intensity_levels: % registros', v_intensity_levels_count;
    RAISE NOTICE 'intensidades: % registros', v_intensidades_count;
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
BEGIN
    RAISE NOTICE 'Iniciando migración de exercise_intensity_levels → intensidades...';
    
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
            DECLARE
                v_orden_counter INTEGER;
                v_nombre_mejorado TEXT;
            BEGIN
                v_orden_counter := COALESCE(v_record.level_order, 1);
                
                -- Mejorar el nombre de la intensidad
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
    
    RAISE NOTICE 'Migración de intensidades completada:';
    RAISE NOTICE '  - Intensidades migradas: %', v_migrated_count;
    RAISE NOTICE '  - Errores: %', v_error_count;
END $$;

-- =====================================================
-- PASO 3: VERIFICAR MIGRACIÓN
-- =====================================================

DO $$
DECLARE
    v_intensity_levels_count INTEGER;
    v_intensidades_count INTEGER;
    v_ejercicios_con_intensidades INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_intensity_levels_count FROM exercise_intensity_levels;
    SELECT COUNT(*) INTO v_intensidades_count FROM intensidades;
    SELECT COUNT(DISTINCT ejercicio_id) INTO v_ejercicios_con_intensidades FROM intensidades;
    
    RAISE NOTICE '=========================================';
    RAISE NOTICE 'VERIFICACIÓN POST-MIGRACIÓN';
    RAISE NOTICE '=========================================';
    RAISE NOTICE 'exercise_intensity_levels: % registros', v_intensity_levels_count;
    RAISE NOTICE 'intensidades: % registros', v_intensidades_count;
    RAISE NOTICE 'Ejercicios con intensidades: %', v_ejercicios_con_intensidades;
    RAISE NOTICE '=========================================';
END $$;

-- =====================================================
-- PASO 4: MOSTRAR MUESTRA DE INTENSIDADES MIGRADAS
-- =====================================================

SELECT 
    'INTENSIDADES MIGRADAS' as info,
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

































