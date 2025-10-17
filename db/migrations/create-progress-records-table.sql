-- Tabla para registros de progreso/marcas del usuario
CREATE TABLE IF NOT EXISTS user_progress_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_title TEXT NOT NULL,
  unit TEXT NOT NULL,
  current_value DECIMAL(10,2) NOT NULL,
  record_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla para ejercicios del usuario (para agrupar los records)
CREATE TABLE IF NOT EXISTS user_exercises (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  unit TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_user_progress_records_user_id ON user_progress_records(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_records_exercise ON user_progress_records(exercise_title);
CREATE INDEX IF NOT EXISTS idx_user_exercises_user_id ON user_exercises(user_id);

-- Políticas RLS (Row Level Security)
ALTER TABLE user_progress_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_exercises ENABLE ROW LEVEL SECURITY;

-- Políticas para user_progress_records
CREATE POLICY "Users can view their own progress records" ON user_progress_records
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress records" ON user_progress_records
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress records" ON user_progress_records
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own progress records" ON user_progress_records
  FOR DELETE USING (auth.uid() = user_id);

-- Políticas para user_exercises
CREATE POLICY "Users can view their own exercises" ON user_exercises
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own exercises" ON user_exercises
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own exercises" ON user_exercises
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own exercises" ON user_exercises
  FOR DELETE USING (auth.uid() = user_id);

















































