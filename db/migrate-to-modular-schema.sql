-- =====================================================
-- MIGRACIÓN DE DATOS AL ESQUEMA MODULAR
-- =====================================================
-- Este script migra datos de las tablas actuales al nuevo esquema modular
-- IMPORTANTE: Ejecutar en orden y hacer backup antes de ejecutar

-- =====================================================
-- PASO 1: MIGRAR EJERCICIOS DE fitness_program_details A ejercicios_detalles
-- =====================================================

-- Insertar ejercicios únicos desde fitness_program_details
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
    '' as body_parts, -- Se puede poblar después con datos específicos
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
-- PASO 2: MIGRAR ORGANIZACIÓN DE fitness_program_details A organizacion_ejercicios
-- =====================================================

-- Insertar organización de ejercicios
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
-- PASO 3: MIGRAR INTENSIDADES DESDE fitness_program_details
-- =====================================================

-- Insertar intensidades basadas en nivel_intensidad
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
-- PASO 4: MIGRAR ENROLLMENTS ACTIVOS A PERIODOS_ASIGNADOS
-- =====================================================

-- Generar períodos para enrollments activos
DO $$
DECLARE
    v_enrollment RECORD;
    v_resultado JSONB;
BEGIN
    -- Procesar cada enrollment activo
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
END $$;

-- =====================================================
-- PASO 5: MIGRAR PROGRESO DE CLIENTES A EJECUCIONES_EJERCICIO
-- =====================================================

-- Migrar desde fitness_program_details con client_id específico
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
-- PASO 6: MIGRAR PERSONALIZACIONES DE CLIENTES
-- =====================================================

-- Migrar desde client_exercise_customizations si existe
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'client_exercise_customizations') THEN
        -- Actualizar ejecuciones con datos de personalización
        UPDATE ejecuciones_ejercicio 
        SET 
            duracion = COALESCE(cec.duracion_min, ejecuciones_ejercicio.duracion),
            calorias_estimadas = COALESCE(cec.calorias, ejecuciones_ejercicio.calorias_estimadas),
            peso_usado = COALESCE(cec.one_rm, ejecuciones_ejercicio.peso_usado),
            nota_cliente = COALESCE(cec.nota_cliente, ejecuciones_ejercicio.nota_cliente),
            completado = COALESCE(cec.completed, ejecuciones_ejercicio.completado),
            completed_at = COALESCE(cec.completed_at, ejecuciones_ejercicio.completed_at)
        FROM client_exercise_customizations cec
        JOIN ejercicios_detalles ed ON ed.id = cec.fitness_exercise_id
        WHERE ejecuciones_ejercicio.ejercicio_id = ed.id
        AND EXISTS (
            SELECT 1 FROM periodos_asignados pa
            JOIN activity_enrollments ae ON ae.id = pa.enrollment_id
            WHERE pa.id = ejecuciones_ejercicio.periodo_id
            AND ae.client_id = cec.client_id
        );
        
        RAISE NOTICE 'Personalizaciones de clientes migradas exitosamente';
    ELSE
        RAISE NOTICE 'Tabla client_exercise_customizations no existe, saltando migración de personalizaciones';
    END IF;
END $$;

-- =====================================================
-- PASO 7: ACTUALIZAR BODY_PARTS CON DATOS EXISTENTES
-- =====================================================

-- Actualizar body_parts si existe la columna en fitness_exercises
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'fitness_exercises' 
        AND column_name = 'body_parts'
    ) THEN
        UPDATE ejercicios_detalles 
        SET body_parts = fe.body_parts
        FROM fitness_exercises fe
        WHERE ejercicios_detalles.activity_id = fe.activity_id
        AND ejercicios_detalles.nombre_ejercicio = fe.nombre_ejercicio
        AND fe.body_parts IS NOT NULL 
        AND fe.body_parts != '';
        
        RAISE NOTICE 'Body parts actualizados desde fitness_exercises';
    ELSE
        RAISE NOTICE 'Columna body_parts no existe en fitness_exercises, saltando actualización';
    END IF;
END $$;

-- =====================================================
-- PASO 8: VERIFICAR INTEGRIDAD DE DATOS MIGRADOS
-- =====================================================

-- Crear vista para verificar la migración
CREATE OR REPLACE VIEW migracion_verificacion AS
SELECT 
    'ejercicios_detalles' as tabla,
    COUNT(*) as registros_migrados,
    COUNT(DISTINCT activity_id) as actividades_con_ejercicios
FROM ejercicios_detalles
UNION ALL
SELECT 
    'organizacion_ejercicios' as tabla,
    COUNT(*) as registros_migrados,
    COUNT(DISTINCT activity_id) as actividades_con_ejercicios
FROM organizacion_ejercicios
UNION ALL
SELECT 
    'intensidades' as tabla,
    COUNT(*) as registros_migrados,
    COUNT(DISTINCT ejercicio_id) as actividades_con_ejercicios
FROM intensidades
UNION ALL
SELECT 
    'periodos_asignados' as tabla,
    COUNT(*) as registros_migrados,
    COUNT(DISTINCT enrollment_id) as actividades_con_ejercicios
FROM periodos_asignados
UNION ALL
SELECT 
    'ejecuciones_ejercicio' as tabla,
    COUNT(*) as registros_migrados,
    COUNT(DISTINCT periodo_id) as actividades_con_ejercicios
FROM ejecuciones_ejercicio;

-- Mostrar resumen de migración
SELECT * FROM migracion_verificacion;

-- =====================================================
-- PASO 9: CREAR ÍNDICES ADICIONALES PARA RENDIMIENTO
-- =====================================================

-- Índices compuestos para consultas frecuentes
CREATE INDEX IF NOT EXISTS idx_ejercicios_detalles_activity_tipo 
    ON ejercicios_detalles(activity_id, tipo);

CREATE INDEX IF NOT EXISTS idx_organizacion_ejercicios_activity_periodo 
    ON organizacion_ejercicios(activity_id, numero_periodo, semana, dia);

CREATE INDEX IF NOT EXISTS idx_ejecuciones_ejercicio_fecha_completado 
    ON ejecuciones_ejercicio(fecha_ejecucion, completado);

CREATE INDEX IF NOT EXISTS idx_periodos_asignados_enrollment_periodo 
    ON periodos_asignados(enrollment_id, numero_periodo);

-- =====================================================
-- PASO 10: LIMPIAR DATOS TEMPORALES
-- =====================================================

-- Eliminar vista de verificación
DROP VIEW IF EXISTS migracion_verificacion;

-- =====================================================
-- RESUMEN DE MIGRACIÓN
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
    
    RAISE NOTICE '=== RESUMEN DE MIGRACIÓN COMPLETADA ===';
    RAISE NOTICE 'Ejercicios migrados: %', v_ejercicios;
    RAISE NOTICE 'Organizaciones migradas: %', v_organizaciones;
    RAISE NOTICE 'Intensidades migradas: %', v_intensidades;
    RAISE NOTICE 'Períodos generados: %', v_periodos;
    RAISE NOTICE 'Ejecuciones migradas: %', v_ejecuciones;
    RAISE NOTICE '=========================================';
END $$;

RAISE NOTICE 'Migración al esquema modular completada exitosamente';
