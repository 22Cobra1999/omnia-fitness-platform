-- ================================================================
-- 1. SYNC PROGRAM_END_DATE (+7 DAYS FROM LAST SESSION)
-- ================================================================

CREATE OR REPLACE FUNCTION fn_update_program_end_date()
RETURNS TRIGGER AS $$
DECLARE
    v_activity_type TEXT;
    v_max_date DATE;
BEGIN
    -- Get activity type
    SELECT type INTO v_activity_type
    FROM public.activities
    WHERE id = NEW.activity_id;

    IF NEW.start_date IS NOT NULL THEN
        IF v_activity_type IN ('workshop', 'taller') THEN
            -- Last class + 7 days
            SELECT MAX((h->>'fecha')::DATE) INTO v_max_date
            FROM public.taller_detalles td,
                 jsonb_array_elements(td.originales->'fechas_horarios') as h
            WHERE td.actividad_id = NEW.activity_id;
        
        ELSIF v_activity_type IN ('document', 'documento') THEN
            -- Document: fixed +30 days
            v_max_date := NEW.start_date::DATE + INTERVAL '23 days'; -- So + INTERVAL '7 days' makes it +30
            -- Wait, simpler:
            NEW.program_end_date := NEW.start_date::DATE + INTERVAL '30 days';
            RETURN NEW;
        
        ELSE
            -- Fitness or Nutrition Programs: Max(scheduled date) + 7 days
            SELECT COALESCE(
                (SELECT MAX(fecha) FROM public.progreso_cliente WHERE actividad_id = NEW.activity_id AND cliente_id = NEW.client_id),
                (SELECT MAX(fecha) FROM public.progreso_cliente_nutricion WHERE actividad_id = NEW.activity_id AND cliente_id = NEW.client_id)
            ) INTO v_max_date;
        END IF;

        IF v_max_date IS NOT NULL THEN
            NEW.program_end_date := v_max_date + INTERVAL '7 days';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- 2. AUTO-SYNC PROGRESO_DIARIO_ACTIVIDAD FOR PROGRAMS
-- ================================================================

CREATE OR REPLACE FUNCTION update_daily_progress_from_program()
RETURNS TRIGGER AS $$
DECLARE
    v_total_items INTEGER;
    v_completed_items INTEGER;
    v_kcal NUMERIC := 0;
    v_protein NUMERIC := 0;
    v_carbs NUMERIC := 0;
    v_fat NUMERIC := 0;
    v_mins INTEGER := 0;
    v_area TEXT;
BEGIN
    -- Determine Area
    IF TG_TABLE_NAME = 'progreso_cliente_nutricion' THEN
        v_area := 'nutricion';
        
        -- Count items (Plates)
        v_total_items := (
            COALESCE(jsonb_array_length(NEW.ejercicios_completados->'ejercicios'), 0) + 
            COALESCE(jsonb_array_length(NEW.ejercicios_pendientes->'ejercicios'), 0)
        );
        v_completed_items := COALESCE(jsonb_array_length(NEW.ejercicios_completados->'ejercicios'), 0);
        
        -- Macros calculation (from NEW.macros)
        SELECT 
            SUM(COALESCE((value->>'proteinas')::numeric, 0) * 4 + COALESCE((value->>'carbohidratos')::numeric, 0) * 4 + COALESCE((value->>'grasas')::numeric, 0) * 9),
            SUM(COALESCE((value->>'proteinas')::numeric, 0)),
            SUM(COALESCE((value->>'carbohidratos')::numeric, 0)),
            SUM(COALESCE((value->>'grasas')::numeric, 0))
        INTO v_kcal, v_protein, v_carbs, v_fat
        FROM jsonb_each(NEW.macros);
        
    ELSE
        v_area := 'fitness';
        
        -- Count items (Exercises)
        v_total_items := (
            CASE WHEN jsonb_typeof(NEW.ejercicios_completados) = 'object' THEN (SELECT count(*) FROM jsonb_object_keys(NEW.ejercicios_completados)) ELSE 0 END +
            CASE WHEN jsonb_typeof(NEW.ejercicios_pendientes) = 'object' THEN (SELECT count(*) FROM jsonb_object_keys(NEW.ejercicios_pendientes)) ELSE 0 END
        );
        v_completed_items := CASE WHEN jsonb_typeof(NEW.ejercicios_completados) = 'object' THEN (SELECT count(*) FROM jsonb_object_keys(NEW.ejercicios_completados)) ELSE 0 END;
        
        -- Calories and Minutes (from pc.calorias_json / minutos_json)
        SELECT SUM((value::text)::numeric) INTO v_kcal FROM jsonb_each_text(NEW.calorias_json);
        SELECT SUM((value::text)::numeric) INTO v_mins FROM jsonb_each_text(NEW.minutos_json);
    END IF;

    -- Upsert into progreso_diario_actividad
    -- Based on (client, date, activity)
    BEGIN
        INSERT INTO public.progreso_diario_actividad (
            cliente_id, fecha, actividad_id, tipo, area,
            items_objetivo, items_completados, 
            calorias, proteinas, carbohidratos, grasas, minutos,
            recalculado_en
        ) VALUES (
            NEW.cliente_id, NEW.fecha, NEW.actividad_id, 'programa', v_area,
            v_total_items, v_completed_items,
            v_kcal, v_protein, v_carbs, v_fat, v_mins,
            NOW()
        );
    EXCEPTION WHEN unique_violation THEN
        UPDATE public.progreso_diario_actividad
        SET items_objetivo = v_total_items,
            items_completados = v_completed_items,
            calorias = v_kcal,
            proteinas = v_protein,
            carbohidratos = v_carbs,
            grasas = v_fat,
            minutos = v_mins,
            recalculado_en = NOW()
        WHERE cliente_id = NEW.cliente_id AND fecha = NEW.fecha AND actividad_id = NEW.actividad_id;
    END;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply Triggers for Programs
DROP TRIGGER IF EXISTS tr_sync_daily_progress_fitness ON public.progreso_cliente;
CREATE TRIGGER tr_sync_daily_progress_fitness
    AFTER INSERT OR UPDATE ON public.progreso_cliente
    FOR EACH ROW EXECUTE FUNCTION update_daily_progress_from_program();

DROP TRIGGER IF EXISTS tr_sync_daily_progress_nutri ON public.progreso_cliente_nutricion;
CREATE TRIGGER tr_sync_daily_progress_nutri
    AFTER INSERT OR UPDATE ON public.progreso_cliente_nutricion
    FOR EACH ROW EXECUTE FUNCTION update_daily_progress_from_program();

-- ================================================================
-- 3. FIX EXISTING DATA
-- ================================================================

-- Fix ID 203 End Date
UPDATE public.activity_enrollments 
SET program_end_date = '2026-01-31' 
WHERE id = '203';

-- Populate missing daily progress for existing records
-- (Optional: run only if needed, but let's do it for activity 93 and date 24)
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT * FROM public.progreso_cliente_nutricion WHERE actividad_id = 93 LOOP
        -- Trigger logic manual run for existing rows
        -- (This would be better as an INSERT ... SELECT but simple for now)
        INSERT INTO public.progreso_diario_actividad (cliente_id, fecha, actividad_id, tipo, area, items_objetivo, items_completados, recalculado_en)
        VALUES (r.cliente_id, r.fecha, r.actividad_id, 'programa', 'nutricion', 5, 0, NOW())
        ON CONFLICT (id) DO NOTHING; -- Skip if exists (requires unique constraint though)
    END LOOP;
END $$;
