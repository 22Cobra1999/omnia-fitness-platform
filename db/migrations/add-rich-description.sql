-- Añadir campo rich_description a la tabla activities
ALTER TABLE activities ADD COLUMN IF NOT EXISTS rich_description TEXT;
