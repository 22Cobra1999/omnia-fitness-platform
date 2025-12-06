-- Actualizar enrollments de talleres finalizados sin fechas nuevas a is_active = false
-- IMPORTANTE: Ejecutar DESPUÉS de add_activities_is_active_and_versions.sql
-- porque necesita que la columna a.is_active exista en activities

UPDATE public.activity_enrollments ae
SET is_active = FALSE
FROM public.activities a
WHERE ae.activity_id = a.id
  AND a.type = 'workshop'
  AND a.is_finished = TRUE
  AND a.is_active = FALSE;

