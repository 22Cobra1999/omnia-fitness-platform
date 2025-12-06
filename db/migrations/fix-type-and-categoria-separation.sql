-- Migración para separar correctamente type y categoria
-- type solo debe tener: 'workshop', 'program', o 'document'
-- categoria solo debe tener: 'fitness' o 'nutricion'

-- 1. Actualizar registros que tienen 'nutrition_program' en type
--    Estos deberían tener type='program' y categoria='nutricion'
UPDATE activities 
SET 
  type = 'program',
  categoria = 'nutricion'
WHERE type = 'nutrition_program' OR type = 'nutrition';

-- 2. Actualizar registros que tienen 'fitness_program' en type
--    Estos deberían tener type='program' y categoria='fitness'
UPDATE activities 
SET 
  type = 'program',
  categoria = 'fitness'
WHERE type = 'fitness_program' OR type = 'fitness';

-- 3. Asegurar que todos los registros con type='program' tengan una categoria válida
UPDATE activities 
SET categoria = 'fitness'
WHERE type = 'program' AND (categoria IS NULL OR categoria NOT IN ('fitness', 'nutricion'));

-- 4. Asegurar que todos los registros con type='workshop' tengan una categoria válida
UPDATE activities 
SET categoria = 'fitness'
WHERE type = 'workshop' AND (categoria IS NULL OR categoria NOT IN ('fitness', 'nutricion'));

-- 5. Asegurar que todos los registros con type='document' tengan una categoria válida
UPDATE activities 
SET categoria = 'fitness'
WHERE type = 'document' AND (categoria IS NULL OR categoria NOT IN ('fitness', 'nutricion'));

-- Verificar resultados
SELECT 
  type,
  categoria,
  COUNT(*) as cantidad
FROM activities
GROUP BY type, categoria
ORDER BY type, categoria;




