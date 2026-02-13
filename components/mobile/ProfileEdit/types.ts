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
}
