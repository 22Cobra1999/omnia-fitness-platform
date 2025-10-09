-- Tabla mejorada para manejar los períodos de las actividades
CREATE TABLE IF NOT EXISTS periodos (
    id SERIAL PRIMARY KEY,
    actividad_id INTEGER NOT NULL,
    cantidad_periodos INTEGER NOT NULL DEFAULT 1,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_periodos_actividad ON periodos(actividad_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_periodos_unico_actividad ON periodos(actividad_id);

-- Comentarios para documentar la tabla
COMMENT ON TABLE periodos IS 'Tabla para manejar cuántos períodos tiene cada actividad';
COMMENT ON COLUMN periodos.id IS 'ID único del registro de período';
COMMENT ON COLUMN periodos.actividad_id IS 'ID de la actividad/producto';
COMMENT ON COLUMN periodos.cantidad_periodos IS 'Número de períodos que tiene la actividad (ej: 2, 3, 4)';

-- Trigger para actualizar fecha_actualizacion automáticamente
CREATE OR REPLACE FUNCTION actualizar_periodos_fecha()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fecha_actualizacion = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_actualizar_periodos_fecha
    BEFORE UPDATE ON periodos
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_periodos_fecha();




























