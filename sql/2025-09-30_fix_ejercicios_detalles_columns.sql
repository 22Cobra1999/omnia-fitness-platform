-- Agregar columnas faltantes en ejercicios_detalles
ALTER TABLE IF EXISTS ejercicios_detalles
ADD COLUMN IF NOT EXISTS duracion_min INTEGER,
ADD COLUMN IF NOT EXISTS video_url TEXT;

-- Verificar que las columnas se agregaron correctamente
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'ejercicios_detalles' 
AND column_name IN ('duracion_min', 'video_url');
