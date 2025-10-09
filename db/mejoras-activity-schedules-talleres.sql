-- ================================================
-- MEJORAS A activity_schedules PARA TALLERES
-- ================================================
-- Este script mejora la tabla activity_schedules para soportar
-- el tracking completo de asistencias a talleres

-- PASO 1: Agregar campo 'absent' al constraint de status
-- ================================================
DO $$
BEGIN
    -- Eliminar constraint existente si existe
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'activity_schedules_status_check'
    ) THEN
        ALTER TABLE activity_schedules 
        DROP CONSTRAINT activity_schedules_status_check;
    END IF;
    
    -- Agregar nuevo constraint con 'absent' incluido
    ALTER TABLE activity_schedules 
    ADD CONSTRAINT activity_schedules_status_check 
    CHECK (status IN ('scheduled', 'completed', 'cancelled', 'rescheduled', 'absent'));
    
    RAISE NOTICE '✅ Status constraint actualizado con estado "absent"';
END $$;

-- PASO 2: Agregar campos adicionales útiles para talleres
-- ================================================
DO $$
BEGIN
    -- Campo para trackear si el cliente confirmó asistencia
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'activity_schedules' 
        AND column_name = 'attendance_confirmed'
    ) THEN
        ALTER TABLE activity_schedules 
        ADD COLUMN attendance_confirmed BOOLEAN DEFAULT FALSE;
        
        COMMENT ON COLUMN activity_schedules.attendance_confirmed 
        IS 'Si el cliente confirmó que va a asistir a la sesión';
    END IF;
    
    -- Campo para número de sesión (útil para talleres de múltiples sesiones)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'activity_schedules' 
        AND column_name = 'session_number'
    ) THEN
        ALTER TABLE activity_schedules 
        ADD COLUMN session_number INTEGER;
        
        COMMENT ON COLUMN activity_schedules.session_number 
        IS 'Número de sesión dentro del taller (1, 2, 3, etc.)';
    END IF;
    
    -- Campo para ubicación (si es presencial)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'activity_schedules' 
        AND column_name = 'location'
    ) THEN
        ALTER TABLE activity_schedules 
        ADD COLUMN location TEXT;
        
        COMMENT ON COLUMN activity_schedules.location 
        IS 'Ubicación física para talleres presenciales';
    END IF;
    
    -- Campo para calificación de la sesión
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'activity_schedules' 
        AND column_name = 'rating'
    ) THEN
        ALTER TABLE activity_schedules 
        ADD COLUMN rating INTEGER CHECK (rating >= 1 AND rating <= 5);
        
        COMMENT ON COLUMN activity_schedules.rating 
        IS 'Calificación del cliente para esta sesión (1-5)';
    END IF;
    
    -- Campo para feedback de la sesión
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'activity_schedules' 
        AND column_name = 'feedback'
    ) THEN
        ALTER TABLE activity_schedules 
        ADD COLUMN feedback TEXT;
        
        COMMENT ON COLUMN activity_schedules.feedback 
        IS 'Comentarios del cliente sobre la sesión';
    END IF;
    
    RAISE NOTICE '✅ Campos adicionales agregados para talleres';
END $$;

-- PASO 3: Crear índices adicionales para mejorar rendimiento
-- ================================================
CREATE INDEX IF NOT EXISTS idx_activity_schedules_status 
ON activity_schedules(status);

CREATE INDEX IF NOT EXISTS idx_activity_schedules_session_type 
ON activity_schedules(session_type);

CREATE INDEX IF NOT EXISTS idx_activity_schedules_activity_date 
ON activity_schedules(activity_id, scheduled_date);

CREATE INDEX IF NOT EXISTS idx_activity_schedules_session_number 
ON activity_schedules(activity_id, session_number);

-- PASO 4: Crear función para contar cupos ocupados (GENERAL - sin tema)
-- ================================================
CREATE OR REPLACE FUNCTION get_workshop_available_slots(
    p_activity_id INTEGER,
    p_scheduled_date DATE,
    p_scheduled_time TIME
) RETURNS INTEGER AS $$
DECLARE
    v_total_slots INTEGER;
    v_occupied_slots INTEGER;
    v_available_slots INTEGER;
