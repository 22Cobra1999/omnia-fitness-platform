
-- Check row counts for the coach in both nutrition tables
SELECT 
    'nutrition_program_details' as table_name, 
    COUNT(*) as count 
FROM nutrition_program_details 
WHERE coach_id = 'b16c4f8c-f47b-4df0-ad2b-13dcbd76263f'
UNION ALL
SELECT 
    'platos_detalles' as table_name, 
    COUNT(*) as count 
FROM platos_detalles 
WHERE coach_id = 'b16c4f8c-f47b-4df0-ad2b-13dcbd76263f';

-- Also check if columns exist
SELECT column_name, table_name 
FROM information_schema.columns 
WHERE table_name IN ('nutrition_program_details', 'platos_detalles') 
AND column_name IN ('is_active', 'nombre', 'nombre_plato');
