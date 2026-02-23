-- Create table for conditional rules if it doesn't exist
CREATE TABLE IF NOT EXISTS product_conditional_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id BIGINT REFERENCES activities(id) ON DELETE CASCADE,
    coach_id UUID REFERENCES coaches(id),
    name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    criteria JSONB NOT NULL, -- { gender, ageRange, weightRange, fitnessGoals, activityLevel }
    adjustments JSONB NOT NULL, -- { weight, reps, series, portions }
    affected_items JSONB NOT NULL DEFAULT '"all"', -- 'all' or [item_ids]
    rule_type TEXT DEFAULT 'fitness', -- 'fitness' or 'nutricion'
    target_product_ids BIGINT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE product_conditional_rules ENABLE ROW LEVEL SECURITY;

-- Policies (Do this safely)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Coaches can manage their own rules' AND tablename = 'product_conditional_rules') THEN
        CREATE POLICY "Coaches can manage their own rules" ON product_conditional_rules
            FOR ALL USING (auth.uid() = coach_id);
    END IF;
END $$;

-- 1. FASE 1: Nivel de Actividad (Encuesta)
INSERT INTO product_conditional_rules (name, criteria, adjustments, affected_items, is_active, rule_type)
VALUES 
('Actividad: Sedentario (-15%)', '{"activityLevel": ["Sedentary"]}', '{"portions": -15}', '"all"', true, 'nutricion'),
('Actividad: Ligera (-5%)', '{"activityLevel": ["Lightly Active"]}', '{"portions": -5}', '"all"', true, 'nutricion'),
('Actividad: Moderada (Base)', '{"activityLevel": ["Moderately Active"]}', '{"portions": 0}', '"all"', true, 'nutricion'),
('Actividad: Muy Activo (+10%)', '{"activityLevel": ["Very Active"]}', '{"portions": 10}', '"all"', true, 'nutricion');

-- 2. FASE 2: Perfil Metabólico
INSERT INTO product_conditional_rules (name, criteria, adjustments, affected_items, is_active, rule_type)
VALUES 
('Perfil: Obesidad BMI >= 30 (-10%)', '{"bmiRange": [30, 100]}', '{"portions": -10}', '"all"', true, 'nutricion'),
('Perfil: Bajo Peso BMI < 18.5 (+10%)', '{"bmiRange": [0, 18.5]}', '{"portions": 10}', '"all"', true, 'nutricion'),
('Perfil: Edad Avanzada > 50 (-5%)', '{"ageRange": [51, 120]}', '{"portions": -5}', '"all"', true, 'nutricion');

-- 3. FASE 3: Restricciones Especiales (Ejemplo)
INSERT INTO product_conditional_rules (name, criteria, adjustments, affected_items, is_active, rule_type)
VALUES 
('Restricción: Diabetes / Control Glucémico', '{"specificInjuries": ["Diabetes", "Insulina"]}', '{"portions": -10}', '"all"', true, 'nutricion');
