-- =====================================================
-- VERIFICACIÓN DE DATOS DEL CLIENTE
-- =====================================================
-- Cliente: 00dedc23-0b17-4e50-b84e-b2e8100dc93c
-- Verificar: enrollments, actividades, ejecuciones

-- 1. Verificar perfil del cliente
SELECT 
    'PROFILE' as data_type,
    id,
    full_name,
    email,
    created_at
FROM user_profiles 
WHERE id = '00dedc23-0b17-4e50-b84e-b2e8100dc93c';

-- 2. Verificar enrollments del cliente
SELECT 
    'ENROLLMENTS' as data_type,
    id,
    client_id,
    activity_id,
    status,
    start_date,
    created_at
FROM activity_enrollments 
WHERE client_id = '00dedc23-0b17-4e50-b84e-b2e8100dc93c';

-- 3. Verificar actividades del cliente (a través de enrollments)
SELECT 
    'ACTIVITIES' as data_type,
    ae.id as enrollment_id,
    ae.activity_id,
    ae.status as enrollment_status,
    a.id as activity_id,
    a.title as activity_title,
    a.coach_id,
    a.type as activity_type
FROM activity_enrollments ae
LEFT JOIN activities a ON a.id = ae.activity_id
WHERE ae.client_id = '00dedc23-0b17-4e50-b84e-b2e8100dc93c';

-- 4. Verificar ejecuciones de ejercicios del cliente
SELECT 
    'EXECUTIONS' as data_type,
    ee.id,
    ee.client_id,
    ee.ejercicio_id,
    ee.fecha_ejercicio,
    ee.completado,
    ed.titulo as ejercicio_titulo,
    ed.activity_id
FROM ejecuciones_ejercicio ee
LEFT JOIN ejercicios_detalles ed ON ed.id = ee.ejercicio_id
WHERE ee.client_id = '00dedc23-0b17-4e50-b84e-b2e8100dc93c'
ORDER BY ee.fecha_ejercicio DESC;

-- 5. Verificar ejercicios programados para las actividades del cliente
SELECT 
    'PLANNED_EXERCISES' as data_type,
    ed.id,
    ed.activity_id,
    ed.titulo,
    ed.fecha_ejercicio,
    a.title as activity_title
FROM ejercicios_detalles ed
LEFT JOIN activities a ON a.id = ed.activity_id
WHERE ed.activity_id IN (
    SELECT DISTINCT activity_id 
    FROM activity_enrollments 
    WHERE client_id = '00dedc23-0b17-4e50-b84e-b2e8100dc93c'
)
ORDER BY ed.fecha_ejercicio DESC;

-- 6. Verificar si hay datos en banco (pagos)
SELECT 
    'PAYMENTS' as data_type,
    b.id,
    b.enrollment_id,
    b.amount_paid,
    b.payment_date,
    b.payment_status
FROM banco b
LEFT JOIN activity_enrollments ae ON ae.id = b.enrollment_id
WHERE ae.client_id = '00dedc23-0b17-4e50-b84e-b2e8100dc93c';

-- 7. Verificar todo_list del cliente
SELECT 
    'TODO_LIST' as data_type,
    ae.id as enrollment_id,
    ae.activity_id,
    ae.todo_list,
    a.title as activity_title
FROM activity_enrollments ae
LEFT JOIN activities a ON a.id = ae.activity_id
WHERE ae.client_id = '00dedc23-0b17-4e50-b84e-b2e8100dc93c'
AND ae.todo_list IS NOT NULL
AND ae.todo_list != '[]'::jsonb;


























