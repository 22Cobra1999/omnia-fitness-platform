-- Agregar coach_id a ejercicios_detalles y activity_media
-- Fecha: 2025-01-17

-- 1. Agregar coach_id a ejercicios_detalles
ALTER TABLE public.ejercicios_detalles
ADD COLUMN IF NOT EXISTS coach_id UUID REFERENCES auth.users(id);

-- 2. Agregar coach_id a activity_media
ALTER TABLE public.activity_media
ADD COLUMN IF NOT EXISTS coach_id UUID REFERENCES auth.users(id);

-- 3. Crear índices para mejor performance
CREATE INDEX IF NOT EXISTS idx_ejercicios_detalles_coach_id 
ON public.ejercicios_detalles(coach_id);

CREATE INDEX IF NOT EXISTS idx_activity_media_coach_id 
ON public.activity_media(coach_id);

-- 4. Actualizar ejercicios_detalles existentes con coach_id desde activities
UPDATE public.ejercicios_detalles ed
SET coach_id = a.coach_id
FROM public.activities a
WHERE ed.activity_id = a.id
AND ed.coach_id IS NULL;

-- 5. Actualizar activity_media existentes con coach_id desde activities
UPDATE public.activity_media am
SET coach_id = a.coach_id
FROM public.activities a
WHERE am.activity_id = a.id
AND am.coach_id IS NULL;

-- 6. Comentarios para documentación
COMMENT ON COLUMN public.ejercicios_detalles.coach_id IS 'ID del coach que creó el ejercicio';
COMMENT ON COLUMN public.activity_media.coach_id IS 'ID del coach dueño del media';

