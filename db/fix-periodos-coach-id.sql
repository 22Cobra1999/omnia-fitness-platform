-- Script para corregir periodos_asignados con coach_id en created_by
-- Los períodos son configuración del coach, NO del cliente

-- 1. Verificar estructura actual
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'periodos_asignados' 
ORDER BY ordinal_position;

-- 2. Obtener coach_id de la actividad 59
SELECT 
    a.id as activity_id,
    a.title,
    a.coach_id
FROM activities a
WHERE a.id = 59;

-- 3. Actualizar períodos existentes con coach_id
UPDATE periodos_asignados 
SET created_by = (
    SELECT a.coach_id 
    FROM activities a 
    WHERE a.id = periodos_asignados.activity_id
)
WHERE activity_id = 59;

-- 4. Verificar actualización
SELECT 
    id,
    activity_id,
    numero_periodo,
    fecha_inicio,
    fecha_fin,
    created_by,
    created_at
FROM periodos_asignados 
WHERE activity_id = 59
ORDER BY numero_periodo;

-- 5. Comentarios explicativos
COMMENT ON TABLE periodos_asignados IS 
'Períodos de configuración para actividades. Define cuántas veces se repiten los ejercicios. created_by contiene el coach_id que configuró estos períodos.';

COMMENT ON COLUMN periodos_asignados.created_by IS 
'ID del coach que configuró estos períodos para la actividad';
































