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
            const { data: mp, error: mpError } = await supabase
                .from('coach_mercadopago_credentials')
                .select('oauth_authorized')
                .eq('coach_id', userId)
                .maybeSingle()
            
            if (mpError) {
                console.error("❌ [Onboarding] Error searching credentials:", mpError)
            }
            
            const needsMP = !mp?.oauth_authorized
            console.log("📊 [Onboarding] Check complete for", userId, ":", { needsProfile, needsMP, hasMPData: !!mp })

            setStatus({
                needsProfile,
                needsMP,
                loading: false
            })
        } catch (error) {
            console.error("❌ [Onboarding] Unexpected error during check:", error)
            setStatus(prev => ({ ...prev, loading: false }))
        }
    }, [userId])

    useEffect(() => {
        checkStatus()
        
        // Refetch when window regains focus (e.g. after returning from MP login)
        window.addEventListener('focus', checkStatus)
        
        // Refetch if URL changes to success
        const handleUrlChange = () => {
            if (window.location.search.includes('mp_auth=success')) {
                checkStatus()
            }
        }
        window.addEventListener('popstate', handleUrlChange)

        return () => {
            window.removeEventListener('focus', checkStatus)
            window.removeEventListener('popstate', handleUrlChange)
        }
    }, [checkStatus])

    return { ...status, refetch: checkStatus }
}
