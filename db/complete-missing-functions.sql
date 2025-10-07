-- =====================================================
-- COMPLETAR FUNCIONES FALTANTES Y CORREGIR EJECUCIONES
-- =====================================================

-- =====================================================
-- PASO 1: VERIFICAR POR QUÉ NO SE CREAN EJECUCIONES
-- =====================================================

DO $$
DECLARE
    v_ejercicios_count INTEGER;
    v_organizaciones_count INTEGER;
    v_periodos_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_ejercicios_count FROM ejercicios_detalles;
    SELECT COUNT(*) INTO v_organizaciones_count FROM organizacion_ejercicios;
    SELECT COUNT(*) INTO v_periodos_count FROM periodos_asignados;
    
    RAISE NOTICE '=========================================';
    RAISE NOTICE 'DIAGNÓSTICO DEL SISTEMA';
    RAISE NOTICE '=========================================';
    RAISE NOTICE 'Ejercicios en ejercicios_detalles: %', v_ejercicios_count;
    RAISE NOTICE 'Organizaciones en organizacion_ejercicios: %', v_organizaciones_count;
    RAISE NOTICE 'Períodos en periodos_asignados: %', v_periodos_count;
    RAISE NOTICE '=========================================';
    
    IF v_ejercicios_count = 0 THEN
        RAISE WARNING '⚠️  No hay ejercicios en ejercicios_detalles';
    END IF;
    
    IF v_organizaciones_count = 0 THEN
        RAISE WARNING '⚠️  No hay organizaciones en organizacion_ejercicios';
    END IF;
END $$;

-- =====================================================
-- PASO 2: CREAR DATOS DE PRUEBA SI NO EXISTEN
-- =====================================================

-- Crear ejercicios de prueba si no existen
INSERT INTO ejercicios_detalles (
    activity_id, nombre_ejercicio, tipo, descripcion, 
    equipo, variantes, body_parts, replicar
) 
SELECT 
    ae.activity_id,
    'Flexiones de pecho',
    'fuerza',
    'Ejercicio básico de fuerza para pecho y tríceps',
    'peso corporal',
    '[{"reps": 10, "series": 3, "peso": 0}, {"reps": 15, "series": 3, "peso": 0}]'::jsonb,
    'pecho;tríceps',
    true
FROM activity_enrollments ae 
WHERE ae.id = 62
AND NOT EXISTS (SELECT 1 FROM ejercicios_detalles WHERE activity_id = ae.activity_id)
LIMIT 1;

-- Crear más ejercicios de prueba
INSERT INTO ejercicios_detalles (
    activity_id, nombre_ejercicio, tipo, descripcion, 
    equipo, variantes, body_parts, replicar
) 
SELECT 
    ae.activity_id,
    'Sentadillas',
    'fuerza',
    'Ejercicio fundamental para piernas y glúteos',
    'peso corporal',
    '[{"reps": 12, "series": 3, "peso": 0}, {"reps": 20, "series": 3, "peso": 0}]'::jsonb,
    'cuádriceps;glúteos',
    true
FROM activity_enrollments ae 
WHERE ae.id = 62
AND NOT EXISTS (SELECT 1 FROM ejercicios_detalles WHERE activity_id = ae.activity_id AND nombre_ejercicio = 'Sentadillas')
LIMIT 1;

-- Crear organizaciones de ejercicios si no existen
INSERT INTO organizacion_ejercicios (
    activity_id, ejercicio_id, bloque, dia, semana, numero_periodo
)
SELECT 
    ed.activity_id,
    ed.id as ejercicio_id,
    'Mañana',
    1, -- Día 1
    1, -- Semana 1
    1  -- Período 1
FROM ejercicios_detalles ed
WHERE ed.activity_id = (SELECT activity_id FROM activity_enrollments WHERE id = 62)
AND NOT EXISTS (
    SELECT 1 FROM organizacion_ejercicios 
    WHERE activity_id = ed.activity_id AND ejercicio_id = ed.id
)
LIMIT 1;

-- Crear más organizaciones
INSERT INTO organizacion_ejercicios (
    activity_id, ejercicio_id, bloque, dia, semana, numero_periodo
)
SELECT 
    ed.activity_id,
    ed.id as ejercicio_id,
    'Tarde',
    2, -- Día 2
    1, -- Semana 1
    1  -- Período 1
FROM ejercicios_detalles ed
WHERE ed.activity_id = (SELECT activity_id FROM activity_enrollments WHERE id = 62)
AND ed.nombre_ejercicio = 'Sentadillas'
AND NOT EXISTS (
    SELECT 1 FROM organizacion_ejercicios 
    WHERE activity_id = ed.activity_id AND ejercicio_id = ed.id AND dia = 2
)
LIMIT 1;

-- =====================================================
-- PASO 3: CREAR FUNCIONES FALTANTES
-- =====================================================

