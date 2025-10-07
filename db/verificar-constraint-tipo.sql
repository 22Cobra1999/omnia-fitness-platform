-- Verificar qué valores acepta el constraint valid_tipo
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conname = 'valid_tipo' 
AND conrelid = 'ejercicios_detalles'::regclass;


































