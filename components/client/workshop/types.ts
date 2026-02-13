export interface TallerDetalle {
    id: number
    nombre: string
    descripcion: string
    pdf_url?: string
    pdf_file_name?: string
    originales: {
        fechas_horarios: Array<{
            fecha: string
            hora_inicio: string
            hora_fin: string
            cupo: number
        }>
    }
}

export interface TemaEstado {
    tema_id: number
    tema_nombre: string
    fecha_seleccionada?: string | null
    horario_selected?: any // keeping flexibility for the jsonb
    horario_seleccionado?: {
        hora_inicio: string
        hora_fin: string
    }
    confirmo_asistencia: boolean
    asistio: boolean
    pdf_url?: string | null
    pdf_file_name?: string | null
    snapshot_originales?: any
}

export interface WorkshopClientViewProps {
    activityId: number
    activityTitle: string
    activityDescription?: string
    activityImageUrl?: string
    isDocument?: boolean
}

export interface TopicProgressMap {
    [key: number]: boolean
}

export interface CuposMap {
    [key: string]: number
}
