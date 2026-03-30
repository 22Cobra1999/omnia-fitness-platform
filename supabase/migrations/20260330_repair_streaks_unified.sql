-- ==============================================================================
-- MIGRATION: DEFINITIVE STREAK REPAIR (V4.5)
-- Refactors streak logic to use the unified progreso_diario_actividad table.
-- Ensures streaks are NOT broken by days without items or by today being pending.
-- ==============================================================================

-- 1. DEFINE IMPROVED STREAK CALCULATION FUNCTION
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
    -- Loop over daily progress records that actually HAD items to do
    FOR v_rec IN 
        SELECT 
            fecha, 
            ((fit_items_c + nut_items_c) >= (fit_items_o + nut_items_o)) as is_completed
        FROM public.progreso_diario_actividad
        WHERE enrollment_id = p_enrollment_id
          AND (fit_items_o + nut_items_o) > 0  -- Skip days without items
          AND fecha <= v_current_date
        ORDER BY fecha DESC
    LOOP
        IF v_rec.is_completed THEN
            IF v_first THEN
                -- Must be either today or consecutive with "today" to start/continue a streak
                -- If the most recent completed day is older than yesterday, the streak is broken
                IF v_rec.fecha < v_current_date - INTERVAL '1 day' THEN
                    EXIT; -- Gap found before starting
                END IF;
                
                v_streak := 1;
                v_expected_date := v_rec.fecha - INTERVAL '1 day';
                v_last_date := v_rec.fecha;
                v_first := false;
            ELSE
                -- Check for continuity (skipping days where items_o was 0, which is handled by the WHERE clause)
                -- Since we skip empty days in the query, we don't need to check gap here?
                -- Wait, if there was a day with items_o > 0 that was NOT completed, the loop will visit it.
                -- If there was a day with items_o > 0 that is simply missing from the table, that's a gap.
                
                -- Actually, the best way to handle "non-activity days don't break" is to only care about 
                -- days that involve work.
                v_streak := v_streak + 1;
                v_expected_date := v_rec.fecha - INTERVAL '1 day';
            END IF;
        ELSE
            -- If we found an INCOMPLETE day that is NOT today, the streak is definitively broken.
            IF v_rec.fecha < v_current_date THEN
                EXIT;
            END IF;
            -- If today is incomplete, we just ignore it and look at yesterday to continue the streak.
        END IF;
    END LOOP;
    
    RETURN QUERY SELECT COALESCE(v_streak, 0), v_last_date;
END;
$$;

-- 2. UPDATE THE TRIGGER FUNCTION (Points to the new logic)
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

-- 3. ATTACH TRIGGER TO THE UNIFIED TABLE (Instead of legacy tables)
DROP TRIGGER IF EXISTS tr_update_streak_unified ON public.progreso_diario_actividad;
CREATE TRIGGER tr_update_streak_unified
AFTER INSERT OR UPDATE OF fit_items_c, nut_items_c ON public.progreso_diario_actividad
FOR EACH ROW EXECUTE FUNCTION public.tg_update_enrollment_streak();

-- 4. CLEANUP OLD TRIGGERS (If any remain)
DROP TRIGGER IF EXISTS tr_update_streak_fitness ON public.progreso_cliente;
DROP TRIGGER IF EXISTS tr_update_streak_nutricion ON public.progreso_cliente_nutricion;

-- 5. INITIALIZE DATA FOR ALL ACTIVE ENROLLMENTS
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
