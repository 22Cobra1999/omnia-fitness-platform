-- Tabla para organizar el progreso diario de cada cliente por actividad
CREATE TABLE IF NOT EXISTS progreso_cliente (
    id SERIAL PRIMARY KEY,
    actividad_id INTEGER NOT NULL,
    cliente_id INTEGER NOT NULL,
    fecha DATE NOT NULL,
    ejercicios_completados INTEGER[] DEFAULT '{}',
    ejercicios_pendientes INTEGER[] DEFAULT '{}',
    detalles_series JSONB DEFAULT '{}',
    minutos_json JSONB DEFAULT '{}',
    calorias_json JSONB DEFAULT '{}',
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_progreso_cliente_actividad ON progreso_cliente(actividad_id);
CREATE INDEX IF NOT EXISTS idx_progreso_cliente_cliente ON progreso_cliente(cliente_id);
CREATE INDEX IF NOT EXISTS idx_progreso_cliente_fecha ON progreso_cliente(fecha);
CREATE INDEX IF NOT EXISTS idx_progreso_cliente_actividad_cliente_fecha ON progreso_cliente(actividad_id, cliente_id, fecha);

-- Comentarios para documentar la tabla
COMMENT ON TABLE progreso_cliente IS 'Tabla para organizar el progreso diario de cada cliente en sus actividades';
COMMENT ON COLUMN progreso_cliente.id IS 'ID único del registro de progreso';
COMMENT ON COLUMN progreso_cliente.actividad_id IS 'ID de la actividad/producto';
COMMENT ON COLUMN progreso_cliente.cliente_id IS 'ID del cliente';
COMMENT ON COLUMN progreso_cliente.fecha IS 'Fecha del progreso';
COMMENT ON COLUMN progreso_cliente.ejercicios_completados IS 'Array de IDs de ejercicios completados';
COMMENT ON COLUMN progreso_cliente.ejercicios_pendientes IS 'Array de IDs de ejercicios no completados';
COMMENT ON COLUMN progreso_cliente.detalles_series IS 'JSON con detalles de series, peso, repeticiones, minutos y calorías por ejercicio';
COMMENT ON COLUMN progreso_cliente.minutos_json IS 'JSON con minutos totales por ejercicio';
COMMENT ON COLUMN progreso_cliente.calorias_json IS 'JSON con calorías totales por ejercicio';

-- Trigger para actualizar fecha_actualizacion automáticamente
CREATE OR REPLACE FUNCTION actualizar_progreso_cliente_fecha()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fecha_actualizacion = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_actualizar_progreso_cliente_fecha
    BEFORE UPDATE ON progreso_cliente
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_progreso_cliente_fecha();























