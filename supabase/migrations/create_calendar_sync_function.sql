-- ================================================================
-- FUNCIÓN PARA SINCRONIZAR CALENDARIO AUTOMÁTICAMENTE
-- ================================================================
-- Esta función se ejecuta cuando hay cambios en las tablas relacionadas
-- para mantener actualizado el calendario del coach

-- ================================================================
-- FUNCIÓN: sync_calendar_events()
-- ================================================================

CREATE OR REPLACE FUNCTION sync_calendar_events()
RETURNS TRIGGER AS $$
BEGIN
    -- Limpiar eventos existentes para este coach/cliente/actividad
    DELETE FROM calendar_events 
    WHERE coach_id = COALESCE(NEW.coach_id, OLD.coach_id)
      AND client_id = COALESCE(NEW.client_id, OLD.client_id)
      AND activity_id = COALESCE(NEW.activity_id, OLD.activity_id);
    
    -- Re-insertar eventos actualizados
    -- (Aquí iría la lógica de inserción, pero por simplicidad
    --  llamamos a la función completa de sincronización)
    
    PERFORM sync_all_calendar_events();
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- FUNCIÓN: sync_all_calendar_events()
-- ================================================================

CREATE OR REPLACE FUNCTION sync_all_calendar_events()
RETURNS void AS $$
BEGIN
    -- Limpiar todos los eventos existentes
    TRUNCATE calendar_events RESTART IDENTITY;
    
    -- ================================================================
    -- INSERTAR EVENTOS DE TALLERES
    -- ================================================================
    
    INSERT INTO calendar_events (
        coach_id, client_id, activity_id, title, description,
        start_time, end_time, event_type, status, consultation_type,
        notes, timezone_offset, timezone_name, created_at, updated_at
    )
    SELECT 
        td.coach_id,
        et.cliente_id,
        td.actividad_id,
        CONCAT('Taller: ', td.nombre) as title,
        td.descripcion as description,
        CASE 
            WHEN jsonb_array_length(td.originales) > 0 THEN
                (td.originales->0->>'fecha')::date + 
                (td.originales->0->>'hora_inicio')::time
            ELSE NULL
        END as start_time,
        CASE 
            WHEN jsonb_array_length(td.originales) > 0 THEN
                (td.originales->0->>'fecha')::date + 
                (td.originales->0->>'hora_fin')::time
            ELSE NULL
        END as end_time,
        'workshop' as event_type,
        CASE 
            WHEN et.estado = 'completado' THEN 'completed'
            WHEN et.estado = 'cancelado' THEN 'cancelled'
            ELSE 'scheduled'
        END as status,
        NULL as consultation_type,
        CONCAT('Tema: ', td.nombre, 
               CASE WHEN jsonb_array_length(td.originales) > 0 THEN 
                   CONCAT(' - Horario: ', td.originales->0->>'hora_inicio', ' a ', td.originales->0->>'hora_fin')
               ELSE '' END
        ) as notes,
        -180 as timezone_offset,
        'America/Argentina/Buenos_Aires' as timezone_name,
        NOW() as created_at,
        NOW() as updated_at
    FROM taller_detalles td
    INNER JOIN ejecuciones_taller et ON td.actividad_id = et.actividad_id
    WHERE td.originales IS NOT NULL 
      AND jsonb_array_length(td.originales) > 0
      AND et.cliente_id IS NOT NULL
      AND (td.originales->0->>'fecha')::date >= CURRENT_DATE - INTERVAL '30 days'
      AND (td.originales->0->>'fecha')::date <= CURRENT_DATE + INTERVAL '90 days';
    
    -- ================================================================
    -- INSERTAR HORARIOS BIS DE TALLERES
    -- ================================================================
    
    INSERT INTO calendar_events (
        coach_id, client_id, activity_id, title, description,
        start_time, end_time, event_type, status, consultation_type,
        notes, timezone_offset, timezone_name, created_at, updated_at
    )
    SELECT 
        td.coach_id,
        et.cliente_id,
        td.actividad_id,
        CONCAT('Taller: ', td.nombre, ' (Bis)') as title,
        td.descripcion as description,
        CASE 
            WHEN jsonb_array_length(td.secundarios) > 0 THEN
                (td.secundarios->0->>'fecha')::date + 
                (td.secundarios->0->>'hora_inicio')::time
            ELSE NULL
        END as start_time,
        CASE 
            WHEN jsonb_array_length(td.secundarios) > 0 THEN
                (td.secundarios->0->>'fecha')::date + 
                (td.secundarios->0->>'hora_fin')::time
            ELSE NULL
        END as end_time,
        'workshop' as event_type,
        CASE 
            WHEN et.estado = 'completado' THEN 'completed'
            WHEN et.estado = 'cancelado' THEN 'cancelled'
            ELSE 'scheduled'
        END as status,
        NULL as consultation_type,
        CONCAT('Tema: ', td.nombre, ' (Horario Bis)',
               CASE WHEN jsonb_array_length(td.secundarios) > 0 THEN 
                   CONCAT(' - Horario: ', td.secundarios->0->>'hora_inicio', ' a ', td.secundarios->0->>'hora_fin')
               ELSE '' END
        ) as notes,
        -180 as timezone_offset,
        'America/Argentina/Buenos_Aires' as timezone_name,
        NOW() as created_at,
        NOW() as updated_at
    FROM taller_detalles td
    INNER JOIN ejecuciones_taller et ON td.actividad_id = et.actividad_id
    WHERE td.secundarios IS NOT NULL 
      AND jsonb_array_length(td.secundarios) > 0
      AND et.cliente_id IS NOT NULL
      AND (td.secundarios->0->>'fecha')::date >= CURRENT_DATE - INTERVAL '30 days'
      AND (td.secundarios->0->>'fecha')::date <= CURRENT_DATE + INTERVAL '90 days';
    
    -- ================================================================
    -- INSERTAR EVENTOS DE CONSULTAS
    -- ================================================================
    
    INSERT INTO calendar_events (
        coach_id, client_id, activity_id, title, description,
        start_time, end_time, event_type, status, consultation_type,
        notes, timezone_offset, timezone_name, created_at, updated_at
    )
    SELECT 
        as_schedule.coach_id,
        as_schedule.client_id,
        as_schedule.activity_id,
        CASE 
            WHEN as_schedule.session_type = 'videocall' THEN 'Consulta Virtual'
            WHEN as_schedule.session_type = 'workshop' THEN 'Taller'
            WHEN as_schedule.session_type = 'program_session' THEN 'Sesión de Programa'
            ELSE 'Consulta'
        END as title,
        CONCAT('Duración: ', as_schedule.duration_minutes, ' minutos') as description,
        (as_schedule.scheduled_date + as_schedule.scheduled_time) as start_time,
        (as_schedule.scheduled_date + as_schedule.scheduled_time + 
         (as_schedule.duration_minutes || ' minutes')::interval) as end_time,
        'consultation' as event_type,
        CASE 
            WHEN as_schedule.status = 'completed' THEN 'completed'
            WHEN as_schedule.status = 'cancelled' THEN 'cancelled'
            WHEN as_schedule.status = 'rescheduled' THEN 'rescheduled'
            ELSE 'scheduled'
        END as status,
        CASE 
            WHEN as_schedule.session_type = 'videocall' THEN 'videocall'
            ELSE 'message'
        END as consultation_type,
        COALESCE(as_schedule.notes, '') as notes,
        -180 as timezone_offset,
        'America/Argentina/Buenos_Aires' as timezone_name,
        as_schedule.created_at,
        as_schedule.updated_at
    FROM activity_schedules as_schedule
    WHERE as_schedule.scheduled_date >= CURRENT_DATE - INTERVAL '30 days'
      AND as_schedule.scheduled_date <= CURRENT_DATE + INTERVAL '90 days'
      AND as_schedule.coach_id IS NOT NULL;
    
    -- ================================================================
    -- INSERTAR EVENTOS DE PROGRAMAS
    -- ================================================================
    
    INSERT INTO calendar_events (
        coach_id, client_id, activity_id, title, description,
        start_time, end_time, event_type, status, consultation_type,
        notes, timezone_offset, timezone_name, created_at, updated_at
    )
    SELECT 
        as_schedule.coach_id,
        as_schedule.client_id,
        as_schedule.activity_id,
        CONCAT('Programa: ', a.title) as title,
        CONCAT('Sesión de programa - Duración: ', as_schedule.duration_minutes, ' minutos') as description,
        (as_schedule.scheduled_date + as_schedule.scheduled_time) as start_time,
        (as_schedule.scheduled_date + as_schedule.scheduled_time + 
         (as_schedule.duration_minutes || ' minutes')::interval) as end_time,
        'workout' as event_type,
        CASE 
            WHEN as_schedule.status = 'completed' THEN 'completed'
            WHEN as_schedule.status = 'cancelled' THEN 'cancelled'
            WHEN as_schedule.status = 'rescheduled' THEN 'rescheduled'
            ELSE 'scheduled'
        END as status,
        CASE 
            WHEN as_schedule.session_type = 'videocall' THEN 'videocall'
            ELSE NULL
        END as consultation_type,
        COALESCE(as_schedule.notes, '') as notes,
        -180 as timezone_offset,
        'America/Argentina/Buenos_Aires' as timezone_name,
        as_schedule.created_at,
        as_schedule.updated_at
    FROM activity_schedules as_schedule
    INNER JOIN activities a ON as_schedule.activity_id = a.id
    WHERE as_schedule.session_type = 'program_session'
      AND as_schedule.scheduled_date >= CURRENT_DATE - INTERVAL '30 days'
      AND as_schedule.scheduled_date <= CURRENT_DATE + INTERVAL '90 days'
      AND as_schedule.coach_id IS NOT NULL;
    
    -- Log de sincronización
    INSERT INTO calendar_sync_log (sync_type, events_count, sync_date)
    SELECT 'full_sync', COUNT(*), NOW()
    FROM calendar_events;
    
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- TABLA DE LOG PARA SINCRONIZACIÓN
-- ================================================================

