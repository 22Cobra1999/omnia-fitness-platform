/**
 * OMNIA ADAPTIVE MOTOR - CORE LOGIC v3.0
 * Lógica de acumulación de riesgos y blindaje de prescripción.
 */

export interface AdaptiveConfig {
    phases: {
        level: boolean
        characteristics: boolean
        injuries: boolean
    }
    rules: {
        age: boolean
        gender: boolean
        bmi: boolean
    }
}

export interface AdaptiveProfile {
    trainingLevel: "Beginner" | "Intermediate" | "Advanced"
    activityLevel: "Sedentary" | "Lightly Active" | "Moderately Active" | "Very Active"
    ages: number[]
    genders: ("male" | "female")[]
    bmis: number[]
    weight?: number
    injuries: string[]
}

export interface AdaptiveBase {
    sets: number
    series: number
    reps: number
    load_kg: number
}

export interface FactorDetail {
    phase: 1 | 2 | 3
    category: string
    name: string
    peso: number
    series: number
    reps: number
    isActive: boolean
}

export interface AdaptiveResult {
    base: AdaptiveBase
    appliedFactors: FactorDetail[]
    factor_peso_total: number
    factor_series_total: number
    factor_reps_total: number
    wasCapped: {
        peso: boolean
        series: boolean
        reps: boolean
    }
    final: {
        sets: number
        series: number
        reps: number
        load: number
    }
}

export const OMNIA_DEFAULTS = {
    PHASE1_LEVEL: {
        "Beginner": { peso: 0.85, series: 0.80, reps: 0.80 },
        "Intermediate": { peso: 1.00, series: 1.00, reps: 1.00 },
        "Advanced": { peso: 1.10, series: 1.20, reps: 1.20 }
    },
    PHASE2_AGE: (age: number) => {
        if (age < 18) return { peso: 0.80, series: 0.85, reps: 0.90 }
        if (age <= 25) return { peso: 1.00, series: 1.00, reps: 1.00 }
        if (age <= 35) return { peso: 1.05, series: 1.00, reps: 1.00 }
        if (age <= 45) return { peso: 1.00, series: 0.95, reps: 0.95 }
        if (age <= 55) return { peso: 0.90, series: 0.90, reps: 0.95 }
        if (age <= 65) return { peso: 0.85, series: 0.85, reps: 0.90 }
        return { peso: 0.75, series: 0.80, reps: 0.85 } // >65
    },
    PHASE2_GENDER: {
        "male": { peso: 1.00, series: 1.00, reps: 1.00 },
        "female": { peso: 0.90, series: 1.00, reps: 1.00 }
    },
    PHASE2_WEIGHT: (weight: number) => {
        if (weight < 50) return { peso: 0.80, series: 1.00, reps: 1.00 }
        if (weight <= 65) return { peso: 0.90, series: 1.00, reps: 1.00 }
        if (weight <= 80) return { peso: 1.00, series: 1.00, reps: 1.00 }
        if (weight <= 95) return { peso: 1.05, series: 1.00, reps: 1.00 }
        if (weight <= 110) return { peso: 1.10, series: 0.95, reps: 0.95 }
        return { peso: 1.15, series: 0.90, reps: 0.90 } // >110
    },
    PHASE2_BMI: (bmi: number) => {
        if (bmi < 18.5) return { peso: 0.90, series: 1.00, reps: 1.00 }
        if (bmi <= 24.9) return { peso: 1.00, series: 1.00, reps: 1.00 }
        if (bmi <= 29.9) return { peso: 1.00, series: 0.95, reps: 0.95 }
        return { peso: 0.85, series: 0.90, reps: 0.90 }
    },
    PHASE3_INJURIES: {
        "Lumbalgia": { peso: 0.80, series: 0.90, reps: 0.90 },
        "Hernia Discal": { peso: 0.75, series: 0.85, reps: 0.85 },
        "Escoliosis": { peso: 0.85, series: 0.95, reps: 0.95 },
        "Rodilla": { peso: 0.85, series: 0.90, reps: 0.90 },
        "Hombro": { peso: 0.85, series: 0.90, reps: 0.90 },
        "Cervicales": { peso: 0.85, series: 0.90, reps: 0.90 },
        "Muñeca / Mano": { peso: 0.90, series: 0.95, reps: 0.95 },
        "Tobillo": { peso: 0.90, series: 0.95, reps: 0.95 },
        "Cadera": { peso: 0.85, series: 0.90, reps: 0.90 },
        "Tendinitis": { peso: 0.85, series: 0.95, reps: 0.95 }
    },
    // NUEVO: SISTEMA DE INTENSIDAD NUTRICIONAL
    NUTRITION_INTENSITY: {
        "Leve": 0.3,       // Aplica el 30% del delta
        "Intermedio": 1.0,  // Aplica el 100% del delta
        "Alto": 1.5        // Aplica el 150% del delta (más agresivo)
    },
    PHASE1_ACTIVITY: {
        "Sedentary": { kcal: 0.85, protein: 1.00, carbs: 0.85, fats: 0.90 },
        "Lightly Active": { kcal: 0.95, protein: 1.00, carbs: 0.95, fats: 0.95 },
        "Moderately Active": { kcal: 1.00, protein: 1.00, carbs: 1.00, fats: 1.00 },
        "Active": { kcal: 1.10, protein: 1.05, carbs: 1.10, fats: 1.05 },
        "Very Active": { kcal: 1.20, protein: 1.10, carbs: 1.20, fats: 1.05 }
    },
    NUTRITION_LIMITS: {
        kcal: { min: 0.75, max: 1.30 },
        protein: { min: 0.85, max: 1.20 },
        carbs: { min: 0.70, max: 1.30 },
        fats: { min: 0.75, max: 1.25 }
    }
}

