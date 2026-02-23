-- 1. DROP AND RECREATE (Individual Columns + 3-i Spelling)
DROP TABLE IF EXISTS public.adaptive_rules_catalog CASCADE;

CREATE TABLE public.adaptive_rules_catalog (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL, -- 'activity', 'age', 'gender', 'bmi', 'level', 'injury', 'config'
    rule_type TEXT NOT NULL, -- 'fitness', 'nutricion'
    phase INTEGER NOT NULL, -- 0 (config), 1, 2, 3
    intensity TEXT NOT NULL DEFAULT 'media', -- 'baja', 'media', 'alta'
    
    -- Multiplicadores Nutrición
    kcal NUMERIC(10,4) DEFAULT 1.0000,
    proteina NUMERIC(10,4) DEFAULT 1.0000,
    carbos NUMERIC(10,4) DEFAULT 1.0000,
    grasas NUMERIC(10,4) DEFAULT 1.0000,
    
    -- Multiplicadores Fitness (Spelling as requested: repetiiiciones)
    kg NUMERIC(10,4) DEFAULT 1.0000,
    series NUMERIC(10,4) DEFAULT 1.0000,
    repetiiiciones NUMERIC(10,4) DEFAULT 1.0000,
    
    metadata JSONB DEFAULT '{}', 
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. HELPER FUNCTIONS
CREATE OR REPLACE FUNCTION insert_rule(name_in TEXT, cat_in TEXT, type_in TEXT, phase_in INT, k NUMERIC, p NUMERIC, c NUMERIC, g NUMERIC) RETURNS VOID AS $$
BEGIN
    INSERT INTO public.adaptive_rules_catalog (name, category, rule_type, phase, intensity, kcal, proteina, carbos, grasas)
    VALUES (name_in || ' (Baja)', cat_in, type_in, phase_in, 'baja', 1-((1-k)*0.3), 1-((1-p)*0.3), 1-((1-c)*0.3), 1-((1-g)*0.3));
    INSERT INTO public.adaptive_rules_catalog (name, category, rule_type, phase, intensity, kcal, proteina, carbos, grasas)
    VALUES (name_in || ' (Media)', cat_in, type_in, phase_in, 'media', k, p, c, g);
    INSERT INTO public.adaptive_rules_catalog (name, category, rule_type, phase, intensity, kcal, proteina, carbos, grasas)
    VALUES (name_in || ' (Alta)', cat_in, type_in, phase_in, 'alta', 1-((1-k)*1.5), 1-((1-p)*1.5), 1-((1-c)*1.5), 1-((1-g)*1.5));
END; $$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION insert_rule_fit(name_in TEXT, cat_in TEXT, phase_in INT, kg_v NUMERIC, ser_v NUMERIC, rep_v NUMERIC) RETURNS VOID AS $$
BEGIN
    INSERT INTO public.adaptive_rules_catalog (name, category, rule_type, phase, intensity, kg, series, repetiiiciones)
    VALUES (name_in || ' (Baja)', cat_in, 'fitness', phase_in, 'baja', 1-((1-kg_v)*0.3), 1-((1-ser_v)*0.3), 1-((1-rep_v)*0.3));
    INSERT INTO public.adaptive_rules_catalog (name, category, rule_type, phase, intensity, kg, series, repetiiiciones)
    VALUES (name_in || ' (Media)', cat_in, 'fitness', phase_in, 'media', kg_v, ser_v, rep_v);
    INSERT INTO public.adaptive_rules_catalog (name, category, rule_type, phase, intensity, kg, series, repetiiiciones)
    VALUES (name_in || ' (Alta)', cat_in, 'fitness', phase_in, 'alta', 1-((1-kg_v)*1.5), 1-((1-ser_v)*1.5), 1-((1-rep_v)*1.5));
END; $$ LANGUAGE plpgsql;

-- 3. POBLACIÓN
DO $$
BEGIN
    -- NUTRICIÓN: ACTIVIDAD
    PERFORM insert_rule('Actividad: Sedentario', 'activity', 'nutricion', 1, 0.85, 1.00, 0.85, 0.90);
    PERFORM insert_rule('Actividad: Ligera', 'activity', 'nutricion', 1, 0.95, 1.00, 0.95, 0.95);
    PERFORM insert_rule('Actividad: Moderada', 'activity', 'nutricion', 1, 1.00, 1.00, 1.00, 1.00);
    PERFORM insert_rule('Actividad: Activo', 'activity', 'nutricion', 1, 1.10, 1.05, 1.10, 1.05);
    PERFORM insert_rule('Actividad: Muy Activo', 'activity', 'nutricion', 1, 1.20, 1.10, 1.20, 1.05);

    -- NUTRICIÓN: METABÓLICO
    PERFORM insert_rule('Edad: 18–50 años', 'age', 'nutricion', 2, 1.00, 1.00, 1.00, 1.00);
    PERFORM insert_rule('Edad: <18 años', 'age', 'nutricion', 2, 1.10, 1.05, 1.10, 1.05);
    PERFORM insert_rule('Edad: >50 años', 'age', 'nutricion', 2, 0.95, 1.05, 0.95, 1.00);
    
    PERFORM insert_rule('Sexo: Hombre', 'gender', 'nutricion', 2, 1.05, 1.00, 1.05, 1.00);
    PERFORM insert_rule('Sexo: Mujer', 'gender', 'nutricion', 2, 0.90, 1.00, 0.90, 1.00);
    
    PERFORM insert_rule('BMI: Bajo Peso (<18.5)', 'bmi', 'nutricion', 2, 1.15, 1.05, 1.15, 1.05);
    PERFORM insert_rule('BMI: Normal (18.5–29.9)', 'bmi', 'nutricion', 2, 1.00, 1.00, 1.00, 1.00);
    PERFORM insert_rule('BMI: Obesidad (>=30)', 'bmi', 'nutricion', 2, 0.90, 1.05, 0.85, 0.95);

    -- FITNESS: MATRIZ DE EDAD (Granularidad Solicitada)
    PERFORM insert_rule_fit('Edad: Joven (<18)', 'age', 2, 0.80, 0.85, 0.90);
    PERFORM insert_rule_fit('Edad: Joven Adulto (18-25)', 'age', 2, 1.00, 1.00, 1.00);
    PERFORM insert_rule_fit('Edad: Plenitud (26-35)', 'age', 2, 1.05, 1.00, 1.00);
    PERFORM insert_rule_fit('Edad: Maduro I (36-45)', 'age', 2, 1.00, 0.95, 0.95);
    PERFORM insert_rule_fit('Edad: Maduro II (46-55)', 'age', 2, 0.90, 0.90, 0.95);
    PERFORM insert_rule_fit('Edad: Master I (56-65)', 'age', 2, 0.85, 0.85, 0.90);
    PERFORM insert_rule_fit('Edad: Senior (>65)', 'age', 2, 0.75, 0.80, 0.85);

    -- FITNESS: PESO
    PERFORM insert_rule_fit('Peso: Muy Ligero (<50kg)', 'weight', 2, 0.80, 1.00, 1.00);
    PERFORM insert_rule_fit('Peso: Ligero (50-65kg)', 'weight', 2, 0.90, 1.00, 1.00);
    PERFORM insert_rule_fit('Peso: Medio (66-80kg)', 'weight', 2, 1.00, 1.00, 1.00);
    PERFORM insert_rule_fit('Peso: Pesado (81-95kg)', 'weight', 2, 1.05, 1.00, 1.00);
    PERFORM insert_rule_fit('Peso: Intenso (96-110kg)', 'weight', 2, 1.10, 0.95, 0.95);
    PERFORM insert_rule_fit('Peso: Muy Pesado (>110kg)', 'weight', 2, 1.15, 0.90, 0.90);

    -- FITNESS: NIVEL
    PERFORM insert_rule_fit('Nivel: Principiante', 'level', 1, 0.85, 0.80, 0.80);
    PERFORM insert_rule_fit('Nivel: Intermedio', 'level', 1, 1.00, 1.00, 1.00);
    PERFORM insert_rule_fit('Nivel: Avanzado', 'level', 1, 1.10, 1.20, 1.20);

    -- FITNESS: LESIONES
    PERFORM insert_rule_fit('Lesión: Lumbalgia Crónica', 'injury', 3, 0.75, 0.85, 0.85);
    PERFORM insert_rule_fit('Lesión: Hernia Discal L4-L5/S1', 'injury', 3, 0.65, 0.75, 0.80);

END $$;

-- 4. AJUSTES FINALES (Metadata y Suavizado)
-- Sexo: Solo si base es genérica
UPDATE public.adaptive_rules_catalog
SET metadata = metadata || '{"apply_only_if_base_generic": true}'::jsonb
WHERE category = 'gender';

-- Suavizado Sedentario (Alta)
UPDATE public.adaptive_rules_catalog
SET kcal = 0.8200, carbos = 0.8200, grasas = 0.8800
WHERE name = 'Actividad: Sedentario (Alta)';

-- 5. Enable RLS
ALTER TABLE public.adaptive_rules_catalog ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can read rules catalog" ON public.adaptive_rules_catalog FOR SELECT USING (true);
