-- Add nombre to recetas and backfill from nutrition_program_details

alter table "public"."recetas"
  add column if not exists "nombre" text;

-- Backfill: prefer nutrition_program_details.nombre when recetas.nombre is null/empty
update "public"."recetas" r
set "nombre" = npd."nombre"
from "public"."nutrition_program_details" npd
where npd."receta_id" = r."id"
  and npd."nombre" is not null
  and btrim(npd."nombre") <> ''
  and (r."nombre" is null or btrim(r."nombre") = '');
