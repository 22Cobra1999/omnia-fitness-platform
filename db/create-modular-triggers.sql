-- =====================================================
-- TRIGGERS PARA AUTOMATIZACIÓN DEL ESQUEMA MODULAR
-- =====================================================
-- Triggers para automatizar cálculos de fechas, generación de períodos
-- y mantenimiento de consistencia de datos

-- =====================================================
-- 1. TRIGGER: Auto-generar períodos al activar enrollment
-- =====================================================
-- Cuando un enrollment cambia de 'pendiente' a 'activa',
-- automáticamente genera los períodos correspondientes

CREATE OR REPLACE FUNCTION trigger_auto_generar_periodos()
RETURNS TRIGGER AS $$
DECLARE
    v_resultado JSONB;
BEGIN
    -- Solo procesar si el status cambió a 'activa'
    IF NEW.status = 'activa' AND (OLD.status IS NULL OR OLD.status != 'activa') THEN
        -- Llamar a la función para generar períodos
        SELECT generar_periodos_para_enrollment(NEW.id) INTO v_resultado;
        
        -- Log del resultado (opcional)
        RAISE NOTICE 'Períodos generados para enrollment %: %', NEW.id, v_resultado;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear el trigger
DROP TRIGGER IF EXISTS trigger_auto_generar_periodos_enrollment ON activity_enrollments;
CREATE TRIGGER trigger_auto_generar_periodos_enrollment
    AFTER UPDATE ON activity_enrollments
    FOR EACH ROW
    EXECUTE FUNCTION trigger_auto_generar_periodos();

-- =====================================================
-- 2. TRIGGER: Auto-generar ejecuciones al crear período
-- =====================================================
-- Cuando se crea un nuevo período, automáticamente genera
-- las ejecuciones de ejercicios correspondientes

CREATE OR REPLACE FUNCTION trigger_auto_generar_ejecuciones()
RETURNS TRIGGER AS $$
DECLARE
    v_resultado JSONB;
BEGIN
    -- Generar ejecuciones para el nuevo período
    SELECT generar_ejecuciones_para_periodo(NEW.id) INTO v_resultado;
    
    -- Log del resultado (opcional)
    RAISE NOTICE 'Ejecuciones generadas para período %: %', NEW.id, v_resultado;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear el trigger
DROP TRIGGER IF EXISTS trigger_auto_generar_ejecuciones_periodo ON periodos_asignados;
CREATE TRIGGER trigger_auto_generar_ejecuciones_periodo
    AFTER INSERT ON periodos_asignados
    FOR EACH ROW
    EXECUTE FUNCTION trigger_auto_generar_ejecuciones();

-- =====================================================
-- 3. TRIGGER: Actualizar fecha de finalización al completar ejercicio
-- =====================================================
-- Cuando se marca un ejercicio como completado, actualiza
-- automáticamente la fecha de finalización

CREATE OR REPLACE FUNCTION trigger_actualizar_fecha_completado()
RETURNS TRIGGER AS $$
BEGIN
    -- Si se marca como completado y no tenía fecha de completado
    IF NEW.completado = true AND (OLD.completado IS NULL OR OLD.completado = false) THEN
        NEW.completed_at := NOW();
    END IF;
    
    -- Si se desmarca como completado, limpiar fecha
    IF NEW.completado = false AND OLD.completado = true THEN
        NEW.completed_at := NULL;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear el trigger
DROP TRIGGER IF EXISTS trigger_actualizar_fecha_completado_ejecucion ON ejecuciones_ejercicio;
CREATE TRIGGER trigger_actualizar_fecha_completado_ejecucion
    BEFORE UPDATE ON ejecuciones_ejercicio
    FOR EACH ROW
    EXECUTE FUNCTION trigger_actualizar_fecha_completado();

-- =====================================================
-- 4. TRIGGER: Validar fechas de período
-- =====================================================
-- Valida que las fechas de inicio y fin de un período sean consistentes

