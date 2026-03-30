-- FINAL RESTORE & TRIGGER: Fix Nutrition Metrics (k, p, c, g keys)
-- 1. Update Trigger Function (OUTSIDE DO block)
CREATE OR REPLACE FUNCTION public.update_daily_progress_from_program()
RETURNS TRIGGER AS $$
DECLARE
    v_total_items INTEGER := 0;
    v_completed_items INTEGER := 0;
    v_kcal_comp NUMERIC := 0;
    v_mins_comp INTEGER := 0;
    v_kcal_obj NUMERIC := 0;
    v_mins_obj INTEGER := 0;
    v_p_comp NUMERIC := 0; v_c_comp NUMERIC := 0; v_f_comp NUMERIC := 0;
    v_p_obj NUMERIC := 0; v_c_obj NUMERIC := 0; v_f_obj NUMERIC := 0;
    v_new_data JSONB; v_enrollment_id BIGINT; v_fecha DATE; v_cliente_id UUID; v_actividad_id BIGINT;
    v_json_items JSONB; v_json_metrics JSONB; v_json_macros JSONB;
BEGIN
    v_new_data := to_jsonb(NEW);
    v_enrollment_id := (v_new_data->>'enrollment_id')::BIGINT;
    v_fecha := (v_new_data->>'fecha')::DATE;
    v_cliente_id := (v_new_data->>'cliente_id')::UUID;
    v_actividad_id := (v_new_data->>'actividad_id')::BIGINT;

    IF TG_TABLE_NAME = 'progreso_cliente_nutricion' THEN
        v_total_items := (SELECT count(*) FROM jsonb_object_keys(COALESCE(NEW.macros, '{}'::jsonb)));
        v_completed_items := (SELECT count(*) FROM jsonb_array_elements(CASE WHEN jsonb_typeof(NEW.ejercicios_completados->'ejercicios') = 'array' THEN NEW.ejercicios_completados->'ejercicios' ELSE '[]'::jsonb END));
        
        SELECT COALESCE(SUM((value->>'k')::numeric), 0), COALESCE(SUM((value->>'m')::numeric), 0), COALESCE(SUM((value->>'p')::numeric), 0), COALESCE(SUM((value->>'c')::numeric), 0), COALESCE(SUM((value->>'g')::numeric), 0) INTO v_kcal_obj, v_mins_obj, v_p_obj, v_c_obj, v_f_obj FROM jsonb_each(COALESCE(NEW.macros, '{}'::jsonb));
        SELECT COALESCE(SUM((val->>'k')::numeric), 0), COALESCE(SUM((val->>'m')::numeric), 0), COALESCE(SUM((val->>'p')::numeric), 0), COALESCE(SUM((val->>'c')::numeric), 0), COALESCE(SUM((val->>'g')::numeric), 0) INTO v_kcal_comp, v_mins_comp, v_p_comp, v_c_comp, v_f_comp FROM jsonb_each(COALESCE(NEW.macros, '{}'::jsonb)) AS m(key, val) WHERE m.key::text IN (SELECT (elem::text) FROM jsonb_array_elements_text(CASE WHEN jsonb_typeof(NEW.ejercicios_completados->'ejercicios') = 'array' THEN NEW.ejercicios_completados->'ejercicios' ELSE '[]'::jsonb END) AS elem);
        
        v_json_items := jsonb_build_object('completados', v_completed_items, 'objetivo', v_total_items);
        v_json_metrics := jsonb_build_object('completados', v_kcal_comp, 'objetivo', v_kcal_obj);
        v_json_macros := jsonb_build_object('p', jsonb_build_object('c', v_p_comp, 'o', v_p_obj), 'c', jsonb_build_object('c', v_c_comp, 'o', v_c_obj), 'f', jsonb_build_object('c', v_f_comp, 'o', v_f_obj));
        
        INSERT INTO public.progreso_diario_actividad (cliente_id, fecha, enrollment_id, actividad_id, nutricion_items, nutricion_calorias, nutricion_macros) VALUES (v_cliente_id, v_fecha, v_enrollment_id, v_actividad_id, v_json_items, v_json_metrics, v_json_macros)
        ON CONFLICT (cliente_id, fecha) DO UPDATE SET nutricion_items = EXCLUDED.nutricion_items, nutricion_calorias = EXCLUDED.nutricion_calorias, nutricion_macros = EXCLUDED.nutricion_macros, enrollment_id = EXCLUDED.enrollment_id, actividad_id = EXCLUDED.actividad_id, recalculado_en = NOW();
    ELSE
        v_total_items := (SELECT count(*) FROM jsonb_object_keys(COALESCE(NEW.minutos, '{}'::jsonb)));
        v_completed_items := (SELECT count(*) FROM jsonb_object_keys(COALESCE(NEW.ejercicios_completados, '{}'::jsonb)));
        SELECT COALESCE(SUM((value::text)::numeric), 0) INTO v_mins_obj FROM jsonb_each_text(COALESCE(NEW.minutos, '{}'::jsonb));
        SELECT COALESCE(SUM((m.value::text)::numeric), 0) INTO v_mins_comp FROM jsonb_each_text(COALESCE(NEW.minutos, '{}'::jsonb)) m WHERE m.key IN (SELECT key FROM jsonb_each(COALESCE(NEW.ejercicios_completados, '{}'::jsonb)));
        v_json_items := jsonb_build_object('completados', v_completed_items, 'objetivo', v_total_items);
        v_json_metrics := jsonb_build_object('completados', v_mins_comp, 'objetivo', v_mins_obj);
        INSERT INTO public.progreso_diario_actividad (cliente_id, fecha, enrollment_id, actividad_id, fitness_items, fitness_minutos) VALUES (v_cliente_id, v_fecha, v_enrollment_id, v_actividad_id, v_json_items, v_json_metrics)
        ON CONFLICT (cliente_id, fecha) DO UPDATE SET fitness_items = EXCLUDED.fitness_items, fitness_minutos = EXCLUDED.fitness_minutos, enrollment_id = EXCLUDED.enrollment_id, actividad_id = EXCLUDED.actividad_id, recalculado_en = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Backfill (Inside DO block)
