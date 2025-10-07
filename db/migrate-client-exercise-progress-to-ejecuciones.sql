-- =====================================================
-- MIGRACIÓN: client_exercise_progress → ejecuciones_ejercicio
-- =====================================================
-- Este script migra datos de client_exercise_progress a ejecuciones_ejercicio
-- con intensidad aplicada

-- =====================================================
-- PASO 1: VERIFICAR EXISTENCIA DE TABLAS
-- =====================================================

DO $$
DECLARE
    v_client_exercise_progress_exists BOOLEAN;
    v_ejecuciones_ejercicio_exists BOOLEAN;
    v_intensidades_exists BOOLEAN;
    v_count_client_progress INTEGER;
    v_count_ejecuciones INTEGER;
BEGIN
    -- Verificar existencia de tablas
    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'client_exercise_progress') INTO v_client_exercise_progress_exists;
    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ejecuciones_ejercicio') INTO v_ejecuciones_ejercicio_exists;
    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'intensidades') INTO v_intensidades_exists;
    
    RAISE NOTICE '=========================================';
    RAISE NOTICE 'VERIFICACIÓN DE TABLAS';
    RAISE NOTICE '=========================================';
    RAISE NOTICE 'client_exercise_progress existe: %', v_client_exercise_progress_exists;
    RAISE NOTICE 'ejecuciones_ejercicio existe: %', v_ejecuciones_ejercicio_exists;
    RAISE NOTICE 'intensidades existe: %', v_intensidades_exists;
    
    IF NOT v_ejecuciones_ejercicio_exists THEN
        RAISE EXCEPTION '❌ Tabla ejecuciones_ejercicio no existe. Debe crearse primero.';
    END IF;
    
    IF NOT v_intensidades_exists THEN
        RAISE EXCEPTION '❌ Tabla intensidades no existe. Debe crearse primero.';
    END IF;
    
    -- Contar registros existentes
    IF v_client_exercise_progress_exists THEN
        SELECT COUNT(*) INTO v_count_client_progress FROM client_exercise_progress;
        RAISE NOTICE 'Registros en client_exercise_progress: %', v_count_client_progress;
    ELSE
        v_count_client_progress := 0;
        RAISE NOTICE 'client_exercise_progress no existe - no hay datos que migrar';
    END IF;
    
    SELECT COUNT(*) INTO v_count_ejecuciones FROM ejecuciones_ejercicio;
    RAISE NOTICE 'Registros en ejecuciones_ejercicio: %', v_count_ejecuciones;
    
    RAISE NOTICE '=========================================';
END $$;

-- =====================================================
-- PASO 2: MIGRAR DATOS DE client_exercise_progress
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
        
        RAISE NOTICE 'Migración completada:';
        RAISE NOTICE '  - Registros migrados: %', v_migrated_count;
        RAISE NOTICE '  - Errores: %', v_error_count;
        
    ELSE
        RAISE NOTICE 'client_exercise_progress no existe - saltando migración';
    END IF;
END $$;

-- =====================================================
-- PASO 3: VERIFICAR MIGRACIÓN
-- =====================================================

DO $$
DECLARE
    v_total_ejecuciones INTEGER;
    v_ejecuciones_con_intensidad INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_total_ejecuciones FROM ejecuciones_ejercicio;
    SELECT COUNT(*) INTO v_ejecuciones_con_intensidad FROM ejecuciones_ejercicio WHERE intensidad_aplicada IS NOT NULL;
    
    RAISE NOTICE '=========================================';
    RAISE NOTICE 'VERIFICACIÓN POST-MIGRACIÓN';
    RAISE NOTICE '=========================================';
    RAISE NOTICE 'Total ejecuciones: %', v_total_ejecuciones;
    RAISE NOTICE 'Ejecuciones con intensidad: %', v_ejecuciones_con_intensidad;
    RAISE NOTICE '=========================================';
END $$;

-- =====================================================
-- PASO 4: MOSTRAR MUESTRA DE DATOS MIGRADOS
-- =====================================================

SELECT 
    'MUESTRA DE EJECUCIONES MIGRADAS' as info,
    id,
    ejercicio_id,
    intensidad_aplicada,
    completado,
    fecha_ejecucion,
    peso_usado,
    repeticiones_realizadas,
    series_completadas
FROM ejecuciones_ejercicio 
WHERE intensidad_aplicada IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;


































