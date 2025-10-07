-- Agregar columnas capacity y stockQuantity a activities_base

-- Agregar capacity column si no existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'activities_base' AND column_name = 'capacity') THEN
        ALTER TABLE activities_base ADD COLUMN capacity INTEGER;
        RAISE NOTICE 'Column capacity added to activities_base table.';
    END IF;
END $$;

-- Agregar stockQuantity column si no existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'activities_base' AND column_name = 'stockQuantity') THEN
        ALTER TABLE activities_base ADD COLUMN stockQuantity INTEGER;
        RAISE NOTICE 'Column stockQuantity added to activities_base table.';
    END IF;
END $$;

-- Actualizar la vista activities para incluir las nuevas columnas
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
    a.capacity,
    a.stockQuantity,
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
