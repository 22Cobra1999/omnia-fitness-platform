-- Query simple: métricas de progreso por día, cliente y tipo (fitness/nutrición)
-- Suma valores de progreso_cliente y progreso_cliente_nutricion

-- FITNESS
SELECT 
    cliente_id,
    fecha,
    actividad_id,
    'fitness' as tipo,
    a.title as actividad,
    CASE 
        WHEN jsonb_typeof(ejercicios_completados) = 'array' THEN jsonb_array_length(ejercicios_completados)
        WHEN jsonb_typeof(ejercicios_completados) = 'object' THEN (SELECT COUNT(*) FROM jsonb_object_keys(ejercicios_completados))
        ELSE 0
    END as ejercicios,
    CASE 
        WHEN jsonb_typeof(ejercicios_pendientes) = 'object' THEN (SELECT COUNT(*) FROM jsonb_object_keys(ejercicios_pendientes))
        WHEN jsonb_typeof(ejercicios_pendientes) = 'array' THEN jsonb_array_length(ejercicios_pendientes)
        ELSE 0
    END +
    CASE 
        WHEN jsonb_typeof(ejercicios_completados) = 'array' THEN jsonb_array_length(ejercicios_completados)
        WHEN jsonb_typeof(ejercicios_completados) = 'object' THEN (SELECT COUNT(*) FROM jsonb_object_keys(ejercicios_completados))
        ELSE 0
    END as ejercicios_objetivo,
    COALESCE((SELECT SUM((value::text)::numeric) FROM jsonb_each_text(minutos_json)), 0) as minutos,
    COALESCE((SELECT SUM((value::text)::numeric) FROM jsonb_each_text(calorias_json)), 0) as calorias,
    0 as platos_objetivo,
    0 as platos_completados,
    CASE 
        WHEN jsonb_typeof(ejercicios_completados) = 'array' THEN jsonb_array_length(ejercicios_completados) > 0
        WHEN jsonb_typeof(ejercicios_completados) = 'object' THEN (SELECT COUNT(*) FROM jsonb_object_keys(ejercicios_completados)) > 0
        ELSE false
    END as completado
FROM progreso_cliente

LEFT JOIN activities a ON a.id = progreso_cliente.actividad_id

UNION ALL

-- NUTRICIÓN
SELECT 
    cliente_id,
    fecha,
    actividad_id,
    'nutricion' as tipo,
    a.title as actividad,
    0 as ejercicios,
    0 as ejercicios_objetivo,
    0 as minutos,
    COALESCE((SELECT SUM(
        COALESCE((value->>'proteinas')::numeric, 0) * 4 +
        COALESCE((value->>'carbohidratos')::numeric, 0) * 4 +
        COALESCE((value->>'grasas')::numeric, 0) * 9
    ) FROM jsonb_each(macros)), 0) as calorias,
    CASE
        WHEN jsonb_typeof(ejercicios_completados) = 'object' AND jsonb_typeof(ejercicios_completados->'ejercicios') = 'array' THEN jsonb_array_length(ejercicios_completados->'ejercicios')
        ELSE 0
    END +
    CASE
        WHEN jsonb_typeof(ejercicios_pendientes) = 'object' AND jsonb_typeof(ejercicios_pendientes->'ejercicios') = 'array' THEN jsonb_array_length(ejercicios_pendientes->'ejercicios')
        ELSE 0
    END as platos_objetivo,
    CASE
        WHEN jsonb_typeof(ejercicios_completados) = 'object' AND jsonb_typeof(ejercicios_completados->'ejercicios') = 'array' THEN jsonb_array_length(ejercicios_completados->'ejercicios')
        ELSE 0
    END as platos_completados,
    CASE
        WHEN jsonb_typeof(ejercicios_completados) = 'object' AND jsonb_typeof(ejercicios_completados->'ejercicios') = 'array' THEN jsonb_array_length(ejercicios_completados->'ejercicios') > 0
        ELSE false
    END as completado
FROM progreso_cliente_nutricion

LEFT JOIN activities a ON a.id = progreso_cliente_nutricion.actividad_id

ORDER BY cliente_id, fecha, tipo, actividad_id;

