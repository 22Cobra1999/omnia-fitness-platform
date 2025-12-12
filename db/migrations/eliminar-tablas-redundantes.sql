-- ================================================================
-- SCRIPT PARA ELIMINAR TABLAS REDUNDANTES
-- ================================================================
-- 
-- IMPORTANTE: Este script elimina las tablas que ya no se usan
-- después de la consolidación en calendar_events.
-- 
-- TABLAS A ELIMINAR:
-- 1. google_meet_links (datos migrados a calendar_events)
-- 2. activity_schedules (datos migrados a calendar_events)
--
-- ADVERTENCIA: 
-- - Asegúrate de haber ejecutado consolidate-calendar-events.sql
-- - Asegúrate de haber verificado con verificar-consolidacion.sql
-- - Este script elimina las tablas y TODOS sus datos
-- ================================================================

-- ================================================================
-- PARTE 1: VERIFICACIÓN PREVIA
-- ================================================================

DO $$
DECLARE
    total_events INTEGER;
    events_with_meet INTEGER;
    total_schedules INTEGER;
    total_meet_links INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_events FROM public.calendar_events;
    SELECT COUNT(*) INTO events_with_meet FROM public.calendar_events WHERE meet_link IS NOT NULL;
    SELECT COUNT(*) INTO total_schedules FROM public.activity_schedules;
    SELECT COUNT(*) INTO total_meet_links FROM public.google_meet_links;
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'VERIFICACIÓN PREVIA A ELIMINACIÓN';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Total eventos en calendar_events: %', total_events;
    RAISE NOTICE 'Eventos con Google Meet migrados: %', events_with_meet;
    RAISE NOTICE 'Registros en activity_schedules: %', total_schedules;
    RAISE NOTICE 'Registros en google_meet_links: %', total_meet_links;
    RAISE NOTICE '';
    
    IF total_events = 0 THEN
        RAISE EXCEPTION 'ERROR: No hay eventos en calendar_events. No se puede proceder.';
    END IF;
    
    IF total_schedules > 0 AND events_with_meet = 0 AND total_meet_links > 0 THEN
        RAISE WARNING 'ADVERTENCIA: Hay datos en google_meet_links que pueden no haberse migrado completamente.';
    END IF;
    
    RAISE NOTICE '✅ Verificación completada. Procediendo con la eliminación...';
    RAISE NOTICE '========================================';
END $$;

-- ================================================================
-- PARTE 2: ELIMINAR DEPENDENCIAS Y TABLAS
-- ================================================================

-- 1. Eliminar tabla meeting_attendance_logs (depende de google_meet_links)
DROP TABLE IF EXISTS public.meeting_attendance_logs CASCADE;

-- 2. Eliminar tabla google_meet_links
DROP TABLE IF EXISTS public.google_meet_links CASCADE;

-- 3. Eliminar tabla activity_schedules
-- NOTA: Verificar si hay foreign keys que dependan de esta tabla
DROP TABLE IF EXISTS public.activity_schedules CASCADE;

-- ================================================================
-- PARTE 3: LIMPIAR FUNCIONES Y TRIGGERS RELACIONADOS
-- ================================================================

-- Eliminar función de duración de google_meet_links si existe
DROP FUNCTION IF EXISTS public.calculate_meeting_duration() CASCADE;

-- ================================================================
-- PARTE 4: VERIFICACIÓN POST-ELIMINACIÓN
-- ================================================================

DO $$
DECLARE
    tables_exist BOOLEAN;
BEGIN
    -- Verificar que las tablas fueron eliminadas
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_name IN ('google_meet_links', 'activity_schedules', 'meeting_attendance_logs')
    ) INTO tables_exist;
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'VERIFICACIÓN POST-ELIMINACIÓN';
    RAISE NOTICE '========================================';
    
    IF tables_exist THEN
        RAISE WARNING 'ADVERTENCIA: Algunas tablas aún existen. Verificar manualmente.';
    ELSE
        RAISE NOTICE '✅ Tablas eliminadas correctamente:';
        RAISE NOTICE '   ✅ google_meet_links';
        RAISE NOTICE '   ✅ activity_schedules';
        RAISE NOTICE '   ✅ meeting_attendance_logs';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '✅ Consolidación completada.';
    RAISE NOTICE '   Todas las funcionalidades ahora usan calendar_events';
    RAISE NOTICE '========================================';
END $$;

-- ================================================================
-- PARTE 5: VERIFICAR QUE calendar_events SIGUE FUNCIONANDO
-- ================================================================

SELECT 
    'VERIFICACIÓN FINAL: calendar_events' AS seccion,
    COUNT(*) AS total_eventos,
    COUNT(*) FILTER (WHERE meet_link IS NOT NULL) AS con_meet_link,
    COUNT(*) FILTER (WHERE cancelled_by IS NOT NULL) AS con_cancelacion,
    COUNT(*) FILTER (WHERE rescheduled_by IS NOT NULL) AS con_reprogramacion,
    COUNT(*) FILTER (WHERE coach_attendance_status IS NOT NULL) AS con_asistencia
FROM public.calendar_events;

-- ================================================================
-- FIN DEL SCRIPT
-- ================================================================

