-- Función para actualizar contadores de ratings
CREATE OR REPLACE FUNCTION update_activity_rating_counts()
RETURNS TRIGGER AS $$
DECLARE
  old_rating TEXT;
  new_rating TEXT;
  activity_id_val INTEGER;
BEGIN
  -- Determinar el activity_id
  IF TG_OP = 'DELETE' THEN
    activity_id_val := OLD.activity_id;
  ELSE
    activity_id_val := NEW.activity_id;
  END IF;

  -- Extraer ratings del metadata
  IF TG_OP = 'DELETE' OR TG_OP = 'UPDATE' THEN
    old_rating := OLD.metadata->>'user_rating';
  END IF;
  
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    new_rating := NEW.metadata->>'user_rating';
  END IF;

  -- Actualizar contadores basado en el cambio
  IF TG_OP = 'INSERT' THEN
    -- Nuevo rating
    IF new_rating = 'like' THEN
      UPDATE activities SET total_likes = total_likes + 1 WHERE id = activity_id_val;
    ELSIF new_rating = 'dislike' THEN
      UPDATE activities SET total_dislikes = total_dislikes + 1 WHERE id = activity_id_val;
    END IF;
    
  ELSIF TG_OP = 'UPDATE' THEN
    -- Rating cambió
    IF old_rating != new_rating THEN
      -- Remover rating anterior
      IF old_rating = 'like' THEN
        UPDATE activities SET total_likes = total_likes - 1 WHERE id = activity_id_val;
      ELSIF old_rating = 'dislike' THEN
        UPDATE activities SET total_dislikes = total_dislikes - 1 WHERE id = activity_id_val;
      END IF;
      
      -- Agregar nuevo rating
      IF new_rating = 'like' THEN
        UPDATE activities SET total_likes = total_likes + 1 WHERE id = activity_id_val;
      ELSIF new_rating = 'dislike' THEN
        UPDATE activities SET total_dislikes = total_dislikes + 1 WHERE id = activity_id_val;
      END IF;
    END IF;
    
  ELSIF TG_OP = 'DELETE' THEN
    -- Rating eliminado
    IF old_rating = 'like' THEN
      UPDATE activities SET total_likes = total_likes - 1 WHERE id = activity_id_val;
    ELSIF old_rating = 'dislike' THEN
      UPDATE activities SET total_dislikes = total_dislikes - 1 WHERE id = activity_id_val;
    END IF;
  END IF;

  -- Asegurar que los contadores no sean negativos
  UPDATE activities 
  SET 
    total_likes = GREATEST(total_likes, 0),
    total_dislikes = GREATEST(total_dislikes, 0)
  WHERE id = activity_id_val;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;
