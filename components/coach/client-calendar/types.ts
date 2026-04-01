export interface ClientCalendarProps {
    clientId: string
    onLastWorkoutUpdate?: (lastWorkoutDate: string | null) => void
    onDaySelected?: () => void
    exercisesListRef?: React.RefObject<HTMLDivElement | null>
}

export interface ExerciseExecution {
    id: string
    ejercicio_id: string
    exercise_key?: string
    completado: boolean
    fecha_ejercicio: string
    duracion?: number
    calorias_estimadas?: number
    nutricion_macros?: {
        proteinas?: number
        carbohidratos?: number
        grasas?: number
        calorias?: number
        minutos?: number
    } | null
    nutrition_record_id?: string
    nutrition_key?: string
    nutrition_bloque?: number
    nutrition_orden?: number
    is_nutricion?: boolean
    nota_cliente?: string
    ejercicio_nombre?: string
    actividad_titulo?: string
    actividad_id?: number
    actividad_coach_id?: string | number | null
    enrollment_id?: number
    version?: number
    detalle_series?: any | null
    ejercicioKeys?: string[] // Keys en detalles_series para este ejercicio (ej: ["1042_1", "1042_2"])
    minutosJson?: any // Minutos JSON del registro para acceder a minutos por bloque
    caloriasJson?: any // Calorías JSON del registro para acceder a kcal por bloque
    original_ejercicio_id?: string // Para limpiar el ejercicio anterior al guardar si se cambió
    receta_texto?: string // Texto de la receta (override o default)
    ingredientes_detalle?: any // Objeto de ingredientes para este plato
    is_workshop?: boolean
    workshop_details?: {
        nombre: string
        descripcion: string | null
    } | null
    sets?: number | string | null
    reps?: number | string | null
    kg?: number | string | null
}

export interface DayData {
    date: string
    exerciseCount: number
    completedCount: number
    totalMinutes: number
    exercises: ExerciseExecution[]
    activities: string[]
}

export interface ClientDaySummaryRow {
    id: string
    client_id: string
    day: string
    activity_id: number | null
    calendar_event_id: string | null
    activity_title: string | null
    coach_id: string | null
    fitness_mins: number | null
    nutri_mins: number | null
    calendar_mins: number | null
    total_mins: number | null
    items_objetivo: number | null
    items_completados: number | null
    fitness_items_planned?: number | null
    fitness_items_done?: number | null
    nutri_items_planned?: number | null
    nutri_items_done?: number | null
    is_workshop?: boolean
    enrollment_id?: number | null
    fit_items_o?: number | null
    fit_items_c?: number | null
    nut_items_o?: number | null
    nut_items_c?: number | null
}

export interface ActivityFilterOption {
    enrollment_id: number
    activity_id: number
    title: string
    version: number
    type?: string
}
