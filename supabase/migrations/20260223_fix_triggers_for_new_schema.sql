-- Migration: Update trigger and backfill functions for clean progress columns
-- This fixes the error: record "new" has no field "calorias_json"

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
                    SELECT (e->>'id' || '_' || (e->>'bloque') || '_' || (e->>'orden'))::text FROM jsonb_array_elements(
                        CASE WHEN jsonb_typeof(NEW.ejercicios_completados->'ejercicios') = 'array' 
                             THEN NEW.ejercicios_completados->'ejercicios' 
                             ELSE '[]'::jsonb 
                        END
                    ) e
                    UNION
                    -- Extract the scalar value as text from the jsonb element
                    SELECT (k#>>'{}')::text FROM jsonb_array_elements(
                        CASE WHEN jsonb_typeof(NEW.ejercicios_completados) = 'array' 
                             THEN NEW.ejercicios_completados 
                             ELSE '[]'::jsonb 
                        END
                    ) AS k WHERE jsonb_typeof(NEW.ejercicios_completados) = 'array'
                )
            LOOP
                v_mins := COALESCE(v_row.m, 0);
                v_kcal := COALESCE(v_row.k, 0);
                v_p := COALESCE(v_row.p, 0);
                v_c := COALESCE(v_row.c, 0);
                v_f := COALESCE(v_row.f, 0);
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
        
        -- Cals/Mins from Fitness (Using clean column names)
        IF jsonb_typeof(NEW.calorias) = 'object' THEN
            SELECT SUM((value::text)::numeric) INTO v_kcal FROM jsonb_each_text(NEW.calorias);
        END IF;
        IF jsonb_typeof(NEW.minutos) = 'object' THEN
            SELECT SUM((value::text)::numeric) INTO v_mins FROM jsonb_each_text(NEW.minutos);
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
        v_kcal, v_mins, v_p, v_c, v_f, NOW()
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

-- 2. Update BACKFILL function
CREATE OR REPLACE FUNCTION backfill_daily_progress_stats() RETURNS VOID AS $$
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
    TRUNCATE TABLE public.progreso_diario_actividad RESTART IDENTITY;

    -- [A] Process FITNESS
    FOR r IN SELECT * FROM public.progreso_cliente WHERE enrollment_id IS NOT NULL LOOP
        v_completed := CASE WHEN jsonb_typeof(r.ejercicios_completados) = 'object' THEN (SELECT count(*) FROM jsonb_object_keys(r.ejercicios_completados)) ELSE 0 END;
        v_total := v_completed + CASE WHEN jsonb_typeof(r.ejercicios_pendientes) = 'object' THEN (SELECT count(*) FROM jsonb_object_keys(r.ejercicios_pendientes)) ELSE 0 END;
        
        INSERT INTO public.progreso_diario_actividad (
            cliente_id, fecha, actividad_id, enrollment_id, tipo, area,
            items_objetivo, items_completados, 
            calorias, minutos, proteinas, carbohidratos, grasas, recalculado_en
        ) VALUES (
            r.cliente_id, r.fecha, r.actividad_id, r.enrollment_id, 'programa', 'fitness',
            v_total, v_completed,
            (SELECT COALESCE(SUM((value::text)::numeric), 0) FROM jsonb_each_text(r.calorias)),
            (SELECT COALESCE(SUM((value::text)::numeric), 0) FROM jsonb_each_text(r.minutos)),
            0, 0, 0, NOW()
        );
    END LOOP;

    -- [B] Process NUTRITION
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

        -- Calculate Macros for completed items
        v_kcal := 0; v_mins := 0; v_p := 0; v_c := 0; v_f := 0;
        IF jsonb_typeof(r.macros) = 'object' THEN
            SELECT 
                SUM(COALESCE((value->>'minutos')::numeric, 0)),
                SUM(COALESCE((value->>'calorias')::numeric, 0)),
                SUM(COALESCE((value->>'proteinas')::numeric, 0)),
                SUM(COALESCE((value->>'carbohidratos')::numeric, 0)),
                SUM(COALESCE((value->>'grasas')::numeric, 0))
            INTO v_mins, v_kcal, v_p, v_c, v_f
            FROM jsonb_each(r.macros)
            WHERE key IN (
                SELECT k::text FROM jsonb_object_keys(r.ejercicios_completados) AS k
                WHERE jsonb_typeof(r.ejercicios_completados) = 'object'
                UNION
                SELECT (e->>'id' || '_' || (e->>'bloque') || '_' || (e->>'orden'))::text FROM jsonb_array_elements(
                    CASE WHEN jsonb_typeof(r.ejercicios_completados->'ejercicios') = 'array' 
                         THEN r.ejercicios_completados->'ejercicios' 
                         ELSE '[]'::jsonb 
                    END
                ) e
                UNION
                -- Extract the scalar value as text from the jsonb element
                SELECT (k#>>'{}')::text FROM jsonb_array_elements(
                    CASE WHEN jsonb_typeof(r.ejercicios_completados) = 'array' 
                         THEN r.ejercicios_completados 
                         ELSE '[]'::jsonb 
                    END
                ) AS k WHERE jsonb_typeof(r.ejercicios_completados) = 'array'
            );
        END IF;

        INSERT INTO public.progreso_diario_actividad (
            cliente_id, fecha, actividad_id, enrollment_id, tipo, area,
            items_objetivo, items_completados, 
            calorias, minutos, proteinas, carbohidratos, grasas, recalculado_en
        ) VALUES (
            r.cliente_id, r.fecha, r.actividad_id, r.enrollment_id, 'programa', 'nutricion',
            v_total, v_completed, 
            COALESCE(v_kcal, 0), COALESCE(v_mins, 0), COALESCE(v_p, 0), COALESCE(v_c, 0), COALESCE(v_f, 0), NOW()
        );
    END LOOP;
END;
$$ LANGUAGE plpgsql;
