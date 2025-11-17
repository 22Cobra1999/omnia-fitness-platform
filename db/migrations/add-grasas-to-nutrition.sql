-- Agregar campo grasas a la tabla nutrition_program_details
ALTER TABLE public.nutrition_program_details 
ADD COLUMN grasas numeric NULL;

-- Agregar constraint para valores positivos
ALTER TABLE public.nutrition_program_details 
ADD CONSTRAINT check_grasas_positive CHECK (grasas >= 0::numeric);

-- Comentario para el campo
COMMENT ON COLUMN public.nutrition_program_details.grasas IS 'Cantidad de grasas en gramos del plato';




















