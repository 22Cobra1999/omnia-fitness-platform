CREATE OR REPLACE FUNCTION get_client_daily_activities(p_client_id uuid, p_date date)
RETURNS TABLE (
    activity_id_out bigint,
    activity_title_out text,
    fitness_nombre_out text,
    nutrition_comida_out text,
    coach_name_out text,
    origen_out text,
    activity_type_out text,
    is_completed_out boolean,
    completed_at_out timestamp with time zone,
    detail_id_out bigint,
    week_out integer,
    day_out integer
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ae.activity_id AS activity_id_out,
        a.title AS activity_title_out,
        fpd.nombre_actividad AS fitness_nombre_out,
        npd.comida AS nutrition_comida_out,
        c.full_name AS coach_name_out,
        CASE
            WHEN fpd.id IS NOT NULL THEN 'fitness'
            WHEN npd.id IS NOT NULL THEN 'nutrition'
            ELSE 'unknown'
        END AS origen_out,
        a.type AS activity_type_out,
        COALESCE(fpd.completed, npd.completed, false) AS is_completed_out,
        COALESCE(fpd.completed_at, npd.completed_at) AS completed_at_out,
        COALESCE(fpd.id, npd.id) AS detail_id_out,
        COALESCE(fpd.semana, npd.semana) AS week_out,
        COALESCE(fpd.día, npd.día) AS day_out
    FROM
        activity_enrollments ae
    JOIN
        activities a ON ae.activity_id = a.id
    LEFT JOIN
        fitness_exercises fpd ON ae.activity_id = fpd.activity_id AND fpd.scheduled_date = p_date
    LEFT JOIN
        nutrition_program_details npd ON ae.id = npd.enrollment_id AND npd.scheduled_date = p_date
    LEFT JOIN
        coaches c ON a.coach_id = c.id
    WHERE
        ae.client_id = p_client_id
        AND ae.status = 'active' -- Only active enrollments
        AND (fpd.id IS NOT NULL OR npd.id IS NOT NULL) -- Ensure at least one detail matches the date
    ORDER BY
        COALESCE(fpd.semana, npd.semana),
        COALESCE(fpd.día, npd.día),
        fpd.id, npd.id; -- Order by detail ID for consistent ordering
END;
$$ LANGUAGE plpgsql STABLE;
