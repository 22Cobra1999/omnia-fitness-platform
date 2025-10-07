-- Verificar estructura de la tabla ejecuciones_ejercicio
SELECT 
  'ESTRUCTURA EJECUCIONES_EJERCICIO' as seccion,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'ejecuciones_ejercicio'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verificar restricciones únicas
SELECT 
  'RESTRICCIONES UNICAS' as seccion,
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'ejecuciones_ejercicio'
  AND tc.table_schema = 'public'
  AND tc.constraint_type IN ('UNIQUE', 'PRIMARY KEY');

































