create table if not exists public.progreso_diario_actividad (
  id bigserial not null,
  cliente_id uuid not null,
  fecha date not null,
  actividad_id bigint null,
  tipo text null,
  area text null,
  items_objetivo integer null default 0,
  items_completados integer null default 0,
  cantidad_actividades_adeudadas integer null default 0,
  cantidad_dias_adeudados integer null default 0,
  minutos integer null default 0,
  calorias integer null default 0,
  proteinas integer null default 0,
  carbohidratos integer null default 0,
  grasas integer null default 0,
  recalculado_en timestamp without time zone null default now(),
  constraint progreso_diario_actividad_pkey primary key (id),
  constraint progreso_diario_actividad_area_check check (
    (
      area = any (
        array[
          'fitness'::text,
          'nutricion'::text,
          'general'::text
        ]
      )
    )
  ),
  constraint progreso_diario_actividad_tipo_check check (
    (
      tipo = any (array['programa'::text, 'taller'::text])
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_progreso_actividad_dia on public.progreso_diario_actividad using btree (cliente_id, fecha, actividad_id) TABLESPACE pg_default;
