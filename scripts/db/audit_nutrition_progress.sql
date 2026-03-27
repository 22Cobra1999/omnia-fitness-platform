-- 🔍 CONSULTA DE AUDITORÍA: PROGRESO DE NUTRICIÓN GENERADO
-- Esta query muestra cómo quedó el progreso y qué valores de macros/calorías se calcularon.

WITH daily_stats AS (
    SELECT 
        p.id,
        p.fecha,
        p.status,
        a.title as actividad,
        p.enrollment_id,
        p.ejercicios_pendientes,
        p.macros,
        -- Cálculo de calorías totales objetivas desde el JSON de macros
        COALESCE((
            SELECT SUM(
                COALESCE((value->>'proteinas')::numeric, 0) * 4 +
                COALESCE((value->>'carbohidratos')::numeric, 0) * 4 +
                COALESCE((value->>'grasas')::numeric, 0) * 9
            ) FROM jsonb_each(p.macros)
        ), 0) as kcal_objetivo,
        -- Conteo de platos pendientes
        CASE 
            WHEN jsonb_typeof(p.ejercicios_pendientes->'ejercicios') = 'array' 
            THEN jsonb_array_length(p.ejercicios_pendientes->'ejercicios')
            ELSE 0 
        END as platos_pendientes
    FROM public.progreso_cliente_nutricion p
    JOIN public.activities a ON a.id = p.actividad_id
    WHERE p.enrollment_id = 215 -- Filtramos por el ID de prueba
)
SELECT 
    id,
    fecha,
    actividad,
    enrollment_id,
    platos_pendientes,
    kcal_objetivo,
    macros::text as macros_raw -- Lo mostramos como texto para leerlo todo
FROM daily_stats
ORDER BY fecha ASC;
