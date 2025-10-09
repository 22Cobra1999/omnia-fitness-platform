-- Script para agregar la política SELECT faltante

-- 1. Verificar políticas actuales
SELECT 
    policyname,
    cmd,
    roles,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'ejercicios_detalles'
ORDER BY cmd, policyname;

-- 2. Agregar política SELECT faltante
CREATE POLICY "ejercicios_detalles_select_all"
ON ejercicios_detalles FOR SELECT 
TO authenticated 
USING (true);

-- 3. Verificar políticas finales
SELECT 
    policyname,
    cmd,
    roles,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'ejercicios_detalles'
ORDER BY cmd, policyname;

-- 4. Probar lectura de ejercicios
SELECT 
    COUNT(*) as total_ejercicios,
    COUNT(CASE WHEN tipo = 'descanso' THEN 1 END) as ejercicios_descanso,
    COUNT(CASE WHEN tipo = 'fuerza' THEN 1 END) as ejercicios_fuerza,
    COUNT(CASE WHEN tipo = 'cardio' THEN 1 END) as ejercicios_cardio
FROM ejercicios_detalles 
WHERE activity_id = 59;

-- 5. Mostrar algunos ejercicios de ejemplo
SELECT 
    id,
    nombre_ejercicio,
    tipo,
    semana,
    dia
FROM ejercicios_detalles 
WHERE activity_id = 59
ORDER BY semana, dia
LIMIT 10;





































