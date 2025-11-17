-- =====================================================
-- MIGRACIÓN: Agregar Bunny.net a activity_media
-- =====================================================
-- Este script agrega soporte para Bunny.net en la tabla
-- activity_media para videos de actividades

-- =====================================================
-- 1. AGREGAR COLUMNAS A activity_media
-- =====================================================

DO $$
BEGIN
    -- Agregar bunny_video_id (GUID del video en Bunny Stream)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'activity_media' 
        AND column_name = 'bunny_video_id'
    ) THEN
        ALTER TABLE activity_media 
        ADD COLUMN bunny_video_id TEXT;
        RAISE NOTICE 'Columna bunny_video_id agregada a activity_media';
    END IF;

    -- Agregar storage_provider para identificar dónde está alojado el video
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'activity_media' 
        AND column_name = 'storage_provider'
    ) THEN
        ALTER TABLE activity_media 
        ADD COLUMN storage_provider TEXT DEFAULT 'supabase';
        RAISE NOTICE 'Columna storage_provider agregada a activity_media';
    END IF;

    -- Agregar bunny_library_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'activity_media' 
        AND column_name = 'bunny_library_id'
    ) THEN
        ALTER TABLE activity_media 
        ADD COLUMN bunny_library_id INTEGER;
        RAISE NOTICE 'Columna bunny_library_id agregada a activity_media';
    END IF;

    -- Agregar video_duration (duración en segundos)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'activity_media' 
        AND column_name = 'video_duration'
    ) THEN
        ALTER TABLE activity_media 
        ADD COLUMN video_duration INTEGER;
        RAISE NOTICE 'Columna video_duration agregada a activity_media';
    END IF;

    -- Agregar video_thumbnail_url
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'activity_media' 
        AND column_name = 'video_thumbnail_url'
    ) THEN
        ALTER TABLE activity_media 
        ADD COLUMN video_thumbnail_url TEXT;
        RAISE NOTICE 'Columna video_thumbnail_url agregada a activity_media';
    END IF;

    -- Actualizar valores existentes para storage_provider
    -- Si video_url existe y bunny_video_id es nulo, asumimos que es Supabase
    UPDATE activity_media
    SET storage_provider = 'supabase'
    WHERE video_url IS NOT NULL AND bunny_video_id IS NULL AND storage_provider IS NULL;

    RAISE NOTICE 'Migración de columnas para Bunny.net completada en activity_media.';
END;
$$;

-- =====================================================
-- 2. CREAR ÍNDICES PARA MEJOR RENDIMIENTO
-- =====================================================

-- Índice para bunny_video_id en activity_media
DROP INDEX IF EXISTS idx_activity_media_bunny_video_id;
CREATE INDEX idx_activity_media_bunny_video_id ON activity_media(bunny_video_id)
WHERE bunny_video_id IS NOT NULL;

-- Índice para storage_provider en activity_media
DROP INDEX IF EXISTS idx_activity_media_storage_provider;
CREATE INDEX idx_activity_media_storage_provider ON activity_media(storage_provider);

-- =====================================================
-- 3. AGREGAR COMENTARIOS A LAS COLUMNAS
-- =====================================================

COMMENT ON COLUMN activity_media.bunny_video_id IS 'GUID del video en Bunny.net Stream';
COMMENT ON COLUMN activity_media.storage_provider IS 'Proveedor de almacenamiento: bunny o supabase';
COMMENT ON COLUMN activity_media.bunny_library_id IS 'ID de la Stream Library en Bunny.net';
COMMENT ON COLUMN activity_media.video_duration IS 'Duración del video en segundos';
COMMENT ON COLUMN activity_media.video_thumbnail_url IS 'URL del thumbnail del video en Bunny.net';
COMMENT ON COLUMN activity_media.video_url IS 'URL del video (puede ser Supabase o Bunny.net Stream URL)';

-- =====================================================
-- 4. NOTA SOBRE video_url
-- =====================================================

-- NOTA: Mantenemos video_url en ambas tablas porque:
-- - En activity_media: es la URL del video de la actividad (puede ser Bunny o Supabase)
-- - En ejercicios_detalles: es la URL del video del ejercicio (puede ser Bunny o Supabase)
-- 
-- Ahora video_url contendrá:
-- - Si storage_provider = 'bunny': URL de streaming HLS de Bunny.net
-- - Si storage_provider = 'supabase': URL de Supabase Storage
--
-- No eliminamos video_url porque es usada extensivamente en el código.
-- Simplemente cambió de contener URLs de Supabase a URLs de Bunny.net

-- =====================================================
-- 5. VERIFICACIÓN
-- =====================================================

-- Verificar que las columnas se agregaron correctamente
DO $$
DECLARE
    col_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO col_count
    FROM information_schema.columns
    WHERE table_name = 'activity_media'
    AND column_name IN ('bunny_video_id', 'storage_provider', 'bunny_library_id', 'video_duration', 'video_thumbnail_url');
    
    IF col_count = 5 THEN
        RAISE NOTICE '✅ Todas las columnas de Bunny.net se agregaron correctamente a activity_media';
    ELSE
        RAISE WARNING '⚠️  Solo % de 5 columnas se agregaron a activity_media', col_count;
    END IF;
END;
$$;

-- Mostrar estructura actualizada de activity_media
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'activity_media'
ORDER BY ordinal_position;





























