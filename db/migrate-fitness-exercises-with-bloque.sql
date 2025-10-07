-- =====================================================
-- MIGRAR fitness_exercises CON COLUMNA bloque NUMÉRICA
-- =====================================================
-- Este script migra datos de fitness_exercises al nuevo esquema modular
-- Considerando que la columna 'bloque' es numérica e indica orden

-- =====================================================
-- PASO 1: VERIFICAR ESTRUCTURA DE fitness_exercises
-- =====================================================

DO $$
DECLARE
    v_table_exists BOOLEAN;
    v_columns_info TEXT;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'fitness_exercises'
    ) INTO v_table_exists;
    
    IF v_table_exists THEN
        RAISE NOTICE 'fitness_exercises existe - verificando estructura...';
        
        -- Verificar columnas importantes
        SELECT string_agg(column_name || ' (' || data_type || ')', ', ')
        INTO v_columns_info
        FROM information_schema.columns 
        WHERE table_name = 'fitness_exercises'
        AND column_name IN ('id', 'activity_id', 'bloque', 'día', 'semana', 'nombre_actividad', 'tipo_ejercicio');
        
        RAISE NOTICE 'Columnas encontradas: %', v_columns_info;
    ELSE
        RAISE NOTICE 'fitness_exercises NO existe - no hay nada que migrar';
    END IF;
END $$;

-- =====================================================
-- PASO 2: MIGRAR EJERCICIOS ÚNICOS A ejercicios_detalles
-- =====================================================

-- Insertar ejercicios únicos desde fitness_exercises
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
    fe.activity_id,
    COALESCE(fe.nombre_actividad, 'Ejercicio sin nombre') as nombre_ejercicio,
    CASE 
        WHEN fe.tipo_ejercicio IS NOT NULL THEN LOWER(fe.tipo_ejercicio)
        ELSE 'fuerza'
    END as tipo,
    fe.descripción as descripcion,
    fe.equipo_necesario as equipo,
    CASE 
        WHEN fe.repeticiones IS NOT NULL OR fe.series IS NOT NULL OR fe.peso IS NOT NULL THEN
            jsonb_build_object(
                'reps', fe.repeticiones,
                'series', fe.series,
                'peso', fe.peso,
                'descanso', fe.descanso,
                'intervalos_secs', fe.intervalos_secs,
                'intervalos_cant', fe.intevalos_cant,
                'duracion', fe.duración,
                'calorias', fe.calorias_consumidas
            )
        ELSE NULL
    END as variantes,
    COALESCE(fe.body_parts, '') as body_parts,
    true as replicar,
    COALESCE(fe.created_at, NOW()) as created_at,
    COALESCE(fe.updated_at, NOW()) as updated_at
FROM fitness_exercises fe
WHERE fe.client_id IS NULL -- Solo plantillas, no datos específicos de cliente
AND NOT EXISTS (
    SELECT 1 FROM ejercicios_detalles ed 
    WHERE ed.activity_id = fe.activity_id 
    AND ed.nombre_ejercicio = COALESCE(fe.nombre_actividad, 'Ejercicio sin nombre')
);

-- =====================================================
-- PASO 3: MIGRAR ORGANIZACIÓN CON bloque NUMÉRICO
-- =====================================================

-- Insertar organización de ejercicios usando bloque como orden
INSERT INTO organizacion_ejercicios (
    activity_id,
    ejercicio_id,
    bloque,
    dia,
    semana,
    numero_periodo
)
SELECT 
    fe.activity_id,
    ed.id as ejercicio_id,
    CASE 
        WHEN fe.bloque IS NOT NULL THEN fe.bloque::TEXT
        ELSE '1'
    END as bloque,
    COALESCE(fe.día, 1) as dia,
    COALESCE(fe.semana, 1) as semana,
    COALESCE(fe.mes, 1) as numero_periodo
FROM fitness_exercises fe
JOIN ejercicios_detalles ed ON ed.activity_id = fe.activity_id 
    AND ed.nombre_ejercicio = COALESCE(fe.nombre_actividad, 'Ejercicio sin nombre')
WHERE fe.client_id IS NULL -- Solo plantillas
AND NOT EXISTS (
    SELECT 1 FROM organizacion_ejercicios oe 
    WHERE oe.activity_id = fe.activity_id 
    AND oe.ejercicio_id = ed.id
    AND oe.dia = COALESCE(fe.día, 1)
    AND oe.semana = COALESCE(fe.semana, 1)
);

-- =====================================================
-- PASO 4: MIGRAR INTENSIDADES SI EXISTEN
-- =====================================================

