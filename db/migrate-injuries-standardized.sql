-- =====================================================
-- MIGRACIÓN: SISTEMA ESTANDARIZADO DE LESIONES
-- =====================================================
-- Agrega columnas para músculo específico e intensidad del dolor

-- Agregar nuevas columnas a user_injuries (SIMPLIFICADO)
ALTER TABLE user_injuries 
ADD COLUMN IF NOT EXISTS muscle_id VARCHAR(50),
ADD COLUMN IF NOT EXISTS muscle_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS muscle_group VARCHAR(50),
ADD COLUMN IF NOT EXISTS pain_level INTEGER CHECK (pain_level >= 1 AND pain_level <= 3),
ADD COLUMN IF NOT EXISTS pain_description TEXT;

-- Crear índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_user_injuries_muscle_id ON user_injuries(muscle_id);
CREATE INDEX IF NOT EXISTS idx_user_injuries_pain_level ON user_injuries(pain_level);
CREATE INDEX IF NOT EXISTS idx_user_injuries_muscle_group ON user_injuries(muscle_group);

-- Comentarios para documentar las nuevas columnas (SIMPLIFICADO)
COMMENT ON COLUMN user_injuries.muscle_id IS 'ID de la parte del cuerpo (simplificado)';
COMMENT ON COLUMN user_injuries.muscle_name IS 'Nombre de la parte del cuerpo';
COMMENT ON COLUMN user_injuries.muscle_group IS 'Grupo muscular al que pertenece';
COMMENT ON COLUMN user_injuries.pain_level IS 'Nivel de dolor del 1 al 3 (1=Leve, 2=Moderado, 3=Fuerte)';
COMMENT ON COLUMN user_injuries.pain_description IS 'Descripción del nivel de dolor';

-- Verificar que las columnas se agregaron correctamente
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'user_injuries' 
    AND column_name IN ('muscle_id', 'muscle_name', 'muscle_group', 'pain_level', 'pain_description')
ORDER BY column_name;
