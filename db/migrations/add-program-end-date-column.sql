-- Agregar columna program_end_date a activity_enrollments si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'activity_enrollments' 
        AND column_name = 'program_end_date'
    ) THEN
        ALTER TABLE activity_enrollments 
        ADD COLUMN program_end_date DATE;
        RAISE NOTICE 'Columna program_end_date agregada a activity_enrollments';
    ELSE
        RAISE NOTICE 'Columna program_end_date ya existe en activity_enrollments';
    END IF;
END $$;

-- Comentario para documentar la columna
COMMENT ON COLUMN activity_enrollments.program_end_date IS 
'Fecha de finalización del programa: última fecha de progreso_cliente/progreso_cliente_nutricion + 6 días. Permite al coach extender hasta 6 días después de la última fecha de progreso.';

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'activity_enrollments' 
        AND column_name = 'program_end_date'
    ) THEN
        ALTER TABLE activity_enrollments 
        ADD COLUMN program_end_date DATE;
        RAISE NOTICE 'Columna program_end_date agregada a activity_enrollments';
    ELSE
        RAISE NOTICE 'Columna program_end_date ya existe en activity_enrollments';
    END IF;
END $$;

-- Comentario para documentar la columna
COMMENT ON COLUMN activity_enrollments.program_end_date IS 
'Fecha de finalización del programa: última fecha de progreso_cliente/progreso_cliente_nutricion + 6 días. Permite al coach extender hasta 6 días después de la última fecha de progreso.';




