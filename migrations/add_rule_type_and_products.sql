-- Add rule_type and target_product_ids to product_conditional_rules

ALTER TABLE product_conditional_rules 
ADD COLUMN IF NOT EXISTS rule_type TEXT DEFAULT 'fitness',
ADD COLUMN IF NOT EXISTS target_product_ids JSONB DEFAULT '[]'::jsonb;

-- Comment on columns
COMMENT ON COLUMN product_conditional_rules.rule_type IS 'Type of rule: "fitness" or "nutricion"';
COMMENT ON COLUMN product_conditional_rules.target_product_ids IS 'Array of product IDs this rule applies to. Empty means global (applies to all relevant products).';

-- Update existing records based on criteria (if possible, otherwise default to fitness)
UPDATE product_conditional_rules
SET rule_type = COALESCE(criteria->>'type', 'fitness')
WHERE rule_type IS NULL OR rule_type = 'fitness';
