export interface ProfileData {
    full_name: string
    email: string
    phone: string
    location: string
    emergency_contact: string
    birth_date: string
    weight: string
    height: string
    gender: string
    level: string
    // Coach specific fields
    specialization?: string
    experience_years?: string
    certifications?: string[]
    whatsapp?: string
    instagram_username?: string
    bio?: string
    cafe?: string
    cafe_enabled?: boolean
    meet_1?: string
    meet_30?: string
    meet_1_enabled?: boolean
    meet_30_enabled?: boolean
    category?: string
}

export interface ProfileEditErrors {
    weight: boolean
    height: boolean
    emergency_contact: boolean
}

export interface ProfileEditModalProps {
    isOpen: boolean
    onClose: () => void
    editingSection?: string | null
    isCoach?: boolean
}
