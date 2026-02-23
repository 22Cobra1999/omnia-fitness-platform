-- Add adaptive_config column to activities table to support OMNIA Adaptive Motor rules
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS adaptive_config JSONB DEFAULT '{}';
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS adaptive_rule_ids integer[] DEFAULT '{}';

-- Optional: Add a comment to describe the column
COMMENT ON COLUMN public.activities.adaptive_config IS 'Stores the adaptive motor configuration (UI state).';
COMMENT ON COLUMN public.activities.adaptive_rule_ids IS 'Stores the actual database rule IDs applied to the program (0 for all in segment).';
