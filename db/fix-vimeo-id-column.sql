-- Añadir la columna vimeo_id si no existe
ALTER TABLE activities ADD COLUMN IF NOT EXISTS vimeo_id TEXT;

-- Actualizar la caché del esquema
SELECT reload_schema_cache();
