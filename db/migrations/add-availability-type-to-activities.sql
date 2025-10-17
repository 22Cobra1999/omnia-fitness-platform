-- Agregar campo availability_type a la tabla activities
ALTER TABLE activities 
ADD COLUMN IF NOT EXISTS availability_type VARCHAR(50) DEFAULT 'immediate_purchase';

-- Comentario para la columna
COMMENT ON COLUMN activities.availability_type IS 'Tipo de disponibilidad: immediate_purchase (compra inmediata) o check_availability (confirmar disponibilidad)';
