-- MIGRACIÓN: Agregar start_deadline y actualizar lógica de fechas
-- Archivo: 20260223_add_start_deadline.sql

-- 1. Agregar columna start_deadline a activity_enrollments
ALTER TABLE public.activity_enrollments 
ADD COLUMN IF NOT EXISTS start_deadline DATE;

-- 2. Actualizar la función de cálculo para incluir el deadline de inicio
CREATE OR REPLACE FUNCTION public.calculate_expiration_date()
RETURNS TRIGGER AS $$
DECLARE
    v_semanas INTEGER;
    v_dias_margen_acceso INTEGER;
    v_total_acceso_dias INTEGER;
    v_dias_programa INTEGER;
BEGIN
    -- Obtenemos configuración del producto
    SELECT 
        COALESCE(semanas_totales, 1), 
        COALESCE(dias_acceso, 0)
    INTO v_semanas, v_dias_margen_acceso
    FROM public.activities
    WHERE id = NEW.activity_id;

    v_dias_programa := v_semanas * 7;
    
    -- El start_deadline es la fecha máxima para DARLE PLAY al programa
    -- (created_at + dias_acceso)
    IF TG_OP = 'INSERT' OR NEW.start_deadline IS NULL THEN
        NEW.start_deadline := (NEW.created_at + (v_dias_margen_acceso || ' days')::INTERVAL)::DATE;
    END IF;

    -- La expiration_date es el fin de la vida útil del producto (deadline + duración)
    -- Esto asegura que el cliente tenga tiempo de terminarlo si empieza el último día del deadline
    NEW.expiration_date := (NEW.start_deadline + (v_dias_programa || ' days')::INTERVAL)::DATE;

    -- El program_end_date se ajusta al inicio REAL elegido
    IF NEW.start_date IS NOT NULL THEN
        NEW.program_end_date := (NEW.start_date::DATE + (v_dias_programa || ' days')::INTERVAL)::DATE;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Trigger ya existe, pero aseguramos que se dispare
-- (No hace falta recrearlo si ya apunta a esta función)

-- 4. Corregir registros existentes
UPDATE public.activity_enrollments 
SET start_deadline = (created_at + ((SELECT COALESCE(dias_acceso, 0) FROM activities WHERE id = activity_id) || ' days')::INTERVAL)::DATE
WHERE start_deadline IS NULL;
