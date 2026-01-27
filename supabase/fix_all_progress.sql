-- 1. Asegurar Estructura y Restricciones
ALTER TABLE public.progreso_diario_actividad 
DROP CONSTRAINT IF EXISTS progreso_diario_actividad_tipo_check;

ALTER TABLE public.progreso_diario_actividad 
ADD CONSTRAINT progreso_diario_actividad_tipo_check 
CHECK (tipo = ANY (ARRAY['programa'::text, 'taller'::text, 'documento'::text]));

ALTER TABLE public.progreso_diario_actividad 
ADD COLUMN IF NOT EXISTS enrollment_id BIGINT REFERENCES public.activity_enrollments(id) ON DELETE CASCADE;

CREATE UNIQUE INDEX IF NOT EXISTS uq_progreso_enrollment_dia 
ON public.progreso_diario_actividad(enrollment_id, fecha);

-- 2. Repopulation Function (Fixes current data)
CREATE OR REPLACE FUNCTION fix_all_progress_data() RETURNS VOID AS $$
DECLARE
    r RECORD;
    v_ok INTEGER;
    v_total INTEGER;
BEGIN
    -- Start fresh
    TRUNCATE TABLE public.progreso_diario_actividad RESTART IDENTITY;

    -- [A] Fitness
    FOR r IN SELECT * FROM public.progreso_cliente WHERE enrollment_id IS NOT NULL LOOP
        v_ok := (SELECT count(*) FROM jsonb_object_keys(r.ejercicios_completados));
        v_total := v_ok + (SELECT count(*) FROM jsonb_object_keys(r.ejercicios_pendientes));
        
        INSERT INTO public.progreso_diario_actividad (
            cliente_id, fecha, actividad_id, enrollment_id, tipo, area,
            items_objetivo, items_completados, recalculado_en
        ) VALUES (
            r.cliente_id, r.fecha, r.actividad_id, r.enrollment_id, 'programa', 'fitness',
            v_total, v_ok, NOW()
        ) ON CONFLICT (enrollment_id, fecha) DO NOTHING;
    END LOOP;

    -- [B] Nutrition
    FOR r IN SELECT * FROM public.progreso_cliente_nutricion WHERE enrollment_id IS NOT NULL LOOP
        -- Robust count (Array or Object)
        v_ok := CASE 
            WHEN jsonb_typeof(r.ejercicios_completados->'ejercicios') = 'array' THEN jsonb_array_length(r.ejercicios_completados->'ejercicios')
            WHEN jsonb_typeof(r.ejercicios_completados) = 'object' THEN (SELECT count(*) FROM jsonb_object_keys(r.ejercicios_completados))
            ELSE 0 
        END;
        v_total := v_ok + CASE 
            WHEN jsonb_typeof(r.ejercicios_pendientes->'ejercicios') = 'array' THEN jsonb_array_length(r.ejercicios_pendientes->'ejercicios')
            WHEN jsonb_typeof(r.ejercicios_pendientes) = 'object' THEN (SELECT count(*) FROM jsonb_object_keys(r.ejercicios_pendientes))
            ELSE 0 
        END;

        INSERT INTO public.progreso_diario_actividad (
            cliente_id, fecha, actividad_id, enrollment_id, tipo, area,
            items_objetivo, items_completados, recalculado_en
        ) VALUES (
            r.cliente_id, r.fecha, r.actividad_id, r.enrollment_id, 'programa', 'nutricion',
            v_total, v_ok, NOW()
        ) ON CONFLICT (enrollment_id, fecha) DO NOTHING;
    END LOOP;

    -- [C] Documents (Gamma Bomb / etc)
    FOR r IN SELECT * FROM public.client_document_progress WHERE enrollment_id IS NOT NULL LOOP
        INSERT INTO public.progreso_diario_actividad (
            cliente_id, fecha, actividad_id, enrollment_id, tipo, area,
            items_objetivo, items_completados, recalculado_en
        ) VALUES (
            r.client_id, 
            COALESCE((SELECT start_date FROM public.activity_enrollments WHERE id = r.enrollment_id), CURRENT_DATE),
            (SELECT activity_id FROM public.activity_enrollments WHERE id = r.enrollment_id),
            r.enrollment_id, 'documento', 'general',
            1, CASE WHEN r.completed THEN 1 ELSE 0 END, NOW()
        ) ON CONFLICT (enrollment_id, fecha) DO UPDATE SET
            items_objetivo = progreso_diario_actividad.items_objetivo + 1,
            items_completados = progreso_diario_actividad.items_completados + (CASE WHEN r.completed THEN 1 ELSE 0 END);
    END LOOP;

    -- [D] Talleres
    FOR r IN SELECT * FROM public.taller_progreso_temas WHERE enrollment_id IS NOT NULL LOOP
        INSERT INTO public.progreso_diario_actividad (
            cliente_id, fecha, actividad_id, enrollment_id, tipo, area,
            items_objetivo, items_completados, recalculado_en
        ) VALUES (
            r.cliente_id, r.fecha_seleccionada, r.actividad_id, r.enrollment_id, 'taller', 'general',
            1, CASE WHEN r.asistio THEN 1 ELSE 0 END, NOW()
        ) ON CONFLICT (enrollment_id, fecha) DO UPDATE SET
            items_objetivo = progreso_diario_actividad.items_objetivo + 1,
            items_completados = progreso_diario_actividad.items_completados + (CASE WHEN r.asistio THEN 1 ELSE 0 END);
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Execute Fix
SELECT fix_all_progress_data();

