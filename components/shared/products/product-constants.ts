import { Globe, MapPin, MonitorSmartphone, Monitor, Users, Combine } from 'lucide-react'

// Types
export type ProductType = 'workshop' | 'program' | 'document'
export type ProgramSubType = 'fitness' | 'nutrition'
export type DeliveryModality = 'online' | 'presencial' | 'hibrido'
export type IntensityLevel = 'beginner' | 'intermediate' | 'advanced'
export type PlanType = 'free' | 'basico' | 'black' | 'premium'

export interface DocumentTopic {
    id: string
    title: string
    description: string
    saved: boolean
}

export interface DocumentMaterialState {
    pdfType: 'general' | 'by-topic'
    pdfUrl: string | null
    pdfFile: File | null
    pdfFileName: string | null
    topics: DocumentTopic[]
    topicPdfs: Record<string, { url: string | null, file: File | null, fileName: string | null }>
}

export interface WorkshopMaterialState {
    pdfType: 'none' | 'general' | 'by-topic'
    pdfFile: File | null
    pdfUrl: string | null
    topicPdfs: Record<string, { url: string | null, file: File | null, fileName: string | null }>
}


export type InlineMediaType = 'image' | 'video'

export interface InlineMediaItem {
    id: string
    filename: string
    url: string
    mediaType: InlineMediaType
    size?: number
    mimeType?: string
}

export type PdfSelectionContext = { scope: 'general' } | { scope: 'topic', topicTitle: string } | null


// Constants
export interface GeneralFormState {
    name: string
    description: string
    price: string
    image: File | { url: string } | null
    videoUrl: string
    modality: string
    included_meet_credits: number
    is_public: boolean
    objetivos: string[]
    restricciones: string[]
    capacity: string
    stockQuantity: string
    dietType: string
    dias_acceso: number
    location_name: string
    location_url: string
    workshop_mode: 'individual' | 'grupal'
    participants_per_class?: number
    duration_value: string
    duration_unit: 'días' | 'semanas' | 'meses'
}

export interface SpecificFormState {
    duration: string
    capacity: string
    workshopType: string
    startDate: string
    endDate: string
    level: string
    availabilityType: string
    stockQuantity: string
    sessionsPerClient: string
    activities: any
    documentType: string
    document: File | { url: string } | null
    pages: string
}

export const FITNESS_OBJECTIVE_GROUPS = {
    "Físico": [
        'Pérdida de peso',
        'Ganancia muscular',
        'Definición muscular',
        'Hipertrofia',
        'Recomposición corporal',
        'Tonificación',
        'Aumento de glúteos',
        'Abdominales marcados'
    ],
    "Rendimiento": [
        'Fuerza máxima',
        'Resistencia cardiovascular',
        'Potencia explosiva',
        'Velocidad',
        'Movilidad articular',
        'Flexibilidad',
        'Coordinación',
        'Equilibrio',
        'Calistenia',
        'Crossfit',
        'Halterofilia'
    ],
    "Salud": [
        'Postura corporal',
        'Salud de espalda',
        'Reducir estrés',
        'Mejorar el sueño',
        'Longevidad / Anti-edad',
        'Rehabilitación funcional',
        'Prevenir lesiones'
    ],
    "Deporte": [
        'Fútbol',
        'Running / Maratón',
        'Tenis / Padel',
        'Básquet',
        'Natación',
        'Ciclismo',
        'Boxeo / MMA',
        'Rugby',
        'Vóley',
        'Golf',
        'Yoga'
    ]
} as const

export const NUTRITION_OBJECTIVE_GROUPS = {
    "Objetivo Principal": [
        'Pérdida de grasa',
        'Ganancia de masa muscular',
        'Mantenimiento',
        'Mejorar relación con comida',
        'Aumentar energía diaria',
        'Rendimiento deportivo máximo',
        'Recuperación post-entrenamiento'
    ],
    "Tipo de Dieta": [
        'Balanceada / Flexible',
        'Mediterránea',
        'Baja en carbohidratos (Low Carb)',
        'Cetogénica (Keto)',
        'Paleolítica',
        'Vegana',
        'Vegetariana',
        'Carnívora',
        'Sin procesados',
        'Ayuno intermitente'
    ],
    "Enfoque de Salud": [
        'Salud digestiva / Microbiota',
        'Anti-inflamatorio',
        'Control glucémico / Diabetes',
        'Salud hormonal',
        'Desintoxicación / Limpieza',
        'Salud cardiovascular'
    ]
} as const

export const FITNESS_RESTRICTION_GROUPS = {
    "Lesiones Articulares": [
        'Rodilla',
        'Hombro',
        'Espalda / Lumbar',
        'Cuello / Cervical',
        'Tobillo',
        'Muñeca',
        'Codo',
        'Cadera'
    ],
    "Patologías / Salud": [
        'Hipertensión',
        'Hipotensión',
        'Embarazo',
        'Post-parto',
        'Asma / Respiratorio',
        'Escoliosis',
        'Hernia de disco',
        'Diabetes',
        'Obesidad grado II+',
        'Osteoporosis'
    ],
    "Equipamiento": [
        'Sin materiales (Bodyweight)',
        'Solo bandas elásticas',
        'Solo mancuernas',
        'Entrenamiento doméstico',
        'Gimnasio limitado'
    ]
} as const

export const NUTRITION_RESTRICTION_GROUPS = {
    "Alergias / Intolerancias": [
        'Gluten (Celiaco)',
        'Lactosa / Lácteos',
        'Maní / Frutos secos',
        'Huevos',
        'Mariscos / Pescado',
        'Soya',
        'Frituras',
        'Azúcares refinados'
    ],
    "Preferencia / Etica": [
        '100% Vegana',
        'Ovo-lacto vegetariana',
        'Pescetariana',
        'Sin carnes rojas',
        'Sin harinas blancas',
        'Kosher / Halal'
    ]
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
