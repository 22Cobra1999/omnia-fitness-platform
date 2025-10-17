-- Script para configurar y verificar coach_stats_view
-- Ejecutar este script en el SQL Editor de Supabase

-- 1. Verificar si la vista coach_stats_view existe
SELECT EXISTS (
    SELECT 1 
    FROM information_schema.views 
    WHERE table_name = 'coach_stats_view'
) as view_exists;

-- 2. Si no existe, crearla
CREATE OR REPLACE VIEW coach_stats_view AS
SELECT 
    a.coach_id,
    COALESCE(AVG(acs.coach_method_rating), 0.00) as avg_rating,
    COALESCE(COUNT(acs.id), 0) as total_reviews
FROM activities a
LEFT JOIN activity_surveys acs ON acs.activity_id = a.id
WHERE a.coach_id IS NOT NULL
GROUP BY a.coach_id;

-- 3. Verificar los datos del coach específico
SELECT 
    coach_id,
    avg_rating,
    total_reviews
FROM coach_stats_view 
WHERE coach_id = 'b16c4f8c-f47b-4df0-ad2b-13dcbd76263f';

-- 4. Si no hay datos, verificar si existen activity_surveys
SELECT 
    COUNT(*) as total_surveys,
    COUNT(CASE WHEN coach_method_rating IS NOT NULL THEN 1 END) as surveys_with_rating
FROM activity_surveys;

-- 5. Verificar actividades del coach
SELECT 
    a.id,
    a.title,
    a.coach_id,
    COUNT(acs.id) as survey_count
FROM activities a
LEFT JOIN activity_surveys acs ON acs.activity_id = a.id
WHERE a.coach_id = 'b16c4f8c-f47b-4df0-ad2b-13dcbd76263f'
GROUP BY a.id, a.title, a.coach_id;

-- 6. Insertar datos de ejemplo si no hay surveys
-- (Solo ejecutar si no hay datos reales)
/*
INSERT INTO activity_surveys (
    activity_id, 
    client_id, 
    coach_method_rating, 
    created_at
) VALUES 
(
    (SELECT id FROM activities WHERE coach_id = 'b16c4f8c-f47b-4df0-ad2b-13dcbd76263f' LIMIT 1),
    'b16c4f8c-f47b-4df0-ad2b-13dcbd76263f',
    4.5,
    NOW()
),
(
    (SELECT id FROM activities WHERE coach_id = 'b16c4f8c-f47b-4df0-ad2b-13dcbd76263f' LIMIT 1),
    'b16c4f8c-f47b-4df0-ad2b-13dcbd76263f',
    4.8,
    NOW()
);
*/

-- 7. Verificar resultado final
SELECT 
    coach_id,
    avg_rating,
    total_reviews
FROM coach_stats_view 
WHERE coach_id = 'b16c4f8c-f47b-4df0-ad2b-13dcbd76263f';
