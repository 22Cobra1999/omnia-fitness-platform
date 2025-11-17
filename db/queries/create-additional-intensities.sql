-- Script para crear intensidades adicionales (Intermedio y Avanzado)
-- para ejercicios existentes que solo tienen Principiante

-- 1. Crear intensidad Intermedio para ejercicios que solo tienen Principiante
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
    30,
    ed.calorias || 0 as calorias,
    ed.created_by
FROM ejercicios_detalles ed,
     jsonb_array_elements(ed.detalle_series) as serie
WHERE ed.activity_id = 59
  AND ed.id NOT IN (
    SELECT ejercicio_id FROM intensidades WHERE intensidad = 'Intermedio'
  )
GROUP BY ed.id, ed.nombre_ejercicio, ed.calorias, ed.created_by;

-- 2. Crear intensidad Avanzado para ejercicios que solo tienen Principiante
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
    30,
    ed.calorias || 0 as calorias,
    ed.created_by
FROM ejercicios_detalles ed,
     jsonb_array_elements(ed.detalle_series) as serie
WHERE ed.activity_id = 59
  AND ed.id NOT IN (
    SELECT ejercicio_id FROM intensidades WHERE intensidad = 'Avanzado'
  )
GROUP BY ed.id, ed.nombre_ejercicio, ed.calorias, ed.created_by;

-- 3. Verificar resultado
SELECT 
    'RESULTADO FINAL' as seccion,
    COUNT(*) as total_intensidades,
    COUNT(DISTINCT ejercicio_id) as ejercicios_unicos,
    COUNT(DISTINCT intensidad) as intensidades_unicas
FROM intensidades;

-- 4. Mostrar distribución por intensidad
SELECT 
    intensidad,
    COUNT(*) as cantidad
FROM intensidades
GROUP BY intensidad
ORDER BY intensidad;

-- 5. Mostrar ejemplo de datos
SELECT 
    ejercicio_id,
    nombre_ejercicio,
    intensidad,
    detalle_series,
    duracion_minutos
FROM intensidades
WHERE ejercicio_id IN (
    SELECT id FROM ejercicios_detalles WHERE activity_id = 59 LIMIT 2
)
ORDER BY ejercicio_id, intensidad
LIMIT 10;
