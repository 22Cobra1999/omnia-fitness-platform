-- ================================================================
-- SCRIPT DE CONSOLIDACIÓN: UNIFICAR TODO EN calendar_events
-- ================================================================
-- 
-- Este script:
-- 1. Agrega campos esenciales a calendar_events
-- 2. Migra datos de activity_schedules a calendar_events
-- 3. Migra datos de google_meet_links a calendar_events
-- 4. Consolida todo en una sola tabla
--
-- INSTRUCCIONES:
-- 1. Ejecutar en Supabase SQL Editor
-- 2. Revisar los resultados
-- 3. Verificar que los datos se migraron correctamente
-- ================================================================

-- ================================================================
-- PARTE 1: AGREGAR CAMPOS ESENCIALES A calendar_events
-- ================================================================

DO $$
BEGIN
    -- Campos para cancelaciones y reprogramaciones
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'calendar_events' 
          AND column_name = 'cancelled_by'
    ) THEN
        ALTER TABLE public.calendar_events 
        ADD COLUMN cancelled_by TEXT CHECK (cancelled_by IN ('coach', 'client'));
        
        COMMENT ON COLUMN public.calendar_events.cancelled_by IS 'Quién canceló el evento: coach o client';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'calendar_events' 
          AND column_name = 'cancelled_at'
    ) THEN
        ALTER TABLE public.calendar_events 
        ADD COLUMN cancelled_at TIMESTAMPTZ;
        
        COMMENT ON COLUMN public.calendar_events.cancelled_at IS 'Cuándo se canceló el evento';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'calendar_events' 
          AND column_name = 'rescheduled_by'
    ) THEN
        ALTER TABLE public.calendar_events 
        ADD COLUMN rescheduled_by TEXT CHECK (rescheduled_by IN ('coach', 'client'));
        
        COMMENT ON COLUMN public.calendar_events.rescheduled_by IS 'Quién reprogramó el evento: coach o client';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'calendar_events' 
          AND column_name = 'rescheduled_at'
    ) THEN
        ALTER TABLE public.calendar_events 
        ADD COLUMN rescheduled_at TIMESTAMPTZ;
        
        COMMENT ON COLUMN public.calendar_events.rescheduled_at IS 'Cuándo se reprogramó el evento';
    END IF;
    
    -- Campos de Google Meet (integrados)
    -- Nota: Estos campos pueden ya existir de migraciones anteriores
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'calendar_events' 
          AND column_name = 'meet_link'
    ) THEN
        ALTER TABLE public.calendar_events 
        ADD COLUMN meet_link TEXT;
        
        COMMENT ON COLUMN public.calendar_events.meet_link IS 'Link de Google Meet para el evento';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'calendar_events' 
          AND column_name = 'meet_code'
    ) THEN
        ALTER TABLE public.calendar_events 
        ADD COLUMN meet_code TEXT;
        
        COMMENT ON COLUMN public.calendar_events.meet_code IS 'Código de Google Meet';
    END IF;
    
    -- Verificar si google_event_id existe (puede existir de migraciones anteriores)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'calendar_events' 
          AND column_name = 'google_event_id'
    ) THEN
        ALTER TABLE public.calendar_events 
        ADD COLUMN google_event_id TEXT;
        
        COMMENT ON COLUMN public.calendar_events.google_event_id IS 'ID del evento en Google Calendar';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'calendar_events' 
          AND column_name = 'coach_joined_at'
    ) THEN
        ALTER TABLE public.calendar_events 
        ADD COLUMN coach_joined_at TIMESTAMPTZ;
        
        COMMENT ON COLUMN public.calendar_events.coach_joined_at IS 'Cuándo se unió el coach a la reunión';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'calendar_events' 
          AND column_name = 'client_joined_at'
    ) THEN
        ALTER TABLE public.calendar_events 
        ADD COLUMN client_joined_at TIMESTAMPTZ;
        
        COMMENT ON COLUMN public.calendar_events.client_joined_at IS 'Cuándo se unió el cliente a la reunión';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'calendar_events' 
          AND column_name = 'meeting_started_at'
    ) THEN
        ALTER TABLE public.calendar_events 
        ADD COLUMN meeting_started_at TIMESTAMPTZ;
        
        COMMENT ON COLUMN public.calendar_events.meeting_started_at IS 'Cuándo realmente empezó la reunión';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'calendar_events' 
          AND column_name = 'meeting_ended_at'
    ) THEN
        ALTER TABLE public.calendar_events 
        ADD COLUMN meeting_ended_at TIMESTAMPTZ;
        
        COMMENT ON COLUMN public.calendar_events.meeting_ended_at IS 'Cuándo realmente terminó la reunión';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'calendar_events' 
          AND column_name = 'coach_attendance_status'
    ) THEN
        ALTER TABLE public.calendar_events 
        ADD COLUMN coach_attendance_status TEXT 
        CHECK (coach_attendance_status IN ('pending', 'present', 'absent', 'late')) 
        DEFAULT 'pending';
        
        COMMENT ON COLUMN public.calendar_events.coach_attendance_status IS 'Estado de asistencia del coach: pending, present, absent, late';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'calendar_events' 
          AND column_name = 'actual_duration_minutes'
    ) THEN
        ALTER TABLE public.calendar_events 
        ADD COLUMN actual_duration_minutes INTEGER;
        
        COMMENT ON COLUMN public.calendar_events.actual_duration_minutes IS 'Duración real de la reunión en minutos';
    END IF;
    
    RAISE NOTICE '✅ Campos agregados a calendar_events';
