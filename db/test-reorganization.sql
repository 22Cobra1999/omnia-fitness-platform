-- Script para probar la reorganización del sistema
-- Verificar que todo funciona correctamente después de la migración

-- 1. Verificar estructura de ejercicios_detalles
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default 
FROM 
    information_schema.columns 
WHERE 
    table_name = 'ejercicios_detalles' 
    AND column_name IN ('semana', 'dia', 'periodo', 'bloque', 'orden', 'intensidad', 'calorias')
ORDER BY 
    ordinal_position;

-- 2. Verificar datos en ejercicios_detalles para actividad 59
SELECT 
    id,
    activity_id,
    nombre_ejercicio,
    semana,
    dia,
    periodo,
    bloque,
    orden,
    intensidad,
    calorias,
    created_at
FROM ejercicios_detalles 
WHERE activity_id = 59
ORDER BY semana, dia, orden
LIMIT 10;

-- 3. Verificar estadísticas de la actividad 59
SELECT 
    activity_id,
    COUNT(*) as total_ejercicios,
    MIN(semana) as semana_min,
    MAX(semana) as semana_max,
    COUNT(DISTINCT semana) as semanas_unicas,
    COUNT(DISTINCT dia) as dias_unicos,
    COUNT(DISTINCT periodo) as periodos_unicos,
    COUNT(DISTINCT bloque) as bloques_unicos
FROM ejercicios_detalles 
WHERE activity_id = 59
GROUP BY activity_id;

-- 4. Verificar intensidades asociadas
SELECT 
    ed.id,
    ed.nombre_ejercicio,
    ed.semana,
    ed.dia,
    ed.intensidad as intensidad_base,
    COUNT(i.id) as total_intensidades,
    STRING_AGG(i.intensidad, ', ') as intensidades_disponibles
FROM ejercicios_detalles ed
LEFT JOIN intensidades i ON ed.id = i.ejercicio_id
WHERE ed.activity_id = 59
GROUP BY ed.id, ed.nombre_ejercicio, ed.semana, ed.dia, ed.intensidad
ORDER BY ed.semana, ed.dia
LIMIT 10;

-- 5. Verificar que no hay duplicados por semana/dia
SELECT 
    activity_id,
    semana,
    dia,
    COUNT(*) as ejercicios_por_dia
FROM ejercicios_detalles 
WHERE activity_id = 59
GROUP BY activity_id, semana, dia
HAVING COUNT(*) > 1
ORDER BY semana, dia;

-- 6. Verificar orden secuencial
SELECT 
    id,
    nombre_ejercicio,
    semana,
    dia,
    orden,
    (semana - 1) * 7 + dia as orden_calculado,
    CASE 
        WHEN orden = (semana - 1) * 7 + dia THEN '✅ Correcto'
        ELSE '❌ Incorrecto'
    END as validacion_orden
FROM ejercicios_detalles 
WHERE activity_id = 59
ORDER BY semana, dia
LIMIT 10;

































