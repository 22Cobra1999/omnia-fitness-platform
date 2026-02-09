export interface Exercise {
    id: string
    name: string
    description?: string
    duration?: number | null
    duracion_min?: number | null
    type?: string
    tipo?: string
    intensity?: string
    equipment?: string
    bodyParts?: string
    calories?: number | null
    calorias?: number | null
    peso?: string
    reps?: string
    series?: string
    detalle_series?: string
    block?: number
    bloque?: number
    orden?: number
    // Campos específicos para nutrición
    proteinas?: number
    carbohidratos?: number
    grasas?: number
    // Campos para estado activo
    is_active?: boolean
    activo?: boolean
    // Campos adicionales para compatibilidad
    nombre_ejercicio?: string
    dificultad?: string
    video_url?: string
}

export type DayScheduleEntry =
    | Exercise[]
    | {
        ejercicios?: Exercise[]
        exercises?: Exercise[]
        blockNames?: { [key: number]: string }
        blockCount?: number
    }

export type DaySchedulePayload = {
    exercises: Exercise[]
    ejercicios: Exercise[]
    blockNames: { [key: number]: string }
    blockCount: number
}

export interface WeeklySchedule {
    [weekNumber: number]: {
        [dayNumber: number]: DayScheduleEntry
    }
}

export interface WeeklyExercisePlannerProps {
    exercises: any[]
    onScheduleChange?: (schedule: WeeklySchedule) => void
    onPeriodsChange?: (periods: number) => void
    onStatsChange?: (stats: any) => void
    initialSchedule?: WeeklySchedule
    initialPeriods?: number
    activityId?: number
    isEditing?: boolean
    productCategory?: string
    planLimits?: {
        activitiesLimit?: number
        weeksLimit?: number
    } | null
    onUndoAvailable?: (canUndo: boolean) => void
    onUndo?: () => void
}
