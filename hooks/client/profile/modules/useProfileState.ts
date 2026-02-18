import { useState } from 'react'
import { User } from '@/contexts/auth-context'

export interface ProfileData {
    full_name?: string
    email?: string
    phone?: string
    location?: string
    emergency_contact?: string
    age?: number
    birth_date?: string
    weight?: number
    height?: number
    gender?: string
    level?: string
    avatar_url?: string
    specialization?: string
    fitness_goals?: string[]
    sports?: string[]
    physical_data?: {
        height?: number
        weight?: number
        birth_date?: string
        gender?: string
        onboarding_completed_at?: string
    }
}

export interface Biometric {
    id: string
    name: string
    value: number
    unit: string
    notes?: string
    created_at: string
    updated_at?: string
    trend?: 'up' | 'down' | 'neutral'
    diff?: number
    previousValue?: number
}

export interface Injury {
    id: string
    name: string
    severity: 'low' | 'medium' | 'high'
    description?: string
    restrictions?: string
    created_at: string
    updated_at?: string
    muscleId?: string
    muscleName?: string
    muscleGroup?: string
    painLevel?: number
    painDescription?: string
}

export function useProfileState(user: User | null) {
    const [loading, setLoading] = useState(false)
    const [profile, setProfile] = useState<ProfileData | null>(() => {
        if (!user) return null
        return {
            full_name: user.name || undefined,
            email: user.email,
            avatar_url: user.avatar_url || undefined,
            level: user.level,
        }
    })
    const [biometrics, setBiometrics] = useState<Biometric[]>([])
    const [injuries, setInjuries] = useState<Injury[]>([])
    const [lastProfileLoadAt, setLastProfileLoadAt] = useState<number>(0)

    return {
        loading,
        setLoading,
        profile,
        setProfile,
        biometrics,
        setBiometrics,
        injuries,
        setInjuries,
        lastProfileLoadAt,
        setLastProfileLoadAt
    }
}
