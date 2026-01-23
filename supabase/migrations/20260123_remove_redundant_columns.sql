-- Migration: Remove redundant columns from taller_progreso_temas
-- tema_nombre and descripcion should be read from taller_detalles via JOIN

-- Remove redundant columns
ALTER TABLE taller_progreso_temas 
DROP COLUMN IF EXISTS tema_nombre,
DROP COLUMN IF EXISTS descripcion;

-- Verify the table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'taller_progreso_temas'
ORDER BY ordinal_position;