CREATE OR REPLACE FUNCTION trigger_validar_fechas_periodo()
RETURNS TRIGGER AS $$
BEGIN
    -- Validar que fecha_fin >= fecha_inicio
    IF NEW.fecha_fin < NEW.fecha_inicio THEN
        RAISE EXCEPTION 'La fecha de fin (%) no puede ser anterior a la fecha de inicio (%)', 
            NEW.fecha_fin, NEW.fecha_inicio;
    END IF;
    
    -- Validar que no haya solapamiento con otros períodos del mismo enrollment
    IF EXISTS (
        SELECT 1 FROM periodos_asignados 
        WHERE enrollment_id = NEW.enrollment_id 
        AND id != COALESCE(NEW.id, 0)
        AND (
            (NEW.fecha_inicio BETWEEN fecha_inicio AND fecha_fin) OR
            (NEW.fecha_fin BETWEEN fecha_inicio AND fecha_fin) OR
            (NEW.fecha_inicio <= fecha_inicio AND NEW.fecha_fin >= fecha_fin)
        )
    ) THEN
        RAISE EXCEPTION 'El período se solapa con otro período existente para el mismo enrollment';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear el trigger
DROP TRIGGER IF EXISTS trigger_validar_fechas_periodo_insert ON periodos_asignados;
CREATE TRIGGER trigger_validar_fechas_periodo_insert
    BEFORE INSERT ON periodos_asignados
    FOR EACH ROW
    EXECUTE FUNCTION trigger_validar_fechas_periodo();

DROP TRIGGER IF EXISTS trigger_validar_fechas_periodo_update ON periodos_asignados;
CREATE TRIGGER trigger_validar_fechas_periodo_update
    BEFORE UPDATE ON periodos_asignados
    FOR EACH ROW
    EXECUTE FUNCTION trigger_validar_fechas_periodo();

-- =====================================================
-- 5. TRIGGER: Actualizar estadísticas de actividad
-- =====================================================
-- Actualiza estadísticas agregadas cuando se completan ejercicios

CREATE OR REPLACE FUNCTION trigger_actualizar_estadisticas_actividad()
RETURNS TRIGGER AS $$
DECLARE
    v_activity_id INTEGER;
    v_total_ejecuciones INTEGER;
    v_ejecuciones_completadas INTEGER;
    v_porcentaje_completado DECIMAL(5,2);
BEGIN
    -- Obtener activity_id
    SELECT ae.activity_id INTO v_activity_id
    FROM periodos_asignados pa
    JOIN activity_enrollments ae ON ae.id = pa.enrollment_id
    WHERE pa.id = NEW.periodo_id;
    
    -- Calcular estadísticas
    SELECT 
        COUNT(*),
        COUNT(*) FILTER (WHERE completado = true)
    INTO 
        v_total_ejecuciones,
        v_ejecuciones_completadas
    FROM ejecuciones_ejercicio ee
    JOIN periodos_asignados pa ON pa.id = ee.periodo_id
    JOIN activity_enrollments ae ON ae.id = pa.enrollment_id
    WHERE ae.activity_id = v_activity_id;
    
    -- Calcular porcentaje
    IF v_total_ejecuciones > 0 THEN
        v_porcentaje_completado := (v_ejecuciones_completadas::DECIMAL / v_total_ejecuciones) * 100;
    ELSE
        v_porcentaje_completado := 0;
    END IF;
    
    -- Actualizar tabla de estadísticas (si existe) o crear una nueva
    -- Por ahora solo logueamos, pero se puede extender para actualizar una tabla de estadísticas
    RAISE NOTICE 'Estadísticas actualizadas para actividad %: %/% ejecuciones completadas (%.2f%%)', 
        v_activity_id, v_ejecuciones_completadas, v_total_ejecuciones, v_porcentaje_completado;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear el trigger
