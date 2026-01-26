-- Migration to add enrollment_id to progress tracking tables (FIXED V4 - FINAL)
-- This fixes the bug where multiple enrollments of the same activity share progress.

-- 0. Fix the failing trigger functions to be more robust
-- Function 1: Daily progress sync
CREATE OR REPLACE FUNCTION update_daily_progress_from_program()
RETURNS TRIGGER AS $$
DECLARE
    v_total_items INTEGER;
    v_completed_items INTEGER;
    v_kcal NUMERIC := 0;
    v_protein NUMERIC := 0;
    v_carbs NUMERIC := 0;
    v_fat NUMERIC := 0;
    v_mins INTEGER := 0;
    v_area TEXT;
BEGIN
    -- Determine Area
    IF TG_TABLE_NAME = 'progreso_cliente_nutricion' THEN
        v_area := 'nutricion';
        
        -- Count items (Plates) - Robust check for array/object
        v_completed_items := CASE 
            WHEN jsonb_typeof(NEW.ejercicios_completados->'ejercicios') = 'array' THEN jsonb_array_length(NEW.ejercicios_completados->'ejercicios')
            WHEN jsonb_typeof(NEW.ejercicios_completados) = 'object' THEN (SELECT count(*) FROM jsonb_object_keys(NEW.ejercicios_completados))
            ELSE 0 
        END;
        
        v_total_items := v_completed_items + CASE 
            WHEN jsonb_typeof(NEW.ejercicios_pendientes->'ejercicios') = 'array' THEN jsonb_array_length(NEW.ejercicios_pendientes->'ejercicios')
            WHEN jsonb_typeof(NEW.ejercicios_pendientes) = 'object' THEN (SELECT count(*) FROM jsonb_object_keys(NEW.ejercicios_pendientes))
            ELSE 0 
        END;
        
        -- Macros calculation (from NEW.macros)
        IF jsonb_typeof(NEW.macros) = 'object' THEN
            SELECT 
                SUM(COALESCE((value->>'proteinas')::numeric, 0) * 4 + COALESCE((value->>'carbohidratos')::numeric, 0) * 4 + COALESCE((value->>'grasas')::numeric, 0) * 9),
                SUM(COALESCE((value->>'proteinas')::numeric, 0)),
                SUM(COALESCE((value->>'carbohidratos')::numeric, 0)),
                SUM(COALESCE((value->>'grasas')::numeric, 0))
            INTO v_kcal, v_protein, v_carbs, v_fat
            FROM jsonb_each(NEW.macros);
        END IF;
        
    ELSE
        v_area := 'fitness';
        
        -- Count items (Exercises)
        v_completed_items := CASE WHEN jsonb_typeof(NEW.ejercicios_completados) = 'object' THEN (SELECT count(*) FROM jsonb_object_keys(NEW.ejercicios_completados)) ELSE 0 END;
        v_total_items := v_completed_items + CASE WHEN jsonb_typeof(NEW.ejercicios_pendientes) = 'object' THEN (SELECT count(*) FROM jsonb_object_keys(NEW.ejercicios_pendientes)) ELSE 0 END;
        
        -- Calories and Minutes (from pc.calorias_json / minutos_json)
        IF jsonb_typeof(NEW.calorias_json) = 'object' THEN
            SELECT SUM((value::text)::numeric) INTO v_kcal FROM jsonb_each_text(NEW.calorias_json);
        END IF;
        IF jsonb_typeof(NEW.minutos_json) = 'object' THEN
            SELECT SUM((value::text)::numeric) INTO v_mins FROM jsonb_each_text(NEW.minutos_json);
        END IF;
    END IF;

    -- Upsert into progreso_diario_actividad
    BEGIN
        INSERT INTO public.progreso_diario_actividad (
            cliente_id, fecha, actividad_id, tipo, area,
            items_objetivo, items_completados, 
            calorias, proteinas, carbohidratos, grasas, minutos,
            recalculado_en
        ) VALUES (
            NEW.cliente_id, NEW.fecha, NEW.actividad_id, 'programa', v_area,
            v_total_items, v_completed_items,
            v_kcal, v_protein, v_carbs, v_fat, v_mins,
            NOW()
        );
    EXCEPTION WHEN unique_violation THEN
        UPDATE public.progreso_diario_actividad
        SET items_objetivo = v_total_items,
            items_completados = v_completed_items,
            calorias = v_kcal,
            proteinas = v_protein,
            carbohidratos = v_carbs,
            grasas = v_fat,
            minutos = v_mins,
            recalculado_en = NOW()
        WHERE cliente_id = NEW.cliente_id AND fecha = NEW.fecha AND actividad_id = NEW.actividad_id;
    END;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function 2: Calendar sync (Robust check for tema_nombre)
