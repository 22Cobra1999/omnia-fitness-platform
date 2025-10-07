-- =====================================================
-- FUNCIONES AUXILIARES PARA EL ESQUEMA MODULAR
-- =====================================================
-- Funciones para automatizar la gestión de períodos,
-- generación de ejecuciones y cálculos de fechas

-- =====================================================
-- 1. FUNCIÓN PRINCIPAL: generar_periodos_para_enrollment
-- =====================================================
-- Objetivo: Cuando un cliente activa una actividad:
-- - Se toma la estructura del CSV cargado (de organización_ejercicios)
-- - Se cuenta la duración total del período base
-- - Se lee la cantidad de veces a replicar desde el campo replicar
-- - Se insertan N filas en periodos_asignados
-- - Se calcula automáticamente fecha_inicio y fecha_fin de cada período
-- - Se actualiza el expiration_date en activity_enrollments

CREATE OR REPLACE FUNCTION generar_periodos_para_enrollment(
    p_enrollment_id INTEGER,
    p_duracion_periodo_dias INTEGER DEFAULT 7, -- Duración de cada período en días
    p_cantidad_periodos INTEGER DEFAULT NULL -- Si es NULL, se calcula automáticamente
) RETURNS JSONB AS $$
DECLARE
    v_enrollment RECORD;
    v_activity RECORD;
    v_periodos_creados INTEGER := 0;
    v_fecha_inicio DATE;
    v_fecha_fin DATE;
    v_periodo_actual INTEGER := 1;
    v_resultado JSONB;
    v_duracion_total INTEGER;
    v_cantidad_periodos INTEGER;
BEGIN
    -- Validar que el enrollment existe y está en estado 'pendiente'
    SELECT * INTO v_enrollment 
    FROM activity_enrollments 
    WHERE id = p_enrollment_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Enrollment no encontrado',
            'enrollment_id', p_enrollment_id
        );
    END IF;
    
    IF v_enrollment.status != 'pendiente' THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'El enrollment debe estar en estado pendiente para generar períodos',
            'current_status', v_enrollment.status
        );
    END IF;
    
    -- Obtener información de la actividad
    SELECT * INTO v_activity 
    FROM activities 
    WHERE id = v_enrollment.activity_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Actividad no encontrada',
            'activity_id', v_enrollment.activity_id
        );
    END IF;
    
    -- Calcular cantidad de períodos si no se especifica
    IF p_cantidad_periodos IS NULL THEN
        -- Contar períodos únicos en la organización de ejercicios
        SELECT COUNT(DISTINCT numero_periodo) INTO v_cantidad_periodos
        FROM organizacion_ejercicios 
        WHERE activity_id = v_activity.id;
        
        -- Si no hay ejercicios organizados, usar duración por defecto
        IF v_cantidad_periodos = 0 THEN
            v_cantidad_periodos := 4; -- 4 semanas por defecto
        END IF;
    ELSE
        v_cantidad_periodos := p_cantidad_periodos;
    END IF;
    
    -- Calcular fechas
    v_fecha_inicio := COALESCE(v_enrollment.start_date, CURRENT_DATE);
    v_duracion_total := v_cantidad_periodos * p_duracion_periodo_dias;
    
    -- Generar períodos
    WHILE v_periodo_actual <= v_cantidad_periodos LOOP
        v_fecha_fin := v_fecha_inicio + (p_duracion_periodo_dias - 1);
        
        -- Insertar período
        INSERT INTO periodos_asignados (
            enrollment_id,
            numero_periodo,
            fecha_inicio,
            fecha_fin
        ) VALUES (
            p_enrollment_id,
            v_periodo_actual,
            v_fecha_inicio,
            v_fecha_fin
        );
        
        v_periodos_creados := v_periodos_creados + 1;
        
        -- Preparar siguiente período
        v_fecha_inicio := v_fecha_fin + 1;
        v_periodo_actual := v_periodo_actual + 1;
    END LOOP;
    
    -- Actualizar enrollment con fecha de expiración y estado
    UPDATE activity_enrollments 
    SET 
        expiration_date = v_fecha_fin,
        status = 'activa',
        start_date = COALESCE(start_date, CURRENT_DATE)
    WHERE id = p_enrollment_id;
    
    -- Construir resultado
    v_resultado := jsonb_build_object(
        'success', true,
        'enrollment_id', p_enrollment_id,
        'activity_id', v_activity.id,
        'periodos_creados', v_periodos_creados,
        'fecha_inicio', v_enrollment.start_date,
        'fecha_fin', v_fecha_fin,
        'duracion_total_dias', v_duracion_total,
        'cantidad_periodos', v_cantidad_periodos
    );
    
    RETURN v_resultado;
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM,
            'sqlstate', SQLSTATE
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 2. FUNCIÓN: generar_ejecuciones_para_periodo
-- =====================================================
-- Genera automáticamente las ejecuciones de ejercicios para un período específico

