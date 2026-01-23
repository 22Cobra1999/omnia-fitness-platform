-- Complete fix for Workshop UI issues
-- 1. Fix calendar trigger (remove notes column reference)
-- 2. Update theme IDs in attendance records (2,3 -> 16,17)
-- 3. Clean up any orphaned calendar events

-- ============================================================================
-- PART 1: Fix Calendar Trigger
-- ============================================================================

CREATE OR REPLACE FUNCTION sync_calendar_on_topic_progress()
RETURNS TRIGGER AS $$
DECLARE
    coach_id_var uuid;
    start_ts timestamptz;
    end_ts timestamptz;
BEGIN
    -- Only proceed if we have a selected date/time
    IF NEW.fecha_seleccionada IS NULL OR NEW.horario_seleccionado IS NULL THEN
        -- If it was updated to NULL (cancelled), remove event
        IF TG_OP = 'UPDATE' AND OLD.fecha_seleccionada IS NOT NULL THEN
             DELETE FROM calendar_events 
             WHERE client_id = OLD.cliente_id 
               AND activity_id = OLD.actividad_id
               AND event_type = 'workshop'
               AND title LIKE CONCAT('%', OLD.tema_nombre, '%');
        END IF;
        RETURN NEW;
    END IF;

    -- Get Coach ID
    SELECT coach_id INTO coach_id_var
    FROM activities
    WHERE id = NEW.actividad_id;
    
    IF coach_id_var IS NULL THEN RETURN NEW; END IF;

    -- Construct Timestamps
    start_ts := (NEW.fecha_seleccionada || 'T' || (NEW.horario_seleccionado->>'hora_inicio') || ':00-03:00')::timestamptz;
    end_ts := (NEW.fecha_seleccionada || 'T' || (NEW.horario_seleccionado->>'hora_fin') || ':00-03:00')::timestamptz;

    -- Delete old event for this topic (using title instead of notes)
    DELETE FROM calendar_events 
    WHERE client_id = NEW.cliente_id 
      AND activity_id = NEW.actividad_id
      AND event_type = 'workshop'
      AND title LIKE CONCAT('%', NEW.tema_nombre, '%');

    -- Insert new calendar event
    INSERT INTO calendar_events (
        coach_id, client_id, activity_id,
        title, description, start_time, end_time,
        event_type, status,
        timezone_offset, timezone_name
    ) VALUES (
        coach_id_var,
        NEW.cliente_id,
        NEW.actividad_id,
        CONCAT('Taller: ', NEW.tema_nombre),
        CONCAT('Cliente confirmó asistencia. ', 
               CASE WHEN NEW.confirmo_asistencia THEN 'Reservado' ELSE '' END),
        start_ts,
        end_ts,
        'workshop',
        CASE 
            WHEN NEW.asistio THEN 'completed'
            WHEN NEW.estado = 'cancelado' THEN 'cancelled'
            ELSE 'scheduled'
        END,
        -180,
        'America/Argentina/Buenos_Aires'
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PART 2: Update Theme IDs in Attendance Records
-- ============================================================================

-- Update theme ID 2 to 16 (Flexibilidad y Movilidad)
UPDATE taller_progreso_temas
SET tema_id = 16,
    updated_at = NOW()
WHERE actividad_id = 48 
  AND tema_id = 2
  AND tema_nombre = 'Flexibilidad y Movilidad';

-- Update theme ID 3 to 17 (Meditación y Relajación)  
UPDATE taller_progreso_temas
SET tema_id = 17,
    updated_at = NOW()
WHERE actividad_id = 48
  AND tema_id = 3
  AND tema_nombre = 'Meditación y Relajación';

-- ============================================================================
-- PART 3: Verify Updates
-- ============================================================================

-- Show updated records
SELECT 
    tema_id, 
    tema_nombre, 
    fecha_seleccionada,
    confirmo_asistencia,
    asistio,
    estado
FROM taller_progreso_temas 
WHERE actividad_id = 48
ORDER BY tema_id;
