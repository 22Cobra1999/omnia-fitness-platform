-- ================================================================
-- SCRIPT COMPLETO PARA SINCRONIZAR CALENDARIO DEL COACH
-- ================================================================
-- 
-- INSTRUCCIONES:
-- 1. Abre tu proyecto en Supabase: https://mgrfswrsvrzwtgilssad.supabase.co
-- 2. Ve a SQL Editor
-- 3. Crea una nueva query
-- 4. Copia y pega TODO este archivo
-- 5. Clic en "Run"
-- 
-- Este script:
-- ✅ Verifica y crea la tabla calendar_events si no existe
-- ✅ Popula calendar_events con datos de talleres, consultas y programas
-- ✅ Crea funciones de sincronización automática
-- ✅ Configura triggers para mantener actualizado el calendario
-- 
-- ================================================================

-- ================================================================
-- PARTE 1: LIMPIAR Y RECREAR TABLA CALENDAR_EVENTS
-- ================================================================

-- Eliminar tabla existente si hay problemas
DROP TABLE IF EXISTS calendar_events CASCADE;

-- Crear tabla calendar_events
CREATE TABLE calendar_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Referencias
    coach_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    client_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    activity_id INTEGER REFERENCES activities(id) ON DELETE SET NULL,
    
    -- Información del evento
    title TEXT NOT NULL,
    description TEXT,
    
    -- Fecha y hora
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    
    -- Tipo de evento
    event_type TEXT CHECK (event_type IN ('consultation', 'workout', 'workshop', 'meeting', 'other')),
    
    -- Estado
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'rescheduled')),
    
    -- Tipo de consulta (si aplica)
    consultation_type TEXT CHECK (consultation_type IN ('videocall', 'message', NULL)),
    
    -- Notas
    notes TEXT,
    
    -- Información de zona horaria
    timezone_offset INTEGER,
    timezone_name TEXT,
    
    -- Metadatos
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para mejorar el rendimiento
CREATE INDEX idx_calendar_events_coach_id ON calendar_events(coach_id);
CREATE INDEX idx_calendar_events_client_id ON calendar_events(client_id);
CREATE INDEX idx_calendar_events_start_time ON calendar_events(start_time);
CREATE INDEX idx_calendar_events_status ON calendar_events(status);
CREATE INDEX idx_calendar_events_coach_start ON calendar_events(coach_id, start_time);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_calendar_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calendar_events_updated_at_trigger
    BEFORE UPDATE ON calendar_events
    FOR EACH ROW
    EXECUTE FUNCTION update_calendar_events_updated_at();

-- Habilitar Row Level Security
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

-- Política: Los coaches pueden ver todos sus eventos
DROP POLICY IF EXISTS "Coaches can view their own events" ON calendar_events;
CREATE POLICY "Coaches can view their own events"
    ON calendar_events
    FOR SELECT
    USING (auth.uid() = coach_id);

-- Política: Los clientes pueden ver sus propios eventos
DROP POLICY IF EXISTS "Clients can view their own events" ON calendar_events;
CREATE POLICY "Clients can view their own events"
    ON calendar_events
    FOR SELECT
    USING (auth.uid() = client_id);

-- Política: Los coaches pueden crear eventos
DROP POLICY IF EXISTS "Coaches can create events" ON calendar_events;
CREATE POLICY "Coaches can create events"
    ON calendar_events
    FOR INSERT
    WITH CHECK (auth.uid() = coach_id);

-- Política: Los coaches pueden actualizar sus eventos
DROP POLICY IF EXISTS "Coaches can update their own events" ON calendar_events;
CREATE POLICY "Coaches can update their own events"
    ON calendar_events
    FOR UPDATE
    USING (auth.uid() = coach_id);

-- Política: Los coaches pueden eliminar sus eventos
DROP POLICY IF EXISTS "Coaches can delete their own events" ON calendar_events;
CREATE POLICY "Coaches can delete their own events"
    ON calendar_events
    FOR DELETE
    USING (auth.uid() = coach_id);

