export type MediaType = 'image' | 'video' | 'pdf'

export interface CoachMedia {
    id: string
    activity_id: number
    image_url?: string
    video_url?: string
    video_thumbnail_url?: string
    bunny_video_id?: string
    bunny_library_id?: string | number
    pdf_url?: string
    activity_title: string
    created_at: string
    filename: string
    media_type: MediaType
    size?: number
    type?: string
    nombre_ejercicio?: string | null
    nombre_plato?: string | null
}

export interface MediaSelectionModalProps {
    isOpen: boolean
    onClose: () => void
    onMediaSelected: (mediaUrl: string, mediaType: MediaType, mediaFile?: File, fileName?: string) => void
    mediaType: MediaType
    className?: string
    // Optional DB context — when provided, Bunny upload will also update ejercicios_detalles / activity_media
    exerciseId?: string | number | null
    activityId?: string | number | null
    mediaId?: string | number | null
}

export type SourceFilter = 'all' | 'cover' | 'catalog'
