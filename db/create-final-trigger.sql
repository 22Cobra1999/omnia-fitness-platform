-- 🚀 SCRIPT FINAL: Crear trigger para automatizar ejecuciones
-- Ejecutar en Supabase SQL Editor

-- 1. Crear función para generar ejecuciones
CREATE OR REPLACE FUNCTION generate_exercise_executions()
RETURNS TRIGGER AS $$
DECLARE
  exercise_record RECORD;
  period_record RECORD;
  execution_count INTEGER := 0;
  total_executions INTEGER := 0;
BEGIN
  -- Solo procesar si el status es 'activa'
  IF NEW.status = 'activa' THEN
    RAISE NOTICE 'Generando ejecuciones para enrollment ID: %', NEW.id;
    
    -- Obtener ejercicios de la actividad
    FOR exercise_record IN 
      SELECT id, tipo
      FROM ejercicios_detalles 
      WHERE activity_id = NEW.activity_id
    LOOP
      -- Obtener períodos de la actividad
      FOR period_record IN 
        SELECT id
        FROM periodos_asignados 
        WHERE activity_id = NEW.activity_id
      LOOP
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
            periodo_id,
            ejercicio_id,
            client_id,
            intensidad_aplicada,
            completado
          ) VALUES (
            period_record.id,
            exercise_record.id,
            NEW.client_id,
            default_intensity,
            false
          );
          
          execution_count := execution_count + 1;
        END;
      END LOOP;
    END LOOP;
    
    total_executions := execution_count;
    RAISE NOTICE 'Generadas % ejecuciones para enrollment ID: %', total_executions, NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Eliminar trigger existente si existe
DROP TRIGGER IF EXISTS trigger_generate_executions ON activity_enrollments;

-- 3. Crear trigger
CREATE TRIGGER trigger_generate_executions
  AFTER INSERT ON activity_enrollments
  FOR EACH ROW
  EXECUTE FUNCTION generate_exercise_executions();

-- 4. Verificar que el trigger se creó
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_generate_executions';

-- 5. Verificar que la función se creó
SELECT 
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines 
WHERE routine_name = 'generate_exercise_executions';

-- 6. Probar el trigger creando un enrollment de prueba
INSERT INTO activity_enrollments (
  activity_id,
  client_id,
  status,
  payment_status,
  amount_paid,
  created_at,
  updated_at
) VALUES (
  59,
  '00dedc23-0b17-4e50-b84e-b2e8100dc93c',
  'activa',
  'paid',
  0,
  NOW(),
  NOW()
);

-- 7. Verificar que se generaron ejecuciones automáticamente
SELECT 
  COUNT(*) as ejecuciones_generadas,
  COUNT(DISTINCT client_id) as clientes_unicos,
  COUNT(DISTINCT periodo_id) as periodos_unicos,
  COUNT(DISTINCT ejercicio_id) as ejercicios_unicos
FROM ejecuciones_ejercicio 
WHERE client_id = '00dedc23-0b17-4e50-b84e-b2e8100dc93c';

-- 8. Mostrar algunas ejecuciones generadas
SELECT 
  ee.id,
  ee.periodo_id,
  ee.ejercicio_id,
  ee.client_id,
  ee.intensidad_aplicada,
  ee.completado,
  ed.nombre_ejercicio,
  ed.tipo
FROM ejecuciones_ejercicio ee
JOIN ejercicios_detalles ed ON ee.ejercicio_id = ed.id
WHERE ee.client_id = '00dedc23-0b17-4e50-b84e-b2e8100dc93c'
ORDER BY ee.id
LIMIT 10;

-- 9. Limpiar enrollment de prueba
DELETE FROM activity_enrollments 
WHERE client_id = '00dedc23-0b17-4e50-b84e-b2e8100dc93c' 
  AND activity_id = 59 
  AND created_at > NOW() - INTERVAL '1 minute';

-- 10. Limpiar ejecuciones de prueba
DELETE FROM ejecuciones_ejercicio 
WHERE client_id = '00dedc23-0b17-4e50-b84e-b2e8100dc93c' 
  AND id NOT IN (
    SELECT id FROM ejecuciones_ejercicio 
    WHERE client_id = '00dedc23-0b17-4e50-b84e-b2e8100dc93c'
    ORDER BY id
    LIMIT 38
  );

































