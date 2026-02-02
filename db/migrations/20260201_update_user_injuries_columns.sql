-- Migración para agregar nuevas columnas a user_injuries
-- Estas columnas permiten guardar información más detallada de las lesiones

ALTER TABLE user_injuries
  ADD COLUMN IF NOT EXISTS muscle_id TEXT,
  ADD COLUMN IF NOT EXISTS muscle_name TEXT,
  ADD COLUMN IF NOT EXISTS muscle_group TEXT,
  ADD COLUMN IF NOT EXISTS pain_level INTEGER,
  ADD COLUMN IF NOT EXISTS pain_description TEXT;

-- Comentarios para las nuevas columnas
COMMENT ON COLUMN user_injuries.muscle_id IS 'ID del músculo afectado';
COMMENT ON COLUMN user_injuries.muscle_name IS 'Nombre del músculo afectado';
COMMENT ON COLUMN user_injuries.muscle_group IS 'Grupo muscular al que pertenece el músculo afectado';
COMMENT ON COLUMN user_injuries.pain_level IS 'Nivel de dolor reportado (0-10)';
COMMENT ON COLUMN user_injuries.pain_description IS 'Descripción detallada del dolor';
