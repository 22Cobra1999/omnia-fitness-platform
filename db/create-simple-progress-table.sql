-- Crear tabla para seguimiento de progreso de ejercicios
CREATE TABLE IF NOT EXISTS user_exercise_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  exercise_title TEXT NOT NULL,
  unit TEXT NOT NULL,
  value_1 DECIMAL(10,2),
  date_1 TIMESTAMP WITH TIME ZONE,
  value_2 DECIMAL(10,2),
  date_2 TIMESTAMP WITH TIME ZONE,
  value_3 DECIMAL(10,2),
  date_3 TIMESTAMP WITH TIME ZONE,
  value_4 DECIMAL(10,2),
  date_4 TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (user_id, exercise_title)
);

-- Habilitar RLS
ALTER TABLE user_exercise_progress ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view their own exercise progress" ON user_exercise_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own exercise progress" ON user_exercise_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own exercise progress" ON user_exercise_progress
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own exercise progress" ON user_exercise_progress
  FOR DELETE USING (auth.uid() = user_id);

-- Comentarios
COMMENT ON TABLE user_exercise_progress IS 'Tabla para seguimiento de progreso de ejercicios del usuario con máximo 4 marcas históricas';
COMMENT ON COLUMN user_exercise_progress.exercise_title IS 'Título del ejercicio (ej: Press militar, Correr)';
COMMENT ON COLUMN user_exercise_progress.unit IS 'Unidad de medida (kg, tiempo, reps, etc.)';
COMMENT ON COLUMN user_exercise_progress.value_1 IS 'Primera marca (más reciente)';
COMMENT ON COLUMN user_exercise_progress.value_2 IS 'Segunda marca';
COMMENT ON COLUMN user_exercise_progress.value_3 IS 'Tercera marca';
COMMENT ON COLUMN user_exercise_progress.value_4 IS 'Cuarta marca (más antigua)';
COMMENT ON COLUMN user_exercise_progress.date_1 IS 'Fecha de la primera marca';
COMMENT ON COLUMN user_exercise_progress.date_2 IS 'Fecha de la segunda marca';
COMMENT ON COLUMN user_exercise_progress.date_3 IS 'Fecha de la tercera marca';
COMMENT ON COLUMN user_exercise_progress.date_4 IS 'Fecha de la cuarta marca';















































