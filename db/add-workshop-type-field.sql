-- Agregar campo workshop_type a la tabla activities
-- Este campo almacena el tipo de taller: presencial, virtual o híbrido

DO $$
BEGIN
    -- Agregar campo workshop_type si no existe
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'activities' 
        AND column_name = 'workshop_type'
    ) THEN
        ALTER TABLE activities 
        ADD COLUMN workshop_type TEXT 
        CHECK (workshop_type IN ('presencial', 'virtual', 'hibrido'));
        
        COMMENT ON COLUMN activities.workshop_type IS 'Tipo de taller: presencial, virtual o híbrido';
    END IF;
    
    -- Agregar campo workshop_schedule_blocks para almacenar los bloques de horarios
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'activities' 
        AND column_name = 'workshop_schedule_blocks'
    ) THEN
        ALTER TABLE activities 
        ADD COLUMN workshop_schedule_blocks JSONB;
        
        COMMENT ON COLUMN activities.workshop_schedule_blocks IS 'Bloques de horarios configurados para el taller (TimeBlocks del WorkshopScheduleManager)';
    END IF;
    
END $$;

-- Crear índice para mejorar búsquedas por tipo de workshop
CREATE INDEX IF NOT EXISTS idx_activities_workshop_type 
ON activities(workshop_type) 
WHERE type = 'workshop';





