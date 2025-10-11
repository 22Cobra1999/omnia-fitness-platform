-- Script para corregir la columna activity_level en la tabla clients
-- Ejecutar este script en el SQL Editor de Supabase

-- Paso 1: Eliminar la columna problemática
ALTER TABLE clients DROP COLUMN IF EXISTS activity_level;

-- Paso 2: Crear nueva columna con valores en español
ALTER TABLE clients 
ADD COLUMN nivel_actividad TEXT 
CHECK (nivel_actividad IN ('Principiante', 'Intermedio', 'Avanzado', 'Experto'));

-- Paso 3: Verificar la nueva estructura
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'clients' 
ORDER BY ordinal_position;

-- Paso 4: Probar inserción de valor válido (opcional)
-- UPDATE clients 
-- SET nivel_actividad = 'Principiante' 
-- WHERE id = '00dedc23-0b17-4e50-b84e-b2e8100dc93c';

















































