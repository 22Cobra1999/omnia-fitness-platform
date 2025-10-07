-- =====================================================
-- CORREGIR PROBLEMAS DE MIGRACIÓN
-- =====================================================

-- =====================================================
-- PASO 1: MIGRAR INTENSIDADES FALTANTES
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
WHERE fe.client_id IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM intensidades i 
    WHERE i.ejercicio_id = ed.id
    AND i.nombre = fe.nivel_intensidad
    AND i.orden = fe.bloque
);

-- =====================================================
-- PASO 2: CREAR EJECUCIONES FALTANTES
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
WHERE fe.client_id IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM ejecuciones_ejercicio ee 
    WHERE ee.periodo_id = pa.id
    AND ee.ejercicio_id = ed.id
    AND ee.fecha_ejecucion = pa.fecha_inicio + (fe.bloque - 1) * INTERVAL '1 day'
);

-- =====================================================
-- PASO 3: CORREGIR FUNCIÓN DE PROGRESO
-- =====================================================

-- Eliminar función existente
DROP FUNCTION IF EXISTS get_progreso_cliente_ejercicio(INTEGER, INTEGER);

-- Crear función corregida
CREATE OR REPLACE FUNCTION get_progreso_cliente_ejercicio(
    p_enrollment_id INTEGER,
    p_ejercicio_id INTEGER
)
RETURNS JSONB AS $$
DECLARE
    v_resultado JSONB;
    v_progreso JSONB;
BEGIN
    -- Obtener progreso del ejercicio específico
    SELECT jsonb_agg(
        jsonb_build_object(
            'ejecucion_id', ee.id,
            'periodo_id', ee.periodo_id,
            'numero_periodo', pa.numero_periodo,
            'fecha_ejecucion', ee.fecha_ejecucion,
            'completado', ee.completado,
            'duracion', ee.duracion,
            'calorias_estimadas', ee.calorias_estimadas,
            'intensidad_aplicada', ee.intensidad_aplicada,
            'peso_usado', ee.peso_usado,
            'repeticiones_realizadas', ee.repeticiones_realizadas,
            'series_completadas', ee.series_completadas,
            'tiempo_real_segundos', ee.tiempo_real_segundos,
            'nota_cliente', ee.nota_cliente,
            'nota_coach', ee.nota_coach
        )
    ) INTO v_progreso
    FROM ejecuciones_ejercicio ee
    JOIN periodos_asignados pa ON pa.id = ee.periodo_id
    WHERE pa.enrollment_id = p_enrollment_id
    AND ee.ejercicio_id = p_ejercicio_id
    ORDER BY pa.numero_periodo, ee.fecha_ejecucion;
    
    v_resultado := jsonb_build_object(
        'success', TRUE,
        'enrollment_id', p_enrollment_id,
        'ejercicio_id', p_ejercicio_id,
        'progreso', COALESCE(v_progreso, '[]'::jsonb),
        'total_ejecuciones', jsonb_array_length(COALESCE(v_progreso, '[]'::jsonb)),
        'ejecuciones_completadas', (
            SELECT COUNT(*) 
            FROM ejecuciones_ejercicio ee2
            JOIN periodos_asignados pa2 ON pa2.id = ee2.periodo_id
            WHERE pa2.enrollment_id = p_enrollment_id
            AND ee2.ejercicio_id = p_ejercicio_id
            AND ee2.completado = TRUE
        )
    );
    
    RETURN v_resultado;
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'error', SQLERRM,
            'enrollment_id', p_enrollment_id,
            'ejercicio_id', p_ejercicio_id
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- PASO 4: VERIFICAR CORRECCIONES
-- =====================================================

-- Mostrar estadísticas actualizadas
SELECT 
    'ESTADÍSTICAS ACTUALIZADAS' as info,
    'ejercicios_detalles' as tabla, COUNT(*) as registros FROM ejercicios_detalles
UNION ALL
SELECT 
    'ESTADÍSTICAS ACTUALIZADAS' as info,
    'organizacion_ejercicios' as tabla, COUNT(*) as registros FROM organizacion_ejercicios
UNION ALL
SELECT 
    'ESTADÍSTICAS ACTUALIZADAS' as info,
    'intensidades' as tabla, COUNT(*) as registros FROM intensidades
UNION ALL
SELECT 
    'ESTADÍSTICAS ACTUALIZADAS' as info,
    'ejecuciones_ejercicio' as tabla, COUNT(*) as registros FROM ejecuciones_ejercicio;

-- =====================================================
-- PASO 5: PROBAR FUNCIONES CORREGIDAS
-- =====================================================

-- Probar función de progreso corregida
SELECT 
    'FUNCIÓN DE PROGRESO CORREGIDA' as info,
    get_progreso_cliente_ejercicio(62, 167) as resultado;

-- Probar función de ejercicios del día
SELECT 
    'FUNCIÓN EJERCICIOS DEL DÍA' as info,
    get_ejercicios_del_dia_completo(1, 1) as resultado;

-- =====================================================
-- PASO 6: MOSTRAR MUESTRA DE DATOS
-- =====================================================

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
ORDER BY i.ejercicio_id, i.orden
LIMIT 10;

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
ORDER BY ee.fecha_ejecucion
LIMIT 10;
