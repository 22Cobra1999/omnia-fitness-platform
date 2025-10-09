-- Script para limpiar filas duplicadas en ejecuciones_taller
-- Mantener solo la más reciente por cliente_id + actividad_id

-- Identificar y eliminar duplicados, manteniendo el registro más reciente
WITH duplicados AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (
      PARTITION BY cliente_id, actividad_id 
      ORDER BY created_at DESC
    ) as rn
  FROM ejecuciones_taller
)
DELETE FROM ejecuciones_taller
WHERE id IN (
  SELECT id FROM duplicados WHERE rn > 1
);

-- Verificar el resultado
SELECT 
  cliente_id,
  actividad_id,
  COUNT(*) as total,
  MAX(created_at) as ultima_creacion
FROM ejecuciones_taller
GROUP BY cliente_id, actividad_id
HAVING COUNT(*) > 1;

-- Si el resultado anterior está vacío, significa que no hay duplicados

