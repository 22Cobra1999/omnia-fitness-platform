// types/activity.ts

export interface ActivityAvailability {
  id: string
  activity_id: number
  availability_type: string | null
  session_type: string | null
  available_slots: number | null
  available_days: string[] | null
  available_hours: string | null
}

export interface ActivityConsultationInfo {
  id?: string
  activity_id?: number
  includes_videocall?: boolean | null
  includes_message?: boolean | null
  videocall_duration?: number | null // in minutes
  available_days?: string[] | null
  available_hours?: string[] | null
  expiration_date?: string | null // date string
}

export interface ActivityProgramInfo {
  id?: string
  activity_id?: number
  duration?: number | null // in minutes
  calories?: number | null
  program_duration?: number | null // in weeks/months
  rich_description?: string | null
  interactive_pauses?: boolean | null
}

export interface ActivityMedia {
  id?: string
  activity_id?: number
  image_url?: string | null
  video_url?: string | null
  vimeo_id?: string | null
  pdf_url?: string | null
}

export interface ActivityTag {
  id?: string
  activity_id?: number
  tag_type?: string | null
  tag_value?: string | null
}

// Base Activity interface, reflecting the activities_base table
export interface ActivityBase {
  id: number
  title: string
  description: string | null
  type: string // e.g., 'fitness', 'nutrition', 'consultation'
  difficulty: string | null
  price: number
  coach_id: string
  is_public: boolean
  dias_acceso: number // Número de días para acceder al producto
  created_at: string
  updated_at: string
  program_rating?: number | null
  total_program_reviews?: number | null
  coach_rating?: number | null
  coach_name?: string | null // Joined from coaches table
  coach_avatar_url?: string | null // Joined from coaches table
  coach_whatsapp?: string | null // Joined from coaches table

  // Denormalized stats
  semanas_totales?: number | null
  sesiones_dias_totales?: number | null
  items_totales?: number | null
  items_unicos?: number | null
  periodos_configurados?: number | null
}

// Combined Activity interface for fetched data, including joined tables
export interface Activity extends ActivityBase {
  media: ActivityMedia | null
  program_info: ActivityProgramInfo | null
  consultation_info: ActivityConsultationInfo | null
  tags: ActivityTag[] | null

  // Derived properties for display
  image_url?: string | null
  video_url?: string | null
  vimeo_id?: string | null
  rich_description?: string | null
  duration_minutes?: number | null
  calories_info?: number | null
  program_duration_weeks_months?: number | null
  is_popular?: boolean

  total_coach_reviews?: number | null

  // Category for filtering in UI
  categoria?: string | null // assuming 'categoria' is a direct column in 'activities'
  category?: string | null // Runtime mapped property

  // Diet type for nutrition products
  dieta?: string | null

  // Properties for ActivityDetailScreen (fitness exercises)
  repeticiones?: string | null
  descanso?: string | null
  series?: string | null
  peso?: string | null
  completed?: boolean | null
  completed_at?: string | null
  coach_note?: string | null

  // Properties for nutrition activities
  cantidad?: string | null
  unidad?: string | null
  proteínas?: number | null
  carbohidratos?: number | null
  grasas?: number | null

  // Additional properties for exercise details
  calories?: number | null
  duration?: number | null
  exerciseType?: string | null
  reps?: string | null
  sets?: string | null
  rest?: string | null
  weight?: string | null
  intensity?: string | null
  equipment?: string | null
  protein?: number | null
  carbs?: number | null

  // Properties for program statistics
  exercisesCount?: number | null
  totalSessions?: number | null
  modality?: string | null
  csvData?: any[] | null
  csvFileName?: string | null
  full_name?: string | null
  specialization?: string | null
  availability?: any | null

  coach_experience_years?: number | null
  coach_total_reviews?: number | null
  coach_instagram?: string | null

  // Workshop-specific properties
  sessions_per_client?: number | null
  workshop_type?: string | null
  capacity?: number | null

  // Location properties for presencial activities
  location_url?: string | null
  location_name?: string | null
  objetivos?: string[] | null
}

// Interface for ActivityEnrollment, including the joined Activity data
export interface Enrollment {
  id: number
  activity_id: number
  client_id: string
  status: string
  // progress: number // REMOVIDO: Esta columna no existe en la base de datos
  completed_at: string | null
  created_at: string
  updated_at: string
  amount_paid: number
  payment_status: string | null
  payment_method: string | null
  transaction_id: string | null
  payment_date: string | null
  invoice_number: string | null
  is_subscription: boolean | null
  subscription_id: string | null
  metadata: any | null
  last_accessed: string | null
  expiration_date: string | null
  remaining_consultations: number | null
  start_date: string | null
  program_end_date: string | null // Última fecha de progreso + 6 días
  rating_coach?: number | null // Calificación del coach
  feedback_text?: string | null // Comentario/Feedback del cliente

  // New survey fields
  difficulty_rating?: number | null
  would_repeat?: boolean | null // Repetiría
  calificacion_omnia?: number | null
  comentarios_omnia?: string | null
  workshop_version?: string | null
  activity: Activity // Nested activity object
}

export interface CoachProfile {
  id: string
  full_name: string
  specialization?: string
  experience_years?: number
  bio?: string
  avatar_url?: string
  whatsapp?: string
  rating?: number
  total_reviews?: number
  // Add other coach-specific fields as needed
}

