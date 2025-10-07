-- =====================================================
-- MIGRAR fitness_exercises CON UPSERT PARA EVITAR DUPLICADOS
-- =====================================================

-- =====================================================
-- PASO 1: DESHABILITAR TRIGGERS DE USUARIO
-- =====================================================

-- Deshabilitar solo los triggers de usuario (no del sistema)
ALTER TABLE organizacion_ejercicios DISABLE TRIGGER trigger_validar_organizacion_ejercicios_insert;
ALTER TABLE organizacion_ejercicios DISABLE TRIGGER trigger_validar_organizacion_ejercicios_update;
ALTER TABLE organizacion_ejercicios DISABLE TRIGGER trigger_organizacion_ejercicios_updated_at;

ALTER TABLE ejercicios_detalles DISABLE TRIGGER trigger_auto_asignar_intensidad_default_ejercicio;
ALTER TABLE ejercicios_detalles DISABLE TRIGGER trigger_ejercicios_detalles_updated_at;
ALTER TABLE ejercicios_detalles DISABLE TRIGGER trigger_limpiar_datos_huerfanos_ejercicio;

ALTER TABLE ejecuciones_ejercicio DISABLE TRIGGER trigger_actualizar_estadisticas_actividad_ejecucion;
ALTER TABLE ejecuciones_ejercicio DISABLE TRIGGER trigger_actualizar_fecha_completado_ejecucion;
ALTER TABLE ejecuciones_ejercicio DISABLE TRIGGER trigger_ejecuciones_ejercicio_updated_at;

-- =====================================================
-- PASO 2: LIMPIAR DATOS EXISTENTES
-- =====================================================

-- Eliminar datos de prueba existentes
DELETE FROM ejecuciones_ejercicio WHERE ejercicio_id IN (1, 2);
DELETE FROM intensidades WHERE ejercicio_id IN (1, 2);
DELETE FROM organizacion_ejercicios WHERE ejercicio_id IN (1, 2);
DELETE FROM ejercicios_detalles WHERE id IN (1, 2);

-- =====================================================
-- PASO 3: MIGRAR EJERCICIOS ÚNICOS A ejercicios_detalles
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
        WHEN LOWER(fe.tipo_ejercicio) = 'aeróbico' THEN 'aeróbico'
        WHEN LOWER(fe.tipo_ejercicio) = 'hiit' THEN 'hiit'
        WHEN LOWER(fe.tipo_ejercicio) = 'funcional' THEN 'funcional'
        WHEN LOWER(fe.tipo_ejercicio) = 'flexibilidad' THEN 'flexibilidad'
        WHEN LOWER(fe.tipo_ejercicio) = 'fuerza' THEN 'fuerza'
        ELSE 'otro'
    END as tipo,
    fe.descripción as descripcion,
    fe.equipo_necesario as equipo,
    CASE 
        WHEN fe.detalle_series IS NOT NULL OR fe.duracion_min IS NOT NULL OR fe.calorias IS NOT NULL THEN
            jsonb_build_object(
                'detalle_series', fe.detalle_series,
                'duracion_min', fe.duracion_min,
                'calorias', fe.calorias,
                'nivel_intensidad', fe.nivel_intensidad,
                'video_url', COALESCE(fe.video_url, '')
            )
        ELSE NULL
    END as variantes,
    COALESCE(fe.body_parts, '') as body_parts,
    true as replicar,
    COALESCE(fe.created_at, NOW()) as created_at,
    COALESCE(fe.updated_at, NOW()) as updated_at
FROM fitness_exercises fe
WHERE fe.client_id IS NOT NULL -- Solo datos específicos de cliente
AND NOT EXISTS (
    SELECT 1 FROM ejercicios_detalles ed 
    WHERE ed.activity_id = fe.activity_id 
    AND ed.nombre_ejercicio = COALESCE(fe.nombre_actividad, 'Ejercicio sin nombre')
);

-- =====================================================
-- PASO 4: MIGRAR ORGANIZACIÓN CON UPSERT
-- =====================================================

