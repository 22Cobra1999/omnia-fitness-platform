-- Agregar columnas para contadores de likes/dislikes
ALTER TABLE activities 
ADD COLUMN IF NOT EXISTS total_likes INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_dislikes INTEGER DEFAULT 0;

-- Crear índices para mejor performance
CREATE INDEX IF NOT EXISTS idx_activities_ratings ON activities(total_likes, total_dislikes);

-- Actualizar actividades existentes con conteos actuales
UPDATE activities 
SET 
  total_likes = COALESCE((
    SELECT COUNT(*) 
    FROM activity_enrollments 
    WHERE activity_enrollments.activity_id = activities.id 
    AND activity_enrollments.metadata->>'user_rating' = 'like'
  ), 0),
  total_dislikes = COALESCE((
    SELECT COUNT(*) 
    FROM activity_enrollments 
    WHERE activity_enrollments.activity_id = activities.id 
    AND activity_enrollments.metadata->>'user_rating' = 'dislike'
  ), 0);
