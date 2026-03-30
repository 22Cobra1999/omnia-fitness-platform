-- MIGRACIÓN FINAL: LIMPIEZA Y SIMPLIFICACIÓN TOTAL DE PROGRESO (PDA) CON KCAL FITNESS
-- Este script recrea la tabla con solo las columnas necesarias y optimizadas.

BEGIN;

-- 1. Respaldar datos actuales (si existen)
CREATE TABLE IF NOT EXISTS public.progreso_diario_actividad_backup AS 
SELECT * FROM public.progreso_diario_actividad;

-- 2. Eliminar la tabla bloat y recrearla limpia
DROP TABLE IF EXISTS public.progreso_diario_actividad CASCADE;

CREATE TABLE public.progreso_diario_actividad (
  id BIGSERIAL PRIMARY KEY,
  cliente_id UUID NOT NULL,
  fecha DATE NOT NULL,
  actividad_id BIGINT,
  enrollment_id BIGINT,
  tipo TEXT CHECK (tipo IN ('programa', 'taller', 'documento')),
  
  -- Métricas Planas (Fitness)
  fit_items_c INTEGER DEFAULT 0,
  fit_items_o INTEGER DEFAULT 0,
  fit_mins_c INTEGER DEFAULT 0,
  fit_mins_o INTEGER DEFAULT 0,
  fit_kcal_c INTEGER DEFAULT 0,
  fit_kcal_o INTEGER DEFAULT 0,
  
  -- Métricas Planas (Nutrición)
  nut_items_c INTEGER DEFAULT 0,
  nut_items_o INTEGER DEFAULT 0,
  nut_kcal_c NUMERIC DEFAULT 0,
  nut_kcal_o NUMERIC DEFAULT 0,
  nut_macros JSONB DEFAULT '{}'::JSONB,
  
  recalculado_en TIMESTAMP DEFAULT NOW()
);

-- 3. Índices esenciales para rendimiento
CREATE INDEX idx_pda_cliente_fecha ON public.progreso_diario_actividad (cliente_id, fecha);
CREATE INDEX idx_pda_enrollment_fecha ON public.progreso_diario_actividad (enrollment_id, fecha);
CREATE UNIQUE INDEX idx_pda_cliente_fecha_actividad ON public.progreso_diario_actividad (cliente_id, fecha, actividad_id);

-- 4. Restaurar datos desde el backup a las nuevas columnas
-- Intentamos recuperar fitness_kcal si existía antes
INSERT INTO public.progreso_diario_actividad (
    cliente_id, fecha, actividad_id, enrollment_id, tipo,
    fit_items_c, fit_items_o, fit_mins_c, fit_mins_o, fit_kcal_c, fit_kcal_o,
    nut_items_c, nut_items_o, nut_kcal_c, nut_kcal_o, nut_macros,
    recalculado_en
)
SELECT 
    cliente_id, fecha, actividad_id, enrollment_id, tipo,
    COALESCE(fit_items_c, (fitness_items->>'completados')::int, items_completados, 0),
    COALESCE(fit_items_o, (fitness_items->>'objetivo')::int, items_objetivo, 0),
    COALESCE(fit_mins_c, (fitness_minutos->>'completados')::int, minutos, 0),
    COALESCE(fit_mins_o, (fitness_minutos->>'objetivo')::int, minutos_objetivo, 0),
    COALESCE(fit_kcal_c, (fitness_calorias->>'completados')::int, calorias, 0),
    COALESCE(fit_kcal_o, (fitness_calorias->>'objetivo')::int, calorias_objetivo, 0),
    COALESCE(nut_items_c, (nutricion_items->>'completados')::int, 0),
    COALESCE(nut_items_o, (nutricion_items->>'objetivo')::int, 0),
    COALESCE(nut_kcal_c, (nutricion_calorias->>'completados')::numeric, 0),
    COALESCE(nut_kcal_o, (nutricion_calorias->>'objetivo')::numeric, 0),
    COALESCE(nut_macros, '{}'::jsonb),
    COALESCE(recalculado_en, now())
FROM public.progreso_diario_actividad_backup;

COMMIT;

-- 5. Actualizar Trigger (Idempotent)
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
        -- Fitness: Calculamos items, minutos y CALORIAS
        v_total_items := (SELECT count(*) FROM jsonb_object_keys(COALESCE(NEW.ejercicios_pendientes, '{}'::jsonb))) + (SELECT count(*) FROM jsonb_object_keys(COALESCE(NEW.ejercicios_completados, '{}'::jsonb)));
        v_completed_items := (SELECT count(*) FROM jsonb_object_keys(COALESCE(NEW.ejercicios_completados, '{}'::jsonb)));
        
        -- Minutos
        SELECT COALESCE(SUM((value::text)::numeric), 0) INTO v_mins_obj FROM jsonb_each_text(COALESCE(NEW.minutos, '{}'::jsonb));
        SELECT COALESCE(SUM((m.value::text)::numeric), 0) INTO v_mins_comp FROM jsonb_each_text(COALESCE(NEW.minutos, '{}'::jsonb)) m WHERE m.key IN (SELECT key FROM jsonb_each(COALESCE(NEW.ejercicios_completados, '{}'::jsonb)));
        
        -- Calorías (Si están en el JSON de ejercicios_objetivo o similar)
        -- Nota: En progreso_cliente fitness las kcal suelen estar dentro de ejercicios_objetivo->'kcal'
        -- Si no están ahí, intentamos extraer de fitness_items->'objetivo' si existía
        v_kcal_obj := COALESCE((NEW.fitness_items->>'objetivo')::numeric, 0);
        v_kcal_comp := COALESCE((NEW.fitness_items->>'completados')::numeric, 0);

        INSERT INTO public.progreso_diario_actividad (cliente_id, fecha, enrollment_id, actividad_id, tipo, fit_items_c, fit_items_o, fit_mins_c, fit_mins_o, fit_kcal_c, fit_kcal_o) 
        VALUES (v_cliente_id, v_fecha, v_enrollment_id, v_actividad_id, 'programa', v_completed_items, v_total_items, v_mins_comp, v_mins_obj, v_kcal_comp::int, v_kcal_obj::int)
        ON CONFLICT (cliente_id, fecha, actividad_id) DO UPDATE SET fit_items_c = EXCLUDED.fit_items_c, fit_items_o = EXCLUDED.fit_items_o, fit_mins_c = EXCLUDED.fit_mins_c, fit_mins_o = EXCLUDED.fit_mins_o, fit_kcal_c = EXCLUDED.fit_kcal_c, fit_kcal_o = EXCLUDED.fit_kcal_o, recalculado_en = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
