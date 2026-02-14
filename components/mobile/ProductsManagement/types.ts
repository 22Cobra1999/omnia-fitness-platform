export type Product = {
    id: number
    title: string
    description: string
    type: string
    difficulty: string
    price: number
    coach_id: string
    is_public: boolean
    created_at: string
    updated_at: string
    categoria?: string
    program_rating?: number
    total_program_reviews?: number
    activity_media?: Array<{ image_url?: string; video_url?: string }>
    image_url?: string
    media?: { image_url?: string; video_url?: string }
    video_url?: string
    capacity?: string | number | null
    modality?: string | null
    objetivos?: string[]
    sessions_per_client?: number
    is_paused?: boolean
    location_name?: string | null
    location_url?: string | null
}

export type SortField = 'title' | 'type' | 'price' | 'created_at'
export type SortDirection = 'asc' | 'desc'

export type ConsultationType = 'express' | 'puntual' | 'profunda'

export interface ConsultationConfig {
    active: boolean
    price: number
    time: number
    name: string
    icon: number
}

export interface ConsultationSales {
    express: any[]
    puntual: any[]
    profunda: any[]
}

export interface Stats {
    totalProducts: number
    totalRevenue: number
    avgRating: number
    totalReviews: number
    totalEnrollments: number
    totalSales: number
}
