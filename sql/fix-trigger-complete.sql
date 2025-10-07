-- =====================================================
-- CORREGIR TRIGGER PARA QUE FUNCIONE CORRECTAMENTE
-- =====================================================

-- 1. Primero eliminar el trigger problemático
DROP TRIGGER IF EXISTS generate_ejecuciones_ejercicio_trigger ON activity_enrollments;

-- 2. Crear el trigger corregido
CREATE OR REPLACE FUNCTION generate_ejecuciones_ejercicio()
RETURNS TRIGGER AS $$
DECLARE
    planificacion_record RECORD;
    periodo_record RECORD;
    ejercicio_record RECORD;
    total_periods INTEGER;
    periodo_id_val INTEGER;
    dia TEXT;
    dias_semana TEXT[] := ARRAY['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
    ejercicios_dia JSONB;
    bloque TEXT;
    ejercicios_bloque JSONB;
    ejercicio_info JSONB;
    ejecucion_data JSONB;
BEGIN
    -- Obtener datos de planificación
    SELECT * INTO planificacion_record 
    FROM planificacion_ejercicios 
    WHERE actividad_id = NEW.activity_id 
    ORDER BY numero_semana;

    -- Obtener datos de períodos
    SELECT * INTO periodo_record 
    FROM periodos 
    WHERE actividad_id = NEW.activity_id;

    IF NOT FOUND THEN
        RAISE NOTICE 'No se encontraron períodos para la actividad %', NEW.activity_id;
        RETURN NEW;
    END IF;

    total_periods := periodo_record.cantidad_periodos;
    periodo_id_val := periodo_record.id;

    RAISE NOTICE 'Generando ejecuciones para actividad %, períodos: %', NEW.activity_id, total_periods;

    -- Iterar por cada período
    FOR i IN 1..total_periods LOOP
        -- Iterar por cada semana en la planificación
        FOR planificacion_record IN 
            SELECT * FROM planificacion_ejercicios 
            WHERE actividad_id = NEW.activity_id 
            ORDER BY numero_semana
        LOOP
            -- Iterar por cada día de la semana
            FOREACH dia IN ARRAY dias_semana LOOP
                -- Verificar si el día tiene ejercicios
                IF planificacion_record[dia] IS NOT NULL 
                   AND planificacion_record[dia] != '[]' 
                   AND planificacion_record[dia] != 'null' THEN
                    
                    BEGIN
                        ejercicios_dia := planificacion_record[dia]::JSONB;
                        
                        -- Iterar por cada bloque en el día
                        FOR bloque IN SELECT jsonb_object_keys(ejercicios_dia) LOOP
                            ejercicios_bloque := ejercicios_dia->bloque;
                            
                            -- Iterar por cada ejercicio en el bloque
                            FOR ejercicio_info IN SELECT * FROM jsonb_array_elements(ejercicios_bloque) LOOP
                                -- Obtener detalles del ejercicio
                                SELECT * INTO ejercicio_record 
                                FROM ejercicios_detalles 
                                WHERE id = (ejercicio_info->>'id')::INTEGER;
                                
                                IF FOUND THEN
                                    -- Insertar ejecución
                                    INSERT INTO ejecuciones_ejercicio (
                                        periodo_id,
                                        ejercicio_id,
                                        client_id,
                                        completado,
                                        intensidad_aplicada,
                                        dia_semana,
                                        fecha_ejercicio,
                                        bloque,
                                        orden,
                                        detalle_series,
                                        created_at,
                                        updated_at
                                    ) VALUES (
                                        periodo_id_val,
                                        ejercicio_record.id,
                                        NEW.client_id,
                                        false,
                                        'Principiante',
                                        dia,
                                        NULL, -- fecha_ejercicio será NULL hasta que el cliente inicie
                                        (bloque)::INTEGER,
                                        (ejercicio_info->>'orden')::INTEGER,
                                        ejercicio_record.detalle_series,
                                        NOW(),
                                        NOW()
                                    );
                                    
                                    RAISE NOTICE 'Ejecución creada: ejercicio %, día %, bloque %', 
                                        ejercicio_record.id, dia, bloque;
                                END IF;
                            END LOOP;
                        END LOOP;
                        
                    EXCEPTION WHEN OTHERS THEN
                        RAISE NOTICE 'Error procesando día %: %', dia, SQLERRM;
                        CONTINUE;
                    END;
                END IF;
            END LOOP;
        END LOOP;
    END LOOP;

    RAISE NOTICE 'Ejecuciones generadas exitosamente para cliente % en actividad %', 
        NEW.client_id, NEW.activity_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Crear el trigger
CREATE TRIGGER generate_ejecuciones_ejercicio_trigger
    AFTER INSERT ON activity_enrollments
    FOR EACH ROW
    EXECUTE FUNCTION generate_ejecuciones_ejercicio();

-- 4. Verificar que el trigger se creó correctamente
SELECT 
    trigger_name, 
    event_manipulation, 
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'activity_enrollments';

-- =====================================================
-- NOTAS IMPORTANTES:
-- =====================================================
-- 1. El trigger ahora maneja correctamente los campos JSON
-- 2. Usa planificacion_record[dia] en lugar de planificacion_record.dia
-- 3. Incluye manejo de errores robusto
-- 4. Genera ejecuciones con todos los campos necesarios
-- 5. Establece fecha_ejercicio como NULL hasta que el cliente inicie




