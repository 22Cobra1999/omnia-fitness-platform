-- Verificar si la columna vimeo_id ya existe en la tabla activities
DO $$
BEGIN
    -- Verificar si la columna existe
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'activities'
        AND column_name = 'vimeo_id'
    ) THEN
        -- Añadir la columna vimeo_id
        ALTER TABLE activities ADD COLUMN vimeo_id TEXT;
        
        -- Comentario para la columna
        COMMENT ON COLUMN activities.vimeo_id IS 'ID de Vimeo para el video de presentación';
    END IF;
END $$;

-- Crear un índice para mejorar el rendimiento de las búsquedas por vimeo_id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_indexes
        WHERE tablename = 'activities'
        AND indexname = 'idx_activities_vimeo_id'
    ) THEN
        CREATE INDEX idx_activities_vimeo_id ON activities(vimeo_id);
    END IF;
END $$;

-- Actualizar las políticas de seguridad para permitir acceso a la nueva columna
DO $$
BEGIN
    -- Actualizar la política de lectura para incluir vimeo_id
    IF EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE tablename = 'activities'
        AND policyname = 'Enable read access for all users'
    ) THEN
        DROP POLICY "Enable read access for all users" ON activities;
        
        CREATE POLICY "Enable read access for all users"
        ON activities FOR SELECT
        USING (true);
    END IF;
    
    -- Actualizar la política de escritura para incluir vimeo_id
    IF EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE tablename = 'activities'
        AND policyname = 'Enable insert for authenticated users only'
    ) THEN
        DROP POLICY "Enable insert for authenticated users only" ON activities;
        
        CREATE POLICY "Enable insert for authenticated users only"
        ON activities FOR INSERT
        WITH CHECK (auth.uid() = coach_id);
    END IF;
    
    -- Actualizar la política de actualización para incluir vimeo_id
    IF EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE tablename = 'activities'
        AND policyname = 'Enable update for coaches on their own activities'
    ) THEN
        DROP POLICY "Enable update for coaches on their own activities" ON activities;
        
        CREATE POLICY "Enable update for coaches on their own activities"
        ON activities FOR UPDATE
        USING (auth.uid() = coach_id)
        WITH CHECK (auth.uid() = coach_id);
    END IF;
END $$;
