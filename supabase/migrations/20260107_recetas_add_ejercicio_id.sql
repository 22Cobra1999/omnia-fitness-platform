-- Add ejercicio_id to recetas to allow direct lookup by nutrition item id (ejercicio_id in progreso_cliente_nutricion)

alter table "public"."recetas"
  add column if not exists "ejercicio_id" integer;

-- Backfill from nutrition_program_details: each nutrition item (id) points to receta_id
-- We want recetas.ejercicio_id = nutrition_program_details.id
update "public"."recetas" r
set "ejercicio_id" = npd."id"
from "public"."nutrition_program_details" npd
where npd."receta_id" = r."id"
  and npd."id" is not null
  and (r."ejercicio_id" is null);

-- Index/constraint: ejercicio_id should map to a single receta
create unique index if not exists "recetas_ejercicio_id_unique"
  on "public"."recetas"("ejercicio_id")
  where "ejercicio_id" is not null;
