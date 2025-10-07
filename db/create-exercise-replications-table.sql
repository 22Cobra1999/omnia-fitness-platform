-- Tabla para manejar replicaciones de ejercicios
-- Optimiza almacenamiento evitando duplicar datos

CREATE TABLE IF NOT EXISTS exercise_replications (
    id SERIAL PRIMARY KEY,
    activity_id INTEGER NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
    
    -- Filas específicas a replicar (referencias a fitness_exercises)
    source_exercise_ids INTEGER[] NOT NULL, -- IDs de ejercicios en fitness_exercises
    
    -- Período fuente (para referencia)
    source_period VARCHAR(50) NOT NULL, -- 'Semana 1', 'Lunes', etc.
    
    -- Períodos destino (donde se replica)
    target_periods TEXT[] NOT NULL, -- Array de períodos destino
    repetitions INTEGER NOT NULL DEFAULT 1, -- Veces que se repite por período
    
    -- Metadatos
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    
    -- Índices para optimizar consultas
    CONSTRAINT valid_repetitions CHECK (repetitions > 0 AND repetitions <= 10),
    CONSTRAINT valid_target_periods CHECK (array_length(target_periods, 1) > 0),
    CONSTRAINT valid_source_exercises CHECK (array_length(source_exercise_ids, 1) > 0)
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_exercise_replications_activity_id 
    ON exercise_replications(activity_id);

CREATE INDEX IF NOT EXISTS idx_exercise_replications_source_period 
    ON exercise_replications(source_period);

CREATE INDEX IF NOT EXISTS idx_exercise_replications_created_at 
    ON exercise_replications(created_at);

-- Función para obtener ejercicios replicados
CREATE OR REPLACE FUNCTION get_replicated_exercises(
    p_activity_id INTEGER,
    p_period VARCHAR(50)
) RETURNS TABLE (
    exercise_id INTEGER,
    exercise_data JSONB,
    is_replicated BOOLEAN,
    source_period VARCHAR(50),
    replication_id INTEGER
) AS $$
BEGIN
    RETURN QUERY
    WITH source_exercises AS (
        -- Ejercicios originales del período desde fitness_exercises
        SELECT 
            fe.id as exercise_id,
            fe.exercise_data,
            FALSE as is_replicated,
            p_period as source_period,
            NULL::INTEGER as replication_id
        FROM fitness_exercises fe
        WHERE fe.activity_id = p_activity_id
        AND fe.period = p_period
    ),
    replicated_exercises AS (
        -- Ejercicios replicados desde fitness_exercises
        SELECT 
            fe.id as exercise_id,
            fe.exercise_data,
            TRUE as is_replicated,
            er.source_period,
            er.id as replication_id
        FROM exercise_replications er
        JOIN fitness_exercises fe ON fe.id = ANY(er.source_exercise_ids)
        WHERE er.activity_id = p_activity_id
        AND p_period = ANY(er.target_periods)
    )
    SELECT * FROM source_exercises
    UNION ALL
    SELECT * FROM replicated_exercises
    ORDER BY exercise_id;
END;
$$ LANGUAGE plpgsql;

-- Función para crear replicación
CREATE OR REPLACE FUNCTION create_exercise_replication(
    p_activity_id INTEGER,
    p_source_exercise_ids INTEGER[],
    p_source_period VARCHAR(50),
    p_target_periods TEXT[],
    p_repetitions INTEGER DEFAULT 1,
    p_created_by UUID DEFAULT NULL
) RETURNS INTEGER AS $$
DECLARE
    replication_id INTEGER;
BEGIN
    INSERT INTO exercise_replications (
        activity_id,
        source_exercise_ids,
        source_period,
        target_periods,
        repetitions,
        created_by
    ) VALUES (
        p_activity_id,
        p_source_exercise_ids,
        p_source_period,
        p_target_periods,
        p_repetitions,
        p_created_by
    ) RETURNING id INTO replication_id;
    
    RETURN replication_id;
END;
$$ LANGUAGE plpgsql;

-- Función para eliminar replicación
CREATE OR REPLACE FUNCTION delete_exercise_replication(
    p_replication_id INTEGER
) RETURNS BOOLEAN AS $$
BEGIN
    DELETE FROM exercise_replications WHERE id = p_replication_id;
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Vista simplificada para mostrar replicaciones
CREATE OR REPLACE VIEW exercise_replications_view AS
SELECT 
    er.id,
    er.activity_id,
    er.source_exercise_ids,
    er.source_period,
    er.target_periods,
    er.repetitions,
    er.created_at,
    array_length(er.source_exercise_ids, 1) as source_count,
    array_length(er.target_periods, 1) as target_count,
    (array_length(er.source_exercise_ids, 1) * array_length(er.target_periods, 1) * er.repetitions) as total_exercises
FROM exercise_replications er;

-- Comentarios para documentación
COMMENT ON TABLE exercise_replications IS 'Maneja replicaciones de ejercicios para optimizar almacenamiento';
COMMENT ON COLUMN exercise_replications.source_exercise_ids IS 'IDs específicos de ejercicios en fitness_exercises que se replican';
COMMENT ON COLUMN exercise_replications.source_period IS 'Período original que se replica (ej: Semana 1, Lunes)';
COMMENT ON COLUMN exercise_replications.target_periods IS 'Array de períodos donde se replica el contenido';
COMMENT ON COLUMN exercise_replications.repetitions IS 'Número de veces que se repite el ejercicio en cada período destino';
