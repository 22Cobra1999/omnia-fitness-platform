-- Script para agregar la columna dificultad a nutrition_program_details
-- Para nutrición usamos "dificultad" en lugar de "intensidad"
-- Ejecutar en Supabase SQL Editor

-- 1. Agregar la columna dificultad si no existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='nutrition_program_details' AND column_name='dificultad') THEN
        ALTER TABLE nutrition_program_details ADD COLUMN dificultad TEXT DEFAULT 'Principiante';
        RAISE NOTICE 'Columna dificultad agregada a nutrition_program_details.';
    ELSE
        RAISE NOTICE 'Columna dificultad ya existe en nutrition_program_details.';
    END IF;
END $$;

-- 2. Agregar constraint para dificultad válida
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.check_constraints WHERE constraint_name = 'valid_dificultad_nutrition') THEN
        ALTER TABLE nutrition_program_details ADD CONSTRAINT valid_dificultad_nutrition 
        CHECK (dificultad IN ('Bajo', 'Medio', 'Alto', 'Principiante', 'Intermedio', 'Avanzado'));
        RAISE NOTICE 'Constraint valid_dificultad_nutrition agregado.';
    ELSE
        RAISE NOTICE 'Constraint valid_dificultad_nutrition ya existe.';
    END IF;
END $$;

-- 3. Actualizar dificultad para platos existentes
UPDATE nutrition_program_details 
SET dificultad = 'Principiante' 
WHERE dificultad IS NULL OR dificultad = '';

-- 4. Crear índice para mejorar consultas
CREATE INDEX IF NOT EXISTS idx_nutrition_program_details_dificultad 
ON nutrition_program_details(dificultad);

-- 5. Agregar comentario a la columna
COMMENT ON COLUMN nutrition_program_details.dificultad IS 
'Dificultad del plato: Bajo, Medio, Alto, Principiante, Intermedio, Avanzado';

-- 6. Verificar resultado
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default 
FROM 
    information_schema.columns 
WHERE 
    table_name = 'nutrition_program_details' 
    AND column_name = 'dificultad';

-- 7. Verificar datos
SELECT 
    id,
    nombre,
    dificultad,
    calorias
FROM nutrition_program_details 
LIMIT 5;


























