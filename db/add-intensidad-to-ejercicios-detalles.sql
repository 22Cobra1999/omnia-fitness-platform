-- Script para agregar columna intensidad a ejercicios_detalles
-- ANTES de eliminar detalle_series

-- 1. Verificar estructura actual
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default 
FROM 
    information_schema.columns 
WHERE 
    table_name = 'ejercicios_detalles' 
ORDER BY 
    ordinal_position;

-- 2. Agregar columna intensidad a ejercicios_detalles
ALTER TABLE ejercicios_detalles 
ADD COLUMN IF NOT EXISTS intensidad TEXT DEFAULT 'Principiante';

-- 3. Agregar constraint para intensidad válida
ALTER TABLE ejercicios_detalles 
ADD CONSTRAINT IF NOT EXISTS valid_intensidad_ejercicios 
CHECK (intensidad IN ('Bajo', 'Medio', 'Alto', 'Principiante', 'Intermedio', 'Avanzado'));

-- 4. Actualizar intensidad basada en detalle_series existente
-- Asumimos que los ejercicios existentes son de intensidad "Principiante"
UPDATE ejercicios_detalles 
SET intensidad = 'Principiante'
WHERE intensidad IS NULL OR intensidad = 'Principiante';

-- 5. Verificar que se agregó correctamente
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default 
FROM 
    information_schema.columns 
WHERE 
    table_name = 'ejercicios_detalles' 
    AND column_name = 'intensidad';

-- 6. Mostrar ejemplo de datos con la nueva columna
SELECT 
    id,
    nombre_ejercicio,
    tipo,
    calorias,
    intensidad,
    detalle_series
FROM ejercicios_detalles
WHERE activity_id = 59
LIMIT 5;

-- 7. Verificar que todos los ejercicios tienen intensidad
SELECT 
    'VERIFICACION INTENSIDAD' as seccion,
    COUNT(*) as total_ejercicios,
    COUNT(CASE WHEN intensidad IS NOT NULL THEN 1 END) as con_intensidad,
    COUNT(CASE WHEN intensidad IS NULL THEN 1 END) as sin_intensidad
FROM ejercicios_detalles
WHERE activity_id = 59;







