-- Migrar intensidades desde fitness_exercises
INSERT INTO intensidades (
    ejercicio_id,
    nombre,
    orden,
    reps,
    series,
    peso
)
SELECT 
    ed.id as ejercicio_id,
    COALESCE(fe.nivel_intensidad, 'Intermedio') as nombre,
    CASE 
        WHEN fe.bloque IS NOT NULL THEN fe.bloque
        ELSE 1
    END as orden,
    CASE 
        WHEN fe.repeticiones ~ '^[0-9]+$' THEN fe.repeticiones::INTEGER
        ELSE NULL
    END as reps,
    CASE 
        WHEN fe.series ~ '^[0-9]+$' THEN fe.series::INTEGER
        ELSE NULL
    END as series,
    CASE 
        WHEN fe.peso ~ '^[0-9]+(\.[0-9]+)?$' THEN fe.peso::NUMERIC
        ELSE NULL
    END as peso
FROM fitness_exercises fe
JOIN ejercicios_detalles ed ON ed.activity_id = fe.activity_id 
    AND ed.nombre_ejercicio = COALESCE(fe.nombre_actividad, 'Ejercicio sin nombre')
WHERE fe.client_id IS NULL -- Solo plantillas
AND NOT EXISTS (
    SELECT 1 FROM intensidades i 
    WHERE i.ejercicio_id = ed.id
    AND i.nombre = COALESCE(fe.nivel_intensidad, 'Intermedio')
);

-- =====================================================
-- PASO 5: VERIFICAR MIGRACIÓN
-- =====================================================

DO $$
DECLARE
    v_ejercicios_migrados INTEGER;
    v_organizaciones_migradas INTEGER;
    v_intensidades_migradas INTEGER;
    v_fitness_exercises_count INTEGER;
BEGIN
    -- Contar registros migrados
    SELECT COUNT(*) INTO v_ejercicios_migrados FROM ejercicios_detalles;
    SELECT COUNT(*) INTO v_organizaciones_migradas FROM organizacion_ejercicios;
    SELECT COUNT(*) INTO v_intensidades_migradas FROM intensidades;
    SELECT COUNT(*) INTO v_fitness_exercises_count FROM fitness_exercises;
    
    RAISE NOTICE '=========================================';
    RAISE NOTICE 'RESULTADO DE LA MIGRACIÓN';
    RAISE NOTICE '=========================================';
    RAISE NOTICE 'Ejercicios migrados a ejercicios_detalles: %', v_ejercicios_migrados;
    RAISE NOTICE 'Organizaciones migradas: %', v_organizaciones_migradas;
    RAISE NOTICE 'Intensidades migradas: %', v_intensidades_migradas;
    RAISE NOTICE 'Registros en fitness_exercises: %', v_fitness_exercises_count;
    RAISE NOTICE '=========================================';
    
    IF v_ejercicios_migrados > 0 THEN
        RAISE NOTICE '✅ Migración exitosa';
        RAISE NOTICE '📊 Puedes verificar los datos migrados con:';
        RAISE NOTICE '   SELECT * FROM ejercicios_detalles;';
        RAISE NOTICE '   SELECT * FROM organizacion_ejercicios;';
        RAISE NOTICE '   SELECT * FROM intensidades;';
    ELSE
        RAISE WARNING '⚠️  No se migraron ejercicios';
    END IF;
END $$;

-- =====================================================
-- PASO 6: MOSTRAR DATOS MIGRADOS
-- =====================================================

-- Mostrar ejercicios migrados
SELECT 
    'EJERCICIOS MIGRADOS' as info,
    ed.id,
    ed.activity_id,
    ed.nombre_ejercicio,
    ed.tipo,
    ed.equipo
FROM ejercicios_detalles ed
ORDER BY ed.activity_id, ed.id;

-- Mostrar organizaciones migradas
SELECT 
    'ORGANIZACIONES MIGRADAS' as info,
    oe.id,
    oe.activity_id,
    oe.ejercicio_id,
    oe.bloque,
    oe.dia,
    oe.semana,
    oe.numero_periodo,
    ed.nombre_ejercicio
FROM organizacion_ejercicios oe
JOIN ejercicios_detalles ed ON ed.id = oe.ejercicio_id
ORDER BY oe.activity_id, oe.numero_periodo, oe.semana, oe.dia;

-- Mostrar intensidades migradas
SELECT 
    'INTENSIDADES MIGRADAS' as info,
    i.id,
    i.ejercicio_id,
    i.nombre,
    i.orden,
    i.reps,
    i.series,
    i.peso,
    ed.nombre_ejercicio
FROM intensidades i
JOIN ejercicios_detalles ed ON ed.id = i.ejercicio_id
ORDER BY i.ejercicio_id, i.orden;
