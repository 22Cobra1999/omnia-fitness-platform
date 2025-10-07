-- =====================================================
-- CORRECCIÓN DE ERRORES EN MIGRACIÓN MODULAR
-- =====================================================
-- Este script corrige los errores encontrados durante la migración

-- =====================================================
-- PASO 1: VERIFICAR Y CREAR TABLAS FALTANTES
-- =====================================================

-- Verificar si fitness_program_details existe, si no, crearla
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'fitness_program_details') THEN
        RAISE NOTICE 'Creando tabla fitness_program_details...';
        
        CREATE TABLE fitness_program_details (
            id SERIAL PRIMARY KEY,
            día INTEGER NOT NULL,
            semana INTEGER NOT NULL,
            nombre_actividad VARCHAR(255),
            descripción TEXT,
            duración INTEGER,
            tipo_ejercicio VARCHAR(255),
            repeticiones VARCHAR(255),
            intervalos_secs VARCHAR(255),
            descanso VARCHAR(255),
            peso VARCHAR(255),
            nivel_intensidad VARCHAR(255),
            equipo_necesario TEXT,
            rm VARCHAR(255),
            coach_id UUID REFERENCES user_profiles(id),
            activity_id INTEGER REFERENCES activities(id) ON DELETE CASCADE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            video TEXT,
            series VARCHAR(255),
            completed BOOLEAN DEFAULT FALSE,
            completed_at TIMESTAMP WITH TIME ZONE,
            calorias_consumidas INTEGER,
            intevalos_cant VARCHAR(255),
            nota_cliente TEXT,
            client_id UUID REFERENCES user_profiles(id),
            scheduled_date DATE,
            video_url TEXT
        );
        
        RAISE NOTICE 'Tabla fitness_program_details creada exitosamente';
    ELSE
        RAISE NOTICE 'Tabla fitness_program_details ya existe';
    END IF;
END $$;

-- =====================================================
-- PASO 2: CORREGIR ÍNDICES CON FUNCIONES NO INMUTABLES
-- =====================================================

-- Eliminar índices problemáticos si existen
DROP INDEX IF EXISTS idx_ejercicios_detalles_body_parts;

-- Crear índice corregido (sin función to_tsvector)
CREATE INDEX IF NOT EXISTS idx_ejercicios_detalles_body_parts_text 
    ON ejercicios_detalles(body_parts) 
    WHERE body_parts IS NOT NULL AND body_parts != '';

-- =====================================================
-- PASO 3: MIGRACIÓN CORREGIDA DE EJERCICIOS
-- =====================================================

-- Verificar si hay datos en fitness_program_details antes de migrar
DO $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count FROM fitness_program_details;
    
    IF v_count > 0 THEN
        RAISE NOTICE 'Encontrados % registros en fitness_program_details, procediendo con migración...', v_count;
        
        -- Migrar ejercicios únicos desde fitness_program_details
        INSERT INTO ejercicios_detalles (
            activity_id,
            nombre_ejercicio,
            tipo,
            descripcion,
            equipo,
            variantes,
            body_parts,
            replicar,
            created_at,
            updated_at
        )
        SELECT DISTINCT
            fpd.activity_id,
            COALESCE(fpd.nombre_actividad, 'Ejercicio sin nombre') as nombre_ejercicio,
            CASE 
                WHEN fpd.tipo_ejercicio IS NOT NULL THEN LOWER(fpd.tipo_ejercicio)
                ELSE 'fuerza'
            END as tipo,
            fpd.descripción as descripcion,
            fpd.equipo_necesario as equipo,
            CASE 
                WHEN fpd.repeticiones IS NOT NULL OR fpd.series IS NOT NULL OR fpd.peso IS NOT NULL THEN
                    jsonb_build_object(
                        'reps', fpd.repeticiones,
                        'series', fpd.series,
                        'peso', fpd.peso,
                        'descanso', fpd.descanso,
                        'intervalos_secs', fpd.intervalos_secs,
                        'intervalos_cant', fpd.intevalos_cant
                    )
                ELSE NULL
            END as variantes,
            '' as body_parts,
            true as replicar,
            fpd.created_at,
            fpd.updated_at
        FROM fitness_program_details fpd
        WHERE fpd.client_id IS NULL -- Solo plantillas
        AND NOT EXISTS (
            SELECT 1 FROM ejercicios_detalles ed 
            WHERE ed.activity_id = fpd.activity_id 
            AND ed.nombre_ejercicio = COALESCE(fpd.nombre_actividad, 'Ejercicio sin nombre')
        );
        
        RAISE NOTICE 'Migración de ejercicios completada';
    ELSE
        RAISE NOTICE 'No hay datos en fitness_program_details, saltando migración de ejercicios';
    END IF;
END $$;

-- =====================================================
-- PASO 4: MIGRACIÓN CORREGIDA DE ORGANIZACIÓN
-- =====================================================

