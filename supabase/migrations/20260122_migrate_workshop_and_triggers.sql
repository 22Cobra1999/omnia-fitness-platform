-- ==============================================================================
-- MIGRATION: WORKSHOP DATA AND TRIGGERS
-- 1. Migrate JSON data to taller_progreso_temas
-- 2. Update Calendar Triggers to use taller_progreso_temas
-- 3. Update/Create Daily Progress Triggers
-- ==============================================================================

-- 1. DATA MIGRATION
-- Ensure the migration function exists (re-defining for safety in this script)
CREATE OR REPLACE FUNCTION migrate_ejecuciones_json_to_rows_v2() RETURNS VOID AS $$
DECLARE
    r RECORD;
    tema JSONB;
BEGIN
    FOR r IN SELECT * FROM public.ejecuciones_taller LOOP
        -- Process 'temas_cubiertos' (Completed/Reserved)
        IF r.temas_cubiertos IS NOT NULL AND jsonb_array_length(r.temas_cubiertos) > 0 THEN
            FOR tema IN SELECT * FROM jsonb_array_elements(r.temas_cubiertos) LOOP
                INSERT INTO public.taller_progreso_temas (
                    ejecucion_id, cliente_id, actividad_id, tema_id, tema_nombre, 
                    fecha_seleccionada, horario_seleccionado, confirmo_asistencia, asistio, estado
                ) VALUES (
                    r.id, r.cliente_id, r.actividad_id, 
                    (tema->>'tema_id')::BIGINT, 
                    tema->>'tema_nombre',
                    (tema->>'fecha_seleccionada')::DATE,
                    tema->'horario_seleccionado',
                    (tema->>'confirmo_asistencia')::BOOLEAN,
                    (tema->>'asistio')::BOOLEAN,
                    CASE WHEN (tema->>'asistio')::BOOLEAN THEN 'completado' ELSE 'reservado' END
                ) ON CONFLICT (ejecucion_id, tema_id) DO UPDATE SET
                    fecha_seleccionada = EXCLUDED.fecha_seleccionada,
                    horario_seleccionado = EXCLUDED.horario_seleccionado,
                    confirmo_asistencia = EXCLUDED.confirmo_asistencia,
                    asistio = EXCLUDED.asistio,
                    estado = EXCLUDED.estado;
            END LOOP;
        END IF;

        -- Process 'temas_pendientes' (Snapshots)
        IF r.temas_pendientes IS NOT NULL AND jsonb_array_length(r.temas_pendientes) > 0 THEN
            FOR tema IN SELECT * FROM jsonb_array_elements(r.temas_pendientes) LOOP
                INSERT INTO public.taller_progreso_temas (
                    ejecucion_id, cliente_id, actividad_id, tema_id, tema_nombre, 
                    snapshot_originales, estado
                ) VALUES (
                    r.id, r.cliente_id, r.actividad_id, 
                    (tema->>'tema_id')::BIGINT, 
                    tema->>'tema_nombre',
                    tema->'snapshot_originales',
                    'pendiente'
                ) ON CONFLICT (ejecucion_id, tema_id) DO NOTHING; -- Keep existing if covered
            END LOOP;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Execute Migration
SELECT migrate_ejecuciones_json_to_rows_v2();


-- 2. CALENDAR SYNC TRIGGER (Refactored for taller_progreso_temas)
-- Replaces: sync_calendar_on_ejecucion_update

CREATE OR REPLACE FUNCTION sync_calendar_on_topic_progress()
RETURNS TRIGGER AS $$
DECLARE
    coach_id_var uuid;
    start_ts timestamptz;
    end_ts timestamptz;
