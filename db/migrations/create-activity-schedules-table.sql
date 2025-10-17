-- Tabla para almacenar los horarios programados de las actividades compradas
CREATE TABLE IF NOT EXISTS activity_schedules (
  id SERIAL PRIMARY KEY,
  enrollment_id INTEGER NOT NULL REFERENCES activity_enrollments(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  coach_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_id INTEGER NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  scheduled_date DATE NOT NULL,
  scheduled_time TIME NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  session_type TEXT NOT NULL, -- 'videocall', 'workshop', 'program_session'
  status TEXT DEFAULT 'scheduled', -- 'scheduled', 'completed', 'cancelled', 'rescheduled'
  notes TEXT,
  zoom_link TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla para almacenar la disponibilidad recurrente de las actividades
CREATE TABLE IF NOT EXISTS activity_recurring_availability (
  id SERIAL PRIMARY KEY,
  activity_id INTEGER NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  coach_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL, -- 0=Sunday, 1=Monday, etc.
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  session_type TEXT NOT NULL, -- 'videocall', 'workshop', 'program_session'
  max_participants INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_activity_schedules_client_date ON activity_schedules(client_id, scheduled_date);
CREATE INDEX IF NOT EXISTS idx_activity_schedules_coach_date ON activity_schedules(coach_id, scheduled_date);
CREATE INDEX IF NOT EXISTS idx_activity_recurring_availability_activity ON activity_recurring_availability(activity_id);

-- Políticas de seguridad
ALTER TABLE activity_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_recurring_availability ENABLE ROW LEVEL SECURITY;

-- Políticas para activity_schedules
CREATE POLICY "Users can view their own schedules" ON activity_schedules
  FOR SELECT USING (auth.uid() = client_id OR auth.uid() = coach_id);

CREATE POLICY "Coaches can insert schedules for their activities" ON activity_schedules
  FOR INSERT WITH CHECK (auth.uid() = coach_id);

CREATE POLICY "Users can update their own schedules" ON activity_schedules
  FOR UPDATE USING (auth.uid() = client_id OR auth.uid() = coach_id);

CREATE POLICY "Users can delete their own schedules" ON activity_schedules
  FOR DELETE USING (auth.uid() = client_id OR auth.uid() = coach_id);

-- Políticas para activity_recurring_availability
CREATE POLICY "Everyone can view availability" ON activity_recurring_availability
  FOR SELECT USING (true);

CREATE POLICY "Coaches can manage their availability" ON activity_recurring_availability
  FOR ALL USING (auth.uid() = coach_id);
