-- 1. Correct Trigger Function for Fitness Metrics (Use 'minutos' and 'calorias' columns)
CREATE OR REPLACE FUNCTION public.update_daily_progress_from_program()
RETURNS TRIGGER AS $$
DECLARE
    v_total_items INTEGER := 0;
    v_completed_items INTEGER := 0;
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
    v_pda_id BIGINT;
    v_pending_json JSONB;
    v_completed_json JSONB;
    v_macros_json JSONB;
    v_mins_data JSONB;
    v_cals_data JSONB;
    v_new_data JSONB;
    v_old_data JSONB;
BEGIN
    v_new_data := to_jsonb(NEW);
    
    -- Handle Date Change Cleanup
    IF (TG_OP = 'UPDATE') THEN
        v_old_data := to_jsonb(OLD);
        IF (v_old_data->>'fecha' IS DISTINCT FROM v_new_data->>'fecha') THEN
            DELETE FROM public.progreso_diario_actividad 
            WHERE (enrollment_id = (v_old_data->>'enrollment_id')::BIGINT OR (enrollment_id IS NULL AND cliente_id = (v_old_data->>'cliente_id')::UUID AND actividad_id = (v_old_data->>'actividad_id')::BIGINT))
              AND fecha = (v_old_data->>'fecha')::DATE;
        END IF;
    END IF;

    v_enrollment_id := (v_new_data->>'enrollment_id')::BIGINT;
    v_completed_json := COALESCE(v_new_data->'ejercicios_completados', '{}'::jsonb);
    v_pending_json := COALESCE(v_new_data->'ejercicios_pendientes', '{}'::jsonb);

    IF TG_TABLE_NAME = 'progreso_cliente_nutricion' THEN
        v_area := 'nutricion';
        v_macros_json := COALESCE(v_new_data->'macros', '{}'::jsonb);
        
        IF jsonb_typeof(v_macros_json) = 'object' THEN
            SELECT 
                COALESCE(SUM(COALESCE((value->>'m')::numeric, (value->>'minutos')::numeric, 0)), 0),
                COALESCE(SUM(COALESCE((value->>'k')::numeric, (value->>'calorias')::numeric, 0)), 0)
            INTO v_mins_obj, v_kcal_obj
            FROM jsonb_each(v_macros_json);

            FOR v_row IN 
                SELECT SUM(COALESCE((value->>'m')::numeric, (value->>'minutos')::numeric, 0)) as m, 
                       SUM(COALESCE((value->>'k')::numeric, (value->>'calorias')::numeric, 0)) as k,
                       SUM(COALESCE((value->>'p')::numeric, (value->>'proteinas')::numeric, 0)) as p,
                       SUM(COALESCE((value->>'c')::numeric, (value->>'carbohidratos')::numeric, 0)) as c,
                       SUM(COALESCE((value->>'g')::numeric, (value->>'grasas')::numeric, 0)) as f
                FROM jsonb_each(v_macros_json) 
                WHERE key IN (
                    SELECT k_inner::text FROM jsonb_object_keys(v_completed_json) AS k_inner
                    WHERE jsonb_typeof(v_completed_json) = 'object'
                    UNION
                    SELECT (e#>>'{}')::text FROM jsonb_array_elements(
                        CASE WHEN jsonb_typeof(v_completed_json->'ejercicios') = 'array' 
                             THEN v_completed_json->'ejercicios' 
                             ELSE '[]'::jsonb 
                        END
                    ) e
                    UNION
                    SELECT (e#>>'{}')::text FROM jsonb_array_elements(v_completed_json) e
                    WHERE jsonb_typeof(v_completed_json) = 'array'
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
            WHEN jsonb_typeof(v_completed_json->'ejercicios') = 'array' THEN jsonb_array_length(v_completed_json->'ejercicios')
            WHEN jsonb_typeof(v_completed_json) = 'object' THEN (SELECT count(*) FROM jsonb_object_keys(v_completed_json))
            ELSE 0 
        END;
        v_total_items := v_completed_items + CASE 
            WHEN jsonb_typeof(v_pending_json->'ejercicios') = 'array' THEN jsonb_array_length(v_pending_json->'ejercicios')
            WHEN jsonb_typeof(v_pending_json) = 'object' THEN (SELECT count(*) FROM jsonb_object_keys(v_pending_json))
            ELSE 0 
        END;

    ELSE
        -- Fitness and others: FIX - Check 'minutos' and 'calorias' directly
        v_area := 'fitness';
        v_mins_data := COALESCE(v_new_data->'minutos', v_new_data->'minutos_json', '{}'::jsonb);
        v_cals_data := COALESCE(v_new_data->'calorias', v_new_data->'calorias_json', '{}'::jsonb);

        IF jsonb_typeof(v_mins_data) = 'object' THEN
            SELECT COALESCE(SUM((value::text)::numeric), 0) INTO v_mins_obj FROM jsonb_each_text(v_mins_data);
        END IF;

        IF jsonb_typeof(v_cals_data) = 'object' THEN
            SELECT COALESCE(SUM((value::text)::numeric), 0) INTO v_kcal_obj FROM jsonb_each_text(v_cals_data);
        END IF;

        v_completed_items := CASE 
            WHEN jsonb_typeof(v_completed_json) = 'object' THEN (SELECT count(*) FROM jsonb_object_keys(v_completed_json)) 
            WHEN jsonb_typeof(v_completed_json) = 'array' THEN jsonb_array_length(v_completed_json)
            ELSE 0 
        END;

        IF v_completed_items > 0 THEN
            SELECT 
                COALESCE(SUM((m.value::text)::numeric), 0),
                COALESCE(SUM((c.value::text)::numeric), 0)
            INTO v_mins_comp, v_kcal_comp
            FROM (
                SELECT k FROM jsonb_object_keys(v_completed_json) k
                WHERE jsonb_typeof(v_completed_json) = 'object'
                UNION
                SELECT (e#>>'{}')::text FROM jsonb_array_elements(v_completed_json) e
                WHERE jsonb_typeof(v_completed_json) = 'array'
            ) keys
            LEFT JOIN jsonb_each_text(v_mins_data) m ON m.key = keys.k
            LEFT JOIN jsonb_each_text(v_cals_data) c ON c.key = keys.k;
        END IF;

        v_total_items := v_completed_items + CASE 
            WHEN jsonb_typeof(v_pending_json) = 'object' THEN (SELECT count(*) FROM jsonb_object_keys(v_pending_json)) 
            WHEN jsonb_typeof(v_pending_json) = 'array' THEN jsonb_array_length(v_pending_json)
            ELSE 0 
        END;
    END IF;

    -- Upsert logic
    SELECT id INTO v_pda_id FROM public.progreso_diario_actividad
    WHERE (
        (enrollment_id = v_enrollment_id)
        OR (enrollment_id IS NULL AND v_enrollment_id IS NULL AND cliente_id = (v_new_data->>'cliente_id')::UUID AND actividad_id = (v_new_data->>'actividad_id')::BIGINT)
    ) AND fecha = (v_new_data->>'fecha')::DATE
    LIMIT 1;

    IF v_pda_id IS NOT NULL THEN
        UPDATE public.progreso_diario_actividad SET
            items_objetivo = v_total_items,
            items_completados = v_completed_items,
            calorias = v_kcal_comp,
            minutos = v_mins_comp,
            proteinas = v_p_comp,
            carbohidratos = v_c_comp,
            grasas = v_f_comp,
            calorias_objetivo = v_kcal_obj,
            minutos_objetivo = v_mins_obj,
            recalculado_en = NOW(),
            actividad_id = (v_new_data->>'actividad_id')::BIGINT,
            enrollment_id = v_enrollment_id,
            area = v_area
        WHERE id = v_pda_id;
    ELSE
        INSERT INTO public.progreso_diario_actividad (
            cliente_id, fecha, actividad_id, enrollment_id, tipo, area,
            items_objetivo, items_completados, 
            calorias, minutos, proteinas, carbohidratos, grasas,
            calorias_objetivo, minutos_objetivo,
            recalculado_en
        ) VALUES (
            (v_new_data->>'cliente_id')::UUID, (v_new_data->>'fecha')::DATE, (v_new_data->>'actividad_id')::BIGINT, v_enrollment_id, 'programa', v_area,
            v_total_items, v_completed_items,
            v_kcal_comp, v_mins_comp, v_p_comp, v_c_comp, v_f_comp,
            v_kcal_obj, v_mins_obj,
            NOW()
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. REPAIR/BACKFILL: Re-sync fitness data to PDA
UPDATE public.progreso_cliente SET fecha = fecha;
UPDATE public.progreso_cliente_nutricion SET fecha = fecha;
