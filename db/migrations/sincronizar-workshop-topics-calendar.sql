-- ================================================================
-- SCRIPT PARA SINCRONIZAR WORKSHOP_TOPICS A CALENDAR_EVENTS
-- ================================================================
-- 
-- Este script convierte los temas de talleres (workshop_topics) 
-- con sus fechas (original_dates y bis_dates) a eventos en calendar_events
-- ================================================================

-- Función para sincronizar workshop_topics a calendar_events
CREATE OR REPLACE FUNCTION sync_workshop_topics_to_calendar()
RETURNS INTEGER AS $$
DECLARE
    v_topic RECORD;
    v_date TEXT;
    v_start_time TIMESTAMPTZ;
    v_end_time TIMESTAMPTZ;
    v_coach_id UUID;
    v_activity RECORD;
    events_created INTEGER := 0;
BEGIN
    -- Iterar sobre todos los temas activos
    FOR v_topic IN 
        SELECT * FROM workshop_topics 
        WHERE is_active = TRUE
        AND start_date <= CURRENT_DATE + INTERVAL '90 days'
        AND end_date >= CURRENT_DATE - INTERVAL '30 days'
    LOOP
        -- Obtener información de la actividad y coach
        SELECT a.coach_id INTO v_coach_id
        FROM activities a
        WHERE a.id = v_topic.activity_id;
        
        IF v_coach_id IS NULL THEN
            CONTINUE;
        END IF;
        
        -- Procesar fechas del horario ORIGINAL
        IF v_topic.original_dates IS NOT NULL AND jsonb_array_length(v_topic.original_dates) > 0 THEN
            FOR v_date IN SELECT jsonb_array_elements_text(v_topic.original_dates)
            LOOP
                -- Construir timestamps
                v_start_time := (v_date::DATE + v_topic.original_start_time)::TIMESTAMPTZ;
                v_end_time := (v_date::DATE + v_topic.original_end_time)::TIMESTAMPTZ;
                
                -- Insertar evento si no existe ya
                INSERT INTO calendar_events (
                    coach_id,
                    activity_id,
                    title,
                    description,
                    start_time,
                    end_time,
                    event_type,
                    status,
                    notes,
                    created_at,
                    updated_at
                )
                SELECT 
                    v_coach_id,
                    v_topic.activity_id,
                    CONCAT('Taller: ', v_topic.topic_title),
                    COALESCE(v_topic.topic_description, ''),
                    v_start_time,
                    v_end_time,
                    'workshop',
                    'scheduled',
                    CONCAT('Tema #', v_topic.topic_number, ' - Horario Original'),
                    NOW(),
                    NOW()
                WHERE NOT EXISTS (
                    SELECT 1 FROM calendar_events ce
                    WHERE ce.coach_id = v_coach_id
                      AND ce.activity_id = v_topic.activity_id
                      AND ce.start_time = v_start_time
                      AND ce.event_type = 'workshop'
                );
                
                IF FOUND THEN
                    events_created := events_created + 1;
                END IF;
            END LOOP;
        END IF;
        
        -- Procesar fechas del horario BIS (si está habilitado)
        IF v_topic.bis_enabled = TRUE 
           AND v_topic.bis_dates IS NOT NULL 
           AND jsonb_array_length(v_topic.bis_dates) > 0 
        THEN
            FOR v_date IN SELECT jsonb_array_elements_text(v_topic.bis_dates)
            LOOP
                -- Construir timestamps
                v_start_time := (v_date::DATE + v_topic.bis_start_time)::TIMESTAMPTZ;
                v_end_time := (v_date::DATE + v_topic.bis_end_time)::TIMESTAMPTZ;
                
                -- Insertar evento si no existe ya
                INSERT INTO calendar_events (
                    coach_id,
                    activity_id,
                    title,
                    description,
                    start_time,
                    end_time,
                    event_type,
                    status,
                    notes,
                    created_at,
                    updated_at
                )
                SELECT 
                    v_coach_id,
                    v_topic.activity_id,
                    CONCAT('Taller: ', v_topic.topic_title, ' (Bis)'),
                    COALESCE(v_topic.topic_description, ''),
                    v_start_time,
                    v_end_time,
                    'workshop',
                    'scheduled',
                    CONCAT('Tema #', v_topic.topic_number, ' - Horario Bis'),
                    NOW(),
                    NOW()
                WHERE NOT EXISTS (
                    SELECT 1 FROM calendar_events ce
                    WHERE ce.coach_id = v_coach_id
                      AND ce.activity_id = v_topic.activity_id
                      AND ce.start_time = v_start_time
                      AND ce.event_type = 'workshop'
                );
                
                IF FOUND THEN
                    events_created := events_created + 1;
                END IF;
            END LOOP;
        END IF;
    END LOOP;
    
    RETURN events_created;
END;
$$ LANGUAGE plpgsql;

-- Ejecutar la sincronización
DO $$
DECLARE
    events_count INTEGER;
BEGIN
    SELECT sync_workshop_topics_to_calendar() INTO events_count;
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'SINCRONIZACIÓN COMPLETADA';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Eventos creados: %', events_count;
    RAISE NOTICE '========================================';
END $$;

-- Verificar resultados
SELECT 
    'Eventos de taller en calendario' AS resultado,
    COUNT(*) AS total,
    COUNT(*) FILTER (WHERE start_time::DATE >= '2024-12-30' AND start_time::DATE <= '2024-12-31') AS eventos_30_31_dic
FROM calendar_events
WHERE event_type = 'workshop'
  AND start_time >= CURRENT_DATE - INTERVAL '30 days'
  AND start_time <= CURRENT_DATE + INTERVAL '90 days';

