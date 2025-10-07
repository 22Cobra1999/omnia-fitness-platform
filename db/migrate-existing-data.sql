-- =====================================================
-- MIGRAR DATOS EXISTENTES DE TABLAS OBSOLETAS
-- =====================================================
-- Este script migra los datos existentes antes de limpiar las tablas obsoletas

-- =====================================================
-- PASO 1: MIGRAR DATOS DE exercise_intensity_levels → intensidades
-- =====================================================

DO $$
DECLARE
    v_migrated_count INTEGER := 0;
    v_error_count INTEGER := 0;
    v_record RECORD;
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
                        updated_at
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
                        v_record.updated_at
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
        
    ELSE
        RAISE NOTICE 'exercise_intensity_levels no existe - saltando migración de intensidades';
    END IF;
END $$;

-- =====================================================
-- PASO 2: MIGRAR DATOS DE client_exercise_progress → ejecuciones_ejercicio
-- =====================================================

DO $$
DECLARE
    v_migrated_count INTEGER := 0;
    v_error_count INTEGER := 0;
    v_record RECORD;
BEGIN
    -- Solo proceder si client_exercise_progress existe y tiene datos
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'client_exercise_progress') THEN
        
        RAISE NOTICE 'Iniciando migración de client_exercise_progress...';
        
        -- Migrar cada registro de client_exercise_progress
        FOR v_record IN 
            SELECT 
                cep.*,
                ed.id as ejercicio_id,
                pa.id as periodo_id
            FROM client_exercise_progress cep
            LEFT JOIN ejercicios_detalles ed ON ed.nombre_ejercicio = cep.exercise_title
            LEFT JOIN periodos_asignados pa ON pa.enrollment_id IN (
                SELECT ae.id FROM activity_enrollments ae 
                WHERE ae.activity_id = ed.activity_id 
                AND ae.client_id = cep.client_id
            )
            WHERE ed.id IS NOT NULL AND pa.id IS NOT NULL
        LOOP
            BEGIN
                -- Insertar en ejecuciones_ejercicio
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
                    nota_cliente,
                    created_at,
                    updated_at,
                    completed_at
                ) VALUES (
                    v_record.periodo_id,
                    v_record.ejercicio_id,
                    COALESCE(v_record.intensity_level, 'Intermedio'), -- Usar intensidad o default
                    v_record.duration_minutes,
                    v_record.calories_burned,
                    COALESCE(v_record.completed_at::DATE, CURRENT_DATE),
                    COALESCE(v_record.completed, false),
                    v_record.weight_used,
                    v_record.repetitions_completed,
                    v_record.sets_completed,
                    v_record.actual_duration_seconds,
                    v_record.client_notes,
                    v_record.created_at,
                    v_record.updated_at,
                    v_record.completed_at
                );
                
                v_migrated_count := v_migrated_count + 1;
                
            EXCEPTION WHEN OTHERS THEN
                v_error_count := v_error_count + 1;
                RAISE WARNING 'Error migrando registro ID %: %', v_record.id, SQLERRM;
            END;
        END LOOP;
        
        RAISE NOTICE 'Migración de progreso completada:';
        RAISE NOTICE '  - Registros migrados: %', v_migrated_count;
        RAISE NOTICE '  - Errores: %', v_error_count;
        
    ELSE
        RAISE NOTICE 'client_exercise_progress no existe - saltando migración de progreso';
    END IF;
END $$;

-- =====================================================
-- PASO 3: MIGRAR DATOS DE fitness_exercises → ejercicios_detalles
-- =====================================================

DO $$
DECLARE
    v_migrated_count INTEGER := 0;
    v_error_count INTEGER := 0;
    v_record RECORD;
BEGIN
    -- Solo proceder si fitness_exercises existe y tiene datos
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'fitness_exercises') THEN
        
        RAISE NOTICE 'Iniciando migración de fitness_exercises...';
        
        -- Migrar cada registro de fitness_exercises
        FOR v_record IN 
            SELECT 
                fe.*,
                ed.id as ejercicio_id
            FROM fitness_exercises fe
            LEFT JOIN ejercicios_detalles ed ON ed.nombre_ejercicio = fe.nombre_actividad
            WHERE ed.id IS NOT NULL
        LOOP
            BEGIN
                -- Insertar en organizacion_ejercicios si no existe
                INSERT INTO organizacion_ejercicios (
                    activity_id,
                    ejercicio_id,
                    bloque,
                    dia,
                    semana,
                    numero_periodo
                ) VALUES (
                    v_record.activity_id,
                    v_record.ejercicio_id,
                    COALESCE(v_record.bloque::TEXT, '1'),
                    COALESCE(v_record.día, 1),
                    COALESCE(v_record.semana, 1),
                    COALESCE(v_record.bloque, 1)
                )
                ON CONFLICT (activity_id, ejercicio_id, bloque) DO NOTHING;
                
                v_migrated_count := v_migrated_count + 1;
                
            EXCEPTION WHEN OTHERS THEN
                v_error_count := v_error_count + 1;
                RAISE WARNING 'Error migrando fitness_exercise ID %: %', v_record.id, SQLERRM;
            END;
        END LOOP;
        
        RAISE NOTICE 'Migración de fitness_exercises completada:';
        RAISE NOTICE '  - Registros migrados: %', v_migrated_count;
        RAISE NOTICE '  - Errores: %', v_error_count;
        
    ELSE
        RAISE NOTICE 'fitness_exercises no existe - saltando migración de fitness_exercises';
    END IF;
END $$;

-- =====================================================
-- PASO 4: VERIFICAR MIGRACIÓN
-- =====================================================

DO $$
DECLARE
    v_total_ejecuciones INTEGER;
    v_total_intensidades INTEGER;
    v_ejecuciones_con_intensidad INTEGER;
    v_ejercicios_con_intensidades INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_total_ejecuciones FROM ejecuciones_ejercicio;
    SELECT COUNT(*) INTO v_total_intensidades FROM intensidades;
    SELECT COUNT(*) INTO v_ejecuciones_con_intensidad FROM ejecuciones_ejercicio WHERE intensidad_aplicada IS NOT NULL;
    SELECT COUNT(DISTINCT ejercicio_id) INTO v_ejercicios_con_intensidades FROM intensidades;
    
    RAISE NOTICE '=========================================';
    RAISE NOTICE 'VERIFICACIÓN POST-MIGRACIÓN';
    RAISE NOTICE '=========================================';
    RAISE NOTICE 'Total ejecuciones: %', v_total_ejecuciones;
    RAISE NOTICE 'Total intensidades: %', v_total_intensidades;
    RAISE NOTICE 'Ejecuciones con intensidad: %', v_ejecuciones_con_intensidad;
    RAISE NOTICE 'Ejercicios con intensidades: %', v_ejercicios_con_intensidades;
    RAISE NOTICE '=========================================';
END $$;

































