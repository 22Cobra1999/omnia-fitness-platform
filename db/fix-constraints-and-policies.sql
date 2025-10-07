-- Script para corregir constraints y políticas de ejercicios_detalles

-- 1. Verificar constraint actual
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'ejercicios_detalles'::regclass 
AND conname = 'valid_tipo';

-- 2. Eliminar constraint restrictivo
ALTER TABLE ejercicios_detalles DROP CONSTRAINT IF EXISTS valid_tipo;

-- 3. Crear constraint más permisivo
ALTER TABLE ejercicios_detalles 
ADD CONSTRAINT valid_tipo 
CHECK (tipo IN ('fuerza', 'cardio', 'descanso', 'flexibilidad', 'equilibrio'));

-- 4. Limpiar políticas conflictivas
DROP POLICY IF EXISTS "Clients can view exercises from their activities" ON ejercicios_detalles;
DROP POLICY IF EXISTS "Coaches can manage their own exercises" ON ejercicios_detalles;
DROP POLICY IF EXISTS "ejercicios_detalles_delete_all" ON ejercicios_detalles;
DROP POLICY IF EXISTS "ejercicios_detalles_insert_all" ON ejercicios_detalles;
DROP POLICY IF EXISTS "ejercicios_detalles_select_all" ON ejercicios_detalles;

-- 5. Crear políticas limpias y consistentes
CREATE POLICY "ejercicios_detalles_select_all"
ON ejercicios_detalles FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "ejercicios_detalles_insert_all"
ON ejercicios_detalles FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "ejercicios_detalles_update_all"
ON ejercicios_detalles FOR UPDATE 
TO authenticated 
USING (true) 
WITH CHECK (true);

CREATE POLICY "ejercicios_detalles_delete_all"
ON ejercicios_detalles FOR DELETE 
TO authenticated 
USING (true);

-- 6. Rehabilitar RLS
ALTER TABLE ejercicios_detalles ENABLE ROW LEVEL SECURITY;

-- 7. Verificar constraint corregido
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'ejercicios_detalles'::regclass 
AND conname = 'valid_tipo';

-- 8. Verificar políticas finales
SELECT 
    policyname,
    cmd,
    roles,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'ejercicios_detalles'
ORDER BY policyname;

-- 9. Verificar RLS habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'ejercicios_detalles';

-- 10. Probar inserción de ejercicio con tipo "descanso"
INSERT INTO ejercicios_detalles (activity_id, nombre_ejercicio, tipo, semana, dia) 
VALUES (59, 'Día de Descanso', 'descanso', 1, 7)
ON CONFLICT DO NOTHING;

-- 11. Verificar inserción
SELECT 
    COUNT(*) as total_ejercicios,
    COUNT(CASE WHEN tipo = 'descanso' THEN 1 END) as ejercicios_descanso
FROM ejercicios_detalles 
WHERE activity_id = 59;
