DO $$
BEGIN
    TRUNCATE public.progreso_diario_actividad;
    
    INSERT INTO public.progreso_diario_actividad (cliente_id, fecha, enrollment_id, actividad_id, tipo, fitness_items, fitness_minutos, recalculado_en)
    SELECT cliente_id, fecha, enrollment_id, actividad_id, 'programa',
        jsonb_build_object('completados', COALESCE(CASE WHEN jsonb_typeof(ejercicios_completados) = 'object' THEN (SELECT count(*) FROM jsonb_object_keys(ejercicios_completados)) ELSE 0 END, 0), 'objetivo', (COALESCE(CASE WHEN jsonb_typeof(ejercicios_completados) = 'object' THEN (SELECT count(*) FROM jsonb_object_keys(ejercicios_completados)) ELSE 0 END, 0) + COALESCE(CASE WHEN jsonb_typeof(ejercicios_pendientes) = 'object' THEN (SELECT count(*) FROM jsonb_object_keys(ejercicios_pendientes)) ELSE 0 END, 0))),
        jsonb_build_object('completados', (SELECT COALESCE(SUM((v.value::text)::numeric), 0) FROM jsonb_each_text(minutos) v WHERE v.key IN (SELECT jsonb_object_keys(COALESCE(ejercicios_completados, '{}'::jsonb)))), 'objetivo', (SELECT COALESCE(SUM((v_obj.value::text)::numeric), 0) FROM jsonb_each_text(minutos) v_obj)),
        now()
    FROM public.progreso_cliente ON CONFLICT (cliente_id, fecha) DO UPDATE SET fitness_items = EXCLUDED.fitness_items, fitness_minutos = EXCLUDED.fitness_minutos;

    INSERT INTO public.progreso_diario_actividad (cliente_id, fecha, enrollment_id, actividad_id, tipo, nutricion_items, nutricion_calorias, nutricion_macros, recalculado_en)
    SELECT cliente_id, fecha, enrollment_id, actividad_id, 'programa',
        jsonb_build_object('completados', (SELECT count(*) FROM jsonb_array_elements(CASE WHEN jsonb_typeof(ejercicios_completados->'ejercicios') = 'array' THEN ejercicios_completados->'ejercicios' ELSE '[]'::jsonb END)), 'objetivo', (SELECT count(*) FROM jsonb_object_keys(macros))),
        jsonb_build_object('completados', (SELECT COALESCE(SUM((val->>'k')::numeric), 0) FROM jsonb_each(macros) m(key, val) WHERE m.key::text IN (SELECT jsonb_array_elements_text(CASE WHEN jsonb_typeof(ejercicios_completados->'ejercicios') = 'array' THEN ejercicios_completados->'ejercicios' ELSE '[]'::jsonb END))), 'objetivo', (SELECT COALESCE(SUM((val->>'k')::numeric), 0) FROM jsonb_each(macros) m(key, val))),
        jsonb_build_object('p', jsonb_build_object('c', (SELECT COALESCE(SUM((val->>'p')::numeric), 0) FROM jsonb_each(macros) m(key, val) WHERE m.key::text IN (SELECT jsonb_array_elements_text(CASE WHEN jsonb_typeof(ejercicios_completados->'ejercicios') = 'array' THEN ejercicios_completados->'ejercicios' ELSE '[]'::jsonb END))), 'o', (SELECT COALESCE(SUM((val->>'p')::numeric), 0) FROM jsonb_each(macros) m(key, val))), 'c', jsonb_build_object('c', (SELECT COALESCE(SUM((val->>'c')::numeric), 0) FROM jsonb_each(macros) m(key, val) WHERE m.key::text IN (SELECT jsonb_array_elements_text(CASE WHEN jsonb_typeof(ejercicios_completados->'ejercicios') = 'array' THEN ejercicios_completados->'ejercicios' ELSE '[]'::jsonb END))), 'o', (SELECT COALESCE(SUM((val->>'c')::numeric), 0) FROM jsonb_each(macros) m(key, val))), 'f', jsonb_build_object('c', (SELECT COALESCE(SUM((val->>'g')::numeric), 0) FROM jsonb_each(macros) m(key, val) WHERE m.key::text IN (SELECT jsonb_array_elements_text(CASE WHEN jsonb_typeof(ejercicios_completados->'ejercicios') = 'array' THEN ejercicios_completados->'ejercicios' ELSE '[]'::jsonb END))), 'o', (SELECT COALESCE(SUM((val->>'g')::numeric), 0) FROM jsonb_each(macros) m(key, val)))),
        now()
    FROM public.progreso_cliente_nutricion ON CONFLICT (cliente_id, fecha) DO UPDATE SET nutricion_items = EXCLUDED.nutricion_items, nutricion_calorias = EXCLUDED.nutricion_calorias, nutricion_macros = EXCLUDED.nutricion_macros;
END $$;
