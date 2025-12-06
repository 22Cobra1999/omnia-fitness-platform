-- Agregar columna 'tipo' a nutrition_program_details si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'nutrition_program_details'
        AND column_name = 'tipo'
    ) THEN
        -- Añadir la columna 'tipo' si no existe
        ALTER TABLE nutrition_program_details 
        ADD COLUMN tipo VARCHAR(50) DEFAULT 'otro';
        
        -- Crear índice para mejorar las consultas
        CREATE INDEX IF NOT EXISTS idx_nutrition_program_details_tipo 
        ON nutrition_program_details(tipo);
        
        -- Comentario en la columna
        COMMENT ON COLUMN nutrition_program_details.tipo IS 'Tipo de comida: desayuno, almuerzo, merienda, cena, colación, pre-entreno, post-entreno, otro';
    END IF;
END $$;



