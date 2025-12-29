
 -- Refactor recetas: receta vive solo en public.recetas.
 -- Se elimina receta de progreso_cliente_nutricion y nutrition_program_details y se agrega receta_id.
 
 CREATE TABLE IF NOT EXISTS public.recetas (
   id BIGSERIAL PRIMARY KEY,
   receta TEXT NOT NULL,
   created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
   updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
 );
 
 ALTER TABLE public.nutrition_program_details
   ADD COLUMN IF NOT EXISTS receta_id BIGINT;
 
 ALTER TABLE public.nutrition_program_details
   DROP CONSTRAINT IF EXISTS nutrition_program_details_receta_id_fkey;
 
 ALTER TABLE public.nutrition_program_details
   ADD CONSTRAINT nutrition_program_details_receta_id_fkey
   FOREIGN KEY (receta_id) REFERENCES public.recetas(id);
 
 ALTER TABLE public.nutrition_program_details
   DROP COLUMN IF EXISTS receta;
 
 ALTER TABLE public.progreso_cliente_nutricion
   DROP COLUMN IF EXISTS receta;
