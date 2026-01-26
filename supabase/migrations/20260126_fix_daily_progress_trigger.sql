-- MIGRATION: Remove redundant snapshot columns and simplify trigger
-- We are removing 'cantidad_actividades_adeudadas' and 'cantidad_dias_adeudados'
-- accessible via aggregate queries on this table (SUM/COUNT).

-- 1. Drop Columns
ALTER TABLE public.progreso_diario_actividad 
DROP COLUMN IF EXISTS cantidad_actividades_adeudadas,
DROP COLUMN IF EXISTS cantidad_dias_adeudados;

-- 2. Update Function to just log daily activity (no historical debt calc)
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
    -- Determine Area and basic counts
    IF TG_TABLE_NAME = 'progreso_cliente_nutricion' THEN
        v_area := 'nutricion';
        
        -- Count items (Plates) - Robust check for array/object
        v_completed_items := CASE 
            WHEN jsonb_typeof(NEW.ejercicios_completados->'ejercicios') = 'array' THEN jsonb_array_length(NEW.ejercicios_completados->'ejercicios')
            WHEN jsonb_typeof(NEW.ejercicios_completados) = 'object' THEN (SELECT count(*) FROM jsonb_object_keys(NEW.ejercicios_completados))
            ELSE 0 
        END;
        
        -- Total items for THIS DAY = Completed + Pending
        v_total_items := v_completed_items + CASE 
            WHEN jsonb_typeof(NEW.ejercicios_pendientes->'ejercicios') = 'array' THEN jsonb_array_length(NEW.ejercicios_pendientes->'ejercicios')
            WHEN jsonb_typeof(NEW.ejercicios_pendientes) = 'object' THEN (SELECT count(*) FROM jsonb_object_keys(NEW.ejercicios_pendientes))
            ELSE 0 
        END;
        
        -- Macros calculation
        IF jsonb_typeof(NEW.macros) = 'object' THEN
            SELECT 
                COALESCE(SUM(COALESCE((value->>'proteinas')::numeric, 0) * 4 + COALESCE((value->>'carbohidratos')::numeric, 0) * 4 + COALESCE((value->>'grasas')::numeric, 0) * 9), 0),
                COALESCE(SUM(COALESCE((value->>'proteinas')::numeric, 0)), 0),
                COALESCE(SUM(COALESCE((value->>'carbohidratos')::numeric, 0)), 0),
                COALESCE(SUM(COALESCE((value->>'grasas')::numeric, 0)), 0)
            INTO v_kcal, v_protein, v_carbs, v_fat
            FROM jsonb_each(NEW.macros);
        END IF;
          
    ELSE
        v_area := 'fitness';
        
        -- Count items (Exercises)
        v_completed_items := CASE WHEN jsonb_typeof(NEW.ejercicios_completados) = 'object' THEN (SELECT count(*) FROM jsonb_object_keys(NEW.ejercicios_completados)) ELSE 0 END;
        v_total_items := v_completed_items + CASE WHEN jsonb_typeof(NEW.ejercicios_pendientes) = 'object' THEN (SELECT count(*) FROM jsonb_object_keys(NEW.ejercicios_pendientes)) ELSE 0 END;
        
        -- Calories and Minutes
        IF jsonb_typeof(NEW.calorias_json) = 'object' THEN
            SELECT COALESCE(SUM((value::text)::numeric), 0) INTO v_kcal FROM jsonb_each_text(NEW.calorias_json);
        END IF;
        IF jsonb_typeof(NEW.minutos_json) = 'object' THEN
            SELECT COALESCE(SUM((value::text)::numeric), 0) INTO v_mins FROM jsonb_each_text(NEW.minutos_json);
        END IF;
          
    END IF;

    -- Upsert into progreso_diario_actividad 
    -- Now it works as a pure daily LOG. Calculations of "Debt" are done at read-time via SQL.
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

-- Re-apply trigger to both tables
DROP TRIGGER IF EXISTS trigger_update_daily_progress_fitness ON public.progreso_cliente;
CREATE TRIGGER trigger_update_daily_progress_fitness
    AFTER INSERT OR UPDATE ON public.progreso_cliente
    FOR EACH ROW
    EXECUTE FUNCTION update_daily_progress_from_program();

DROP TRIGGER IF EXISTS trigger_update_daily_progress_nutrition ON public.progreso_cliente_nutricion;
CREATE TRIGGER trigger_update_daily_progress_nutrition
    AFTER INSERT OR UPDATE ON public.progreso_cliente_nutricion
    FOR EACH ROW
    EXECUTE FUNCTION update_daily_progress_from_program();
