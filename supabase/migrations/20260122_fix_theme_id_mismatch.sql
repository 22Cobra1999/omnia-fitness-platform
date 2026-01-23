-- Fix Workshop Theme ID Mismatch
-- The workshop was updated and theme IDs changed from 2,3 to 16,17
-- This script updates the attendance records to match the new theme IDs

-- First, let's see what we have
SELECT 
    tema_id, 
    tema_nombre, 
    COUNT(*) as records
FROM taller_progreso_temas 
WHERE actividad_id = 48
GROUP BY tema_id, tema_nombre
ORDER BY tema_id;

-- Check current theme IDs in taller_detalles
SELECT id, nombre 
FROM taller_detalles 
WHERE actividad_id = 48
ORDER BY id;

-- Update theme ID 2 to 16 (Flexibilidad y Movilidad)
UPDATE taller_progreso_temas
SET tema_id = 16
WHERE actividad_id = 48 
  AND tema_id = 2
  AND tema_nombre = 'Flexibilidad y Movilidad';

-- Update theme ID 3 to 17 (Meditación y Relajación)  
UPDATE taller_progreso_temas
SET tema_id = 17
WHERE actividad_id = 48
  AND tema_id = 3
  AND tema_nombre = 'Meditación y Relajación';

-- Verify the update
SELECT 
    tema_id, 
    tema_nombre, 
    fecha_seleccionada,
    confirmo_asistencia,
    asistio
FROM taller_progreso_temas 
WHERE actividad_id = 48
ORDER BY tema_id;
