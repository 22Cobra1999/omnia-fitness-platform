-- ================================================================
-- SCRIPT DE VERIFICACIÓN: CONSOLIDACIÓN DE CALENDAR EVENTS
-- ================================================================
-- 
-- Este script verifica que la consolidación se haya realizado correctamente
-- Ejecutar después de consolidate-calendar-events.sql
-- ================================================================

-- ================================================================
-- 1. VERIFICAR CAMPOS EN calendar_events
-- ================================================================

SELECT 
    'VERIFICACIÓN DE CAMPOS EN calendar_events' AS seccion,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'calendar_events'
  AND column_name IN (
    'cancelled_by', 'cancelled_at',
    'rescheduled_by', 'rescheduled_at',
    'meet_link', 'meet_code', 'google_event_id',
    'coach_joined_at', 'client_joined_at',
    'meeting_started_at', 'meeting_ended_at',
    'coach_attendance_status', 'actual_duration_minutes'
  )
ORDER BY column_name;

-- ================================================================
-- 2. VERIFICAR DATOS MIGRADOS DE google_meet_links
-- ================================================================

SELECT 
    'DATOS DE GOOGLE MEET EN calendar_events' AS seccion,
    COUNT(*) FILTER (WHERE meet_link IS NOT NULL) AS eventos_con_meet_link,
    COUNT(*) FILTER (WHERE coach_joined_at IS NOT NULL) AS eventos_con_coach_joined,
    COUNT(*) FILTER (WHERE meeting_started_at IS NOT NULL) AS eventos_con_meeting_started,
    COUNT(*) FILTER (WHERE actual_duration_minutes IS NOT NULL) AS eventos_con_duracion,
    COUNT(*) FILTER (WHERE coach_attendance_status != 'pending') AS eventos_con_estado_asistencia
FROM public.calendar_events;

-- ================================================================
-- 3. VERIFICAR DATOS MIGRADOS DE activity_schedules
-- ================================================================

SELECT 
    'COMPARACIÓN: activity_schedules vs calendar_events' AS seccion,
    (SELECT COUNT(*) FROM public.activity_schedules) AS total_activity_schedules,
    (SELECT COUNT(*) FROM public.calendar_events WHERE event_type IN ('workshop', 'consultation', 'workout')) AS total_eventos_migrados,
    (SELECT COUNT(*) FROM public.activity_schedules WHERE status = 'cancelled') AS cancelados_en_schedules,
    (SELECT COUNT(*) FROM public.calendar_events WHERE status = 'cancelled' AND cancelled_by IS NOT NULL) AS cancelados_en_events,
    (SELECT COUNT(*) FROM public.activity_schedules WHERE status = 'rescheduled') AS reprogramados_en_schedules,
    (SELECT COUNT(*) FROM public.calendar_events WHERE status = 'rescheduled' AND rescheduled_by IS NOT NULL) AS reprogramados_en_events;

-- ================================================================
-- 4. VERIFICAR ÍNDICES CREADOS
-- ================================================================

SELECT 
    'ÍNDICES EN calendar_events' AS seccion,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'calendar_events'
  AND indexname LIKE '%cancelled%' 
     OR indexname LIKE '%rescheduled%'
     OR indexname LIKE '%coach_joined%'
     OR indexname LIKE '%attendance%'
ORDER BY indexname;

-- ================================================================
-- 5. VERIFICAR TRIGGERS
-- ================================================================

SELECT 
    'TRIGGERS EN calendar_events' AS seccion,
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'public'
  AND event_object_table = 'calendar_events'
  AND trigger_name LIKE '%duration%'
ORDER BY trigger_name;

-- ================================================================
-- 6. RESUMEN FINAL
-- ================================================================

DO $$
DECLARE
    total_events INTEGER;
    events_with_meet INTEGER;
    events_cancelled INTEGER;
    events_rescheduled INTEGER;
    events_with_attendance INTEGER;
    total_schedules INTEGER;
    total_meet_links INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_events FROM public.calendar_events;
    SELECT COUNT(*) INTO events_with_meet FROM public.calendar_events WHERE meet_link IS NOT NULL;
    SELECT COUNT(*) INTO events_cancelled FROM public.calendar_events WHERE status = 'cancelled' AND cancelled_by IS NOT NULL;
    SELECT COUNT(*) INTO events_rescheduled FROM public.calendar_events WHERE status = 'rescheduled' AND rescheduled_by IS NOT NULL;
    SELECT COUNT(*) INTO events_with_attendance FROM public.calendar_events WHERE coach_attendance_status IS NOT NULL AND coach_attendance_status != 'pending';
    SELECT COUNT(*) INTO total_schedules FROM public.activity_schedules;
    SELECT COUNT(*) INTO total_meet_links FROM public.google_meet_links;
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'RESUMEN DE VERIFICACIÓN';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Total eventos en calendar_events: %', total_events;
    RAISE NOTICE 'Eventos con Google Meet: %', events_with_meet;
    RAISE NOTICE 'Eventos cancelados (con datos): %', events_cancelled;
    RAISE NOTICE 'Eventos reprogramados (con datos): %', events_rescheduled;
    RAISE NOTICE 'Eventos con estado de asistencia: %', events_with_attendance;
    RAISE NOTICE '';
    RAISE NOTICE 'Tablas antiguas (para eliminar):';
    RAISE NOTICE '  - activity_schedules: % registros', total_schedules;
    RAISE NOTICE '  - google_meet_links: % registros', total_meet_links;
    RAISE NOTICE '========================================';
END $$;

