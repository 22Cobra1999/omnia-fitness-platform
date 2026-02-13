-- Add missing columns to calendar_event_participants
ALTER TABLE public.calendar_event_participants 
ADD COLUMN IF NOT EXISTS invited_by_user_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS invited_by_role TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Ensure objective columns exist in progreso_diario_actividad
ALTER TABLE public.progreso_diario_actividad
ADD COLUMN IF NOT EXISTS minutos_objetivo INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS calorias_objetivo NUMERIC DEFAULT 0;

-- Update trigger function to include targets and fix column names
CREATE OR REPLACE FUNCTION public.update_daily_progress_from_program()
RETURNS TRIGGER AS $$
DECLARE
    v_total_items INTEGER;
    v_completed_items INTEGER;
    v_enrollment_id BIGINT;
    v_area TEXT;
    v_kcal_comp NUMERIC := 0;
    v_mins_comp INTEGER := 0;
    v_kcal_obj NUMERIC := 0;
    v_mins_obj INTEGER := 0;
    v_p_comp NUMERIC := 0;
    v_c_comp NUMERIC := 0;
    v_f_comp NUMERIC := 0;
    v_row RECORD;
BEGIN
    v_enrollment_id := NEW.enrollment_id;

    IF TG_TABLE_NAME = 'progreso_cliente_nutricion' THEN
        v_area := 'nutricion';
        
        -- Platos counts
        v_completed_items := CASE 
            WHEN jsonb_typeof(NEW.ejercicios_completados->'ejercicios') = 'array' THEN jsonb_array_length(NEW.ejercicios_completados->'ejercicios')
            WHEN jsonb_typeof(NEW.ejercicios_completados) = 'object' THEN (SELECT count(*) FROM jsonb_object_keys(NEW.ejercicios_completados))
            WHEN jsonb_typeof(NEW.ejercicios_completados) = 'array' THEN jsonb_array_length(NEW.ejercicios_completados)
            ELSE 0 
        END;
        v_total_items := v_completed_items + CASE 
            WHEN jsonb_typeof(NEW.ejercicios_pendientes->'ejercicios') = 'array' THEN jsonb_array_length(NEW.ejercicios_pendientes->'ejercicios')
            WHEN jsonb_typeof(NEW.ejercicios_pendientes) = 'object' THEN (SELECT count(*) FROM jsonb_object_keys(NEW.ejercicios_pendientes))
            WHEN jsonb_typeof(NEW.ejercicios_pendientes) = 'array' THEN jsonb_array_length(NEW.ejercicios_pendientes)
            ELSE 0 
        END;

        -- Calculate Nutri Metrics and Objectives from Macros
        IF jsonb_typeof(NEW.macros) = 'object' THEN
            -- Objective is sum of ALL items in macros
            SELECT 
                SUM(COALESCE((value->>'minutos')::numeric, 0)),
                SUM(COALESCE((value->>'calorias')::numeric, 0))
            INTO v_mins_obj, v_kcal_obj
            FROM jsonb_each(NEW.macros);

            -- Completed is sum of ONLY completed items
            FOR v_row IN 
                SELECT SUM((m_val->>'minutos')::numeric) as m, 
                       SUM((m_val->>'calorias')::numeric) as k,
                       SUM((m_val->>'proteinas')::numeric) as p,
                       SUM((m_val->>'carbohidratos')::numeric) as c,
                       SUM((m_val->>'grasas')::numeric) as f
                FROM jsonb_each(NEW.macros) AS t(m_key, m_val)
                WHERE m_key IN (
                    SELECT k_inner::text FROM jsonb_object_keys(NEW.ejercicios_completados) AS k_inner
                    WHERE jsonb_typeof(NEW.ejercicios_completados) = 'object'
                    UNION
                    SELECT (e->>'id' || '_' || (e->>'bloque'))::text FROM jsonb_array_elements(
                        CASE WHEN jsonb_typeof(NEW.ejercicios_completados->'ejercicios') = 'array' 
                             THEN NEW.ejercicios_completados->'ejercicios' 
                             ELSE '[]'::jsonb 
                        END
                    ) e
                    UNION
                    SELECT (elem_inner#>>'{}')::text FROM jsonb_array_elements(
                        CASE WHEN jsonb_typeof(NEW.ejercicios_completados) = 'array' 
                             THEN NEW.ejercicios_completados 
                             ELSE '[]'::jsonb 
                        END
                    ) AS elem_inner
                )
            LOOP
                v_kcal_comp := COALESCE(v_row.k, 0);
                v_mins_comp := COALESCE(v_row.m, 0);
                v_p_comp := COALESCE(v_row.p, 0);
                v_c_comp := COALESCE(v_row.c, 0);
                v_f_comp := COALESCE(v_row.f, 0);
            END LOOP;
        END IF;

    ELSE
        v_area := 'fitness';
        v_completed_items := CASE 
            WHEN jsonb_typeof(NEW.ejercicios_completados) = 'object' THEN (SELECT count(*) FROM jsonb_object_keys(NEW.ejercicios_completados)) 
            WHEN jsonb_typeof(NEW.ejercicios_completados) = 'array' THEN jsonb_array_length(NEW.ejercicios_completados)
            ELSE 0 
        END;
        v_total_items := v_completed_items + CASE 
            WHEN jsonb_typeof(NEW.ejercicios_pendientes) = 'object' THEN (SELECT count(*) FROM jsonb_object_keys(NEW.ejercicios_pendientes)) 
            WHEN jsonb_typeof(NEW.ejercicios_pendientes) = 'array' THEN jsonb_array_length(NEW.ejercicios_pendientes)
            ELSE 0 
        END;

        -- Planified Objectives (Sum of all entries in minutos_json/calorias_json)
        IF jsonb_typeof(NEW.minutos_json) = 'object' AND NEW.minutos_json IS NOT NULL THEN
            SELECT COALESCE(SUM((value::text)::numeric), 0) INTO v_mins_obj FROM jsonb_each_text(NEW.minutos_json);
        END IF;
        IF jsonb_typeof(NEW.calorias_json) = 'object' AND NEW.calorias_json IS NOT NULL THEN
            SELECT COALESCE(SUM((value::text)::numeric), 0) INTO v_kcal_obj FROM jsonb_each_text(NEW.calorias_json);
        END IF;

        -- Completed Metrics (Only for completed exercises)
        IF v_completed_items > 0 AND jsonb_typeof(NEW.ejercicios_completados) = 'object' THEN
            SELECT 
                SUM(COALESCE((m.value::text)::numeric, 0)),
                SUM(COALESCE((c.value::text)::numeric, 0))
            INTO v_mins_comp, v_kcal_comp
            FROM jsonb_object_keys(NEW.ejercicios_completados) k
            LEFT JOIN jsonb_each_text(NEW.minutos_json) m ON m.key = k
            LEFT JOIN jsonb_each_text(NEW.calorias_json) c ON c.key = k;
        ELSE
            v_mins_comp := 0; v_kcal_comp := 0;
        END IF;
    END IF;

    INSERT INTO public.progreso_diario_actividad (
        cliente_id, fecha, actividad_id, tipo, area, 
        items_objetivo, items_completados, minutos, calorias,
        proteinas, carbohidratos, grasas,
        minutos_objetivo, calorias_objetivo,
        recalculado_en, enrollment_id
    )
    VALUES (
        NEW.cliente_id, NEW.fecha, NEW.actividad_id, 'programa', v_area,
        v_total_items, v_completed_items, COALESCE(v_mins_comp, 0), COALESCE(v_kcal_comp, 0),
        v_p_comp, v_c_comp, v_f_comp,
        COALESCE(v_mins_obj, 0), COALESCE(v_kcal_obj, 0),
        now(), v_enrollment_id
    )
    ON CONFLICT (enrollment_id, fecha)
    DO UPDATE SET
        items_objetivo = EXCLUDED.items_objetivo,
        items_completados = EXCLUDED.items_completados,
        minutos = EXCLUDED.minutos,
        calorias = EXCLUDED.calorias,
        proteinas = EXCLUDED.proteinas,
        carbohidratos = EXCLUDED.carbohidratos,
        grasas = EXCLUDED.grasas,
        minutos_objetivo = EXCLUDED.minutos_objetivo,
        calorias_objetivo = EXCLUDED.calorias_objetivo,
        recalculado_en = now(),
        actividad_id = EXCLUDED.actividad_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Backfill