-- Migrar organización de ejercicios
DO $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count FROM fitness_program_details WHERE client_id IS NULL;
    
    IF v_count > 0 THEN
        INSERT INTO organizacion_ejercicios (
            activity_id,
            ejercicio_id,
            bloque,
            dia,
            semana,
            numero_periodo,
            created_at,
            updated_at
        )
        SELECT DISTINCT
            fpd.activity_id,
            ed.id as ejercicio_id,
            CASE 
                WHEN fpd.día <= 3 THEN 'Mañana'
                WHEN fpd.día <= 5 THEN 'Tarde'
                ELSE 'Noche'
            END as bloque,
            fpd.día as dia,
            fpd.semana as semana,
            CASE 
                WHEN fpd.semana <= 4 THEN 1
                WHEN fpd.semana <= 8 THEN 2
                WHEN fpd.semana <= 12 THEN 3
                ELSE CEIL(fpd.semana::DECIMAL / 4)::INTEGER
            END as numero_periodo,
            fpd.created_at,
            fpd.updated_at
        FROM fitness_program_details fpd
        JOIN ejercicios_detalles ed ON (
            ed.activity_id = fpd.activity_id 
            AND ed.nombre_ejercicio = COALESCE(fpd.nombre_actividad, 'Ejercicio sin nombre')
        )
        WHERE fpd.client_id IS NULL -- Solo plantillas
        AND NOT EXISTS (
            SELECT 1 FROM organizacion_ejercicios oe
            WHERE oe.activity_id = fpd.activity_id
            AND oe.ejercicio_id = ed.id
            AND oe.dia = fpd.día
            AND oe.semana = fpd.semana
        );
        
        RAISE NOTICE 'Migración de organización completada';
    END IF;
END $$;

-- =====================================================
-- PASO 5: MIGRACIÓN CORREGIDA DE INTENSIDADES
-- =====================================================

-- Migrar intensidades
DO $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count FROM fitness_program_details WHERE client_id IS NULL;
    
    IF v_count > 0 THEN
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
        )
        SELECT DISTINCT
            ed.id as ejercicio_id,
            COALESCE(fpd.nivel_intensidad, 'Intermedio') as nombre,
            CASE 
                WHEN LOWER(COALESCE(fpd.nivel_intensidad, 'intermedio')) LIKE '%principiante%' THEN 1
                WHEN LOWER(COALESCE(fpd.nivel_intensidad, 'intermedio')) LIKE '%intermedio%' THEN 2
                WHEN LOWER(COALESCE(fpd.nivel_intensidad, 'intermedio')) LIKE '%avanzado%' THEN 3
                ELSE 2
            END as orden,
            CASE 
                WHEN fpd.repeticiones ~ '^[0-9]+$' THEN fpd.repeticiones::INTEGER
                WHEN fpd.repeticiones ~ '^[0-9]+-[0-9]+$' THEN 
                    (SPLIT_PART(fpd.repeticiones, '-', 1)::INTEGER + SPLIT_PART(fpd.repeticiones, '-', 2)::INTEGER) / 2
                ELSE NULL
            END as reps,
            CASE 
                WHEN fpd.series ~ '^[0-9]+$' THEN fpd.series::INTEGER
                ELSE NULL
            END as series,
            CASE 
                WHEN fpd.peso ~ '^[0-9]+(\.[0-9]+)?$' THEN fpd.peso::DECIMAL(5,2)
                ELSE NULL
            END as peso,
            fpd.duración as duracion_minutos,
            CASE 
                WHEN fpd.descanso ~ '^[0-9]+$' THEN fpd.descanso::INTEGER
                ELSE NULL
            END as descanso_segundos,
            fpd.created_at,
            fpd.updated_at
        FROM fitness_program_details fpd
        JOIN ejercicios_detalles ed ON (
            ed.activity_id = fpd.activity_id 
            AND ed.nombre_ejercicio = COALESCE(fpd.nombre_actividad, 'Ejercicio sin nombre')
        )
        WHERE fpd.client_id IS NULL -- Solo plantillas
        AND NOT EXISTS (
            SELECT 1 FROM intensidades i
            WHERE i.ejercicio_id = ed.id
            AND i.nombre = COALESCE(fpd.nivel_intensidad, 'Intermedio')
        );
        
        RAISE NOTICE 'Migración de intensidades completada';
    END IF;
END $$;

-- =====================================================
-- PASO 6: GENERAR PERÍODOS PARA ENROLLMENTS ACTIVOS
-- =====================================================

