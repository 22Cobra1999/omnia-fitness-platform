-- Función para actualizar el rating del coach basado en la vista materializada
-- Esta función se ejecuta después de que la vista activity_program_stats se refresca,
-- asegurando que los ratings de los coaches se basen en los datos más recientes de las actividades.
CREATE OR REPLACE FUNCTION update_coach_rating_stats() 
RETURNS TRIGGER AS $$
BEGIN
    -- Actualizar ratings de coaches usando la vista materializada activity_program_stats
    -- La columna avg_rating en activity_program_stats ya debería reflejar el promedio
    -- de coach_method_rating de los surveys asociados a esa actividad.
    UPDATE coaches 
    SET 
        rating = COALESCE((
            SELECT AVG(aps.avg_rating)
            FROM activity_program_stats aps
            JOIN activities a ON aps.activity_id = a.id
            WHERE a.coach_id = coaches.id
        ), 0.00),
        total_reviews = COALESCE((
            SELECT SUM(aps.total_reviews)
            FROM activity_program_stats aps
            JOIN activities a ON aps.activity_id = a.id
            WHERE a.coach_id = coaches.id
        ), 0)
    WHERE id IN (
        SELECT DISTINCT a.coach_id
        FROM activities a
        JOIN activity_program_stats aps ON aps.activity_id = a.id
    );
    
    RETURN NULL; -- Los triggers AFTER STATEMENT deben retornar NULL
END;
$$ LANGUAGE plpgsql;
