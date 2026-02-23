-- Migration: Add technical rule IDs to clients and update consolidated view
-- This allows the system to store specific catalog IDs (integer array) for precise personalization.

-- 1. Add technical columns to public.clients
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS profile_rule_ids integer[] DEFAULT '{}';
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS injury_rule_ids integer[] DEFAULT '{}';

-- 2. Update the view to include these new technical columns
CREATE OR REPLACE VIEW public.client_full_profile AS
SELECT 
    c.id as client_id,
    c.full_name,
    c.weight as current_weight,
    c."Height" as current_height,
    c.birth_date,
    c."Genre" as gender,
    c.fitness_goals,
    c.nivel_actividad,
    c.profile_rule_ids, -- Technical IDs for Fase 1 & 2
    c.injury_rule_ids,  -- Technical IDs for Fase 3
    o.intensity_level,
    o.interests as onboarding_interests,
    o.change_goal,
    o.training_modality,
    o.coaching_style,
    COALESCE(
        (
            SELECT jsonb_agg(jsonb_build_object(
                'name', ui.name, 
                'severity', ui.severity, 
                'muscle_group', ui.muscle_group,
                'restrictions', ui.restrictions
            ))
            FROM public.user_injuries ui
            WHERE ui.user_id = c.id
        ), 
        '[]'::jsonb
    ) as injuries
FROM public.clients c
LEFT JOIN public.client_onboarding_responses o ON o.client_id = c.id;
