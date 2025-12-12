-- Script para agregar TODAS las columnas de consultas faltantes a la tabla coaches
-- Ejecutar este script en el SQL Editor de Supabase

-- Agregar columnas de precios (si no existen)
ALTER TABLE coaches 
ADD COLUMN IF NOT EXISTS cafe INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS meet_1 INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS meet_30 INTEGER DEFAULT 0;

-- Agregar columnas booleanas para habilitar/deshabilitar consultas (si no existen)
ALTER TABLE coaches 
ADD COLUMN IF NOT EXISTS cafe_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS meet_1_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS meet_30_enabled BOOLEAN DEFAULT FALSE;

-- Verificar que todas las columnas se agregaron correctamente
SELECT 
    column_name, 
    data_type, 
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'coaches' 
AND column_name IN ('cafe', 'cafe_enabled', 'meet_1', 'meet_1_enabled', 'meet_30', 'meet_30_enabled')
ORDER BY column_name;

-- Opcional: Establecer valores por defecto para coaches existentes
-- Descomentar si quieres habilitar las consultas para todos los coaches existentes
/*
UPDATE coaches 
SET 
    cafe = COALESCE(cafe, 0),
    meet_1 = COALESCE(meet_1, 0),
    meet_30 = COALESCE(meet_30, 0),
    cafe_enabled = COALESCE(cafe_enabled, FALSE),
    meet_1_enabled = COALESCE(meet_1_enabled, FALSE),
    meet_30_enabled = COALESCE(meet_30_enabled, FALSE)
WHERE cafe IS NULL 
   OR meet_1 IS NULL 
   OR meet_30 IS NULL 
   OR cafe_enabled IS NULL 
   OR meet_1_enabled IS NULL 
   OR meet_30_enabled IS NULL;
*/

