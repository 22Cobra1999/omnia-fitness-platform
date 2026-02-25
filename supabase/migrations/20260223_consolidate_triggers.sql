-- Migration: Cleanup redundant triggers and fix remaining conflicts

-- 1. Drop redundant triggers on progreso_cliente
DROP TRIGGER IF EXISTS tr_refresh_daily_progreso_fit ON public.progreso_cliente;
DROP TRIGGER IF EXISTS tr_sync_daily_progress_fitness ON public.progreso_cliente;
DROP TRIGGER IF EXISTS trg_sync_fitness ON public.progreso_cliente;
DROP TRIGGER IF EXISTS trigger_update_daily_progress_fitness ON public.progreso_cliente;

-- 2. Keep only the essential ones
-- We keep 'trigger_actualizar_progreso_cliente_fecha' for timestamp updates
-- We keep 'trigger_update_program_end_date' for logic updates
-- We keep ONE sync trigger:
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'tr_sync_daily_stats_fitness') THEN
        CREATE TRIGGER tr_sync_daily_stats_fitness
        AFTER INSERT OR UPDATE ON public.progreso_cliente
        FOR EACH ROW EXECUTE FUNCTION public.update_daily_progress_from_program();
    END IF;
END $$;

-- 3. Ensure the function itself is corrected (Redundant check but safe)
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
        
        -- Macros parsing
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
                )
            LOOP
                v_mins := COALESCE(v_row.m, 0);
                v_kcal := COALESCE(v_row.k, 0);
                v_p := COALESCE(v_row.p, 0);
                v_c := COALESCE(v_row.c, 0);
                v_f := COALESCE(v_row.f, 0);
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
        
        -- Cal/Mins from FITNESS (CLEAN COLUMNS)
        IF jsonb_typeof(NEW.calorias) = 'object' THEN
            SELECT SUM((value::text)::numeric) INTO v_kcal FROM jsonb_each_text(NEW.calorias);
        END IF;
        IF jsonb_typeof(NEW.minutos) = 'object' THEN
            SELECT SUM((value::text)::numeric) INTO v_mins FROM jsonb_each_text(NEW.minutos);
        END IF;

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
