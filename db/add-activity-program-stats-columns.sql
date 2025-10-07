-- Este archivo ya no es necesario porque ahora usamos la vista materializada
-- Las columnas program_rating y total_program_reviews no se agregan directamente a activities
-- En su lugar, usamos la vista activity_program_stats

-- Verificar que la vista materializada existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_matviews WHERE matviewname = 'activity_program_stats'
    ) THEN
        -- Crear la vista materializada si no existe
        CREATE MATERIALIZED VIEW activity_program_stats AS
        SELECT 
            activity_id,
            AVG(difficulty_rating) as avg_rating,
            COUNT(*) as total_reviews
        FROM activity_surveys
        GROUP BY activity_id;
        
        -- Crear índice para mejorar performance
        CREATE UNIQUE INDEX idx_activity_program_stats_activity_id 
        ON activity_program_stats (activity_id);
    END IF;
END $$;