END $$;

-- ================================================================
-- PARTE 2: CREAR ÍNDICES PARA LOS NUEVOS CAMPOS
-- ================================================================

CREATE INDEX IF NOT EXISTS idx_calendar_events_cancelled_by 
ON public.calendar_events(cancelled_by) 
WHERE cancelled_by IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_calendar_events_rescheduled_by 
ON public.calendar_events(rescheduled_by) 
WHERE rescheduled_by IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_calendar_events_coach_joined_at 
ON public.calendar_events(coach_joined_at) 
WHERE coach_joined_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_calendar_events_coach_attendance_status 
ON public.calendar_events(coach_attendance_status);

-- ================================================================
-- PARTE 3: MIGRAR DATOS DE google_meet_links A calendar_events
-- ================================================================
-- Solo actualizar campos que no estén ya poblados

UPDATE public.calendar_events ce
SET 
    meet_link = COALESCE(ce.meet_link, gml.meet_link),
    meet_code = COALESCE(ce.meet_code, gml.meet_code),
    google_event_id = COALESCE(ce.google_event_id, gml.google_event_id),
    coach_joined_at = COALESCE(ce.coach_joined_at, gml.coach_joined_at),
    client_joined_at = COALESCE(ce.client_joined_at, gml.client_joined_at),
    meeting_started_at = COALESCE(ce.meeting_started_at, gml.meeting_started_at),
    meeting_ended_at = COALESCE(ce.meeting_ended_at, gml.meeting_ended_at),
    actual_duration_minutes = COALESCE(ce.actual_duration_minutes, gml.actual_duration_minutes),
    coach_attendance_status = CASE 
        WHEN ce.coach_attendance_status IS NOT NULL AND ce.coach_attendance_status != 'pending' 
            THEN ce.coach_attendance_status
        WHEN gml.coach_joined_at IS NOT NULL THEN 'present'
        WHEN ce.status = 'completed' AND gml.coach_joined_at IS NULL THEN 'absent'
        ELSE COALESCE(ce.coach_attendance_status, 'pending')
    END
FROM public.google_meet_links gml
WHERE ce.id = gml.calendar_event_id
  AND gml.calendar_event_id IS NOT NULL;

-- Actualizar cancelled_at y cancelled_by basado en updated_at cuando status = 'cancelled'
UPDATE public.calendar_events
SET 
    cancelled_at = updated_at,
    cancelled_by = 'coach' -- Por defecto, asumimos que el coach cancela (se actualizará en la lógica de negocio)
WHERE status = 'cancelled' 
  AND cancelled_at IS NULL;

-- Actualizar rescheduled_at y rescheduled_by basado en updated_at cuando status = 'rescheduled'
UPDATE public.calendar_events
SET 
    rescheduled_at = updated_at,
    rescheduled_by = 'coach' -- Por defecto, asumimos que el coach reprograma (se actualizará en la lógica de negocio)
WHERE status = 'rescheduled' 
  AND rescheduled_at IS NULL;

-- ================================================================
-- PARTE 4: MIGRAR DATOS DE activity_schedules A calendar_events
-- ================================================================
-- Solo migrar los que no existen ya en calendar_events

