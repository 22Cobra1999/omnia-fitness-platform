-- Script completo para crear el trigger que genera períodos y ejecuciones
-- Ejecutar en Supabase SQL Editor después de poblar ejercicios_detalles

-- 1. Crear función trigger principal
CREATE OR REPLACE FUNCTION generate_periods_and_executions_trigger()
RETURNS TRIGGER AS $$
DECLARE
    activity_record RECORD;
    exercise_record RECORD;
    period_record RECORD;
    total_executions INTEGER := 0;
    program_duration INTEGER := 8; -- Default 8 semanas
    periods_created INTEGER := 0;
BEGIN
    -- Obtener información de la actividad
    SELECT 
        a.id, a.title, a.type, a.coach_id
    INTO activity_record
    FROM activities a
    WHERE a.id = NEW.activity_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Actividad % no encontrada', NEW.activity_id;
    END IF;
    
    RAISE NOTICE 'Procesando enrollment % para actividad % (coach: %)', 
        NEW.id, activity_record.id, activity_record.coach_id;
    
    -- Determinar duración del programa basada en el título
    IF activity_record.title LIKE '%8 semanas%' THEN
        program_duration := 8;
    ELSIF activity_record.title LIKE '%4 semanas%' THEN
        program_duration := 4;
    ELSIF activity_record.title LIKE '%12 semanas%' THEN
        program_duration := 12;
    END IF;
    
    RAISE NOTICE 'Duración del programa: % semanas', program_duration;
    
    -- PASO 1: Crear períodos si no existen (solo una vez por actividad)
    -- Verificar si ya existen períodos para esta actividad
    IF NOT EXISTS (
        SELECT 1 FROM periodos_asignados 
        WHERE activity_id = NEW.activity_id
    ) THEN
        RAISE NOTICE 'Creando períodos para actividad %', NEW.activity_id;
        
        -- Crear períodos con coach_id en created_by
        FOR i IN 1..program_duration LOOP
            INSERT INTO periodos_asignados (
                activity_id,
                numero_periodo,
                fecha_inicio,
                fecha_fin,
                created_by
            ) VALUES (
                NEW.activity_id,
                i,
                CURRENT_DATE + (i-1) * INTERVAL '7 days',
                CURRENT_DATE + i * INTERVAL '7 days' - INTERVAL '1 day',
                activity_record.coach_id  -- coach_id en created_by
            );
            
            periods_created := periods_created + 1;
            RAISE NOTICE 'Creado período % para actividad %', i, NEW.activity_id;
        END LOOP;
        
        RAISE NOTICE 'Creados % períodos para actividad %', periods_created, NEW.activity_id;
    ELSE
        RAISE NOTICE 'Períodos ya existen para actividad %', NEW.activity_id;
    END IF;
    
    -- PASO 2: Generar ejecuciones para cada ejercicio en cada período
    FOR exercise_record IN 
        SELECT id, nombre_ejercicio, tipo
        FROM ejercicios_detalles 
        WHERE activity_id = NEW.activity_id
    LOOP
        -- PASO 3: Obtener períodos (existentes o recién creados)
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
                ELSIF exercise_record.tipo = 'descanso' THEN
                    default_intensity := 'Descanso';
                END IF;
                
                -- Crear ejecución con client_id
                INSERT INTO ejecuciones_ejercicio (
                    periodo_id,
                    ejercicio_id,
                    client_id,  -- client_id específico del cliente
                    intensidad_aplicada,
                    completado
                ) VALUES (
                    period_record.id,
                    exercise_record.id,
                    NEW.client_id,  -- client_id del enrollment
                    default_intensity,
                    false
                );
                
                total_executions := total_executions + 1;
            END;
        END LOOP;
    END LOOP;
    
    RAISE NOTICE 'Generadas % ejecuciones para enrollment % (cliente: %)', 
        total_executions, NEW.id, NEW.client_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Eliminar trigger anterior si existe
DROP TRIGGER IF EXISTS trigger_generate_executions ON activity_enrollments;
DROP TRIGGER IF EXISTS trigger_generate_periods_and_executions ON activity_enrollments;

-- 3. Crear nuevo trigger
CREATE TRIGGER trigger_generate_periods_and_executions
    AFTER INSERT ON activity_enrollments
    FOR EACH ROW
    WHEN (NEW.status = 'activa')
    EXECUTE FUNCTION generate_periods_and_executions_trigger();

-- 4. Comentarios explicativos
COMMENT ON FUNCTION generate_periods_and_executions_trigger() IS 
'Genera automáticamente períodos (con coach_id) y ejecuciones (con client_id) cuando se crea un nuevo enrollment activo';

COMMENT ON TRIGGER trigger_generate_periods_and_executions ON activity_enrollments IS 
'Se ejecuta después de insertar un enrollment con status activa para generar períodos y ejecuciones correspondientes';

-- 5. Verificar que el trigger esté creado
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_generate_periods_and_executions';

-- 6. Verificar estructura de tablas
SELECT 
    'periodos_asignados' as tabla,
    COUNT(*) as registros
FROM periodos_asignados
WHERE activity_id = 59

UNION ALL

SELECT 
    'ejercicios_detalles' as tabla,
    COUNT(*) as registros
FROM ejercicios_detalles
WHERE activity_id = 59

UNION ALL

SELECT 
    'ejecuciones_ejercicio' as tabla,
    COUNT(*) as registros
FROM ejecuciones_ejercicio ee
JOIN periodos_asignados pa ON pa.id = ee.periodo_id
WHERE pa.activity_id = 59;
































