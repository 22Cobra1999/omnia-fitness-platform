-- 🔍 CONSULTA DE AUDITORÍA TOTAL: DETALLE MÁXIMO POR PLATO
-- Incluye Periodo, Macros, Ingredientes, Recetas e Información de Origen.

SELECT 
    p.fecha,
    -- Cálculo de semana relativa / periodo aproximado
    ceil((p.fecha - ae.start_date + 1)::numeric / 7) as num_semana,
    a.title as actividad,
    (plate.value->>'id')::int as plato_id,
    plate.value->>'nombre' as nombre_plato,
    (plate.value->>'calorias')::int as kcal,
    (plate.value->>'proteinas')::numeric as proteinas,
    (plate.value->>'carbohidratos')::numeric as carbs,
    (plate.value->>'grasas')::numeric as grasas,
    plate.value->>'ingredientes' as ingredientes,
    plate.value->>'receta_id' as receta_id,
    plate.value->>'minutos' as minutos_prep,
    plate.value->>'ajuste_motor' as factor_aplicado,
    p.id as daily_id,
    ae.status as enrollment_status
FROM public.progreso_cliente_nutricion p
JOIN public.activities a ON a.id = p.actividad_id
JOIN public.activity_enrollments ae ON ae.id = p.enrollment_id
CROSS JOIN LATERAL jsonb_each(p.macros) plate
WHERE p.enrollment_id = 215
ORDER BY p.fecha ASC, (plate.value->>'id')::int ASC;
