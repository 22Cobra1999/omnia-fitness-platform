-- ================================================================
-- PASO 2: TRIGGERS AUTOMÁTICOS PARA CALENDAR_EVENTS
-- ================================================================
-- EJECUTAR ESTE ARCHIVO DESPUÉS DE PASO 1
-- ================================================================

-- ================================================================
-- FUNCIÓN: Sincronizar calendario cuando se actualiza ejecuciones_taller
-- ================================================================

CREATE OR REPLACE FUNCTION sync_calendar_on_ejecucion_update()
RETURNS TRIGGER AS $$
DECLARE
    tema jsonb;
    coach_id_var uuid;
BEGIN
    -- Obtener coach_id de la actividad
    SELECT coach_id INTO coach_id_var
    FROM activities
    WHERE id = NEW.actividad_id;
    
    IF coach_id_var IS NULL THEN
        RETURN NEW;
    END IF;
    
    -- Limpiar eventos existentes de esta ejecución
    DELETE FROM calendar_events 
    WHERE client_id = NEW.cliente_id 
      AND activity_id = NEW.actividad_id
      AND event_type = 'workshop';
    
    -- Insertar eventos desde temas_cubiertos
    IF NEW.temas_cubiertos IS NOT NULL AND jsonb_array_length(NEW.temas_cubiertos) > 0 THEN
        FOR tema IN SELECT * FROM jsonb_array_elements(NEW.temas_cubiertos)
        LOOP
            IF tema->>'fecha_seleccionada' IS NOT NULL 
               AND tema->'horario_seleccionado' IS NOT NULL 
               AND tema->'horario_seleccionado'->>'hora_inicio' IS NOT NULL THEN
                
                INSERT INTO calendar_events (
                    coach_id, client_id, activity_id,
                    title, description, start_time, end_time,
                    event_type, status, notes,
                    timezone_offset, timezone_name
                ) VALUES (
                    coach_id_var,
                    NEW.cliente_id,
                    NEW.actividad_id,
                    CONCAT('Taller: ', tema->>'tema_nombre'),
                    'Cliente confirmó asistencia',
                    (tema->>'fecha_seleccionada' || 'T' || (tema->'horario_seleccionado'->>'hora_inicio') || ':00-03:00')::timestamptz,
                    (tema->>'fecha_seleccionada' || 'T' || (tema->'horario_seleccionado'->>'hora_fin') || ':00-03:00')::timestamptz,
                    'workshop',
                    CASE 
                        WHEN (tema->>'asistio')::boolean THEN 'completed'
                        WHEN NEW.estado = 'cancelado' THEN 'cancelled'
                        ELSE 'scheduled'
                    END,
                    CONCAT('Tema: ', tema->>'tema_nombre', ' | Confirmó: ', 
                           CASE WHEN (tema->>'confirmo_asistencia')::boolean THEN 'Sí' ELSE 'No' END),
                    -180,
                    'America/Argentina/Buenos_Aires'
                );
            END IF;
        END LOOP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- CREAR TRIGGER
-- ================================================================

DROP TRIGGER IF EXISTS trigger_sync_calendar_on_ejecucion ON ejecuciones_taller;

CREATE TRIGGER trigger_sync_calendar_on_ejecucion
    AFTER INSERT OR UPDATE ON ejecuciones_taller
    FOR EACH ROW
    EXECUTE FUNCTION sync_calendar_on_ejecucion_update();

-- ================================================================
-- FUNCIÓN: Limpiar calendario cuando se elimina ejecución
-- ================================================================

CREATE OR REPLACE FUNCTION delete_calendar_on_ejecucion_delete()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM calendar_events 
    WHERE client_id = OLD.cliente_id 
      AND activity_id = OLD.actividad_id
      AND event_type = 'workshop';
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_delete_calendar_on_ejecucion ON ejecuciones_taller;

CREATE TRIGGER trigger_delete_calendar_on_ejecucion
    BEFORE DELETE ON ejecuciones_taller
    FOR EACH ROW
    EXECUTE FUNCTION delete_calendar_on_ejecucion_delete();

-- ================================================================
-- FUNCIÓN: Sincronizar consultas desde activity_schedules
-- ================================================================

