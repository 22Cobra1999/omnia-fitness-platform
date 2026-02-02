import { Globe, MapPin, MonitorSmartphone, Monitor, Users, Combine } from 'lucide-react'

// Types
export type ProductType = 'workshop' | 'program' | 'document'
export type ProgramSubType = 'fitness' | 'nutrition'
export type DeliveryModality = 'online' | 'presencial' | 'hibrido'
export type IntensityLevel = 'beginner' | 'intermediate' | 'advanced'
export type PlanType = 'free' | 'basico' | 'black' | 'premium'

// Constants
export const FITNESS_OBJECTIVE_GROUPS = {
    Entrenamiento: [
        'Fuerza',
        'Pérdida de peso',
        'Ganancia muscular',
        'Resistencia',
        'Potencia',
        'Velocidad',
        'Movilidad',
        'Flexibilidad',
        'Coordinación',
        'Equilibrio'
    ],
    Deporte: [
        'Fútbol',
        'Running',
        'Tenis',
        'Básquet',
        'Natación',
        'Ciclismo',
        'Yoga'
    ]
} as const

export const NUTRITION_OBJECTIVE_GROUPS = {
    Objetivo: [
        'Pérdida de peso',
        'Ganancia muscular',
        'Mejorar hábitos',
        'Rendimiento deportivo'
    ],
    Dieta: [
        'Balanceada',
        'Mediterránea',
        'Baja en carbohidratos',
        'Keto',
        'Paleo',
        'Vegana',
        'Vegetariana'
    ],
    Enfoque: ['Salud digestiva']
} as const

export const FITNESS_RESTRICTION_GROUPS = {
    Lesión: ['Rodilla', 'Hombro', 'Espalda', 'Tobillo', 'Muñeca'],
    Condición: ['Hipertensión', 'Embarazo']
} as const

export const NUTRITION_RESTRICTION_GROUPS = {
    Alergia: ['Gluten', 'Lactosa', 'Maní', 'Frutos secos', 'Huevos', 'Mariscos'],
    Preferencia: ['Vegana', 'Vegetariana']
} as const

export const INTENSITY_CHOICES = [
    { value: 'beginner', label: 'Principiante', flames: 1 },
    { value: 'intermediate', label: 'Intermedio', flames: 2 },
    { value: 'advanced', label: 'Avanzado', flames: 3 }
] as const

export const MODALITY_CHOICES = [
    { value: 'online', label: '100% Online', icon: Monitor, tone: 'text-blue-400' },
    { value: 'presencial', label: 'Presencial', icon: Users, tone: 'text-green-400' },
    { value: 'hibrido', label: 'Híbrido', icon: Combine, tone: 'text-purple-400' }
] as const

export const PLAN_COMMISSIONS: Record<PlanType, number> = {
    free: 0.05,
    basico: 0.05,
    black: 0.04,
    premium: 0.03
}

export const PLAN_LABELS: Record<PlanType, string> = {
    free: 'Free',
    basico: 'Básico',
    black: 'Black',
    premium: 'Premium'
}

// Helpers
export const groupsToSelectItems = (groups: Record<string, readonly string[]>) => {
    return Object.entries(groups).map(([label, options]) => ({
        label,
        options: Array.from(options)
    }))
}

export const splitSemicolonList = (value: unknown): string[] => {
    if (Array.isArray(value)) {
        return Array.from(
            new Set(
                value
                    .map((v) => String(v ?? '').trim())
                    .filter((v) => v.length > 0)
            )
        )
    }

    if (typeof value === 'string') {
        return Array.from(
            new Set(
                value
                    .split(';')
                    .map((v) => v.trim())
                    .filter((v) => v.length > 0)
            )
        )
    }

    return []
}