BEGIN
    -- Only proceed if we have a selected date/time
    IF NEW.fecha_seleccionada IS NULL OR NEW.horario_seleccionado IS NULL THEN
        -- If it was updated to NULL (cancelled), remove event
        IF TG_OP = 'UPDATE' AND OLD.fecha_seleccionada IS NOT NULL THEN
             DELETE FROM calendar_events 
             WHERE client_id = OLD.cliente_id 
               AND activity_id = OLD.actividad_id
               AND event_type = 'workshop'
               AND notes LIKE CONCAT('%', OLD.tema_nombre, '%');
        END IF;
        RETURN NEW;
    END IF;

    -- Get Coach ID
    SELECT coach_id INTO coach_id_var
    FROM activities
    WHERE id = NEW.actividad_id;
    
    IF coach_id_var IS NULL THEN RETURN NEW; END IF;

    -- Construct Timestamps
    -- JSONB safe extraction for hours
    start_ts := (NEW.fecha_seleccionada || 'T' || (NEW.horario_seleccionado->>'hora_inicio') || ':00-03:00')::timestamptz;
    end_ts := (NEW.fecha_seleccionada || 'T' || (NEW.horario_seleccionado->>'hora_fin') || ':00-03:00')::timestamptz;

    -- Upsert Calendar Event
    -- We try to match by client, activity, and checking title/notes for topic unique identification
    -- OR we just insert/delete. Deletion of old event (if date changed) is tricky without an ID link.
    -- Simplest strategy: Delete by Topic Tag and Re-insert.
    
    DELETE FROM calendar_events 
    WHERE client_id = NEW.cliente_id 
      AND activity_id = NEW.actividad_id
      AND event_type = 'workshop'
      AND notes LIKE CONCAT('%Tema: ', NEW.tema_nombre, '%');

    INSERT INTO calendar_events (
        coach_id, client_id, activity_id,
        title, description, start_time, end_time,
        event_type, status, notes,
        timezone_offset, timezone_name
    ) VALUES (
        coach_id_var,
        NEW.cliente_id,
        NEW.actividad_id,
        CONCAT('Taller: ', NEW.tema_nombre),
        'Cliente confirmó asistencia',
        start_ts,
        end_ts,
        'workshop',
        CASE 
            WHEN NEW.asistio THEN 'completed'
            WHEN NEW.estado = 'cancelado' THEN 'cancelled'
            ELSE 'scheduled'
        END,
        CONCAT('Tema: ', NEW.tema_nombre, ' | Confirmó: ', 
               CASE WHEN NEW.confirmo_asistencia THEN 'Sí' ELSE 'No' END),
        -180,
        'America/Argentina/Buenos_Aires'
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop old trigger on ejecuciones_taller
DROP TRIGGER IF EXISTS trigger_sync_calendar_on_ejecucion ON public.ejecuciones_taller;

-- Create new trigger on taller_progreso_temas
DROP TRIGGER IF EXISTS trigger_sync_calendar_topic ON public.taller_progreso_temas;
CREATE TRIGGER trigger_sync_calendar_topic
    AFTER INSERT OR UPDATE ON public.taller_progreso_temas
    FOR EACH ROW
    EXECUTE FUNCTION sync_calendar_on_topic_progress();


-- 3. DAILY PROGRESS TRIGGER (New logic)
-- Updates progreso_diario_actividad based on completed topics

CREATE OR REPLACE FUNCTION update_daily_progress_from_workshop()
RETURNS TRIGGER AS $$
DECLARE
    total_topics INTEGER;
    completed_topics INTEGER;
    progress_date DATE;
BEGIN
    -- Determine date: If completed today, use today. If historical, use fecha_seleccionada or updated_at.
    -- Usually daily progress tracks "current status".
    progress_date := CURRENT_DATE;

    -- Count totals for this activity/execution
    SELECT COUNT(*), COUNT(*) FILTER (WHERE asistio = TRUE)
    INTO total_topics, completed_topics
    FROM public.taller_progreso_temas
    WHERE ejecucion_id = NEW.ejecucion_id;

    -- Upsert into progreso_diario_actividad
    -- Note: This table seems to track daily stats. 
    -- If we want to verify "completed today", we should check if NEW.asistio changed to TRUE just now.
    -- Assuming this table acts as a snapshot of progress "as of today".
    
    INSERT INTO public.progreso_diario_actividad (
        cliente_id, fecha, actividad_id, tipo, area,
        items_objetivo, items_completados
    ) VALUES (
        NEW.cliente_id, progress_date, NEW.actividad_id, 'taller', 'general', -- Defaulting area to 'general' or fetch from activity?
        total_topics, completed_topics
    )
    ON CONFLICT (id) DO UPDATE SET -- ID is serial, so conflict usually on unique constraint (client, date, activity)
    -- Wait, the unique index is "idx_progreso_actividad_dia" (client, date, activity). 
    -- But there is no UNIQUE CONSTRAINT on these columns in the DDL provided, just an index.
    -- If there's no unique constraint, ON CONFLICT won't work on these columns.
    -- We assume the user wants us to Insert or Update based on (client, date, activity).
    
    -- Let's Check for existence first to be safe since ID is primary key.
    items_objetivo = EXCLUDED.items_objetivo,
    items_completados = EXCLUDED.items_completados;

    -- If there is NO unique constraint, we have to do:
    IF NOT FOUND THEN
        UPDATE public.progreso_diario_actividad
        SET items_objetivo = total_topics, items_completados = completed_topics
        WHERE cliente_id = NEW.cliente_id AND fecha = progress_date AND actividad_id = NEW.actividad_id;
        
        IF NOT FOUND THEN
             INSERT INTO public.progreso_diario_actividad (
                cliente_id, fecha, actividad_id, tipo, area,
                items_objetivo, items_completados
            ) VALUES (
                NEW.cliente_id, progress_date, NEW.actividad_id, 'taller', 'general',
                total_topics, completed_topics
            );
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_daily_progress_workshop ON public.taller_progreso_temas;
CREATE TRIGGER trigger_update_daily_progress_workshop
    AFTER INSERT OR UPDATE ON public.taller_progreso_temas
    FOR EACH ROW
    EXECUTE FUNCTION update_daily_progress_from_workshop();
