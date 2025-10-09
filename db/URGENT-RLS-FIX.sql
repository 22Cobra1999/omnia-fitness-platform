-- 🚨 URGENTE: Script para corregir RLS y hacer el sistema funcional
-- Ejecutar en Supabase SQL Editor

-- 1. Verificar estado actual
SELECT 
    COUNT(*) as total_ejercicios,
    COUNT(CASE WHEN activity_id = 59 THEN 1 END) as ejercicios_actividad_59
FROM ejercicios_detalles;

-- 2. Deshabilitar RLS temporalmente
ALTER TABLE ejercicios_detalles DISABLE ROW LEVEL SECURITY;

-- 3. Verificar que ahora se pueden leer
SELECT 
    COUNT(*) as ejercicios_visibles,
    COUNT(CASE WHEN activity_id = 59 THEN 1 END) as ejercicios_actividad_59_visibles
FROM ejercicios_detalles;

-- 4. Mostrar algunos ejercicios
SELECT 
    id,
    nombre_ejercicio,
    tipo,
    semana,
    dia,
    activity_id
FROM ejercicios_detalles 
WHERE activity_id = 59
ORDER BY id
LIMIT 10;

-- 5. Rehabilitar RLS
ALTER TABLE ejercicios_detalles ENABLE ROW LEVEL SECURITY;

-- 6. Eliminar todas las políticas existentes
DROP POLICY IF EXISTS "ejercicios_detalles_select_all" ON ejercicios_detalles;
DROP POLICY IF EXISTS "ejercicios_detalles_insert_all" ON ejercicios_detalles;
DROP POLICY IF EXISTS "ejercicios_detalles_update_all" ON ejercicios_detalles;
DROP POLICY IF EXISTS "ejercicios_detalles_delete_all" ON ejercicios_detalles;

-- 7. Crear políticas muy permisivas (TO public)
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

-- 8. Verificar políticas creadas
SELECT 
    policyname,
    cmd,
    roles,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'ejercicios_detalles'
ORDER BY cmd, policyname;

-- 9. Verificar que ahora se pueden leer ejercicios
SELECT 
    COUNT(*) as ejercicios_accesibles
FROM ejercicios_detalles 
WHERE activity_id = 59;

-- 10. Mostrar ejercicios finales
SELECT 
    id,
    nombre_ejercicio,
    tipo,
    semana,
    dia
FROM ejercicios_detalles 
WHERE activity_id = 59
ORDER BY id
LIMIT 5;






































