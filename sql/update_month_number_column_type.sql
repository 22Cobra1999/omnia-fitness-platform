-- Cambiar el tipo de la columna month_number para permitir múltiples valores separados por punto y coma
-- Primero, crear una columna temporal
ALTER TABLE activity_calendar ADD COLUMN month_numbers_temp TEXT;

-- Copiar los datos existentes
UPDATE activity_calendar SET month_numbers_temp = CAST(month_number AS TEXT);

-- Eliminar la columna original
ALTER TABLE activity_calendar DROP COLUMN month_number;

-- Renombrar la columna temporal
ALTER TABLE activity_calendar RENAME COLUMN month_numbers_temp TO month_number;

-- Agregar un comentario para documentar el formato
COMMENT ON COLUMN activity_calendar.month_number IS 'Meses separados por punto y coma (ej: "1;2;3")';
