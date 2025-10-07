-- Tabla para planificar ejercicios por semana y día
CREATE TABLE IF NOT EXISTS exercise_planning (
    id SERIAL PRIMARY KEY,
    activity_id INTEGER NOT NULL,
    week_number INTEGER NOT NULL,
    monday JSONB DEFAULT '{}',
    tuesday JSONB DEFAULT '{}',
    wednesday JSONB DEFAULT '{}',
    thursday JSONB DEFAULT '{}',
    friday JSONB DEFAULT '{}',
    saturday JSONB DEFAULT '{}',
    sunday JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_exercise_planning_activity_id ON exercise_planning(activity_id);
CREATE INDEX IF NOT EXISTS idx_exercise_planning_week_number ON exercise_planning(week_number);
CREATE INDEX IF NOT EXISTS idx_exercise_planning_activity_week ON exercise_planning(activity_id, week_number);

-- Comentarios para documentar la tabla
COMMENT ON TABLE exercise_planning IS 'Tabla para planificar qué ejercicios se realizan cada día de cada semana';
COMMENT ON COLUMN exercise_planning.id IS 'ID único del registro de planificación';
COMMENT ON COLUMN exercise_planning.activity_id IS 'ID de la actividad/producto';
COMMENT ON COLUMN exercise_planning.week_number IS 'Número de semana (1, 2, 3, etc.)';
COMMENT ON COLUMN exercise_planning.monday IS 'JSON con ejercicios para el lunes: {"exercises": [5,6]}';
COMMENT ON COLUMN exercise_planning.tuesday IS 'JSON con ejercicios para el martes: {"exercises": [7]}';
COMMENT ON COLUMN exercise_planning.wednesday IS 'JSON con ejercicios para el miércoles: {"exercises": [8]}';
COMMENT ON COLUMN exercise_planning.thursday IS 'JSON con ejercicios para el jueves: {"exercises": [9]}';
COMMENT ON COLUMN exercise_planning.friday IS 'JSON con ejercicios para el viernes: {"exercises": [10,11]}';
COMMENT ON COLUMN exercise_planning.saturday IS 'JSON con ejercicios para el sábado: {"exercises": [12]}';
COMMENT ON COLUMN exercise_planning.sunday IS 'JSON con ejercicios para el domingo: {"exercises": []}';

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_exercise_planning_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_exercise_planning_updated_at
    BEFORE UPDATE ON exercise_planning
    FOR EACH ROW
    EXECUTE FUNCTION update_exercise_planning_updated_at();

-- Constraint para asegurar que no haya duplicados de activity_id + week_number
CREATE UNIQUE INDEX IF NOT EXISTS idx_exercise_planning_unique_activity_week 
ON exercise_planning(activity_id, week_number);






















