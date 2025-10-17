-- Eliminar columna storage_provider de activity_media
ALTER TABLE activity_media 
DROP COLUMN IF EXISTS storage_provider;

-- Eliminar columna storage_provider de ejercicios_detalles
ALTER TABLE ejercicios_detalles 
DROP COLUMN IF EXISTS storage_provider;

-- Nota: Ahora detectaremos el provider automáticamente basándonos en el formato de la URL:
-- - Si contiene 'bunny' o 'mediadelivery.net' = Bunny.net
-- - Caso contrario = Supabase







