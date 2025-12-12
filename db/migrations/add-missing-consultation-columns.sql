-- Script para agregar las columnas faltantes de consultas a la tabla coaches
-- Ejecutar este script en el SQL Editor de Supabase

-- Agregar columnas para meet_1 (60 min - Sesión profunda)
ALTER TABLE coaches 
ADD COLUMN IF NOT EXISTS meet_1 INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS meet_1_enabled BOOLEAN DEFAULT FALSE;

-- Agregar columnas para meet_30 (30 min - Consulta puntual)
ALTER TABLE coaches 
ADD COLUMN IF NOT EXISTS meet_30 INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS meet_30_enabled BOOLEAN DEFAULT FALSE;

-- Verificar que se agregaron correctamente
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'coaches' 
AND column_name IN ('cafe', 'cafe_enabled', 'meet_1', 'meet_1_enabled', 'meet_30', 'meet_30_enabled')
ORDER BY column_name;