export function reconstructPrescription(
    base: AdaptiveBase,
    profile: AdaptiveProfile,
    ruleIds?: number[] // Now using activity.adaptive_rule_ids
): AdaptiveResult {
    // Normalización de niveles (Soporte Multi-idioma / DB)
    const normalizeLevel = (lvl: string): "Beginner" | "Intermediate" | "Advanced" => {
        const l = (lvl || '').toLowerCase();
        if (l.includes('principiante') || l.includes('beginner') || l.includes('bajo')) return "Beginner";
        if (l.includes('avanzado') || l.includes('advanced') || l.includes('alto')) return "Advanced";
        return "Intermediate"; // Fallback seguro
    };

    // Normalización de Género
    const normalizedGenders = profile.genders.map(g => {
        const s = (g || '').toLowerCase();
        if (s.includes('masculino') || s.includes('hombre') || s.includes('male')) return 'male' as const;
        if (s.includes('femenino') || s.includes('mujer') || s.includes('female')) return 'female' as const;
        return 'male' as const; // Default
    });

    const level = normalizeLevel(profile.trainingLevel);
    const appliedFactors: FactorDetail[] = []
    let pesoFactorTotal = 1.0
    let seriesFactorTotal = 1.0
    let repsFactorTotal = 1.0

    // MODO MAESTRO: Si ruleIds incluye 0, se aplican todas las reglas.
    const isMasterMode = ruleIds?.includes(0)

    const isRuleActive = (category: string, value: string) => {
        if (!ruleIds || isMasterMode) return true
        return true
    }

    // FASE 1: NIVEL
    if (isRuleActive('level', level)) {
        const mult = OMNIA_DEFAULTS.PHASE1_LEVEL[level] || { peso: 1, series: 1, reps: 1 };
        pesoFactorTotal *= (mult.peso || 1.0)
        seriesFactorTotal *= (mult.series || 1.0)
        repsFactorTotal *= (mult.reps || 1.0)
        appliedFactors.push({ phase: 1, category: "Nivel", name: level, ...mult, isActive: true })
    }

    // FASE 2: CARACTERÍSTICAS
    // Edad
    if (profile.ages.length > 0) {
        profile.ages.forEach(age => {
            if (age === 30 && profile.ages.length === 1) return; // Skip if it's default
            const m = OMNIA_DEFAULTS.PHASE2_AGE(age)
            pesoFactorTotal *= (m.peso || 1.0)
            seriesFactorTotal *= (m.series || 1.0)
            repsFactorTotal *= (m.reps || 1.0)
            appliedFactors.push({ phase: 2, category: "Edad", name: `${age} años`, ...m, isActive: true })
        })
    }

    // Peso
    if (profile.weight && profile.weight > 0) {
        const m = OMNIA_DEFAULTS.PHASE2_WEIGHT(profile.weight)
        pesoFactorTotal *= (m.peso || 1.0)
        seriesFactorTotal *= (m.series || 1.0)
        repsFactorTotal *= (m.reps || 1.0)
        appliedFactors.push({ phase: 2, category: "Peso", name: `${profile.weight}kg`, ...m, isActive: true })
    }

    // Sexo
    if (normalizedGenders.length > 0) {
        normalizedGenders.forEach(g => {
            if (isRuleActive('gender', g)) {
                const m = OMNIA_DEFAULTS.PHASE2_GENDER[g] || { peso: 1, series: 1, reps: 1 };
                pesoFactorTotal *= (m.peso || 1.0)
                seriesFactorTotal *= (m.series || 1.0)
                repsFactorTotal *= (m.reps || 1.0)
                appliedFactors.push({ phase: 2, category: "Sexo", name: g === 'male' ? 'H' : 'M', ...m, isActive: true })
            }
        })
    }

    // ✅ FASE 3: LESIONES (CLÍNICO v3.0)
    const calculateInjuryFactor = (injuryWithSev: string) => {
        const parts = injuryWithSev.split('_')
        const rawName = parts[0]
        const sev = parts[1] || 'medium'

        // Normalización básica de nombres de lesiones comunes
        let injuryName = rawName;
        const lowerName = rawName.toLowerCase();
        if (lowerName.includes('lumbar') || lowerName.includes('espalda baja')) injuryName = 'Lumbalgia';
        if (lowerName.includes('hernia')) injuryName = 'Hernia Discal';
        if (lowerName.includes('rodilla')) injuryName = 'Rodilla';
        if (lowerName.includes('hombro')) injuryName = 'Hombro';

        const baseMult = (OMNIA_DEFAULTS.PHASE3_INJURIES as any)[injuryName] || { peso: 0.85, series: 0.90, reps: 0.90 }

        if (sev === 'low') return { peso: 0.90, series: 0.95, reps: 0.95 }
        if (sev === 'high') return {
            peso: Math.round(baseMult.peso * 0.8 * 100) / 100,
            series: Math.round(baseMult.series * 0.85 * 100) / 100,
            reps: Math.round(baseMult.series * 0.85 * 100) / 100
        }

        return baseMult // Medium
    }

    if (profile.injuries.length > 0) {
        profile.injuries.forEach(inj => {
            const nameOnly = inj.split('_')[0]
            if (isRuleActive('injuries', nameOnly)) {
                const m = calculateInjuryFactor(inj)
                pesoFactorTotal *= (m.peso || 1.0)
                seriesFactorTotal *= (m.series || 1.0)
                repsFactorTotal *= (m.reps || m.series || 1.0)
                appliedFactors.push({ phase: 3, category: "Seguridad", name: inj, ...m, isActive: true })
            }
        })
    }

    // Blindajes Finales
    pesoFactorTotal = Math.max(0.50, Math.min(1.45, pesoFactorTotal))
    seriesFactorTotal = Math.max(0.60, Math.min(1.70, seriesFactorTotal))

    let finalLoad = base.load_kg * pesoFactorTotal
    let finalSets = Math.round(base.sets * seriesFactorTotal)
    let finalSeries = Math.round((base.series || base.sets) * seriesFactorTotal) // Fallback to sets if series not provided
    let finalReps = Math.round(base.reps * (repsFactorTotal || seriesFactorTotal))

    if (finalSets < 1) finalSets = 1
    if (finalSeries < 1) finalSeries = 1
    if (finalReps < 1) finalReps = 1
    finalLoad = Math.round(finalLoad / 2.5) * 2.5

    return {
        base,
        appliedFactors,
        factor_series_total: seriesFactorTotal,
        factor_peso_total: pesoFactorTotal,
        factor_reps_total: repsFactorTotal,
        wasCapped: { peso: false, series: false, reps: false },
        final: { sets: finalSets, series: finalSeries, reps: finalReps, load: finalLoad }
    }
}

