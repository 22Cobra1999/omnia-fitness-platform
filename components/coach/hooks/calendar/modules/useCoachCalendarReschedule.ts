import { useCallback } from "react"
import { CalendarEvent } from "@/components/coach/coach-calendar-screen"
import { SupabaseClient } from "@supabase/supabase-js"

interface UseCoachCalendarRescheduleProps {
    supabase: SupabaseClient
    coachId: string | null
    getCoachEvents: (force?: boolean) => Promise<void>
    setMeetToReschedule: (v: CalendarEvent | null) => void
    setIsRescheduling: (v: boolean) => void
    setSelectedEvent: (v: CalendarEvent | null) => void
    setViewMode: (v: 'month' | 'today') => void
    setShowQuickScheduler: (v: boolean) => void
    setQuickSchedulerDate: (v: Date | null) => void
    setShowConfirmationModal: (v: boolean) => void
    setPendingMeetData: (v: any) => void
}

export function useCoachCalendarReschedule({
    supabase,
    coachId,
    getCoachEvents,
    setMeetToReschedule,
    setIsRescheduling,
    setSelectedEvent,
    setViewMode,
    setShowQuickScheduler,
    setQuickSchedulerDate,
    setShowConfirmationModal,
    setPendingMeetData
}: UseCoachCalendarRescheduleProps) {

    const handleStartReschedule = useCallback((meet: CalendarEvent, metadata?: { description?: string; clientIds?: string[] }) => {
        setMeetToReschedule({
            ...meet,
            description: metadata?.description ?? meet.description,
            client_id: metadata?.clientIds?.[0] ?? meet.client_id
        })
        setIsRescheduling(true)
        setSelectedEvent(null)
        setViewMode('month')
    }, [setMeetToReschedule, setIsRescheduling, setSelectedEvent, setViewMode])

    const handleCancelReschedule = useCallback((meetToReschedule: CalendarEvent | null) => {
        if (meetToReschedule) {
            setSelectedEvent(meetToReschedule)
        }
        setIsRescheduling(false)
        setMeetToReschedule(null)
        setShowQuickScheduler(false)
        setQuickSchedulerDate(null)
    }, [setSelectedEvent, setIsRescheduling, setMeetToReschedule, setShowQuickScheduler, setQuickSchedulerDate])

    const handleRescheduleConfirm = useCallback(async (
        data: { title: string; description: string; clientIds: string[]; isFree: boolean; price: number | null },
        quickSchedulerDate: Date | null,
        pendingMeetData: any,
        meetToReschedule: CalendarEvent | null
    ) => {
        if (!quickSchedulerDate || !pendingMeetData || !meetToReschedule || !coachId) return

        const { startTime, durationMinutes } = pendingMeetData

        try {
            const [hours, minutes] = startTime.split(':').map(Number)
            const newStartDateTime = new Date(quickSchedulerDate)
            newStartDateTime.setHours(hours, minutes, 0, 0)
            const newEndDateTime = new Date(newStartDateTime)
            newEndDateTime.setMinutes(newEndDateTime.getMinutes() + durationMinutes)

            const newStartISO = newStartDateTime.toISOString()
            const newEndISO = newEndDateTime.toISOString()

            const { data: participants } = await supabase
                .from('calendar_event_participants')
                .select('rsvp_status')
                .eq('event_id', meetToReschedule.id)

            const isConfirmed = participants && participants.length > 0 && !participants.some((p: any) => p.rsvp_status === 'pending')

            if (!isConfirmed) {
                const { error: updateError } = await supabase
                    .from('calendar_events')
                    .update({ start_time: newStartISO, end_time: newEndISO, status: 'scheduled' })
                    .eq('id', meetToReschedule.id)
                if (updateError) throw updateError

                await supabase
                    .from('calendar_event_reschedule_requests')
                    .delete()
                    .eq('event_id', meetToReschedule.id)
                    .eq('status', 'pending')
            } else {
                const { error: rescheduleError } = await supabase
                    .from('calendar_event_reschedule_requests')
                    .insert({
                        event_id: meetToReschedule.id,
                        requested_by_user_id: coachId,
                        from_start_time: meetToReschedule.start_time,
                        from_end_time: meetToReschedule.end_time,
                        to_start_time: newStartISO,
                        to_end_time: newEndISO,
                        status: 'pending',
                        reason: data.description.trim() || 'Solicitud de reprogramación',
                    } as any)

                if (rescheduleError) throw rescheduleError

                await supabase
                    .from('calendar_events')
                    .update({
                        status: 'rescheduled',
                        lifecycle_data: {
                            ...(meetToReschedule as any).lifecycle_data,
                            rescheduled_at: new Date().toISOString(),
                            rescheduled_by: coachId
                        }
                    })
                    .eq('id', meetToReschedule.id)
            }

            setShowConfirmationModal(false)
            setPendingMeetData(null)
            setQuickSchedulerDate(null)
            setIsRescheduling(false)
            setMeetToReschedule(null)
            await getCoachEvents(true)
        } catch (error) {
            console.error('❌ Error in handleRescheduleConfirm:', error)
            throw error
        }
    }, [coachId, supabase, getCoachEvents, setShowConfirmationModal, setPendingMeetData, setQuickSchedulerDate, setIsRescheduling, setMeetToReschedule])

    return {
        handleStartReschedule,
        handleCancelReschedule,
        handleRescheduleConfirm
    }
}
