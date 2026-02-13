-- FIX NUTRITION MACRO MATCHING IN CONSOLIDATED TRACKING
-- The keys in 'ejercicios_completados' are often {id}_{orden}_{bloque}
-- while 'macros' keys are {id}_{bloque}.

CREATE OR REPLACE FUNCTION public.update_daily_progress_from_program()
RETURNS TRIGGER AS $$
DECLARE
    v_total_items INTEGER;
    v_completed_items INTEGER;
    v_enrollment_id BIGINT;
    v_area TEXT;
    v_kcal NUMERIC := 0;
    v_mins INTEGER := 0;
    v_p NUMERIC := 0;
    v_c NUMERIC := 0;
    v_f NUMERIC := 0;
    v_row RECORD;
BEGIN
    v_enrollment_id := NEW.enrollment_id;

    IF TG_TABLE_NAME = 'progreso_cliente_nutricion' THEN
        v_area := 'nutricion';
        
        -- Platos counts
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

        -- Calculate Nutri Metrics from Macros (Only for completed plates)
        IF jsonb_typeof(NEW.macros) = 'object' THEN
            -- We match keys using fuzzy logic or prefix matching to handle {id}_{orden}_{bloque} vs {id}_{bloque}
            SELECT 
                SUM(COALESCE((m.value->>'minutos')::numeric, 0)),
                SUM(COALESCE((m.value->>'calorias')::numeric, 0)),
                SUM(COALESCE((m.value->>'proteinas')::numeric, 0)),
                SUM(COALESCE((m.value->>'carbohidratos')::numeric, 0)),
                SUM(COALESCE((m.value->>'grasas')::numeric, 0))
            INTO v_mins, v_kcal, v_p, v_c, v_f
            FROM jsonb_each(NEW.macros) m
            WHERE EXISTS (
                SELECT 1 
                FROM jsonb_object_keys(NEW.ejercicios_completados) k
                WHERE k = m.key 
                   OR k LIKE m.key || '\_%' ESCAPE '\'
                   OR (split_part(k, '_', 1) || '_' || split_part(k, '_', 3)) = m.key
            )
            OR EXISTS (
                SELECT 1 
                FROM jsonb_array_elements(
                    CASE WHEN jsonb_typeof(NEW.ejercicios_completados->'ejercicios') = 'array' 
                         THEN NEW.ejercicios_completados->'ejercicios' 
                         ELSE '[]'::jsonb 
                    END
                ) e
                WHERE (e->>'id' || '_' || (e->>'bloque')) = m.key
                   OR (e->>'id') = m.key
            );
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
        
        -- Cals/Mins from Fitness
        IF jsonb_typeof(NEW.calorias_json) = 'object' THEN
            SELECT SUM((value::text)::numeric) INTO v_kcal FROM jsonb_each_text(NEW.calorias_json);
        END IF;
        IF jsonb_typeof(NEW.minutos_json) = 'object' THEN
            SELECT SUM((value::text)::numeric) INTO v_mins FROM jsonb_each_text(NEW.minutos_json);
        END IF;
    END IF;

    -- Upsert Consolidated Tracking
    INSERT INTO public.progreso_diario_actividad (
        cliente_id, fecha, actividad_id, enrollment_id, tipo, area,
        items_objetivo, items_completados, 
        calorias, minutos, proteinas, carbohidratos, grasas, recalculado_en
    ) VALUES (
        NEW.cliente_id, NEW.fecha, NEW.actividad_id, v_enrollment_id, 'programa', v_area,
        v_total_items, v_completed_items,
        COALESCE(v_kcal, 0), COALESCE(v_mins, 0), COALESCE(v_p, 0), COALESCE(v_c, 0), COALESCE(v_f, 0), NOW()
    )
    ON CONFLICT (enrollment_id, fecha) DO UPDATE SET
        items_objetivo = EXCLUDED.items_objetivo,
        items_completados = EXCLUDED.items_completados,
        calorias = EXCLUDED.calorias,
        minutos = EXCLUDED.minutos,
        proteinas = EXCLUDED.proteinas,
        carbohidratos = EXCLUDED.carbohidratos,
        grasas = EXCLUDED.grasas,
        recalculado_en = NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- RE-EXECUTE BACKFILL FOR NUTRITION
DO $$
DECLARE
    r RECORD;
    v_total INTEGER;
    v_completed INTEGER;
    v_kcal NUMERIC;
    v_mins INTEGER;
    v_p NUMERIC;
    v_c NUMERIC;
    v_f NUMERIC;
BEGIN
    FOR r IN SELECT * FROM public.progreso_cliente_nutricion WHERE enrollment_id IS NOT NULL LOOP
        v_completed := CASE 
            WHEN jsonb_typeof(r.ejercicios_completados->'ejercicios') = 'array' THEN jsonb_array_length(r.ejercicios_completados->'ejercicios')
            WHEN jsonb_typeof(r.ejercicios_completados) = 'object' THEN (SELECT count(*) FROM jsonb_object_keys(r.ejercicios_completados))
            ELSE 0 
        END;
        v_total := v_completed + CASE 
            WHEN jsonb_typeof(r.ejercicios_pendientes->'ejercicios') = 'array' THEN jsonb_array_length(r.ejercicios_pendientes->'ejercicios')
            WHEN jsonb_typeof(r.ejercicios_pendientes) = 'object' THEN (SELECT count(*) FROM jsonb_object_keys(r.ejercicios_pendientes))
            ELSE 0 
        END;

        v_kcal := 0; v_mins := 0; v_p := 0; v_c := 0; v_f := 0;
        IF jsonb_typeof(r.macros) = 'object' THEN
            SELECT 
                SUM(COALESCE((m.value->>'minutos')::numeric, 0)),
                SUM(COALESCE((m.value->>'calorias')::numeric, 0)),
                SUM(COALESCE((m.value->>'proteinas')::numeric, 0)),
                SUM(COALESCE((m.value->>'carbohidratos')::numeric, 0)),
                SUM(COALESCE((m.value->>'grasas')::numeric, 0))
            INTO v_mins, v_kcal, v_p, v_c, v_f
            FROM jsonb_each(r.macros) m
            WHERE EXISTS (
                SELECT 1 FROM jsonb_object_keys(r.ejercicios_completados) k 
                WHERE k = m.key OR k LIKE m.key || '\_%' ESCAPE '\' OR (split_part(k, '_', 1) || '_' || split_part(k, '_', 3)) = m.key
            )
            OR EXISTS (
                SELECT 1 FROM jsonb_array_elements(
                    CASE WHEN jsonb_typeof(r.ejercicios_completados->'ejercicios') = 'array' THEN r.ejercicios_completados->'ejercicios' ELSE '[]'::jsonb END
                ) e WHERE (e->>'id' || '_' || (e->>'bloque')) = m.key OR (e->>'id') = m.key
            );
        END IF;

        UPDATE public.progreso_diario_actividad SET
            items_objetivo = v_total,
            items_completados = v_completed,
            calorias = COALESCE(v_kcal, 0),
            minutos = COALESCE(v_mins, 0),
            proteinas = COALESCE(v_p, 0),
            carbohidratos = COALESCE(v_c, 0),
            grasas = COALESCE(v_f, 0),
            recalculado_en = NOW()
        WHERE enrollment_id = r.enrollment_id AND fecha = r.fecha;
    END LOOP;
END;
$$;
