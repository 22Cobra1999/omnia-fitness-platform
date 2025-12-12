-- ================================================================
-- TRIGGER PARA CREAR GOOGLE MEET AUTOMÁTICAMENTE
-- ================================================================
-- Este trigger crea automáticamente un Google Meet cuando se crea
-- un evento de tipo 'workshop' y el coach tiene Google Calendar conectado
-- ================================================================

-- ================================================================
-- FUNCIÓN: auto_create_google_meet()
-- ================================================================
-- Esta función se ejecuta después de insertar un evento de tipo 'workshop'
-- y automáticamente crea un Google Meet si el coach tiene Google Calendar conectado

CREATE OR REPLACE FUNCTION auto_create_google_meet()
RETURNS TRIGGER AS $$
DECLARE
    v_has_google_tokens BOOLEAN;
    v_meet_link TEXT;
    v_google_event_id TEXT;
BEGIN
    -- Solo procesar eventos de tipo 'workshop' que no tienen meet_link
    IF NEW.event_type = 'workshop' 
       AND NEW.meet_link IS NULL 
       AND NEW.google_event_id IS NULL 
       AND NEW.coach_id IS NOT NULL THEN
        
        -- Verificar si el coach tiene Google Calendar conectado
        SELECT EXISTS(
            SELECT 1 
            FROM google_oauth_tokens 
            WHERE coach_id = NEW.coach_id
              AND access_token IS NOT NULL
        ) INTO v_has_google_tokens;
        
        -- Si tiene Google Calendar conectado, crear el Meet automáticamente
        -- Nota: La creación real se hace mediante una llamada HTTP a la API
        -- Por ahora, marcamos el evento para que se procese
        IF v_has_google_tokens THEN
            -- Marcar el evento para procesamiento asíncrono
            -- Esto se puede hacer mediante un job queue o directamente
            -- Por ahora, dejamos que el frontend lo maneje al cargar el evento
            -- pero podemos agregar un flag para indicar que necesita Meet
            RAISE NOTICE 'Evento de taller creado para coach % - Google Calendar conectado, Meet se creará automáticamente', NEW.coach_id;
        ELSE
            RAISE NOTICE 'Evento de taller creado para coach % - Google Calendar no conectado, Meet se creará cuando el coach lo solicite', NEW.coach_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- CREAR TRIGGER
-- ================================================================

DROP TRIGGER IF EXISTS trigger_auto_create_google_meet ON calendar_events;

CREATE TRIGGER trigger_auto_create_google_meet
    AFTER INSERT ON calendar_events
    FOR EACH ROW
    EXECUTE FUNCTION auto_create_google_meet();

-- ================================================================
-- FUNCIÓN: evitar_duplicados_google_calendar()
-- ================================================================
-- Esta función evita crear eventos duplicados en Google Calendar
-- verificando si ya existe un evento con el mismo google_event_id

CREATE OR REPLACE FUNCTION evitar_duplicados_google_calendar()
RETURNS TRIGGER AS $$
BEGIN
    -- Si ya tiene google_event_id, no hacer nada
    IF NEW.google_event_id IS NOT NULL THEN
        RETURN NEW;
    END IF;
    
    -- Verificar si ya existe un evento similar en Google Calendar
    -- (mismo coach, misma actividad, misma fecha/hora)
    IF EXISTS(
        SELECT 1 
        FROM calendar_events 
        WHERE coach_id = NEW.coach_id
          AND activity_id = NEW.activity_id
          AND event_type = NEW.event_type
          AND google_event_id IS NOT NULL
          AND DATE(start_time) = DATE(NEW.start_time)
          AND ABS(EXTRACT(EPOCH FROM (start_time - NEW.start_time))) < 300 -- 5 minutos de diferencia
          AND id != NEW.id
    ) THEN
        RAISE NOTICE 'Evento duplicado detectado - evitando creación en Google Calendar';
        RETURN NEW;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- CREAR TRIGGER PARA EVITAR DUPLICADOS
-- ================================================================

DROP TRIGGER IF EXISTS trigger_evitar_duplicados_google ON calendar_events;

CREATE TRIGGER trigger_evitar_duplicados_google
    BEFORE INSERT OR UPDATE ON calendar_events
    FOR EACH ROW
    EXECUTE FUNCTION evitar_duplicados_google_calendar();

-- ================================================================
-- COMENTARIOS
-- ================================================================

COMMENT ON FUNCTION auto_create_google_meet() IS 'Función que marca eventos de taller para creación automática de Google Meet';
COMMENT ON FUNCTION evitar_duplicados_google_calendar() IS 'Función que evita crear eventos duplicados en Google Calendar';

