-- 1. MASTER REPAIR: Aligh enrollment_id across all tables
-- We DROP references first to allow type changes
ALTER TABLE public.progreso_diario_actividad DROP CONSTRAINT IF EXISTS progreso_diario_actividad_enrollment_id_fkey;
ALTER TABLE public.progreso_cliente DROP CONSTRAINT IF EXISTS progreso_cliente_enrollment_id_fkey;
ALTER TABLE public.progreso_cliente_nutricion DROP CONSTRAINT IF EXISTS progreso_cliente_nutricion_enrollment_id_fkey;

-- Change types to BIGINT (The native type of activity_enrollments.id)
ALTER TABLE public.progreso_diario_actividad ALTER COLUMN enrollment_id TYPE BIGINT USING (CASE WHEN enrollment_id::text ~ '^[0-9]+$' THEN enrollment_id::text::bigint ELSE NULL END);
ALTER TABLE public.progreso_cliente ALTER COLUMN enrollment_id TYPE BIGINT USING (CASE WHEN enrollment_id::text ~ '^[0-9]+$' THEN enrollment_id::text::bigint ELSE NULL END);
ALTER TABLE public.progreso_cliente_nutricion ALTER COLUMN enrollment_id TYPE BIGINT USING (CASE WHEN enrollment_id::text ~ '^[0-9]+$' THEN enrollment_id::text::bigint ELSE NULL END);

-- Re-add columns if they were somehow missing
ALTER TABLE public.activity_enrollments ADD COLUMN IF NOT EXISTS last_streak_date DATE;
ALTER TABLE public.activity_enrollments ADD COLUMN IF NOT EXISTS current_streak INT DEFAULT 0;

-- 2. STREAK CALCULATION FUNCTION (FIXED FOR BIGINT AND NUTRITION)
CREATE OR REPLACE FUNCTION public.fn_calculate_enrollment_streak(p_enrollment_id BIGINT)
RETURNS TABLE (new_streak INT, last_date DATE) LANGUAGE plpgsql AS $$
DECLARE
    v_current_date DATE := CURRENT_DATE;
    v_streak INT := 0;
    v_rec RECORD;
    v_expected_date DATE;
    v_last_date DATE;
    v_first BOOLEAN := true;
BEGIN
    -- We look back through historical progress in both fitness and nutrition tables
    FOR v_rec IN 
        SELECT fecha, is_completed FROM (
            SELECT fecha, (ejercicios_pendientes = '[]' OR ejercicios_pendientes = '{}' OR ejercicios_pendientes IS NULL) as is_completed
            FROM public.progreso_cliente
            WHERE enrollment_id = p_enrollment_id
            UNION ALL
            SELECT fecha, (ejercicios_pendientes = '[]' OR ejercicios_pendientes = '{}' OR ejercicios_pendientes IS NULL) as is_completed
            FROM public.progreso_cliente_nutricion
            WHERE enrollment_id = p_enrollment_id
        ) sub
        WHERE fecha <= v_current_date
        ORDER BY fecha DESC
    LOOP
        IF v_rec.is_completed THEN
            IF v_first THEN
                -- Must be either today or yesterday to continue an existing streak
                IF v_rec.fecha < v_current_date - INTERVAL '1 day' THEN
                    EXIT; -- Already broken
                END IF;
                v_streak := 1;
                v_expected_date := v_rec.fecha - INTERVAL '1 day';
                v_last_date := v_rec.fecha;
                v_first := false;
            ELSE
                IF v_rec.fecha = v_expected_date THEN
                    v_streak := v_streak + 1;
                    v_expected_date := v_rec.fecha - INTERVAL '1 day';
                ELSE
                    EXIT; -- Gap found
                END IF;
            END IF;
        ELSE
            -- If we found an incomplete day that is NOT today, streak is broken
            IF v_rec.fecha < v_current_date THEN
                EXIT;
            END IF;
            -- If today is incomplete, we just keep going back to see if yesterday was the end of a streak
        END IF;
    END LOOP;
    
    RETURN QUERY SELECT COALESCE(v_streak, 0), v_last_date;
END;
$$;

-- 3. TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION public.tg_update_enrollment_streak()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
    v_streak_data RECORD;
