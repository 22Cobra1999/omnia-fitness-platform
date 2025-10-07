-- Añadir columna para relacionar inscripciones con sesiones específicas
ALTER TABLE activity_enrollments ADD COLUMN IF NOT EXISTS session_id TEXT;
