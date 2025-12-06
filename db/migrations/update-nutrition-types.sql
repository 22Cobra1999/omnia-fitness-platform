-- Script para actualizar los tipos de platos de "otro" a valores específicos
-- Distribuye los platos entre diferentes tipos de comida

UPDATE "public"."nutrition_program_details"
SET "tipo" = CASE 
  -- Asignar tipos basados en el nombre del plato o de forma aleatoria
  WHEN "id" IN (752, 750, 751) THEN 'Desayuno'  -- Batido Verde, Tostadas, Panqueques
  WHEN "id" IN (739, 741, 760, 758, 742, 748) THEN 'Almuerzo'  -- Buddha Bowl, Pasta, Pizza, Curry, Tacos, Filete
  WHEN "id" IN (740, 761, 753) THEN 'Cena'  -- Ensalada Caprese, Wok, Wrap
  WHEN "id" IN (749, 762, 759) THEN 'Snack'  -- Bowl de Açaí, Smoothie Bowl, Sushi Bowl
  ELSE 'otro'
END
WHERE "coach_id" = 'b16c4f8c-f47b-4df0-ad2b-13dcbd76263f'
  AND "activity_id" = 93
  AND ("tipo" = 'otro' OR "tipo" IS NULL);

-- Verificar los cambios
SELECT 
  id,
  nombre,
  tipo,
  is_active,
  activity_id,
  activity_id_new
FROM "public"."nutrition_program_details"
WHERE "coach_id" = 'b16c4f8c-f47b-4df0-ad2b-13dcbd76263f'
  AND "activity_id" = 93
ORDER BY id;


