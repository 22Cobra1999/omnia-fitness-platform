-- =====================================================
-- LIMPIAR CONSTRAINTS DUPLICADAS Y ASEGURAR UNICIDAD
-- =====================================================

-- 1. Verificar constraints existentes
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name,
    tc.constraint_type
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
WHERE tc.table_name = 'activity_enrollments'
    AND tc.constraint_type = 'UNIQUE';

-- 2. Eliminar constraint duplicada (mantener solo la original)
ALTER TABLE activity_enrollments 
DROP CONSTRAINT IF EXISTS activity_enrollments_unique_client_activity;

-- 3. Verificar que solo queda una constraint
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name,
    tc.constraint_type
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
WHERE tc.table_name = 'activity_enrollments'
    AND tc.constraint_type = 'UNIQUE';

-- 4. Ver todas las inscripciones duplicadas existentes
SELECT 
    id, 
    activity_id, 
    client_id, 
    status, 
    created_at,
    COUNT(*) OVER (PARTITION BY activity_id, client_id) as duplicate_count
FROM activity_enrollments 
WHERE activity_id = 78 
    AND client_id = '00dedc23-0b17-4e50-b84e-b2e8100dc93c'
ORDER BY created_at DESC;

-- 5. Eliminar inscripciones duplicadas (mantener solo la más reciente)
WITH duplicates AS (
    SELECT 
        id,
        ROW_NUMBER() OVER (
            PARTITION BY activity_id, client_id 
            ORDER BY created_at DESC
        ) as rn
    FROM activity_enrollments 
    WHERE activity_id = 78 
        AND client_id = '00dedc23-0b17-4e50-b84e-b2e8100dc93c'
)
DELETE FROM activity_enrollments 
WHERE id IN (
    SELECT id FROM duplicates WHERE rn > 1
);

-- 6. Verificar resultado final
SELECT 
    id, 
    activity_id, 
    client_id, 
    status, 
    created_at
FROM activity_enrollments 
WHERE activity_id = 78 
    AND client_id = '00dedc23-0b17-4e50-b84e-b2e8100dc93c'
ORDER BY created_at DESC;

-- 7. Probar inserción duplicada (debería fallar)
INSERT INTO activity_enrollments (activity_id, client_id, status)
VALUES (78, '00dedc23-0b17-4e50-b84e-b2e8100dc93c', 'activa');