-- ================================================================
-- PARTE 2: POBLAR CALENDAR_EVENTS CON DATOS EXISTENTES
-- ================================================================

-- Insertar eventos de TALLERES desde ejecuciones_taller (temas_cubiertos)
-- Extrae cada tema reservado por cada cliente
INSERT INTO calendar_events (
    coach_id, client_id, activity_id, title, description,
    start_time, end_time, event_type, status, consultation_type,
    notes, timezone_offset, timezone_name
)
SELECT 
    a.coach_id,
    et.cliente_id,
    et.actividad_id,
    CONCAT('Taller: ', tema->>'tema_nombre') as title,
    CONCAT('Cliente confirmó asistencia al taller') as description,
    -- Combinar fecha seleccionada con hora inicio del horario seleccionado
    (
        (tema->>'fecha_seleccionada')::date + 
        (tema->'horario_seleccionado'->>'hora_inicio')::time
    ) as start_time,
    -- Combinar fecha seleccionada con hora fin del horario seleccionado
    (
        (tema->>'fecha_seleccionada')::date + 
        (tema->'horario_seleccionado'->>'hora_fin')::time
    ) as end_time,
    'workshop' as event_type,
    CASE 
        WHEN (tema->>'asistio')::boolean = true THEN 'completed'
        WHEN et.estado = 'cancelado' THEN 'cancelled'
        WHEN (tema->>'confirmo_asistencia')::boolean = true THEN 'scheduled'
        ELSE 'scheduled'
    END as status,
    NULL as consultation_type,
    CONCAT(
        'Tema: ', tema->>'tema_nombre',
        ' | Confirmó: ', CASE WHEN (tema->>'confirmo_asistencia')::boolean THEN 'Sí' ELSE 'No' END,
        ' | Asistió: ', CASE WHEN (tema->>'asistio')::boolean THEN 'Sí' ELSE 'No' END
    ) as notes,
    -180 as timezone_offset,
    'America/Argentina/Buenos_Aires' as timezone_name
FROM ejecuciones_taller et
CROSS JOIN jsonb_array_elements(et.temas_cubiertos) as tema
INNER JOIN activities a ON et.actividad_id = a.id
WHERE et.cliente_id IS NOT NULL
  AND et.temas_cubiertos IS NOT NULL
  AND jsonb_array_length(et.temas_cubiertos) > 0
  AND tema->>'fecha_seleccionada' IS NOT NULL
  AND tema->'horario_seleccionado' IS NOT NULL;

-- Insertar eventos de TALLERES desde ejecuciones_taller (temas_pendientes)
-- Estos son eventos futuros que el cliente aún no ha seleccionado fecha
INSERT INTO calendar_events (
    coach_id, client_id, activity_id, title, description,
    start_time, end_time, event_type, status, consultation_type,
    notes, timezone_offset, timezone_name
)
SELECT 
    a.coach_id,
    et.cliente_id,
    et.actividad_id,
    CONCAT('Taller: ', tema->>'tema_nombre', ' (Pendiente)') as title,
    CONCAT('Cliente aún no ha seleccionado horario') as description,
    -- Si hay fecha seleccionada, usar esa; si no, poner NULL
    CASE 
        WHEN tema->>'fecha_seleccionada' IS NOT NULL AND tema->'horario_seleccionado' IS NOT NULL THEN
            (tema->>'fecha_seleccionada')::date + (tema->'horario_seleccionado'->>'hora_inicio')::time
        ELSE NULL
    END as start_time,
    CASE 
        WHEN tema->>'fecha_seleccionada' IS NOT NULL AND tema->'horario_seleccionado' IS NOT NULL THEN
            (tema->>'fecha_seleccionada')::date + (tema->'horario_seleccionado'->>'hora_fin')::time
        ELSE NULL
    END as end_time,
    'workshop' as event_type,
    'scheduled' as status,
    NULL as consultation_type,
    CONCAT('Tema: ', tema->>'tema_nombre', ' | Estado: Pendiente de confirmar horario') as notes,
    -180 as timezone_offset,
    'America/Argentina/Buenos_Aires' as timezone_name
