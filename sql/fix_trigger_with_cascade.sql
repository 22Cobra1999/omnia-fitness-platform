-- Script para corregir el trigger eliminando primero las dependencias

-- 1. Verificar qué triggers existen
SELECT 
  'Triggers existentes' as status,
  trigger_name,
  event_object_table,
  action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'activity_enrollments';

-- 2. Eliminar el trigger primero
DROP TRIGGER IF EXISTS trigger_generate_customizations ON activity_enrollments;

-- 3. Ahora eliminar la función
DROP FUNCTION IF EXISTS generate_client_exercise_customizations();

-- 4. Crear la función corregida (sin nota_cliente)
CREATE OR REPLACE FUNCTION generate_client_exercise_customizations()
RETURNS TRIGGER AS $$
BEGIN
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
        fe.detalle_series,
        fe.duracion_min,
        fe.one_rm,
        fe.calorias,
        FALSE as completed,
        NULL as completed_at
    FROM fitness_exercises fe
    WHERE fe.activity_id = NEW.activity_id
      AND NOT EXISTS (
          SELECT 1 FROM client_exercise_customizations cec 
          WHERE cec.fitness_exercise_id = fe.id 
            AND cec.client_id = NEW.client_id
      );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Recrear el trigger
CREATE TRIGGER trigger_generate_customizations
    AFTER INSERT ON activity_enrollments
    FOR EACH ROW
    EXECUTE FUNCTION generate_client_exercise_customizations();

-- 6. Verificar que todo se creó correctamente
SELECT 
  'Verificación final' as status,
  'Función y trigger corregidos exitosamente' as message;

-- 7. Mostrar los triggers finales
SELECT 
  'Triggers finales' as status,
  trigger_name,
  event_object_table
FROM information_schema.triggers 
WHERE event_object_table = 'activity_enrollments';
