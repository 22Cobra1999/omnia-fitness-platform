-- ================================================================
-- TRIGGER AUTOMÁTICO PARA SINCRONIZAR CALENDAR_EVENTS
-- ================================================================
-- Este script crea un trigger que automáticamente inserta eventos
-- en calendar_events cuando un cliente reserva un taller

-- ================================================================
-- FUNCIÓN: sync_calendar_on_ejecucion_update()
-- ================================================================

CREATE OR REPLACE FUNCTION sync_calendar_on_ejecucion_update()
RETURNS TRIGGER AS $$
DECLARE
    tema jsonb;
    coach_id_var uuid;
BEGIN
    -- Obtener el coach_id de la actividad
    SELECT coach_id INTO coach_id_var
    FROM activities
    WHERE id = NEW.actividad_id;
    
    -- Si no hay coach_id, salir
    IF coach_id_var IS NULL THEN
        RETURN NEW;
    END IF;
    
    -- Limpiar eventos existentes para esta ejecución
    DELETE FROM calendar_events 
    WHERE client_id = NEW.cliente_id 
      AND activity_id = NEW.actividad_id
      AND event_type = 'workshop';
    
    -- Insertar eventos desde temas_cubiertos
    IF NEW.temas_cubiertos IS NOT NULL AND jsonb_array_length(NEW.temas_cubiertos) > 0 THEN
        FOR tema IN SELECT * FROM jsonb_array_elements(NEW.temas_cubiertos)
        LOOP
            -- Solo insertar si tiene fecha y horario seleccionados
            IF tema->>'fecha_seleccionada' IS NOT NULL 
               AND tema->'horario_seleccionado' IS NOT NULL 
               AND tema->'horario_seleccionado'->>'hora_inicio' IS NOT NULL
               AND tema->'horario_seleccionado'->>'hora_fin' IS NOT NULL THEN
                
                INSERT INTO calendar_events (
                    coach_id,
                    client_id,
                    activity_id,
                    title,
                    description,
                    start_time,
                    end_time,
                    event_type,
                    status,
                    consultation_type,
                    notes,
                    timezone_offset,
                    timezone_name
                ) VALUES (
                    coach_id_var,
                    NEW.cliente_id,
                    NEW.actividad_id,
                    CONCAT('Taller: ', tema->>'tema_nombre'),
                    'Cliente confirmó asistencia al taller',
                    -- Combinar fecha y hora
                    (tema->>'fecha_seleccionada')::date + (tema->'horario_seleccionado'->>'hora_inicio')::time,
                    (tema->>'fecha_seleccionada')::date + (tema->'horario_seleccionado'->>'hora_fin')::time,
                    'workshop',
                    CASE 
                        WHEN (tema->>'asistio')::boolean = true THEN 'completed'
                        WHEN NEW.estado = 'cancelado' THEN 'cancelled'
                        ELSE 'scheduled'
                    END,
                    NULL,
                    CONCAT(
                        'Tema: ', tema->>'tema_nombre',
                        ' | Confirmó: ', CASE WHEN (tema->>'confirmo_asistencia')::boolean THEN 'Sí' ELSE 'No' END,
                        ' | Asistió: ', CASE WHEN (tema->>'asistio')::boolean THEN 'Sí' ELSE 'No' END
                    ),
                    -180,
                    'America/Argentina/Buenos_Aires'
                );
            END IF;
        END LOOP;
    END IF;
    
    -- Insertar eventos desde temas_pendientes (si tienen fecha/horario)
    IF NEW.temas_pendientes IS NOT NULL AND jsonb_array_length(NEW.temas_pendientes) > 0 THEN
        FOR tema IN SELECT * FROM jsonb_array_elements(NEW.temas_pendientes)
        LOOP
            -- Solo insertar si tiene fecha y horario seleccionados
            IF tema->>'fecha_seleccionada' IS NOT NULL 
               AND tema->'horario_seleccionado' IS NOT NULL 
               AND tema->'horario_seleccionado'->>'hora_inicio' IS NOT NULL
               AND tema->'horario_seleccionado'->>'hora_fin' IS NOT NULL THEN
                
                INSERT INTO calendar_events (
                    coach_id,
                    client_id,
                    activity_id,
                    title,
                    description,
                    start_time,
                    end_time,
                    event_type,
                    status,
                    consultation_type,
                    notes,
                    timezone_offset,
                    timezone_name
                ) VALUES (
                    coach_id_var,
                    NEW.cliente_id,
                    NEW.actividad_id,
                    CONCAT('Taller: ', tema->>'tema_nombre', ' (Pendiente)'),
                    'Cliente aún no ha seleccionado horario definitivo',
                    (tema->>'fecha_seleccionada')::date + (tema->'horario_seleccionado'->>'hora_inicio')::time,
                    (tema->>'fecha_seleccionada')::date + (tema->'horario_seleccionado'->>'hora_fin')::time,
                    'workshop',
                    'scheduled',
                    NULL,
                    CONCAT('Tema: ', tema->>'tema_nombre', ' | Estado: Pendiente de confirmar'),
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
-- CREAR TRIGGER EN ejecuciones_taller
-- ================================================================

-- Eliminar trigger si existe
DROP TRIGGER IF EXISTS trigger_sync_calendar_on_ejecucion_update ON ejecuciones_taller;

-- Crear trigger que se ejecuta DESPUÉS de INSERT o UPDATE
CREATE TRIGGER trigger_sync_calendar_on_ejecucion_update
    AFTER INSERT OR UPDATE ON ejecuciones_taller
    FOR EACH ROW
    EXECUTE FUNCTION sync_calendar_on_ejecucion_update();

-- ================================================================
-- FUNCIÓN: sync_calendar_on_activity_schedule()
-- ================================================================
-- Para consultas agendadas en activity_schedules

CREATE OR REPLACE FUNCTION sync_calendar_on_activity_schedule()
RETURNS TRIGGER AS $$
BEGIN
    -- Limpiar evento existente si es un UPDATE
    IF TG_OP = 'UPDATE' THEN
        DELETE FROM calendar_events 
        WHERE client_id = OLD.client_id 
          AND activity_id = OLD.activity_id
          AND start_time = (OLD.scheduled_date + OLD.scheduled_time);
    END IF;
    
    -- Insertar nuevo evento
    INSERT INTO calendar_events (
        coach_id,
        client_id,
        activity_id,
        title,
        description,
        start_time,
        end_time,
        event_type,
        status,
        consultation_type,
        notes,
        timezone_offset,
        timezone_name
    ) VALUES (
        NEW.coach_id,
        NEW.client_id,
        NEW.activity_id,
        CASE 
            WHEN NEW.session_type = 'videocall' THEN 'Consulta Virtual'
            ELSE 'Consulta'
        END,
        CONCAT('Duración: ', NEW.duration_minutes, ' minutos'),
        (NEW.scheduled_date + NEW.scheduled_time),
        (NEW.scheduled_date + NEW.scheduled_time + (NEW.duration_minutes || ' minutes')::interval),
        'consultation',
        COALESCE(NEW.status, 'scheduled'),
        CASE 
            WHEN NEW.session_type = 'videocall' THEN 'videocall'
            ELSE 'message'
        END,
        COALESCE(NEW.notes, ''),
        -180,
        'America/Argentina/Buenos_Aires'
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- CREAR TRIGGER EN activity_schedules
-- ================================================================

-- Eliminar trigger si existe
DROP TRIGGER IF EXISTS trigger_sync_calendar_on_schedule ON activity_schedules;

-- Crear trigger
CREATE TRIGGER trigger_sync_calendar_on_schedule
    AFTER INSERT OR UPDATE ON activity_schedules
    FOR EACH ROW
    EXECUTE FUNCTION sync_calendar_on_activity_schedule();

-- ================================================================
-- FUNCIÓN: delete_calendar_on_ejecucion_delete()
-- ================================================================
-- Limpiar eventos cuando se elimina una ejecución

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

-- ================================================================
-- TRIGGER PARA DELETE
-- ================================================================

DROP TRIGGER IF EXISTS trigger_delete_calendar_on_ejecucion_delete ON ejecuciones_taller;

CREATE TRIGGER trigger_delete_calendar_on_ejecucion_delete
    BEFORE DELETE ON ejecuciones_taller
    FOR EACH ROW
    EXECUTE FUNCTION delete_calendar_on_ejecucion_delete();

-- ================================================================
-- FUNCIÓN: delete_calendar_on_schedule_delete()
-- ================================================================

CREATE OR REPLACE FUNCTION delete_calendar_on_schedule_delete()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM calendar_events 
    WHERE client_id = OLD.client_id 
      AND activity_id = OLD.activity_id
      AND start_time = (OLD.scheduled_date + OLD.scheduled_time);
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- TRIGGER PARA DELETE EN activity_schedules
-- ================================================================

DROP TRIGGER IF EXISTS trigger_delete_calendar_on_schedule_delete ON activity_schedules;

CREATE TRIGGER trigger_delete_calendar_on_schedule_delete
    BEFORE DELETE ON activity_schedules
    FOR EACH ROW
    EXECUTE FUNCTION delete_calendar_on_schedule_delete();

-- ================================================================
-- COMENTARIOS Y DOCUMENTACIÓN
-- ================================================================

COMMENT ON FUNCTION sync_calendar_on_ejecucion_update() IS 
'Función trigger que sincroniza automáticamente calendar_events cuando se actualiza ejecuciones_taller. Extrae eventos de temas_cubiertos y temas_pendientes.';

COMMENT ON FUNCTION sync_calendar_on_activity_schedule() IS 
'Función trigger que crea eventos en calendar_events cuando se agenda una consulta en activity_schedules.';

COMMENT ON FUNCTION delete_calendar_on_ejecucion_delete() IS 
'Limpia eventos del calendario cuando se elimina una ejecución de taller.';

COMMENT ON FUNCTION delete_calendar_on_schedule_delete() IS 
'Limpia eventos del calendario cuando se elimina una consulta agendada.';

-- ================================================================
-- VERIFICACIÓN
-- ================================================================

-- Verificar que los triggers se crearon
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND trigger_name LIKE '%calendar%'
ORDER BY event_object_table, trigger_name;

-- Log de creación
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '================================================================';
    RAISE NOTICE '✅ TRIGGERS AUTOMÁTICOS CREADOS';
    RAISE NOTICE '================================================================';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Trigger en ejecuciones_taller (INSERT/UPDATE)';
    RAISE NOTICE '   → Sincroniza eventos cuando cliente reserva horario';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Trigger en ejecuciones_taller (DELETE)';
    RAISE NOTICE '   → Limpia eventos cuando se cancela inscripción';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Trigger en activity_schedules (INSERT/UPDATE)';
    RAISE NOTICE '   → Crea eventos cuando se agenda consulta';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Trigger en activity_schedules (DELETE)';
    RAISE NOTICE '   → Limpia eventos cuando se cancela consulta';
    RAISE NOTICE '';
    RAISE NOTICE '================================================================';
    RAISE NOTICE '';
    RAISE NOTICE '🔄 Ahora los eventos se crean AUTOMÁTICAMENTE cuando:';
    RAISE NOTICE '   - Un cliente reserva un horario de taller';
    RAISE NOTICE '   - Se agenda una consulta (café, reunión)';
    RAISE NOTICE '   - Se actualiza cualquier reserva';
    RAISE NOTICE '';
    RAISE NOTICE '================================================================';
END $$;
































