-- Add recetas JSONB column to progreso_cliente_nutricion
ALTER TABLE progreso_cliente_nutricion 
ADD COLUMN IF NOT EXISTS recetas JSONB DEFAULT '{}'::jsonb;
