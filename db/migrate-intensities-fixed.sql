-- =====================================================
-- MIGRACIÓN CORREGIDA: exercise_intensity_levels → intensidades
-- =====================================================
-- Maneja el caso donde los IDs no coinciden exactamente

-- =====================================================
-- PASO 1: VERIFICAR DATOS A MIGRAR
-- =====================================================

DO $$
DECLARE
    v_intensity_levels_count INTEGER;
    v_intensidades_count INTEGER;
    v_ejercicios_existentes INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_intensity_levels_count FROM exercise_intensity_levels;
    SELECT COUNT(*) INTO v_intensidades_count FROM intensidades;
    
    SELECT COUNT(*) INTO v_ejercicios_existentes
    FROM exercise_intensity_levels eil
    JOIN ejercicios_detalles ed ON ed.id = eil.fitness_exercise_id;
    
    RAISE NOTICE '=========================================';
    RAISE NOTICE 'ESTADO ANTES DE MIGRACIÓN';
    RAISE NOTICE '=========================================';
    RAISE NOTICE 'exercise_intensity_levels: % registros', v_intensity_levels_count;
    RAISE NOTICE 'intensidades: % registros', v_intensidades_count;
    RAISE NOTICE 'Ejercicios existentes: %', v_ejercicios_existentes;
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
        LEFT JOIN ejercicios_detalles ed ON ed.id = eil.fitness_exercise_id
        WHERE ed.id IS NOT NULL
        ORDER BY eil.id
    LOOP
        BEGIN
            -- Determinar el orden basado en el ID o crear uno secuencial
            DECLARE
                v_orden_counter INTEGER;
                v_nombre_mejorado TEXT;
                v_reps INTEGER;
                v_series INTEGER;
                v_peso DECIMAL(5,2);
            BEGIN
                -- Usar el ID como orden base
                v_orden_counter := v_record.id % 10; -- Crear orden 1-10
                IF v_orden_counter = 0 THEN v_orden_counter := 10; END IF;
                
                -- Mejorar el nombre de la intensidad
                v_nombre_mejorado := CASE 
                    WHEN LOWER(v_record.level_name) LIKE '%beginner%' OR LOWER(v_record.level_name) LIKE '%principiante%' THEN 'Principiante'
                    WHEN LOWER(v_record.level_name) LIKE '%intermediate%' OR LOWER(v_record.level_name) LIKE '%intermedio%' THEN 'Intermedio'
                    WHEN LOWER(v_record.level_name) LIKE '%advanced%' OR LOWER(v_record.level_name) LIKE '%avanzado%' THEN 'Avanzado'
                    WHEN LOWER(v_record.level_name) LIKE '%expert%' OR LOWER(v_record.level_name) LIKE '%experto%' THEN 'Experto'
                    WHEN LOWER(v_record.level_name) LIKE '%estándar%' OR LOWER(v_record.level_name) LIKE '%standard%' THEN 'Estándar'
                    ELSE INITCAP(TRIM(v_record.level_name))
                END;
                
                -- Extraer reps y series del detalle_series si es posible
                -- Formato típico: "(35-9-2);(63-14-2);(72-8-1)" donde es (peso-reps-series)
                v_reps := NULL;
                v_series := NULL;
                v_peso := v_record.one_rm;
                
                -- Intentar extraer reps y series del detalle_series
                IF v_record.detalle_series IS NOT NULL THEN
                    -- Buscar el primer patrón (peso-reps-series)
                    IF v_record.detalle_series ~ '\([0-9]+-[0-9]+-[0-9]+\)' THEN
                        -- Extraer reps y series del primer grupo
                        v_reps := CAST(SPLIT_PART(SPLIT_PART(SPLIT_PART(v_record.detalle_series, '(', 2), '-', 2), ')', 1) AS INTEGER);
                        v_series := CAST(SPLIT_PART(SPLIT_PART(SPLIT_PART(v_record.detalle_series, '(', 2), '-', 3), ')', 1) AS INTEGER);
                    END IF;
                END IF;
                
                -- Si no se pudieron extraer, usar valores por defecto
                IF v_reps IS NULL THEN v_reps := 10; END IF;
                IF v_series IS NULL THEN v_series := 3; END IF;
                
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
                    v_reps,
                    v_series,
                    v_peso,
                    v_record.duracion_min,
                    60, -- Descanso por defecto de 60 segundos
                    v_record.created_at,
                    NOW(),
                    v_record.created_by_coach_id
                );
                
                v_migrated_count := v_migrated_count + 1;
                
            EXCEPTION WHEN unique_violation THEN
                -- Si ya existe una intensidad con el mismo nombre para este ejercicio, actualizar
                UPDATE intensidades SET
                    orden = v_orden_counter,
                    reps = v_reps,
                    series = v_series,
                    peso = v_peso,
                    duracion_minutos = v_record.duracion_min,
                    descanso_segundos = 60,
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
-- PASO 3: CREAR INTENSIDADES PARA EJERCICIOS SIN INTENSIDADES
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
-- PASO 5: MOSTRAR MUESTRA DE INTENSIDADES MIGRADAS
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

































