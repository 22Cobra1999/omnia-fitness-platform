-- Drop adaptive_config as it is no longer required, using only adaptive_rule_ids
ALTER TABLE public.activities DROP COLUMN IF EXISTS adaptive_config;

-- Ensure adaptive_rule_ids is correctly defined and commented
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS adaptive_rule_ids integer[] DEFAULT '{}';
COMMENT ON COLUMN public.activities.adaptive_rule_ids IS 'Stores the actual database rule IDs applied to the program.';
