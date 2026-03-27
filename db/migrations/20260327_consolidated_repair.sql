-- OMNIA CONSOLIDATED REPAIR - MARCH 2026
-- 1. Standardize column names (Remove accents for consistency with API)
DO $$ 
BEGIN
    -- Fix nutrition_program_details
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'nutrition_program_details' AND column_name = 'calorías') THEN
        ALTER TABLE public.nutrition_program_details RENAME COLUMN "calorías" TO calorias;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'nutrition_program_details' AND column_name = 'proteínas') THEN
        ALTER TABLE public.nutrition_program_details RENAME COLUMN "proteínas" TO proteinas;
    END IF;

    -- Fix ejercicios_detalles (Fitness)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ejercicios_detalles' AND column_name = 'calorias') THEN
        ALTER TABLE public.ejercicios_detalles ADD COLUMN calorias INTEGER;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ejercicios_detalles' AND column_name = 'duracion_min') THEN
        ALTER TABLE public.ejercicios_detalles ADD COLUMN duracion_min INTEGER;
    END IF;
END $$;

-- 2. Ensure Client Progress Tables have required JSONB columns
ALTER TABLE public.progreso_cliente ADD COLUMN IF NOT EXISTS detalles_series JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.progreso_cliente_nutricion ADD COLUMN IF NOT EXISTS macros JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.progreso_cliente_nutricion ADD COLUMN IF NOT EXISTS ingredientes JSONB DEFAULT '{}'::jsonb;

-- 3. Fix Master Trigger Function (update_daily_progress_from_program)
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
    -- Cleanup on Date Swap
    IF (TG_OP = 'UPDATE' AND OLD.fecha IS DISTINCT FROM NEW.fecha) THEN
        DELETE FROM public.progreso_diario_actividad 
        WHERE (enrollment_id = OLD.enrollment_id OR (enrollment_id IS NULL AND cliente_id = OLD.cliente_id AND actividad_id = OLD.actividad_id))
          AND fecha = OLD.fecha;
    END IF;

    v_enrollment_id := NEW.enrollment_id;

    IF TG_TABLE_NAME = 'progreso_cliente_nutricion' THEN
        v_area := 'nutricion';
        
        IF jsonb_typeof(NEW.macros) = 'object' THEN
            -- Calculate Objective
            SELECT 
                COALESCE(SUM((value->>'minutos')::numeric), 0),
                COALESCE(SUM((value->>'calorias')::numeric), 0)
            INTO v_mins_obj, v_kcal_obj
            FROM jsonb_each(NEW.macros);

            -- Calculate Completed Metrics
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
                    SELECT (e->>'id' || '_' || (e->>'bloque') || '_' || (e->>'orden')) FROM jsonb_array_elements(
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
        -- Calc Objective for Fitness (Handles both legacy and new column names)
        IF jsonb_typeof(NEW.minutos) = 'object' THEN
            SELECT COALESCE(SUM((value::text)::numeric), 0) INTO v_mins_obj FROM jsonb_each_text(NEW.minutos);
        ELSIF jsonb_typeof(COALESCE(to_jsonb(NEW)->'minutos_json', '{}'::jsonb)) = 'object' THEN
             SELECT COALESCE(SUM((value::text)::numeric), 0) INTO v_mins_obj FROM jsonb_each_text(to_jsonb(NEW)->'minutos_json');
        END IF;

        IF jsonb_typeof(NEW.calorias) = 'object' THEN
            SELECT COALESCE(SUM((value::text)::numeric), 0) INTO v_kcal_obj FROM jsonb_each_text(NEW.calorias);
        ELSIF jsonb_typeof(COALESCE(to_jsonb(NEW)->'calorias_json', '{}'::jsonb)) = 'object' THEN
             SELECT COALESCE(SUM((value::text)::numeric), 0) INTO v_kcal_obj FROM jsonb_each_text(to_jsonb(NEW)->'calorias_json');
        END IF;

        -- Completed metrics
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
            LEFT JOIN jsonb_each_text(COALESCE(NEW.minutos, to_jsonb(NEW)->'minutos_json', '{}'::jsonb)) m ON m.key = keys.k
            LEFT JOIN jsonb_each_text(COALESCE(NEW.calorias, to_jsonb(NEW)->'calorias_json', '{}'::jsonb)) c ON c.key = keys.k;
        END IF;

        v_total_items := v_completed_items + CASE 
            WHEN jsonb_typeof(NEW.ejercicios_pendientes) = 'object' THEN (SELECT count(*) FROM jsonb_object_keys(NEW.ejercicios_pendientes)) 
            WHEN jsonb_typeof(NEW.ejercicios_pendientes) = 'array' THEN jsonb_array_length(NEW.ejercicios_pendientes)
            ELSE 0 
        END;
    END IF;

    -- UPSERT Consolidated Record
    INSERT INTO public.progreso_diario_actividad (
        cliente_id, fecha, actividad_id, enrollment_id, tipo, area,
        items_objetivo, items_completados, 
        calorias, proteinas, carbohidratos, grasas, minutos,
        recalculado_en
    ) VALUES (
        NEW.cliente_id, NEW.fecha, NEW.actividad_id, v_enrollment_id, 'programa', v_area,
        v_total_items, v_completed_items,
        v_kcal_comp, v_p_comp, v_c_comp, v_f_comp, v_mins_comp,
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
        recalculado_en = NOW(),
        actividad_id = EXCLUDED.actividad_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Re-attach triggers ensuring clean state
DROP TRIGGER IF EXISTS tr_sync_daily_stats_fitness ON public.progreso_cliente;
CREATE TRIGGER tr_sync_daily_stats_fitness
    AFTER INSERT OR UPDATE ON public.progreso_cliente
    FOR EACH ROW EXECUTE FUNCTION public.update_daily_progress_from_program();

DROP TRIGGER IF EXISTS tr_sync_daily_stats_nutrition ON public.progreso_cliente_nutricion;
CREATE TRIGGER tr_sync_daily_stats_nutrition
    AFTER INSERT OR UPDATE ON public.progreso_cliente_nutricion
    FOR EACH ROW EXECUTE FUNCTION public.update_daily_progress_from_program();

-- 5. Final Analyze
ANALYZE public.progreso_cliente;
ANALYZE public.progreso_cliente_nutricion;
ANALYZE public.nutrition_program_details;
ANALYZE public.ejercicios_detalles;
