-- Script para corregir el trigger de client_exercise_customizations

-- 1. Verificar la estructura actual de la tabla
SELECT 
  'Estructura actual de client_exercise_customizations' as status,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'client_exercise_customizations'
ORDER BY ordinal_position;

-- 2. Ver la función problemática
SELECT 
  'Función problemática' as status,
  routine_name,
  routine_definition
FROM information_schema.routines 
WHERE routine_name = 'generate_client_exercise_customizations';

-- 3. Eliminar la función problemática si existe
DROP FUNCTION IF EXISTS generate_client_exercise_customizations();

-- 4. Crear la función corregida (sin la columna nota_cliente)
CREATE OR REPLACE FUNCTION generate_client_exercise_customizations()
RETURNS TRIGGER AS $$
BEGIN
    -- Insertar personalizaciones para todos los ejercicios de la actividad
    INSERT INTO client_exercise_customizations (
        fitness_exercise_id,
        client_id,
        detalle_series,
        duracion_min,
        one_rm,
        calorias,
        completed,
        completed_at
    )
    SELECT 
        fe.id as fitness_exercise_id,
        NEW.client_id,
        fe.detalle_series,                     -- Copiar detalle_series del ejercicio genérico
        fe.duracion_min,                       -- Copiar duración del ejercicio genérico
        fe.one_rm,                             -- Copiar 1RM del ejercicio genérico
        fe.calorias,                           -- Copiar calorías del ejercicio genérico
        FALSE as completed,                    -- Inicializar como no completado
        NULL as completed_at                   -- Inicializar como NULL
    FROM fitness_exercises fe
    WHERE fe.activity_id = NEW.activity_id
      AND NOT EXISTS (
          -- Evitar duplicados si ya existe una personalización
          SELECT 1 FROM client_exercise_customizations cec 
          WHERE cec.fitness_exercise_id = fe.id 
            AND cec.client_id = NEW.client_id
      );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Verificar si hay triggers que usan esta función
SELECT 
  'Triggers que usan la función' as status,
  trigger_name,
  event_object_table,
  action_statement
FROM information_schema.triggers 
WHERE action_statement ILIKE '%generate_client_exercise_customizations%';

-- 6. Recrear el trigger si es necesario
-- Primero eliminar el trigger existente
DROP TRIGGER IF EXISTS trigger_generate_client_exercise_customizations ON activity_enrollments;

-- Crear el trigger corregido
CREATE TRIGGER trigger_generate_client_exercise_customizations
    AFTER INSERT ON activity_enrollments
    FOR EACH ROW
    EXECUTE FUNCTION generate_client_exercise_customizations();

-- 7. Verificar que todo esté funcionando
SELECT 
  'Verificación final' as status,
  'Función creada correctamente' as message;

-- 8. Mostrar la estructura final de la tabla
SELECT 
  'Estructura final de client_exercise_customizations' as status,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'client_exercise_customizations'
ORDER BY ordinal_position;
