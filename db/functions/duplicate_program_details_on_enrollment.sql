-- Drop the trigger if it exists to avoid errors when recreating
DROP TRIGGER IF EXISTS trg_duplicate_program_details ON activity_enrollments;

-- Drop the function if it exists to allow recreation
DROP FUNCTION IF EXISTS duplicate_program_details_for_client();

-- Function to duplicate program details for a client upon enrollment
CREATE OR REPLACE FUNCTION duplicate_program_details_for_client()
RETURNS TRIGGER AS $$
DECLARE
    v_activity_type TEXT;
    v_coach_id UUID;
BEGIN
    -- Get the activity type and coach_id from the activities table
    SELECT type, coach_id INTO v_activity_type, v_coach_id
    FROM activities
    WHERE id = NEW.activity_id;

    IF v_activity_type = 'fitness_program' THEN
        INSERT INTO fitness_program_details (
            día, semana, nombre_actividad, descripción, duración, tipo_ejercicio,
            repeticiones, intervalos_secs, descanso, peso, nivel_intensidad,
            equipo_necesario, rm, coach_id, activity_id, created_at, updated_at,
            video, series, completed, completed_at, calorias_consumidas,
            intevalos_cant, nota_cliente, client_id, scheduled_date, video_url
        )
        SELECT
            fpd.día, fpd.semana, fpd.nombre_actividad, fpd.descripción, fpd.duración, fpd.tipo_ejercicio,
            fpd.repeticiones, fpd.intervalos_secs, fpd.descanso, fpd.peso, fpd.nivel_intensidad,
            fpd.equipo_necesario, fpd.rm, v_coach_id, NEW.activity_id, NOW(), NOW(),
            fpd.video, fpd.series, FALSE, NULL, fpd.calorias_consumidas,
            fpd.intevalos_cant, NULL, NEW.client_id, NULL, fpd.video_url
        FROM fitness_program_details fpd
        WHERE fpd.activity_id = NEW.activity_id AND fpd.client_id IS NULL; -- Only duplicate template rows
    ELSIF v_activity_type = 'nutrition_program' THEN
        INSERT INTO nutrition_program_details (
            día, semana, comida, nombre, calorías, proteínas, carbohidratos, peso,
            receta_id, coach_id, activity_id, created_at, updated_at, video,
            completed, completed_at, client_id, scheduled_date, video_url
        )
        SELECT
            npd.día, npd.semana, npd.comida, npd.nombre, npd.calorías, npd.proteínas, npd.carbohidratos, npd.peso,
            npd.receta_id, npd.coach_id, NEW.activity_id, NOW(), NOW(), npd.video,
            FALSE, NULL, NEW.client_id, NULL, npd.video_url
        FROM nutrition_program_details npd
        WHERE npd.activity_id = NEW.activity_id AND npd.client_id IS NULL; -- Only duplicate template rows
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
CREATE TRIGGER trg_duplicate_program_details
AFTER INSERT ON activity_enrollments
FOR EACH ROW
EXECUTE FUNCTION duplicate_program_details_for_client();
