-- Add current_streak column to activity_enrollments
ALTER TABLE public.activity_enrollments ADD COLUMN IF NOT EXISTS current_streak INT DEFAULT 0;

-- Function to calculate streak for a specific enrollment
-- This can be used in the initialization script
CREATE OR REPLACE FUNCTION public.calculate_streak(p_enrollment_id UUID) 
RETURNS INT AS $$
DECLARE
    v_streak INT := 0;
    v_date DATE := CURRENT_DATE;
    v_completed BOOLEAN;
BEGIN
    -- Check if today is completed
    SELECT 
        NOT EXISTS (
            SELECT 1 
            FROM jsonb_each(ejercicios_pendientes) 
            WHERE ejercicios_pendientes != '{}'
        ) INTO v_completed
    FROM public.progreso_cliente 
    WHERE enrollment_id = p_enrollment_id AND fecha = v_date;

    -- If today not completed, start checking from yesterday
    IF NOT v_completed OR v_completed IS NULL THEN
        v_date := v_date - 1;
    END IF;

    LOOP
        SELECT 
            (ejercicios_pendientes = '{}' OR ejercicios_pendientes IS NULL OR NOT EXISTS (SELECT 1 FROM jsonb_each(ejercicios_pendientes)))
            INTO v_completed
        FROM public.progreso_cliente 
        WHERE enrollment_id = p_enrollment_id AND fecha = v_date;

        IF v_completed THEN
            v_streak := v_streak + 1;
            v_date := v_date - 1;
        ELSE
            EXIT;
        END IF;
    END LOOP;

    RETURN v_streak;
END;
$$ LANGUAGE plpgsql;
