-- Crear tabla para personalizaciones de ejercicios por cliente
CREATE TABLE IF NOT EXISTS client_exercise_customizations (
    id SERIAL PRIMARY KEY,
    fitness_exercise_id INTEGER NOT NULL REFERENCES fitness_exercises(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Datos personalizables por cliente
    detalle_series TEXT,            -- Ej: "(3x12@50kg)", "(4x8-10@60kg);(3x12@55kg)" - series, reps y peso
    duracion_min INTEGER,           -- Duración en minutos
    one_rm DECIMAL(5,2),           -- 1RM del cliente
    calorias INTEGER,               -- Calorías quemadas
    tiempo_segundos INTEGER,        -- Tiempo real que tardó el cliente en completar
    
    -- Estado del ejercicio para este cliente
    completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP WITH TIME ZONE,
    nota_cliente TEXT,              -- Notas del cliente sobre el ejercicio
    
    -- Metadatos
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraint: un cliente solo puede tener una personalización por ejercicio
    UNIQUE(fitness_exercise_id, client_id)
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_client_exercise_customizations_client_id 
    ON client_exercise_customizations(client_id);

CREATE INDEX IF NOT EXISTS idx_client_exercise_customizations_fitness_exercise_id 
    ON client_exercise_customizations(fitness_exercise_id);

CREATE INDEX IF NOT EXISTS idx_client_exercise_customizations_completed 
    ON client_exercise_customizations(completed);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_client_exercise_customizations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_client_exercise_customizations_updated_at
    BEFORE UPDATE ON client_exercise_customizations
    FOR EACH ROW
    EXECUTE FUNCTION update_client_exercise_customizations_updated_at();

-- Comentarios para documentación
COMMENT ON TABLE client_exercise_customizations IS 'Personalizaciones y progreso de ejercicios específicas por cliente. Se genera automáticamente cuando un cliente compra una actividad.';
COMMENT ON COLUMN client_exercise_customizations.detalle_series IS 'Series, reps y peso personalizados. Formato: "(seriesxreps@peso)" o múltiples bloques separados por ";"';
COMMENT ON COLUMN client_exercise_customizations.duracion_min IS 'Duración estimada en minutos (del ejercicio genérico)';
COMMENT ON COLUMN client_exercise_customizations.tiempo_segundos IS 'Tiempo real que tardó el cliente en completar el ejercicio';
COMMENT ON COLUMN client_exercise_customizations.one_rm IS '1RM (One Rep Max) del cliente para este ejercicio';
COMMENT ON COLUMN client_exercise_customizations.calorias IS 'Calorías quemadas por este cliente en este ejercicio';
COMMENT ON COLUMN client_exercise_customizations.completed IS 'Estado de completado específico para este cliente';




