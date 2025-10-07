-- Este script eliminará y recreará la vista 'activities'.
-- Asegura que 'image_url' NO se seleccione directamente de la tabla base de actividades,
-- ya que ahora reside en 'activity_media'.

DROP VIEW IF EXISTS public.activities;

CREATE VIEW public.activities AS
SELECT
    a.id,
    a.title,
    a.description,
    a.type,
    a.difficulty,
    a.price,
    a.coach_id,
    a.is_public,
    a.created_at,
    a.updated_at,
    a.program_rating,
    a.total_program_reviews,
    p.full_name AS coach_name,
    p.avatar_url AS coach_avatar_url,
    p.whatsapp AS coach_whatsapp
FROM
    public.activities_base a
LEFT JOIN
    public.profiles p ON a.coach_id = p.id;

-- Concede los permisos necesarios a la nueva vista
ALTER VIEW public.activities OWNER TO postgres;
GRANT ALL ON public.activities TO postgres;
GRANT SELECT ON public.activities TO authenticated;
GRANT SELECT ON public.activities TO service_role;
