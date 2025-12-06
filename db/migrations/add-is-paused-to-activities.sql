-- Agregar campo is_paused a la tabla activities para pausar productos
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'activities' 
        AND column_name = 'is_paused'
    ) THEN
        ALTER TABLE activities 
        ADD COLUMN is_paused BOOLEAN NOT NULL DEFAULT FALSE;
        
        COMMENT ON COLUMN activities.is_paused IS 'Indica si el producto está pausado (no disponible para compra)';
        
        RAISE NOTICE '✅ Columna is_paused agregada a activities';
    ELSE
        RAISE NOTICE '⚠️ Columna is_paused ya existe en activities';
    END IF;
END $$;

-- Crear índice para mejorar búsquedas de productos pausados
CREATE INDEX IF NOT EXISTS idx_activities_is_paused 
ON activities(is_paused, coach_id) 
WHERE is_paused = TRUE;

-- Actualizar productos existentes (todos activos por defecto)
UPDATE activities 
SET is_paused = FALSE 
WHERE is_paused IS NULL;


































