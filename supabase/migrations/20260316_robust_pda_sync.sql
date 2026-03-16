-- Final Robust Sync for Daily Progress (V6 - Manual Upsert for Workshops)
-- 1. Fix Column Types & Unique Indexing
DO $$ 
BEGIN
    -- Fix progreso_diario_actividad
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'progreso_diario_actividad' AND column_name = 'enrollment_id' AND data_type = 'uuid'
    ) THEN
        ALTER TABLE public.progreso_diario_actividad ALTER COLUMN enrollment_id TYPE BIGINT USING (NULL);
    END IF;

    -- Fix progreso_cliente
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'progreso_cliente' AND column_name = 'enrollment_id' AND data_type = 'uuid'
    ) THEN
        ALTER TABLE public.progreso_cliente ALTER COLUMN enrollment_id TYPE BIGINT USING (NULL);
    END IF;

    -- Fix progreso_cliente_nutricion
     IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'progreso_cliente_nutricion' AND column_name = 'enrollment_id' AND data_type = 'uuid'
    ) THEN
        ALTER TABLE public.progreso_cliente_nutricion ALTER COLUMN enrollment_id TYPE BIGINT USING (NULL);
    END IF;
END $$;

DROP INDEX IF EXISTS public.uq_progreso_enrollment_dia;
DROP INDEX IF EXISTS public.uq_pda_enrollment_date;
ALTER TABLE public.progreso_diario_actividad DROP CONSTRAINT IF EXISTS progreso_diario_actividad_enrollment_fecha_key;

-- We use partial indexes to handle legacy NULL enrollments vs new data
CREATE UNIQUE INDEX IF NOT EXISTS uq_pda_enrollment_date 
ON public.progreso_diario_actividad (enrollment_id, fecha) 
WHERE enrollment_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_pda_client_activity_date_null_enrollment 
ON public.progreso_diario_actividad (cliente_id, actividad_id, fecha) 
WHERE enrollment_id IS NULL;

-- 2. Update Trigger Function with Dynamic JSON Extraction (Avoids missing field errors)
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
    
    -- Handle Date Change Cleanup safely
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
                COALESCE(SUM((value->>'minutos')::numeric), 0),
                COALESCE(SUM((value->>'calorias')::numeric), 0)
            INTO v_mins_obj, v_kcal_obj
            FROM jsonb_each(v_macros_json);

            FOR v_row IN 
                SELECT SUM((value->>'minutos')::numeric) as m, 
                       SUM((value->>'calorias')::numeric) as k,
                       SUM((value->>'proteinas')::numeric) as p,
                       SUM((value->>'carbohidratos')::numeric) as c,
                       SUM((value->>'grasas')::numeric) as f
                FROM jsonb_each(v_macros_json) 
                WHERE key IN (
                    SELECT k_inner::text FROM jsonb_object_keys(v_completed_json) AS k_inner
                    WHERE jsonb_typeof(v_completed_json) = 'object'
                    UNION
                    SELECT (e->>'id' || '_' || (e->>'bloque') || '_' || (e->>'orden'))::text FROM jsonb_array_elements(
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
        -- Fitness and others: Safe Access
        v_area := 'fitness';
        v_mins_data := COALESCE(v_new_data->'minutos_json', v_new_data->'minutos', '{}'::jsonb);
        v_cals_data := COALESCE(v_new_data->'calorias_json', v_new_data->'calorias', '{}'::jsonb);

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

    -- MANUAL UPSERT (Safe extraction)
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

-- 3. Robust Backfill Function
CREATE OR REPLACE FUNCTION public.backfill_daily_progress_stats() RETURNS VOID AS $$
DECLARE
    r RECORD;
    v_pda_id BIGINT;
BEGIN
    TRUNCATE TABLE public.progreso_diario_actividad RESTART IDENTITY;

    -- Triggering sync from source tables
    UPDATE public.progreso_cliente SET fecha = fecha WHERE true;
    UPDATE public.progreso_cliente_nutricion SET fecha = fecha WHERE true;
    
    -- Workshops Loop (using manual upsert because partial unique indexes don't work with ON CONFLICT)
    FOR r IN SELECT * FROM public.taller_progreso_temas WHERE enrollment_id IS NOT NULL LOOP
        SELECT id INTO v_pda_id FROM public.progreso_diario_actividad 
        WHERE enrollment_id = r.enrollment_id AND fecha = r.fecha_seleccionada;

        IF v_pda_id IS NOT NULL THEN
            UPDATE public.progreso_diario_actividad SET
                items_objetivo = items_objetivo + 1,
                items_completados = items_completados + (CASE WHEN r.asistio THEN 1 ELSE 0 END),
                recalculado_en = NOW()
            WHERE id = v_pda_id;
        ELSE
            INSERT INTO public.progreso_diario_actividad (
                cliente_id, fecha, actividad_id, enrollment_id, tipo, area,
                items_objetivo, items_completados, recalculado_en
            ) VALUES (
                r.cliente_id, r.fecha_seleccionada, r.actividad_id, r.enrollment_id, 'taller', 'general',
                1, CASE WHEN r.asistio THEN 1 ELSE 0 END, NOW()
            );
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 4. Execute
SELECT public.backfill_daily_progress_stats();
