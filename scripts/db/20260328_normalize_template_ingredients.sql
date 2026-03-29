-- Migration: Normalize nutrition_program_details.ingredientes
-- This script converts string arrays like ["Pollo 100g"] into object arrays like [{"id": 1, "cnt": 100}]

DO $$ 
DECLARE 
    r RECORD;
    val TEXT;
    match_parts TEXT[];
    ing_nombre TEXT;
    ing_cantidad NUMERIC;
    ing_unidad TEXT;
    ing_id INT;
    new_ingredientes JSONB;
BEGIN
    FOR r IN SELECT id, ingredientes FROM nutrition_program_details WHERE ingredientes IS NOT NULL AND jsonb_array_length(ingredientes) > 0 AND (ingredientes->0)::text NOT LIKE '{%' LOOP
        new_ingredientes := '[]'::jsonb;
        
        FOR val IN SELECT jsonb_array_elements_text(ingredientes) FROM nutrition_program_details WHERE id = r.id LOOP
            -- Regex pattern: (Nombre) (Cantidad) (Unidad)
            match_parts := regexp_matches(val, '^(.+?)\s+(\d+(?:\.\d+)?)\s*(.*)$');
            
            IF match_parts IS NOT NULL THEN
                ing_nombre := trim(match_parts[1]);
                ing_cantidad := match_parts[2]::numeric;
                ing_unidad := trim(match_parts[3]);
            ELSE
                ing_nombre := trim(val);
                ing_cantidad := 1;
                ing_unidad := 'u';
            END IF;

            -- 1. Ensure ingredient exists and get ID
            INSERT INTO ingredientes_nutricion (nombre, unidad)
            VALUES (ing_nombre, COALESCE(NULLIF(ing_unidad, ''), 'u'))
            ON CONFLICT (nombre, unidad) DO UPDATE SET nombre = EXCLUDED.nombre
            RETURNING id INTO ing_id;

            -- 2. Add to new array
            new_ingredientes := new_ingredientes || jsonb_build_object('id', ing_id, 'cnt', ing_cantidad);
        END LOOP;

        -- 3. Update the record
        UPDATE nutrition_program_details SET ingredientes = new_ingredientes WHERE id = r.id;
    END LOOP;
END $$;
