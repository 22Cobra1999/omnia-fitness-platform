-- Añadir la columna preview_video_url a la tabla activities
ALTER TABLE activities 
ADD COLUMN IF NOT EXISTS preview_video_url TEXT;

-- Crear un índice para mejorar las búsquedas
CREATE INDEX IF NOT EXISTS idx_activities_preview_video_url ON activities(preview_video_url);

-- Verificar que la columna se ha añadido correctamente
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'activities' AND column_name = 'preview_video_url';
