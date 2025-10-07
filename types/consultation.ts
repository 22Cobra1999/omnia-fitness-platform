export interface ConsultationCredit {
  id: number
  client_id: string
  activity_id: number
  coach_id: string
  consultation_type: "message" | "videocall"
  total_sessions: number
  used_sessions: number
  remaining_sessions: number
  expires_at?: string
  created_at: string
  updated_at: string
}

export interface ConsultationBooking {
  consultation_type: "message" | "videocall"
  preferred_date: string
  preferred_time: string
  duration: number
  notes?: string
  activity_id: number
}

export interface AvailableSlot {
  date: string
  time: string
  available: boolean
}
