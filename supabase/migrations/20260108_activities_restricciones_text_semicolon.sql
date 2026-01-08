do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'activities'
      and column_name = 'restricciones'
      and data_type = 'ARRAY'
  ) then
    alter table public.activities
      alter column restricciones type text
      using coalesce(array_to_string(restricciones, ';'), '');

    alter table public.activities
      alter column restricciones set default '';

    update public.activities
      set restricciones = ''
      where restricciones is null;

    alter table public.activities
      alter column restricciones set not null;
  end if;
end $$;
