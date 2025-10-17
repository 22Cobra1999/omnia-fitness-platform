-- Verificar si la columna 'notas' existe en la tabla nutrition_program_details
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'nutrition_program_details'
        AND column_name = 'notas'
    ) THEN
        -- Añadir la columna 'notas' si no existe
        ALTER TABLE nutrition_program_details ADD COLUMN notas TEXT;
    END IF;
END $$;

-- Verificar si la columna 'peso' existe en la tabla nutrition_program_details
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'nutrition_program_details'
        AND column_name = 'peso'
    ) THEN
        -- Añadir la columna 'peso' si no existe
        ALTER TABLE nutrition_program_details ADD COLUMN peso NUMERIC;
    END IF;
END $$;
