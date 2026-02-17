import React, { useMemo, useCallback } from 'react'
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface UseCalendarDaySplitLogicProps {
    selectedDate: Date
    getSlotsForDate: (d: Date, durationMinutes?: number) => string[]
    selectedMeetRequest: any
    rescheduleContext: any
    coachConsultations: any
    selectedConsultationType: 'express' | 'puntual' | 'profunda'
    isPaidMeetFlow: boolean
    meetCreditsByCoachId: Record<string, number>
    meetPurchasePaid: boolean
    authUserId: string | null
    supabase: any
    scheduleMeetContext: any
    coachProfiles: any[]
    selectedCoachId: string | null
    setSelectedMeetRsvpLoading: (loading: boolean) => void
    setMeetEventsByDate: React.Dispatch<React.SetStateAction<any>>
    onEventUpdated?: () => Promise<void>
    setRescheduleContext: (ctx: any) => void
    setMeetViewMode: (mode: 'month' | 'week' | 'day_split') => void
    setSelectedMeetRequest: (req: any) => void
    handleClearCoachForMeet: () => void
    setSuccessModalData: (data: any) => void
    setShowSuccessModal: (show: boolean) => void
    createCheckoutProPreference: any
    redirectToMercadoPagoCheckout: any
    onSetScheduleMeetContext?: (ctx: any) => void
}

