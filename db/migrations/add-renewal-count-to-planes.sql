-- Agregar campo renewal_count para trackear renovaciones del plan free
ALTER TABLE planes_uso_coach 
ADD COLUMN IF NOT EXISTS renewal_count INTEGER DEFAULT 0;

-- Agregar comentario
COMMENT ON COLUMN planes_uso_coach.renewal_count IS 'Número de renovaciones automáticas (solo aplica a plan free, máximo 3)';

-- Actualizar planes existentes sin renewal_count
UPDATE planes_uso_coach 
SET renewal_count = 0 
WHERE renewal_count IS NULL;


































