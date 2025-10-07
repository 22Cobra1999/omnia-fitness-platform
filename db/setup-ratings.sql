-- Script completo para configurar ratings en Supabase
-- Ejecutar este script en el SQL Editor de Supabase

-- 1. Agregar columnas de rating a la tabla user_profiles para coaches
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS coach_rating NUMERIC(3, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS total_coach_reviews INTEGER DEFAULT 0;

-- 2. Agregar columnas de rating a la tabla activities
ALTER TABLE activities
ADD COLUMN IF NOT EXISTS program_rating NUMERIC(3, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS total_program_reviews INTEGER DEFAULT 0;

-- 3. Crear vista materializada para stats de coaches
DROP MATERIALIZED VIEW IF EXISTS coach_rating_stats;
CREATE MATERIALIZED VIEW coach_rating_stats AS
SELECT 
    up.id as coach_id,
    COALESCE(AVG(acs.coach_rating), 0.00) as avg_coach_rating,
    COALESCE(COUNT(acs.coach_rating), 0) as total_coach_reviews
FROM user_profiles up
LEFT JOIN activities a ON a.coach_id = up.id
LEFT JOIN activity_surveys acs ON acs.activity_id = a.id AND acs.coach_rating IS NOT NULL
WHERE up.role = 'coach'
GROUP BY up.id;

-- 4. Crear vista materializada para stats de actividades
DROP MATERIALIZED VIEW IF EXISTS activity_program_stats;
CREATE MATERIALIZED VIEW activity_program_stats AS
SELECT 
    a.id as activity_id,
    COALESCE(AVG((acs.metadata->>'difficulty_rating')::numeric), 0.00) as avg_rating,
    COALESCE(COUNT(ae.id), 0) as total_reviews
FROM activities a
LEFT JOIN activity_surveys acs ON acs.activity_id = a.id
LEFT JOIN activity_enrollments ae ON ae.activity_id = a.id
GROUP BY a.id;

-- 5. Crear índices para mejorar performance
CREATE UNIQUE INDEX IF NOT EXISTS idx_coach_rating_stats_coach_id 
ON coach_rating_stats (coach_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_activity_program_stats_activity_id 
ON activity_program_stats (activity_id);

-- 6. Insertar datos de ejemplo para coaches (si no existen)
INSERT INTO user_profiles (id, full_name, role, coach_rating, total_coach_reviews)
VALUES 
    ('550e8400-e29b-41d4-a716-446655440001', 'Coach Demo', 'coach', 4.5, 25),
    ('550e8400-e29b-41d4-a716-446655440002', 'Fitness Expert', 'coach', 4.8, 15),
    ('550e8400-e29b-41d4-a716-446655440003', 'Nutrition Coach', 'coach', 4.2, 8)
ON CONFLICT (id) DO UPDATE SET
    coach_rating = EXCLUDED.coach_rating,
    total_coach_reviews = EXCLUDED.total_coach_reviews;

-- 7. Insertar datos de ejemplo para activities (si no existen)
INSERT INTO activities (id, title, description, type, difficulty, price, coach_id, program_rating, total_program_reviews)
VALUES 
    ('550e8400-e29b-41d4-a716-446655440010', 'HIIT Workout', 'High intensity interval training', 'fitness', 'intermediate', 25.00, '550e8400-e29b-41d4-a716-446655440001', 4.5, 12),
    ('550e8400-e29b-41d4-a716-446655440011', 'Yoga Flow', 'Relaxing yoga session', 'yoga', 'beginner', 20.00, '550e8400-e29b-41d4-a716-446655440002', 4.8, 8),
    ('550e8400-e29b-41d4-a716-446655440012', 'Nutrition Plan', 'Personalized nutrition guidance', 'nutrition', 'advanced', 35.00, '550e8400-e29b-41d4-a716-446655440003', 4.2, 5)
ON CONFLICT (id) DO UPDATE SET
    program_rating = EXCLUDED.program_rating,
    total_program_reviews = EXCLUDED.total_program_reviews;

-- 8. Refrescar las vistas materializadas
REFRESH MATERIALIZED VIEW coach_rating_stats;
REFRESH MATERIALIZED VIEW activity_program_stats;

-- 9. Verificar que todo funciona
SELECT 'Coach Rating Stats' as table_name, COUNT(*) as count FROM coach_rating_stats
UNION ALL
SELECT 'Activity Program Stats' as table_name, COUNT(*) as count FROM activity_program_stats; 