DROP TRIGGER IF EXISTS trigger_actualizar_estadisticas_actividad_ejecucion ON ejecuciones_ejercicio;
CREATE TRIGGER trigger_actualizar_estadisticas_actividad_ejecucion
    AFTER UPDATE ON ejecuciones_ejercicio
    FOR EACH ROW
    WHEN (OLD.completado IS DISTINCT FROM NEW.completado)
    EXECUTE FUNCTION trigger_actualizar_estadisticas_actividad();

-- =====================================================
-- 6. TRIGGER: Validar intensidades
-- =====================================================
-- Valida que las intensidades tengan valores consistentes

CREATE OR REPLACE FUNCTION trigger_validar_intensidades()
RETURNS TRIGGER AS $$
BEGIN
    -- Validar que al menos uno de los parámetros esté definido
    IF NEW.reps IS NULL AND NEW.series IS NULL AND NEW.peso IS NULL 
       AND NEW.duracion_minutos IS NULL AND NEW.descanso_segundos IS NULL THEN
        RAISE EXCEPTION 'Al menos uno de los parámetros de intensidad debe estar definido (reps, series, peso, duracion_minutos, descanso_segundos)';
    END IF;
    
    -- Validar que el orden sea único para el ejercicio
    IF EXISTS (
        SELECT 1 FROM intensidades 
        WHERE ejercicio_id = NEW.ejercicio_id 
        AND orden = NEW.orden 
        AND id != COALESCE(NEW.id, 0)
    ) THEN
        RAISE EXCEPTION 'Ya existe una intensidad con orden % para este ejercicio', NEW.orden;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear el trigger
DROP TRIGGER IF EXISTS trigger_validar_intensidades_insert ON intensidades;
CREATE TRIGGER trigger_validar_intensidades_insert
    BEFORE INSERT ON intensidades
    FOR EACH ROW
    EXECUTE FUNCTION trigger_validar_intensidades();

DROP TRIGGER IF EXISTS trigger_validar_intensidades_update ON intensidades;
CREATE TRIGGER trigger_validar_intensidades_update
    BEFORE UPDATE ON intensidades
    FOR EACH ROW
    EXECUTE FUNCTION trigger_validar_intensidades();

-- =====================================================
-- 7. TRIGGER: Auto-asignar intensidad por defecto
-- =====================================================
-- Asigna automáticamente una intensidad por defecto cuando se crea un ejercicio

