-- Agregar columnas capacity y stockQuantity a la tabla activities

-- Agregar capacity column si no existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'activities' AND column_name = 'capacity') THEN
        ALTER TABLE activities ADD COLUMN capacity INTEGER;
        RAISE NOTICE 'Column capacity added to activities table.';
    END IF;
END $$;

-- Agregar stockQuantity column si no existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'activities' AND column_name = 'stockQuantity') THEN
        ALTER TABLE activities ADD COLUMN stockQuantity INTEGER;
        RAISE NOTICE 'Column stockQuantity added to activities table.';
    END IF;
END $$;
