-- =====================================================
-- MIGRACIÓN SIMPLE DE fitness_exercises
-- =====================================================

-- =====================================================
-- PASO 1: LIMPIAR TODO
-- =====================================================

-- Eliminar todos los datos existentes
DELETE FROM ejecuciones_ejercicio;
DELETE FROM intensidades;
DELETE FROM organizacion_ejercicios;
DELETE FROM ejercicios_detalles;

-- =====================================================
-- PASO 2: MIGRAR EJERCICIOS ÚNICOS
-- =====================================================

-- Insertar solo ejercicios únicos
INSERT INTO ejercicios_detalles (
    activity_id,
    nombre_ejercicio,
    tipo,
    descripcion,
    equipo,
    variantes,
    body_parts,
    replicar
)
SELECT DISTINCT
    fe.activity_id,
    fe.nombre_actividad,
    LOWER(fe.tipo_ejercicio) as tipo,
    fe.descripción as descripcion,
    fe.equipo_necesario as equipo,
    jsonb_build_object(
        'detalle_series', fe.detalle_series,
        'duracion_min', fe.duracion_min,
        'calorias', fe.calorias,
        'nivel_intensidad', fe.nivel_intensidad
    ) as variantes,
    fe.body_parts,
    true as replicar
FROM fitness_exercises fe
WHERE fe.client_id IS NOT NULL;

-- =====================================================
-- PASO 3: MIGRAR ORGANIZACIONES
-- =====================================================

-- Insertar organizaciones únicas
INSERT INTO organizacion_ejercicios (
    activity_id,
    ejercicio_id,
    bloque,
    dia,
    semana,
    numero_periodo
)
SELECT DISTINCT
    fe.activity_id,
    ed.id as ejercicio_id,
    fe.bloque::TEXT as bloque,
    1 as dia,
    1 as semana,
    fe.bloque as numero_periodo
FROM fitness_exercises fe
JOIN ejercicios_detalles ed ON ed.activity_id = fe.activity_id 
    AND ed.nombre_ejercicio = fe.nombre_actividad
WHERE fe.client_id IS NOT NULL;

-- =====================================================
-- PASO 4: MIGRAR INTENSIDADES
-- =====================================================

-- Insertar intensidades únicas con valores por defecto
INSERT INTO intensidades (
    ejercicio_id,
    nombre,
    orden,
    reps,
    series,
    peso,
    duracion_minutos,
    descanso_segundos
)
SELECT DISTINCT
    ed.id as ejercicio_id,
    fe.nivel_intensidad as nombre,
    fe.bloque as orden,
    10 as reps, -- Valor por defecto
    3 as series, -- Valor por defecto
    0 as peso, -- Valor por defecto
    fe.duracion_min as duracion_minutos,
    60 as descanso_segundos -- Valor por defecto
FROM fitness_exercises fe
JOIN ejercicios_detalles ed ON ed.activity_id = fe.activity_id 
    AND ed.nombre_ejercicio = fe.nombre_actividad
WHERE fe.client_id IS NOT NULL;

-- =====================================================
-- PASO 5: CREAR EJECUCIONES
-- =====================================================

-- Crear ejecuciones únicas
INSERT INTO ejecuciones_ejercicio (
    periodo_id,
    ejercicio_id,
    intensidad_aplicada,
    duracion,
    calorias_estimadas,
    fecha_ejecucion,
    completado
)
SELECT DISTINCT
    pa.id as periodo_id,
    ed.id as ejercicio_id,
    fe.nivel_intensidad as intensidad_aplicada,
    fe.duracion_min as duracion,
    fe.calorias as calorias_estimadas,
    pa.fecha_inicio + (fe.bloque - 1) * INTERVAL '1 day' as fecha_ejecucion,
    false as completado
FROM fitness_exercises fe
JOIN ejercicios_detalles ed ON ed.activity_id = fe.activity_id 
    AND ed.nombre_ejercicio = fe.nombre_actividad
JOIN activity_enrollments ae ON ae.activity_id = fe.activity_id
JOIN periodos_asignados pa ON pa.enrollment_id = ae.id
WHERE fe.client_id IS NOT NULL;

-- =====================================================
-- PASO 6: MOSTRAR RESULTADOS
-- =====================================================

-- Mostrar estadísticas
SELECT 
    'ESTADÍSTICAS' as info,
    'ejercicios_detalles' as tabla, COUNT(*) as registros FROM ejercicios_detalles
UNION ALL
SELECT 
    'ESTADÍSTICAS' as info,
    'organizacion_ejercicios' as tabla, COUNT(*) as registros FROM organizacion_ejercicios
UNION ALL
SELECT 
    'ESTADÍSTICAS' as info,
    'intensidades' as tabla, COUNT(*) as registros FROM intensidades
UNION ALL
SELECT 
    'ESTADÍSTICAS' as info,
    'ejecuciones_ejercicio' as tabla, COUNT(*) as registros FROM ejecuciones_ejercicio;

-- Mostrar ejercicios migrados
SELECT 
    'EJERCICIOS MIGRADOS' as info,
    ed.id,
    ed.nombre_ejercicio,
    ed.tipo,
    ed.equipo
FROM ejercicios_detalles ed
ORDER BY ed.id;