/**
 * LÓGICA DE INGREDIENTES NUTRICIONALES
 */
export function adjustIngredientManual(
    cantidad: string | number,
    unidad: string,
    factorTotal: number, // Ej: 0.90 (reducción del 10%)
    intensity: "Leve" | "Intermedio" | "Alto" = "Intermedio"
): { cantidad: number; unidad: string } {
    const numQty = typeof cantidad === 'string' ? parseFloat(cantidad) : cantidad
    if (isNaN(numQty)) return { cantidad: 0, unidad }

    // Aplicar escala de intensidad al "castigo" (la diferencia con 1.0)
    const intensityScale = OMNIA_DEFAULTS.NUTRITION_INTENSITY[intensity]
    const delta = 1.0 - factorTotal
    const adjustedFactor = 1.0 - (delta * intensityScale)

    let finalQty = numQty * adjustedFactor

    // Redondeos inteligentes segun unidad
    const u = unidad.toLowerCase()
    if (u === 'g' || u === 'gr' || u === 'gramos' || u === 'ml') {
        finalQty = Math.round(finalQty / 5) * 5 // Múltiplos de 5
    } else if (u === 'un' || u === 'u' || u === 'unidad' || u === 'unidades') {
        finalQty = Math.round(finalQty * 4) / 4 // Cuartos (0.25, 0.5, 0.75...)
    } else {
        finalQty = Math.round(finalQty * 10) / 10 // Un decimal
    }

    return { cantidad: finalQty, unidad }
}

