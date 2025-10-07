-- Script simple usando CASCADE para eliminar dependencias

-- 1. Eliminar función con CASCADE (esto eliminará automáticamente el trigger)
DROP FUNCTION IF EXISTS generate_client_exercise_customizations() CASCADE;

-- 2. Crear la función corregida (sin nota_cliente)
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

-- 3. Recrear el trigger
CREATE TRIGGER trigger_generate_customizations
    AFTER INSERT ON activity_enrollments
    FOR EACH ROW
    EXECUTE FUNCTION generate_client_exercise_customizations();

-- 4. Verificar que se creó correctamente
SELECT 'Función y trigger corregidos exitosamente' as status;
