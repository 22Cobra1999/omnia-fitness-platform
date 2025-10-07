-- Script para debuggear el estado actual de las ejecuciones
-- Verificar si realmente hay 76 ejecuciones o 38

-- 1. Contar total de ejecuciones
SELECT 
    'Total ejecuciones' as metrica,
    COUNT(*) as cantidad
FROM ejecuciones_ejercicio;

-- 2. Contar ejecuciones con y sin client_id
SELECT 
    'Ejecuciones con client_id' as metrica,
    COUNT(*) as cantidad
FROM ejecuciones_ejercicio 
WHERE client_id IS NOT NULL;

SELECT 
    'Ejecuciones sin client_id' as metrica,
    COUNT(*) as cantidad
FROM ejecuciones_ejercicio 
WHERE client_id IS NULL;

-- 3. Ver ejecuciones por período
SELECT 
    periodo_id,
    numero_periodo,
    COUNT(*) as ejecuciones_por_periodo,
    COUNT(CASE WHEN client_id IS NOT NULL THEN 1 END) as con_client_id,
    COUNT(CASE WHEN client_id IS NULL THEN 1 END) as sin_client_id
FROM ejecuciones_ejercicio 
GROUP BY periodo_id, numero_periodo
ORDER BY periodo_id;

-- 4. Ver las últimas ejecuciones creadas
SELECT 
    id,
    periodo_id,
    numero_periodo,
    ejercicio_id,
    client_id,
    intensidad_aplicada,
    created_at
FROM ejecuciones_ejercicio 
ORDER BY id DESC
LIMIT 20;

-- 5. Verificar si hay duplicados por período + ejercicio + client_id
SELECT 
    periodo_id,
    ejercicio_id,
    client_id,
    COUNT(*) as cantidad_duplicados
FROM ejecuciones_ejercicio 
GROUP BY periodo_id, ejercicio_id, client_id
HAVING COUNT(*) > 1
ORDER BY cantidad_duplicados DESC;

-- 6. Ver enrollments activos
SELECT 
    id,
    activity_id,
    client_id,
    status,
    created_at
FROM activity_enrollments 
WHERE status = 'activa'
ORDER BY created_at DESC;
































