-- =====================================================
-- Agregar columna is_active a ejercicios_detalles y nutrition_program_details
-- =====================================================
-- Descripción: Permite desactivar ejercicios/platos sin eliminarlos
-- Beneficio: Los clientes que ya compraron conservan sus ejercicios/platos
-- =====================================================

-- =====================================================
-- 1. TABLA: ejercicios_detalles (Fitness)
-- =====================================================

-- Verificar si la columna ya existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'ejercicios_detalles' 
        AND column_name = 'is_active'
    ) THEN
        -- Agregar la columna
        ALTER TABLE ejercicios_detalles 
        ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE;
        
        -- Crear índice para búsquedas rápidas
        CREATE INDEX IF NOT EXISTS idx_ejercicios_detalles_is_active 
        ON ejercicios_detalles(is_active, activity_id);
        
        -- Comentario descriptivo
        COMMENT ON COLUMN ejercicios_detalles.is_active IS 
        'Indica si el ejercicio está activo para nuevas compras. FALSE: visible solo para compradores existentes. TRUE: visible para todos.';
        
        RAISE NOTICE '✅ Columna is_active agregada a ejercicios_detalles';
    ELSE
        RAISE NOTICE '⚠️ Columna is_active ya existe en ejercicios_detalles';
    END IF;
END $$;

-- =====================================================
-- 2. TABLA: nutrition_program_details (Nutrición)
-- =====================================================

-- Verificar si la columna ya existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'nutrition_program_details' 
        AND column_name = 'is_active'
    ) THEN
        -- Agregar la columna
        ALTER TABLE nutrition_program_details 
        ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE;
        
        -- Crear índice para búsquedas rápidas
        CREATE INDEX IF NOT EXISTS idx_nutrition_program_details_is_active 
        ON nutrition_program_details(is_active, activity_id);
        
        -- Comentario descriptivo
        COMMENT ON COLUMN nutrition_program_details.is_active IS 
        'Indica si el plato está activo para nuevas compras. FALSE: visible solo para compradores existentes. TRUE: visible para todos.';
        
        RAISE NOTICE '✅ Columna is_active agregada a nutrition_program_details';
    ELSE
        RAISE NOTICE '⚠️ Columna is_active ya existe en nutrition_program_details';
    END IF;
END $$;

-- =====================================================
-- RESUMEN
-- =====================================================
-- Ambos registros antiguos tendrán is_active = TRUE por defecto
-- Los nuevos registros también tendrán is_active = TRUE por defecto
-- Los coaches podrán cambiar is_active = FALSE para desactivar
-- =====================================================


































