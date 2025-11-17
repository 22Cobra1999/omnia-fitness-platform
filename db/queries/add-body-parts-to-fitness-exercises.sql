-- Agregar columna body_parts a la tabla fitness_exercises
-- Esta columna permitirá almacenar múltiples partes del cuerpo separadas por punto y coma

-- Verificar si la tabla fitness_exercises existe
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'fitness_exercises') THEN
        -- Agregar la columna si no existe
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'fitness_exercises' 
            AND column_name = 'body_parts'
        ) THEN
            ALTER TABLE fitness_exercises 
            ADD COLUMN body_parts TEXT DEFAULT '';
            
            -- Comentario para documentar el uso de la columna
            COMMENT ON COLUMN fitness_exercises.body_parts IS 'Partes del cuerpo trabajadas en el ejercicio, separadas por punto y coma (ej: "Pecho;Hombros;Tríceps")';
            
            RAISE NOTICE 'Columna body_parts agregada exitosamente a fitness_exercises';
        ELSE
            RAISE NOTICE 'La columna body_parts ya existe en fitness_exercises';
        END IF;
    ELSE
        RAISE NOTICE 'La tabla fitness_exercises no existe';
    END IF;
END $$;

-- Verificar que la columna se agregó correctamente
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'fitness_exercises' 
AND column_name = 'body_parts';

-- Ejemplos de uso de la columna body_parts:
-- INSERT INTO fitness_exercises (..., body_parts) VALUES (..., 'Pecho;Hombros;Tríceps');
-- INSERT INTO fitness_exercises (..., body_parts) VALUES (..., 'Piernas;Glúteos');
-- INSERT INTO fitness_exercises (..., body_parts) VALUES (..., 'Espalda;Bíceps');

-- Query para buscar ejercicios por parte del cuerpo:
-- SELECT * FROM fitness_exercises WHERE body_parts LIKE '%Pecho%';
-- SELECT * FROM fitness_exercises WHERE body_parts LIKE '%Piernas%' OR body_parts LIKE '%Glúteos%';
