-- Eliminar la tabla si existe
DROP TABLE IF EXISTS public.recent_activities;

-- Crear una nueva tabla con una estructura más simple
CREATE TABLE public.recent_activities (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  value NUMERIC NOT NULL,
  unit TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  color TEXT,
  km NUMERIC,
  mins INTEGER,
  kg NUMERIC,
  reps INTEGER,
  sets INTEGER,
  kcal INTEGER,
  distance NUMERIC,
  duration INTEGER,
  weight NUMERIC
);

-- Crear índice para mejorar el rendimiento de las consultas
CREATE INDEX idx_recent_activities_user_id ON public.recent_activities(user_id);

-- Habilitar RLS
ALTER TABLE public.recent_activities ENABLE ROW LEVEL SECURITY;

-- Crear política para permitir a todos los usuarios autenticados leer sus propias actividades
CREATE POLICY "Users can view their own activities" 
ON public.recent_activities FOR SELECT 
USING (auth.uid() = user_id);

-- Crear política para permitir a todos los usuarios autenticados insertar sus propias actividades
CREATE POLICY "Users can insert their own activities" 
ON public.recent_activities FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Crear política para permitir a todos los usuarios autenticados actualizar sus propias actividades
CREATE POLICY "Users can update their own activities" 
ON public.recent_activities FOR UPDATE 
USING (auth.uid() = user_id);

-- Crear política para permitir a todos los usuarios autenticados eliminar sus propias actividades
CREATE POLICY "Users can delete their own activities" 
ON public.recent_activities FOR DELETE 
USING (auth.uid() = user_id);

-- Política temporal para desarrollo (eliminar en producción)
CREATE POLICY "Temporary full access policy" 
ON public.recent_activities FOR ALL 
USING (true);
