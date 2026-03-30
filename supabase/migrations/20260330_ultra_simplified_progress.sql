-- MIGRACION: ESTRUCTURA ULTRA-SIMPLIFICADA DE PROGRESO (FLAT COLUMNS)
-- Esta migración optimiza la tabla para consultas rápidas de calendarios y anillos.

-- 1. Agregar columnas planas si no existen
ALTER TABLE public.progreso_diario_actividad 
ADD COLUMN IF NOT EXISTS fit_items_c INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS fit_items_o INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS fit_mins_c INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS fit_mins_o INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS nut_items_c INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS nut_items_o INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS nut_kcal_c NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS nut_kcal_o NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS nut_macros JSONB DEFAULT '{}'::jsonb;

-- 2. Actualizar el Índice Único para incluir actividad_id
-- Esto permite tener registros separados por programa en el mismo día.
DROP INDEX IF EXISTS public.idx_pda_cliente_fecha;
CREATE UNIQUE INDEX IF NOT EXISTS idx_pda_cliente_fecha_actividad ON public.progreso_diario_actividad (cliente_id, fecha, actividad_id);

-- 3. Actualizar la Función del Trigger
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
        -- NUTRITION
        v_total_items := (SELECT count(*) FROM jsonb_object_keys(COALESCE(NEW.macros, '{}'::jsonb)));
        v_completed_items := (SELECT count(*) FROM jsonb_array_elements(CASE WHEN jsonb_typeof(NEW.ejercicios_completados->'ejercicios') = 'array' THEN NEW.ejercicios_completados->'ejercicios' ELSE '[]'::jsonb END));
        
        SELECT COALESCE(SUM((value->>'k')::numeric), 0), COALESCE(SUM((value->>'p')::numeric), 0), COALESCE(SUM((value->>'c')::numeric), 0), COALESCE(SUM((value->>'g')::numeric), 0) INTO v_kcal_obj, v_p_obj, v_c_obj, v_f_obj FROM jsonb_each(COALESCE(NEW.macros, '{}'::jsonb));
        SELECT COALESCE(SUM((val->>'k')::numeric), 0), COALESCE(SUM((val->>'p')::numeric), 0), COALESCE(SUM((val->>'c')::numeric), 0), COALESCE(SUM((val->>'g')::numeric), 0) INTO v_kcal_comp, v_p_comp, v_c_comp, v_f_comp FROM jsonb_each(COALESCE(NEW.macros, '{}'::jsonb)) AS m(key, val) WHERE m.key::text IN (SELECT (elem::text) FROM jsonb_array_elements_text(CASE WHEN jsonb_typeof(NEW.ejercicios_completados->'ejercicios') = 'array' THEN NEW.ejercicios_completados->'ejercicios' ELSE '[]'::jsonb END) AS elem);
        
        v_json_macros := jsonb_build_object('p', jsonb_build_object('c', v_p_comp, 'o', v_p_obj), 'c', jsonb_build_object('c', v_c_comp, 'o', v_c_obj), 'f', jsonb_build_object('c', v_f_comp, 'o', v_f_obj));
        
        INSERT INTO public.progreso_diario_actividad (cliente_id, fecha, enrollment_id, actividad_id, nut_items_c, nut_items_o, nut_kcal_c, nut_kcal_o, nut_macros) 
        VALUES (v_cliente_id, v_fecha, v_enrollment_id, v_actividad_id, v_completed_items, v_total_items, v_kcal_comp, v_kcal_obj, v_json_macros)
        ON CONFLICT (cliente_id, fecha, actividad_id) 
        DO UPDATE SET 
            nut_items_c = EXCLUDED.nut_items_c, nut_items_o = EXCLUDED.nut_items_o, 
            nut_kcal_c = EXCLUDED.nut_kcal_c, nut_kcal_o = EXCLUDED.nut_kcal_o, 
            nut_macros = EXCLUDED.nut_macros, recalculado_en = NOW();
    ELSE
        -- FITNESS
        v_total_items := (SELECT count(*) FROM jsonb_object_keys(COALESCE(NEW.minutos, '{}'::jsonb)));
        v_completed_items := (SELECT count(*) FROM jsonb_object_keys(COALESCE(NEW.ejercicios_completados, '{}'::jsonb)));
        SELECT COALESCE(SUM((value::text)::numeric), 0) INTO v_mins_obj FROM jsonb_each_text(COALESCE(NEW.minutos, '{}'::jsonb));
        SELECT COALESCE(SUM((m.value::text)::numeric), 0) INTO v_mins_comp FROM jsonb_each_text(COALESCE(NEW.minutos, '{}'::jsonb)) m WHERE m.key IN (SELECT key FROM jsonb_each(COALESCE(NEW.ejercicios_completados, '{}'::jsonb)));
        
        INSERT INTO public.progreso_diario_actividad (cliente_id, fecha, enrollment_id, actividad_id, fit_items_c, fit_items_o, fit_mins_c, fit_mins_o) 
        VALUES (v_cliente_id, v_fecha, v_enrollment_id, v_actividad_id, v_completed_items, v_total_items, v_mins_comp, v_mins_obj)
        ON CONFLICT (cliente_id, fecha, actividad_id) 
        DO UPDATE SET 
            fit_items_c = EXCLUDED.fit_items_c, fit_items_o = EXCLUDED.fit_items_o, 
            fit_mins_c = EXCLUDED.fit_mins_c, fit_mins_o = EXCLUDED.fit_mins_o, 
            recalculado_en = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
