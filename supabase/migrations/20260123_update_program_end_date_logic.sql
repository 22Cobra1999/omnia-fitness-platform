-- ==========================================
-- AUTOMATE PROGRAM_END_DATE CALCULATION
-- 1. Workshops: Max(class date) + 7 days
-- 2. Documents: Start Date + (Duration * 2) weeks
-- ==========================================

CREATE OR REPLACE FUNCTION fn_update_program_end_date()
RETURNS TRIGGER AS $$
DECLARE
    v_activity_type TEXT;
    v_duration_weeks INTEGER;
    v_max_class_date DATE;
BEGIN
    -- Get activity type and duration
    SELECT type, semanas_totales INTO v_activity_type, v_duration_weeks
    FROM public.activities
    WHERE id = NEW.activity_id;

    -- Only calculate if status is 'activa' and start_date is present
    -- OR if it's a workshop and we can pre-calculate it?
    -- User said: "vencimiento de acceso"
    
    IF NEW.start_date IS NOT NULL THEN
        IF v_activity_type = 'workshop' OR v_activity_type = 'taller' THEN
            -- Find last class date from taller_detalles
            -- Class dates are stored in originales->'fechas_horarios' array
            SELECT MAX((h->>'fecha')::DATE)
            INTO v_max_class_date
            FROM public.taller_detalles td,
                 jsonb_array_elements(td.originales->'fechas_horarios') as h
            WHERE td.actividad_id = NEW.activity_id;

            IF v_max_class_date IS NOT NULL THEN
                NEW.program_end_date := v_max_class_date + INTERVAL '7 days';
            END IF;

        ELSIF v_activity_type = 'document' OR v_activity_type = 'documento' THEN
            -- Document: always +30 days from start
            NEW.program_end_date := NEW.start_date::DATE + INTERVAL '30 days';
        
        ELSE
            -- Fitness or Nutrition Programs: Max(scheduled date) + 7 days
            -- We try to find the max date in either fitness or nutrition progress tables
            SELECT COALESCE(
                (SELECT MAX(fecha) FROM public.progreso_cliente_fitness WHERE actividad_id = NEW.activity_id AND cliente_id = NEW.client_id),
                (SELECT MAX(fecha) FROM public.progreso_cliente_nutricion WHERE actividad_id = NEW.activity_id AND cliente_id = NEW.client_id)
            ) INTO v_max_class_date;

            IF v_max_class_date IS NOT NULL THEN
                NEW.program_end_date := v_max_class_date + INTERVAL '7 days';
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update program_end_date on insert or start_date update
DROP TRIGGER IF EXISTS tr_update_program_end_date ON public.activity_enrollments;
CREATE TRIGGER tr_update_program_end_date
    BEFORE INSERT OR UPDATE OF start_date ON public.activity_enrollments
    FOR EACH ROW
    EXECUTE FUNCTION fn_update_program_end_date();

-- Update existing enrollments that have started but lack program_end_date
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT id FROM public.activity_enrollments 
        WHERE start_date IS NOT NULL AND program_end_date IS NULL
    LOOP
        -- Touching the row will trigger the BEFORE UPDATE logic
        UPDATE public.activity_enrollments SET start_date = start_date WHERE id = r.id;
    END LOOP;
END $$;