CREATE TABLE IF NOT EXISTS calendar_sync_log (
    id SERIAL PRIMARY KEY,
    sync_type TEXT NOT NULL, -- 'full_sync', 'incremental', 'manual'
    events_count INTEGER DEFAULT 0,
    sync_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    details JSONB
);

-- ================================================================
-- TRIGGERS PARA SINCRONIZACIÓN AUTOMÁTICA
-- ================================================================

-- Trigger para ejecuciones_taller
DROP TRIGGER IF EXISTS trigger_sync_calendar_on_ejecuciones_taller ON ejecuciones_taller;
CREATE TRIGGER trigger_sync_calendar_on_ejecuciones_taller
    AFTER INSERT OR UPDATE OR DELETE ON ejecuciones_taller
    FOR EACH ROW
    EXECUTE FUNCTION sync_calendar_events();

-- Trigger para activity_schedules
DROP TRIGGER IF EXISTS trigger_sync_calendar_on_activity_schedules ON activity_schedules;
CREATE TRIGGER trigger_sync_calendar_on_activity_schedules
    AFTER INSERT OR UPDATE OR DELETE ON activity_schedules
    FOR EACH ROW
    EXECUTE FUNCTION sync_calendar_events();

-- Trigger para taller_detalles
DROP TRIGGER IF EXISTS trigger_sync_calendar_on_taller_detalles ON taller_detalles;
CREATE TRIGGER trigger_sync_calendar_on_taller_detalles
    AFTER INSERT OR UPDATE OR DELETE ON taller_detalles
    FOR EACH ROW
    EXECUTE FUNCTION sync_calendar_events();

