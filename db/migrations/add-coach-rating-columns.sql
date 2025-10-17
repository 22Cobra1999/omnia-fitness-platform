-- Agregar columnas de rating a la tabla user_profiles para coaches
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS coach_rating NUMERIC(3, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS total_coach_reviews INTEGER DEFAULT 0;

-- Crear vista materializada para stats de coaches
CREATE MATERIALIZED VIEW IF NOT EXISTS coach_rating_stats AS
SELECT 
    up.id as coach_id,
    AVG(acs.coach_rating) as avg_coach_rating,
    COUNT(acs.coach_rating) as total_coach_reviews
FROM user_profiles up
LEFT JOIN activities a ON a.coach_id = up.id
LEFT JOIN activity_surveys acs ON acs.activity_id = a.id AND acs.coach_rating IS NOT NULL
WHERE up.role = 'coach'
GROUP BY up.id;

-- Crear índice para mejorar performance
CREATE UNIQUE INDEX IF NOT EXISTS idx_coach_rating_stats_coach_id 
ON coach_rating_stats (coach_id);