BEGIN
    -- Obtener cupos totales del taller
    SELECT available_slots INTO v_total_slots
    FROM activities
    WHERE id = p_activity_id;
    
    -- Si no tiene cupos definidos, retornar NULL
    IF v_total_slots IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- Contar cupos ocupados (solo scheduled y completed, no cancelled ni absent)
    SELECT COUNT(*) INTO v_occupied_slots
    FROM activity_schedules
    WHERE activity_id = p_activity_id
    AND scheduled_date = p_scheduled_date
    AND scheduled_time = p_scheduled_time
    AND status IN ('scheduled', 'completed');
    
    -- Calcular cupos disponibles
    v_available_slots := v_total_slots - v_occupied_slots;
    
    RETURN v_available_slots;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_workshop_available_slots IS 
'Retorna cupos disponibles para un taller en fecha/hora específica (uso general)';

-- PASO 5: Funciones mejoradas con soporte para TEMAS y HORARIOS BIS
-- ================================================

-- 5.1: Función para verificar cupos por TEMA y VARIANTE (original/bis)
CREATE OR REPLACE FUNCTION get_topic_available_slots(
    p_topic_id INTEGER,
    p_scheduled_date DATE,
    p_scheduled_time TIME,
    p_schedule_variant TEXT DEFAULT 'original'
) RETURNS INTEGER AS $$
DECLARE
    v_activity_id INTEGER;
    v_total_slots INTEGER;
    v_occupied_slots INTEGER;
    v_available_slots INTEGER;
BEGIN
    -- Obtener activity_id y cupos totales del tema
    SELECT t.activity_id, a.available_slots 
    INTO v_activity_id, v_total_slots
    FROM workshop_topics t
    JOIN activities a ON t.activity_id = a.id
    WHERE t.id = p_topic_id;
    
    -- Si no existe el tema, retornar NULL
    IF NOT FOUND THEN
        RETURN NULL;
    END IF;
    
    -- Si no tiene cupos definidos, retornar NULL (cupos ilimitados)
    IF v_total_slots IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- Contar cupos ocupados para este tema, fecha, hora y variante específica
    SELECT COUNT(*) INTO v_occupied_slots
    FROM activity_schedules
    WHERE topic_id = p_topic_id
    AND scheduled_date = p_scheduled_date
    AND scheduled_time = p_scheduled_time
    AND schedule_variant = p_schedule_variant
    AND status IN ('scheduled', 'completed');
    
    -- Calcular cupos disponibles
    v_available_slots := v_total_slots - v_occupied_slots;
    
    RETURN v_available_slots;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_topic_available_slots IS 
'Retorna cupos disponibles para un TEMA específico en fecha/hora/variante (original o bis)';

-- 5.2: Función para verificar disponibilidad con soporte de temas
CREATE OR REPLACE FUNCTION check_workshop_availability(
    p_activity_id INTEGER DEFAULT NULL,
    p_topic_id INTEGER DEFAULT NULL,
    p_scheduled_date DATE DEFAULT NULL,
    p_scheduled_time TIME DEFAULT NULL,
    p_schedule_variant TEXT DEFAULT 'original'
) RETURNS BOOLEAN AS $$
DECLARE
    v_available_slots INTEGER;
BEGIN
    -- Si se proporciona topic_id, verificar por tema
    IF p_topic_id IS NOT NULL THEN
        v_available_slots := get_topic_available_slots(
            p_topic_id,
            p_scheduled_date,
            p_scheduled_time,
            p_schedule_variant
        );
    -- Si solo se proporciona activity_id, verificar general
    ELSIF p_activity_id IS NOT NULL THEN
        v_available_slots := get_workshop_available_slots(
            p_activity_id,
            p_scheduled_date,
            p_scheduled_time
        );
    ELSE
        -- Ni topic_id ni activity_id proporcionados
        RETURN FALSE;
    END IF;
    
    -- Si no hay límite de cupos, siempre hay disponibilidad
    IF v_available_slots IS NULL THEN
        RETURN TRUE;
    END IF;
    
    -- Hay disponibilidad si quedan cupos
    RETURN v_available_slots > 0;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION check_workshop_availability IS 
'Verifica si hay cupo disponible. Soporta verificación por tema (con variante) o actividad general';