DELETE FROM public.progreso_diario_actividad;

-- Backfill Fitness
INSERT INTO public.progreso_diario_actividad (
    cliente_id, fecha, actividad_id, tipo, area, 
    items_objetivo, items_completados, minutos, calorias,
    proteinas, carbohidratos, grasas,
    minutos_objetivo, calorias_objetivo,
    recalculado_en, enrollment_id
)
SELECT 
    cliente_id, fecha, actividad_id, 'programa', 'fitness',
    (
        COALESCE(CASE WHEN jsonb_typeof(ejercicios_completados) = 'object' THEN (SELECT count(*) FROM jsonb_object_keys(ejercicios_completados)) ELSE 0 END, 0) +
        COALESCE(CASE WHEN jsonb_typeof(ejercicios_pendientes) = 'object' THEN (SELECT count(*) FROM jsonb_object_keys(ejercicios_pendientes)) ELSE 0 END, 0)
    ),
    COALESCE(CASE WHEN jsonb_typeof(ejercicios_completados) = 'object' THEN (SELECT count(*) FROM jsonb_object_keys(ejercicios_completados)) ELSE 0 END, 0),
    (SELECT COALESCE(SUM((v.value::text)::numeric), 0) FROM jsonb_each_text(minutos_json) v WHERE v.key IN (SELECT jsonb_object_keys(COALESCE(ejercicios_completados, '{}'::jsonb)))),
    (SELECT COALESCE(SUM((v.value::text)::numeric), 0) FROM jsonb_each_text(calorias_json) v WHERE v.key IN (SELECT jsonb_object_keys(COALESCE(ejercicios_completados, '{}'::jsonb)))),
    0, 0, 0,
    (SELECT COALESCE(SUM((v_obj.value::text)::numeric), 0) FROM jsonb_each_text(minutos_json) v_obj),
    (SELECT COALESCE(SUM((v_obj.value::text)::numeric), 0) FROM jsonb_each_text(calorias_json) v_obj),
    now(), enrollment_id
