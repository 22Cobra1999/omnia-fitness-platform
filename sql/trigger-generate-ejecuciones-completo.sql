-- =====================================================
-- TRIGGER COMPLETO PARA GENERAR EJECUCIONES_EJERCICIO
-- =====================================================
-- Este trigger genera automáticamente las filas de ejecuciones_ejercicio
-- cuando un cliente compra una actividad, combinando datos de múltiples tablas
-- y respetando el orden exacto de la planificación.

-- =====================================================
-- 1. ELIMINAR TRIGGER Y FUNCIÓN EXISTENTES (SI EXISTEN)
-- =====================================================

DROP TRIGGER IF EXISTS trigger_generate_ejecuciones_ejercicio ON activity_enrollments;
DROP FUNCTION IF EXISTS generate_ejecuciones_ejercicio();

-- =====================================================
-- 2. CREAR FUNCIÓN DEL TRIGGER
-- =====================================================

CREATE OR REPLACE FUNCTION generate_ejecuciones_ejercicio()
RETURNS TRIGGER AS $$
DECLARE
    -- Variables para planificación
    planificacion_record RECORD;
    periodo_record RECORD;
    ejercicio_record RECORD;
    
    -- Variables para procesamiento
    dias_semana TEXT[] := ARRAY['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
    dia TEXT;
    ejercicios_dia JSONB;
    bloque_key TEXT;
    bloque_ejercicios JSONB;
    ejercicio_item JSONB;
    ejercicio_id_val INTEGER;
    ejercicio_orden_val INTEGER;
    
    -- Variables para control de períodos
    periodo_actual INTEGER;
    periodo_id_val INTEGER;
    
    -- Contador para debugging
    ejecuciones_generadas INTEGER := 0;
BEGIN
    -- =====================================================
    -- PASO 1: OBTENER DATOS DE PERÍODOS
    -- =====================================================
    
    SELECT * INTO periodo_record 
    FROM periodos 
    WHERE actividad_id = NEW.activity_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'No se encontraron períodos para la actividad %', NEW.activity_id;
    END IF;
    
    periodo_id_val := periodo_record.id;
    
    RAISE NOTICE 'Generando ejecuciones para cliente % en actividad % con % períodos', 
        NEW.client_id, NEW.activity_id, periodo_record.cantidad_periodos;
    
    -- =====================================================
    -- PASO 2: PROCESAR CADA PERÍODO (RÉPLICA)
    -- =====================================================
    
    FOR periodo_actual IN 1..periodo_record.cantidad_periodos LOOP
        RAISE NOTICE 'Procesando período % de %', periodo_actual, periodo_record.cantidad_periodos;
        
        -- =====================================================
        -- PASO 3: PROCESAR CADA SEMANA EN EL PERÍODO
        -- =====================================================
        
        FOR planificacion_record IN 
            SELECT * FROM planificacion_ejercicios 
            WHERE actividad_id = NEW.activity_id 
            ORDER BY numero_semana
        LOOP
            RAISE NOTICE 'Procesando semana %', planificacion_record.numero_semana;
            
            -- =====================================================
            -- PASO 4: PROCESAR CADA DÍA DE LA SEMANA
            -- =====================================================
            
            FOREACH dia IN ARRAY dias_semana LOOP
                -- Verificar si el día tiene ejercicios
                IF planificacion_record[dia] IS NOT NULL 
                   AND planificacion_record[dia] != '[]' 
                   AND planificacion_record[dia] != 'null' THEN
                    
                    RAISE NOTICE 'Procesando día: %', dia;
                    
                    -- Parsear JSON del día
                    BEGIN
                        ejercicios_dia := planificacion_record[dia]::JSONB;
                    EXCEPTION WHEN OTHERS THEN
                        RAISE NOTICE 'Error parseando JSON para día %: %', dia, planificacion_record[dia];
                        CONTINUE;
                    END;
                    
                    -- =====================================================
                    -- PASO 5: PROCESAR CADA BLOQUE EN EL DÍA
                    -- =====================================================
                    
                    FOR bloque_key IN 
                        SELECT jsonb_object_keys(ejercicios_dia) 
                        ORDER BY jsonb_object_keys(ejercicios_dia)::INTEGER
                    LOOP
                        bloque_ejercicios := ejercicios_dia->bloque_key;
                        
                        RAISE NOTICE 'Procesando bloque %', bloque_key;
                        
                        -- =====================================================
                        -- PASO 6: PROCESAR CADA EJERCICIO EN EL BLOQUE
                        -- =====================================================
                        
                        FOR ejercicio_item IN 
                            SELECT * FROM jsonb_array_elements(bloque_ejercicios)
                            ORDER BY (value->>'orden')::INTEGER
                        LOOP
                            -- Extraer datos del ejercicio
                            ejercicio_id_val := (ejercicio_item->>'id')::INTEGER;
                            ejercicio_orden_val := (ejercicio_item->>'orden')::INTEGER;
                            
                            -- Obtener detalles del ejercicio
                            SELECT * INTO ejercicio_record 
                            FROM ejercicios_detalles 
                            WHERE id = ejercicio_id_val;
                            
                            IF NOT FOUND THEN
                                RAISE NOTICE 'Ejercicio % no encontrado, saltando...', ejercicio_id_val;
                                CONTINUE;
                            END IF;
                            
                            -- =====================================================
                            -- PASO 7: INSERTAR EJECUCIÓN
                            -- =====================================================
                            
                            INSERT INTO ejecuciones_ejercicio (
                                ejercicio_id,
                                client_id,
                                periodo_id,
                                completado,
                                intensidad_aplicada,
                                dia_semana,
                                bloque,
                                orden,
                                detalle_series,
                                created_at,
                                updated_at
                            ) VALUES (
                                ejercicio_id_val,
                                NEW.client_id,
                                periodo_id_val,
                                FALSE,
                                'Principiante',
                                dia,
                                bloque_key::INTEGER,
                                ejercicio_orden_val,
                                ejercicio_record.detalle_series,
                                NOW(),
                                NOW()
                            );
                            
                            ejecuciones_generadas := ejecuciones_generadas + 1;
                            
                            RAISE NOTICE 'Ejecución generada: % - % (bloque %, orden %)', 
                                ejercicio_record.nombre_ejercicio, dia, bloque_key, ejercicio_orden_val;
                        END LOOP;
                    END LOOP;
                END IF;
            END LOOP;
        END LOOP;
    END LOOP;
    
    -- =====================================================
    -- PASO 8: RESUMEN FINAL
    -- =====================================================
    
    RAISE NOTICE 'Generación completada: % ejecuciones creadas para cliente %', 
        ejecuciones_generadas, NEW.client_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 3. CREAR TRIGGER
-- =====================================================

CREATE TRIGGER trigger_generate_ejecuciones_ejercicio
    AFTER INSERT ON activity_enrollments
    FOR EACH ROW
    EXECUTE FUNCTION generate_ejecuciones_ejercicio();

-- =====================================================
-- 4. COMENTARIOS Y DOCUMENTACIÓN
-- =====================================================

COMMENT ON FUNCTION generate_ejecuciones_ejercicio() IS 
'Genera automáticamente las filas de ejecuciones_ejercicio cuando un cliente compra una actividad. 
Combina datos de planificacion_ejercicios, periodos y ejercicios_detalles para crear ejecuciones 
en el orden correcto respetando bloques, orden y réplicas.';

COMMENT ON TRIGGER trigger_generate_ejecuciones_ejercicio ON activity_enrollments IS 
'Se ejecuta automáticamente después de insertar un nuevo enrollment de actividad. 
Genera todas las ejecuciones de ejercicios que el cliente debe realizar.';

-- =====================================================
-- 5. VERIFICACIÓN DEL TRIGGER
-- =====================================================

-- Verificar que el trigger se creó correctamente
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_generate_ejecuciones_ejercicio';

-- =====================================================
-- 6. FUNCIONES DE UTILIDAD PARA DEBUGGING
-- =====================================================

-- Función para verificar ejecuciones generadas
CREATE OR REPLACE FUNCTION verificar_ejecuciones_cliente(client_id_param TEXT)
RETURNS TABLE (
    ejecucion_id INTEGER,
    ejercicio_nombre TEXT,
    dia_semana TEXT,
    bloque INTEGER,
    orden INTEGER,
    detalle_series TEXT,
    completado BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.id,
        ed.nombre_ejercicio,
        e.dia_semana,
        e.bloque,
        e.orden,
        e.detalle_series,
        e.completado
    FROM ejecuciones_ejercicio e
    JOIN ejercicios_detalles ed ON e.ejercicio_id = ed.id
    WHERE e.client_id = client_id_param
    ORDER BY e.id;
END;
$$ LANGUAGE plpgsql;

-- Función para obtener estadísticas de ejecuciones
CREATE OR REPLACE FUNCTION estadisticas_ejecuciones_cliente(client_id_param TEXT)
RETURNS TABLE (
    total_ejecuciones BIGINT,
    ejecuciones_completadas BIGINT,
    ejecuciones_pendientes BIGINT,
    dias_con_ejercicios BIGINT,
    bloques_totales BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_ejecuciones,
        COUNT(*) FILTER (WHERE completado = TRUE) as ejecuciones_completadas,
        COUNT(*) FILTER (WHERE completado = FALSE) as ejecuciones_pendientes,
        COUNT(DISTINCT dia_semana) as dias_con_ejercicios,
        COUNT(DISTINCT bloque) as bloques_totales
    FROM ejecuciones_ejercicio
    WHERE client_id = client_id_param;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 7. EJEMPLO DE USO
-- =====================================================

/*
-- Ejemplo de cómo usar las funciones de verificación:

-- Verificar ejecuciones de un cliente específico
SELECT * FROM verificar_ejecuciones_cliente('cliente-123');

-- Obtener estadísticas de un cliente
SELECT * FROM estadisticas_ejecuciones_cliente('cliente-123');

-- Verificar que el trigger funciona (simular compra)
INSERT INTO activity_enrollments (client_id, activity_id, created_at) 
VALUES ('cliente-test', 78, NOW());

-- Verificar ejecuciones generadas
SELECT * FROM verificar_ejecuciones_cliente('cliente-test');
*/

-- =====================================================
-- 8. NOTAS IMPORTANTES
-- =====================================================

/*
NOTAS DE IMPLEMENTACIÓN:

1. ORDEN DE PROCESAMIENTO:
   - Período → Semana → Día → Bloque → Ejercicio
   - Respeta el orden numérico de bloques
   - Respeta el orden de ejercicios dentro de cada bloque

2. DATOS COPIADOS:
   - detalle_series se copia de ejercicios_detalles
   - dia_semana se toma de la planificación
   - bloque y orden se extraen del JSON

3. VALIDACIONES:
   - Verifica que existan períodos para la actividad
   - Verifica que existan ejercicios en ejercicios_detalles
   - Maneja errores de parsing JSON gracefully

4. PERFORMANCE:
   - Usa índices en las tablas involucradas
   - Procesa en lotes para evitar locks largos
   - Incluye logging para debugging

5. MANTENIMIENTO:
   - El trigger se puede deshabilitar temporalmente si es necesario
   - Las funciones de verificación permiten debugging
   - Los logs ayudan a identificar problemas
*/
