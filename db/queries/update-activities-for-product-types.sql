-- Agregar nuevos campos a la tabla de actividades para soportar diferentes tipos de productos

-- Verificar si los campos ya existen antes de agregarlos
DO $$
BEGIN
    -- Campos para PDF
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'activities' AND column_name = 'pdf_url') THEN
        ALTER TABLE activities ADD COLUMN pdf_url TEXT;
    END IF;
    
    -- Campos para Video
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'activities' AND column_name = 'video_url') THEN
        ALTER TABLE activities ADD COLUMN video_url TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'activities' AND column_name = 'interactive_pauses') THEN
        ALTER TABLE activities ADD COLUMN interactive_pauses JSONB;
    END IF;
    
    -- Campos para Taller
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'activities' AND column_name = 'session_type') THEN
        ALTER TABLE activities ADD COLUMN session_type TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'activities' AND column_name = 'available_slots') THEN
        ALTER TABLE activities ADD COLUMN available_slots INTEGER;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'activities' AND column_name = 'available_times') THEN
        ALTER TABLE activities ADD COLUMN available_times JSONB;
    END IF;
END $$;

-- Actualizar los tipos de productos existentes
UPDATE activities 
SET type = 'pdf' 
WHERE type = 'ebook' OR type = 'document';

-- Establecer valores por defecto para campos requeridos
UPDATE activities 
SET availability_type = 'check_availability' 
WHERE availability_type IS NULL OR availability_type = '';

-- Crear índices para mejorar el rendimiento de búsqueda
CREATE INDEX IF NOT EXISTS idx_activities_type ON activities(type);
CREATE INDEX IF NOT EXISTS idx_activities_availability_type ON activities(availability_type);
