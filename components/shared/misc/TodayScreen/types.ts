export type Activity = {
    id: string;
    title: string;
    subtitle: string;
    done?: boolean;
    type?: string;
    duration?: number;
    minutos?: number | null;
    reps?: number;
    sets?: number;
    bloque?: number;
    video_url?: string | null;
    equipment?: string;
    series?: string;
    detalle_series?: any;
    description?: string;
    descripcion?: string;
    calorias?: number | null;
    body_parts?: string | null;
    intensidad?: string | null;
    proteinas?: number | null;
    carbohidratos?: number | null;
    grasas?: number | null;
    receta?: string | null;
    ingredientes?: string | null;
    ejercicio_id?: number | string;
    exercise_id?: number | string;
    orden?: number;
    order?: number;
    block?: number;
    // UI fields
    fromPlanning?: boolean;
    isPast?: boolean;
};

export interface ProgramInfo {
    id: string;
    title: string;
    description?: string;
    categoria: 'fitness' | 'nutricion';
    type?: string;
    coach_id: string;
    coach_name?: string;
    image_url?: string;
    user_survey_status?: {
        has_submitted: boolean;
    };
}

export interface Enrollment {
    id: string;
    activity_id: string;
    client_id: string;
    status: 'activa' | 'finalizada' | 'pendiente';
    start_date?: string | null;
    expiration_date?: string | null;
    start_deadline?: string | null;
    activity?: {
        id: string;
        title: string;
        categoria: 'fitness' | 'nutricion';
    };
    activity_surveys?: any;
    // Enriched fields from survey
    rating_coach?: number | null;
    feedback_text?: string | null;
    difficulty_rating?: number | null;
    would_repeat?: boolean;
    calificacion_omnia?: number | null;
    comentarios_omnia?: string | null;
    workshop_version?: string | null;
}
