-- MIGRACIÓN: Corrección de error de rango de fecha y lógica de expiración de inscripciones
-- Archivo: 20260223_fix_expiration_logic.sql

-- 1. Función corregida para calcular fechas de expiración y fin de programa
CREATE OR REPLACE FUNCTION public.calculate_expiration_date()
RETURNS TRIGGER AS $$
DECLARE
    v_semanas_totales INTEGER;
    v_dias_acceso INTEGER;
    v_total_days_margin INTEGER;
    v_program_days INTEGER;
BEGIN
    -- Obtenemos la configuración de la actividad
    SELECT 
        COALESCE(semanas_totales, 1), 
        COALESCE(dias_acceso, 0)
    INTO v_semanas_totales, v_dias_acceso
    FROM public.activities
    WHERE id = NEW.activity_id;

    v_program_days := v_semanas_totales * 7;
    v_total_days_margin := v_dias_acceso + v_program_days;

    -- A. Expiration Date: Lote fijo desde el momento de la compra (created_at)
    -- Se calcula al insertar y no cambia aunque cambie el start_date (es el margen de acceso total)
    IF TG_OP = 'INSERT' OR NEW.expiration_date IS NULL THEN
        NEW.expiration_date := (NEW.created_at + (v_total_days_margin || ' days')::INTERVAL)::DATE;
    END IF;

    -- B. Program End Date: Cuándo termina el programa según el día que el usuario empezó
    -- Se recalcula cada vez que el start_date cambia
    IF NEW.start_date IS NOT NULL THEN
        NEW.program_end_date := (NEW.start_date::DATE + (v_program_days || ' days')::INTERVAL)::DATE;
        
        -- Opcional: Si el program_end_date supera la expiration_date por mucho, 
        -- podrías querer extender la expiration_date, pero la solicitud pide que sea "inmediata en la compra".
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Asegurar el trigger en activity_enrollments
DROP TRIGGER IF EXISTS tr_calculate_expiration_date ON public.activity_enrollments;

CREATE TRIGGER tr_calculate_expiration_date
    BEFORE INSERT OR UPDATE OF start_date, activity_id ON public.activity_enrollments
    FOR EACH ROW
    EXECUTE FUNCTION public.calculate_expiration_date();

-- 3. Actualización retroactiva para corregir registros actuales (opcional pero recomendado)
-- UPDATE public.activity_enrollments SET updated_at = NOW() WHERE expiration_date IS NULL OR start_date IS NOT NULL;
