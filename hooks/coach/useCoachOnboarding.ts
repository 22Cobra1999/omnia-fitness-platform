"use client"

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/supabase-client'

export function useCoachOnboarding(userId: string | undefined) {
    const [status, setStatus] = useState<{
        needsProfile: boolean;
        needsMP: boolean;
        loading: boolean;
    }>({
        needsProfile: false,
        needsMP: false,
        loading: true
    })

    const checkStatus = useCallback(async () => {
        if (!userId) return
        
        try {
            const supabase = createClient()
            
            // 1. Check Profile Completion
            const { data: coach } = await supabase
                .from('coaches')
                .select('bio, avatar_url, specialization')
                .eq('id', userId)
                .single()
            
            const { data: userProfile } = await supabase
                .from('user_profiles')
                .select('avatar_url')
                .eq('id', userId)
                .single()

            const hasAvatar = !!(coach?.avatar_url || userProfile?.avatar_url)
            const hasBio = coach?.bio && !coach.bio.includes("Trainer entusiasta en OMNIA")
            const hasSpecialization = !!coach?.specialization && coach.specialization !== 'General Fitness'
            
            // Consideramos perfil incompleto si no tiene foto O no cambió la bio/especialidad básica
            const needsProfile = !hasAvatar || (!hasBio && !hasSpecialization)

            // 2. Check Mercado Pago
            const { data: mp } = await supabase
                .from('coach_mercadopago_credentials')
                .select('oauth_authorized')
                .eq('coach_id', userId)
                .maybeSingle()
            
            const needsMP = !mp?.oauth_authorized

            setStatus({
                needsProfile,
                needsMP,
                loading: false
            })
        } catch (error) {
            console.error("Error checking onboarding status:", error)
            setStatus(prev => ({ ...prev, loading: false }))
        }
    }, [userId])

    useEffect(() => {
        checkStatus()
    }, [checkStatus])

    return { ...status, refetch: checkStatus }
}
