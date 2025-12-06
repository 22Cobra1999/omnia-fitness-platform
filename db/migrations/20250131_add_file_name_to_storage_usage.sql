-- Agregar columna file_name a storage_usage
-- Esto permite almacenar el nombre del archivo directamente sin depender de APIs externas

ALTER TABLE storage_usage 
ADD COLUMN IF NOT EXISTS file_name TEXT;

-- Comentario
COMMENT ON COLUMN storage_usage.file_name IS 'Nombre descriptivo del archivo o archivos (ej: nombre del video, imagen o pdf)';





































