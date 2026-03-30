-- ==============================================================================
-- MIGRATION: DEFINITIVE REPAIR - ZOMBIE TRIGGER CLEANUP & FLAT SCHEMA SYNC (V4.4)
-- This script uses a dynamic DO block to drop ALL triggers on progress tables
-- ensuring no "area" or "fitness_items" errors remain.
-- ==============================================================================

DO $$
DECLARE
    r RECORD;
BEGIN
    -- 1. DROP ALL TRIGGERS ON progreso_cliente DYNAMICALLY
    FOR r IN (
        SELECT tgname 
        FROM pg_trigger 
        JOIN pg_class ON pg_trigger.tgrelid = pg_class.oid 
        WHERE relname = 'progreso_cliente' 
        AND tgisinternal = false
    ) LOOP
        EXECUTE 'DROP TRIGGER IF EXISTS ' || r.tgname || ' ON public.progreso_cliente';
        RAISE NOTICE 'Dropped trigger % on progreso_cliente', r.tgname;
    END LOOP;

    -- 2. DROP ALL TRIGGERS ON progreso_cliente_nutricion DYNAMICALLY
    FOR r IN (
        SELECT tgname 
        FROM pg_trigger 
        JOIN pg_class ON pg_trigger.tgrelid = pg_class.oid 
        WHERE relname = 'progreso_cliente_nutricion' 
        AND tgisinternal = false
    ) LOOP
        EXECUTE 'DROP TRIGGER IF EXISTS ' || r.tgname || ' ON public.progreso_cliente_nutricion';
        RAISE NOTICE 'Dropped trigger % on progreso_cliente_nutricion', r.tgname;
    END LOOP;
END $$;

-- 3. DROP KNOWN CONFLICTING FUNCTIONS
DROP FUNCTION IF EXISTS public.update_daily_progress_from_program() CASCADE;
DROP FUNCTION IF EXISTS public.trigger_sync_to_daily_progress() CASCADE;
DROP FUNCTION IF EXISTS public.sync_daily_progress() CASCADE;

-- 4. RE-DEFINE THE CORRECTED UNIFIED SYNC FUNCTION (V4.4)
CREATE OR REPLACE FUNCTION public.update_daily_progress_from_program()
RETURNS TRIGGER AS $$
DECLARE
    v_fit_items_o INTEGER := 0;
    v_fit_items_c INTEGER := 0;
    v_fit_mins_o NUMERIC := 0;
    v_fit_mins_c NUMERIC := 0;
    v_fit_kcal_o NUMERIC := 0;
    v_fit_kcal_c NUMERIC := 0;
    
    v_nut_items_o INTEGER := 0;
    v_nut_items_c INTEGER := 0;
    v_nut_kcal_o NUMERIC := 0;
    v_nut_kcal_c NUMERIC := 0;
    v_nut_macros JSONB := '{}'::jsonb;

    v_enrollment_id BIGINT;
    v_completed_json JSONB;
    v_pending_json JSONB;
    v_macros_json JSONB;
    v_mins_data JSONB;
    v_cals_data JSONB;
    v_new_data JSONB;
    v_old_data JSONB;
