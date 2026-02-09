
export interface SimpleExerciseData {
    nombre?: string
    descripcion?: string
    duracion_min?: string | number
    video_url?: string
    [key: string]: any
}

export interface ExerciseData extends SimpleExerciseData {
    id?: number
    isExisting?: boolean
    created_at?: string
    is_active?: boolean
    activity_id?: any
}

export interface ManualFormState {
    nombre: string
    descripcion: string
    duracion_min: string
    tipo_ejercicio: string
    nivel_intensidad: string
    equipo_necesario: string
    detalle_series: string
    partes_cuerpo: string
    calorias: string
    comida: string
    tipo: string
    proteinas: string
    carbohidratos: string
    grasas: string
    dificultad: string
    peso: string
    receta: string
    ingredientes: string
    porciones: string
    minutos: string
    video_url: string
    video_file_name: string
    video_source: string
    bunny_video_id: string
    bunny_library_id: string
    video_thumbnail_url: string
}

export interface CSVManagerEnhancedProps {
    activityId: number
    coachId: string
    onSuccess?: () => void
    onRemoveCSV?: () => void
    onDownloadCSV?: () => void
    csvFileName?: string
    csvData?: any[]
    setCsvData?: (data: any[]) => void
    selectedRows?: Set<number>
    setSelectedRows?: (rows: Set<number>) => void
    productCategory?: 'fitness' | 'nutricion'
    onItemsStatusChange?: (items: any[], action: 'disable' | 'reactivate' | 'remove') => void
    onVideoCleared?: (index: number, exercise: any, meta?: { bunnyVideoId?: string; bunnyLibraryId?: number | string; videoUrl?: string }) => void
    planLimits?: {
        planType?: string
        activitiesLimit?: number
    } | null
    renderAfterTable?: React.ReactNode
    onVideoFileSelected?: (exercise: any, index: number, videoFile: File) => void
}