-- ================================================================
-- FUNCIÓN PARA SINCRONIZACIÓN MANUAL
-- ================================================================

CREATE OR REPLACE FUNCTION manual_sync_calendar()
RETURNS TEXT AS $$
DECLARE
    event_count INTEGER;
BEGIN
    PERFORM sync_all_calendar_events();
    
    SELECT COUNT(*) INTO event_count FROM calendar_events;
    
    RETURN 'Calendario sincronizado. Total de eventos: ' || event_count;
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- COMENTARIOS PARA DOCUMENTACIÓN
-- ================================================================

COMMENT ON FUNCTION sync_all_calendar_events() IS 'Sincroniza completamente la tabla calendar_events con datos de talleres, consultas y programas';

COMMENT ON FUNCTION manual_sync_calendar() IS 'Función para sincronización manual del calendario. Retorna mensaje con cantidad de eventos';

COMMENT ON TABLE calendar_sync_log IS 'Log de sincronizaciones del calendario para auditoría';

-- ================================================================
-- INSTRUCCIONES DE USO
-- ================================================================

-- Para sincronización manual:
-- SELECT manual_sync_calendar();

-- Para ver el log de sincronizaciones:
-- SELECT * FROM calendar_sync_log ORDER BY sync_date DESC LIMIT 10;
































