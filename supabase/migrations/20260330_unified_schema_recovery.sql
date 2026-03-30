-- SCRIPT ÚNICO: MIGRACIÓN DE ESQUEMA + RECUPERACIÓN DE DATOS (PDA)
-- Este script asegura que las columnas existan antes de inyectar los datos.

DO $$
BEGIN
    -- 1. ASEGURAR COLUMNAS PLANAS (Schema Refactor)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'progreso_diario_actividad' AND column_name = 'fit_items_c') THEN
        ALTER TABLE public.progreso_diario_actividad 
        ADD COLUMN fit_items_c INTEGER DEFAULT 0,
        ADD COLUMN fit_items_o INTEGER DEFAULT 0,
        ADD COLUMN fit_mins_c INTEGER DEFAULT 0,
        ADD COLUMN fit_mins_o INTEGER DEFAULT 0,
        ADD COLUMN nut_items_c INTEGER DEFAULT 0,
        ADD COLUMN nut_items_o INTEGER DEFAULT 0,
        ADD COLUMN nut_kcal_c NUMERIC DEFAULT 0,
        ADD COLUMN nut_kcal_o NUMERIC DEFAULT 0,
        ADD COLUMN nut_macros JSONB DEFAULT '{}'::jsonb;
    END IF;

    -- 2. ASEGURAR ÍNDICE ÚNICO CORRECTO (cliente_id, fecha, actividad_id)
    DROP INDEX IF EXISTS public.idx_pda_cliente_fecha;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'progreso_diario_actividad' AND indexname = 'idx_pda_cliente_fecha_actividad') THEN
        CREATE UNIQUE INDEX idx_pda_cliente_fecha_actividad ON public.progreso_diario_actividad (cliente_id, fecha, actividad_id);
    END IF;
END $$;

-- 3. ACTUALIZAR TRIGGER PARA FUTUROS UPSERTS (Idempotent)
CREATE OR REPLACE FUNCTION public.update_daily_progress_from_program()
RETURNS TRIGGER AS $$
DECLARE
    v_total_items INTEGER := 0; v_completed_items INTEGER := 0;
    v_kcal_comp NUMERIC := 0; v_mins_comp INTEGER := 0;
    v_kcal_obj NUMERIC := 0; v_mins_obj INTEGER := 0;
    v_p_comp NUMERIC := 0; v_c_comp NUMERIC := 0; v_f_comp NUMERIC := 0;
    v_p_obj NUMERIC := 0; v_c_obj NUMERIC := 0; v_f_obj NUMERIC := 0;
    v_new_data JSONB; v_enrollment_id BIGINT; v_fecha DATE; v_cliente_id UUID; v_actividad_id BIGINT;
    v_json_macros JSONB;
