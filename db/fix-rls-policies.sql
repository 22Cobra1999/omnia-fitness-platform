-- Script para corregir políticas RLS en ejercicios_detalles

-- 1. Verificar políticas RLS existentes
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'ejercicios_detalles';

-- 2. Eliminar políticas restrictivas existentes
DROP POLICY IF EXISTS "ejercicios_detalles_policy" ON ejercicios_detalles;
DROP POLICY IF EXISTS "ejercicios_detalles_select_policy" ON ejercicios_detalles;
DROP POLICY IF EXISTS "ejercicios_detalles_insert_policy" ON ejercicios_detalles;
DROP POLICY IF EXISTS "ejercicios_detalles_update_policy" ON ejercicios_detalles;
DROP POLICY IF EXISTS "ejercicios_detalles_delete_policy" ON ejercicios_detalles;

-- 3. Crear políticas más permisivas
-- Política para SELECT: Permitir a todos los usuarios autenticados
CREATE POLICY "ejercicios_detalles_select_all"
ON ejercicios_detalles
FOR SELECT
TO authenticated
USING (true);

-- Política para INSERT: Permitir a todos los usuarios autenticados
CREATE POLICY "ejercicios_detalles_insert_all"
ON ejercicios_detalles
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Política para UPDATE: Permitir a todos los usuarios autenticados
CREATE POLICY "ejercicios_detalles_update_all"
ON ejercicios_detalles
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Política para DELETE: Permitir a todos los usuarios autenticados
CREATE POLICY "ejercicios_detalles_delete_all"
ON ejercicios_detalles
FOR DELETE
TO authenticated
USING (true);

-- 4. Verificar que RLS esté habilitado
ALTER TABLE ejercicios_detalles ENABLE ROW LEVEL SECURITY;

-- 5. Verificar políticas finales
SELECT 
    policyname,
    cmd,
    roles,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'ejercicios_detalles'
ORDER BY policyname;
































