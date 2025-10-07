-- Tabla mejorada para manejar los períodos de las actividades
CREATE TABLE IF NOT EXISTS periods (
    id SERIAL PRIMARY KEY,
    activity_id INTEGER NOT NULL,
    periods_count INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_periods_activity_id ON periods(activity_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_periods_unique_activity ON periods(activity_id);

-- Comentarios para documentar la tabla
COMMENT ON TABLE periods IS 'Tabla para manejar cuántos períodos tiene cada actividad';
COMMENT ON COLUMN periods.id IS 'ID único del registro de período';
COMMENT ON COLUMN periods.activity_id IS 'ID de la actividad/producto';
COMMENT ON COLUMN periods.periods_count IS 'Número de períodos que tiene la actividad (ej: 2, 3, 4)';

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_periods_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_periods_updated_at
    BEFORE UPDATE ON periods
    FOR EACH ROW
    EXECUTE FUNCTION update_periods_updated_at();






















