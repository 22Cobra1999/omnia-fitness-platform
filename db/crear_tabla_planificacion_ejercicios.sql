-- Tabla para planificar ejercicios por semana y día
CREATE TABLE IF NOT EXISTS planificacion_ejercicios (
    id SERIAL PRIMARY KEY,
    actividad_id INTEGER NOT NULL,
    numero_semana INTEGER NOT NULL,
    lunes JSONB DEFAULT '{}',
    martes JSONB DEFAULT '{}',
    miercoles JSONB DEFAULT '{}',
    jueves JSONB DEFAULT '{}',
    viernes JSONB DEFAULT '{}',
    sabado JSONB DEFAULT '{}',
    domingo JSONB DEFAULT '{}',
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_planificacion_ejercicios_actividad ON planificacion_ejercicios(actividad_id);
CREATE INDEX IF NOT EXISTS idx_planificacion_ejercicios_semana ON planificacion_ejercicios(numero_semana);
CREATE INDEX IF NOT EXISTS idx_planificacion_ejercicios_actividad_semana ON planificacion_ejercicios(actividad_id, numero_semana);

-- Comentarios para documentar la tabla
COMMENT ON TABLE planificacion_ejercicios IS 'Tabla para planificar qué ejercicios se realizan cada día de cada semana';
COMMENT ON COLUMN planificacion_ejercicios.id IS 'ID único del registro de planificación';
COMMENT ON COLUMN planificacion_ejercicios.actividad_id IS 'ID de la actividad/producto';
COMMENT ON COLUMN planificacion_ejercicios.numero_semana IS 'Número de semana (1, 2, 3, etc.)';
COMMENT ON COLUMN planificacion_ejercicios.lunes IS 'JSON con ejercicios para el lunes: {"ejercicios": [5,6]}';
COMMENT ON COLUMN planificacion_ejercicios.martes IS 'JSON con ejercicios para el martes: {"ejercicios": [7]}';
COMMENT ON COLUMN planificacion_ejercicios.miercoles IS 'JSON con ejercicios para el miércoles: {"ejercicios": [8]}';
COMMENT ON COLUMN planificacion_ejercicios.jueves IS 'JSON con ejercicios para el jueves: {"ejercicios": [9]}';
COMMENT ON COLUMN planificacion_ejercicios.viernes IS 'JSON con ejercicios para el viernes: {"ejercicios": [10,11]}';
COMMENT ON COLUMN planificacion_ejercicios.sabado IS 'JSON con ejercicios para el sábado: {"ejercicios": [12]}';
COMMENT ON COLUMN planificacion_ejercicios.domingo IS 'JSON con ejercicios para el domingo: {"ejercicios": []}';

-- Trigger para actualizar fecha_actualizacion automáticamente
CREATE OR REPLACE FUNCTION actualizar_planificacion_ejercicios_fecha()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fecha_actualizacion = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_actualizar_planificacion_ejercicios_fecha
    BEFORE UPDATE ON planificacion_ejercicios
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_planificacion_ejercicios_fecha();

-- Constraint para asegurar que no haya duplicados de actividad_id + numero_semana
CREATE UNIQUE INDEX IF NOT EXISTS idx_planificacion_ejercicios_unico_actividad_semana 
ON planificacion_ejercicios(actividad_id, numero_semana);






















