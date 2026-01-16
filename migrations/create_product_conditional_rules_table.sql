-- Create table for conditional rules
CREATE TABLE IF NOT EXISTS product_conditional_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id BIGINT REFERENCES activities(id) ON DELETE CASCADE,
    coach_id UUID REFERENCES coaches(id),
    name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    criteria JSONB NOT NULL, -- { gender, ageRange, weightRange, fitnessGoals, activityLevel }
    adjustments JSONB NOT NULL, -- { weight, reps, series, portions }
    affected_items JSONB NOT NULL, -- 'all' or [item_ids]
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE product_conditional_rules ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Coaches can manage their own rules" ON product_conditional_rules
    FOR ALL USING (auth.uid() = coach_id);

-- Add indexes for better performance
CREATE INDEX idx_product_conditional_rules_product_id ON product_conditional_rules(product_id);
CREATE INDEX idx_product_conditional_rules_coach_id ON product_conditional_rules(coach_id);