BEGIN
    -- to_jsonb avoids "missing field" errors
    v_new_data := to_jsonb(NEW);
    
    -- Handle Date Change Cleanup
    IF (TG_OP = 'UPDATE') THEN
        v_old_data := to_jsonb(OLD);
        IF (v_old_data->>'fecha' IS DISTINCT FROM v_new_data->>'fecha') THEN
            DELETE FROM public.progreso_diario_actividad 
            WHERE cliente_id = (v_old_data->>'cliente_id')::UUID 
              AND actividad_id = (v_old_data->>'actividad_id')::BIGINT
              AND fecha = (v_old_data->>'fecha')::DATE;
        END IF;
    END IF;

    v_enrollment_id := (v_new_data->>'enrollment_id')::BIGINT;
    v_completed_json := COALESCE(v_new_data->'ejercicios_completados', '{}'::jsonb);
    v_pending_json := COALESCE(v_new_data->'ejercicios_pendientes', '{}'::jsonb);

    IF TG_TABLE_NAME = 'progreso_cliente_nutricion' THEN
        v_macros_json := COALESCE(v_new_data->'macros', '{}'::jsonb);
        
        -- Macros logic (Objective)
        IF jsonb_typeof(v_macros_json) = 'object' THEN
            SELECT 
                COALESCE(SUM((val->>'k')::numeric), 0),
                COUNT(*)
            INTO v_nut_kcal_o, v_nut_items_o
            FROM jsonb_each(v_macros_json) AS m(key, val);

            -- Macros logic (Completed)
            SELECT 
                COALESCE(SUM((val->>'k')::numeric), 0),
                COUNT(*)
            INTO v_nut_kcal_c, v_nut_items_c
            FROM jsonb_each(v_macros_json) AS m(key, val)
            WHERE m.key IN (
                SELECT (elem::text) FROM jsonb_array_elements_text(
                    CASE WHEN jsonb_typeof(v_completed_json->'ejercicios') = 'array' 
                         THEN v_completed_json->'ejercicios' 
                         ELSE '[]'::jsonb END
                ) AS elem
                UNION
                -- Fallback for direct array of IDs
                SELECT (e#>>'{}')::text FROM jsonb_array_elements(v_completed_json) e
                WHERE jsonb_typeof(v_completed_json) = 'array'
            );

            -- Build nut_macros blob
            SELECT jsonb_build_object(
                'p', jsonb_build_object(
                    'c', COALESCE(SUM((v->>'p')::numeric) FILTER (WHERE k IN (SELECT (elem::text) FROM jsonb_array_elements_text(CASE WHEN jsonb_typeof(v_completed_json->'ejercicios') = 'array' THEN v_completed_json->'ejercicios' ELSE '[]'::jsonb END) AS elem UNION SELECT (e#>>'{}')::text FROM jsonb_array_elements(v_completed_json) e WHERE jsonb_typeof(v_completed_json) = 'array')), 0),
                    'o', COALESCE(SUM((v->>'p')::numeric), 0)
                ),
                'c', jsonb_build_object(
                    'c', COALESCE(SUM((v->>'c')::numeric) FILTER (WHERE k IN (SELECT (elem::text) FROM jsonb_array_elements_text(CASE WHEN jsonb_typeof(v_completed_json->'ejercicios') = 'array' THEN v_completed_json->'ejercicios' ELSE '[]'::jsonb END) AS elem UNION SELECT (e#>>'{}')::text FROM jsonb_array_elements(v_completed_json) e WHERE jsonb_typeof(v_completed_json) = 'array')), 0),
                    'o', COALESCE(SUM((v->>'c')::numeric), 0)
                ),
                'f', jsonb_build_object(
                    'c', COALESCE(SUM((v->>'g')::numeric) FILTER (WHERE k IN (SELECT (elem::text) FROM jsonb_array_elements_text(CASE WHEN jsonb_typeof(v_completed_json->'ejercicios') = 'array' THEN v_completed_json->'ejercicios' ELSE '[]'::jsonb END) AS elem UNION SELECT (e#>>'{}')::text FROM jsonb_array_elements(v_completed_json) e WHERE jsonb_typeof(v_completed_json) = 'array')), 0),
                    'o', COALESCE(SUM((v->>'g')::numeric), 0)
                )
            ) INTO v_nut_macros
            FROM jsonb_each(v_macros_json) AS m(k, v);
        END IF;

    ELSE
        -- Fitness
        v_mins_data := COALESCE(v_new_data->'minutos', '{}'::jsonb);
        v_cals_data := COALESCE(v_new_data->'calorias', '{}'::jsonb);

        -- Objectives
        IF jsonb_typeof(v_mins_data) = 'object' THEN
            SELECT COALESCE(SUM((value::text)::numeric), 0) INTO v_fit_mins_o FROM jsonb_each_text(v_mins_data);
        END IF;
        IF jsonb_typeof(v_cals_data) = 'object' THEN
            SELECT COALESCE(SUM((value::text)::numeric), 0) INTO v_fit_kcal_o FROM jsonb_each_text(v_cals_data);
        END IF;
        
        v_fit_items_c := CASE 
            WHEN jsonb_typeof(v_completed_json) = 'object' THEN (SELECT count(*) FROM jsonb_object_keys(v_completed_json)) 
            WHEN jsonb_typeof(v_completed_json) = 'array' THEN jsonb_array_length(v_completed_json)
            ELSE 0 
        END;
        v_fit_items_o := v_fit_items_c + COALESCE(CASE 
            WHEN jsonb_typeof(v_pending_json) = 'object' THEN (SELECT count(*) FROM jsonb_object_keys(v_pending_json)) 
            WHEN jsonb_typeof(v_pending_json) = 'array' THEN jsonb_array_length(v_pending_json)
            ELSE 0 
        END, 0);

        -- Completed metrics
        IF v_fit_items_c > 0 THEN
            SELECT 
                COALESCE(SUM((m.value::text)::numeric), 0),
                COALESCE(SUM((c.value::text)::numeric), 0)
            INTO v_fit_mins_c, v_fit_kcal_c
            FROM (
                SELECT k FROM jsonb_object_keys(v_completed_json) k WHERE jsonb_typeof(v_completed_json) = 'object'
                UNION
                SELECT (e#>>'{}')::text FROM jsonb_array_elements(v_completed_json) e WHERE jsonb_typeof(v_completed_json) = 'array'
            ) keys
            LEFT JOIN jsonb_each_text(v_mins_data) m ON m.key = keys.k
            LEFT JOIN jsonb_each_text(v_cals_data) c ON c.key = keys.k;
        END IF;
    END IF;

    -- UPSERT into flat schema (Correct columns)
    INSERT INTO public.progreso_diario_actividad (
        cliente_id, fecha, actividad_id, enrollment_id, tipo,
        fit_items_o, fit_items_c, fit_mins_o, fit_mins_c, fit_kcal_o, fit_kcal_c,
        nut_items_o, nut_items_c, nut_kcal_o, nut_kcal_c, nut_macros,
        recalculado_en
    ) VALUES (
        (v_new_data->>'cliente_id')::UUID, 
        (v_new_data->>'fecha')::DATE, 
        (v_new_data->>'actividad_id')::BIGINT, 
        v_enrollment_id, 
        'programa', 
        v_fit_items_o, v_fit_items_c, v_fit_mins_o, v_fit_mins_c, v_fit_kcal_o, v_fit_kcal_c,
        v_nut_items_o, v_nut_items_c, v_nut_kcal_o, v_nut_kcal_c, v_nut_macros,
        NOW()
    )
    ON CONFLICT (cliente_id, fecha, actividad_id) DO UPDATE SET
        enrollment_id = EXCLUDED.enrollment_id,
        fit_items_o = CASE WHEN TG_TABLE_NAME = 'progreso_cliente' THEN EXCLUDED.fit_items_o ELSE progreso_diario_actividad.fit_items_o END,
        fit_items_c = CASE WHEN TG_TABLE_NAME = 'progreso_cliente' THEN EXCLUDED.fit_items_c ELSE progreso_diario_actividad.fit_items_c END,
        fit_mins_o = CASE WHEN TG_TABLE_NAME = 'progreso_cliente' THEN EXCLUDED.fit_mins_o ELSE progreso_diario_actividad.fit_mins_o END,
        fit_mins_c = CASE WHEN TG_TABLE_NAME = 'progreso_cliente' THEN EXCLUDED.fit_mins_c ELSE progreso_diario_actividad.fit_mins_c END,
        fit_kcal_o = CASE WHEN TG_TABLE_NAME = 'progreso_cliente' THEN EXCLUDED.fit_kcal_o ELSE progreso_diario_actividad.fit_kcal_o END,
        fit_kcal_c = CASE WHEN TG_TABLE_NAME = 'progreso_cliente' THEN EXCLUDED.fit_kcal_c ELSE progreso_diario_actividad.fit_kcal_c END,
        nut_items_o = CASE WHEN TG_TABLE_NAME = 'progreso_cliente_nutricion' THEN EXCLUDED.nut_items_o ELSE progreso_diario_actividad.nut_items_o END,
        nut_items_c = CASE WHEN TG_TABLE_NAME = 'progreso_cliente_nutricion' THEN EXCLUDED.nut_items_c ELSE progreso_diario_actividad.nut_items_c END,
        nut_kcal_o = CASE WHEN TG_TABLE_NAME = 'progreso_cliente_nutricion' THEN EXCLUDED.nut_kcal_o ELSE progreso_diario_actividad.nut_kcal_o END,
        nut_kcal_c = CASE WHEN TG_TABLE_NAME = 'progreso_cliente_nutricion' THEN EXCLUDED.nut_kcal_c ELSE progreso_diario_actividad.nut_kcal_c END,
        nut_macros = CASE WHEN TG_TABLE_NAME = 'progreso_cliente_nutricion' THEN EXCLUDED.nut_macros ELSE progreso_diario_actividad.nut_macros END,
        recalculado_en = NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. ATTACH UNIFIED TRIGGERS
CREATE TRIGGER sync_daily_progress_v4
AFTER INSERT OR UPDATE ON public.progreso_cliente
FOR EACH ROW EXECUTE FUNCTION public.update_daily_progress_from_program();

CREATE TRIGGER sync_daily_progress_nut_v4
AFTER INSERT OR UPDATE ON public.progreso_cliente_nutricion
FOR EACH ROW EXECUTE FUNCTION public.update_daily_progress_from_program();

-- 6. FULL BACKFILL (Triggered update)
UPDATE public.progreso_cliente SET fecha = fecha;
UPDATE public.progreso_cliente_nutricion SET fecha = fecha;