FROM public.progreso_cliente;

-- Backfill Nutrition
INSERT INTO public.progreso_diario_actividad (
    cliente_id, fecha, actividad_id, tipo, area, 
    items_objetivo, items_completados, minutos, calorias,
    proteinas, carbohidratos, grasas,
    minutos_objetivo, calorias_objetivo,
    recalculado_en, enrollment_id
)
SELECT 
    cliente_id, fecha, actividad_id, 'programa', 'nutricion',
    (
        CASE 
            WHEN jsonb_typeof(ejercicios_completados->'ejercicios') = 'array' THEN jsonb_array_length(ejercicios_completados->'ejercicios')
            WHEN jsonb_typeof(ejercicios_completados) = 'object' THEN (SELECT count(*) FROM jsonb_object_keys(ejercicios_completados))
            ELSE 0 
        END +
        CASE 
            WHEN jsonb_typeof(ejercicios_pendientes->'ejercicios') = 'array' THEN jsonb_array_length(ejercicios_pendientes->'ejercicios')
            WHEN jsonb_typeof(ejercicios_pendientes) = 'object' THEN (SELECT count(*) FROM jsonb_object_keys(ejercicios_pendientes))
            ELSE 0 
        END
    ),
    CASE 
        WHEN jsonb_typeof(ejercicios_completados->'ejercicios') = 'array' THEN jsonb_array_length(ejercicios_completados->'ejercicios')
        WHEN jsonb_typeof(ejercicios_completados) = 'object' THEN (SELECT count(*) FROM jsonb_object_keys(ejercicios_completados))
        ELSE 0 
    END,
    COALESCE(m_comp, 0), COALESCE(k_comp, 0),
    COALESCE(p_comp, 0), COALESCE(c_comp, 0), COALESCE(f_comp, 0),
    COALESCE(m_obj, 0), COALESCE(k_obj, 0),
    now(), enrollment_id
