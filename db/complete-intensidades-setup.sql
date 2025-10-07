-- Script completo para configurar la nueva tabla intensidades
-- Ejecutar en orden: 1) redesign-intensidades-table.sql, 2) este script

-- 1. Verificar que la tabla intensidades existe y está vacía
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'intensidades') THEN
        RAISE EXCEPTION 'La tabla intensidades no existe. Ejecuta primero redesign-intensidades-table.sql';
    END IF;
END $$;

-- 2. Limpiar datos existentes (opcional)
-- DELETE FROM intensidades;

-- 3. Insertar intensidad Principiante para ejercicios existentes
INSERT INTO intensidades (
    ejercicio_id,
    nombre_ejercicio,
    intensidad,
    detalle_series,
    duracion_minutos,
    calorias,
    created_by
)
SELECT 
    ed.id as ejercicio_id,
    ed.nombre_ejercicio,
    'Principiante' as intensidad,
    ed.detalle_series, -- Usar las series originales
    30 as duracion_minutos, -- Duración por defecto
    COALESCE(ed.calorias, 0) as calorias, -- Usar las calorías del ejercicio o 0 si es NULL
    ed.created_by
FROM ejercicios_detalles ed
WHERE ed.activity_id = 59
  AND ed.detalle_series IS NOT NULL
  AND jsonb_array_length(ed.detalle_series) > 0;

-- 4. Insertar intensidad Intermedio para ejercicios existentes
INSERT INTO intensidades (
    ejercicio_id,
    nombre_ejercicio,
    intensidad,
    detalle_series,
    duracion_minutos,
    calorias,
    created_by
)
SELECT 
    ed.id as ejercicio_id,
    ed.nombre_ejercicio,
    'Intermedio' as intensidad,
    -- Aumentar peso en 15% para intensidad intermedia
    jsonb_agg(
        jsonb_build_object(
            'peso', ROUND((serie->>'peso')::numeric * 1.15, 2),
            'repeticiones', (serie->>'repeticiones')::integer,
            'series', (serie->>'series')::integer
        )
    ) as detalle_series,
    30 as duracion_minutos,
    ROUND(COALESCE(ed.calorias, 0) * 1.1) as calorias, -- Aumentar calorías en 10%
    ed.created_by
FROM ejercicios_detalles ed,
     jsonb_array_elements(ed.detalle_series) as serie
WHERE ed.activity_id = 59
  AND ed.detalle_series IS NOT NULL
  AND jsonb_array_length(ed.detalle_series) > 0
GROUP BY ed.id, ed.nombre_ejercicio, ed.calorias, ed.created_by;

-- 5. Insertar intensidad Avanzado para ejercicios existentes
INSERT INTO intensidades (
    ejercicio_id,
    nombre_ejercicio,
    intensidad,
    detalle_series,
    duracion_minutos,
    calorias,
    created_by
)
SELECT 
    ed.id as ejercicio_id,
    ed.nombre_ejercicio,
    'Avanzado' as intensidad,
    -- Aumentar peso en 30% para intensidad avanzada
    jsonb_agg(
        jsonb_build_object(
            'peso', ROUND((serie->>'peso')::numeric * 1.30, 2),
            'repeticiones', (serie->>'repeticiones')::integer,
            'series', (serie->>'series')::integer
        )
    ) as detalle_series,
    30 as duracion_minutos,
    ROUND(COALESCE(ed.calorias, 0) * 1.2) as calorias, -- Aumentar calorías en 20%
    ed.created_by
FROM ejercicios_detalles ed,
     jsonb_array_elements(ed.detalle_series) as serie
WHERE ed.activity_id = 59
  AND ed.detalle_series IS NOT NULL
  AND jsonb_array_length(ed.detalle_series) > 0
GROUP BY ed.id, ed.nombre_ejercicio, ed.calorias, ed.created_by;

-- 6. Verificar resultado final
SELECT 
    'RESULTADO FINAL' as seccion,
    COUNT(*) as total_intensidades,
    COUNT(DISTINCT ejercicio_id) as ejercicios_unicos,
    COUNT(DISTINCT intensidad) as intensidades_unicas
FROM intensidades;

-- 7. Mostrar distribución por intensidad
SELECT 
    intensidad,
    COUNT(*) as cantidad,
    ROUND(AVG(calorias), 2) as calorias_promedio,
    MIN(calorias) as calorias_min,
    MAX(calorias) as calorias_max
FROM intensidades
GROUP BY intensidad
ORDER BY intensidad;

-- 8. Mostrar ejemplo de datos
SELECT 
    ejercicio_id,
    nombre_ejercicio,
    intensidad,
    detalle_series,
    duracion_minutos,
    calorias
FROM intensidades
WHERE ejercicio_id IN (
    SELECT id FROM ejercicios_detalles WHERE activity_id = 59 LIMIT 2
)
ORDER BY ejercicio_id, intensidad
LIMIT 10;

-- 9. Verificar que no hay duplicados
SELECT 
    ejercicio_id,
    intensidad,
    COUNT(*) as cantidad
FROM intensidades
GROUP BY ejercicio_id, intensidad
HAVING COUNT(*) > 1;


































