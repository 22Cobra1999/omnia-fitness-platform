-- Script para crear conversaciones automáticamente basadas en enrollments existentes
-- Ejecutar este script en Supabase SQL Editor

-- 1. Verificar que las tablas de mensajes existen
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'conversations') THEN
        RAISE EXCEPTION 'La tabla conversations no existe. Ejecuta primero create-messages-tables.sql';
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'activity_enrollments') THEN
        RAISE EXCEPTION 'La tabla activity_enrollments no existe.';
    END IF;
END $$;

-- 2. Crear conversaciones basadas en enrollments únicos
WITH unique_enrollments AS (
    SELECT DISTINCT 
        ae.client_id,
        a.coach_id,
        a.title as activity_title,
        MIN(ae.created_at) as first_enrollment_date
    FROM activity_enrollments ae
    JOIN activities a ON ae.activity_id = a.id
    WHERE ae.status IN ('active', 'enrolled', 'pending', 'completed')
        AND a.coach_id IS NOT NULL
        AND ae.client_id IS NOT NULL
    GROUP BY ae.client_id, a.coach_id, a.title
),
conversations_to_create AS (
    SELECT 
        ue.client_id,
        ue.coach_id,
        ue.activity_title,
        ue.first_enrollment_date
    FROM unique_enrollments ue
    WHERE NOT EXISTS (
        SELECT 1 FROM conversations c 
        WHERE c.client_id = ue.client_id 
        AND c.coach_id = ue.coach_id
    )
)
INSERT INTO conversations (client_id, coach_id, is_active, created_at)
SELECT 
    client_id,
    coach_id,
    TRUE as is_active,
    first_enrollment_date as created_at
FROM conversations_to_create;

-- 3. Mostrar estadísticas
SELECT 
    'Estadísticas de conversaciones creadas' as info,
    COUNT(*) as total_conversations,
    COUNT(DISTINCT client_id) as unique_clients,
    COUNT(DISTINCT coach_id) as unique_coaches
FROM conversations;

-- 4. Mostrar conversaciones creadas recientemente
SELECT 
    c.id,
    c.client_id,
    c.coach_id,
    c.created_at,
    c.is_active,
    'Conversación creada' as status
FROM conversations c
WHERE c.created_at >= NOW() - INTERVAL '1 hour'
ORDER BY c.created_at DESC;

-- 5. Mostrar enrollments que generaron conversaciones
SELECT 
    'Enrollments que generaron conversaciones' as info,
    COUNT(DISTINCT ae.id) as total_enrollments,
    COUNT(DISTINCT ae.client_id) as unique_clients,
    COUNT(DISTINCT a.coach_id) as unique_coaches
FROM activity_enrollments ae
JOIN activities a ON ae.activity_id = a.id
WHERE ae.status IN ('active', 'enrolled', 'pending', 'completed')
    AND a.coach_id IS NOT NULL;

-- 6. Verificar que las conversaciones tienen los datos correctos
SELECT 
    c.id,
    c.client_id,
    c.coach_id,
    c.created_at,
    c.is_active,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM activity_enrollments ae 
            JOIN activities a ON ae.activity_id = a.id 
            WHERE ae.client_id = c.client_id 
            AND a.coach_id = c.coach_id
            AND ae.status IN ('active', 'enrolled', 'pending', 'completed')
        ) THEN '✅ Tiene enrollments'
        ELSE '❌ Sin enrollments'
    END as validation
FROM conversations c
ORDER BY c.created_at DESC
LIMIT 10;



























