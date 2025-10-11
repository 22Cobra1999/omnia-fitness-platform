-- Script manual para agregar las columnas necesarias
-- Ejecutar en Supabase SQL Editor

-- 1. Agregar columna semana
ALTER TABLE ejercicios_detalles ADD COLUMN IF NOT EXISTS semana INTEGER;

-- 2. Agregar columna dia
ALTER TABLE ejercicios_detalles ADD COLUMN IF NOT EXISTS dia INTEGER;

-- 3. Agregar columna periodo
ALTER TABLE ejercicios_detalles ADD COLUMN IF NOT EXISTS periodo INTEGER DEFAULT 1;

-- 4. Agregar columna bloque
ALTER TABLE ejercicios_detalles ADD COLUMN IF NOT EXISTS bloque INTEGER DEFAULT 1;

-- 5. Agregar columna orden
ALTER TABLE ejercicios_detalles ADD COLUMN IF NOT EXISTS orden INTEGER;

-- 6. Verificar que las columnas se agregaron
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default 
FROM 
    information_schema.columns 
WHERE 
    table_name = 'ejercicios_detalles' 
    AND column_name IN ('semana', 'dia', 'periodo', 'bloque', 'orden')
ORDER BY 
    ordinal_position;








































