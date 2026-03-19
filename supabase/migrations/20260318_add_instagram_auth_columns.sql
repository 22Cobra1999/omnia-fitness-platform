-- Agregar columnas para la autenticación de Instagram a la tabla de coaches
ALTER TABLE coaches ADD COLUMN IF NOT EXISTS instagram_access_token text;
ALTER TABLE coaches ADD COLUMN IF NOT EXISTS instagram_user_id text;
ALTER TABLE coaches ADD COLUMN IF NOT EXISTS instagram_expires_at timestamp with time zone;

-- Comentar las columnas para documentación
COMMENT ON COLUMN coaches.instagram_access_token IS 'Token de acceso encriptado para la API de Instagram';
COMMENT ON COLUMN coaches.instagram_user_id IS 'ID de usuario único de Instagram';
COMMENT ON COLUMN coaches.instagram_expires_at IS 'Fecha de expiración del token de acceso';