-- Función para obtener ejercicios del día completo
CREATE OR REPLACE FUNCTION get_ejercicios_del_dia_completo(
    p_periodo_id INTEGER,
    p_dia INTEGER
)
RETURNS JSONB AS $$
DECLARE
    v_resultado JSONB;
    v_ejercicios JSONB;
BEGIN
    -- Obtener ejercicios del día específico
    SELECT jsonb_agg(
        jsonb_build_object(
            'ejercicio_id', ed.id,
            'nombre_ejercicio', ed.nombre_ejercicio,
            'tipo', ed.tipo,
            'descripcion', ed.descripcion,
            'equipo', ed.equipo,
            'variantes', ed.variantes,
            'body_parts', ed.body_parts,
            'bloque', oe.bloque,
            'dia', oe.dia,
            'semana', oe.semana
        )
    ) INTO v_ejercicios
    FROM organizacion_ejercicios oe
    JOIN ejercicios_detalles ed ON ed.id = oe.ejercicio_id
    JOIN periodos_asignados pa ON pa.id = p_periodo_id
    WHERE oe.activity_id = (SELECT activity_id FROM activity_enrollments WHERE id = pa.enrollment_id)
    AND oe.dia = p_dia
    AND oe.numero_periodo = pa.numero_periodo;
    
    v_resultado := jsonb_build_object(
        'success', TRUE,
        'periodo_id', p_periodo_id,
        'dia', p_dia,
        'ejercicios', COALESCE(v_ejercicios, '[]'::jsonb),
        'total_ejercicios', jsonb_array_length(COALESCE(v_ejercicios, '[]'::jsonb))
    );
    
    RETURN v_resultado;
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'error', SQLERRM,
            'periodo_id', p_periodo_id,
            'dia', p_dia
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener progreso de cliente
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
-- PASO 4: PROBAR GENERAR EJECUCIONES NUEVAMENTE
-- =====================================================

DO $$
DECLARE
    v_periodo_id INTEGER;
    v_resultado JSONB;
BEGIN
    -- Probar con el primer período
    SELECT id INTO v_periodo_id 
    FROM periodos_asignados 
    WHERE enrollment_id = 62 
    ORDER BY numero_periodo 
    LIMIT 1;
    
    IF v_periodo_id IS NOT NULL THEN
        RAISE NOTICE 'Probando generar ejecuciones para período ID: %', v_periodo_id;
        
        SELECT generar_ejecuciones_para_periodo(v_periodo_id) INTO v_resultado;
        RAISE NOTICE 'Resultado: %', v_resultado;
        
        IF (v_resultado->>'success')::BOOLEAN AND (v_resultado->>'ejecuciones_creadas')::INTEGER > 0 THEN
            RAISE NOTICE '✅ Ejecuciones generadas correctamente';
        ELSE
            RAISE WARNING '⚠️  No se generaron ejecuciones: %', v_resultado->>'ejecuciones_creadas';
        END IF;
    END IF;
END $$;

-- =====================================================
-- PASO 5: PROBAR FUNCIONES NUEVAS
-- =====================================================

DO $$
DECLARE
    v_resultado JSONB;
BEGIN
    -- Probar función de ejercicios del día
    SELECT get_ejercicios_del_dia_completo(1, 1) INTO v_resultado;
    RAISE NOTICE 'Ejercicios del día 1, período 1: %', v_resultado;
    
    -- Probar función de progreso
    SELECT get_progreso_cliente_ejercicio(62, 1) INTO v_resultado;
    RAISE NOTICE 'Progreso del cliente: %', v_resultado;
END $$;

-- =====================================================
-- PASO 6: MOSTRAR ESTADO FINAL
-- =====================================================

DO $$
DECLARE
    v_ejercicios INTEGER;
    v_organizaciones INTEGER;
    v_ejecuciones INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_ejercicios FROM ejercicios_detalles;
    SELECT COUNT(*) INTO v_organizaciones FROM organizacion_ejercicios;
    SELECT COUNT(*) INTO v_ejecuciones FROM ejecuciones_ejercicio;
    
    RAISE NOTICE '=========================================';
    RAISE NOTICE 'ESTADO FINAL DEL SISTEMA';
    RAISE NOTICE '=========================================';
    RAISE NOTICE 'Ejercicios: %', v_ejercicios;
    RAISE NOTICE 'Organizaciones: %', v_organizaciones;
    RAISE NOTICE 'Ejecuciones: %', v_ejecuciones;
    RAISE NOTICE '=========================================';
    
    IF v_ejecuciones > 0 THEN
        RAISE NOTICE '✅ Sistema completo y funcionando';
    ELSE
        RAISE WARNING '⚠️  Sistema creado pero sin ejecuciones';
    END IF;
END $$;

RAISE NOTICE 'Sistema completado y funciones creadas';
