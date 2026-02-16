
import { useState, useEffect, useCallback, useMemo } from "react"
import { SupabaseClient } from "@supabase/supabase-js"

interface UseCalendarCoachPickerProps {
    supabase: SupabaseClient
    selectedCoachId: string | null
    purchasedCoachIds: string[]
    scheduleMeetContext: any
    onSetScheduleMeetContext?: (ctx: any) => void
    setMeetViewMode: (mode: 'month' | 'week' | 'day_split') => void
    setSelectedMeetRequest: (req: any) => void
    setMeetPurchasePaid: (paid: boolean) => void
    setSelectedMeetEvent: (ev: any) => void
}

export function useCalendarCoachPicker({
    supabase,
    selectedCoachId,
    purchasedCoachIds,
    scheduleMeetContext,
    onSetScheduleMeetContext,
    setMeetViewMode,
    setSelectedMeetRequest,
    setMeetPurchasePaid,
    setSelectedMeetEvent
}: UseCalendarCoachPickerProps) {
    const [showCoachRow, setShowCoachRow] = useState(false)
    const [showAddMenu, setShowAddMenu] = useState(false)
    const [coachProfiles, setCoachProfiles] = useState<Array<{ id: string; full_name: string; avatar_url?: string | null }>>([])

    const [selectedConsultationType, setSelectedConsultationType] = useState<'express' | 'puntual' | 'profunda'>(() => {
        const mins = Number(scheduleMeetContext?.purchase?.durationMinutes ?? 30) || 30
        if (mins <= 15) return 'express'
        if (mins >= 60) return 'profunda'
        return 'puntual'
    })

    useEffect(() => {
        const loadCoachProfiles = async () => {
            try {
                const ids = Array.from(
                    new Set([
                        ...(Array.isArray(purchasedCoachIds) ? purchasedCoachIds : []),
                        selectedCoachId || '',
                    ].filter((x) => !!x))
                )

                if (ids.length === 0) {
                    setCoachProfiles([])
                    return
                }

                const { data, error } = await (supabase
                    .from('user_profiles') as any)
                    .select('id, full_name, avatar_url')
                    .in('id', ids)

                if (!error && data) {
                    setCoachProfiles(data)
                }
            } catch {
                // ignore
            }
        }

        loadCoachProfiles()
    }, [purchasedCoachIds, selectedCoachId, supabase])

    const handlePickCoachForMeet = (coachId: string) => {
        const ctx = { coachId, source: 'calendar' as const }
        try {
            localStorage.setItem('scheduleMeetContext', JSON.stringify(ctx))
        } catch (e) {
            console.error('Error guardando scheduleMeetContext:', e)
        }
        onSetScheduleMeetContext?.(ctx)
        setShowCoachRow(false)
        setShowAddMenu(false)
    }

    const handleClearCoachForMeet = () => {
        try {
            localStorage.removeItem('scheduleMeetContext')
        } catch {
            // ignore
        }
        onSetScheduleMeetContext?.(null)
        setMeetViewMode('month')
        setSelectedMeetRequest(null)
        setSelectedMeetEvent(null)
        setMeetPurchasePaid(false)
    }

    const applyConsultationSelection = useCallback(async (type: 'express' | 'puntual' | 'profunda', coachConsultations: any) => {
        if (!selectedCoachId) return
        if (typeof window === 'undefined') return

        const consultation = coachConsultations[type]
        if (!consultation?.active || Number(consultation.price) <= 0) return

        setSelectedConsultationType(type)
        setMeetPurchasePaid(false)
        setSelectedMeetRequest(null)

        const durationMinutes = Number(consultation.time) || (type === 'express' ? 15 : type === 'profunda' ? 60 : 30)
        const price = Number(consultation.price) || 0
        const label = type === 'express' ? 'Meet 15 min' : type === 'puntual' ? 'Meet 30 min' : 'Meet 60 min'

        const cacheKey = `consultationActivityId:${String(selectedCoachId)}:${type}`
        const cached = localStorage.getItem(cacheKey)
        let activityId = cached ? String(cached) : ''

        if (!activityId) {
            try {
                const consultationTitle = type === 'express'
                    ? 'Consulta Express - 15 min'
                    : type === 'puntual'
                        ? 'Consulta Puntual - 30 min'
                        : 'Sesión Profunda - 60 min'

                const { data: inserted, error } = await (supabase
                    .from('activities') as any)
                    .insert({
                        coach_id: selectedCoachId,
                        title: consultationTitle,
                        description: `Consulta con coach`,
                        type: 'consultation',
                        price,
                        categoria: 'consultation',
                        modality: 'online',
                        is_public: false,
                        is_active: true,
                    })
                    .select('id')
                    .single()

                if (!error && inserted?.id != null) {
                    activityId = String(inserted.id)
                    try {
                        localStorage.setItem(cacheKey, activityId)
                    } catch {
                        // ignore
                    }
                }
            } catch {
                // ignore
            }
        }

        const nextCtx = {
            coachId: String(selectedCoachId),
            activityId: activityId || scheduleMeetContext?.activityId,
            source: scheduleMeetContext?.source || 'calendar',
            purchase: { kind: 'consultation' as const, durationMinutes, price, label },
        }

        try {
            localStorage.setItem('scheduleMeetContext', JSON.stringify(nextCtx))
        } catch {
            // ignore
        }
        onSetScheduleMeetContext?.(nextCtx)
    }, [onSetScheduleMeetContext, scheduleMeetContext?.activityId, scheduleMeetContext?.source, selectedCoachId, supabase, setSelectedConsultationType, setMeetPurchasePaid, setSelectedMeetRequest])

    const selectedCoachProfile = useMemo(() => {
        if (!selectedCoachId) return null
        return coachProfiles.find((c) => c.id === selectedCoachId) || null
    }, [coachProfiles, selectedCoachId])

    return {
        showCoachRow,
        setShowCoachRow,
        showAddMenu,
        setShowAddMenu,
        coachProfiles,
        selectedConsultationType,
        setSelectedConsultationType,
        handlePickCoachForMeet,
        handleClearCoachForMeet,
        applyConsultationSelection,
        selectedCoachProfile
    }
}
