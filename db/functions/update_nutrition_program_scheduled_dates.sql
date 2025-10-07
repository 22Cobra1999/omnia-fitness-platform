-- Drop the function if it exists to allow recreation
DROP FUNCTION IF EXISTS update_nutrition_program_scheduled_dates(integer, uuid, date);

CREATE OR REPLACE FUNCTION update_nutrition_program_scheduled_dates(
    p_activity_id INTEGER,
    p_client_id UUID,
    p_start_date DATE
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
    r RECORD;
    v_scheduled_date DATE;
BEGIN
    FOR r IN
        SELECT id, día, semana
        FROM nutrition_program_details
        WHERE activity_id = p_activity_id
          AND client_id = p_client_id
          AND scheduled_date IS NULL
    LOOP
        -- Calculate scheduled_date
        v_scheduled_date := p_start_date + ((r.semana - 1) * 7 + (r.día - 1)) * INTERVAL '1 day';

        -- Update the row
        UPDATE nutrition_program_details
        SET scheduled_date = v_scheduled_date
        WHERE id = r.id;
    END LOOP;
END;
$$;
