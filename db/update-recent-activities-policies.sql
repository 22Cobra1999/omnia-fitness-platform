-- Verificar si existen políticas para la tabla recent_activities
DO $$
DECLARE
    policy_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO policy_count FROM pg_policies WHERE tablename = 'recent_activities';
    
    IF policy  INTO policy_count FROM pg_policies WHERE tablename = 'recent_activities';
    
    IF policy_count = 0 THEN
        -- Crear políticas si no existen
        -- Política para seleccionar: usuarios pueden ver sus propias actividades
        EXECUTE 'CREATE POLICY "Usuarios pueden ver sus actividades" ON recent_activities FOR SELECT USING (user_id = auth.uid())';
        
        -- Política para insertar: usuarios pueden crear sus propias actividades
        EXECUTE 'CREATE POLICY "Usuarios pueden crear actividades" ON recent_activities FOR INSERT WITH CHECK (user_id = auth.uid())';
        
        -- Política para actualizar: usuarios solo pueden actualizar sus propias actividades
        EXECUTE 'CREATE POLICY "Usuarios pueden actualizar sus actividades" ON recent_activities FOR UPDATE USING (user_id = auth.uid())';
        
        -- Política para eliminar: usuarios solo pueden eliminar sus propias actividades
        EXECUTE 'CREATE POLICY "Usuarios pueden eliminar sus actividades" ON recent_activities FOR DELETE USING (user_id = auth.uid())';
        
        RAISE NOTICE 'Políticas para la tabla recent_activities creadas correctamente';
    ELSE
        RAISE NOTICE 'Las políticas para la tabla recent_activities ya existen';
    END IF;
END $$;

-- Asegurarse de que RLS está habilitado para la tabla recent_activities
ALTER TABLE recent_activities ENABLE ROW LEVEL SECURITY;

-- Verificar la estructura de la tabla recent_activities
DO $$
BEGIN
    -- Verificar si la columna timestamp existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'recent_activities' AND column_name = 'timestamp'
    ) THEN
        -- Agregar columna timestamp si no existe
        ALTER TABLE recent_activities ADD COLUMN timestamp TIMESTAMPTZ DEFAULT now();
        RAISE NOTICE 'Columna timestamp agregada a la tabla recent_activities';
    END IF;
    
    -- Verificar si existen las columnas para variables adicionales
    DECLARE
        columns_to_check TEXT[] := ARRAY['km', 'mins', 'kg', 'reps', 'sets', 'kcal', 'distance', 'duration', 'weight'];
        col TEXT;
    BEGIN
        FOREACH col IN ARRAY columns_to_check
        LOOP
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'recent_activities' AND column_name = col
            ) THEN
                EXECUTE format('ALTER TABLE recent_activities ADD COLUMN %I NUMERIC', col);
                RAISE NOTICE 'Columna % agregada a la tabla recent_activities', col;
            END IF;
        END LOOP;
    END;
END $$;
