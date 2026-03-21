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
            console.log("🔄 [Onboarding] Checking status via API for:", userId)
            const response = await fetch('/api/coach/onboarding-status')
            
            if (!response.ok) {
                throw new Error(`Onboarding API Error: ${response.status}`)
            }
            
            const data = await response.json()
            
            if (data.success) {
                console.log("📊 [Onboarding] API check result:", data)
                setStatus({
                    needsProfile: data.needsProfile,
                    needsMP: data.needsMP,
                    loading: false
                })
            }
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
