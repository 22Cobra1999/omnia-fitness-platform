-- Agregar columna duracion_min en ejercicios_detalles si no existe
ALTER TABLE IF EXISTS ejercicios_detalles
ADD COLUMN IF NOT EXISTS duracion_min INTEGER;

-- Nota: columna nullable, sin valor por defecto

