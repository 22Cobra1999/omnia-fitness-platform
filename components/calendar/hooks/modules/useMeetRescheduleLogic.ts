import { format, startOfWeek } from 'date-fns'

interface UseMeetRescheduleLogicProps {
    supabase: any
    effectivePendingReschedule: any
    selectedMeetEvent: any
    setSelectedMeetRsvpLoading: (val: boolean) => void
    actualEventId: string | number
    setMeetEventsByDate: (updater: any) => void
    setPendingReschedule: (updater: any) => void
    setSelectedMeetEvent: (event: any) => void
    setRescheduleContext: (context: any) => void
    handlePickCoachForMeet: (coachId: string) => void
    setMeetViewMode: (mode: string) => void
    setMeetWeekStart: (date: Date) => void
    onReschedule?: (event: any) => void
    isGrupal: boolean
    setShowWorkshopRescheduleWarning: (val: boolean) => void
    toast: any
    start: Date
}

export function useMeetRescheduleLogic({
    supabase,
    effectivePendingReschedule,
    selectedMeetEvent,
    setSelectedMeetRsvpLoading,
    actualEventId,
    setMeetEventsByDate,
    setPendingReschedule,
    setSelectedMeetEvent,
    setRescheduleContext,
    handlePickCoachForMeet,
    setMeetViewMode,
    setMeetWeekStart,
    onReschedule,
    isGrupal,
    setShowWorkshopRescheduleWarning,
    toast,
    start
}: UseMeetRescheduleLogicProps) {
    const safeHandleAcceptReschedule = async () => {
        if (!effectivePendingReschedule || !selectedMeetEvent) return
        try {
            setSelectedMeetRsvpLoading(true)
            const { error: reqErr } = await (supabase
                .from('calendar_event_reschedule_requests') as any)
                .update({ status: 'accepted' })
                .eq('id', effectivePendingReschedule.id)
            if (reqErr) throw reqErr

            const { error: evtErr } = await (supabase
                .from('calendar_events') as any)
                .update({
                    start_time: effectivePendingReschedule.to_start_time,
                    end_time: effectivePendingReschedule.to_end_time,
                    status: 'confirmed'
                })
                .eq('id', actualEventId)
            if (evtErr) throw evtErr

            const startDt = new Date(effectivePendingReschedule.to_start_time)
            const oldStartDt = new Date(effectivePendingReschedule.from_start_time)
            const newKey = format(startDt, 'yyyy-MM-dd')
            const oldKey = format(oldStartDt, 'yyyy-MM-dd')

            setMeetEventsByDate((prev: any) => {
                const updatedMap = { ...prev }
                if (updatedMap[oldKey]) {
                    updatedMap[oldKey] = updatedMap[oldKey].filter((e: any) => String(e.id) !== String(actualEventId))
                }
                const updatedEvent = {
                    ...selectedMeetEvent,
                    start_time: effectivePendingReschedule.to_start_time,
                    end_time: effectivePendingReschedule.to_end_time,
                    status: 'rescheduled'
                }
                updatedMap[newKey] = [...(updatedMap[newKey] || []), updatedEvent]
                return updatedMap
            })

            setPendingReschedule((prev: any) => prev ? { ...prev, status: 'accepted' } : null)

            toast({
                title: "Cambio aceptado",
                description: "La reunión se ha reprogramado correctamente.",
            })

            setSelectedMeetEvent(null)
        } catch (e) {
            console.error('Error accepting reschedule:', e)
            toast({
                variant: "destructive",
                title: "Error",
                description: "No se pudo aceptar el cambio.",
            })
        } finally {
            setSelectedMeetRsvpLoading(false)
        }
    }

    const safeHandleDeclineReschedule = async () => {
        if (!effectivePendingReschedule) return
        try {
            setSelectedMeetRsvpLoading(true)
            const { error } = await (supabase
                .from('calendar_event_reschedule_requests') as any)
                .update({ status: 'declined' })
                .eq('id', effectivePendingReschedule.id)
            if (error) throw error

            setPendingReschedule((prev: any) => prev ? { ...prev, status: 'declined' } : null)
            toast({
                title: "Cambio rechazado",
                description: "Se ha mantenido el horario original.",
            })
        } catch (e) {
            console.error('Error declining reschedule:', e)
            toast({
                variant: "destructive",
                title: "Error",
                description: "No se pudo rechazar el cambio.",
            })
        } finally {
            setSelectedMeetRsvpLoading(false)
        }
    }

    const handleSuggestNewTime = () => {
        if (onReschedule) {
            onReschedule(selectedMeetEvent)
            return
        }

        if (!selectedMeetEvent?.coach_id) return
        const durationMinutes = (() => {
            const a = new Date(selectedMeetEvent.start_time).getTime()
            const b = selectedMeetEvent.end_time ? new Date(selectedMeetEvent.end_time).getTime() : NaN
            if (!Number.isFinite(a) || !Number.isFinite(b)) return 60
            const mins = Math.round((b - a) / 60000)
            return mins > 0 ? mins : 60
        })()

        setRescheduleContext({
            eventId: String(actualEventId),
            coachId: String(selectedMeetEvent.coach_id),
            fromStart: String(selectedMeetEvent.start_time),
            fromEnd: selectedMeetEvent.end_time ? String(selectedMeetEvent.end_time) : null,
            durationMinutes,
            requestId: effectivePendingReschedule?.id || null,
            requestedByUserId: effectivePendingReschedule?.requested_by_user_id || null,
            snapshot: {
                id: String(actualEventId),
                title: selectedMeetEvent.title ?? null,
                start_time: String(selectedMeetEvent.start_time),
                end_time: selectedMeetEvent.end_time ? String(selectedMeetEvent.end_time) : null,
                coach_id: selectedMeetEvent.coach_id ? String(selectedMeetEvent.coach_id) : null,
                meet_link: selectedMeetEvent.meet_link ? String(selectedMeetEvent.meet_link) : null,
                description: selectedMeetEvent.description ?? null,
            },
        })

        handlePickCoachForMeet(String(selectedMeetEvent.coach_id))
        setMeetViewMode('week')
        setMeetWeekStart(startOfWeek(start, { weekStartsOn: 1 }))
        setSelectedMeetEvent(null)
    }

    const handleRescheduleClick = () => {
        if (isGrupal && onReschedule) {
            setShowWorkshopRescheduleWarning(true)
        } else if (onReschedule) {
            onReschedule(selectedMeetEvent)
        } else {
            handleSuggestNewTime()
        }
    }

    return {
        safeHandleAcceptReschedule,
        safeHandleDeclineReschedule,
        handleSuggestNewTime,
        handleRescheduleClick
    }
}
