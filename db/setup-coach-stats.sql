-- Script para configurar estadísticas de coaches
-- Ejecutar este script en el SQL Editor de Supabase

-- 1. Asegurar que las columnas de rating existan en activities
ALTER TABLE activities
ADD COLUMN IF NOT EXISTS program_rating NUMERIC(3, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS total_program_reviews INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_likes INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_dislikes INTEGER DEFAULT 0;

-- 2. Crear función para actualizar estadísticas de actividades
CREATE OR REPLACE FUNCTION update_activity_program_stats(activity_id_param INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE activities
  SET
    program_rating = COALESCE((
      SELECT AVG((metadata->>'difficulty_rating')::numeric)
      FROM activity_surveys
      WHERE activity_id = activity_id_param
    ), 0.00),
    total_program_reviews = COALESCE((
      SELECT COUNT(*)
      FROM activity_enrollments
      WHERE activity_id = activity_id_param
    ), 0)
  WHERE id = activity_id_param;
END;
$$ LANGUAGE plpgsql;

-- 3. Actualizar estadísticas para todas las actividades existentes
DO $$
DECLARE
    activity_record RECORD;
BEGIN
    FOR activity_record IN SELECT id FROM activities LOOP
        PERFORM update_activity_program_stats(activity_record.id);
    END LOOP;
END $$;

-- 4. Verificar los datos del coach específico
SELECT 
    a.id,
    a.title,
    a.price,
    a.program_rating,
    a.total_program_reviews,
    COUNT(ae.id) as total_enrollments
FROM activities a
LEFT JOIN activity_enrollments ae ON ae.activity_id = a.id
WHERE a.coach_id = 'b16c4f8c-f47b-4df0-ad2b-13dcbd76263f'
GROUP BY a.id, a.title, a.price, a.program_rating, a.total_program_reviews
ORDER BY a.created_at DESC;

-- 5. Calcular estadísticas totales del coach
SELECT 
    COUNT(a.id) as total_products,
    SUM(a.price * COALESCE(enrollment_counts.enrollment_count, 0)) as total_revenue,
    AVG(a.program_rating) as avg_rating,
    SUM(a.total_program_reviews) as total_reviews,
    SUM(COALESCE(enrollment_counts.enrollment_count, 0)) as total_enrollments
FROM activities a
LEFT JOIN (
    SELECT 
        activity_id, 
        COUNT(*) as enrollment_count
    FROM activity_enrollments 
    WHERE status = 'active'
    GROUP BY activity_id
) enrollment_counts ON enrollment_counts.activity_id = a.id
WHERE a.coach_id = 'b16c4f8c-f47b-4df0-ad2b-13dcbd76263f';
