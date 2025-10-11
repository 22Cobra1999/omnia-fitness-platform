-- Tabla para organizar el progreso de cada cliente por actividad
CREATE TABLE IF NOT EXISTS client_progress (
    id SERIAL PRIMARY KEY,
    activity_id INTEGER NOT NULL,
    client_id INTEGER NOT NULL,
    date DATE NOT NULL,
    exercises_done INTEGER[] DEFAULT '{}',
    exercises_not_done INTEGER[] DEFAULT '{}',
    details_series JSONB DEFAULT '{}',
    minutes_json JSONB DEFAULT '{}',
    calories_json JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_client_progress_activity_id ON client_progress(activity_id);
CREATE INDEX IF NOT EXISTS idx_client_progress_client_id ON client_progress(client_id);
CREATE INDEX IF NOT EXISTS idx_client_progress_date ON client_progress(date);
CREATE INDEX IF NOT EXISTS idx_client_progress_activity_client_date ON client_progress(activity_id, client_id, date);

-- Comentarios para documentar la tabla
COMMENT ON TABLE client_progress IS 'Tabla para organizar el progreso diario de cada cliente en sus actividades';
COMMENT ON COLUMN client_progress.id IS 'ID único del registro de progreso';
COMMENT ON COLUMN client_progress.activity_id IS 'ID de la actividad/producto';
COMMENT ON COLUMN client_progress.client_id IS 'ID del cliente';
COMMENT ON COLUMN client_progress.date IS 'Fecha del progreso';
COMMENT ON COLUMN client_progress.exercises_done IS 'Array de IDs de ejercicios completados';
COMMENT ON COLUMN client_progress.exercises_not_done IS 'Array de IDs de ejercicios no completados';
COMMENT ON COLUMN client_progress.details_series IS 'JSON con detalles de series, peso, repeticiones, minutos y calorías por ejercicio';
COMMENT ON COLUMN client_progress.minutes_json IS 'JSON con minutos totales por ejercicio';
COMMENT ON COLUMN client_progress.calories_json IS 'JSON con calorías totales por ejercicio';

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_client_progress_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_client_progress_updated_at
    BEFORE UPDATE ON client_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_client_progress_updated_at();





























