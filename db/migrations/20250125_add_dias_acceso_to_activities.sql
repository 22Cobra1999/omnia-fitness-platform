-- Agregar columna dias_acceso a la tabla activities
-- Esta columna controla cuántos días tiene el cliente para acceder al producto comprado

ALTER TABLE activities 
ADD COLUMN dias_acceso INTEGER DEFAULT 30;

-- Comentario para documentar el propósito de la columna
COMMENT ON COLUMN activities.dias_acceso IS 'Número de días que tiene el cliente para acceder al producto comprado. Aplica para programas y documentos.';

-- Actualizar registros existentes con valor por defecto
UPDATE activities 
SET dias_acceso = 30 
WHERE dias_acceso IS NULL;
