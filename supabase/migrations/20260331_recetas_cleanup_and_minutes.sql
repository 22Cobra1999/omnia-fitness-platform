-- Migration: Add 'minutos' to 'recetas' and cleanup NULL names
-- File: supabase/migrations/20260331_recetas_cleanup_and_minutes.sql

-- 1. Add 'minutos' column to 'recetas' table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'recetas' AND column_name = 'minutos') THEN
        ALTER TABLE "public"."recetas" ADD COLUMN "minutos" integer DEFAULT 0;
    END IF;
END $$;

-- 2. Migrate minutes from nutrition_program_details to recetas
-- Ensure we transfer values even if r.minutos is 0
UPDATE "public"."recetas" r
SET "minutos" = sub.mins
FROM (
    SELECT receta_id, MAX(minutos) as mins
    FROM "public"."nutrition_program_details"
    WHERE receta_id IS NOT NULL AND minutos > 0
    GROUP BY receta_id
) sub
WHERE r.id = sub.receta_id;

-- 3. Cleanup NULL names and ejercicio_id in 'recetas' table
-- (Already in previous migrations but ensuring names are filled by description)
UPDATE "public"."recetas" r1
SET 
  "nombre" = r2.nombre,
  "updated_at" = NOW()
FROM "public"."recetas" r2
WHERE r1.nombre IS NULL 
  AND r2.nombre IS NOT NULL 
  AND r1.receta = r2.receta;

-- 4. Manual fill for specific ones that might still be NULL
UPDATE "public"."recetas"
SET "nombre" = CASE 
    WHEN receta ILIKE '%Garbanzos espinacas%' THEN 'Curry de Garbanzos'
    WHEN receta ILIKE '%Arroz sushi salmón%' THEN 'Sushi Bowl'
    WHEN receta ILIKE '%Acaí%' OR receta ILIKE '%Açaí%' THEN 'Bowl de Açaí'
    WHEN receta ILIKE '%Pan integral con aguacate huevo%' THEN 'Tostadas de Aguacate'
    WHEN receta ILIKE '%Panqueques de avena con proteína%' THEN 'Panqueques Proteicos'
    WHEN receta ILIKE '%Espinacas kale plátano%' THEN 'Batido Verde Detox'
    WHEN receta ILIKE '%Tortilla integral pollo%' THEN 'Wrap de Pollo Caesar'
    ELSE nombre
END
WHERE nombre IS NULL;

-- 5. FINALLY: Remove minutos from nutrition_program_details to centralize in recetas
ALTER TABLE "public"."nutrition_program_details" DROP COLUMN IF EXISTS "minutos";