-- 3. Unified Trigger Function for future updates
CREATE OR REPLACE FUNCTION trigger_sync_to_daily_progress()
RETURNS TRIGGER AS $$
DECLARE
    v_total INTEGER;
    v_ok INTEGER;
    v_fecha DATE;
    v_area TEXT := 'general';
    v_type TEXT := 'programa';
    v_client_id UUID;
    v_act_id BIGINT;
BEGIN
    IF TG_TABLE_NAME = 'progreso_cliente' OR TG_TABLE_NAME = 'progreso_cliente_nutricion' THEN
        v_client_id := NEW.cliente_id;
        v_act_id := NEW.actividad_id;
        v_fecha := NEW.fecha;
        v_area := CASE WHEN TG_TABLE_NAME = 'progreso_cliente' THEN 'fitness' ELSE 'nutricion' END;
        
        -- Count (Handling Fitness/Nutrition structures)
        v_ok := CASE 
            WHEN jsonb_typeof(NEW.ejercicios_completados->'ejercicios') = 'array' THEN jsonb_array_length(NEW.ejercicios_completados->'ejercicios')
            WHEN jsonb_typeof(NEW.ejercicios_completados) = 'object' THEN (SELECT count(*) FROM jsonb_object_keys(NEW.ejercicios_completados))
            ELSE 0 
        END;
        v_total := v_ok + CASE 
            WHEN jsonb_typeof(NEW.ejercicios_pendientes->'ejercicios') = 'array' THEN jsonb_array_length(NEW.ejercicios_pendientes->'ejercicios')
            WHEN jsonb_typeof(NEW.ejercicios_pendientes) = 'object' THEN (SELECT count(*) FROM jsonb_object_keys(NEW.ejercicios_pendientes))
            ELSE 0 
        END;
        
    ELSIF TG_TABLE_NAME = 'client_document_progress' THEN
        v_client_id := NEW.client_id;
        v_act_id := (SELECT activity_id FROM public.activity_enrollments WHERE id = NEW.enrollment_id);
        v_fecha := COALESCE((SELECT start_date FROM public.activity_enrollments WHERE id = NEW.enrollment_id), CURRENT_DATE);
        v_type := 'documento';
        v_ok := CASE WHEN NEW.completed THEN 1 ELSE 0 END;
        v_total := 1;

    ELSIF TG_TABLE_NAME = 'taller_progreso_temas' THEN
        v_client_id := NEW.cliente_id;
        v_act_id := NEW.actividad_id;
        v_fecha := NEW.fecha_seleccionada;
        v_type := 'taller';
        v_ok := CASE WHEN NEW.asistio THEN 1 ELSE 0 END;
        v_total := 1;
    END IF;

    IF NEW.enrollment_id IS NOT NULL THEN
        INSERT INTO public.progreso_diario_actividad (
            cliente_id, fecha, actividad_id, enrollment_id, tipo, area,
            items_objetivo, items_completados, recalculado_en
        ) VALUES (
            v_client_id, v_fecha, v_act_id, NEW.enrollment_id, v_type, v_area,
            v_total, v_ok, NOW()
        ) ON CONFLICT (enrollment_id, fecha) DO UPDATE SET
            items_objetivo = CASE WHEN v_type = 'programa' THEN EXCLUDED.items_objetivo ELSE progreso_diario_actividad.items_objetivo + EXCLUDED.items_objetivo END,
            items_completados = CASE WHEN v_type = 'programa' THEN EXCLUDED.items_completados ELSE progreso_diario_actividad.items_completados + EXCLUDED.items_completados END,
            recalculado_en = NOW();
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Re-Apply Triggers
DROP TRIGGER IF EXISTS trg_sync_fitness ON public.progreso_cliente;
CREATE TRIGGER trg_sync_fitness AFTER INSERT OR UPDATE ON public.progreso_cliente FOR EACH ROW EXECUTE FUNCTION trigger_sync_to_daily_progress();

DROP TRIGGER IF EXISTS trg_sync_nutri ON public.progreso_cliente_nutricion;
CREATE TRIGGER trg_sync_nutri AFTER INSERT OR UPDATE ON public.progreso_cliente_nutricion FOR EACH ROW EXECUTE FUNCTION trigger_sync_to_daily_progress();

DROP TRIGGER IF EXISTS trg_sync_docs ON public.client_document_progress;
CREATE TRIGGER trg_sync_docs AFTER INSERT OR UPDATE ON public.client_document_progress FOR EACH ROW EXECUTE FUNCTION trigger_sync_to_daily_progress();

DROP TRIGGER IF EXISTS trg_sync_taller ON public.taller_progreso_temas;
CREATE TRIGGER trg_sync_taller AFTER INSERT OR UPDATE ON public.taller_progreso_temas FOR EACH ROW EXECUTE FUNCTION trigger_sync_to_daily_progress();
