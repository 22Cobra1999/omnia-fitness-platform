-- ================================================
-- AGREGAR COLUMNA 'pdf_url' A taller_detalles
-- ================================================
-- Esta columna permite adjuntar un PDF específico por tema
-- Si es NULL, se usa el PDF general del taller (activities.pdf_url o activity_media.pdf_url)

-- PASO 1: Agregar columna 'pdf_url' a taller_detalles
-- ================================================
DO $$ 
BEGIN
    -- Agregar columna 'pdf_url' si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'taller_detalles' 
        AND column_name = 'pdf_url'
    ) THEN
        ALTER TABLE taller_detalles 
        ADD COLUMN pdf_url TEXT;
        
        COMMENT ON COLUMN taller_detalles.pdf_url IS 
        'URL del PDF específico para este tema. Si es NULL, se usa el PDF general del taller.';
        
        RAISE NOTICE '✅ Columna pdf_url agregada a taller_detalles';
    ELSE
        RAISE NOTICE 'ℹ️ Columna pdf_url ya existe en taller_detalles';
    END IF;
END $$;

-- PASO 2: Agregar columna 'pdf_file_name' para el nombre del archivo
-- ================================================
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'taller_detalles' 
        AND column_name = 'pdf_file_name'
    ) THEN
        ALTER TABLE taller_detalles 
        ADD COLUMN pdf_file_name TEXT;
        
        COMMENT ON COLUMN taller_detalles.pdf_file_name IS 
        'Nombre del archivo PDF para este tema.';
        
        RAISE NOTICE '✅ Columna pdf_file_name agregada a taller_detalles';
    ELSE
        RAISE NOTICE 'ℹ️ Columna pdf_file_name ya existe en taller_detalles';
    END IF;
END $$;

-- PASO 3: Verificar estructura final
-- ================================================
SELECT 
    'ESTRUCTURA taller_detalles (columnas PDF)' AS seccion,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'taller_detalles'
AND column_name IN ('pdf_url', 'pdf_file_name')
ORDER BY column_name;

