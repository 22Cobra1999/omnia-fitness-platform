-- Agregar columna workshop_mode a la tabla activities
-- Esta columna indica si el taller es individual (1:1) o grupal

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'activities' 
        AND column_name = 'workshop_mode'
    ) THEN
        ALTER TABLE activities 
        ADD COLUMN workshop_mode TEXT 
        DEFAULT 'grupal'
        CHECK (workshop_mode IN ('individual', 'grupal'));
        
        COMMENT ON COLUMN activities.workshop_mode IS 'Modo del taller: individual (1:1) o grupal';
        
        -- Establecer valor por defecto para talleres existentes
        UPDATE activities 
        SET workshop_mode = 'grupal' 
        WHERE type = 'workshop' AND workshop_mode IS NULL;
        
        RAISE NOTICE '✅ Columna workshop_mode agregada a activities';
    ELSE
        RAISE NOTICE '⚠️ Columna workshop_mode ya existe en activities';
    END IF;
END $$;

-- Agregar columna participants_per_class si no existe (para talleres grupales)
-- Esta columna indica cuántas personas por clase cuando es grupal
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'activities' 
        AND column_name = 'participants_per_class'
    ) THEN
        ALTER TABLE activities 
        ADD COLUMN participants_per_class INTEGER;
        
        COMMENT ON COLUMN activities.participants_per_class IS 'Cantidad de personas por clase (solo para talleres grupales)';
        
        RAISE NOTICE '✅ Columna participants_per_class agregada a activities';
    ELSE
        RAISE NOTICE '⚠️ Columna participants_per_class ya existe en activities';
    END IF;
END $$;

-- Crear índice para mejorar búsquedas por modo de taller
CREATE INDEX IF NOT EXISTS idx_activities_workshop_mode 
ON activities(workshop_mode) 
WHERE type = 'workshop';


