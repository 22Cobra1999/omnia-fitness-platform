-- 🔍 SUPER AUDITORÍA DE NUTRICIÓN: TRAZABILIDAD Y CONTROL DE PERÍODOS
-- Esta query ayuda a verificar si el motor rotó bien los períodos (1, 2, 3...) y sus semanas.

WITH plan_duration AS (
    -- Calculamos cuántas semanas dura un solo ciclo de la planificación
    SELECT actividad_id, MAX(numero_semana) as semanas_por_ciclo
    FROM public.planificacion_ejercicios
    GROUP BY actividad_id
)
SELECT 
    p.fecha,
    -- Cálculo del Período Actual y Semana dentro del ciclo
    ceil( ( (p.fecha - ae.start_date + 1)::numeric / 7 ) / NULLIF(pd.semanas_por_ciclo, 0) ) as num_periodo,
    ( ( ( (p.fecha - ae.start_date)::int / 7 ) % pd.semanas_por_ciclo ) + 1 ) as semana_en_ciclo,
    
    -- Info del Cliente utilizada
    cp.gender as cliente_genero,
    cp.current_weight as cliente_peso,
    round((cp.current_weight / power(cp.current_height/100, 2))::numeric, 1) as cliente_bmi,
    
    -- Info de la Actividad
    a.title as actividad,
    pd.semanas_por_ciclo as duracion_ciclo,
    
    -- Detalle del Plato
    (plate.value->>'id')::int as plato_id,
    plate.value->>'nombre' as nombre_plato,
    
    -- Resultados del Motor
    (plate.value->>'calorias')::int as kcal_calcu,
    (plate.value->>'proteinas')::numeric as prot_calcu,
    plate.value->>'ajuste_motor' as factor_motor,
    
    -- Receta e Ingredientes
    r.nombre as nombre_receta,
    r.receta as pasos_receta,
    plate.value->>'ingredientes' as ingredientes_persistidos,
    
    p.id as daily_id
FROM public.progreso_cliente_nutricion p
JOIN public.activities a ON a.id = p.actividad_id
JOIN public.activity_enrollments ae ON ae.id = p.enrollment_id
JOIN public.client_full_profile cp ON cp.client_id = p.cliente_id
JOIN plan_duration pd ON pd.actividad_id = p.actividad_id
CROSS JOIN LATERAL jsonb_each(p.macros) plate
LEFT JOIN public.nutrition_program_details npd ON npd.id = (plate.value->>'id')::int
LEFT JOIN public.recetas r ON r.id = npd.receta_id
WHERE p.enrollment_id = 215
ORDER BY p.fecha ASC, (plate.value->>'id')::int ASC;
