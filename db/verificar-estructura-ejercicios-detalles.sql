-- Verificar estructura de la tabla ejercicios_detalles
SELECT 
  'ESTRUCTURA EJERCICIOS_DETALLES' as seccion,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'ejercicios_detalles'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Ver algunos registros de ejemplo
SELECT 
  'EJEMPLOS EJERCICIOS_DETALLES' as seccion,
  id,
  nombre_ejercicio,
  descripcion,
  tipo
FROM ejercicios_detalles
LIMIT 5;


































