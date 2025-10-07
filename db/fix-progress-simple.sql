-- =====================================================
-- CORREGIR FUNCIÓN DE PROGRESO - VERSIÓN SIMPLE
-- =====================================================

-- Eliminar función existente si hay problemas
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

-- Probar la función
SELECT get_progreso_cliente_ejercicio(62, 1) as resultado_progreso;

-- Mostrar estado del sistema
SELECT 
    'Enrollments' as tabla, COUNT(*) as cantidad FROM activity_enrollments
UNION ALL
SELECT 
    'Períodos' as tabla, COUNT(*) as cantidad FROM periodos_asignados
UNION ALL
SELECT 
    'Ejercicios' as tabla, COUNT(*) as cantidad FROM ejercicios_detalles
UNION ALL
SELECT 
    'Organizaciones' as tabla, COUNT(*) as cantidad FROM organizacion_ejercicios
UNION ALL
SELECT 
    'Ejecuciones' as tabla, COUNT(*) as cantidad FROM ejecuciones_ejercicio
UNION ALL
SELECT 
    'Ejecuciones Completadas' as tabla, COUNT(*) as cantidad FROM ejecuciones_ejercicio WHERE completado = TRUE;
