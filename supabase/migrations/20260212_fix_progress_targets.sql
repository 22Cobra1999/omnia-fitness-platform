-- ==============================================================================
-- FIX: CALCULATE CORRECT TARGETS (MINUTOS_OBJETIVO) FOR NUTRITION
-- ==============================================================================

-- 1. Ensure columns exist (safeguard)
ALTER TABLE public.progreso_diario_actividad ADD COLUMN IF NOT EXISTS minutos_objetivo INTEGER DEFAULT 0;
ALTER TABLE public.progreso_diario_actividad ADD COLUMN IF NOT EXISTS calorias_objetivo NUMERIC DEFAULT 0;
ALTER TABLE public.progreso_diario_actividad ADD COLUMN IF NOT EXISTS nutri_kcal_objetivo NUMERIC DEFAULT 0; -- Legacy support if needed
ALTER TABLE public.progreso_diario_actividad ADD COLUMN IF NOT EXISTS nutri_mins_objetivo INTEGER DEFAULT 0; -- Legacy support if needed

CREATE OR REPLACE FUNCTION public.update_daily_progress_from_program()
RETURNS TRIGGER AS $$
DECLARE
    v_total_items INTEGER;
    v_completed_items INTEGER;
    v_enrollment_id BIGINT;
    v_area TEXT;
    
    -- Completed metrics
    v_kcal_completed NUMERIC := 0;
    v_mins_completed INTEGER := 0;
    v_p_completed NUMERIC := 0;
    v_c_completed NUMERIC := 0;
    v_f_completed NUMERIC := 0;

    -- Target metrics
    v_kcal_target NUMERIC := 0;
    v_mins_target INTEGER := 0;
    
    v_row RECORD;
BEGIN
    v_enrollment_id := NEW.enrollment_id;

    IF TG_TABLE_NAME = 'progreso_cliente_nutricion' THEN
        v_area := 'nutricion';
        
        -- A) Item Counts
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

        -- B) Calculate Metrics from Macros
        IF jsonb_typeof(NEW.macros) = 'object' THEN
            -- 1. Calculate TARGETS (Sum of ALL macros)
            FOR v_row IN 
                SELECT SUM((value->>'minutos')::numeric) as m, 
                       SUM((value->>'calorias')::numeric) as k
                FROM jsonb_each(NEW.macros) 
            LOOP
                v_mins_target := COALESCE(v_row.m, 0);
                v_kcal_target := COALESCE(v_row.k, 0);
            END LOOP;

            -- 2. Calculate COMPLETED (Sum of macros for completed keys)
            FOR v_row IN 
                SELECT SUM((value->>'minutos')::numeric) as m, 
                       SUM((value->>'calorias')::numeric) as k,
                       SUM((value->>'proteinas')::numeric) as p,
                       SUM((value->>'carbohidratos')::numeric) as c,
                       SUM((value->>'grasas')::numeric) as f
                FROM jsonb_each(NEW.macros) 
                WHERE key IN (
                    SELECT k::text FROM jsonb_object_keys(NEW.ejercicios_completados) AS k
                    WHERE jsonb_typeof(NEW.ejercicios_completados) = 'object'
                    UNION
                    SELECT (e->>'id' || '_' || (e->>'bloque'))::text FROM jsonb_array_elements(
                        CASE WHEN jsonb_typeof(NEW.ejercicios_completados->'ejercicios') = 'array' 
                             THEN NEW.ejercicios_completados->'ejercicios' 
                             ELSE '[]'::jsonb 
                        END
                    ) e
                    UNION
                    -- Extract scalar text
                    SELECT (k#>>'{}')::text FROM jsonb_array_elements(
                        CASE WHEN jsonb_typeof(NEW.ejercicios_completados) = 'array' 
                             THEN NEW.ejercicios_completados 
                             ELSE '[]'::jsonb 
                        END
                    ) AS k WHERE jsonb_typeof(NEW.ejercicios_completados) = 'array'
                )
            LOOP
                v_mins_completed := COALESCE(v_row.m, 0);
                v_kcal_completed := COALESCE(v_row.k, 0);
                v_p_completed := COALESCE(v_row.p, 0);
                v_c_completed := COALESCE(v_row.c, 0);
                v_f_completed := COALESCE(v_row.f, 0);
            END LOOP;
        END IF;

    ELSE
        -- FITNESS LOGIC (Keep straightforward for now, assuming JSONs hold TOTALS)
        -- TODO: Refine Fitness to distinguish completed vs total if needed. 
        -- For now, we assume 'minutos_json' holds the planned minutes for the exercises.
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
        
        -- Cals/Mins from Fitness (Assuming these are totals/targets for the session)
        IF jsonb_typeof(NEW.calorias_json) = 'object' THEN
            SELECT SUM((value::text)::numeric) INTO v_kcal_target FROM jsonb_each_text(NEW.calorias_json);
        END IF;
        IF jsonb_typeof(NEW.minutos_json) = 'object' THEN
            SELECT SUM((value::text)::numeric) INTO v_mins_target FROM jsonb_each_text(NEW.minutos_json);
        END IF;
        
        -- Estimate completed based on item ratio? Or just leave 0 if not tracked precisely per exercise?
        -- Let's set completed = target * (completed items / total items) as a heuristic if strict mapping is hard
        IF v_total_items > 0 THEN
             v_mins_completed := (v_mins_target * (v_completed_items::numeric / v_total_items::numeric))::INTEGER;
             v_kcal_completed := v_kcal_target * (v_completed_items::numeric / v_total_items::numeric);
        END IF;
    END IF;

    -- Upsert Consolidated Tracking
    INSERT INTO public.progreso_diario_actividad (
        cliente_id, fecha, actividad_id, enrollment_id, tipo, area,
        items_objetivo, items_completados, 
        calorias, minutos, 
        calorias_objetivo, minutos_objetivo,
        proteinas, carbohidratos, grasas, recalculado_en
    ) VALUES (
        NEW.cliente_id, NEW.fecha, NEW.actividad_id, v_enrollment_id, 'programa', v_area,
        v_total_items, v_completed_items,
        v_kcal_completed, v_mins_completed,
        v_kcal_target, v_mins_target,
        v_p_completed, v_c_completed, v_f_completed, NOW()
    )
    ON CONFLICT (enrollment_id, fecha) DO UPDATE SET
        items_objetivo = EXCLUDED.items_objetivo,
        items_completados = EXCLUDED.items_completados,
        calorias = EXCLUDED.calorias,
        minutos = EXCLUDED.minutos,
        calorias_objetivo = EXCLUDED.calorias_objetivo,
        minutos_objetivo = EXCLUDED.minutos_objetivo,
        proteinas = EXCLUDED.proteinas,
        carbohidratos = EXCLUDED.carbohidratos,
        grasas = EXCLUDED.grasas,
        recalculado_en = NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger should already exist, no need to recreate unless it was pointing elsewhere. 
-- It points to this function name.
