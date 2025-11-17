-- Script para agregar campos de consultas a la tabla coaches
-- Ejecutar este script en el SQL Editor de Supabase

-- Agregar campos de consultas a la tabla coaches
ALTER TABLE coaches 
ADD COLUMN IF NOT EXISTS cafe INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS meet_1 INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS meet_30 INTEGER DEFAULT 0;

-- Verificar que se agregaron correctamente
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'coaches' 
AND column_name IN ('cafe', 'meet_1', 'meet_30');

-- Insertar datos de ejemplo para el coach existente
UPDATE coaches 
SET cafe = 15, meet_1 = 60, meet_30 = 30 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'f.pomati@usal.edu.ar');

-- Verificar los datos
SELECT id, user_id, cafe, meet_1, meet_30 
FROM coaches 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'f.pomati@usal.edu.ar');