export function reconstructNutrition(
    profile: AdaptiveProfile,
    intensity: "Leve" | "Intermedio" | "Alto" = "Intermedio"
): { factorKcal: number; factorProtein: number; factorCarbs: number; factorFats: number; targetPercent: number } {
    let kcalF = 1.0
    let protF = 1.0
    let carbF = 1.0
    let fatF = 1.0

    const applyAccumulated = (m: any) => {
        if (!m) return
        kcalF *= (m.kcal || 1.0)
        protF *= (m.protein || 1.0)
        carbF *= (m.carbs || 1.0)
        fatF *= (m.fats || 1.0)
    }

    // 1. FASE 1: ACTIVIDAD
    applyAccumulated(OMNIA_DEFAULTS.PHASE1_ACTIVITY[profile.activityLevel])

    // 2. FASE 2: CARACTERÍSTICAS
    // Edad
    const age = profile.ages[0] || 30
    if (age < 18) {
        applyAccumulated({ kcal: 1.10, protein: 1.05, carbs: 1.10, fats: 1.05 })
    } else if (age > 50) {
        applyAccumulated({ kcal: 0.95, protein: 1.05, carbs: 0.95, fats: 1.00 })
    }

    // Sexo
    if (profile.genders.includes("male")) applyAccumulated({ kcal: 1.05, protein: 1.00, carbs: 1.05, fats: 1.00 })
    if (profile.genders.includes("female")) applyAccumulated({ kcal: 0.90, protein: 1.00, carbs: 0.90, fats: 1.00 })

    // BMI
    const bmi = profile.bmis[0] || 24
    if (bmi < 18.5) {
        applyAccumulated({ kcal: 1.15, protein: 1.05, carbs: 1.15, fats: 1.05 })
    } else if (bmi >= 30) {
        applyAccumulated({ kcal: 0.90, protein: 1.05, carbs: 0.85, fats: 0.95 })
    }

    // APLICAR LÓGICA DE INTENSIDAD (Castigo proporcional)
    const intensityScale = OMNIA_DEFAULTS.NUTRITION_INTENSITY[intensity]
    const adjustScale = (f: number) => 1.0 - ((1.0 - f) * intensityScale)

    kcalF = adjustScale(kcalF)
    protF = adjustScale(protF)
    carbF = adjustScale(carbF)
    fatF = adjustScale(fatF)

    // 3. LÍMITES GLOBALES (Capping)
    const L = OMNIA_DEFAULTS.NUTRITION_LIMITS
    kcalF = Math.max(L.kcal.min, Math.min(L.kcal.max, kcalF))
    protF = Math.max(L.protein.min, Math.min(L.protein.max, protF))
    carbF = Math.max(L.carbs.min, Math.min(L.carbs.max, carbF))
    fatF = Math.max(L.fats.min, Math.min(L.fats.max, fatF))

    return {
        factorKcal: kcalF,
        factorProtein: protF,
        factorCarbs: carbF,
        factorFats: fatF,
        targetPercent: Math.round(kcalF * 100)
    }
}
