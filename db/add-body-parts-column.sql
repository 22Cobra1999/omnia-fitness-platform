-- Agregar columna body_parts a la tabla fitness_exercises
-- Esta columna permitirá almacenar múltiples partes del cuerpo separadas por punto y coma

ALTER TABLE fitness_exercises 
ADD COLUMN IF NOT EXISTS body_parts TEXT DEFAULT '';

-- Comentario para documentar el uso de la columna
COMMENT ON COLUMN fitness_exercises.body_parts IS 'Partes del cuerpo trabajadas en el ejercicio, separadas por punto y coma (ej: "Pecho;Hombros;Tríceps")';

-- Actualizar ejercicios existentes con valores por defecto si es necesario
-- (Opcional: descomenta las siguientes líneas si quieres actualizar ejercicios existentes)

-- UPDATE fitness_exercises 
-- SET body_parts = 'Cuerpo completo' 
-- WHERE body_parts = '' OR body_parts IS NULL;

-- Verificar que la columna se agregó correctamente
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'fitness_exercises' 
AND column_name = 'body_parts';
