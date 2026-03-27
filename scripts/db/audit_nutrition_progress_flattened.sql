-- 🔍 CONSULTA DE AUDITORÍA DETALLADA: UN PLATO POR FILA
-- Esta query aplana el JSON de macros para ver el detalle de cada plato individualmente.

SELECT 
    p.id as daily_id,
    p.fecha,
    a.title as actividad,
    (plate.value->>'id')::int as plato_id,
    plate.value->>'nombre' as nombre_plato,
    (plate.value->>'calorias')::int as kcal,
    (plate.value->>'proteinas')::numeric as proteinas,
    (plate.value->>'carbohidratos')::numeric as carbs,
    (plate.value->>'grasas')::numeric as grasas,
    plate.value->>'ingredientes' as ingredientes,
    plate.value->>'ajuste_motor' as factor_aplicado
FROM public.progreso_cliente_nutricion p
JOIN public.activities a ON a.id = p.actividad_id
CROSS JOIN LATERAL jsonb_each(p.macros) plate
WHERE p.enrollment_id = 215
ORDER BY p.fecha ASC, (plate.value->>'id')::int ASC;
