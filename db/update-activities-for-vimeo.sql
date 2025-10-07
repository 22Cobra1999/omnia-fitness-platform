-- Verificar y actualizar la estructura de la tabla de actividades para soportar videos de Vimeo

-- 1. Asegurarse de que el campo video_url existe y tiene el tipo correcto
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'activities' AND column_name = 'video_url') THEN
        ALTER TABLE activities ADD COLUMN video_url TEXT;
    END IF;
END $$;

-- 2. Añadir campo específico para almacenar el ID de Vimeo
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'activities' AND column_name = 'vimeo_id') THEN
        ALTER TABLE activities ADD COLUMN vimeo_id TEXT;
    END IF;
END $$;

-- 3. Asegurarse de que el campo interactive_pauses existe y tiene el tipo correcto
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'activities' AND column_name = 'interactive_pauses') THEN
        ALTER TABLE activities ADD COLUMN interactive_pauses JSONB;
    END IF;
END $$;

-- 4. Actualizar los registros existentes para extraer el ID de Vimeo de las URLs
UPDATE activities
SET vimeo_id = SUBSTRING(video_url FROM 'vimeo\.com/(\d+)')
WHERE video_url LIKE '%vimeo.com%' AND (vimeo_id IS NULL OR vimeo_id = '');

-- 5. Crear un índice para mejorar las búsquedas por vimeo_id
CREATE INDEX IF NOT EXISTS idx_activities_vimeo_id ON activities(vimeo_id);

-- 6. Crear un trigger para extraer automáticamente el ID de Vimeo al insertar o actualizar
CREATE OR REPLACE FUNCTION extract_vimeo_id() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.video_url LIKE '%vimeo.com%' THEN
        NEW.vimeo_id := SUBSTRING(NEW.video_url FROM 'vimeo\.com/(\d+)');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Eliminar el trigger si ya existe
DROP TRIGGER IF EXISTS extract_vimeo_id_trigger ON activities;

-- Crear el trigger
CREATE TRIGGER extract_vimeo_id_trigger
BEFORE INSERT OR UPDATE ON activities
FOR EACH ROW
WHEN (NEW.video_url IS NOT NULL)
EXECUTE FUNCTION extract_vimeo_id();

-- 7. Asegurarse de que los campos de tipo tienen valores válidos
UPDATE activities
SET type = 'video'
WHERE type = 'video' AND video_url IS NOT NULL;

-- 8. Verificar que todos los campos requeridos tienen valores por defecto
ALTER TABLE activities 
ALTER COLUMN is_public SET DEFAULT true,
ALTER COLUMN availability_type SET DEFAULT 'check_availability';

-- 9. Asegurarse de que el campo updated_at se actualiza automáticamente
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'set_updated_at' 
        AND tgrelid = 'activities'::regclass
    ) THEN
        -- Crear función para actualizar timestamp
        CREATE OR REPLACE FUNCTION update_timestamp()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = now();
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;

        -- Crear trigger
        CREATE TRIGGER set_updated_at
        BEFORE UPDATE ON activities
        FOR EACH ROW
        EXECUTE FUNCTION update_timestamp();
    END IF;
END $$;

-- 10. Verificar que la tabla tiene los permisos correctos
GRANT ALL PRIVILEGES ON TABLE activities TO authenticated;
GRANT ALL PRIVILEGES ON TABLE activities TO service_role;

-- Mostrar la estructura actualizada de la tabla
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'activities' 
ORDER BY ordinal_position;
