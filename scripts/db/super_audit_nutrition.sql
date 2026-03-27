-- 🔍 SUPER AUDITORÍA DE NUTRICIÓN: TRAZABILIDAD COMPLETA
-- Esta query muestra qué info del cliente se usó y qué reglas se aplicaron para llegar a los macros finales.

SELECT 
    p.fecha,
    -- Info del Cliente utilizada para Condicionales
    cp.gender as cliente_genero,
    cp.current_weight as cliente_peso,
    cp.current_height as cliente_altura,
    round((cp.current_weight / power(cp.current_height/100, 2))::numeric, 1) as cliente_bmi,
    
    -- Info de la Actividad y Período
    a.title as actividad,
    per.cantidad_periodos as total_periodos,
    
    -- Detalle del Plato
    (plate.value->>'id')::int as plato_id,
    plate.value->>'nombre' as nombre_plato,
    
    -- Macros Finales (Calculados por Motor Adaptativo en API)
    (plate.value->>'calorias')::int as kcal_calcu,
    (plate.value->>'proteinas')::numeric as prot_calcu,
    plate.value->>'ajuste_motor' as factor_motor,
    
    -- Receta e Ingredientes
    r.nombre as nombre_receta,
    r.receta as pasos_receta,
    plate.value->>'ingredientes' as ingredientes_persistidos,
    
    -- IDs de Rastreo
    p.id as daily_id,
    p.enrollment_id
FROM public.progreso_cliente_nutricion p
JOIN public.activities a ON a.id = p.actividad_id
JOIN public.activity_enrollments ae ON ae.id = p.enrollment_id
JOIN public.client_full_profile cp ON cp.client_id = p.cliente_id
JOIN public.periodos per ON per.actividad_id = p.actividad_id
CROSS JOIN LATERAL jsonb_each(p.macros) plate
LEFT JOIN public.nutrition_program_details npd ON npd.id = (plate.value->>'id')::int
LEFT JOIN public.recetas r ON r.id = npd.receta_id
WHERE p.enrollment_id = 215
ORDER BY p.fecha ASC, (plate.value->>'id')::int ASC;
