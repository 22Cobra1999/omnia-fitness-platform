-- Script para agregar la columna intensidad a ejercicios_detalles
-- Ejecutar en Supabase SQL Editor

-- 1. Agregar la columna intensidad si no existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ejercicios_detalles' AND column_name='intensidad') THEN
        ALTER TABLE ejercicios_detalles ADD COLUMN intensidad TEXT DEFAULT 'Principiante';
        RAISE NOTICE 'Columna intensidad agregada a ejercicios_detalles.';
    ELSE
        RAISE NOTICE 'Columna intensidad ya existe en ejercicios_detalles.';
    END IF;
END $$;

-- 2. Agregar constraint para intensidad válida
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.check_constraints WHERE constraint_name = 'valid_intensidad_ejercicios') THEN
        ALTER TABLE ejercicios_detalles ADD CONSTRAINT valid_intensidad_ejercicios 
        CHECK (intensidad IN ('Bajo', 'Medio', 'Alto', 'Principiante', 'Intermedio', 'Avanzado'));
        RAISE NOTICE 'Constraint valid_intensidad_ejercicios agregado.';
    ELSE
        RAISE NOTICE 'Constraint valid_intensidad_ejercicios ya existe.';
    END IF;
END $$;

-- 3. Actualizar intensidad para ejercicios existentes
UPDATE ejercicios_detalles 
SET intensidad = 'Principiante' 
WHERE intensidad IS NULL OR intensidad = '';

-- 4. Verificar resultado
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

-- 5. Verificar datos
SELECT 
    id,
    nombre_ejercicio,
    intensidad,
    calorias
FROM ejercicios_detalles 
WHERE activity_id = 59
LIMIT 5;







































