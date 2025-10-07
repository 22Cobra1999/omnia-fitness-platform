-- Asegurarse de que la columna rich_description existe y tiene el tipo correcto
DO $$
BEGIN
    -- Verificar si la columna existe
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'activities' AND column_name = 'rich_description'
    ) THEN
        -- Si no existe, crearla
        ALTER TABLE activities ADD COLUMN rich_description TEXT;
    END IF;
    
    -- Actualizar los registros existentes para copiar description a rich_description si está vacío
    UPDATE activities 
    SET rich_description = description 
    WHERE rich_description IS NULL OR rich_description = '';
END $$;

-- Añadir un comentario a la columna
COMMENT ON COLUMN activities.rich_description IS 'Descripción con formato HTML para mostrar contenido enriquecido';
