-- Query simple: métricas de progreso por día, cliente y tipo (fitness/nutrición)
-- Suma valores de progreso_cliente y progreso_cliente_nutricion

-- FITNESS
SELECT 
    cliente_id,
    fecha,
    'fitness' as tipo,
    CASE 
        WHEN jsonb_typeof(ejercicios_completados) = 'array' THEN jsonb_array_length(ejercicios_completados)
        WHEN jsonb_typeof(ejercicios_completados) = 'object' THEN (SELECT COUNT(*) FROM jsonb_object_keys(ejercicios_completados))
        ELSE 0
    END as ejercicios,
    COALESCE((SELECT SUM((value::text)::numeric) FROM jsonb_each_text(minutos_json)), 0) as minutos,
    COALESCE((SELECT SUM((value::text)::numeric) FROM jsonb_each_text(calorias_json)), 0) as calorias,
    0 as platos,
    CASE 
        WHEN jsonb_typeof(ejercicios_completados) = 'array' THEN jsonb_array_length(ejercicios_completados) > 0
        WHEN jsonb_typeof(ejercicios_completados) = 'object' THEN (SELECT COUNT(*) FROM jsonb_object_keys(ejercicios_completados)) > 0
        ELSE false
    END as completado
FROM progreso_cliente

UNION ALL

-- NUTRICIÓN
SELECT 
    cliente_id,
    fecha,
    'nutricion' as tipo,
    0 as ejercicios,
    0 as minutos,
    COALESCE((SELECT SUM(
        COALESCE((value->>'proteinas')::numeric, 0) * 4 +
        COALESCE((value->>'carbohidratos')::numeric, 0) * 4 +
        COALESCE((value->>'grasas')::numeric, 0) * 9
    ) FROM jsonb_each(macros)), 0) as calorias,
    CASE 
        WHEN jsonb_typeof(ejercicios_completados) = 'array' THEN jsonb_array_length(ejercicios_completados)
        WHEN jsonb_typeof(ejercicios_completados) = 'object' THEN (SELECT COUNT(*) FROM jsonb_object_keys(ejercicios_completados))
        ELSE 0
    END as platos,
    CASE 
        WHEN jsonb_typeof(ejercicios_completados) = 'array' THEN jsonb_array_length(ejercicios_completados) > 0
        WHEN jsonb_typeof(ejercicios_completados) = 'object' THEN (SELECT COUNT(*) FROM jsonb_object_keys(ejercicios_completados)) > 0
        ELSE false
    END as completado
FROM progreso_cliente_nutricion

ORDER BY cliente_id, fecha, tipo;