BEGIN
    -- Recalculate streak for this enrollment
    SELECT * INTO v_streak_data FROM public.fn_calculate_enrollment_streak(NEW.enrollment_id);
    
    UPDATE public.activity_enrollments
    SET current_streak = v_streak_data.new_streak,
        last_streak_date = v_streak_data.last_date
    WHERE id = NEW.enrollment_id;
    
    RETURN NEW;
END;
$$;

-- 4. ATTACH TRIGGERS
DROP TRIGGER IF EXISTS tr_update_streak_fitness ON public.progreso_cliente;
CREATE TRIGGER tr_update_streak_fitness
AFTER UPDATE OF ejercicios_pendientes ON public.progreso_cliente
FOR EACH ROW EXECUTE FUNCTION public.tg_update_enrollment_streak();

DROP TRIGGER IF EXISTS tr_update_streak_nutricion ON public.progreso_cliente_nutricion;
CREATE TRIGGER tr_update_streak_nutricion
AFTER UPDATE OF ejercicios_pendientes ON public.progreso_cliente_nutricion
FOR EACH ROW EXECUTE FUNCTION public.tg_update_enrollment_streak();

-- 5. REPAIR DAILY PROGRESS TRIGGER (Fixes column name mismatch)
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
    IF TG_TABLE_NAME = 'progreso_cliente_nutricion' THEN
        v_area := 'nutricion';
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
        -- SAFE DYNAMIC ACCESS: If columns don't exist in the specific table, it returns NULL instead of crashing
        DECLARE
            v_new_json jsonb := to_jsonb(NEW);
            v_cal_src jsonb := COALESCE(v_new_json->'calorias', v_new_json->'calorias_json', '{}'::jsonb);
            v_min_src jsonb := COALESCE(v_new_json->'minutos', v_new_json->'minutos_json', '{}'::jsonb);
        BEGIN
            v_completed_items := CASE WHEN jsonb_typeof(NEW.ejercicios_completados) = 'object' THEN (SELECT count(*) FROM jsonb_object_keys(NEW.ejercicios_completados)) ELSE 0 END;
            v_total_items := v_completed_items + CASE WHEN jsonb_typeof(NEW.ejercicios_pendientes) = 'object' THEN (SELECT count(*) FROM jsonb_object_keys(NEW.ejercicios_pendientes)) ELSE 0 END;
            
            IF jsonb_typeof(v_cal_src) = 'object' THEN
                SELECT COALESCE(SUM((value::text)::numeric), 0) INTO v_kcal FROM jsonb_each_text(v_cal_src);
            END IF;
            IF jsonb_typeof(v_min_src) = 'object' THEN
                SELECT COALESCE(SUM((value::text)::numeric), 0) INTO v_mins FROM jsonb_each_text(v_min_src);
            END IF;
        END;
    END IF;

    -- Main processing block with exception safety
    BEGIN
        -- Upsert logic using text comparisons for safety across UUID/BIGINT
        BEGIN
            INSERT INTO public.progreso_diario_actividad (
                cliente_id, fecha, actividad_id, enrollment_id, tipo, area,
                items_objetivo, items_completados, 
                calorias, proteinas, carbohidratos, grasas, minutos,
                recalculado_en
            ) VALUES (
                NEW.cliente_id, NEW.fecha, NEW.actividad_id, NEW.enrollment_id, 'programa', v_area,
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
            WHERE (NEW.enrollment_id IS NOT NULL AND enrollment_id::text = NEW.enrollment_id::text AND fecha = NEW.fecha)
               OR (NEW.enrollment_id IS NULL AND cliente_id = NEW.cliente_id AND fecha = NEW.fecha AND actividad_id = NEW.actividad_id);
        END;
    EXCEPTION WHEN OTHERS THEN
        -- Log error to Postgres log but allow the record update to succeed to avoid 500 errors
        RAISE WARNING 'Error in update_daily_progress_from_program: %', SQLERRM;
    END;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. INITIALIZE DATA
DO $$
DECLARE
    v_enrollment RECORD;
    v_streak_data RECORD;
BEGIN
    FOR v_enrollment IN SELECT id FROM public.activity_enrollments WHERE status = 'active' LOOP
        SELECT * INTO v_streak_data FROM public.fn_calculate_enrollment_streak(v_enrollment.id);
        
        UPDATE public.activity_enrollments
        SET current_streak = v_streak_data.new_streak,
            last_streak_date = v_streak_data.last_date
        WHERE id = v_enrollment.id;
    END LOOP;
END $$;
