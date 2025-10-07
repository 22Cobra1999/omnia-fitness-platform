-- Script para agregar columnas faltantes a ejecuciones_ejercicio
-- EJECUTAR EN SUPABASE SQL EDITOR

-- 1. Agregar columna bloque
ALTER TABLE ejecuciones_ejercicio 
ADD COLUMN IF NOT EXISTS bloque INTEGER;

-- 2. Agregar columna orden  
ALTER TABLE ejecuciones_ejercicio 
ADD COLUMN IF NOT EXISTS orden INTEGER;

-- 3. Agregar comentarios a las columnas
COMMENT ON COLUMN ejecuciones_ejercicio.bloque IS 'Número de bloque del ejercicio en el día (1, 2, 3, 4)';
COMMENT ON COLUMN ejecuciones_ejercicio.orden IS 'Orden del ejercicio dentro del bloque';

-- 4. Verificar que las columnas se agregaron correctamente
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'ejecuciones_ejercicio' 
  AND column_name IN ('bloque', 'orden', 'dia_semana', 'fecha_ejercicio')
ORDER BY column_name;

-- 5. Mostrar estructura completa de la tabla
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'ejecuciones_ejercicio' 
ORDER BY ordinal_position;
