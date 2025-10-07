-- URGENTE: Corregir problema de doble ejecución del trigger
-- El trigger se ejecuta dos veces generando 76 ejecuciones en lugar de 38

-- 1. Limpiar todas las ejecuciones existentes
DELETE FROM ejecuciones_ejercicio;

-- 2. Eliminar el trigger actual
DROP TRIGGER IF EXISTS trigger_generate_executions ON activity_enrollments;

-- 3. Eliminar la función actual
DROP FUNCTION IF EXISTS generate_exercise_executions();

-- 4. Crear nueva función que evite duplicaciones
CREATE OR REPLACE FUNCTION generate_exercise_executions()
RETURNS TRIGGER AS $$
DECLARE
    ejercicio_record RECORD;
    periodo_record RECORD;
    client_uuid UUID;
    activity_uuid UUID;
    existing_count INTEGER;
BEGIN
    -- Obtener datos del enrollment
    client_uuid := NEW.client_id;
    activity_uuid := NEW.activity_id;
    
    -- Verificar si ya existen ejecuciones para esta actividad y cliente
    SELECT COUNT(*) INTO existing_count
    FROM ejecuciones_ejercicio ee
    JOIN periodos_asignados pa ON ee.periodo_id = pa.id
    WHERE pa.activity_id = activity_uuid 
    AND ee.client_id = client_uuid;
    
    -- Si ya existen ejecuciones, no generar más
    IF existing_count > 0 THEN
        RAISE NOTICE 'Ejecuciones ya existen para cliente % en actividad %, saltando generación', client_uuid, activity_uuid;
        RETURN NEW;
    END IF;
    
    RAISE NOTICE 'Generando ejecuciones para cliente % en actividad %', client_uuid, activity_uuid;
    
    -- Generar ejecuciones para cada período y ejercicio
    FOR periodo_record IN 
        SELECT id, numero_periodo 
        FROM periodos_asignados 
        WHERE activity_id = activity_uuid
        ORDER BY numero_periodo
    LOOP
        RAISE NOTICE 'Procesando período %', periodo_record.numero_periodo;
        
        FOR ejercicio_record IN 
            SELECT id, tipo, intensidad_base
            FROM ejercicios_detalles 
            WHERE activity_id = activity_uuid
            ORDER BY id
        LOOP
            -- Insertar ejecución
            INSERT INTO ejecuciones_ejercicio (
                periodo_id,
                numero_periodo,
                ejercicio_id,
                client_id,
                intensidad_aplicada,
                completado,
                created_at,
                updated_at
            ) VALUES (
                periodo_record.id,
                periodo_record.numero_periodo,
                ejercicio_record.id,
                client_uuid,
                CASE 
                    WHEN ejercicio_record.tipo = 'descanso' THEN 'Descanso'
                    ELSE ejercicio_record.intensidad_base
                END,
                false,
                NOW(),
                NOW()
            );
        END LOOP;
    END LOOP;
    
    RAISE NOTICE 'Completada generación de ejecuciones para cliente % en actividad %', client_uuid, activity_uuid;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Crear el trigger
CREATE TRIGGER trigger_generate_executions
    AFTER INSERT ON activity_enrollments
    FOR EACH ROW
    EXECUTE FUNCTION generate_exercise_executions();

-- 6. Verificar que se creó correctamente
SELECT 
    trigger_name,
    event_manipulation,
    action_timing
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_generate_executions';
