CREATE OR REPLACE FUNCTION generar_ejecuciones_para_periodo(
    p_periodo_id INTEGER,
    p_intensidad_default TEXT DEFAULT 'Intermedio'
) RETURNS JSONB AS $$
DECLARE
    v_periodo RECORD;
    v_ejercicio RECORD;
    v_ejecuciones_creadas INTEGER := 0;
    v_fecha_actual DATE;
    v_resultado JSONB;
BEGIN
    -- Obtener información del período
    SELECT pa.*, ae.activity_id, ae.client_id
    INTO v_periodo
    FROM periodos_asignados pa
    JOIN activity_enrollments ae ON ae.id = pa.enrollment_id
    WHERE pa.id = p_periodo_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Período no encontrado',
            'periodo_id', p_periodo_id
        );
    END IF;
    
    -- Generar ejecuciones para cada día del período
    v_fecha_actual := v_periodo.fecha_inicio;
    
    WHILE v_fecha_actual <= v_periodo.fecha_fin LOOP
        -- Obtener ejercicios para este día (basado en día de la semana)
        FOR v_ejercicio IN 
            SELECT DISTINCT oe.ejercicio_id, ed.nombre_ejercicio
            FROM organizacion_ejercicios oe
            JOIN ejercicios_detalles ed ON ed.id = oe.ejercicio_id
            WHERE oe.activity_id = v_periodo.activity_id
            AND oe.dia = EXTRACT(DOW FROM v_fecha_actual) + 1 -- Ajustar para que lunes=1
        LOOP
            -- Insertar ejecución
            INSERT INTO ejecuciones_ejercicio (
                periodo_id,
                ejercicio_id,
                intensidad_aplicada,
                fecha_ejecucion
            ) VALUES (
                p_periodo_id,
                v_ejercicio.ejercicio_id,
                p_intensidad_default,
                v_fecha_actual
            );
            
            v_ejecuciones_creadas := v_ejecuciones_creadas + 1;
        END LOOP;
        
        v_fecha_actual := v_fecha_actual + 1;
    END LOOP;
    
    v_resultado := jsonb_build_object(
        'success', true,
        'periodo_id', p_periodo_id,
        'ejecuciones_creadas', v_ejecuciones_creadas,
        'fecha_inicio', v_periodo.fecha_inicio,
        'fecha_fin', v_periodo.fecha_fin
    );
    
    RETURN v_resultado;
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM,
            'sqlstate', SQLSTATE
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 3. FUNCIÓN: obtener_ejercicios_del_dia
-- =====================================================
-- Obtiene todos los ejercicios programados para un cliente en una fecha específica

