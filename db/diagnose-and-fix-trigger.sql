-- 🔍 Script para diagnosticar y corregir el problema del trigger
-- Ejecutar en Supabase SQL Editor

-- 1. Diagnosticar el problema actual
SELECT 
    COUNT(*) as total_ejecuciones,
    COUNT(CASE WHEN client_id IS NOT NULL THEN 1 END) as con_client_id,
    COUNT(CASE WHEN client_id IS NULL THEN 1 END) as sin_client_id,
    COUNT(DISTINCT client_id) as clientes_unicos
FROM ejecuciones_ejercicio;

-- 2. Verificar ejecuciones por período
SELECT 
    ee.periodo_id,
    pa.numero_periodo,
    COUNT(*) as ejecuciones_por_periodo,
    COUNT(CASE WHEN ee.client_id IS NOT NULL THEN 1 END) as con_client_id,
    COUNT(CASE WHEN ee.client_id IS NULL THEN 1 END) as sin_client_id
FROM ejecuciones_ejercicio ee
LEFT JOIN periodos_asignados pa ON ee.periodo_id = pa.id
GROUP BY ee.periodo_id, pa.numero_periodo
ORDER BY ee.periodo_id;

-- 3. Verificar enrollments
SELECT 
    id,
    activity_id,
    client_id,
    status,
    created_at
FROM activity_enrollments 
WHERE client_id = '00dedc23-0b17-4e50-b84e-b2e8100dc93c'
ORDER BY created_at DESC;

-- 4. Verificar triggers existentes
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name LIKE '%generate_executions%';

-- 5. Verificar funciones existentes
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_name LIKE '%generate_exercise_executions%';

-- 6. ELIMINAR TODOS LOS TRIGGERS Y FUNCIONES
DROP TRIGGER IF EXISTS trigger_generate_executions ON activity_enrollments;
DROP FUNCTION IF EXISTS generate_exercise_executions();

-- 7. LIMPIAR TODAS LAS EJECUCIONES
DELETE FROM ejecuciones_ejercicio;

-- 8. Crear función CORRECTA
CREATE OR REPLACE FUNCTION generate_exercise_executions()
RETURNS TRIGGER AS $$
DECLARE
  exercise_record RECORD;
  period_record RECORD;
  execution_count INTEGER := 0;
BEGIN
  -- Solo procesar si el status es 'activa'
  IF NEW.status = 'activa' THEN
    RAISE NOTICE '=== INICIANDO GENERACIÓN DE EJECUCIONES ===';
    RAISE NOTICE 'Enrollment ID: %, Client ID: %, Activity ID: %', NEW.id, NEW.client_id, NEW.activity_id;
    
    -- Obtener períodos de la actividad
    FOR period_record IN 
      SELECT id, numero_periodo
      FROM periodos_asignados 
      WHERE activity_id = NEW.activity_id
      ORDER BY numero_periodo
    LOOP
      RAISE NOTICE 'Procesando período ID: %, número: %', period_record.id, period_record.numero_periodo;
      
      -- Para cada período, obtener TODOS los ejercicios de la actividad
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
    
    RAISE NOTICE '=== GENERACIÓN COMPLETADA ===';
    RAISE NOTICE 'Total ejecuciones creadas: %', execution_count;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. Crear trigger CORRECTO
CREATE TRIGGER trigger_generate_executions
  AFTER INSERT ON activity_enrollments
  FOR EACH ROW
  EXECUTE FUNCTION generate_exercise_executions();

-- 10. Verificar que se creó correctamente
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_generate_executions';

-- 11. Probar el trigger corregido
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

-- 12. Verificar resultado
SELECT 
    COUNT(*) as total_ejecuciones,
    COUNT(CASE WHEN client_id IS NOT NULL THEN 1 END) as con_client_id,
    COUNT(CASE WHEN client_id IS NULL THEN 1 END) as sin_client_id,
    COUNT(DISTINCT client_id) as clientes_unicos
FROM ejecuciones_ejercicio;

-- 13. Verificar distribución por período
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

-- 14. Mostrar algunas ejecuciones de ejemplo
SELECT 
    ee.id,
    ee.periodo_id,
    pa.numero_periodo,
    ee.ejercicio_id,
    ed.nombre_ejercicio,
    ed.tipo,
    ee.client_id,
    ee.intensidad_aplicada
FROM ejecuciones_ejercicio ee
JOIN periodos_asignados pa ON ee.periodo_id = pa.id
JOIN ejercicios_detalles ed ON ee.ejercicio_id = ed.id
WHERE ee.client_id = '00dedc23-0b17-4e50-b84e-b2e8100dc93c'
ORDER BY pa.numero_periodo, ee.ejercicio_id
LIMIT 10;
































