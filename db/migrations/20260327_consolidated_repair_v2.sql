-- OMNIA CONSOLIDATED REPAIR V2 - MARCH 2026
-- Fixes Trigger to match EXACT schema of progreso_diario_actividad

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
        
        IF jsonb_typeof(NEW.macros) = 'object' THEN
            -- Calculate Objective (Total from macros JSON)
            SELECT 
                COALESCE(SUM((value->>'minutos')::numeric), 0),
                COALESCE(SUM((value->>'calorias')::numeric), 0)
            INTO v_mins_obj, v_kcal_obj
            FROM jsonb_each(NEW.macros);

            -- Calculate Completed Metrics (only keys in ejercicios_completados)
            FOR v_row IN 
                SELECT SUM((value->>'minutos')::numeric) as m, 
                       SUM((value->>'calorias')::numeric) as k,
                       SUM((value->>'proteinas')::numeric) as p,
                       SUM((value->>'carbohidratos')::numeric) as c,
                       SUM((value->>'grasas')::numeric) as f
                FROM jsonb_each(NEW.macros) 
                WHERE key IN (
                    SELECT k_inner FROM jsonb_object_keys(NEW.ejercicios_completados) k_inner
                    WHERE jsonb_typeof(NEW.ejercicios_completados) = 'object'
                    UNION
                    SELECT (e->>'id')::text FROM jsonb_array_elements(
                        CASE WHEN jsonb_typeof(NEW.ejercicios_completados->'ejercicios') = 'array' 
                             THEN NEW.ejercicios_completados->'ejercicios' 
                             ELSE '[]'::jsonb 
                        END
                    ) e
                )
            LOOP
                v_mins_comp := COALESCE(v_row.m, 0);
                v_kcal_comp := COALESCE(v_row.k, 0);
                v_p_comp := COALESCE(v_row.p, 0);
                v_c_comp := COALESCE(v_row.c, 0);
                v_f_comp := COALESCE(v_row.f, 0);
            END LOOP;
        END IF;

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

    ELSE
        v_area := 'fitness';
        -- Calc Objective for Fitness
        IF jsonb_typeof(NEW.minutos) = 'object' THEN
            SELECT COALESCE(SUM((value::text)::numeric), 0) INTO v_mins_obj FROM jsonb_each_text(NEW.minutos);
        END IF;
        IF jsonb_typeof(NEW.calorias) = 'object' THEN
            SELECT COALESCE(SUM((value::text)::numeric), 0) INTO v_kcal_obj FROM jsonb_each_text(NEW.calorias);
        END IF;

        v_completed_items := CASE 
            WHEN jsonb_typeof(NEW.ejercicios_completados) = 'object' THEN (SELECT count(*) FROM jsonb_object_keys(NEW.ejercicios_completados)) 
            WHEN jsonb_typeof(NEW.ejercicios_completados) = 'array' THEN jsonb_array_length(NEW.ejercicios_completados)
            ELSE 0 
        END;

        IF v_completed_items > 0 THEN
            SELECT 
                COALESCE(SUM((m.value::text)::numeric), 0),
                COALESCE(SUM((c.value::text)::numeric), 0)
            INTO v_mins_comp, v_kcal_comp
            FROM (
                SELECT k FROM jsonb_object_keys(NEW.ejercicios_completados) k
                WHERE jsonb_typeof(NEW.ejercicios_completados) = 'object'
                UNION
                SELECT (e#>>'{}')::text FROM jsonb_array_elements(NEW.ejercicios_completados) e
                WHERE jsonb_typeof(NEW.ejercicios_completados) = 'array'
            ) keys
            LEFT JOIN jsonb_each_text(COALESCE(NEW.minutos, '{}'::jsonb)) m ON m.key = keys.k
            LEFT JOIN jsonb_each_text(COALESCE(NEW.calorias, '{}'::jsonb)) c ON c.key = keys.k;
        END IF;

        v_total_items := v_completed_items + CASE 
            WHEN jsonb_typeof(NEW.ejercicios_pendientes) = 'object' THEN (SELECT count(*) FROM jsonb_object_keys(NEW.ejercicios_pendientes)) 
            WHEN jsonb_typeof(NEW.ejercicios_pendientes) = 'array' THEN jsonb_array_length(NEW.ejercicios_pendientes)
            ELSE 0 
        END;
    END IF;

    -- UPSERT Consolidated Record (Mapping into nutri_kcal_objetivo / calorias_objetivo)
    INSERT INTO public.progreso_diario_actividad (
        cliente_id, fecha, actividad_id, enrollment_id, tipo, area,
        items_objetivo, items_completados, 
        calorias, proteinas, carbohidratos, grasas, minutos,
        calorias_objetivo,
        nutri_kcal_objetivo,
        recalculado_en
    ) VALUES (
        NEW.cliente_id, NEW.fecha, NEW.actividad_id, v_enrollment_id, 'programa', v_area,
        v_total_items, v_completed_items,
        v_kcal_comp::integer, v_p_comp::integer, v_c_comp::integer, v_f_comp::integer, v_mins_comp::integer,
        CASE WHEN v_area = 'fitness' THEN v_kcal_obj ELSE 0 END,
        CASE WHEN v_area = 'nutricion' THEN v_kcal_obj ELSE 0 END,
        NOW()
    )
    ON CONFLICT (enrollment_id, fecha) DO UPDATE SET
        items_objetivo = EXCLUDED.items_objetivo,
        items_completados = EXCLUDED.items_completados,
        calorias = EXCLUDED.calorias,
        minutos = EXCLUDED.minutos,
        proteinas = EXCLUDED.proteinas,
        carbohidratos = EXCLUDED.carbohidratos,
        grasas = EXCLUDED.grasas,
        calorias_objetivo = EXCLUDED.calorias_objetivo,
        nutri_kcal_objetivo = EXCLUDED.nutri_kcal_objetivo,
        recalculado_en = NOW(),
        actividad_id = EXCLUDED.actividad_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Re-attach
DROP TRIGGER IF EXISTS tr_sync_daily_stats_fitness ON public.progreso_cliente;
CREATE TRIGGER tr_sync_daily_stats_fitness
    AFTER INSERT OR UPDATE ON public.progreso_cliente
    FOR EACH ROW EXECUTE FUNCTION public.update_daily_progress_from_program();

DROP TRIGGER IF EXISTS tr_sync_daily_stats_nutrition ON public.progreso_cliente_nutricion;
CREATE TRIGGER tr_sync_daily_stats_nutrition
    AFTER INSERT OR UPDATE ON public.progreso_cliente_nutricion
    FOR EACH ROW EXECUTE FUNCTION public.update_daily_progress_from_program();