BEGIN
    v_new_data := to_jsonb(NEW);
    v_enrollment_id := (v_new_data->>'enrollment_id')::BIGINT;
    v_fecha := (v_new_data->>'fecha')::DATE;
    v_cliente_id := (v_new_data->>'cliente_id')::UUID;
    v_actividad_id := (v_new_data->>'actividad_id')::BIGINT;

    IF TG_TABLE_NAME = 'progreso_cliente_nutricion' THEN
        v_total_items := (SELECT count(*) FROM jsonb_object_keys(COALESCE(NEW.macros, '{}'::jsonb)));
        v_completed_items := (SELECT count(*) FROM jsonb_array_elements(CASE WHEN jsonb_typeof(NEW.ejercicios_completados->'ejercicios') = 'array' THEN NEW.ejercicios_completados->'ejercicios' ELSE '[]'::jsonb END));
        SELECT COALESCE(SUM((value->>'k')::numeric), 0), COALESCE(SUM((value->>'p')::numeric), 0), COALESCE(SUM((value->>'c')::numeric), 0), COALESCE(SUM((value->>'g')::numeric), 0) INTO v_kcal_obj, v_p_obj, v_c_obj, v_f_obj FROM jsonb_each(COALESCE(NEW.macros, '{}'::jsonb));
        SELECT COALESCE(SUM((val->>'k')::numeric), 0), COALESCE(SUM((val->>'p')::numeric), 0), COALESCE(SUM((val->>'c')::numeric), 0), COALESCE(SUM((val->>'g')::numeric), 0) INTO v_kcal_comp, v_p_comp, v_c_comp, v_f_comp FROM jsonb_each(COALESCE(NEW.macros, '{}'::jsonb)) AS m(key, val) WHERE m.key::text IN (SELECT (elem::text) FROM jsonb_array_elements_text(CASE WHEN jsonb_typeof(NEW.ejercicios_completados->'ejercicios') = 'array' THEN NEW.ejercicios_completados->'ejercicios' ELSE '[]'::jsonb END) AS elem);
        v_json_macros := jsonb_build_object('p', jsonb_build_object('c', v_p_comp, 'o', v_p_obj), 'c', jsonb_build_object('c', v_c_comp, 'o', v_c_obj), 'f', jsonb_build_object('c', v_f_comp, 'o', v_f_obj));
        
        INSERT INTO public.progreso_diario_actividad (cliente_id, fecha, enrollment_id, actividad_id, nut_items_c, nut_items_o, nut_kcal_c, nut_kcal_o, nut_macros) 
        VALUES (v_cliente_id, v_fecha, v_enrollment_id, v_actividad_id, v_completed_items, v_total_items, v_kcal_comp, v_kcal_obj, v_json_macros)
        ON CONFLICT (cliente_id, fecha, actividad_id) DO UPDATE SET nut_items_c = EXCLUDED.nut_items_c, nut_items_o = EXCLUDED.nut_items_o, nut_kcal_c = EXCLUDED.nut_kcal_c, nut_kcal_o = EXCLUDED.nut_kcal_o, nut_macros = EXCLUDED.nut_macros, recalculado_en = NOW();
    ELSE
        v_total_items := (SELECT count(*) FROM jsonb_object_keys(COALESCE(NEW.minutos, '{}'::jsonb)));
        v_completed_items := (SELECT count(*) FROM jsonb_object_keys(COALESCE(NEW.ejercicios_completados, '{}'::jsonb)));
        SELECT COALESCE(SUM((value::text)::numeric), 0) INTO v_mins_obj FROM jsonb_each_text(COALESCE(NEW.minutos, '{}'::jsonb));
        SELECT COALESCE(SUM((m.value::text)::numeric), 0) INTO v_mins_comp FROM jsonb_each_text(COALESCE(NEW.minutos, '{}'::jsonb)) m WHERE m.key IN (SELECT key FROM jsonb_each(COALESCE(NEW.ejercicios_completados, '{}'::jsonb)));
        
        INSERT INTO public.progreso_diario_actividad (cliente_id, fecha, enrollment_id, actividad_id, fit_items_c, fit_items_o, fit_mins_c, fit_mins_o) 
        VALUES (v_cliente_id, v_fecha, v_enrollment_id, v_actividad_id, v_completed_items, v_total_items, v_mins_comp, v_mins_obj)
        ON CONFLICT (cliente_id, fecha, actividad_id) DO UPDATE SET fit_items_c = EXCLUDED.fit_items_c, fit_items_o = EXCLUDED.fit_items_o, fit_mins_c = EXCLUDED.fit_mins_c, fit_mins_o = EXCLUDED.fit_mins_o, recalculado_en = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. REPOBLAR DATOS (Master Recovery)
DO $$
DECLARE
    r RECORD;