CREATE OR REPLACE FUNCTION sync_calendar_on_schedule()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        DELETE FROM calendar_events 
        WHERE client_id = OLD.client_id 
          AND activity_id = OLD.activity_id
          AND start_time = (OLD.scheduled_date || 'T' || OLD.scheduled_time || '-03:00')::timestamptz;
    END IF;
    
    INSERT INTO calendar_events (
        coach_id, client_id, activity_id,
        title, description, start_time, end_time,
        event_type, status, consultation_type, notes,
        timezone_offset, timezone_name
    ) VALUES (
        NEW.coach_id,
        NEW.client_id,
        NEW.activity_id,
        CASE WHEN NEW.session_type = 'videocall' THEN 'Consulta Virtual' ELSE 'Consulta' END,
        CONCAT('Duración: ', NEW.duration_minutes, ' min'),
        (NEW.scheduled_date || 'T' || NEW.scheduled_time || '-03:00')::timestamptz,
        ((NEW.scheduled_date || 'T' || NEW.scheduled_time || '-03:00')::timestamptz + (NEW.duration_minutes || ' minutes')::interval),
        'consultation',
        COALESCE(NEW.status, 'scheduled'),
        CASE WHEN NEW.session_type = 'videocall' THEN 'videocall' ELSE 'message' END,
        COALESCE(NEW.notes, ''),
        -180,
        'America/Argentina/Buenos_Aires'
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_calendar_on_schedule ON activity_schedules;

CREATE TRIGGER trigger_sync_calendar_on_schedule
    AFTER INSERT OR UPDATE ON activity_schedules
    FOR EACH ROW
    EXECUTE FUNCTION sync_calendar_on_schedule();

-- ================================================================
-- FUNCIÓN: Limpiar calendario cuando se elimina schedule
-- ================================================================

CREATE OR REPLACE FUNCTION delete_calendar_on_schedule_delete()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM calendar_events 
    WHERE client_id = OLD.client_id 
      AND activity_id = OLD.activity_id
      AND start_time = (OLD.scheduled_date || 'T' || OLD.scheduled_time || '-03:00')::timestamptz;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_delete_calendar_on_schedule ON activity_schedules;

CREATE TRIGGER trigger_delete_calendar_on_schedule
    BEFORE DELETE ON activity_schedules
    FOR EACH ROW
    EXECUTE FUNCTION delete_calendar_on_schedule_delete();

-- ================================================================
-- VERIFICACIÓN
-- ================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '================================================================';
    RAISE NOTICE '✅ TRIGGERS AUTOMÁTICOS CREADOS CORRECTAMENTE';
    RAISE NOTICE '================================================================';
    RAISE NOTICE '';
    RAISE NOTICE '🔄 SINCRONIZACIÓN AUTOMÁTICA HABILITADA:';
    RAISE NOTICE '';
    RAISE NOTICE '   ✅ ejecuciones_taller → INSERT/UPDATE';
    RAISE NOTICE '      Cuando cliente reserva horario de taller';
    RAISE NOTICE '      → Evento se crea automáticamente en calendar_events';
    RAISE NOTICE '';
    RAISE NOTICE '   ✅ ejecuciones_taller → DELETE';
    RAISE NOTICE '      Cuando se cancela inscripción';
    RAISE NOTICE '      → Eventos se eliminan de calendar_events';
    RAISE NOTICE '';
    RAISE NOTICE '   ✅ activity_schedules → INSERT/UPDATE';
    RAISE NOTICE '      Cuando se agenda consulta';
    RAISE NOTICE '      → Evento se crea automáticamente';
    RAISE NOTICE '';
    RAISE NOTICE '   ✅ activity_schedules → DELETE';
    RAISE NOTICE '      Cuando se cancela consulta';
    RAISE NOTICE '      → Evento se elimina';
    RAISE NOTICE '';
    RAISE NOTICE '================================================================';
    RAISE NOTICE '🎯 SISTEMA COMPLETO Y FUNCIONANDO';
    RAISE NOTICE '================================================================';
    RAISE NOTICE '';
END $$;

-- Mostrar triggers creados
SELECT 
    trigger_name,
    event_manipulation as accion,
    event_object_table as tabla
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND trigger_name LIKE '%calendar%'
ORDER BY event_object_table, trigger_name;
































