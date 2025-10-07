-- =====================================================
-- POBLAR ESQUEMA MODULAR CON DATOS DE PRUEBA
-- =====================================================
-- Este script crea datos de ejemplo para probar el esquema modular

-- =====================================================
-- PASO 1: VERIFICAR DATOS EXISTENTES
-- =====================================================

DO $$
DECLARE
    v_activities_count INTEGER;
    v_enrollments_count INTEGER;
    v_fitness_program_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_activities_count FROM activities;
    SELECT COUNT(*) INTO v_enrollments_count FROM activity_enrollments;
    SELECT COUNT(*) INTO v_fitness_program_count FROM fitness_program_details;
    
    RAISE NOTICE '=== DATOS EXISTENTES ===';
    RAISE NOTICE 'Activities: %', v_activities_count;
    RAISE NOTICE 'Enrollments: %', v_enrollments_count;
    RAISE NOTICE 'Fitness Program Details: %', v_fitness_program_count;
    RAISE NOTICE '========================';
END $$;

-- =====================================================
-- PASO 2: MIGRAR EJERCICIOS DESDE fitness_program_details
-- =====================================================

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
WHERE fpd.client_id IS NULL -- Solo plantillas, no datos específicos de cliente
AND NOT EXISTS (
    SELECT 1 FROM ejercicios_detalles ed 
    WHERE ed.activity_id = fpd.activity_id 
    AND ed.nombre_ejercicio = COALESCE(fpd.nombre_actividad, 'Ejercicio sin nombre')
);

-- =====================================================
-- PASO 3: MIGRAR ORGANIZACIÓN DE EJERCICIOS
-- =====================================================

-- Migrar organización de ejercicios
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

-- =====================================================
-- PASO 4: MIGRAR INTENSIDADES
-- =====================================================

-- Migrar intensidades basadas en nivel_intensidad
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

-- =====================================================
-- PASO 5: GENERAR PERÍODOS PARA ENROLLMENTS ACTIVOS
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
        RAISE NOTICE 'No hay enrollments activos. Creando datos de ejemplo...';
        
        -- Crear un enrollment de ejemplo si no hay ninguno
        IF EXISTS (SELECT 1 FROM activities LIMIT 1) THEN
            INSERT INTO activity_enrollments (activity_id, client_id, status, start_date)
            SELECT 
                a.id,
                (SELECT id FROM auth.users LIMIT 1),
                'pendiente', -- Usar pendiente en lugar de activa
                CURRENT_DATE
            FROM activities a
            LIMIT 1
            ON CONFLICT DO NOTHING;
            
            -- Generar períodos para el enrollment de ejemplo
            SELECT generar_periodos_para_enrollment(
                (SELECT id FROM activity_enrollments WHERE status = 'pendiente' LIMIT 1)
            ) INTO v_resultado;
            
            RAISE NOTICE 'Enrollment de ejemplo creado y períodos generados: %', v_resultado;
        END IF;
    END IF;
END $$;

-- =====================================================
-- PASO 6: MIGRAR EJECUCIONES DE CLIENTES
-- =====================================================

-- Migrar ejecuciones desde fitness_program_details con client_id específico
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

-- =====================================================
-- PASO 7: CREAR DATOS DE EJEMPLO SI NO HAY DATOS
-- =====================================================

-- Si no hay ejercicios, crear algunos de ejemplo
DO $$
DECLARE
    v_ejercicios_count INTEGER;
    v_activity_id INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_ejercicios_count FROM ejercicios_detalles;
    
    IF v_ejercicios_count = 0 THEN
        RAISE NOTICE 'No hay ejercicios. Creando datos de ejemplo...';
        
        -- Obtener una actividad existente o crear una
        SELECT id INTO v_activity_id FROM activities LIMIT 1;
        
        IF v_activity_id IS NULL THEN
            -- Crear una actividad de ejemplo
            INSERT INTO activities (title, description, type, price, coach_id, is_public)
            VALUES (
                'Rutina de Ejemplo',
                'Rutina de ejemplo para probar el esquema modular',
                'fitness',
                50.00,
                (SELECT id FROM auth.users LIMIT 1),
                true
            ) RETURNING id INTO v_activity_id;
        END IF;
        
        -- Crear ejercicios de ejemplo
        INSERT INTO ejercicios_detalles (activity_id, nombre_ejercicio, tipo, descripcion, equipo, variantes, body_parts, replicar)
        VALUES 
            (v_activity_id, 'Flexiones', 'fuerza', 'Ejercicio de fuerza para pecho y brazos', 'Peso corporal', 
             jsonb_build_object('reps', '10-15', 'series', '3', 'descanso', '60'), 'Pecho;Tríceps;Hombros', true),
            (v_activity_id, 'Sentadillas', 'fuerza', 'Ejercicio de fuerza para piernas', 'Peso corporal',
             jsonb_build_object('reps', '15-20', 'series', '3', 'descanso', '60'), 'Piernas;Glúteos', true),
            (v_activity_id, 'Plancha', 'fuerza', 'Ejercicio isométrico para core', 'Peso corporal',
             jsonb_build_object('duracion', '30', 'series', '3', 'descanso', '60'), 'Core;Abdominales', true);
        
        -- Crear organización de ejercicios
        INSERT INTO organizacion_ejercicios (activity_id, ejercicio_id, bloque, dia, semana, numero_periodo)
        SELECT 
            v_activity_id,
            ed.id,
            'Mañana',
            1, -- Lunes
            1, -- Semana 1
            1  -- Período 1
        FROM ejercicios_detalles ed
        WHERE ed.activity_id = v_activity_id;
        
        -- Crear intensidades de ejemplo
        INSERT INTO intensidades (ejercicio_id, nombre, orden, reps, series, peso)
        SELECT 
            ed.id,
            'Principiante',
            1,
            8,
            2,
            NULL
        FROM ejercicios_detalles ed
        WHERE ed.activity_id = v_activity_id;
        
        INSERT INTO intensidades (ejercicio_id, nombre, orden, reps, series, peso)
        SELECT 
            ed.id,
            'Intermedio',
            2,
            12,
            3,
            NULL
        FROM ejercicios_detalles ed
        WHERE ed.activity_id = v_activity_id;
        
        RAISE NOTICE 'Datos de ejemplo creados para actividad %', v_activity_id;
    END IF;
END $$;

-- =====================================================
-- PASO 8: VERIFICACIÓN FINAL
-- =====================================================

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
    
    RAISE NOTICE '=========================================';
    RAISE NOTICE 'POBLACIÓN DEL ESQUEMA MODULAR COMPLETADA';
    RAISE NOTICE '=========================================';
    RAISE NOTICE 'Ejercicios: %', v_ejercicios;
    RAISE NOTICE 'Organizaciones: %', v_organizaciones;
    RAISE NOTICE 'Intensidades: %', v_intensidades;
    RAISE NOTICE 'Períodos: %', v_periodos;
    RAISE NOTICE 'Ejecuciones: %', v_ejecuciones;
    RAISE NOTICE '=========================================';
    
    IF v_ejercicios > 0 THEN
        RAISE NOTICE '✅ Esquema modular poblado exitosamente';
    ELSE
        RAISE WARNING '⚠️  No se pudieron crear datos. Verifica que existan activities y users.';
    END IF;
END $$;

RAISE NOTICE 'Población del esquema modular completada';
