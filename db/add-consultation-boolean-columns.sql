-- Script para agregar columnas booleanas de consultas a la tabla coaches
-- Ejecutar este script en el SQL Editor de Supabase

-- Agregar columnas booleanas para habilitar/deshabilitar consultas
ALTER TABLE coaches 
ADD COLUMN IF NOT EXISTS cafe_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS meet_1_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS meet_30_enabled BOOLEAN DEFAULT FALSE;

-- Verificar que se agregaron correctamente
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'coaches' 
AND column_name IN ('cafe_enabled', 'meet_1_enabled', 'meet_30_enabled');

-- Habilitar consultas para el coach existente y establecer precios
UPDATE coaches 
SET 
    cafe_enabled = TRUE,
    meet_1_enabled = TRUE,
    meet_30_enabled = TRUE,
    cafe = 15, 
    meet_1 = 60, 
    meet_30 = 30 
WHERE id = (SELECT id FROM auth.users WHERE email = 'f.pomati@usal.edu.ar');

-- Verificar los datos
SELECT id, cafe_enabled, meet_1_enabled, meet_30_enabled, cafe, meet_1, meet_30 
FROM coaches 
WHERE id = (SELECT id FROM auth.users WHERE email = 'f.pomati@usal.edu.ar');

