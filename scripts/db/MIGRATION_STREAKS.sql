-- 1. ADD COLUMNS IF NOT EXSIT
ALTER TABLE public.activity_enrollments ADD COLUMN IF NOT EXISTS last_streak_date DATE;
ALTER TABLE public.activity_enrollments ADD COLUMN IF NOT EXISTS current_streak INT DEFAULT 0;

-- 2. STREAK CALCULATION FUNCTION
CREATE OR REPLACE FUNCTION public.fn_calculate_enrollment_streak(p_enrollment_id UUID)
RETURNS TABLE (new_streak INT, last_date DATE) LANGUAGE plpgsql AS $$
DECLARE
    v_current_date DATE := CURRENT_DATE;
    v_streak INT := 0;
    v_rec RECORD;
    v_expected_date DATE;
    v_last_date DATE;
    v_first BOOLEAN := true;
BEGIN
    -- We look back through historical progress
    FOR v_rec IN 
        SELECT fecha, 
               (ejercicios_pendientes = '{}' OR ejercicios_pendientes IS NULL) as is_completed
        FROM public.progreso_cliente
        WHERE enrollment_id = p_enrollment_id
          AND fecha <= v_current_date
          AND (ejercicios_pendientes IS NOT NULL OR ejercicios_completados IS NOT NULL) -- has some activity
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
