export interface CoachAvailability {
  id: number
  coach_id: string
  day_of_week: number // 0 for Sunday, 1 for Monday, etc.
  start_time: string // HH:MM:SS format
  end_time: string // HH:MM:SS format
  consultation_type: string[] // Array of 'message', 'videocall'
  is_active: boolean
  created_at: string
  updated_at: string
  activity_id?: number | null // Optional link to an activity
  available_days: string[] | null // Array of 'lun', 'mar', etc.
  available_hours: string[] | null // Array of 'mañana', 'tarde', etc.
  videocall_duration: number | null // Duration in minutes
  is_general_preference: boolean // New field to mark general settings
}
