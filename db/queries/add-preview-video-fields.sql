-- Añadir campos para el video de presentación
ALTER TABLE activities 
ADD COLUMN IF NOT EXISTS preview_video_url TEXT,
ADD COLUMN IF NOT EXISTS preview_vimeo_id TEXT;

-- Crear un índice para mejorar las búsquedas por preview_vimeo_id
CREATE INDEX IF NOT EXISTS idx_activities_preview_vimeo_id ON activities(preview_vimeo_id);

-- Actualizar los registros existentes para extraer el ID de Vimeo de las URLs de preview
UPDATE activities
SET preview_vimeo_id = SUBSTRING(preview_video_url FROM 'vimeo\.com/(\d+)')
WHERE preview_video_url LIKE '%vimeo.com%' AND (preview_vimeo_id IS NULL OR preview_vimeo_id = '');

-- Verificar la estructura actualizada de la tabla
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'activities' AND column_name LIKE '%preview%'
ORDER BY ordinal_position;
