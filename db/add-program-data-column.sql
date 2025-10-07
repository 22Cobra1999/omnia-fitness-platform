-- Verificar si la columna program_data existe en la tabla activities
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'activities'
        AND column_name = 'program_data'
    ) THEN
        -- Añadir la columna program_data como JSONB
        ALTER TABLE activities ADD COLUMN program_data JSONB;
        
        -- Actualizar la columna con un objeto vacío para las filas existentes
        UPDATE activities SET program_data = '{}'::JSONB WHERE program_data IS NULL;
    END IF;
END $$;
