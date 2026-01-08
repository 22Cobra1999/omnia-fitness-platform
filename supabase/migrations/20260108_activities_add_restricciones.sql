alter table public.activities
add column if not exists restricciones text[] not null default '{}';