CREATE OR REPLACE FUNCTION sync_calendar_on_topic_progress()
RETURNS TRIGGER AS $$
DECLARE
    coach_id_var uuid;
    start_ts timestamptz;
    end_ts timestamptz;
    v_tema_nombre TEXT;
BEGIN
    -- Safe extraction of tema_nombre to avoid "new" has no field error
    BEGIN
        v_tema_nombre := NEW.tema_nombre;
    EXCEPTION WHEN OTHERS THEN
        v_tema_nombre := 'Tema Desconocido';
    END;

    -- Only proceed if we have a selected date/time
    IF NEW.fecha_seleccionada IS NULL OR NEW.horario_seleccionado IS NULL THEN
        -- If it was updated to NULL (cancelled), remove event
        IF TG_OP = 'UPDATE' AND OLD.fecha_seleccionada IS NOT NULL THEN
             DELETE FROM calendar_events 
             WHERE client_id = OLD.client_id 
               AND activity_id = OLD.actividad_id
               AND event_type = 'workshop'
               AND title LIKE CONCAT('%', COALESCE(OLD.tema_nombre, ''), '%');
        END IF;
        RETURN NEW;
    END IF;

    -- Get Coach ID
    SELECT coach_id INTO coach_id_var
    FROM activities
    WHERE id = NEW.actividad_id;
    
    IF coach_id_var IS NULL THEN RETURN NEW; END IF;

    -- Construct Timestamps
    start_ts := (NEW.fecha_seleccionada || 'T' || (NEW.horario_seleccionado->>'hora_inicio') || ':00-03:00')::timestamptz;
    end_ts := (NEW.fecha_seleccionada || 'T' || (NEW.horario_seleccionado->>'hora_fin') || ':00-03:00')::timestamptz;

    -- Delete old event for this topic
    DELETE FROM calendar_events 
    WHERE client_id = NEW.cliente_id 
      AND activity_id = NEW.actividad_id
      AND event_type = 'workshop'
      AND title LIKE CONCAT('%', COALESCE(v_tema_nombre, ''), '%');

    -- Insert new calendar event
    INSERT INTO calendar_events (
        coach_id, client_id, activity_id,
        title, description, start_time, end_time,
        event_type, status,
        timezone_offset, timezone_name
    ) VALUES (
        coach_id_var,
        NEW.cliente_id,
        NEW.actividad_id,
        CONCAT('Taller: ', v_tema_nombre),
        CONCAT('Cliente confirmó asistencia. ', 
               CASE WHEN NEW.confirmo_asistencia THEN 'Reservado' ELSE '' END),
        start_ts,
        end_ts,
        'workshop',
        CASE 
            WHEN NEW.asistio THEN 'completed'
            WHEN NEW.estado = 'cancelado' THEN 'cancelled'
            ELSE 'scheduled'
        END,
        -180,
        'America/Argentina/Buenos_Aires'
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1. client_document_progress (English names: client_id, activity_id)
ALTER TABLE public.client_document_progress ADD COLUMN IF NOT EXISTS enrollment_id BIGINT REFERENCES public.activity_enrollments(id) ON DELETE CASCADE;

-- Disable USER triggers to avoid recursive/faulty firing during migration (SAFE FOR SUPABASE)
ALTER TABLE public.client_document_progress DISABLE TRIGGER USER;

UPDATE public.client_document_progress p
SET enrollment_id = (
    SELECT id 
    FROM public.activity_enrollments e 
    WHERE e.client_id = p.client_id 
    AND e.activity_id = p.activity_id
    AND e.created_at <= p.created_at
    ORDER BY e.created_at DESC
    LIMIT 1
)
WHERE enrollment_id IS NULL;

UPDATE public.client_document_progress p
SET enrollment_id = (
    SELECT id 
    FROM public.activity_enrollments e 
    WHERE e.client_id = p.client_id 
    AND e.activity_id = p.activity_id
    ORDER BY e.created_at DESC
    LIMIT 1
)
WHERE enrollment_id IS NULL;

ALTER TABLE public.client_document_progress ENABLE TRIGGER USER;

ALTER TABLE public.client_document_progress DROP CONSTRAINT IF EXISTS client_document_progress_client_id_activity_id_topic_id_key;
ALTER TABLE public.client_document_progress ADD CONSTRAINT client_document_progress_enrollment_topic_key UNIQUE (client_id, enrollment_id, topic_id);

-- 2. progreso_cliente (Spanish names: cliente_id, actividad_id)
ALTER TABLE public.progreso_cliente ADD COLUMN IF NOT EXISTS enrollment_id BIGINT REFERENCES public.activity_enrollments(id) ON DELETE CASCADE;

ALTER TABLE public.progreso_cliente DISABLE TRIGGER USER;

UPDATE public.progreso_cliente p
SET enrollment_id = (
    SELECT id 
    FROM public.activity_enrollments e 
    WHERE e.client_id = p.cliente_id 
    AND e.activity_id = p.actividad_id
    AND e.created_at <= p.fecha_creacion
    ORDER BY e.created_at DESC
    LIMIT 1
)
WHERE enrollment_id IS NULL;

UPDATE public.progreso_cliente p
SET enrollment_id = (
    SELECT id 
    FROM public.activity_enrollments e 
    WHERE e.client_id = p.cliente_id 
    AND e.activity_id = p.actividad_id
    ORDER BY e.created_at DESC
    LIMIT 1
)
WHERE enrollment_id IS NULL;

ALTER TABLE public.progreso_cliente ENABLE TRIGGER USER;

CREATE INDEX IF NOT EXISTS idx_progreso_cliente_enrollment ON public.progreso_cliente(enrollment_id);
DROP INDEX IF EXISTS idx_progreso_cliente_actividad_cliente_fecha;
CREATE INDEX IF NOT EXISTS idx_progreso_cliente_enrollment_fecha ON public.progreso_cliente(enrollment_id, fecha);

-- 3. progreso_cliente_nutricion (Spanish names: cliente_id, actividad_id)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'progreso_cliente_nutricion') THEN
        ALTER TABLE public.progreso_cliente_nutricion ADD COLUMN IF NOT EXISTS enrollment_id BIGINT REFERENCES public.activity_enrollments(id) ON DELETE CASCADE;
        
        ALTER TABLE public.progreso_cliente_nutricion DISABLE TRIGGER USER;

        UPDATE public.progreso_cliente_nutricion p
        SET enrollment_id = (
            SELECT id 
            FROM public.activity_enrollments e 
            WHERE e.client_id = p.cliente_id 
            AND e.activity_id = p.actividad_id
            AND e.created_at <= p.fecha_creacion
            ORDER BY e.created_at DESC
            LIMIT 1
        )
        WHERE enrollment_id IS NULL;
        
        UPDATE public.progreso_cliente_nutricion p
        SET enrollment_id = (
            SELECT id 
            FROM public.activity_enrollments e 
            WHERE e.client_id = p.cliente_id 
            AND e.activity_id = p.actividad_id
            ORDER BY e.created_at DESC
            LIMIT 1
        )
        WHERE enrollment_id IS NULL;

        ALTER TABLE public.progreso_cliente_nutricion ENABLE TRIGGER USER;

        CREATE INDEX IF NOT EXISTS idx_progreso_cliente_nutricion_enrollment ON public.progreso_cliente_nutricion(enrollment_id);
    END IF;
END $$;

-- 4. taller_progreso_temas (Spanish names: cliente_id, actividad_id)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'taller_progreso_temas') THEN
        ALTER TABLE public.taller_progreso_temas ADD COLUMN IF NOT EXISTS enrollment_id BIGINT REFERENCES public.activity_enrollments(id) ON DELETE CASCADE;
        
        ALTER TABLE public.taller_progreso_temas DISABLE TRIGGER USER;

        UPDATE public.taller_progreso_temas p
        SET enrollment_id = (
            SELECT id 
            FROM public.activity_enrollments e 
            WHERE e.client_id = p.cliente_id 
            AND e.activity_id = p.actividad_id
            ORDER BY e.created_at DESC
            LIMIT 1
        )
        WHERE enrollment_id IS NULL;

        ALTER TABLE public.taller_progreso_temas ENABLE TRIGGER USER;

        CREATE INDEX IF NOT EXISTS idx_taller_progreso_temas_enrollment ON public.taller_progreso_temas(enrollment_id);
    END IF;
END $$;
