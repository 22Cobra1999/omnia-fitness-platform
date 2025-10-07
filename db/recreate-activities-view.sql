-- Recreate the 'activities' view to ensure it does not directly select 'image_url'.
-- 'image_url' should be accessed through the 'activity_media' relationship.

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

-- You might also need to grant appropriate permissions on the new view
ALTER VIEW public.activities OWNER TO postgres;
GRANT ALL ON public.activities TO postgres;
GRANT SELECT ON public.activities TO authenticated;
GRANT SELECT ON public.activities TO service_role;