-- 5.3: Función para obtener resumen de cupos por tema
CREATE OR REPLACE FUNCTION get_topic_slots_summary(
    p_topic_id INTEGER,
    p_scheduled_date DATE
) RETURNS TABLE (
    variante TEXT,
    hora_inicio TIME,
    hora_fin TIME,
    total_cupos INTEGER,
    cupos_ocupados BIGINT,
    cupos_disponibles INTEGER,
    porcentaje_ocupacion NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    WITH topic_info AS (
        SELECT 
            t.id,
            t.activity_id,
            a.available_slots,
            t.original_start_time,
            t.original_end_time,
            t.bis_enabled,
            t.bis_start_time,
            t.bis_end_time
        FROM workshop_topics t
        JOIN activities a ON t.activity_id = a.id
        WHERE t.id = p_topic_id
    ),
    schedules_count AS (
        SELECT 
            schedule_variant,
            scheduled_time,
            COUNT(*) AS ocupados
        FROM activity_schedules
        WHERE topic_id = p_topic_id
        AND scheduled_date = p_scheduled_date
        AND status IN ('scheduled', 'completed')
        GROUP BY schedule_variant, scheduled_time
    )
    -- Horario ORIGINAL
    SELECT 
        'original'::TEXT,
        ti.original_start_time,
        ti.original_end_time,
        ti.available_slots,
        COALESCE(sc.ocupados, 0),
        ti.available_slots - COALESCE(sc.ocupados, 0),
        ROUND(
            COALESCE(sc.ocupados, 0) * 100.0 / NULLIF(ti.available_slots, 0),
            2
        )
    FROM topic_info ti
    LEFT JOIN schedules_count sc 
        ON sc.schedule_variant = 'original' 
        AND sc.scheduled_time = ti.original_start_time
    
    UNION ALL
    
    -- Horario BIS (si está habilitado)
    SELECT 
        'bis'::TEXT,
        ti.bis_start_time,
        ti.bis_end_time,
        ti.available_slots,
        COALESCE(sc.ocupados, 0),
        ti.available_slots - COALESCE(sc.ocupados, 0),
        ROUND(
            COALESCE(sc.ocupados, 0) * 100.0 / NULLIF(ti.available_slots, 0),
            2
        )
    FROM topic_info ti
    LEFT JOIN schedules_count sc 
        ON sc.schedule_variant = 'bis' 
        AND sc.scheduled_time = ti.bis_start_time
    WHERE ti.bis_enabled = TRUE;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_topic_slots_summary IS 
'Retorna resumen de cupos por tema y variante (original/bis) para una fecha específica';

-- PASO 6: Crear vista para reportes de asistencia
-- ================================================
CREATE OR REPLACE VIEW workshop_attendance_report AS
SELECT 
    a.id AS activity_id,
    a.title AS workshop_name,
    a.type AS workshop_type,
    a.available_slots AS total_slots,
    s.scheduled_date,
    s.scheduled_time,
    s.session_number,
    s.location,
    COUNT(*) FILTER (WHERE s.status = 'scheduled') AS scheduled_count,
    COUNT(*) FILTER (WHERE s.status = 'completed') AS completed_count,
    COUNT(*) FILTER (WHERE s.status = 'absent') AS absent_count,
    COUNT(*) FILTER (WHERE s.status = 'cancelled') AS cancelled_count,
    a.available_slots - COUNT(*) FILTER (WHERE s.status IN ('scheduled', 'completed')) AS available_slots_remaining,
    ROUND(
        100.0 * COUNT(*) FILTER (WHERE s.status = 'completed') / 
        NULLIF(COUNT(*) FILTER (WHERE s.status IN ('scheduled', 'completed', 'absent')), 0),
        2
    ) AS attendance_rate
FROM activities a
LEFT JOIN activity_schedules s ON a.id = s.activity_id
WHERE a.type = 'workshop'
GROUP BY a.id, a.title, a.type, a.available_slots, s.scheduled_date, s.scheduled_time, s.session_number, s.location;

COMMENT ON VIEW workshop_attendance_report IS 
'Vista para reportes de asistencia a talleres';

-- PASO 7: Verificar estructura final
-- ================================================
SELECT 
    'ESTRUCTURA ACTIVITY_SCHEDULES' AS seccion,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'activity_schedules'
ORDER BY ordinal_position;

-- PASO 8: Ejemplo de uso
-- ================================================
-- Ejemplo: Verificar cupos disponibles
SELECT 
    'EJEMPLO: Verificar cupos' AS ejemplo,
    get_workshop_available_slots(1, '2025-10-15', '10:00:00') AS cupos_disponibles;

-- Ejemplo: Verificar si hay disponibilidad
SELECT 
    'EJEMPLO: Hay cupo?' AS ejemplo,
    check_workshop_availability(1, '2025-10-15', '10:00:00') AS hay_disponibilidad;

-- Ejemplo: Ver reporte de asistencia
SELECT * FROM workshop_attendance_report
LIMIT 5;

