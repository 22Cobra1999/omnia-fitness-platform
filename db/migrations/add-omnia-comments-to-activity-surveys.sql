-- Agregar columnas de calificación y comentarios para Omnia a activity_surveys

ALTER TABLE public.activity_surveys
  ADD COLUMN IF NOT EXISTS calificacion_omnia INT CHECK (calificacion_omnia >= 1 AND calificacion_omnia <= 5);

ALTER TABLE public.activity_surveys
  ADD COLUMN IF NOT EXISTS comentarios_omnia TEXT;
