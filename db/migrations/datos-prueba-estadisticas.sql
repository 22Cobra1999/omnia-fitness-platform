-- ================================================================
-- SCRIPT PARA INSERTAR DATOS DE PRUEBA PARA ESTADÍSTICAS
-- ================================================================
-- 
-- Este script inserta datos de prueba en calendar_events para
-- verificar que las estadísticas del coach funcionen correctamente
-- 
-- IMPORTANTE: Reemplaza 'COACH_ID_AQUI' con un ID de coach real
-- ================================================================

-- Primero, obtener un coach_id real (reemplaza esto con un ID válido)
-- SELECT id FROM auth.users WHERE email = 'coach@example.com' LIMIT 1;

-- ================================================================
-- DATOS DE PRUEBA
-- ================================================================

-- Reemplaza este UUID con un coach_id real
DO $$
DECLARE
    test_coach_id UUID;
    test_client_id UUID;
    thirty_days_ago TIMESTAMPTZ;
    now_time TIMESTAMPTZ;
BEGIN
    -- Obtener un coach_id de prueba (ajusta según tu caso)
    SELECT id INTO test_coach_id FROM auth.users WHERE email LIKE '%coach%' LIMIT 1;
    
    -- Si no hay coach, usar el primer usuario
    IF test_coach_id IS NULL THEN
        SELECT id INTO test_coach_id FROM auth.users LIMIT 1;
    END IF;
    
    -- Obtener un client_id
    SELECT id INTO test_client_id FROM auth.users WHERE id != test_coach_id LIMIT 1;
    
    IF test_coach_id IS NULL OR test_client_id IS NULL THEN
        RAISE EXCEPTION 'No se encontraron usuarios para las pruebas';
    END IF;
    
    now_time := NOW();
    thirty_days_ago := now_time - INTERVAL '30 days';
    
    RAISE NOTICE 'Usando coach_id: %', test_coach_id;
    RAISE NOTICE 'Usando client_id: %', test_client_id;
    
    -- 1. Evento completado con asistencia (present)
    INSERT INTO public.calendar_events (
        coach_id, client_id, title, description,
        start_time, end_time, event_type, status,
        meet_link, meet_code,
        coach_joined_at, meeting_started_at, meeting_ended_at,
        coach_attendance_status, actual_duration_minutes,
        created_at, updated_at
    ) VALUES (
        test_coach_id, test_client_id,
        'Sesión de prueba - Completada',
        'Sesión completada con asistencia del coach',
        now_time - INTERVAL '5 days',
        now_time - INTERVAL '5 days' + INTERVAL '1 hour',
        'consultation', 'completed',
        'https://meet.google.com/test-123',
        'test-123',
        now_time - INTERVAL '5 days',
        now_time - INTERVAL '5 days',
        now_time - INTERVAL '5 days' + INTERVAL '55 minutes',
        'present', 55,
        now_time - INTERVAL '10 days',
        now_time - INTERVAL '5 days'
    ) ON CONFLICT DO NOTHING;
    
    -- 2. Evento cancelado por el coach
    INSERT INTO public.calendar_events (
        coach_id, client_id, title, description,
        start_time, end_time, event_type, status,
        cancelled_by, cancelled_at,
        created_at, updated_at
    ) VALUES (
        test_coach_id, test_client_id,
        'Sesión cancelada por coach',
        'Sesión cancelada por el coach',
        now_time - INTERVAL '3 days',
        now_time - INTERVAL '3 days' + INTERVAL '1 hour',
        'consultation', 'cancelled',
        'coach', now_time - INTERVAL '4 days',
        now_time - INTERVAL '8 days',
        now_time - INTERVAL '4 days'
    ) ON CONFLICT DO NOTHING;
    
    -- 3. Evento reprogramado tardíamente (dentro de 12-24h)
    INSERT INTO public.calendar_events (
        coach_id, client_id, title, description,
        start_time, end_time, event_type, status,
        rescheduled_by, rescheduled_at,
        created_at, updated_at
    ) VALUES (
        test_coach_id, test_client_id,
        'Sesión reprogramada tardíamente',
        'Reprogramada dentro de 12-24h antes',
        now_time - INTERVAL '1 day',
        now_time - INTERVAL '1 day' + INTERVAL '1 hour',
        'consultation', 'rescheduled',
        'coach', now_time - INTERVAL '1 day' - INTERVAL '18 hours',
        now_time - INTERVAL '10 days',
        now_time - INTERVAL '1 day' - INTERVAL '18 hours'
    ) ON CONFLICT DO NOTHING;
    
    -- 4. Evento con asistencia tardía (late)
    INSERT INTO public.calendar_events (
        coach_id, client_id, title, description,
        start_time, end_time, event_type, status,
        meet_link, coach_joined_at,
        coach_attendance_status,
        created_at, updated_at
    ) VALUES (
        test_coach_id, test_client_id,
        'Sesión con llegada tardía',
        'Coach llegó tarde',
        now_time - INTERVAL '2 days',
        now_time - INTERVAL '2 days' + INTERVAL '1 hour',
        'consultation', 'completed',
        'https://meet.google.com/test-456',
        now_time - INTERVAL '2 days' + INTERVAL '10 minutes', -- 10 min tarde
        'late',
        now_time - INTERVAL '9 days',
        now_time - INTERVAL '2 days'
    ) ON CONFLICT DO NOTHING;
    
    -- 5. Evento sin asistencia (absent)
    INSERT INTO public.calendar_events (
        coach_id, client_id, title, description,
        start_time, end_time, event_type, status,
        coach_attendance_status,
        created_at, updated_at
    ) VALUES (
        test_coach_id, test_client_id,
        'Sesión sin asistencia',
        'Coach no asistió',
        now_time - INTERVAL '4 days',
        now_time - INTERVAL '4 days' + INTERVAL '1 hour',
        'consultation', 'completed',
        'absent',
        now_time - INTERVAL '9 days',
        now_time - INTERVAL '4 days'
    ) ON CONFLICT DO NOTHING;
    
    RAISE NOTICE '';
    RAISE NOTICE '✅ Datos de prueba insertados:';
    RAISE NOTICE '   - 1 evento completado (present)';
    RAISE NOTICE '   - 1 evento cancelado por coach';
    RAISE NOTICE '   - 1 evento reprogramado tardíamente';
    RAISE NOTICE '   - 1 evento con llegada tardía (late)';
    RAISE NOTICE '   - 1 evento sin asistencia (absent)';
    RAISE NOTICE '';
    RAISE NOTICE 'Coach ID usado: %', test_coach_id;
    
END $$;

-- Verificar los datos insertados
SELECT 
    'Datos de prueba insertados' AS resultado,
    COUNT(*) FILTER (WHERE coach_attendance_status = 'present') AS eventos_present,
    COUNT(*) FILTER (WHERE coach_attendance_status = 'late') AS eventos_late,
    COUNT(*) FILTER (WHERE coach_attendance_status = 'absent') AS eventos_absent,
    COUNT(*) FILTER (WHERE status = 'cancelled' AND cancelled_by = 'coach') AS cancelaciones_coach,
    COUNT(*) FILTER (WHERE status = 'rescheduled' AND rescheduled_by = 'coach') AS reprogramaciones_coach
FROM public.calendar_events
WHERE start_time >= NOW() - INTERVAL '30 days';

