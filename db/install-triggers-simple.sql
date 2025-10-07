-- Script simple para instalar triggers corregidos
-- EJECUTAR EN SUPABASE SQL EDITOR

-- 1. Eliminar triggers anteriores
DROP TRIGGER IF EXISTS trigger_generate_executions ON activity_enrollments;
DROP TRIGGER IF EXISTS trigger_update_progress ON ejecuciones_ejercicio;

-- 2. Eliminar funciones anteriores
DROP FUNCTION IF EXISTS generate_exercise_executions_with_replicas();
DROP FUNCTION IF EXISTS update_client_progress();

-- 3. Crear función simple para generar ejecuciones
CREATE OR REPLACE FUNCTION generate_exercise_executions_simple()
RETURNS TRIGGER AS $$
DECLARE
  exercise_record RECORD;
  total_periods INTEGER;
  execution_count INTEGER := 0;
BEGIN
  -- Solo procesar si el status es 'activa'
  IF NEW.status = 'activa' THEN
    
    -- Obtener cantidad de períodos
    SELECT cantidad_periodos INTO total_periods
    FROM periodos 
    WHERE actividad_id = NEW.activity_id
    LIMIT 1;
    
    IF total_periods IS NULL THEN
      total_periods := 1;
    END IF;
    
    -- Generar ejecuciones para cada ejercicio
    FOR exercise_record IN 
      SELECT id, tipo, activity_id
      FROM ejercicios_detalles 
      WHERE activity_id = NEW.activity_id
    LOOP
      
      -- Generar ejecuciones para cada período
      FOR i IN 1..total_periods LOOP
        
        -- Determinar intensidad por defecto
        DECLARE
          default_intensity TEXT;
        BEGIN
          IF exercise_record.tipo = 'fuerza' THEN
            default_intensity := 'Principiante';
          ELSIF exercise_record.tipo = 'cardio' THEN
            default_intensity := 'Moderado';
          ELSE
            default_intensity := 'Descanso';
          END IF;
          
          -- Insertar ejecución
          INSERT INTO ejecuciones_ejercicio (
            ejercicio_id,
            client_id,
            intensidad_aplicada,
            completado,
            fecha_ejecucion,
            semana_original,
            periodo_replica,
            created_at,
            updated_at
          ) VALUES (
            exercise_record.id,
            NEW.client_id,
            default_intensity,
            false,
            CURRENT_DATE + INTERVAL '1 day' * (i - 1),
            i,
            i,
            NOW(),
            NOW()
          );
          
          execution_count := execution_count + 1;
        END;
      END LOOP;
    END LOOP;
    
    -- Log de creación
    RAISE NOTICE '✅ Creadas % ejecuciones para cliente % en actividad %', 
      execution_count, NEW.client_id, NEW.activity_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Crear trigger simple
CREATE TRIGGER trigger_generate_executions_simple
  AFTER INSERT ON activity_enrollments
  FOR EACH ROW
  EXECUTE FUNCTION generate_exercise_executions_simple();

-- 5. Verificar instalación
SELECT 
  'TRIGGER INSTALADO' as seccion,
  trigger_name,
  event_manipulation
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_generate_executions_simple';
