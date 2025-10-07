-- Crear tabla activity_calendar
CREATE TABLE activity_calendar (
  id SERIAL PRIMARY KEY,
  activity_id INTEGER REFERENCES activity_enrollments(id) ON DELETE CASCADE,
  fitness_exercise_id INTEGER REFERENCES fitness_exercises(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL,
  month_number INTEGER NOT NULL,
  day_name VARCHAR(10) NOT NULL, -- 'lunes', 'martes', etc.
  calculated_date DATE NOT NULL,
  is_replicated BOOLEAN DEFAULT FALSE,
  source_week INTEGER, -- Para filas replicadas, indica la semana original
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX idx_activity_calendar_activity_id ON activity_calendar(activity_id);
CREATE INDEX idx_activity_calendar_calculated_date ON activity_calendar(calculated_date);
CREATE INDEX idx_activity_calendar_week_month ON activity_calendar(week_number, month_number);

-- Crear trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_activity_calendar_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_activity_calendar_updated_at
  BEFORE UPDATE ON activity_calendar
  FOR EACH ROW
  EXECUTE FUNCTION update_activity_calendar_updated_at();
