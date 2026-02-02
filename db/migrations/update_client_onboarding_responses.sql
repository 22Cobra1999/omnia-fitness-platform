-- Migración: Limpiar tabla client_onboarding_responses
-- Eliminar columnas que ahora se manejan en otras tablas

-- Eliminar columnas de datos físicos (ahora en clients)
ALTER TABLE client_onboarding_responses DROP COLUMN IF EXISTS birth_date;
ALTER TABLE client_onboarding_responses DROP COLUMN IF EXISTS height_cm;
ALTER TABLE client_onboarding_responses DROP COLUMN IF EXISTS weight_kg;

-- Eliminar columnas de salud (ahora en user_injuries y clients.health_conditions)
ALTER TABLE client_onboarding_responses DROP COLUMN IF EXISTS injuries;
ALTER TABLE client_onboarding_responses DROP COLUMN IF EXISTS conditions;
ALTER TABLE client_onboarding_responses DROP COLUMN IF EXISTS health_notes;

-- La tabla ahora solo contiene:
-- - intensity_level
-- - change_goal
-- - progress_horizon
-- - consistency_level
-- - coaching_style
-- - training_modality
-- - interests

COMMENT ON TABLE client_onboarding_responses IS 'Almacena las preferencias de entrenamiento del onboarding (intensidad, estilo de coaching, modalidad, intereses)';