FROM (
    SELECT *,
        (SELECT COALESCE(SUM((val_obj->>'minutos')::numeric), 0) FROM jsonb_each(macros) AS t(key_obj, val_obj)) as m_obj,
        (SELECT COALESCE(SUM((val_obj->>'calorias')::numeric), 0) FROM jsonb_each(macros) AS t(key_obj, val_obj)) as k_obj,
        (SELECT COALESCE(SUM((val_inner->>'minutos')::numeric), 0) FROM jsonb_each(macros) AS t(key_inner, val_inner)
         WHERE key_inner IN (
            SELECT k_inner::text FROM jsonb_object_keys(ejercicios_completados) AS k_inner WHERE jsonb_typeof(ejercicios_completados) = 'object'
            UNION SELECT (e->>'id' || '_' || (e->>'bloque'))::text FROM jsonb_array_elements(CASE WHEN jsonb_typeof(ejercicios_completados->'ejercicios') = 'array' THEN ejercicios_completados->'ejercicios' ELSE '[]'::jsonb END) e
            UNION SELECT (elem_inner#>>'{}')::text FROM jsonb_array_elements(CASE WHEN jsonb_typeof(ejercicios_completados) = 'array' THEN ejercicios_completados ELSE '[]'::jsonb END) AS elem_inner
         )
        ) as m_comp,
        (SELECT COALESCE(SUM((val_inner->>'calorias')::numeric),0) FROM jsonb_each(macros) AS t(key_inner, val_inner)
         WHERE key_inner IN (
            SELECT k_inner::text FROM jsonb_object_keys(ejercicios_completados) AS k_inner WHERE jsonb_typeof(ejercicios_completados) = 'object'
            UNION SELECT (e->>'id' || '_' || (e->>'bloque'))::text FROM jsonb_array_elements(CASE WHEN jsonb_typeof(ejercicios_completados->'ejercicios') = 'array' THEN ejercicios_completados->'ejercicios' ELSE '[]'::jsonb END) e
            UNION SELECT (elem_inner#>>'{}')::text FROM jsonb_array_elements(CASE WHEN jsonb_typeof(ejercicios_completados) = 'array' THEN ejercicios_completados ELSE '[]'::jsonb END) AS elem_inner
         )
        ) as k_comp,
        (SELECT COALESCE(SUM((val_inner->>'proteinas')::numeric),0) FROM jsonb_each(macros) AS t(key_inner, val_inner)
         WHERE key_inner IN (
            SELECT k_inner::text FROM jsonb_object_keys(ejercicios_completados) AS k_inner WHERE jsonb_typeof(ejercicios_completados) = 'object'
            UNION SELECT (e->>'id' || '_' || (e->>'bloque'))::text FROM jsonb_array_elements(CASE WHEN jsonb_typeof(ejercicios_completados->'ejercicios') = 'array' THEN ejercicios_completados->'ejercicios' ELSE '[]'::jsonb END) e
            UNION SELECT (elem_inner#>>'{}')::text FROM jsonb_array_elements(CASE WHEN jsonb_typeof(ejercicios_completados) = 'array' THEN ejercicios_completados ELSE '[]'::jsonb END) AS elem_inner
         )
        ) as p_comp,
        (SELECT COALESCE(SUM((val_inner->>'carbohidratos')::numeric),0) FROM jsonb_each(macros) AS t(key_inner, val_inner)
         WHERE key_inner IN (
            SELECT k_inner::text FROM jsonb_object_keys(ejercicios_completados) AS k_inner WHERE jsonb_typeof(ejercicios_completados) = 'object'
            UNION SELECT (e->>'id' || '_' || (e->>'bloque'))::text FROM jsonb_array_elements(CASE WHEN jsonb_typeof(ejercicios_completados->'ejercicios') = 'array' THEN ejercicios_completados->'ejercicios' ELSE '[]'::jsonb END) e
            UNION SELECT (elem_inner#>>'{}')::text FROM jsonb_array_elements(CASE WHEN jsonb_typeof(ejercicios_completados) = 'array' THEN ejercicios_completados ELSE '[]'::jsonb END) AS elem_inner
         )
        ) as c_comp,
        (SELECT COALESCE(SUM((val_inner->>'grasas')::numeric),0) FROM jsonb_each(macros) AS t(key_inner, val_inner)
         WHERE key_inner IN (
            SELECT k_inner::text FROM jsonb_object_keys(ejercicios_completados) AS k_inner WHERE jsonb_typeof(ejercicios_completados) = 'object'
            UNION SELECT (e->>'id' || '_' || (e->>'bloque'))::text FROM jsonb_array_elements(CASE WHEN jsonb_typeof(ejercicios_completados->'ejercicios') = 'array' THEN ejercicios_completados->'ejercicios' ELSE '[]'::jsonb END) e
            UNION SELECT (elem_inner#>>'{}')::text FROM jsonb_array_elements(CASE WHEN jsonb_typeof(ejercicios_completados) = 'array' THEN ejercicios_completados ELSE '[]'::jsonb END) AS elem_inner
         )
        ) as f_comp
    FROM public.progreso_cliente_nutricion
) nutr_data;
