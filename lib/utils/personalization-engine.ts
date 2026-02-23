
/**
 * Motor de Personalización OMNIA (Power Edition)
 * Versión Robusta: Capaz de procesar biometría, encuestas, biometrías y lesiones.
 */

export interface ClientProfile {
    gender?: string;
    birth_date?: string;
    current_weight?: number;
    current_height?: number;
    intensity_level?: string;
    fitness_goals?: string[];
    injuries?: any[];
    change_goal?: string;
    training_modality?: string;
    coaching_style?: string;
    consistency_level?: string;
    [key: string]: any;
}

export interface ConditionalRule {
    id: string;
    name: string;
    criteria: {
        gender?: string;
        ageRange?: [number, number];
        weightRange?: [number, number];
        heightRange?: [number, number];
        activityLevel?: string[];
        fitnessGoals?: string[];
        hasInjuries?: boolean; // Si la regla aplica solo a lesionados o solo a sanos
        specificInjuries?: string[]; // Si aplica a lesiones específicas
        onboardingResponses?: {
            change_goal?: string[];
            training_modality?: string[];
            coaching_style?: string[];
        };
        [key: string]: any;
    };
    adjustments: {
        weight?: number;
        reps?: number;
        series?: number;
        portions?: number;
    };
    affected_items: 'all' | string[];
}

export function calculateAge(birthDate: string): number {
    const birth = new Date(birthDate);
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const m = now.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
        age--;
    }
    return age;
}

export function applyPersonalization(
    baseItem: any,
    profile: ClientProfile,
    rules: ConditionalRule[]
): any {
    let adjustedItem = { ...baseItem };
    const age = profile.birth_date ? calculateAge(profile.birth_date) : null;

    // Filtrar reglas que aplican al perfil del cliente
    const activeRules = rules.filter(rule => {
        const { criteria } = rule;

        // 1. Género (Case insensitive for robustness)
        if (criteria.gender && criteria.gender.toLowerCase() !== 'all') {
            const profileGender = profile.gender?.toLowerCase();
            const criteriaGender = criteria.gender.toLowerCase();
            if (criteriaGender !== profileGender) return false;
        }

        // 2. Edad
        if (criteria.ageRange && age !== null) {
            if (age < criteria.ageRange[0] || age > criteria.ageRange[1]) return false;
        }

        // 3. Peso
        if (criteria.weightRange && profile.current_weight) {
            if (profile.current_weight < criteria.weightRange[0] || profile.current_weight > criteria.weightRange[1]) return false;
        }

        // 4. Altura
        if (criteria.heightRange && profile.current_height) {
            if (profile.current_height < criteria.heightRange[0] || profile.current_height > criteria.heightRange[1]) return false;
        }

        // 5. Nivel de Actividad (Onboarding)
        if (criteria.activityLevel && criteria.activityLevel.length > 0 && profile.intensity_level) {
            if (!criteria.activityLevel.includes(profile.intensity_level)) return false;
        }

        // 6. Objetivos (Interests)
        if (criteria.fitnessGoals && criteria.fitnessGoals.length > 0 && profile.fitness_goals) {
            const hasGoalMatch = criteria.fitnessGoals.some(goal => profile.fitness_goals?.includes(goal));
            if (!hasGoalMatch) return false;
        }

        // 7. LESIONES (Crucial)
        if (criteria.hasInjuries !== undefined) {
            const clientHasInjuries = profile.injuries && profile.injuries.length > 0;
            if (criteria.hasInjuries !== clientHasInjuries) return false;
        }

        // 8. Lesiones Específicas
        if (criteria.specificInjuries && criteria.specificInjuries.length > 0 && profile.injuries) {
            const hasSpecificMatch = criteria.specificInjuries.some(injuryName =>
                profile.injuries?.some(i => i.name.toLowerCase().includes(injuryName.toLowerCase()))
            );
            if (!hasSpecificMatch) return false;
        }

        // 9. Respuestas Detalladas de Onboarding
        if (criteria.onboardingResponses) {
            const { change_goal, training_modality } = criteria.onboardingResponses;
            if (change_goal && !change_goal.includes(profile.change_goal || '')) return false;
            if (training_modality && !training_modality.includes(profile.training_modality || '')) return false;
        }

        return true;
    });

    // Aplicar ajustes de las reglas que pasaron el filtro
    activeRules.forEach(rule => {
        if (rule.affected_items !== 'all' && !rule.affected_items.includes(baseItem.id.toString())) {
            return;
        }

        const { adjustments } = rule;

        // Guardar rastro de qué reglas se aplicaron para transparencia en el UI
        adjustedItem.applied_rules = [...(adjustedItem.applied_rules || []), rule.name];

        // Ajustar Macronutrientes y Ingredientes (si es comida)
        if (adjustments.portions && (adjustedItem.calorias || adjustedItem.proteinas || adjustedItem.ingredientes_detalle)) {
            const factor = 1 + (adjustments.portions / 100);

            // 1. Ajustar Valores Numéricos Directos (Kcal/Macros)
            if (adjustedItem.calorias) adjustedItem.calorias = Math.round(adjustedItem.calorias * factor);
            if (adjustedItem.proteinas) adjustedItem.proteinas = Number((adjustedItem.proteinas * factor).toFixed(1));
            if (adjustedItem.carbohidratos) adjustedItem.carbohidratos = Number((adjustedItem.carbohidratos * factor).toFixed(1));
            if (adjustedItem.grasas) adjustedItem.grasas = Number((adjustedItem.grasas * factor).toFixed(1));

            // 2. Ajustar Ingredientes Detallados (Si los tiene)
            if (adjustedItem.ingredientes_detalle) {
                const ings = { ...adjustedItem.ingredientes_detalle };
                Object.keys(ings).forEach(key => {
                    const ing = ings[key];
                    const numQty = typeof ing.cantidad === 'string' ? parseFloat(ing.cantidad) : Number(ing.cantidad);
                    if (!isNaN(numQty)) {
                        let newQty = numQty * factor;
                        const unit = (ing.unidad || '').toLowerCase();

                        // Redondeo inteligente segun unidad
                        if (unit === 'g' || unit === 'gr' || unit === 'gramos' || unit === 'ml') {
                            newQty = Math.round(newQty / 5) * 5;
                        } else if (unit === 'un' || unit === 'u' || unit === 'unidad' || unit === 'unidades') {
                            newQty = Math.round(newQty * 4) / 4;
                        } else {
                            newQty = Math.round(newQty * 10) / 10;
                        }

                        ings[key] = { ...ing, cantidad: String(newQty) };
                    }
                });
                adjustedItem.ingredientes_detalle = ings;
            }
        }

        // Ajustar Fitness
        if (adjustedItem.detalle_series || adjustedItem.activity_id) {
            adjustedItem.prescription_adjustments = {
                ...(adjustedItem.prescription_adjustments || {}),
                ...adjustments
            };
        }
    });

    return adjustedItem;
}
