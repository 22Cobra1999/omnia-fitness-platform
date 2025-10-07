-- 🔧 Script para corregir el trigger y el client_id
-- Ejecutar en Supabase SQL Editor

-- 1. Verificar ejecuciones actuales
SELECT 
    COUNT(*) as total_ejecuciones,
    COUNT(DISTINCT client_id) as clientes_unicos,
    COUNT(CASE WHEN client_id IS NULL THEN 1 END) as ejecuciones_sin_client_id
FROM ejecuciones_ejercicio;

-- 2. Mostrar algunas ejecuciones problemáticas
SELECT 
    id,
    periodo_id,
    ejercicio_id,
    client_id,
    intensidad_aplicada,
    completado
FROM ejecuciones_ejercicio 
WHERE client_id IS NULL
LIMIT 10;

-- 3. Eliminar trigger actual
DROP TRIGGER IF EXISTS trigger_generate_executions ON activity_enrollments;

-- 4. Eliminar función actual
DROP FUNCTION IF EXISTS generate_exercise_executions();

-- 5. Crear función corregida
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
    RAISE NOTICE 'Generando ejecuciones para enrollment ID: %, client_id: %', NEW.id, NEW.client_id;
    
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
          
          -- Insertar ejecución con client_id correcto
          INSERT INTO ejecuciones_ejercicio (
            periodo_id,
            ejercicio_id,
            client_id,
            intensidad_aplicada,
            completado
          ) VALUES (
            period_record.id,
            exercise_record.id,
            NEW.client_id,  -- Usar NEW.client_id del trigger
            default_intensity,
            false
          );
          
          execution_count := execution_count + 1;
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

-- 7. Limpiar ejecuciones sin client_id
DELETE FROM ejecuciones_ejercicio WHERE client_id IS NULL;

-- 8. Verificar que se limpiaron
SELECT 
    COUNT(*) as total_ejecuciones,
    COUNT(DISTINCT client_id) as clientes_unicos,
    COUNT(CASE WHEN client_id IS NULL THEN 1 END) as ejecuciones_sin_client_id
FROM ejecuciones_ejercicio;

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

-- 10. Verificar que se generaron ejecuciones con client_id correcto
SELECT 
    COUNT(*) as ejecuciones_generadas,
    COUNT(DISTINCT client_id) as clientes_unicos,
    client_id
FROM ejecuciones_ejercicio 
WHERE client_id = '00dedc23-0b17-4e50-b84e-b2e8100dc93c'
GROUP BY client_id;

-- 11. Mostrar algunas ejecuciones generadas
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

-- 12. Limpiar enrollment de prueba
DELETE FROM activity_enrollments 
WHERE client_id = '00dedc23-0b17-4e50-b84e-b2e8100dc93c' 
  AND activity_id = 59 
  AND created_at > NOW() - INTERVAL '1 minute';

-- 13. Limpiar ejecuciones de prueba (mantener solo las originales)
DELETE FROM ejecuciones_ejercicio 
WHERE client_id = '00dedc23-0b17-4e50-b84e-b2e8100dc93c'
  AND id > (
    SELECT MAX(id) - 38 
    FROM ejecuciones_ejercicio 
    WHERE client_id = '00dedc23-0b17-4e50-b84e-b2e8100dc93c'
  );































