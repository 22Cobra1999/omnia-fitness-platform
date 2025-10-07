-- Script para corregir client_id en ejecuciones_ejercicio
-- EJECUTAR EN SUPABASE SQL EDITOR

-- PASO 1: Eliminar ejecuciones existentes con client_id incorrecto (coach)
DELETE FROM ejecuciones_ejercicio 
WHERE client_id = 'b16c4f8c-f47b-4df0-ad2b-13dcbd76263f';

-- PASO 2: Crear enrollments de prueba para actividad 59
-- (Usar IDs de usuarios reales si los tienes, o crear usuarios de prueba)

-- Opción A: Si tienes usuarios reales, reemplaza estos UUIDs
-- NOTA: Reemplaza estos UUIDs con client_id reales de tu sistema
-- Para encontrar client_id reales, ejecuta: SELECT id FROM auth.users LIMIT 3;

INSERT INTO activity_enrollments (
    activity_id,
    client_id,
    status,
    amount_paid,
    payment_method,
    payment_date,
    created_at,
    updated_at
) VALUES 
    (59, 'b16c4f8c-f47b-4df0-ad2b-13dcbd76263f', 'active', 100, 'card', NOW(), NOW(), NOW())
ON CONFLICT (activity_id, client_id) DO NOTHING;

-- PASO 3: Regenerar ejecuciones con client_id correctos
INSERT INTO ejecuciones_ejercicio (
    periodo_id,
    ejercicio_id,
    client_id,
    intensidad_aplicada,
    completado,
    nota_cliente,
    nota_coach
) 
SELECT 
    pa.id as periodo_id,
    ed.id as ejercicio_id,
    ae.client_id,
    'Principiante' as intensidad_aplicada,
    false as completado,
    null as nota_cliente,
    null as nota_coach
FROM periodos_asignados pa
CROSS JOIN ejercicios_detalles ed
CROSS JOIN activity_enrollments ae
WHERE pa.activity_id = 59 
    AND ed.activity_id = 59
    AND ae.activity_id = 59
    AND pa.numero_periodo = 1
    AND ae.status = 'active';

-- PASO 4: Verificar resultado
SELECT 
    'ENROLLMENTS CREADOS' as seccion,
    COUNT(*) as total_enrollments,
    COUNT(DISTINCT client_id) as clientes_unicos
FROM activity_enrollments
WHERE activity_id = 59;

SELECT 
    'EJECUCIONES CORREGIDAS' as seccion,
    COUNT(*) as total_ejecuciones,
    COUNT(DISTINCT client_id) as clientes_unicos,
    COUNT(CASE WHEN completado THEN 1 END) as completadas,
    COUNT(CASE WHEN NOT completado THEN 1 END) as pendientes
FROM ejecuciones_ejercicio ee
JOIN periodos_asignados pa ON ee.periodo_id = pa.id
WHERE pa.activity_id = 59;

-- PASO 5: Mostrar datos de ejemplo
SELECT 
    'DATOS EJEMPLO EJECUCIONES CORREGIDAS' as seccion,
    ee.id,
    ee.client_id,
    ee.ejercicio_id,
    ee.intensidad_aplicada,
    ee.completado,
    ed.nombre_ejercicio,
    ae.status as enrollment_status
FROM ejecuciones_ejercicio ee
JOIN ejercicios_detalles ed ON ee.ejercicio_id = ed.id
JOIN periodos_asignados pa ON ee.periodo_id = pa.id
JOIN activity_enrollments ae ON ee.client_id = ae.client_id AND ae.activity_id = 59
WHERE pa.activity_id = 59
LIMIT 10;
