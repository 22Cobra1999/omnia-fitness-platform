-- Agregar columna categoria a la tabla activities
ALTER TABLE activities 
ADD COLUMN categoria VARCHAR(50) DEFAULT 'fitness';

-- Actualizar productos existentes basado en el tipo
UPDATE activities 
SET categoria = CASE 
  WHEN type = 'program' OR type = 'fitness' OR type = 'workshop' THEN 'fitness'
  WHEN type = 'document' THEN 'nutrition'
  ELSE 'fitness'
END;
