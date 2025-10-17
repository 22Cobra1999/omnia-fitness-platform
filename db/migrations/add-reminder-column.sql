-- Añadir columna de recordatorio a la tabla calendar_events si no existe
ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS reminder_time TIMESTAMP WITH TIME ZONE;

-- Añadir un índice para mejorar el rendimiento de las consultas de recordatorios
CREATE INDEX IF NOT EXISTS idx_calendar_events_reminder_time ON calendar_events(reminder_time);

-- Añadir columna para indicar si el recordatorio ya fue enviado
ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT FALSE;
