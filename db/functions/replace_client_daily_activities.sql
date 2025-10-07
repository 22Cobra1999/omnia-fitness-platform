-- First, drop the existing function
DROP FUNCTION IF EXISTS get_client_daily_activities(uuid, date);

-- Then create the new function with the correct table references
CREATE OR REPLACE FUNCTION get_client_daily_activities(p_client_id uuid, p_date date)
RETURNS TABLE (
    activity_id_out bigint,
    activity_title_out text,
    fitness_nombre_out text,
    fitness_descripcion_out text,
    nutrition_comida_out text,
    nutrition_nombre_out text,
    coach_name_out text,
    origen_out text,
    activity_type_out text,
    is_completed_out boolean,
    completed_at_out timestamp with time zone,
    detail_id_out bigint,
    fitness_detail_id_out bigint,
    nutrition_detail_id_out bigint,
    semana_out integer,
    dia_out text,
    enrollment_id_out bigint
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ae.activity_id AS activity_id_out,
        a.title AS activity_title_out,
        fe.nombre_actividad AS fitness_nombre_out,
        fe.descripción AS fitness_descripcion_out,
        npd.comida AS nutrition_comida_out,
        npd.nombre AS nutrition_nombre_out,
        up.full_name AS coach_name_out,
        CASE
            WHEN fe.id IS NOT NULL THEN 'fitness_program'
            WHEN npd.id IS NOT NULL THEN 'nutrition_program'
            ELSE 'unknown'
        END AS origen_out,
        a.type AS activity_type_out,
        COALESCE(fe.completed, npd.completed, false) AS is_completed_out,
        COALESCE(fe.completed_at, npd.completed_at) AS completed_at_out,
        COALESCE(fe.id, npd.id) AS detail_id_out,
        fe.id AS fitness_detail_id_out,
        npd.id AS nutrition_detail_id_out,
        COALESCE(fe.semana, npd.semana) AS semana_out,
        COALESCE(fe.día::text, npd.día::text) AS dia_out,
        ae.id AS enrollment_id_out
    FROM
        activity_enrollments ae
    JOIN
        activities a ON ae.activity_id = a.id
    LEFT JOIN
        fitness_exercises fe ON ae.activity_id = fe.activity_id 
        AND fe.client_id = p_client_id
        AND (fe.scheduled_date = p_date OR fe.scheduled_date IS NULL)
    LEFT JOIN
        nutrition_program_details npd ON ae.activity_id = npd.activity_id 
        AND npd.client_id = p_client_id
        AND (npd.scheduled_date = p_date OR npd.scheduled_date IS NULL)
    LEFT JOIN
        user_profiles up ON a.coach_id = up.id
    WHERE
        ae.client_id = p_client_id
        AND ae.status = 'active' -- Only active enrollments
        AND (fe.id IS NOT NULL OR npd.id IS NOT NULL) -- Ensure at least one detail exists
    ORDER BY
        COALESCE(fe.semana, npd.semana),
        COALESCE(fe.día::text, npd.día::text),
        fe.id, npd.id; -- Order by detail ID for consistent ordering
END;
$$ LANGUAGE plpgsql STABLE;

-- Verify the function was created successfully
SELECT '✅ Función get_client_daily_activities actualizada exitosamente' as resultado;




