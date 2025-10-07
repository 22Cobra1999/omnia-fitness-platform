-- 🔍 Script para debuggear exactamente qué está pasando con el trigger
-- Ejecutar en Supabase SQL Editor

-- 1. Verificar estado actual después del script anterior
SELECT 
    COUNT(*) as total_ejecuciones,
    COUNT(CASE WHEN client_id IS NOT NULL THEN 1 END) as con_client_id,
    COUNT(CASE WHEN client_id IS NULL THEN 1 END) as sin_client_id
FROM ejecuciones_ejercicio;

-- 2. Si hay ejecuciones, ver la distribución
SELECT 
    ee.periodo_id,
    pa.numero_periodo,
    COUNT(*) as total_por_periodo,
    COUNT(CASE WHEN ee.client_id IS NOT NULL THEN 1 END) as con_client_id,
    COUNT(CASE WHEN ee.client_id IS NULL THEN 1 END) as sin_client_id
FROM ejecuciones_ejercicio ee
LEFT JOIN periodos_asignados pa ON ee.periodo_id = pa.id
GROUP BY ee.periodo_id, pa.numero_periodo
ORDER BY ee.periodo_id;

-- 3. ELIMINAR COMPLETAMENTE TODO
DROP TRIGGER IF EXISTS trigger_generate_executions ON activity_enrollments;
DROP FUNCTION IF EXISTS generate_exercise_executions();

-- 4. Limpiar TODAS las ejecuciones
DELETE FROM ejecuciones_ejercicio;

-- 5. Limpiar enrollments de prueba
DELETE FROM activity_enrollments 
WHERE client_id = '00dedc23-0b17-4e50-b84e-b2e8100dc93c' 
  AND activity_id = 59;

-- 6. Verificar que está limpio
SELECT 
    COUNT(*) as ejecuciones_restantes,
    COUNT(*) as enrollments_restantes
FROM ejecuciones_ejercicio, activity_enrollments 
WHERE activity_enrollments.client_id = '00dedc23-0b17-4e50-b84e-b2e8100dc93c';

-- 7. Crear función SIMPLE y LIMPIA
CREATE OR REPLACE FUNCTION generate_exercise_executions()
RETURNS TRIGGER AS $$
DECLARE
  exercise_record RECORD;
  period_record RECORD;
  execution_count INTEGER := 0;
BEGIN
  -- Solo procesar si el status es 'activa'
  IF NEW.status = 'activa' THEN
    
    -- Obtener períodos de la actividad
    FOR period_record IN 
      SELECT id, numero_periodo
      FROM periodos_asignados 
      WHERE activity_id = NEW.activity_id
      ORDER BY numero_periodo
    LOOP
      
      -- Para cada período, obtener ejercicios de la actividad
      FOR exercise_record IN 
        SELECT id, tipo
        FROM ejercicios_detalles 
        WHERE activity_id = NEW.activity_id
        ORDER BY id
      LOOP
        
        -- Determinar intensidad
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
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Crear trigger SIMPLE
CREATE TRIGGER trigger_generate_executions
  AFTER INSERT ON activity_enrollments
  FOR EACH ROW
  EXECUTE FUNCTION generate_exercise_executions();

-- 9. Verificar que se creó
SELECT 
  trigger_name,
  event_manipulation,
  action_timing
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_generate_executions';

-- 10. Probar UNA SOLA VEZ
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

-- 11. Verificar resultado INMEDIATAMENTE
SELECT 
    COUNT(*) as total_ejecuciones,
    COUNT(CASE WHEN client_id IS NOT NULL THEN 1 END) as con_client_id,
    COUNT(CASE WHEN client_id IS NULL THEN 1 END) as sin_client_id
FROM ejecuciones_ejercicio;

-- 12. Verificar distribución por período
SELECT 
    ee.periodo_id,
    pa.numero_periodo,
    COUNT(*) as ejecuciones_por_periodo,
    COUNT(CASE WHEN ee.client_id IS NOT NULL THEN 1 END) as con_client_id,
    COUNT(CASE WHEN ee.client_id IS NULL THEN 1 END) as sin_client_id
FROM ejecuciones_ejercicio ee
JOIN periodos_asignados pa ON ee.periodo_id = pa.id
GROUP BY ee.periodo_id, pa.numero_periodo
ORDER BY ee.periodo_id;

-- 13. Mostrar algunas ejecuciones
SELECT 
    ee.id,
    ee.periodo_id,
    pa.numero_periodo,
    ee.ejercicio_id,
    ee.client_id,
    ee.intensidad_aplicada
FROM ejecuciones_ejercicio ee
JOIN periodos_asignados pa ON ee.periodo_id = pa.id
WHERE ee.client_id = '00dedc23-0b17-4e50-b84e-b2e8100dc93c'
ORDER BY ee.periodo_id, ee.ejercicio_id
LIMIT 10;

-- 14. Verificar enrollments
SELECT 
    id,
    activity_id,
    client_id,
    status,
    created_at
FROM activity_enrollments 
WHERE client_id = '00dedc23-0b17-4e50-b84e-b2e8100dc93c'
ORDER BY created_at DESC;
































