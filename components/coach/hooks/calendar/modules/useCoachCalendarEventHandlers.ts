import { useCallback } from "react"
import { v4 as uuidv4 } from 'uuid'
import { addMinutes } from "date-fns"
import { CalendarEvent } from "@/components/coach/coach-calendar-screen"
import { SupabaseClient } from "@supabase/supabase-js"

interface UseCoachCalendarEventHandlersProps {
    supabase: SupabaseClient
    coachId: string | null
    events: CalendarEvent[]
    clientEvents: any[]
    clientsForMeet: any[]
    isRescheduling: boolean
    setIsRescheduling: (v: boolean) => void
    setMeetToReschedule: (v: CalendarEvent | null) => void
    setSelectedDate: (v: Date | null) => void
    setQuickSchedulerDate: (v: Date | null) => void
    showQuickScheduler: boolean
    setShowQuickScheduler: (v: boolean) => void
    setViewMode: (v: 'month' | 'today') => void
    setPendingMeetData: (v: any) => void
    setShowConfirmationModal: (v: boolean) => void
    getCoachEvents: (force?: boolean) => Promise<void>
}

export function useCoachCalendarEventHandlers({
    supabase,
    coachId,
    events,
    clientEvents,
    clientsForMeet,
    isRescheduling,
    setIsRescheduling,
    setMeetToReschedule,
    setSelectedDate,
    setQuickSchedulerDate,
    showQuickScheduler,
    setShowQuickScheduler,
    setViewMode,
    setPendingMeetData,
    setShowConfirmationModal,
    getCoachEvents
}: UseCoachCalendarEventHandlersProps) {

    const checkOverlap = useCallback((date: Date, startTime: string, durationMinutes: number, ignoreEventId?: string) => {
        const [hours, minutes] = startTime.split(':').map(Number)
        const start = new Date(date)
        start.setHours(hours, minutes, 0, 0)
        const end = addMinutes(start, durationMinutes)

        const coachOverlap = events.some(event => {
            if (event.id === ignoreEventId) return false
            if (event.status === 'cancelled') return false
            const eventStart = new Date(event.start_time)
            const eventEnd = event.end_time ? new Date(event.end_time) : addMinutes(eventStart, 60)
            return (start < eventEnd && end > eventStart)
        })

        if (coachOverlap) return true

        if (isRescheduling && clientEvents.length > 0) {
            const clientOverlap = clientEvents.some(event => {
                const eventStart = new Date(event.start_time)
                const eventEnd = event.end_time ? new Date(event.end_time) : addMinutes(eventStart, 60)
                return (start < eventEnd && end > eventStart)
            })
            if (clientOverlap) return true
        }

        return false
    }, [events, clientEvents, isRescheduling])

    const handleCancelRescheduleRequest = useCallback(async (eventId: string) => {
        try {
            const { error } = await supabase
                .from('calendar_event_reschedule_requests')
                .update({ status: 'rejected' })
                .eq('event_id', eventId)
                .eq('status', 'pending')
                .eq('requested_by_user_id', coachId)

            if (error) throw error

            await supabase
                .from('calendar_events')
                .update({ status: 'scheduled' })
                .eq('id', eventId)
                .eq('status', 'rescheduled')

            await getCoachEvents(true)
        } catch (error) {
            console.error('❌ Error cancelling reschedule request:', error)
            throw error
        }
    }, [coachId, supabase, getCoachEvents])

    const handleDayClickForScheduler = useCallback((date: Date) => {
        setSelectedDate(date)
        if (isRescheduling || showQuickScheduler) {
            setQuickSchedulerDate(date)
            setShowQuickScheduler(true)
            setViewMode('today')
        } else {
            setViewMode('today')
        }
    }, [isRescheduling, showQuickScheduler, setSelectedDate, setQuickSchedulerDate, setShowQuickScheduler, setViewMode])

    const handleActivateScheduler = useCallback((date?: Date, selectedDateState?: Date | null) => {
        if (date) {
            setQuickSchedulerDate(date)
            setSelectedDate(date)
        } else if (selectedDateState) {
            setQuickSchedulerDate(selectedDateState)
        }
        setShowQuickScheduler(true)
        setViewMode('today')
    }, [setSelectedDate, setQuickSchedulerDate, setShowQuickScheduler, setViewMode])

    const handleQuickSchedulerConfirm = useCallback((startTime: string, durationMinutes: number) => {
        setPendingMeetData({ startTime, durationMinutes })
        setShowQuickScheduler(false)
        setShowConfirmationModal(true)
    }, [setPendingMeetData, setShowQuickScheduler, setShowConfirmationModal])

    const handleConfirmMeet = useCallback(async (data: {
        title: string
        description: string
        clientIds: string[]
        isFree: boolean
        price: number | null
    }, quickSchedulerDate: Date | null, pendingMeetData: any) => {
        if (!quickSchedulerDate || !pendingMeetData || !coachId) return

        const { startTime, durationMinutes } = pendingMeetData

        try {
            const [hours, minutes] = startTime.split(':').map(Number)
            const startDateTime = new Date(quickSchedulerDate)
            startDateTime.setHours(hours, minutes, 0, 0)
            const endDateTime = new Date(startDateTime)
            endDateTime.setMinutes(endDateTime.getMinutes() + durationMinutes)

            const eventId = uuidv4()

            const { error: eventError } = await supabase
                .from('calendar_events')
                .insert({
                    id: eventId,
                    coach_id: coachId,
                    created_by_user_id: coachId,
                    title: data.title.trim() || 'Meet',
                    start_time: startDateTime.toISOString(),
                    end_time: endDateTime.toISOString(),
                    event_type: 'consultation',
                    status: 'scheduled',
                    description: data.description.trim() || null,
                    pricing_data: { is_free: data.isFree, price: data.price, currency: 'ARS' },
                    google_meet_data: {}, relations_data: {}, timing_data: {}, lifecycle_data: {},
                } as any)

            if (eventError) throw eventError

            const participantRows = [
                {
                    event_id: eventId, user_id: coachId,
                    rsvp_status: 'confirmed', payment_status: 'free',
                    role: 'coach', is_creator: true, can_reschedule: true,
                    attendance_status: 'pending',
                    invitation_data: { invited_by: coachId, invited_at: new Date().toISOString() }
                },
                ...data.clientIds.map((clientId) => {
                    const clientData = clientsForMeet.find(c => c.id === clientId)
                    let paymentStatus = data.isFree ? 'free' : (!data.price || Number(data.price) === 0 ? 'credit_deduction' : 'unpaid')
                    return {
                        event_id: eventId, user_id: clientId,
                        rsvp_status: 'pending', payment_status: paymentStatus,
                        role: 'client', is_creator: false, can_reschedule: false,
                        attendance_status: 'pending',
                        invitation_data: {
                            invited_by: coachId,
                            invited_at: new Date().toISOString(),
                            message: data.description.trim() || undefined
                        }
                    }
                }),
            ]

            const { error: partError } = await supabase
                .from('calendar_event_participants')
                .insert(participantRows as any)

            if (partError) {
                await supabase.from('calendar_events').delete().eq('id', eventId)
                throw partError
            }

            setShowConfirmationModal(false)
            setPendingMeetData(null)
            setQuickSchedulerDate(null)
            await getCoachEvents(true)
        } catch (error) {
            console.error('❌ Error in handleConfirmMeet:', error)
            throw error
        }
    }, [coachId, clientsForMeet, supabase, getCoachEvents, setShowConfirmationModal, setPendingMeetData, setQuickSchedulerDate])

    const handleCancelConfirmation = useCallback(() => {
        setShowConfirmationModal(false)
        setPendingMeetData(null)
        setShowQuickScheduler(false)
        if (isRescheduling) {
            setIsRescheduling(false)
            setMeetToReschedule(null)
        }
    }, [isRescheduling, setShowConfirmationModal, setPendingMeetData, setShowQuickScheduler, setIsRescheduling, setMeetToReschedule])

    const handleEditTime = useCallback(() => {
        setShowConfirmationModal(false)
        setShowQuickScheduler(true)
    }, [setShowConfirmationModal, setShowQuickScheduler])

    const handleQuickSchedulerCancel = useCallback(() => {
        setShowQuickScheduler(false)
        setQuickSchedulerDate(null)
        setPendingMeetData(null)
        if (isRescheduling) {
            setIsRescheduling(false)
            setMeetToReschedule(null)
        }
    }, [isRescheduling, setShowQuickScheduler, setQuickSchedulerDate, setPendingMeetData, setIsRescheduling, setMeetToReschedule])

    return {
        checkOverlap,
        handleCancelRescheduleRequest,
        handleDayClickForScheduler,
        handleActivateScheduler,
        handleQuickSchedulerConfirm,
        handleConfirmMeet,
        handleCancelConfirmation,
        handleEditTime,
        handleQuickSchedulerCancel
    }
}
