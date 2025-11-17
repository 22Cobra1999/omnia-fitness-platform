-- Trigger para generar automáticamente personalizaciones cuando un cliente compra una actividad
-- Este trigger se ejecuta cuando se inserta un nuevo enrollment en activity_enrollments

-- Función que genera las personalizaciones automáticamente
CREATE OR REPLACE FUNCTION generate_client_exercise_customizations()
RETURNS TRIGGER AS $$
BEGIN
    -- Solo procesar si el enrollment es activo
    IF NEW.status = 'active' THEN
        -- Insertar personalizaciones para todos los ejercicios de la actividad
        INSERT INTO client_exercise_customizations (
            fitness_exercise_id,
            client_id,
            detalle_series,
            duracion_min,
            one_rm,
            calorias,
            completed,
            completed_at,
            nota_cliente
        )
        SELECT 
            fe.id as fitness_exercise_id,
            NEW.client_id,
            fe.detalle_series,                     -- Copiar detalle_series del ejercicio genérico
            fe.duracion_min,                       -- Copiar duración del ejercicio genérico
            fe.one_rm,                             -- Copiar 1RM del ejercicio genérico
            fe.calorias,                           -- Copiar calorías del ejercicio genérico
            FALSE as completed,                    -- Inicializar como no completado
            NULL as completed_at,                  -- Inicializar como NULL
            NULL as nota_cliente                   -- Inicializar como NULL
        FROM fitness_exercises fe
        WHERE fe.activity_id = NEW.activity_id
          AND NOT EXISTS (
              -- Evitar duplicados si ya existe una personalización
              SELECT 1 FROM client_exercise_customizations cec 
              WHERE cec.fitness_exercise_id = fe.id 
                AND cec.client_id = NEW.client_id
          );
        
        -- Log para debugging
        RAISE NOTICE 'Generadas personalizaciones para cliente % en actividad %', NEW.client_id, NEW.activity_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear el trigger
DROP TRIGGER IF EXISTS trigger_generate_customizations ON activity_enrollments;
CREATE TRIGGER trigger_generate_customizations
    AFTER INSERT ON activity_enrollments
    FOR EACH ROW
    EXECUTE FUNCTION generate_client_exercise_customizations();

-- También crear trigger para cuando se actualiza el status a 'active'
CREATE OR REPLACE FUNCTION update_client_exercise_customizations_on_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Si el status cambió a 'active', generar personalizaciones
    IF NEW.status = 'active' AND (OLD.status IS NULL OR OLD.status != 'active') THEN
        -- Insertar personalizaciones para todos los ejercicios de la actividad
        INSERT INTO client_exercise_customizations (
            fitness_exercise_id,
            client_id,
            detalle_series,
            duracion_min,
            one_rm,
            calorias,
            completed,
            completed_at,
            nota_cliente
        )
        SELECT 
            fe.id as fitness_exercise_id,
            NEW.client_id,
            fe.detalle_series,
            fe.duracion_min,
            fe.one_rm,
            fe.calorias,
            FALSE as completed,
            NULL as completed_at,
            NULL as nota_cliente
        FROM fitness_exercises fe
        WHERE fe.activity_id = NEW.activity_id
          AND NOT EXISTS (
              SELECT 1 FROM client_exercise_customizations cec 
              WHERE cec.fitness_exercise_id = fe.id 
                AND cec.client_id = NEW.client_id
          );
        
        RAISE NOTICE 'Generadas personalizaciones para cliente % en actividad % (status update)', NEW.client_id, NEW.activity_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear el trigger para updates
DROP TRIGGER IF EXISTS trigger_update_customizations ON activity_enrollments;
CREATE TRIGGER trigger_update_customizations
    AFTER UPDATE ON activity_enrollments
    FOR EACH ROW
    EXECUTE FUNCTION update_client_exercise_customizations_on_status_change();

-- Comentarios
COMMENT ON FUNCTION generate_client_exercise_customizations() IS 'Genera automáticamente personalizaciones cuando un cliente compra una actividad';
COMMENT ON FUNCTION update_client_exercise_customizations_on_status_change() IS 'Genera personalizaciones cuando el status de enrollment cambia a active';




