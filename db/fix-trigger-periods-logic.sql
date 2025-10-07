-- 🔧 Script para corregir la lógica de períodos en el trigger
-- Ejecutar en Supabase SQL Editor

-- 1. Verificar períodos actuales
SELECT 
    id,
    activity_id,
    numero_periodo,
    fecha_inicio,
    fecha_fin,
    created_by
FROM periodos_asignados 
WHERE activity_id = 59
ORDER BY numero_periodo;

-- 2. Verificar ejecuciones actuales por período
SELECT 
    ee.periodo_id,
    pa.numero_periodo,
    COUNT(*) as ejecuciones_por_periodo,
    COUNT(DISTINCT ee.ejercicio_id) as ejercicios_unicos
FROM ejecuciones_ejercicio ee
JOIN periodos_asignados pa ON ee.periodo_id = pa.id
WHERE ee.client_id = '00dedc23-0b17-4e50-b84e-b2e8100dc93c'
GROUP BY ee.periodo_id, pa.numero_periodo
ORDER BY pa.numero_periodo;

-- 3. Eliminar trigger actual
DROP TRIGGER IF EXISTS trigger_generate_executions ON activity_enrollments;

-- 4. Eliminar función actual
DROP FUNCTION IF EXISTS generate_exercise_executions();

-- 5. Crear función corregida con lógica de períodos
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
    RAISE NOTICE 'Generando ejecuciones para enrollment ID: %, client_id: %, activity_id: %', NEW.id, NEW.client_id, NEW.activity_id;
    
    -- Obtener períodos de la actividad (ORDENADOS por numero_periodo)
    FOR period_record IN 
      SELECT id, numero_periodo
      FROM periodos_asignados 
      WHERE activity_id = NEW.activity_id
      ORDER BY numero_periodo
    LOOP
      RAISE NOTICE 'Procesando período ID: %, número: %', period_record.id, period_record.numero_periodo;
      
      -- Para cada período, obtener todos los ejercicios de la actividad
      FOR exercise_record IN 
        SELECT id, tipo, nombre_ejercicio
        FROM ejercicios_detalles 
        WHERE activity_id = NEW.activity_id
        ORDER BY id
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
          
          -- Insertar ejecución con el periodo_id correcto
          INSERT INTO ejecuciones_ejercicio (
            periodo_id,
            ejercicio_id,
            client_id,
            intensidad_aplicada,
            completado
          ) VALUES (
            period_record.id,  -- Usar el ID del período actual
            exercise_record.id,
            NEW.client_id,
            default_intensity,
            false
          );
          
          execution_count := execution_count + 1;
          
          RAISE NOTICE 'Ejecución creada: período=%, ejercicio=%, intensidad=%', 
            period_record.numero_periodo, exercise_record.nombre_ejercicio, default_intensity;
        END;
      END LOOP;
    END LOOP;
    
    total_executions := execution_count;
    RAISE NOTICE 'Generadas % ejecuciones para enrollment ID: %, client_id: %', total_executions, NEW.id, NEW.client_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Crear trigger corregido
CREATE TRIGGER trigger_generate_executions
  AFTER INSERT ON activity_enrollments
  FOR EACH ROW
  EXECUTE FUNCTION generate_exercise_executions();

-- 7. Verificar que el trigger se creó
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_generate_executions';

-- 8. Limpiar datos de prueba anteriores
DELETE FROM ejecuciones_ejercicio 
WHERE client_id = '00dedc23-0b17-4e50-b84e-b2e8100dc93c';

DELETE FROM activity_enrollments 
WHERE client_id = '00dedc23-0b17-4e50-b84e-b2e8100dc93c' 
  AND activity_id = 59;

-- 9. Probar el trigger corregido
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

-- 10. Verificar ejecuciones generadas por período
SELECT 
    ee.periodo_id,
    pa.numero_periodo,
    COUNT(*) as ejecuciones_por_periodo,
    COUNT(DISTINCT ee.ejercicio_id) as ejercicios_unicos,
    STRING_AGG(DISTINCT ed.nombre_ejercicio, ', ' ORDER BY ed.nombre_ejercicio) as ejercicios_ejemplo
FROM ejecuciones_ejercicio ee
JOIN periodos_asignados pa ON ee.periodo_id = pa.id
JOIN ejercicios_detalles ed ON ee.ejercicio_id = ed.id
WHERE ee.client_id = '00dedc23-0b17-4e50-b84e-b2e8100dc93c'
GROUP BY ee.periodo_id, pa.numero_periodo
ORDER BY pa.numero_periodo;

-- 11. Verificar total de ejecuciones
SELECT 
    COUNT(*) as total_ejecuciones,
    COUNT(DISTINCT periodo_id) as periodos_unicos,
    COUNT(DISTINCT ejercicio_id) as ejercicios_unicos,
    COUNT(DISTINCT client_id) as clientes_unicos
FROM ejecuciones_ejercicio 
WHERE client_id = '00dedc23-0b17-4e50-b84e-b2e8100dc93c';

-- 12. Mostrar algunas ejecuciones de ejemplo
SELECT 
    ee.id,
    ee.periodo_id,
    pa.numero_periodo,
    ee.ejercicio_id,
    ed.nombre_ejercicio,
    ed.tipo,
    ee.client_id,
    ee.intensidad_aplicada,
    ee.completado
FROM ejecuciones_ejercicio ee
JOIN periodos_asignados pa ON ee.periodo_id = pa.id
JOIN ejercicios_detalles ed ON ee.ejercicio_id = ed.id
WHERE ee.client_id = '00dedc23-0b17-4e50-b84e-b2e8100dc93c'
ORDER BY pa.numero_periodo, ee.ejercicio_id
LIMIT 10;
































