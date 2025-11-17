-- Verificar si existen políticas para la tabla activities
DO $$
DECLARE
    policy_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO policy_count FROM pg_policies WHERE tablename = 'activities';
    
    IF policy_count = 0 THEN
        -- Crear políticas si no existen
        -- Política para seleccionar: todos pueden ver actividades públicas
        EXECUTE 'CREATE POLICY "Actividades públicas visibles para todos" ON activities FOR SELECT USING (visibility = ''Public'' OR visibility = ''Subscribers only'')';
        
        -- Política para seleccionar: coaches pueden ver sus propias actividades
        EXECUTE 'CREATE POLICY "Coaches pueden ver sus actividades" ON activities FOR SELECT USING (coach_id = auth.uid())';
        
        -- Política para insertar: solo coaches pueden crear actividades
        EXECUTE 'CREATE POLICY "Coaches pueden crear actividades" ON activities FOR INSERT WITH CHECK (coach_id = auth.uid())';
        
        -- Política para actualizar: coaches solo pueden actualizar sus propias actividades
        EXECUTE 'CREATE POLICY "Coaches pueden actualizar sus actividades" ON activities FOR UPDATE USING (coach_id = auth.uid())';
        
        -- Política para eliminar: coaches solo pueden eliminar sus propias actividades
        EXECUTE 'CREATE POLICY "Coaches pueden eliminar sus actividades" ON activities FOR DELETE USING (coach_id = auth.uid())';
        
        RAISE NOTICE 'Políticas para la tabla activities creadas correctamente';
    ELSE
        RAISE NOTICE 'Las políticas para la tabla activities ya existen';
    END IF;
END $$;

-- Asegurarse de que RLS está habilitado para la tabla activities
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- Verificar la estructura de la tabla activities
DO $$
BEGIN
    -- Verificar si la columna updated_at existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'activities' AND column_name = 'updated_at'
    ) THEN
        -- Agregar columna updated_at si no existe
        ALTER TABLE activities ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now();
        RAISE NOTICE 'Columna updated_at agregada a la tabla activities';
    END IF;
END $$;