INSERT INTO public.calendar_events (
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
    created_at,
    updated_at,
    cancelled_by,
    cancelled_at,
    rescheduled_by,
    rescheduled_at
)
SELECT 
    as_schedule.coach_id,
    as_schedule.client_id,
    as_schedule.activity_id,
    COALESCE(a.title, 'Sesión programada') as title,
    CONCAT('Sesión de ', as_schedule.session_type, ' - Duración: ', as_schedule.duration_minutes, ' minutos') as description,
    (as_schedule.scheduled_date + as_schedule.scheduled_time)::TIMESTAMPTZ as start_time,
    (as_schedule.scheduled_date + as_schedule.scheduled_time + 
     (as_schedule.duration_minutes || ' minutes')::interval)::TIMESTAMPTZ as end_time,
    CASE 
        WHEN as_schedule.session_type = 'workshop' THEN 'workshop'
        WHEN as_schedule.session_type = 'videocall' THEN 'consultation'
        WHEN as_schedule.session_type = 'program_session' THEN 'workout'
        ELSE 'other'
    END as event_type,
    as_schedule.status,
    CASE 
        WHEN as_schedule.session_type = 'videocall' THEN 'videocall'
        ELSE NULL
    END as consultation_type,
    as_schedule.notes,
    as_schedule.created_at,
    as_schedule.updated_at,
    CASE WHEN as_schedule.status = 'cancelled' THEN 'coach' ELSE NULL END as cancelled_by,
    CASE WHEN as_schedule.status = 'cancelled' THEN as_schedule.updated_at ELSE NULL END as cancelled_at,
    CASE WHEN as_schedule.status = 'rescheduled' THEN 'coach' ELSE NULL END as rescheduled_by,
    CASE WHEN as_schedule.status = 'rescheduled' THEN as_schedule.updated_at ELSE NULL END as rescheduled_at
FROM public.activity_schedules as_schedule
LEFT JOIN public.activities a ON as_schedule.activity_id = a.id
WHERE NOT EXISTS (
    -- Evitar duplicados: verificar si ya existe un evento similar
    SELECT 1 FROM public.calendar_events ce
    WHERE ce.coach_id = as_schedule.coach_id
      AND ce.client_id = as_schedule.client_id
      AND ce.activity_id = as_schedule.activity_id
      AND ce.start_time::DATE = as_schedule.scheduled_date
      AND ABS(EXTRACT(EPOCH FROM (ce.start_time::TIME - as_schedule.scheduled_time))) < 300 -- 5 minutos de diferencia
)
AND as_schedule.coach_id IS NOT NULL;

-- ================================================================
-- PARTE 5: FUNCIÓN PARA CALCULAR DURACIÓN AUTOMÁTICAMENTE
-- ================================================================

CREATE OR REPLACE FUNCTION calculate_calendar_event_duration()
RETURNS TRIGGER AS $$
BEGIN
    -- Si tenemos ambos timestamps, calcular duración
    IF NEW.meeting_started_at IS NOT NULL AND NEW.meeting_ended_at IS NOT NULL THEN
        NEW.actual_duration_minutes := EXTRACT(EPOCH FROM (NEW.meeting_ended_at - NEW.meeting_started_at)) / 60;
    END IF;
    
    -- Calcular coach_attendance_status automáticamente
    IF NEW.coach_joined_at IS NOT NULL THEN
        -- Si se unió más de 5 minutos tarde, marcar como 'late'
        IF NEW.coach_joined_at > NEW.start_time + INTERVAL '5 minutes' THEN
            NEW.coach_attendance_status := 'late';
        ELSE
            NEW.coach_attendance_status := 'present';
        END IF;
    ELSIF NEW.status = 'completed' AND NEW.coach_joined_at IS NULL THEN
        -- Si el evento está completado pero no se unió, marcar como absent
        NEW.coach_attendance_status := 'absent';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para calcular duración y asistencia automáticamente
DROP TRIGGER IF EXISTS trigger_calculate_calendar_event_duration ON public.calendar_events;
CREATE TRIGGER trigger_calculate_calendar_event_duration
    BEFORE INSERT OR UPDATE ON public.calendar_events
    FOR EACH ROW
    EXECUTE FUNCTION calculate_calendar_event_duration();

-- ================================================================
-- PARTE 6: VERIFICACIÓN Y REPORTE
-- ================================================================

DO $$
DECLARE
    total_events INTEGER;
    events_with_meet INTEGER;
    events_cancelled INTEGER;
    events_rescheduled INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_events FROM public.calendar_events;
    SELECT COUNT(*) INTO events_with_meet FROM public.calendar_events WHERE meet_link IS NOT NULL;
    SELECT COUNT(*) INTO events_cancelled FROM public.calendar_events WHERE status = 'cancelled';
    SELECT COUNT(*) INTO events_rescheduled FROM public.calendar_events WHERE status = 'rescheduled';
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'RESUMEN DE MIGRACIÓN';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Total eventos en calendar_events: %', total_events;
    RAISE NOTICE 'Eventos con Google Meet: %', events_with_meet;
    RAISE NOTICE 'Eventos cancelados: %', events_cancelled;
    RAISE NOTICE 'Eventos reprogramados: %', events_rescheduled;
    RAISE NOTICE '========================================';
END $$;

-- ================================================================
-- PARTE 7: COMENTARIOS FINALES
-- ================================================================

COMMENT ON TABLE public.calendar_events IS 
'Tabla única consolidada para todos los eventos del calendario: talleres, consultas, programas y reuniones. Incluye datos de Google Meet y tracking de asistencia.';

-- ================================================================
-- FIN DEL SCRIPT
-- ================================================================

