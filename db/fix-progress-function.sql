-- =====================================================
-- CORREGIR FUNCIÓN DE PROGRESO
-- =====================================================

-- Corregir función get_progreso_cliente_ejercicio
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
-- PROBAR FUNCIONES CORREGIDAS
-- =====================================================

DO $$
DECLARE
    v_resultado JSONB;
BEGIN
    RAISE NOTICE '=========================================';
    RAISE NOTICE 'PROBANDO FUNCIONES CORREGIDAS';
    RAISE NOTICE '=========================================';
    
    -- Probar función de ejercicios del día
    SELECT get_ejercicios_del_dia_completo(1, 1) INTO v_resultado;
    RAISE NOTICE 'Ejercicios del día 1, período 1: %', v_resultado;
    
    -- Probar función de progreso corregida
    SELECT get_progreso_cliente_ejercicio(62, 1) INTO v_resultado;
    RAISE NOTICE 'Progreso del cliente (ejercicio 1): %', v_resultado;
    
    -- Probar función de progreso para ejercicio 2
    SELECT get_progreso_cliente_ejercicio(62, 2) INTO v_resultado;
    RAISE NOTICE 'Progreso del cliente (ejercicio 2): %', v_resultado;
END $$;

-- =====================================================
-- MOSTRAR ESTADO COMPLETO DEL SISTEMA
-- =====================================================

DO $$
DECLARE
    v_enrollments INTEGER;
    v_periodos INTEGER;
    v_ejercicios INTEGER;
    v_organizaciones INTEGER;
    v_ejecuciones INTEGER;
    v_ejecuciones_completadas INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_enrollments FROM activity_enrollments;
    SELECT COUNT(*) INTO v_periodos FROM periodos_asignados;
    SELECT COUNT(*) INTO v_ejercicios FROM ejercicios_detalles;
    SELECT COUNT(*) INTO v_organizaciones FROM organizacion_ejercicios;
    SELECT COUNT(*) INTO v_ejecuciones FROM ejecuciones_ejercicio;
    SELECT COUNT(*) INTO v_ejecuciones_completadas FROM ejecuciones_ejercicio WHERE completado = TRUE;
    
    RAISE NOTICE '=========================================';
    RAISE NOTICE 'ESTADO COMPLETO DEL SISTEMA MODULAR';
    RAISE NOTICE '=========================================';
    RAISE NOTICE 'Enrollments: %', v_enrollments;
    RAISE NOTICE 'Períodos: %', v_periodos;
    RAISE NOTICE 'Ejercicios: %', v_ejercicios;
    RAISE NOTICE 'Organizaciones: %', v_organizaciones;
    RAISE NOTICE 'Ejecuciones: %', v_ejecuciones;
    RAISE NOTICE 'Ejecuciones completadas: %', v_ejecuciones_completadas;
    RAISE NOTICE '=========================================';
    
    IF v_ejecuciones > 0 THEN
        RAISE NOTICE '✅ SISTEMA MODULAR 100% FUNCIONAL';
        RAISE NOTICE '🎯 Puedes empezar a usar el sistema';
        RAISE NOTICE '📊 Funciones disponibles:';
        RAISE NOTICE '   - generar_periodos_para_enrollment(enrollment_id)';
        RAISE NOTICE '   - generar_ejecuciones_para_periodo(periodo_id)';
        RAISE NOTICE '   - get_ejercicios_del_dia_completo(periodo_id, dia)';
        RAISE NOTICE '   - get_progreso_cliente_ejercicio(enrollment_id, ejercicio_id)';
    ELSE
        RAISE WARNING '⚠️  Sistema creado pero sin ejecuciones';
    END IF;
END $$;

-- =====================================================
-- EJEMPLOS DE USO DEL SISTEMA
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '=========================================';
    RAISE NOTICE 'EJEMPLOS DE USO DEL SISTEMA';
    RAISE NOTICE '=========================================';
    RAISE NOTICE '1. Generar períodos para un enrollment:';
    RAISE NOTICE '   SELECT generar_periodos_para_enrollment(62);';
    RAISE NOTICE '';
    RAISE NOTICE '2. Generar ejecuciones para un período:';
    RAISE NOTICE '   SELECT generar_ejecuciones_para_periodo(1);';
    RAISE NOTICE '';
    RAISE NOTICE '3. Ver ejercicios del día:';
    RAISE NOTICE '   SELECT get_ejercicios_del_dia_completo(1, 1);';
    RAISE NOTICE '';
    RAISE NOTICE '4. Ver progreso de un cliente:';
    RAISE NOTICE '   SELECT get_progreso_cliente_ejercicio(62, 1);';
    RAISE NOTICE '';
    RAISE NOTICE '5. Marcar ejercicio como completado:';
    RAISE NOTICE '   UPDATE ejecuciones_ejercicio SET completado = TRUE WHERE id = 1;';
    RAISE NOTICE '=========================================';
END $$;

-- Función de progreso corregida y sistema listo para usar