CREATE OR REPLACE FUNCTION obtener_ejercicios_del_dia(
    p_client_id UUID,
    p_fecha DATE
) RETURNS TABLE (
    ejecucion_id INTEGER,
    ejercicio_id INTEGER,
    nombre_ejercicio TEXT,
    tipo TEXT,
    descripcion TEXT,
    equipo TEXT,
    variantes JSONB,
    body_parts TEXT,
    intensidad_aplicada TEXT,
    duracion INTEGER,
    calorias_estimadas INTEGER,
    completado BOOLEAN,
    peso_usado DECIMAL(5,2),
    repeticiones_realizadas INTEGER,
    series_completadas INTEGER,
    nota_cliente TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ee.id as ejecucion_id,
        ee.ejercicio_id,
        ed.nombre_ejercicio,
        ed.tipo,
        ed.descripcion,
        ed.equipo,
        ed.variantes,
        ed.body_parts,
        ee.intensidad_aplicada,
        ee.duracion,
        ee.calorias_estimadas,
        ee.completado,
        ee.peso_usado,
        ee.repeticiones_realizadas,
        ee.series_completadas,
        ee.nota_cliente
    FROM ejecuciones_ejercicio ee
    JOIN ejercicios_detalles ed ON ed.id = ee.ejercicio_id
    JOIN periodos_asignados pa ON pa.id = ee.periodo_id
    JOIN activity_enrollments ae ON ae.id = pa.enrollment_id
    WHERE ae.client_id = p_client_id
    AND ee.fecha_ejecucion = p_fecha
    ORDER BY ed.tipo, ed.nombre_ejercicio;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 4. FUNCIÓN: calcular_progreso_cliente
-- =====================================================
-- Calcula estadísticas de progreso para un cliente en una actividad

CREATE OR REPLACE FUNCTION calcular_progreso_cliente(
    p_client_id UUID,
    p_activity_id INTEGER
) RETURNS JSONB AS $$
DECLARE
    v_total_ejecuciones INTEGER;
    v_ejecuciones_completadas INTEGER;
    v_porcentaje_completado DECIMAL(5,2);
    v_calorias_totales INTEGER;
    v_tiempo_total_minutos INTEGER;
    v_resultado JSONB;
BEGIN
    -- Contar ejecuciones totales y completadas
    SELECT 
        COUNT(*),
        COUNT(*) FILTER (WHERE completado = true),
        COALESCE(SUM(calorias_estimadas), 0),
        COALESCE(SUM(duracion), 0)
    INTO 
        v_total_ejecuciones,
        v_ejecuciones_completadas,
        v_calorias_totales,
        v_tiempo_total_minutos
    FROM ejecuciones_ejercicio ee
    JOIN periodos_asignados pa ON pa.id = ee.periodo_id
    JOIN activity_enrollments ae ON ae.id = pa.enrollment_id
    WHERE ae.client_id = p_client_id
    AND ae.activity_id = p_activity_id;
    
    -- Calcular porcentaje
    IF v_total_ejecuciones > 0 THEN
        v_porcentaje_completado := (v_ejecuciones_completadas::DECIMAL / v_total_ejecuciones) * 100;
    ELSE
        v_porcentaje_completado := 0;
    END IF;
    
    v_resultado := jsonb_build_object(
        'client_id', p_client_id,
        'activity_id', p_activity_id,
        'total_ejecuciones', v_total_ejecuciones,
        'ejecuciones_completadas', v_ejecuciones_completadas,
        'porcentaje_completado', v_porcentaje_completado,
        'calorias_totales', v_calorias_totales,
        'tiempo_total_minutos', v_tiempo_total_minutos
    );
    
    RETURN v_resultado;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 5. FUNCIÓN: duplicar_ejercicio_como_plantilla
-- =====================================================
-- Duplica un ejercicio existente para crear una nueva plantilla

CREATE OR REPLACE FUNCTION duplicar_ejercicio_como_plantilla(
    p_ejercicio_id INTEGER,
    p_nueva_activity_id INTEGER,
    p_nuevo_nombre TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
    v_ejercicio_original RECORD;
    v_nuevo_ejercicio_id INTEGER;
    v_resultado JSONB;
BEGIN
    -- Obtener ejercicio original
    SELECT * INTO v_ejercicio_original
    FROM ejercicios_detalles
    WHERE id = p_ejercicio_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Ejercicio original no encontrado',
            'ejercicio_id', p_ejercicio_id
        );
    END IF;
    
    -- Crear nuevo ejercicio
    INSERT INTO ejercicios_detalles (
        activity_id,
        nombre_ejercicio,
        tipo,
        descripcion,
        equipo,
        variantes,
        body_parts,
        replicar,
        created_by
    ) VALUES (
        p_nueva_activity_id,
        COALESCE(p_nuevo_nombre, v_ejercicio_original.nombre_ejercicio || ' (Copia)'),
        v_ejercicio_original.tipo,
        v_ejercicio_original.descripcion,
        v_ejercicio_original.equipo,
        v_ejercicio_original.variantes,
        v_ejercicio_original.body_parts,
        v_ejercicio_original.replicar,
        auth.uid()
    ) RETURNING id INTO v_nuevo_ejercicio_id;
    
    v_resultado := jsonb_build_object(
        'success', true,
        'ejercicio_original_id', p_ejercicio_id,
        'nuevo_ejercicio_id', v_nuevo_ejercicio_id,
        'nueva_activity_id', p_nueva_activity_id,
        'nombre_ejercicio', COALESCE(p_nuevo_nombre, v_ejercicio_original.nombre_ejercicio || ' (Copia)')
    );
    
    RETURN v_resultado;
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM,
            'sqlstate', SQLSTATE
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 6. FUNCIÓN: obtener_estadisticas_coach
-- =====================================================
-- Obtiene estadísticas generales para un coach

CREATE OR REPLACE FUNCTION obtener_estadisticas_coach(
    p_coach_id UUID
) RETURNS JSONB AS $$
DECLARE
    v_total_actividades INTEGER;
    v_total_clientes INTEGER;
    v_total_ejercicios INTEGER;
    v_ejecuciones_completadas INTEGER;
    v_resultado JSONB;
BEGIN
    -- Contar actividades del coach
    SELECT COUNT(*) INTO v_total_actividades
    FROM activities
    WHERE coach_id = p_coach_id;
    
    -- Contar clientes únicos
    SELECT COUNT(DISTINCT ae.client_id) INTO v_total_clientes
    FROM activity_enrollments ae
    JOIN activities a ON a.id = ae.activity_id
    WHERE a.coach_id = p_coach_id;
    
    -- Contar ejercicios creados
    SELECT COUNT(*) INTO v_total_ejercicios
    FROM ejercicios_detalles ed
    JOIN activities a ON a.id = ed.activity_id
    WHERE a.coach_id = p_coach_id;
    
    -- Contar ejecuciones completadas
    SELECT COUNT(*) INTO v_ejecuciones_completadas
    FROM ejecuciones_ejercicio ee
    JOIN periodos_asignados pa ON pa.id = ee.periodo_id
    JOIN activity_enrollments ae ON ae.id = pa.enrollment_id
    JOIN activities a ON a.id = ae.activity_id
    WHERE a.coach_id = p_coach_id
    AND ee.completado = true;
    
    v_resultado := jsonb_build_object(
        'coach_id', p_coach_id,
        'total_actividades', v_total_actividades,
        'total_clientes', v_total_clientes,
        'total_ejercicios', v_total_ejercicios,
        'ejecuciones_completadas', v_ejecuciones_completadas
    );
    
    RETURN v_resultado;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- COMENTARIOS PARA DOCUMENTACIÓN
-- =====================================================

COMMENT ON FUNCTION generar_periodos_para_enrollment IS 'Función principal para generar períodos automáticamente cuando un cliente activa una actividad';
COMMENT ON FUNCTION generar_ejecuciones_para_periodo IS 'Genera automáticamente las ejecuciones de ejercicios para un período específico';
COMMENT ON FUNCTION obtener_ejercicios_del_dia IS 'Obtiene todos los ejercicios programados para un cliente en una fecha específica';
COMMENT ON FUNCTION calcular_progreso_cliente IS 'Calcula estadísticas de progreso para un cliente en una actividad';
COMMENT ON FUNCTION duplicar_ejercicio_como_plantilla IS 'Duplica un ejercicio existente para crear una nueva plantilla';
COMMENT ON FUNCTION obtener_estadisticas_coach IS 'Obtiene estadísticas generales para un coach';

RAISE NOTICE 'Funciones auxiliares del esquema modular creadas exitosamente';
