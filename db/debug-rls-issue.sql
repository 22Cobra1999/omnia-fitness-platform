-- Script para debuggear el problema de RLS

-- 1. Verificar que los ejercicios existen
SELECT 
    COUNT(*) as total_ejercicios,
    COUNT(CASE WHEN activity_id = 59 THEN 1 END) as ejercicios_actividad_59
FROM ejercicios_detalles;

-- 2. Verificar políticas RLS actuales
SELECT 
    policyname,
    cmd,
    roles,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'ejercicios_detalles'
ORDER BY cmd, policyname;

-- 3. Verificar si RLS está habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'ejercicios_detalles';

-- 4. Crear función para probar políticas
CREATE OR REPLACE FUNCTION test_exercises_access()
RETURNS TABLE(
    exercise_id INTEGER,
    nombre_ejercicio TEXT,
    tipo TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ed.id,
        ed.nombre_ejercicio,
        ed.tipo
    FROM ejercicios_detalles ed
    WHERE ed.activity_id = 59
    LIMIT 5;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Probar la función
SELECT * FROM test_exercises_access();

-- 6. Deshabilitar RLS temporalmente para pruebas
ALTER TABLE ejercicios_detalles DISABLE ROW LEVEL SECURITY;

-- 7. Verificar que ahora se pueden leer
SELECT 
    COUNT(*) as ejercicios_visibles
FROM ejercicios_detalles 
WHERE activity_id = 59;

-- 8. Mostrar algunos ejercicios
SELECT 
    id,
    nombre_ejercicio,
    tipo,
    semana,
    dia
FROM ejercicios_detalles 
WHERE activity_id = 59
ORDER BY id
LIMIT 10;

-- 9. Rehabilitar RLS con políticas más permisivas
ALTER TABLE ejercicios_detalles ENABLE ROW LEVEL SECURITY;

-- Eliminar todas las políticas existentes
DROP POLICY IF EXISTS "ejercicios_detalles_select_all" ON ejercicios_detalles;
DROP POLICY IF EXISTS "ejercicios_detalles_insert_all" ON ejercicios_detalles;
DROP POLICY IF EXISTS "ejercicios_detalles_update_all" ON ejercicios_detalles;
DROP POLICY IF EXISTS "ejercicios_detalles_delete_all" ON ejercicios_detalles;

-- Crear políticas muy permisivas
CREATE POLICY "ejercicios_detalles_select_all"
ON ejercicios_detalles FOR SELECT 
TO public 
USING (true);

CREATE POLICY "ejercicios_detalles_insert_all"
ON ejercicios_detalles FOR INSERT 
TO public 
WITH CHECK (true);

CREATE POLICY "ejercicios_detalles_update_all"
ON ejercicios_detalles FOR UPDATE 
TO public 
USING (true) 
WITH CHECK (true);

CREATE POLICY "ejercicios_detalles_delete_all"
ON ejercicios_detalles FOR DELETE 
TO public 
USING (true);

-- 10. Verificar políticas finales
SELECT 
    policyname,
    cmd,
    roles,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'ejercicios_detalles'
ORDER BY cmd, policyname;

-- 11. Probar acceso final
SELECT 
    COUNT(*) as ejercicios_accesibles
FROM ejercicios_detalles 
WHERE activity_id = 59;
































