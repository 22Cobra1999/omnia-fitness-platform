-- Agregar columna observaciones a client_onboarding_responses
-- Límite razonable: 500 caracteres

ALTER TABLE client_onboarding_responses 
ADD COLUMN IF NOT EXISTS observaciones VARCHAR(500);

COMMENT ON COLUMN client_onboarding_responses.observaciones IS 'Observaciones o notas adicionales del cliente durante el onboarding (máximo 500 caracteres)';
