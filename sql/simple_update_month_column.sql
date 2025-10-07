-- Script simple para actualizar la columna month_number
-- Cambiar el tipo de INTEGER a TEXT para permitir múltiples valores

-- Primero, verificar el tipo actual
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'activity_calendar' AND column_name = 'month_number';

-- Cambiar el tipo de la columna
ALTER TABLE activity_calendar ALTER COLUMN month_number TYPE TEXT;

-- Agregar comentario
COMMENT ON COLUMN activity_calendar.month_number IS 'Meses separados por punto y coma (ej: "1;2;3")';
