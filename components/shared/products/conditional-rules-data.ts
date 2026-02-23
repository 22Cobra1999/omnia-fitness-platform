export interface ConditionalRule {
    id: string
    name: string
    isActive: boolean
    criteria: {
        type?: "fitness" | "nutricion"
        gender?: "male" | "female" | "all"
        ageRange?: [number, number]
        weightRange?: [number, number]
        activityLevel?: string[]
        programLevel?: string[]
        fitnessGoals?: string[]
        injuries?: string[]
    }
    adjustments: {
        weight?: number // percentage
        reps?: number // percentage
        series?: number // percentage
        rest?: number // percentage
        portions?: number // percentage (nutrition)
    }
    affectedItems: "all" | string[]
    targetProductIds?: (number | string)[]
}

export const FITNESS_GOALS_OPTIONS = [
    "Subir de peso",
    "Bajar de peso",
    "Quemar grasas",
    "Ganar masa muscular",
    "Mejorar condición física",
    "Tonificar",
    "Mejorar flexibilidad",
    "Reducir estrés",
    "Controlar respiración",
    "Corregir postura",
    "Meditación y Mindfulness",
    "Equilibrio corporal",
    "Aumentar resistencia",
    "Salud articular",
]


export const ACTIVITY_LEVEL_OPTIONS = ["Sedentario", "Ligero", "Moderado", "Activo", "Muy Activo"]

export const INJURY_OPTIONS = [
    "Espalda (Lumbalgia)",
    "Rodilla",
    "Hombro",
    "Cervicales",
    "Muñeca / Mano",
    "Tobillo",
    "Cadera",
    "Hernia Discal",
    "Escoliosis",
    "Tendinitis",
]
