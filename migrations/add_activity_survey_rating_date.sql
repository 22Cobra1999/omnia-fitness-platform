-- Agregar columna rating_date a activity_surveys
-- Esta columna almacena el día en que se realizó la calificación
ALTER TABLE public.activity_surveys 
ADD COLUMN IF NOT EXISTS rating_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Agregar columna calificacion_omnia a activity_surveys
-- Esta columna almacena la calificación general de Omnia (1-5)
ALTER TABLE public.activity_surveys 
ADD COLUMN IF NOT EXISTS calificacion_omnia INTEGER NULL 
CHECK (calificacion_omnia >= 1 AND calificacion_omnia <= 5);

-- Crear índice para búsquedas por fecha de calificación
CREATE INDEX IF NOT EXISTS idx_activity_surveys_rating_date 
ON public.activity_surveys (rating_date);

-- Crear índice para búsquedas por calificación Omnia
CREATE INDEX IF NOT EXISTS idx_activity_surveys_calificacion_omnia 
ON public.activity_surveys (calificacion_omnia);

-- Comentarios en las columnas
COMMENT ON COLUMN public.activity_surveys.rating_date IS 'Fecha y hora en que se realizó la calificación. Permite tanto al cliente como al coach calificar el uso de la página';
COMMENT ON COLUMN public.activity_surveys.calificacion_omnia IS 'Calificación general de Omnia (1-5). Puede ser calificada tanto por el cliente como por el coach sobre el uso de la página';