-- Insertar organización de ejercicios usando UPSERT para evitar duplicados
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
    1 as dia, -- Día fijo ya que no hay columna día
    1 as semana, -- Semana fija ya que no hay columna semana
    fe.bloque as numero_periodo -- Usar bloque como número de período
FROM fitness_exercises fe
JOIN ejercicios_detalles ed ON ed.activity_id = fe.activity_id 
    AND ed.nombre_ejercicio = COALESCE(fe.nombre_actividad, 'Ejercicio sin nombre')
WHERE fe.client_id IS NOT NULL -- Solo datos específicos de cliente
ON CONFLICT (activity_id, ejercicio_id, dia, semana, numero_periodo, bloque) 
DO UPDATE SET
    updated_at = NOW();

-- =====================================================
-- PASO 5: MIGRAR INTENSIDADES CON UPSERT
-- =====================================================

-- Migrar intensidades desde fitness_exercises con UPSERT
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
    fe.bloque as orden,
    NULL as reps, -- No hay columna específica de reps
    NULL as series, -- No hay columna específica de series
    NULL as peso -- No hay columna específica de peso
FROM fitness_exercises fe
JOIN ejercicios_detalles ed ON ed.activity_id = fe.activity_id 
    AND ed.nombre_ejercicio = COALESCE(fe.nombre_actividad, 'Ejercicio sin nombre')
WHERE fe.client_id IS NOT NULL -- Solo datos específicos de cliente
ON CONFLICT (ejercicio_id, nombre, orden) 
DO UPDATE SET
    updated_at = NOW();

-- =====================================================
-- PASO 6: CREAR EJECUCIONES PARA ENROLLMENTS EXISTENTES
-- =====================================================

-- Crear ejecuciones para enrollments existentes
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
    nota_coach
)
SELECT 
    pa.id as periodo_id,
    ed.id as ejercicio_id,
    COALESCE(fe.nivel_intensidad, 'Intermedio') as intensidad_aplicada,
    fe.duracion_min as duracion,
    fe.calorias as calorias_estimadas,
    pa.fecha_inicio + (fe.bloque - 1) * INTERVAL '1 day' as fecha_ejecucion,
    false as completado,
    NULL as peso_usado,
    NULL as repeticiones_realizadas,
    NULL as series_completadas,
    NULL as tiempo_real_segundos,
    NULL as nota_cliente,
    NULL as nota_coach
FROM fitness_exercises fe
JOIN ejercicios_detalles ed ON ed.activity_id = fe.activity_id 
    AND ed.nombre_ejercicio = COALESCE(fe.nombre_actividad, 'Ejercicio sin nombre')
JOIN activity_enrollments ae ON ae.activity_id = fe.activity_id
JOIN periodos_asignados pa ON pa.enrollment_id = ae.id
WHERE fe.client_id IS NOT NULL
ON CONFLICT (periodo_id, ejercicio_id, fecha_ejecucion) 
DO UPDATE SET
    intensidad_aplicada = EXCLUDED.intensidad_aplicada,
    duracion = EXCLUDED.duracion,
    calorias_estimadas = EXCLUDED.calorias_estimadas,
    updated_at = NOW();

-- =====================================================
-- PASO 7: HABILITAR TRIGGERS DE USUARIO NUEVAMENTE
-- =====================================================

-- Habilitar solo los triggers de usuario
ALTER TABLE organizacion_ejercicios ENABLE TRIGGER trigger_validar_organizacion_ejercicios_insert;
ALTER TABLE organizacion_ejercicios ENABLE TRIGGER trigger_validar_organizacion_ejercicios_update;
ALTER TABLE organizacion_ejercicios ENABLE TRIGGER trigger_organizacion_ejercicios_updated_at;

ALTER TABLE ejercicios_detalles ENABLE TRIGGER trigger_auto_asignar_intensidad_default_ejercicio;
ALTER TABLE ejercicios_detalles ENABLE TRIGGER trigger_ejercicios_detalles_updated_at;
ALTER TABLE ejercicios_detalles ENABLE TRIGGER trigger_limpiar_datos_huerfanos_ejercicio;

