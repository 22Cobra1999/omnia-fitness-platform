-- ================================================================
-- SCRIPT PARA CREAR UNA MEET DE PRUEBA PARA HOY A LAS 11:35
-- ================================================================
-- 
-- Este script crea un evento en calendar_events con Google Meet
-- para probar el tracking de asistencia
-- ================================================================

DO $$
DECLARE
    test_coach_id UUID;
    test_client_id UUID;
    today_date DATE;
    meet_time TIMESTAMPTZ;
    meet_end_time TIMESTAMPTZ;
    new_event_id UUID;
BEGIN
    -- Obtener un coach_id
    SELECT id INTO test_coach_id FROM auth.users WHERE email LIKE '%coach%' LIMIT 1;
    IF test_coach_id IS NULL THEN
        SELECT id INTO test_coach_id FROM auth.users LIMIT 1;
    END IF;
    
    -- Obtener un client_id
    SELECT id INTO test_client_id FROM auth.users WHERE id != test_coach_id LIMIT 1;
    
    IF test_coach_id IS NULL OR test_client_id IS NULL THEN
        RAISE EXCEPTION 'No se encontraron usuarios para las pruebas';
    END IF;
    
    -- Fecha y hora de hoy a las 11:35
    today_date := CURRENT_DATE;
    meet_time := (today_date + TIME '11:35:00')::TIMESTAMPTZ;
    meet_end_time := meet_time + INTERVAL '1 hour';
    
    RAISE NOTICE 'Creando evento para hoy a las 11:35...';
    RAISE NOTICE 'Coach ID: %', test_coach_id;
    RAISE NOTICE 'Client ID: %', test_client_id;
    RAISE NOTICE 'Fecha/Hora: %', meet_time;
    
    -- Crear evento en calendar_events
    INSERT INTO public.calendar_events (
        coach_id,
        client_id,
        title,
        description,
        start_time,
        end_time,
        event_type,
        status,
        consultation_type,
        meet_link,
        meet_code,
        google_event_id,
        coach_attendance_status,
        created_at,
        updated_at
    ) VALUES (
        test_coach_id,
        test_client_id,
        'Sesión de Prueba - Attendance Tracking',
        'Sesión de prueba para verificar el tracking de asistencia desde Google Meet',
        meet_time,
        meet_end_time,
        'consultation',
        'scheduled',
        'videocall',
        'https://meet.google.com/test-attendance-' || EXTRACT(EPOCH FROM NOW())::BIGINT,
        'test-attendance-' || EXTRACT(EPOCH FROM NOW())::BIGINT,
        'test_google_event_' || EXTRACT(EPOCH FROM NOW())::BIGINT,
        'pending',
        NOW(),
        NOW()
    ) RETURNING id INTO new_event_id;
    
    RAISE NOTICE '';
    RAISE NOTICE '✅ Evento creado exitosamente';
    RAISE NOTICE '   ID del evento: %', new_event_id;
    RAISE NOTICE '   Fecha/Hora: %', meet_time;
    RAISE NOTICE '   Meet Link: https://meet.google.com/test-attendance-...';
    RAISE NOTICE '';
    RAISE NOTICE '💡 Próximos pasos:';
    RAISE NOTICE '   1. Abre Google Meet con el link generado';
    RAISE NOTICE '   2. El sistema debería actualizar automáticamente:';
    RAISE NOTICE '      - coach_joined_at';
    RAISE NOTICE '      - meeting_started_at';
    RAISE NOTICE '      - coach_attendance_status';
    RAISE NOTICE '   3. Verifica en el calendario que se muestre correctamente';
    
END $$;

-- Verificar el evento creado
SELECT 
    id,
    title,
    start_time,
    end_time,
    meet_link,
    coach_attendance_status,
    created_at
FROM public.calendar_events
WHERE start_time::DATE = CURRENT_DATE
  AND EXTRACT(HOUR FROM start_time) = 11
  AND EXTRACT(MINUTE FROM start_time) = 35
ORDER BY created_at DESC
LIMIT 1;

