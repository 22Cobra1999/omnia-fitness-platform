-- Query corregida para calcular estadísticas de la actividad 59
-- Separar las consultas para evitar multiplicación de filas

-- 1. Verificar ejercicios por período
SELECT 
    'Ejercicios por período' as metrica,
    COUNT(*) as cantidad
FROM ejercicios_detalles 
WHERE activity_id = 59;

-- 2. Verificar total de períodos
SELECT 
    'Total períodos' as metrica,
    COUNT(*) as cantidad
FROM periodos_asignados 
WHERE activity_id = 59;

-- 3. Verificar días únicos por período
SELECT 
    'Días únicos por período' as metrica,
    COUNT(DISTINCT CONCAT(semana, '-', dia)) as cantidad
FROM ejercicios_detalles 
WHERE activity_id = 59;

-- 4. Query corregida usando subconsultas
SELECT 
    a.id as activity_id,
    a.title,
    (SELECT COUNT(*) FROM ejercicios_detalles WHERE activity_id = a.id) as ejercicios_por_periodo,
    (SELECT COUNT(*) FROM periodos_asignados WHERE activity_id = a.id) as total_periodos,
    (SELECT COUNT(*) FROM ejercicios_detalles WHERE activity_id = a.id) * 
    (SELECT COUNT(*) FROM periodos_asignados WHERE activity_id = a.id) as ejercicios_totales,
    (SELECT COUNT(DISTINCT CONCAT(semana, '-', dia)) FROM ejercicios_detalles WHERE activity_id = a.id) as dias_unicos_por_periodo,
    (SELECT COUNT(DISTINCT CONCAT(semana, '-', dia)) FROM ejercicios_detalles WHERE activity_id = a.id) * 
    (SELECT COUNT(*) FROM periodos_asignados WHERE activity_id = a.id) as sesiones_totales
FROM activities a
WHERE a.id = 59;

-- 5. Verificar los períodos específicos
SELECT 
    id,
    activity_id,
    numero_periodo,
    fecha_inicio,
    fecha_fin
FROM periodos_asignados 
WHERE activity_id = 59 
ORDER BY numero_periodo;
