-- Generar períodos para enrollments activos
DO $$
DECLARE
    v_enrollment RECORD;
    v_resultado JSONB;
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count FROM activity_enrollments WHERE status = 'activa' AND start_date IS NOT NULL;
    
    IF v_count > 0 THEN
        RAISE NOTICE 'Generando períodos para % enrollments activos...', v_count;
        
        FOR v_enrollment IN 
            SELECT id, activity_id, client_id, start_date
            FROM activity_enrollments 
            WHERE status = 'activa' 
            AND start_date IS NOT NULL
        LOOP
            -- Generar períodos para este enrollment
            SELECT generar_periodos_para_enrollment(v_enrollment.id) INTO v_resultado;
            
            RAISE NOTICE 'Períodos generados para enrollment %: %', v_enrollment.id, v_resultado;
        END LOOP;
    ELSE
        RAISE NOTICE 'No hay enrollments activos para generar períodos';
    END IF;
END $$;

-- =====================================================
-- PASO 7: MIGRAR EJECUCIONES DE CLIENTES
-- =====================================================

-- Migrar ejecuciones desde fitness_program_details con client_id específico
DO $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count FROM fitness_program_details WHERE client_id IS NOT NULL;
    
    IF v_count > 0 THEN
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
            nota_cliente,
            created_at,
            updated_at,
            completed_at
        )
        SELECT 
            pa.id as periodo_id,
            ed.id as ejercicio_id,
            COALESCE(fpd.nivel_intensidad, 'Intermedio') as intensidad_aplicada,
            fpd.duración as duracion,
            fpd.calorias_consumidas as calorias_estimadas,
            COALESCE(fpd.scheduled_date, pa.fecha_inicio) as fecha_ejecucion,
            COALESCE(fpd.completed, false) as completado,
            CASE 
                WHEN fpd.peso ~ '^[0-9]+(\.[0-9]+)?$' THEN fpd.peso::DECIMAL(5,2)
                ELSE NULL
            END as peso_usado,
            CASE 
                WHEN fpd.repeticiones ~ '^[0-9]+$' THEN fpd.repeticiones::INTEGER
                ELSE NULL
            END as repeticiones_realizadas,
            CASE 
                WHEN fpd.series ~ '^[0-9]+$' THEN fpd.series::INTEGER
                ELSE NULL
            END as series_completadas,
            fpd.nota_cliente,
            fpd.created_at,
            fpd.updated_at,
            CASE 
                WHEN fpd.completed = true THEN fpd.completed_at
                ELSE NULL
            END as completed_at
        FROM fitness_program_details fpd
        JOIN activity_enrollments ae ON (
            ae.client_id = fpd.client_id 
            AND ae.activity_id = fpd.activity_id
        )
        JOIN periodos_asignados pa ON (
            pa.enrollment_id = ae.id
            AND pa.numero_periodo = CASE 
                WHEN fpd.semana <= 4 THEN 1
                WHEN fpd.semana <= 8 THEN 2
                WHEN fpd.semana <= 12 THEN 3
                ELSE CEIL(fpd.semana::DECIMAL / 4)::INTEGER
            END
        )
        JOIN ejercicios_detalles ed ON (
            ed.activity_id = fpd.activity_id 
            AND ed.nombre_ejercicio = COALESCE(fpd.nombre_actividad, 'Ejercicio sin nombre')
        )
        WHERE fpd.client_id IS NOT NULL -- Solo datos específicos de cliente
        AND NOT EXISTS (
            SELECT 1 FROM ejecuciones_ejercicio ee
            WHERE ee.periodo_id = pa.id
            AND ee.ejercicio_id = ed.id
            AND ee.fecha_ejecucion = COALESCE(fpd.scheduled_date, pa.fecha_inicio)
        );
        
        RAISE NOTICE 'Migración de ejecuciones completada';
    ELSE
        RAISE NOTICE 'No hay datos de clientes para migrar ejecuciones';
    END IF;
END $$;

-- =====================================================
-- PASO 8: VERIFICACIÓN FINAL
-- =====================================================

-- Mostrar resumen de migración
DO $$
DECLARE
    v_ejercicios INTEGER;
    v_organizaciones INTEGER;
    v_intensidades INTEGER;
    v_periodos INTEGER;
    v_ejecuciones INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_ejercicios FROM ejercicios_detalles;
    SELECT COUNT(*) INTO v_organizaciones FROM organizacion_ejercicios;
    SELECT COUNT(*) INTO v_intensidades FROM intensidades;
    SELECT COUNT(*) INTO v_periodos FROM periodos_asignados;
    SELECT COUNT(*) INTO v_ejecuciones FROM ejecuciones_ejercicio;
    
    RAISE NOTICE '=== RESUMEN DE MIGRACIÓN CORREGIDA ===';
    RAISE NOTICE 'Ejercicios migrados: %', v_ejercicios;
    RAISE NOTICE 'Organizaciones migradas: %', v_organizaciones;
    RAISE NOTICE 'Intensidades migradas: %', v_intensidades;
    RAISE NOTICE 'Períodos generados: %', v_periodos;
    RAISE NOTICE 'Ejecuciones migradas: %', v_ejecuciones;
    RAISE NOTICE '=========================================';
END $$;

RAISE NOTICE 'Corrección de errores de migración completada exitosamente';
