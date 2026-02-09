export type Activity = {
    id: string;
    title: string;
    subtitle: string;
    done?: boolean;
    type?: string;
    duration?: number;
    minutos?: number | null; // Minutos desde minutos_json
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
    // Campos específicos para nutrición
    proteinas?: number | null;
    carbohidratos?: number | null;
    grasas?: number | null;
    receta?: string | null;
    ingredientes?: string | null;
    // Campos adicionales para identificación
    ejercicio_id?: number | string;
    exercise_id?: number | string;
    orden?: number;
    order?: number;
    block?: number;
};