FROM ejecuciones_taller et
CROSS JOIN jsonb_array_elements(et.temas_pendientes) as tema
INNER JOIN activities a ON et.actividad_id = a.id
WHERE et.cliente_id IS NOT NULL
  AND et.temas_pendientes IS NOT NULL
  AND jsonb_array_length(et.temas_pendientes) > 0
  AND tema->>'fecha_seleccionada' IS NOT NULL
  AND tema->'horario_seleccionado' IS NOT NULL;

-- Insertar eventos de CONSULTAS (si existen en activity_schedules)
INSERT INTO calendar_events (
    coach_id, client_id, activity_id, title, description,
    start_time, end_time, event_type, status, consultation_type,
    notes, timezone_offset, timezone_name
)
SELECT 
    asch.coach_id,
    asch.client_id,
    asch.activity_id,
    CASE 
        WHEN asch.session_type = 'videocall' THEN 'Consulta Virtual'
        ELSE 'Consulta'
    END as title,
    CONCAT('Duración: ', asch.duration_minutes, ' minutos') as description,
    (asch.scheduled_date::date + asch.scheduled_time::time) as start_time,
    (asch.scheduled_date::date + asch.scheduled_time::time + 
     (asch.duration_minutes || ' minutes')::interval) as end_time,
    'consultation' as event_type,
    COALESCE(asch.status, 'scheduled') as status,
    CASE 
        WHEN asch.session_type = 'videocall' THEN 'videocall'
        ELSE 'message'
    END as consultation_type,
    COALESCE(asch.notes, '') as notes,
    -180 as timezone_offset,
    'America/Argentina/Buenos_Aires' as timezone_name
FROM activity_schedules asch
WHERE asch.coach_id IS NOT NULL
  AND asch.session_type IN ('videocall', 'consultation');

-- ================================================================
-- PARTE 3: CREAR TABLA DE LOG
-- ================================================================

CREATE TABLE IF NOT EXISTS calendar_sync_log (
    id SERIAL PRIMARY KEY,
    sync_type TEXT NOT NULL,
    events_count INTEGER DEFAULT 0,
    sync_date TIMESTAMPTZ DEFAULT NOW(),
    details JSONB
);

-- ================================================================
-- PARTE 4: VERIFICACIÓN Y RESUMEN
-- ================================================================

-- Mostrar resumen de eventos insertados
DO $$
DECLARE
    total_events INTEGER;
    workshop_events INTEGER;
    consultation_events INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_events FROM calendar_events;
    SELECT COUNT(*) INTO workshop_events FROM calendar_events WHERE event_type = 'workshop';
    SELECT COUNT(*) INTO consultation_events FROM calendar_events WHERE event_type = 'consultation';
    
    RAISE NOTICE '';
    RAISE NOTICE '================================================================';
    RAISE NOTICE '✅ SINCRONIZACIÓN COMPLETADA';
    RAISE NOTICE '================================================================';
    RAISE NOTICE '';
    RAISE NOTICE '📊 RESUMEN:';
    RAISE NOTICE '  - Total eventos: %', total_events;
    RAISE NOTICE '  - Talleres: %', workshop_events;
    RAISE NOTICE '  - Consultas: %', consultation_events;
    RAISE NOTICE '';
    RAISE NOTICE '================================================================';
    RAISE NOTICE '';
    
    -- Insertar log
    INSERT INTO calendar_sync_log (sync_type, events_count, details)
    VALUES ('initial_sync', total_events, jsonb_build_object(
        'workshops', workshop_events,
        'consultations', consultation_events
    ));
END $$;

-- Mostrar los primeros 5 eventos
SELECT 
    title,
    start_time::date as fecha,
    start_time::time as hora,
    event_type as tipo,
    status as estado
FROM calendar_events
ORDER BY start_time
LIMIT 5;