ALTER TABLE ejecuciones_ejercicio ENABLE TRIGGER trigger_actualizar_estadisticas_actividad_ejecucion;
ALTER TABLE ejecuciones_ejercicio ENABLE TRIGGER trigger_actualizar_fecha_completado_ejecucion;
ALTER TABLE ejecuciones_ejercicio ENABLE TRIGGER trigger_ejecuciones_ejercicio_updated_at;

-- =====================================================
-- PASO 8: VERIFICAR MIGRACIÓN
-- =====================================================

DO $$
DECLARE
    v_ejercicios_migrados INTEGER;
    v_organizaciones_migradas INTEGER;
    v_intensidades_migradas INTEGER;
    v_ejecuciones_migradas INTEGER;
    v_fitness_exercises_count INTEGER;
BEGIN
    -- Contar registros migrados
    SELECT COUNT(*) INTO v_ejercicios_migrados FROM ejercicios_detalles;
    SELECT COUNT(*) INTO v_organizaciones_migradas FROM organizacion_ejercicios;
    SELECT COUNT(*) INTO v_intensidades_migradas FROM intensidades;
    SELECT COUNT(*) INTO v_ejecuciones_migradas FROM ejecuciones_ejercicio;
    SELECT COUNT(*) INTO v_fitness_exercises_count FROM fitness_exercises;
    
    RAISE NOTICE '=========================================';
    RAISE NOTICE 'RESULTADO DE LA MIGRACIÓN';
    RAISE NOTICE '=========================================';
    RAISE NOTICE 'Ejercicios migrados a ejercicios_detalles: %', v_ejercicios_migrados;
    RAISE NOTICE 'Organizaciones migradas: %', v_organizaciones_migradas;
    RAISE NOTICE 'Intensidades migradas: %', v_intensidades_migradas;
    RAISE NOTICE 'Ejecuciones migradas: %', v_ejecuciones_migradas;
    RAISE NOTICE 'Registros en fitness_exercises: %', v_fitness_exercises_count;
    RAISE NOTICE '=========================================';
    
    IF v_ejercicios_migrados > 0 THEN
        RAISE NOTICE '✅ Migración exitosa';
        RAISE NOTICE '📊 Puedes verificar los datos migrados con:';
        RAISE NOTICE '   SELECT * FROM ejercicios_detalles;';
        RAISE NOTICE '   SELECT * FROM organizacion_ejercicios;';
        RAISE NOTICE '   SELECT * FROM intensidades;';
        RAISE NOTICE '   SELECT * FROM ejecuciones_ejercicio;';
    ELSE
        RAISE WARNING '⚠️  No se migraron ejercicios';
    END IF;
END $$;

-- =====================================================
-- PASO 9: MOSTRAR DATOS MIGRADOS
-- =====================================================

-- Mostrar ejercicios migrados
SELECT 
    'EJERCICIOS MIGRADOS' as info,
    ed.id,
    ed.activity_id,
    ed.nombre_ejercicio,
    ed.tipo,
    ed.equipo,
    ed.body_parts
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
ORDER BY oe.activity_id, oe.numero_periodo, oe.bloque;

-- Mostrar intensidades migradas
SELECT 
    'INTENSIDADES MIGRADAS' as info,
    i.id,
    i.ejercicio_id,
    i.nombre,
    i.orden,
    ed.nombre_ejercicio
FROM intensidades i
JOIN ejercicios_detalles ed ON ed.id = i.ejercicio_id
ORDER BY i.ejercicio_id, i.orden;

-- Mostrar ejecuciones migradas
SELECT 
    'EJECUCIONES MIGRADAS' as info,
    ee.id,
    ee.periodo_id,
    ee.ejercicio_id,
    ee.intensidad_aplicada,
    ee.fecha_ejecucion,
    ee.completado,
    ed.nombre_ejercicio
FROM ejecuciones_ejercicio ee
JOIN ejercicios_detalles ed ON ed.id = ee.ejercicio_id
ORDER BY ee.periodo_id, ee.fecha_ejecucion;
