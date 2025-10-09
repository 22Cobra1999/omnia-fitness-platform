-- Trigger para generar ejecuciones automáticamente cuando se crea un enrollment
-- Este trigger se ejecuta después de insertar en activity_enrollments

-- 1. Crear función trigger
CREATE OR REPLACE FUNCTION generate_exercise_executions_trigger()
RETURNS TRIGGER AS $$
DECLARE
    activity_record RECORD;
    exercise_record RECORD;
    period_record RECORD;
    executions_to_insert JSON[];
    execution_record JSON;
    total_executions INTEGER := 0;
BEGIN
    -- Obtener información de la actividad
    SELECT type, title INTO activity_record
    FROM activities 
    WHERE id = NEW.activity_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Actividad % no encontrada', NEW.activity_id;
    END IF;
    
    -- Determinar duración del programa basada en el título
    DECLARE
        program_duration INTEGER := 8; -- Default 8 semanas
    BEGIN
        IF activity_record.title LIKE '%8 semanas%' THEN
            program_duration := 8;
        ELSIF activity_record.title LIKE '%4 semanas%' THEN
            program_duration := 4;
        ELSIF activity_record.title LIKE '%12 semanas%' THEN
            program_duration := 12;
        END IF;
        
        RAISE NOTICE 'Duración del programa: % semanas', program_duration;
        
        -- Obtener ejercicios de la actividad
        FOR exercise_record IN 
            SELECT id, nombre_ejercicio, tipo
            FROM ejercicios_detalles 
            WHERE activity_id = NEW.activity_id
        LOOP
            -- Obtener períodos para la actividad
            FOR period_record IN 
                SELECT id, numero_periodo
                FROM periodos_asignados 
                WHERE activity_id = NEW.activity_id
                ORDER BY numero_periodo
            LOOP
                -- Determinar intensidad por defecto
                DECLARE
                    default_intensity TEXT := 'Principiante';
                BEGIN
                    IF exercise_record.tipo = 'fuerza' THEN
                        default_intensity := 'Principiante';
                    ELSIF exercise_record.tipo = 'cardio' THEN
                        default_intensity := 'Moderado';
                    END IF;
                    
                    -- Crear ejecución
                    INSERT INTO ejecuciones_ejercicio (
                        periodo_id,
                        ejercicio_id,
                        intensidad_aplicada,
                        completado
                    ) VALUES (
                        period_record.id,
                        exercise_record.id,
                        default_intensity,
                        false
                    );
                    
                    total_executions := total_executions + 1;
                END;
            END LOOP;
        END LOOP;
        
        RAISE NOTICE 'Generadas % ejecuciones para enrollment %', total_executions, NEW.id;
        
        RETURN NEW;
    END;
END;
$$ LANGUAGE plpgsql;

-- 2. Crear trigger
DROP TRIGGER IF EXISTS trigger_generate_executions ON activity_enrollments;

CREATE TRIGGER trigger_generate_executions
    AFTER INSERT ON activity_enrollments
    FOR EACH ROW
    WHEN (NEW.status = 'activa')
    EXECUTE FUNCTION generate_exercise_executions_trigger();

-- 3. Comentarios explicativos
COMMENT ON FUNCTION generate_exercise_executions_trigger() IS 
'Genera automáticamente las ejecuciones de ejercicios cuando se crea un nuevo enrollment activo';

COMMENT ON TRIGGER trigger_generate_executions ON activity_enrollments IS 
'Se ejecuta después de insertar un enrollment con status activa para generar las ejecuciones correspondientes';






































