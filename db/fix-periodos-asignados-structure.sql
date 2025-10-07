s -- Script para corregir la estructura de periodos_asignados
-- Los períodos son configuración de la actividad, NO datos del cliente

-- 1. Verificar la estructura actual
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'periodos_asignados' 
ORDER BY ordinal_position;

-- 2. Ver datos actuales problemáticos
SELECT 
    id,
    activity_id,
    numero_periodo,
    fecha_inicio,
    fecha_fin,
    created_by,
    created_at
FROM periodos_asignados 
WHERE created_by IS NOT NULL
ORDER BY activity_id, numero_periodo;

-- 3. Limpiar datos incorrectos - eliminar created_by del cliente
-- Los períodos deben ser únicos por actividad, no por cliente
UPDATE periodos_asignados 
SET created_by = NULL 
WHERE created_by IS NOT NULL;

-- 4. Eliminar duplicados si los hay
-- Mantener solo un período por activity_id + numero_periodo
WITH duplicates AS (
    SELECT 
        id,
        ROW_NUMBER() OVER (
            PARTITION BY activity_id, numero_periodo 
            ORDER BY created_at ASC
        ) as rn
    FROM periodos_asignados
)
DELETE FROM periodos_asignados 
WHERE id IN (
    SELECT id FROM duplicates WHERE rn > 1
);

-- 5. Verificar que no haya duplicados
SELECT 
    activity_id,
    numero_periodo,
    COUNT(*) as count
FROM periodos_asignados 
GROUP BY activity_id, numero_periodo
HAVING COUNT(*) > 1;

-- 6. Ver estructura final
SELECT 
    id,
    activity_id,
    numero_periodo,
    fecha_inicio,
    fecha_fin,
    created_at,
    updated_at
FROM periodos_asignados 
ORDER BY activity_id, numero_periodo;

-- 7. Comentario sobre la estructura correcta
COMMENT ON TABLE periodos_asignados IS 
'Períodos de configuración para actividades. Define cuántas veces se repiten los ejercicios. NO contiene datos específicos del cliente.';

COMMENT ON COLUMN periodos_asignados.activity_id IS 
'ID de la actividad a la que pertenece este período';

COMMENT ON COLUMN periodos_asignados.numero_periodo IS 
'Número del período (1, 2, 3, etc.)';

COMMENT ON COLUMN periodos_asignados.fecha_inicio IS 
'Fecha de inicio del período (para referencia)';

COMMENT ON COLUMN periodos_asignados.fecha_fin IS 
'Fecha de fin del período (para referencia)';
































