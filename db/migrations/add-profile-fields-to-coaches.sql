-- Script para agregar campos de perfil a la tabla coaches
-- Ejecutar este script en el SQL Editor de Supabase

-- Agregar campos de perfil físico y contacto
ALTER TABLE coaches 
ADD COLUMN IF NOT EXISTS weight NUMERIC(5,2),
ADD COLUMN IF NOT EXISTS height INTEGER,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact TEXT;

-- Comentarios para documentar las columnas
COMMENT ON COLUMN coaches.weight IS 'Peso en kilogramos';
COMMENT ON COLUMN coaches.height IS 'Altura en centímetros';
COMMENT ON COLUMN coaches.phone IS 'Número de teléfono';
COMMENT ON COLUMN coaches.emergency_contact IS 'Contacto de emergencia (nombre y teléfono)';

-- Verificar que se agregaron correctamente
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'coaches' 
AND column_name IN ('weight', 'height', 'phone', 'emergency_contact', 'birth_date', 'location', 'gender')
ORDER BY column_name;







