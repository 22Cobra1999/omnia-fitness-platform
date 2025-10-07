-- Script para poblar la nueva tabla intensidades
-- Crear intensidades para cada ejercicio existente

-- 1. Insertar intensidades para ejercicios existentes
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
    ed.detalle_series,
    30, -- Duración por defecto
    ed.calorias || 0 as calorias,
    ed.created_by
FROM ejercicios_detalles ed
WHERE ed.activity_id = 59;

-- 2. Insertar intensidad Intermedio para ejercicios existentes
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
    -- Aumentar peso en 10% para intensidad intermedia
    jsonb_agg(
        jsonb_build_object(
            'peso', ROUND((serie->>'peso')::numeric * 1.1, 2),
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
GROUP BY ed.id, ed.nombre_ejercicio, ed.calorias, ed.created_by;

-- 3. Insertar intensidad Avanzado para ejercicios existentes
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
    -- Aumentar peso en 20% para intensidad avanzada
    jsonb_agg(
        jsonb_build_object(
            'peso', ROUND((serie->>'peso')::numeric * 1.2, 2),
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
GROUP BY ed.id, ed.nombre_ejercicio, ed.calorias, ed.created_by;

-- 4. Verificar resultado
SELECT 
    'RESULTADO FINAL' as seccion,
    COUNT(*) as total_intensidades,
    COUNT(DISTINCT ejercicio_id) as ejercicios_unicos,
    COUNT(DISTINCT intensidad) as intensidades_unicas
FROM intensidades;

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
