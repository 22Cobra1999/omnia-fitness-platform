-- Query simplificada para obtener sumatoria diaria de progreso del cliente
-- Combina datos de fitness y nutrición para mostrar kcal, minutos y platos por día

-- Datos de fitness (progreso_cliente)
SELECT 
  cliente_id,
  fecha,
  -- Calcular ejercicios completados (contar claves del objeto JSON)
  CASE 
    WHEN ejercicios_completados IS NOT NULL THEN
      (SELECT COUNT(*) FROM jsonb_object_keys(ejercicios_completados::jsonb))
    ELSE 0
  END as ejercicios_diarios,
  
  -- Calcular minutos desde minutos_json (sumar valores)
  CASE 
    WHEN minutos_json IS NOT NULL THEN
      (SELECT SUM(COALESCE(value::numeric, 0)) FROM jsonb_each_text(minutos_json::jsonb))
    ELSE 0
  END as minutos_diarios,
  
  -- Calcular kcal desde calorias_json (sumar valores)
  CASE 
    WHEN calorias_json IS NOT NULL THEN
      (SELECT SUM(COALESCE(value::numeric, 0)) FROM jsonb_each_text(calorias_json::jsonb))
    ELSE 0
  END as kcal_diarias,
  
  0 as platos_diarios, -- Fitness no tiene platos
  'fitness' as tipo
FROM progreso_cliente

UNION ALL

-- Datos de nutrición (progreso_cliente_nutricion)
SELECT 
  cliente_id,
  fecha,
  0 as ejercicios_diarios, -- Nutrición no tiene ejercicios
  
  -- Calcular platos completados (contar claves del objeto JSON)
  CASE 
    WHEN ejercicios_completados IS NOT NULL THEN
      (SELECT COUNT(*) FROM jsonb_object_keys(ejercicios_completados::jsonb))
    ELSE 0
  END as platos_diarios,
  
  0 as minutos_diarios, -- Nutrición no tiene minutos
  
  -- Calcular kcal desde macros (proteínas*4 + carbohidratos*4 + grasas*9)
  CASE 
    WHEN macros IS NOT NULL THEN
      (
        SELECT SUM(
          COALESCE((value->>'proteinas')::numeric, 0) * 4 +
          COALESCE((value->>'proteina')::numeric, 0) * 4 +
          COALESCE((value->>'carbohidratos')::numeric, 0) * 4 +
          COALESCE((value->>'carbs')::numeric, 0) * 4 +
          COALESCE((value->>'grasas')::numeric, 0) * 9 +
          COALESCE((value->>'grasa')::numeric, 0) * 9
        )
        FROM jsonb_each(macros::jsonb)
      )
    ELSE 0
  END as kcal_diarias,
  
  'nutricion' as tipo
FROM progreso_cliente_nutricion

ORDER BY cliente_id, fecha DESC;
