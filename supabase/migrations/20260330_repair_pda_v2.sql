-- MIGRACIÓN DE REPARACIÓN V2: RESILIENTE A COLUMNAS FALTANTES
-- Este script recrea la tabla y restaura datos detectando qué columnas existen realmente.

BEGIN;

-- 1. Respaldo preventivo
CREATE TABLE IF NOT EXISTS public.pda_temp_recovery AS SELECT * FROM public.progreso_diario_actividad;

-- 2. Limpieza total de la tabla (DROP & CREATE)
DROP TABLE IF EXISTS public.progreso_diario_actividad CASCADE;

CREATE TABLE public.progreso_diario_actividad (
  id BIGSERIAL PRIMARY KEY,
  cliente_id UUID NOT NULL,
  fecha DATE NOT NULL,
  actividad_id BIGINT,
  enrollment_id BIGINT,
  tipo TEXT CHECK (tipo IN ('programa', 'taller', 'documento')),
  
  -- Fitness (Flat)
  fit_items_c INTEGER DEFAULT 0,
  fit_items_o INTEGER DEFAULT 0,
  fit_mins_c INTEGER DEFAULT 0,
  fit_mins_o INTEGER DEFAULT 0,
  fit_kcal_c INTEGER DEFAULT 0,
  fit_kcal_o INTEGER DEFAULT 0,
  
  -- Nutrición (Flat)
  nut_items_c INTEGER DEFAULT 0,
  nut_items_o INTEGER DEFAULT 0,
  nut_kcal_c NUMERIC DEFAULT 0,
  nut_kcal_o NUMERIC DEFAULT 0,
  nut_macros JSONB DEFAULT '{}'::JSONB,
  
  recalculado_en TIMESTAMP DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_pda_cliente_fecha_v2 ON public.progreso_diario_actividad (cliente_id, fecha);
CREATE INDEX idx_pda_enrollment_fecha_v2 ON public.progreso_diario_actividad (enrollment_id, fecha);
CREATE UNIQUE INDEX idx_pda_unique_v2 ON public.progreso_diario_actividad (cliente_id, fecha, actividad_id);

-- 3. Restauración "Segura" por partes
-- Primero insertamos los registros base (metadatos)
INSERT INTO public.progreso_diario_actividad (cliente_id, fecha, actividad_id, enrollment_id, tipo, recalculado_en)
SELECT DISTINCT cliente_id, fecha, actividad_id, enrollment_id, tipo, recalculado_en FROM public.pda_temp_recovery;

-- Ahora usamos bloques anónimos para actualizar columnas SI existen en el backup
DO $$ 
BEGIN 
    -- Fitness Items C
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pda_temp_recovery' AND column_name='fit_items_c') THEN
        UPDATE public.progreso_diario_actividad p SET fit_items_c = r.fit_items_c FROM public.pda_temp_recovery r WHERE p.cliente_id = r.cliente_id AND p.fecha = r.fecha AND p.actividad_id = r.actividad_id;
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pda_temp_recovery' AND column_name='items_completados') THEN
        UPDATE public.progreso_diario_actividad p SET fit_items_c = r.items_completados FROM public.pda_temp_recovery r WHERE p.cliente_id = r.cliente_id AND p.fecha = r.fecha AND p.actividad_id = r.actividad_id;
    END IF;

    -- Fitness Items O
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pda_temp_recovery' AND column_name='fit_items_o') THEN
        UPDATE public.progreso_diario_actividad p SET fit_items_o = r.fit_items_o FROM public.pda_temp_recovery r WHERE p.cliente_id = r.cliente_id AND p.fecha = r.fecha AND p.actividad_id = r.actividad_id;
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pda_temp_recovery' AND column_name='items_objetivo') THEN
        UPDATE public.progreso_diario_actividad p SET fit_items_o = r.items_objetivo FROM public.pda_temp_recovery r WHERE p.cliente_id = r.cliente_id AND p.fecha = r.fecha AND p.actividad_id = r.actividad_id;
    END IF;

    -- Fitness Kcal (Objetivo)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pda_temp_recovery' AND column_name='fit_kcal_o') THEN
        UPDATE public.progreso_diario_actividad p SET fit_kcal_o = r.fit_kcal_o FROM public.pda_temp_recovery r WHERE p.cliente_id = r.cliente_id AND p.fecha = r.fecha AND p.actividad_id = r.actividad_id;
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pda_temp_recovery' AND column_name='calorias_objetivo') THEN
        UPDATE public.progreso_diario_actividad p SET fit_kcal_o = r.calorias_objetivo::int FROM public.pda_temp_recovery r WHERE p.cliente_id = r.cliente_id AND p.fecha = r.fecha AND p.actividad_id = r.actividad_id;
    END IF;

    -- Mismos patrones para Nutrición...
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pda_temp_recovery' AND column_name='nut_kcal_c') THEN
        UPDATE public.progreso_diario_actividad p SET nut_kcal_c = r.nut_kcal_c FROM public.pda_temp_recovery r WHERE p.cliente_id = r.cliente_id AND p.fecha = r.fecha AND p.actividad_id = r.actividad_id;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pda_temp_recovery' AND column_name='nut_kcal_o') THEN
        UPDATE public.progreso_diario_actividad p SET nut_kcal_o = r.nut_kcal_o FROM public.pda_temp_recovery r WHERE p.cliente_id = r.cliente_id AND p.fecha = r.fecha AND p.actividad_id = r.actividad_id;
    END IF;

END $$;

COMMIT;

-- 4. Reinstalar Trigger (Idempotente)
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
        
        INSERT INTO public.progreso_diario_actividad (cliente_id, fecha, enrollment_id, actividad_id, tipo, nut_items_c, nut_items_o, nut_kcal_c, nut_kcal_o, nut_macros) 
        VALUES (v_cliente_id, v_fecha, v_enrollment_id, v_actividad_id, 'programa', v_completed_items, v_total_items, v_kcal_comp, v_kcal_obj, v_json_macros)
        ON CONFLICT (cliente_id, fecha, actividad_id) DO UPDATE SET nut_items_c = EXCLUDED.nut_items_c, nut_items_o = EXCLUDED.nut_items_o, nut_kcal_c = EXCLUDED.nut_kcal_c, nut_kcal_o = EXCLUDED.nut_kcal_o, nut_macros = EXCLUDED.nut_macros, recalculado_en = NOW();
    ELSE
        v_total_items := (SELECT count(*) FROM jsonb_object_keys(COALESCE(NEW.ejercicios_pendientes, '{}'::jsonb))) + (SELECT count(*) FROM jsonb_object_keys(COALESCE(NEW.ejercicios_completados, '{}'::jsonb)));
        v_completed_items := (SELECT count(*) FROM jsonb_object_keys(COALESCE(NEW.ejercicios_completados, '{}'::jsonb)));
        SELECT COALESCE(SUM((value::text)::numeric), 0) INTO v_mins_obj FROM jsonb_each_text(COALESCE(NEW.minutos, '{}'::jsonb));
        SELECT COALESCE(SUM((m.value::text)::numeric), 0) INTO v_mins_comp FROM jsonb_each_text(COALESCE(NEW.minutos, '{}'::jsonb)) m WHERE m.key IN (SELECT key FROM jsonb_each(COALESCE(NEW.ejercicios_completados, '{}'::jsonb)));
        
        v_kcal_obj := COALESCE((NEW.fitness_items->>'objetivo')::numeric, 0);
        v_kcal_comp := COALESCE((NEW.fitness_items->>'completados')::numeric, 0);

        INSERT INTO public.progreso_diario_actividad (cliente_id, fecha, enrollment_id, actividad_id, tipo, fit_items_c, fit_items_o, fit_mins_c, fit_mins_o, fit_kcal_c, fit_kcal_o) 
        VALUES (v_cliente_id, v_fecha, v_enrollment_id, v_actividad_id, 'programa', v_completed_items, v_total_items, v_mins_comp, v_mins_obj, v_kcal_comp::int, v_kcal_obj::int)
        ON CONFLICT (cliente_id, fecha, actividad_id) DO UPDATE SET fit_items_c = EXCLUDED.fit_items_c, fit_items_o = EXCLUDED.fit_items_o, fit_mins_c = EXCLUDED.fit_mins_c, fit_mins_o = EXCLUDED.fit_mins_o, fit_kcal_c = EXCLUDED.fit_kcal_c, fit_kcal_o = EXCLUDED.fit_kcal_o, recalculado_en = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
