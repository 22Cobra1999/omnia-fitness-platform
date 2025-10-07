-- Verificar si la columna vimeo_id existe, si no, crearla
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'activities' 
        AND column_name = 'vimeo_id'
    ) THEN
        ALTER TABLE activities ADD COLUMN vimeo_id TEXT;
    END IF;
    
    -- Verificar si la columna preview_video_url existe, si no, crearla
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'activities' 
        AND column_name = 'preview_video_url'
    ) THEN
        ALTER TABLE activities ADD COLUMN preview_video_url TEXT;
    END IF;
    
    -- Actualizar la caché del esquema
    PERFORM pg_catalog.pg_reload_conf();
END $$;

-- Mostrar la estructura actual de la tabla
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'activities'
ORDER BY ordinal_position;
