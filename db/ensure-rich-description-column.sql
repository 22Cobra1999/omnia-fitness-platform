-- Verificar y crear la columna rich_description si no existe
DO $$
BEGIN
    -- Verificar si la columna existe
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'activities' AND column_name = 'rich_description'
    ) THEN
        -- Si no existe, crearla
        ALTER TABLE activities ADD COLUMN rich_description TEXT;
        
        -- Actualizar los registros existentes para copiar description a rich_description
        UPDATE activities 
        SET rich_description = description 
        WHERE rich_description IS NULL OR rich_description = '';
        
        RAISE NOTICE 'Columna rich_description creada exitosamente';
    ELSE
        RAISE NOTICE 'La columna rich_description ya existe';
    END IF;
END $$;

-- Añadir un comentario a la columna
COMMENT ON COLUMN activities.rich_description IS 'Descripción con formato HTML para mostrar contenido enriquecido';

-- Refrescar el esquema de caché de Supabase
NOTIFY pgrst, 'reload schema';