export function useCalendarDaySplitLogic({
    selectedDate,
    getSlotsForDate,
    selectedMeetRequest,
    rescheduleContext,
    coachConsultations,
    selectedConsultationType,
    isPaidMeetFlow,
    meetCreditsByCoachId,
    meetPurchasePaid,
    authUserId,
    supabase,
    scheduleMeetContext,
    coachProfiles,
    selectedCoachId,
    setSelectedMeetRsvpLoading,
    setMeetEventsByDate,
    onEventUpdated,
    setRescheduleContext,
    setMeetViewMode,
    setSelectedMeetRequest,
    handleClearCoachForMeet,
    setSuccessModalData,
    setShowSuccessModal,
    createCheckoutProPreference,
    redirectToMercadoPagoCheckout,
    onSetScheduleMeetContext
}: UseCalendarDaySplitLogicProps) {

    const availableSlots = useMemo(() => {
        if (!selectedDate) return []
        return getSlotsForDate(selectedDate, 15)
    }, [selectedDate, getSlotsForDate])

    const isDurationValid = useCallback((mins: number) => {
        if (!selectedMeetRequest?.timeHHMM) return false

        let whitelistedSlots: string[] = []
        if (rescheduleContext?.fromStart && rescheduleContext?.fromEnd) {
            const start = new Date(rescheduleContext.fromStart)
            const end = new Date(rescheduleContext.fromEnd)
            const diffMins = (end.getTime() - start.getTime()) / 60000
            const originalBlocks = Math.ceil(diffMins / 15)

            const h = start.getHours()
            const m = start.getMinutes()
            let currentW = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`

            for (let k = 0; k < originalBlocks; k++) {
                whitelistedSlots.push(currentW)
                const [hh, mm] = currentW.split(':').map(Number)
                const total = hh * 60 + mm + 15
                const nextH = Math.floor(total / 60)
                const nextM = total % 60
                currentW = `${String(nextH).padStart(2, '0')}:${String(nextM).padStart(2, '0')}`
            }
        }

        const blocks = Math.ceil(mins / 15)
        let current = selectedMeetRequest.timeHHMM
        for (let i = 0; i < blocks; i++) {
            if (!availableSlots.includes(current) && !whitelistedSlots.includes(current)) return false

            const [h, m] = current.split(':').map(Number)
            const nextTotal = h * 60 + m + 15
            const nextH = Math.floor(nextTotal / 60)
            const nextM = nextTotal % 60
            current = `${String(nextH).padStart(2, '0')}:${String(nextM).padStart(2, '0')}`
        }
        return true
    }, [selectedMeetRequest?.timeHHMM, availableSlots, rescheduleContext])

    const handleConfirm = useCallback(async () => {
        console.log('[useCalendarDaySplitLogic Confirm] Action triggered', { rescheduleContext })

        if (rescheduleContext) {
            const duration = coachConsultations[selectedConsultationType].time
            const startIso = new Date(`${selectedMeetRequest.dayKey}T${selectedMeetRequest.timeHHMM}:00`).toISOString()
            const endIso = new Date(new Date(startIso).getTime() + duration * 60 * 1000).toISOString()

            try {
                const user_id = authUserId
                if (!user_id) return

                // 1. Fetch participant data
                const { data: participantData } = await (supabase
                    .from('calendar_event_participants') as any)
                    .select('invited_by_user_id, rsvp_status, is_creator')
                    .eq('event_id', rescheduleContext.eventId)
                    .eq('user_id', user_id)
                    .single()

                const { data: coachParticipantData } = await (supabase
                    .from('calendar_event_participants') as any)
                    .select('rsvp_status')
                    .eq('event_id', rescheduleContext.eventId)
                    .eq('user_id', rescheduleContext.coachId)
                    .single()

                const isCoachAccepted = coachParticipantData && ['accepted', 'confirmed'].includes(coachParticipantData.rsvp_status)

                const { data: eventData } = await (supabase
                    .from('calendar_events') as any)
                    .select('created_by_user_id')
                    .eq('id', rescheduleContext.eventId)
                    .single()

                const amIInviter = (participantData?.is_creator === true) || (participantData?.invited_by_user_id === user_id) || (eventData?.created_by_user_id === user_id)

                if (amIInviter && !isCoachAccepted) {
                    setSelectedMeetRsvpLoading(true)

                    const { data: updatedData, error: updateError } = await (supabase
                        .from('calendar_events') as any)
                        .update({
                            start_time: startIso,
                            end_time: endIso,
                            ...(selectedMeetRequest.description ? { description: selectedMeetRequest.description } : {})
                        })
                        .eq('id', rescheduleContext.eventId)
                        .select()

                    if (updateError) {
                        setSelectedMeetRsvpLoading(false)
                        alert('Error al actualizar: ' + updateError.message)
                        return
                    }

                    if (updatedData && updatedData.length > 0) {
                        setMeetEventsByDate((prev: any) => {
                            const newData = { ...prev }
                            let movedEvent: any = null

                            Object.keys(newData).forEach(key => {
                                const found = newData[key]?.find((e: any) => e.id === rescheduleContext.eventId)
                                if (found && !movedEvent) movedEvent = { ...found }
                            })

                            Object.keys(newData).forEach(key => {
                                if (newData[key]) newData[key] = newData[key].filter((e: any) => e.id !== rescheduleContext.eventId)
                            })

                            if (movedEvent) {
                                movedEvent.start_time = startIso
                                movedEvent.end_time = endIso
                                if (selectedMeetRequest.description) movedEvent.description = selectedMeetRequest.description

                                const s = new Date(startIso)
                                const newKey = s.toISOString().split('T')[0]
                                if (!newData[newKey]) newData[newKey] = []
                                newData[newKey].push(movedEvent)
                                newData[newKey].sort((a: any, b: any) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
                            }
                            return newData
                        })

                        await new Promise(resolve => setTimeout(resolve, 1000))
                        if (onEventUpdated) await onEventUpdated()

                        setRescheduleContext(null)
                        setMeetViewMode('month')
                        setSelectedMeetRequest(null)
                        setSelectedMeetRsvpLoading(false)
                        handleClearCoachForMeet()

                        const [startHour, startMin] = selectedMeetRequest.timeHHMM.split(':').map(Number)
                        const startTotal = startHour * 60 + startMin
                        const endTotal = startTotal + duration
                        const endHour = Math.floor(endTotal / 60)
                        const endMin = endTotal % 60
                        const endTime = `${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`

                        setSuccessModalData({
                            coachName: coachProfiles.find(c => c.id === selectedCoachId)?.full_name || 'Coach',
                            date: format(new Date(startIso), 'dd MMM yyyy', { locale: es }),
                            time: `${selectedMeetRequest.timeHHMM} – ${endTime}`,
                            duration: duration,
                            message: "Cambio realizado exitosamente."
                        })
                        setShowSuccessModal(true)
                        return
                    }
                }

                if (rescheduleContext.requestId && rescheduleContext.requestedByUserId === authUserId) {
                    const { error: updateReqErr } = await (supabase
                        .from('calendar_event_reschedule_requests') as any)
                        .update({
                            to_start_time: startIso,
                            to_end_time: endIso,
                            note: selectedMeetRequest.description || null,
                            status: 'pending'
                        })
                        .eq('id', rescheduleContext.requestId)
                    if (updateReqErr) throw updateReqErr
                } else {
                    const { error: insertError } = await (supabase
                        .from('calendar_event_reschedule_requests') as any)
                        .insert({
                            event_id: rescheduleContext.eventId,
                            requested_by_user_id: authUserId,
                            requested_by_role: 'client',
                            from_start_time: rescheduleContext.fromStart,
                            from_end_time: rescheduleContext.fromEnd,
                            to_start_time: startIso,
                            to_end_time: endIso,
                            status: 'pending',
                            note: selectedMeetRequest.description || null
                        })
                    if (insertError) throw insertError
                }

                setRescheduleContext(null)
                setMeetViewMode('month')
                setSelectedMeetRequest(null)
                handleClearCoachForMeet()

                const [startHour, startMin] = selectedMeetRequest.timeHHMM.split(':').map(Number)
                const startTotal = startHour * 60 + startMin
                const endTotal = startTotal + duration
                const endHour = Math.floor(endTotal / 60)
                const endMin = endTotal % 60
                const endTime = `${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`

                setSuccessModalData({
                    coachName: coachProfiles.find(c => c.id === selectedCoachId)?.full_name || 'Coach',
                    date: format(new Date(startIso), 'dd MMM yyyy', { locale: es }),
                    time: `${selectedMeetRequest.timeHHMM} – ${endTime}`,
                    duration: duration,
                    message: "Solicitud enviada al coach, espera a que confirme..."
                })
                setShowSuccessModal(true)
            } catch (error) {
                console.error('[useCalendarDaySplitLogic] Error checking meet status:', error)
            }
            return
        }

        const canConfirm = !isPaidMeetFlow
            ? (Number(meetCreditsByCoachId?.[String(selectedMeetRequest.coachId)] ?? 0) > 0)
            : meetPurchasePaid

        if (!canConfirm && !isPaidMeetFlow) {
            alert('No tienes créditos suficientes para agendar una sesión con este coach.')
            return
        }

        if (isPaidMeetFlow && !meetPurchasePaid) {
            const actId = scheduleMeetContext?.activityId ? String(scheduleMeetContext.activityId) : null
            if (!actId) return
            const duration = coachConsultations[selectedConsultationType].time
            try {
                sessionStorage.setItem('pending_meet_booking', JSON.stringify({
                    coachId: String(selectedMeetRequest.coachId),
                    activityId: actId,
                    dayKey: selectedMeetRequest.dayKey,
                    timeHHMM: selectedMeetRequest.timeHHMM,
                    durationMinutes: duration,
                }))
            } catch { }
            const res = await createCheckoutProPreference(actId)
            if (res?.success && res?.initPoint) {
                redirectToMercadoPagoCheckout(res.initPoint, actId, res.preferenceId)
            }
            return
        }

        try {
            setSelectedMeetRsvpLoading(true)
            const duration = coachConsultations[selectedConsultationType].time
            const startIso = new Date(`${selectedMeetRequest.dayKey}T${selectedMeetRequest.timeHHMM}:00`).toISOString()
            const endIso = new Date(new Date(startIso).getTime() + duration * 60 * 1000).toISOString()

            const { data: auth } = await supabase.auth.getUser()
            const user = auth?.user
            if (!user?.id) return

            const payload = {
                title: selectedMeetRequest.title || 'Meet',
                description: selectedMeetRequest.description,
                start_time: startIso,
                end_time: endIso,
                coach_id: selectedMeetRequest.coachId,
                created_by_user_id: user.id,
                event_type: 'consultation',
                status: 'scheduled',
                activity_id: scheduleMeetContext?.activityId ? Number(scheduleMeetContext.activityId) : null
            }

            const { data: newEvent, error } = await (supabase.from('calendar_events') as any).insert(payload).select('id').single()

            if (!error && newEvent?.id) {
                const participants = [
                    { event_id: newEvent.id, user_id: user.id, rsvp_status: 'accepted', invited_by_user_id: user.id, invited_by_role: 'client', is_creator: true },
                    { event_id: newEvent.id, user_id: selectedMeetRequest.coachId, rsvp_status: 'pending', invited_by_user_id: user.id, invited_by_role: 'client', is_creator: false }
                ]
                await (supabase.from('calendar_event_participants') as any).insert(participants)

                setMeetViewMode('month')
                setSelectedMeetRequest(null)
                if (onSetScheduleMeetContext) onSetScheduleMeetContext(null)
                setShowSuccessModal(true)

                const [startHour, startMin] = selectedMeetRequest.timeHHMM.split(':').map(Number)
                const startTotal = startHour * 60 + startMin
                const endTotal = startTotal + duration
                const endHour = Math.floor(endTotal / 60)
                const endMin = endTotal % 60
                const endTime = `${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`

                setSuccessModalData({
                    coachName: coachProfiles.find(c => c.id === selectedCoachId)?.full_name || 'Coach',
                    date: format(new Date(startIso), 'dd MMM yyyy', { locale: es }),
                    time: `${selectedMeetRequest.timeHHMM} – ${endTime}`,
                    duration,
                    message: "Meet agendado exitosamente."
                })
            }
        } catch (error) {
            console.error('[useCalendarDaySplitLogic] Error booking:', error)
        } finally {
            setSelectedMeetRsvpLoading(false)
        }
    }, [
        rescheduleContext, coachConsultations, selectedConsultationType, selectedMeetRequest, authUserId, supabase,
        setSelectedMeetRsvpLoading, setMeetEventsByDate, onEventUpdated, setRescheduleContext, setMeetViewMode,
        setSelectedMeetRequest, handleClearCoachForMeet, setSuccessModalData, setShowSuccessModal,
        isPaidMeetFlow, meetCreditsByCoachId, meetPurchasePaid, scheduleMeetContext, createCheckoutProPreference,
        redirectToMercadoPagoCheckout, onSetScheduleMeetContext, coachProfiles, selectedCoachId
    ])

    return {
        availableSlots,
        isDurationValid,
        handleConfirm
    }
}