BEGIN
    DELETE FROM public.progreso_diario_actividad;

    -- Fitness
    INSERT INTO public.progreso_diario_actividad (cliente_id, fecha, enrollment_id, actividad_id, tipo, fit_items_c, fit_items_o, fit_mins_c, fit_mins_o, recalculado_en)
    SELECT pc.cliente_id, pc.fecha, pc.enrollment_id, pc.actividad_id, 'programa',
        (SELECT count(*) FROM jsonb_object_keys(COALESCE(pc.ejercicios_completados, '{}'::jsonb))), 
        (SELECT count(*) FROM jsonb_object_keys(COALESCE(pc.ejercicios_completados, '{}'::jsonb))) + (SELECT count(*) FROM jsonb_object_keys(COALESCE(pc.ejercicios_pendientes, '{}'::jsonb))),
        (SELECT COALESCE(SUM((v.value::text)::numeric), 0) FROM jsonb_each_text(pc.minutos) v WHERE v.key IN (SELECT jsonb_object_keys(COALESCE(pc.ejercicios_completados, '{}'::jsonb)))),
        (SELECT COALESCE(SUM((v_obj.value::text)::numeric), 0) FROM jsonb_each_text(pc.minutos) v_obj),
        now()
    FROM public.progreso_cliente pc;

    -- Nutrición
    FOR r IN SELECT * FROM public.progreso_cliente_nutricion LOOP
        INSERT INTO public.progreso_diario_actividad (cliente_id, fecha, enrollment_id, actividad_id, tipo, nut_items_c, nut_items_o, nut_kcal_c, nut_kcal_o, nut_macros, recalculado_en)
        VALUES (r.cliente_id, r.fecha, r.enrollment_id, r.actividad_id, 'programa',
            (SELECT count(*) FROM jsonb_array_elements(CASE WHEN jsonb_typeof(r.ejercicios_completados->'ejercicios') = 'array' THEN r.ejercicios_completados->'ejercicios' ELSE '[]'::jsonb END)),
            (SELECT count(*) FROM jsonb_object_keys(COALESCE(r.macros, '{}'::jsonb))),
            (SELECT COALESCE(SUM((val->>'k')::numeric), 0) FROM jsonb_each(r.macros) m(key, val) WHERE m.key::text IN (SELECT jsonb_array_elements_text(CASE WHEN jsonb_typeof(r.ejercicios_completados->'ejercicios') = 'array' THEN r.ejercicios_completados->'ejercicios' ELSE '[]'::jsonb END))),
            (SELECT COALESCE(SUM((val->>'k')::numeric), 0) FROM jsonb_each(COALESCE(r.macros, '{}'::jsonb)) m(key, val)),
            jsonb_build_object('p', jsonb_build_object('c', (SELECT COALESCE(SUM((val->>'p')::numeric), 0) FROM jsonb_each(r.macros) m(key, val) WHERE m.key::text IN (SELECT jsonb_array_elements_text(CASE WHEN jsonb_typeof(r.ejercicios_completados->'ejercicios') = 'array' THEN r.ejercicios_completados->'ejercicios' ELSE '[]'::jsonb END))), 'o', (SELECT COALESCE(SUM((val->>'p')::numeric), 0) FROM jsonb_each(COALESCE(r.macros, '{}'::jsonb)) m(key, val))), 'c', jsonb_build_object('c', (SELECT COALESCE(SUM((val->>'c')::numeric), 0) FROM jsonb_each(r.macros) m(key, val) WHERE m.key::text IN (SELECT jsonb_array_elements_text(CASE WHEN jsonb_typeof(r.ejercicios_completados->'ejercicios') = 'array' THEN r.ejercicios_completados->'ejercicios' ELSE '[]'::jsonb END))), 'o', (SELECT COALESCE(SUM((val->>'c')::numeric), 0) FROM jsonb_each(COALESCE(r.macros, '{}'::jsonb)) m(key, val))), 'f', jsonb_build_object('c', (SELECT COALESCE(SUM((val->>'g')::numeric), 0) FROM jsonb_each(r.macros) m(key, val) WHERE m.key::text IN (SELECT jsonb_array_elements_text(CASE WHEN jsonb_typeof(r.ejercicios_completados->'ejercicios') = 'array' THEN r.ejercicios_completados->'ejercicios' ELSE '[]'::jsonb END))), 'o', (SELECT COALESCE(SUM((val->>'g')::numeric), 0) FROM jsonb_each(COALESCE(r.macros, '{}'::jsonb)) m(key, val)))),
            now()
        )
        ON CONFLICT (cliente_id, fecha, actividad_id) DO UPDATE SET nut_items_c = EXCLUDED.nut_items_c, nut_items_o = EXCLUDED.nut_items_o, nut_kcal_c = EXCLUDED.nut_kcal_c, nut_kcal_o = EXCLUDED.nut_kcal_o, nut_macros = EXCLUDED.nut_macros, recalculado_en = now();
    END LOOP;

    -- Talleres
    FOR r IN SELECT * FROM public.taller_progreso_temas LOOP
        INSERT INTO public.progreso_diario_actividad (cliente_id, fecha, enrollment_id, actividad_id, tipo, fit_items_c, fit_items_o, recalculado_en)
        VALUES (r.cliente_id, r.fecha_seleccionada, r.enrollment_id, r.actividad_id, 'taller', CASE WHEN r.asistio THEN 1 ELSE 0 END, 1, now())
        ON CONFLICT (cliente_id, fecha, actividad_id) DO UPDATE SET fit_items_c = EXCLUDED.fit_items_c, fit_items_o = EXCLUDED.fit_items_o, recalculado_en = now();
    END LOOP;
END $$;
