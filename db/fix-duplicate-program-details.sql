-- This script helps to remove duplicate entries in fitness_program_details and nutrition_program_details
-- that might have occurred due to previous issues, allowing unique constraints to be applied.

-- For fitness_program_details
DELETE FROM fitness_program_details
WHERE id IN (
    SELECT id
    FROM (
        SELECT
            id,
            ROW_NUMBER() OVER (PARTITION BY activity_id, día, semana, client_id ORDER BY id) as rn
        FROM
            fitness_program_details
        WHERE client_id IS NOT NULL -- Only consider client-specific duplicated rows
    ) t
    WHERE t.rn > 1
);

-- For nutrition_program_details
DELETE FROM nutrition_program_details
WHERE id IN (
    SELECT id
    FROM (
        SELECT
            id,
            ROW_NUMBER() OVER (PARTITION BY activity_id, día, semana, client_id ORDER BY id) as rn
        FROM
            nutrition_program_details
        WHERE client_id IS NOT NULL -- Only consider client-specific duplicated rows
    ) t
    WHERE t.rn > 1
);

-- Optional: If you also have duplicates in template rows (client_id IS NULL), you might need to run this:
-- DELETE FROM fitness_program_details
-- WHERE id IN (
--     SELECT id
--     FROM (
--         SELECT
--             id,
--             ROW_NUMBER() OVER (PARTITION BY activity_id, día, semana ORDER BY id) as rn
--         FROM
--             fitness_program_details
--         WHERE client_id IS NULL
--     ) t
--     WHERE t.rn > 1
-- );

-- DELETE FROM nutrition_program_details
-- WHERE id IN (
--     SELECT id
--     FROM (
--         SELECT
--             id,
--             ROW_NUMBER() OVER (PARTITION BY activity_id, día, semana ORDER BY id) as rn
--         FROM
--             nutrition_program_details
--         WHERE client_id IS NULL
--     ) t
--     WHERE t.rn > 1
-- );
