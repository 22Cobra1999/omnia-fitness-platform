-- =====================================================
-- CORREGIR SOLO LO ESENCIAL
-- =====================================================

-- =====================================================
-- 1. MIGRAR INTENSIDADES FALTANTES
-- =====================================================

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
    10 as reps,
    3 as series,
    0 as peso,
    fe.duracion_min as duracion_minutos,
    60 as descanso_segundos
FROM fitness_exercises fe
JOIN ejercicios_detalles ed ON ed.activity_id = fe.activity_id 
    AND ed.nombre_ejercicio = fe.nombre_actividad
WHERE fe.client_id IS NOT NULL;

-- =====================================================
-- 2. CREAR EJECUCIONES FALTANTES
-- =====================================================

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
-- 3. CORREGIR FUNCIÓN DE PROGRESO
-- =====================================================

DROP FUNCTION IF EXISTS get_progreso_cliente_ejercicio(INTEGER, INTEGER);

CREATE OR REPLACE FUNCTION get_progreso_cliente_ejercicio(
    p_enrollment_id INTEGER,
    p_ejercicio_id INTEGER
)
RETURNS JSONB AS $$
DECLARE
    v_resultado JSONB;
    v_progreso JSONB;
BEGIN
    SELECT jsonb_agg(
        jsonb_build_object(
            'ejecucion_id', ee.id,
            'periodo_id', ee.periodo_id,
            'numero_periodo', pa.numero_periodo,
            'fecha_ejecucion', ee.fecha_ejecucion,
            'completado', ee.completado,
            'intensidad_aplicada', ee.intensidad_aplicada
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
        'total_ejecuciones', jsonb_array_length(COALESCE(v_progreso, '[]'::jsonb))
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
-- 4. VERIFICAR
-- =====================================================

SELECT 
    'ESTADÍSTICAS' as info,
    'intensidades' as tabla, COUNT(*) as registros FROM intensidades
UNION ALL
SELECT 
    'ESTADÍSTICAS' as info,
    'ejecuciones_ejercicio' as tabla, COUNT(*) as registros FROM ejecuciones_ejercicio;

-- Probar función
SELECT get_progreso_cliente_ejercicio(62, 167) as resultado;