CREATE OR REPLACE FUNCTION trigger_auto_asignar_intensidad_default()
RETURNS TRIGGER AS $$
BEGIN
    -- Crear intensidad por defecto para el nuevo ejercicio
    INSERT INTO intensidades (
        ejercicio_id,
        nombre,
        orden,
        reps,
        series,
        created_by
    ) VALUES (
        NEW.id,
        'Intermedio',
        1,
        10,
        3,
        NEW.created_by
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear el trigger
DROP TRIGGER IF EXISTS trigger_auto_asignar_intensidad_default_ejercicio ON ejercicios_detalles;
CREATE TRIGGER trigger_auto_asignar_intensidad_default_ejercicio
    AFTER INSERT ON ejercicios_detalles
    FOR EACH ROW
    EXECUTE FUNCTION trigger_auto_asignar_intensidad_default();

-- =====================================================
-- 8. TRIGGER: Limpiar datos huérfanos
-- =====================================================
-- Limpia datos relacionados cuando se elimina un ejercicio

CREATE OR REPLACE FUNCTION trigger_limpiar_datos_huerfanos()
RETURNS TRIGGER AS $$
BEGIN
    -- Eliminar intensidades relacionadas
    DELETE FROM intensidades WHERE ejercicio_id = OLD.id;
    
    -- Eliminar organizaciones relacionadas
    DELETE FROM organizacion_ejercicios WHERE ejercicio_id = OLD.id;
    
    -- Nota: Las ejecuciones_ejercicio se mantienen por integridad histórica
    -- pero se marcan como "ejercicio eliminado" si es necesario
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Crear el trigger
DROP TRIGGER IF EXISTS trigger_limpiar_datos_huerfanos_ejercicio ON ejercicios_detalles;
CREATE TRIGGER trigger_limpiar_datos_huerfanos_ejercicio
    BEFORE DELETE ON ejercicios_detalles
    FOR EACH ROW
    EXECUTE FUNCTION trigger_limpiar_datos_huerfanos();

-- =====================================================
-- 9. TRIGGER: Validar organización de ejercicios
-- =====================================================
-- Valida que la organización de ejercicios sea consistente

CREATE OR REPLACE FUNCTION trigger_validar_organizacion_ejercicios()
RETURNS TRIGGER AS $$
BEGIN
    -- Validar que el ejercicio pertenezca a la misma actividad
    IF NOT EXISTS (
        SELECT 1 FROM ejercicios_detalles 
        WHERE id = NEW.ejercicio_id 
        AND activity_id = NEW.activity_id
    ) THEN
        RAISE EXCEPTION 'El ejercicio % no pertenece a la actividad %', NEW.ejercicio_id, NEW.activity_id;
    END IF;
    
    -- Validar que no haya duplicación en el mismo día/semana/período/bloque
    IF EXISTS (
        SELECT 1 FROM organizacion_ejercicios 
        WHERE activity_id = NEW.activity_id
        AND ejercicio_id = NEW.ejercicio_id
        AND dia = NEW.dia
        AND semana = NEW.semana
        AND numero_periodo = NEW.numero_periodo
        AND bloque = NEW.bloque
        AND id != COALESCE(NEW.id, 0)
    ) THEN
        RAISE EXCEPTION 'El ejercicio ya está asignado en el mismo día/semana/período/bloque';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear el trigger
DROP TRIGGER IF EXISTS trigger_validar_organizacion_ejercicios_insert ON organizacion_ejercicios;
CREATE TRIGGER trigger_validar_organizacion_ejercicios_insert
    BEFORE INSERT ON organizacion_ejercicios
    FOR EACH ROW
    EXECUTE FUNCTION trigger_validar_organizacion_ejercicios();

DROP TRIGGER IF EXISTS trigger_validar_organizacion_ejercicios_update ON organizacion_ejercicios;
CREATE TRIGGER trigger_validar_organizacion_ejercicios_update
    BEFORE UPDATE ON organizacion_ejercicios
    FOR EACH ROW
    EXECUTE FUNCTION trigger_validar_organizacion_ejercicios();

-- =====================================================
-- COMENTARIOS PARA DOCUMENTACIÓN
-- =====================================================

COMMENT ON FUNCTION trigger_auto_generar_periodos IS 'Genera automáticamente períodos cuando un enrollment se activa';
COMMENT ON FUNCTION trigger_auto_generar_ejecuciones IS 'Genera automáticamente ejecuciones cuando se crea un período';
COMMENT ON FUNCTION trigger_actualizar_fecha_completado IS 'Actualiza automáticamente la fecha de completado cuando se marca un ejercicio';
COMMENT ON FUNCTION trigger_validar_fechas_periodo IS 'Valida que las fechas de período sean consistentes y no se solapen';
COMMENT ON FUNCTION trigger_actualizar_estadisticas_actividad IS 'Actualiza estadísticas agregadas cuando se completan ejercicios';
COMMENT ON FUNCTION trigger_validar_intensidades IS 'Valida que las intensidades tengan valores consistentes';
COMMENT ON FUNCTION trigger_auto_asignar_intensidad_default IS 'Asigna automáticamente una intensidad por defecto a nuevos ejercicios';
COMMENT ON FUNCTION trigger_limpiar_datos_huerfanos IS 'Limpia datos relacionados cuando se elimina un ejercicio';
COMMENT ON FUNCTION trigger_validar_organizacion_ejercicios IS 'Valida que la organización de ejercicios sea consistente';

RAISE NOTICE 'Triggers de automatización del esquema modular creados exitosamente';
