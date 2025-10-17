-- =====================================================
-- MIGRACIÓN: Soporte para Bunny.net Video Streaming
-- =====================================================
-- Este script agrega columnas necesarias para soportar
-- videos alojados en Bunny.net junto con Supabase Storage

-- =====================================================
-- 1. AGREGAR COLUMNAS A ejercicios_detalles
-- =====================================================

DO $$
BEGIN
    -- Agregar bunny_video_id (GUID del video en Bunny Stream)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ejercicios_detalles' 
        AND column_name = 'bunny_video_id'
    ) THEN
        ALTER TABLE ejercicios_detalles 
        ADD COLUMN bunny_video_id TEXT;
        RAISE NOTICE 'Columna bunny_video_id agregada a ejercicios_detalles';
    END IF;

    -- Agregar storage_provider para identificar dónde está alojado el video
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ejercicios_detalles' 
        AND column_name = 'storage_provider'
    ) THEN
        ALTER TABLE ejercicios_detalles 
        ADD COLUMN storage_provider TEXT DEFAULT 'supabase';
        RAISE NOTICE 'Columna storage_provider agregada a ejercicios_detalles';
    END IF;

    -- Agregar bunny_library_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ejercicios_detalles' 
        AND column_name = 'bunny_library_id'
    ) THEN
        ALTER TABLE ejercicios_detalles 
        ADD COLUMN bunny_library_id INTEGER;
        RAISE NOTICE 'Columna bunny_library_id agregada a ejercicios_detalles';
    END IF;

    -- Agregar video_duration (duración en segundos)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ejercicios_detalles' 
        AND column_name = 'video_duration'
    ) THEN
        ALTER TABLE ejercicios_detalles 
        ADD COLUMN video_duration INTEGER;
        RAISE NOTICE 'Columna video_duration agregada a ejercicios_detalles';
    END IF;

    -- Agregar video_thumbnail_url
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ejercicios_detalles' 
        AND column_name = 'video_thumbnail_url'
    ) THEN
        ALTER TABLE ejercicios_detalles 
        ADD COLUMN video_thumbnail_url TEXT;
        RAISE NOTICE 'Columna video_thumbnail_url agregada a ejercicios_detalles';
    END IF;
END $$;

-- =====================================================
-- 2. AGREGAR COLUMNAS A activities (para video preview)
-- =====================================================

DO $$
BEGIN
    -- Agregar bunny_preview_video_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'activities' 
        AND column_name = 'bunny_preview_video_id'
    ) THEN
        ALTER TABLE activities 
        ADD COLUMN bunny_preview_video_id TEXT;
        RAISE NOTICE 'Columna bunny_preview_video_id agregada a activities';
    END IF;

    -- Agregar preview_storage_provider
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'activities' 
        AND column_name = 'preview_storage_provider'
    ) THEN
        ALTER TABLE activities 
        ADD COLUMN preview_storage_provider TEXT DEFAULT 'supabase';
        RAISE NOTICE 'Columna preview_storage_provider agregada a activities';
    END IF;
END $$;

-- =====================================================
-- 3. CREAR TABLA DE TRACKING DE MIGRACIÓN
-- =====================================================

CREATE TABLE IF NOT EXISTS video_migration_log (
    id SERIAL PRIMARY KEY,
    
    -- Referencias
    table_name TEXT NOT NULL, -- 'ejercicios_detalles', 'activities', etc.
    record_id INTEGER NOT NULL,
    
    -- URLs
    original_url TEXT NOT NULL,
    bunny_url TEXT,
    bunny_video_id TEXT,
    
    -- Estado
    status TEXT NOT NULL DEFAULT 'pending', -- pending, processing, completed, failed
    error_message TEXT,
    
    -- Metadatos
    file_size BIGINT,
    duration_seconds INTEGER,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Constraints
    CONSTRAINT valid_status CHECK (status IN ('pending', 'processing', 'completed', 'failed'))
);

-- Índices para la tabla de migración
CREATE INDEX IF NOT EXISTS idx_video_migration_log_status ON video_migration_log(status);
CREATE INDEX IF NOT EXISTS idx_video_migration_log_table_record ON video_migration_log(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_video_migration_log_created_at ON video_migration_log(created_at);

-- =====================================================
-- 4. CONSTRAINT PARA storage_provider
-- =====================================================

DO $$
BEGIN
    -- Constraint para ejercicios_detalles
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'valid_storage_provider_ejercicios'
    ) THEN
        ALTER TABLE ejercicios_detalles 
        ADD CONSTRAINT valid_storage_provider_ejercicios 
        CHECK (storage_provider IN ('supabase', 'bunny'));
        RAISE NOTICE 'Constraint valid_storage_provider_ejercicios agregado';
    END IF;

    -- Constraint para activities
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'valid_preview_storage_provider'
    ) THEN
        ALTER TABLE activities 
        ADD CONSTRAINT valid_preview_storage_provider 
        CHECK (preview_storage_provider IN ('supabase', 'bunny'));
        RAISE NOTICE 'Constraint valid_preview_storage_provider agregado';
    END IF;
END $$;

-- =====================================================
-- 5. FUNCIÓN HELPER PARA OBTENER URL DE VIDEO
-- =====================================================

CREATE OR REPLACE FUNCTION get_video_url(
    p_video_url TEXT,
    p_bunny_video_id TEXT,
    p_storage_provider TEXT
) RETURNS TEXT AS $$
BEGIN
    -- Si el provider es bunny y hay bunny_video_id, retornar URL de Bunny
    IF p_storage_provider = 'bunny' AND p_bunny_video_id IS NOT NULL THEN
        RETURN 'https://iframe.mediadelivery.net/embed/' || p_bunny_video_id;
    END IF;
    
    -- Caso contrario, retornar video_url (Supabase)
    RETURN p_video_url;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Comentarios
COMMENT ON FUNCTION get_video_url IS 'Retorna la URL correcta del video según el storage provider';
COMMENT ON TABLE video_migration_log IS 'Tracking del proceso de migración de videos de Supabase a Bunny.net';

RAISE NOTICE 'Migración completada: Soporte para Bunny.net agregado exitosamente';









