import { useState, useEffect, useCallback, useMemo } from "react"
import { useSearchParams } from "next/navigation"
import { v4 as uuidv4 } from 'uuid'
import { createClient } from "@/lib/supabase/supabase-client"
import { format, isSameDay, addMonths, subMonths, addDays, subDays, parse, addMinutes } from "date-fns"
import { useCoachEvents } from "./useCoachEvents"
import { useCoachAvailability } from "./useCoachAvailability"
import { useCoachMeetModal } from "./useCoachMeetModal"
import { useGoogleCalendarSync } from "./useGoogleCalendarSync"
import { CalendarEvent } from "@/components/coach/coach-calendar-screen"

export function useCoachCalendarLogic() {
    // --- Estados de UI Base ---
    const [currentDate, setCurrentDate] = useState(new Date())
    const [selectedDate, setSelectedDate] = useState<Date | null>(new Date())
    const [viewMode, setViewMode] = useState<'month' | 'today'>('month')
    const [calendarMode, setCalendarMode] = useState<'events' | 'availability'>('events')
    const [showMonthSelector, setShowMonthSelector] = useState(false)
    const [monthPickerYear, setMonthPickerYear] = useState<number>(() => new Date().getFullYear())
    const [showAddMenu, setShowAddMenu] = useState(false)
    const [showMeetNotifications, setShowMeetNotifications] = useState(false)
    const [meetNotificationsCount, setMeetNotificationsCount] = useState<number>(0)
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
    const [showQuickScheduler, setShowQuickScheduler] = useState(false)
    const [quickSchedulerDate, setQuickSchedulerDate] = useState<Date | null>(null)
    const [showConfirmationModal, setShowConfirmationModal] = useState(false)
    const [pendingMeetData, setPendingMeetData] = useState<{
        startTime: string
        durationMinutes: number
    } | null>(null)
    const [isRescheduling, setIsRescheduling] = useState(false)
    const [meetToReschedule, setMeetToReschedule] = useState<CalendarEvent | null>(null)

    const searchParams = useSearchParams()
    const supabase = createClient()

    // --- Composición de Hooks ---
    const {
        googleConnected,
        setGoogleConnected,
        syncing,
        checkGoogleConnection,
        handleSyncGoogleCalendar
    } = useGoogleCalendarSync(async () => {
        await eventsHook.getCoachEvents()
    })

    const eventsHook = useCoachEvents(currentDate, googleConnected)

    const availabilityHook = useCoachAvailability(eventsHook.coachId)

    const meetModalHook = useCoachMeetModal(eventsHook.coachId, async () => {
        await eventsHook.getCoachEvents(true)
    })

    // --- Lógica de Superposición ---
    const checkOverlap = useCallback((date: Date, startTime: string, durationMinutes: number, ignoreEventId?: string) => {
        const [hours, minutes] = startTime.split(':').map(Number)
        const start = new Date(date)
        start.setHours(hours, minutes, 0, 0)
        const end = addMinutes(start, durationMinutes)

        return eventsHook.events.some(event => {
            if (event.id === ignoreEventId) return false
            if (event.status === 'cancelled') return false

            const eventStart = new Date(event.start_time)
            const eventEnd = event.end_time ? new Date(event.end_time) : addMinutes(eventStart, 60)

            return (start < eventEnd && end > eventStart)
        })
    }, [eventsHook.events])

    // --- Lógica de Notificaciones ---
    useEffect(() => {
        const loadMeetNotificationCount = async () => {
            if (!eventsHook.coachId) {
                setMeetNotificationsCount(0)
                return
            }
            try {
                const now = new Date().toISOString()

                // 1. New meet invitations (pending RSVP) for future events
                const { data: myEvents } = await supabase
                    .from('calendar_events')
                    .select('id')
                    .eq('coach_id', eventsHook.coachId)
                    .eq('event_type', 'consultation')
                    .gte('start_time', now) // Only from today onwards
                    .limit(200)

                const ids = (myEvents || []).map((e: any) => String(e?.id || '')).filter(Boolean)

                let pendingRsvpCount = 0
                if (ids.length > 0) {
                    const { count } = await supabase
                        .from('calendar_event_participants')
                        .select('id', { count: 'exact' })
                        .in('event_id', ids)
                        .eq('rsvp_status', 'pending')
                        .neq('participant_role', 'coach')
                    pendingRsvpCount = Number(count || 0)
                }

                // 2. Pending reschedules requested BY OTHERS (clients)
                // If I am coach, I want to see if a client asked for a change
                const { count: rescheduleCount } = await supabase
                    .from('calendar_event_reschedule_requests')
                    .select('id', { count: 'exact' })
                    .in('event_id', ids)
                    .eq('status', 'pending')
                    .neq('requested_by_user_id', eventsHook.coachId)

                setMeetNotificationsCount(pendingRsvpCount + Number(rescheduleCount || 0))
            } catch {
                setMeetNotificationsCount(0)
            }
        }
        loadMeetNotificationCount()
    }, [eventsHook.coachId, eventsHook.events, supabase])

    const handleCancelRescheduleRequest = useCallback(async (eventId: string) => {
        try {
            // Cancel pending request for this event
            const { error } = await supabase
                .from('calendar_event_reschedule_requests')
                .update({ status: 'rejected' }) // Or 'cancelled' if your logic supports it. Using rejected to clear it accurately.
                .eq('event_id', eventId)
                .eq('status', 'pending')
                .eq('requested_by_user_id', eventsHook.coachId)

            if (error) throw error

            // Restore event status if it was 'rescheduled' but actually was just pending
            await supabase
                .from('calendar_events')
                .update({ status: 'scheduled' })
                .eq('id', eventId)
                .eq('status', 'rescheduled')

            await eventsHook.getCoachEvents(true)
            console.log('✅ Reschedule request cancelled')
        } catch (error) {
            console.error('❌ Error cancelling reschedule request:', error)
            throw error
        }
    }, [eventsHook, supabase])

    // --- Navegación ---
    const goToPreviousMonth = () => setCurrentDate(subMonths(currentDate, 1))
    const goToNextMonth = () => setCurrentDate(addMonths(currentDate, 1))
    const goToToday = () => {
        const now = new Date()
        setCurrentDate(now)
        setSelectedDate(now)
        setViewMode('today')
    }
    const changeMonth = (monthIndex: number) => {
        const newDate = new Date(monthPickerYear, monthIndex, 1)
        setCurrentDate(newDate)
        setShowMonthSelector(false)
    }

    const handleDateClick = (date: Date) => {
        setSelectedDate(date)
        setViewMode('today')
    }

    // --- Deep Linking ---
    const openMeetById = useCallback(async (eventId: string): Promise<any | null> => {
        const found = eventsHook.events.find((e) => String(e.id) === String(eventId))
        if (found) {
            return found
        }
        // Si no está en eventos cargados, buscar en DB
        const { data: ev } = await supabase
            .from('calendar_events')
            .select('id, title, description, start_time, end_time, event_type, status, google_meet_data, created_by_user_id')
            .eq('id', eventId)
            .maybeSingle()

        if (ev?.id) {
            return {
                id: String(ev.id),
                title: String(ev.title || 'Meet'),
                start_time: String(ev.start_time),
                end_time: String(ev.end_time),
                event_type: 'consultation',
                status: (ev.status as any) || 'scheduled',
                description: ev.description ?? undefined,
                meet_link: ev.google_meet_data?.meet_link ?? undefined,
                google_event_id: ev.google_meet_data?.google_event_id ?? undefined,
                client_id: ev.created_by_user_id,
            }
        }
        return null
    }, [eventsHook.events, supabase])

    useEffect(() => {
        const eventIdParam = searchParams.get('eventId')
        if (eventIdParam && !eventsHook.loading) {
            openMeetById(eventIdParam)
        }
    }, [searchParams, eventsHook.loading, openMeetById])

    // --- Inicialización ---
    useEffect(() => {
        checkGoogleConnection()
    }, [checkGoogleConnection])

    useEffect(() => {
        if (eventsHook.coachId) {
            meetModalHook.ensureClientsLoaded().catch(() => { })
        }
    }, [eventsHook.coachId, meetModalHook.ensureClientsLoaded])

    useEffect(() => {
        eventsHook.getCoachEvents()
    }, [currentDate, eventsHook.getCoachEvents])

    // --- Quick Scheduler Handlers ---
    const handleDayClickForScheduler = useCallback((date: Date) => {
        setSelectedDate(date)

        // If we are rescheduling or the scheduler was already open, 
        // update the scheduler date and make sure it's visible
        if (isRescheduling || showQuickScheduler) {
            setQuickSchedulerDate(date)
            setShowQuickScheduler(true)
            setViewMode('today')
        } else {
            // Just normal day click, go to today view to see activities
            setViewMode('today')
        }
    }, [isRescheduling, showQuickScheduler])

    const handleActivateScheduler = useCallback((date?: Date) => {
        // This is called from the "+" → "Meet" button
        if (date) {
            setQuickSchedulerDate(date)
            setSelectedDate(date)
        } else if (selectedDate) {
            setQuickSchedulerDate(selectedDate)
        }
        setShowQuickScheduler(true)
        setViewMode('today')
    }, [selectedDate])

    const handleQuickSchedulerConfirm = useCallback((startTime: string, durationMinutes: number) => {
        // Save the selected time and open confirmation modal
        setPendingMeetData({ startTime, durationMinutes })
        setShowQuickScheduler(false)
        setShowConfirmationModal(true)
        // Modal will check isRescheduling to show appropriate UI
    }, [])

    const handleConfirmMeet = useCallback(async (data: {
        title: string
        description: string
        clientIds: string[]
        isFree: boolean
        price: number | null
    }) => {
        if (!quickSchedulerDate || !pendingMeetData || !eventsHook.coachId) return

        const { startTime, durationMinutes } = pendingMeetData

        try {
            // Parse start time and calculate end time
            const [hours, minutes] = startTime.split(':').map(Number)
            const startDateTime = new Date(quickSchedulerDate)
            startDateTime.setHours(hours, minutes, 0, 0)

            const endDateTime = new Date(startDateTime)
            endDateTime.setMinutes(endDateTime.getMinutes() + durationMinutes)

            const startISO = startDateTime.toISOString()
            const endISO = endDateTime.toISOString()

            const eventId = uuidv4()

            // Create the event
            const { error: eventError } = await supabase
                .from('calendar_events')
                .insert({
                    id: eventId,
                    coach_id: eventsHook.coachId,
                    created_by_user_id: eventsHook.coachId,
                    title: data.title.trim() || 'Meet',
                    start_time: startISO,
                    end_time: endISO,
                    event_type: 'consultation',
                    status: 'scheduled',
                    description: data.description.trim() || null,
                    pricing_data: {
                        is_free: data.isFree,
                        price: data.price,
                        currency: 'ARS',
                    },
                    google_meet_data: {},
                    relations_data: {},
                    timing_data: {},
                    lifecycle_data: {},
                } as any)

            if (eventError) {
                console.error('❌ Error creating event:', eventError)
                throw new Error(eventError?.message || 'No se pudo crear el evento')
            }

            // Create participants
            const participantRows = [
                // Coach as host
                {
                    event_id: eventId,
                    user_id: eventsHook.coachId,
                    rsvp_status: 'confirmed',
                    payment_status: 'free',
                    role: 'host',
                    is_creator: true,
                    can_reschedule: true,
                    attendance_status: 'pending',
                    invitation_data: {
                        invited_by: eventsHook.coachId,
                        invited_at: new Date().toISOString()
                    }
                },
                // Clients as participants
                ...data.clientIds.map((clientId) => {
                    const clientData = meetModalHook.clientsForMeet.find(c => c.id === clientId)
                    const availableCredits = clientData?.meet_credits_available || 0
                    const creditsRequired = Math.ceil(durationMinutes / 15)

                    let paymentStatus = 'unpaid'
                    if (availableCredits >= creditsRequired) {
                        paymentStatus = 'credit_deduction'
                    } else if (data.isFree) {
                        paymentStatus = 'free'
                    }

                    return {
                        event_id: eventId,
                        user_id: clientId,
                        rsvp_status: 'pending',
                        payment_status: paymentStatus,
                        role: 'participant',
                        is_creator: false,
                        can_reschedule: false,
                        attendance_status: 'pending',
                        invitation_data: {
                            invited_by: eventsHook.coachId,
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
                // Rollback: delete the event
                await supabase.from('calendar_events').delete().eq('id', eventId)
                console.error('❌ Error creating participants:', partError)
                throw new Error(partError.message || 'No se pudo enviar la solicitud')
            }

            // Success! Close modal and refresh
            setShowConfirmationModal(false)
            setPendingMeetData(null)
            setQuickSchedulerDate(null)

            // Refresh events
            await eventsHook.getCoachEvents(true)

            console.log('✅ Meet created successfully:', eventId)
        } catch (error: any) {
            console.error('❌ Error in handleConfirmMeet:', error)
            // TODO: Show error toast
            throw error
        }
    }, [quickSchedulerDate, pendingMeetData, eventsHook, supabase])

    const handleCancelConfirmation = useCallback(() => {
        setShowConfirmationModal(false)
        setPendingMeetData(null)
        // If we cancel confirmation, we usually want to stop the whole flow
        setShowQuickScheduler(false)
        if (isRescheduling) {
            setIsRescheduling(false)
            setMeetToReschedule(null)
        }
    }, [isRescheduling])

    const handleEditTime = useCallback(() => {
        setShowConfirmationModal(false)
        setShowQuickScheduler(true)
    }, [])

    const handleQuickSchedulerCancel = useCallback(() => {
        setShowQuickScheduler(false)
        setQuickSchedulerDate(null)
        setPendingMeetData(null)
        if (isRescheduling) {
            setIsRescheduling(false)
            setMeetToReschedule(null)
        }
    }, [isRescheduling])

    const handleStartReschedule = useCallback((meet: CalendarEvent) => {
        setMeetToReschedule(meet)
        setIsRescheduling(true)
        setSelectedEvent(null) // Close detail modal
        setViewMode('month') // Go back to calendar
    }, [])

    const handleCancelReschedule = useCallback(() => {
        if (meetToReschedule) {
            setSelectedEvent(meetToReschedule)
        }
        setIsRescheduling(false)
        setMeetToReschedule(null)
        setShowQuickScheduler(false)
        setQuickSchedulerDate(null)
    }, [meetToReschedule])

    const handleRescheduleConfirm = useCallback(async (data: {
        title: string
        description: string
        clientIds: string[]
        isFree: boolean
        price: number | null
    }) => {
        if (!quickSchedulerDate || !pendingMeetData || !meetToReschedule || !eventsHook.coachId) return

        const { startTime, durationMinutes } = pendingMeetData

        try {
            // Parse new start time and calculate new end time
            const [hours, minutes] = startTime.split(':').map(Number)
            const newStartDateTime = new Date(quickSchedulerDate)
            newStartDateTime.setHours(hours, minutes, 0, 0)

            const newEndDateTime = new Date(newStartDateTime)
            newEndDateTime.setMinutes(newEndDateTime.getMinutes() + durationMinutes)

            const newStartISO = newStartDateTime.toISOString()
            const newEndISO = newEndDateTime.toISOString()

            // Create reschedule request
            const { error: rescheduleError } = await supabase
                .from('calendar_event_reschedule_requests')
                .insert({
                    event_id: meetToReschedule.id,
                    requested_by_user_id: eventsHook.coachId,
                    from_start_time: meetToReschedule.start_time,
                    from_end_time: meetToReschedule.end_time,
                    to_start_time: newStartISO,
                    to_end_time: newEndISO,
                    status: 'pending',
                    reason: data.description.trim() || 'Solicitud de reprogramación',
                } as any)

            if (rescheduleError) {
                console.error('❌ Error creating reschedule request:', rescheduleError)
                throw new Error(rescheduleError.message || 'No se pudo crear la solicitud de reprogramación')
            }

            // Update event status to rescheduled
            await supabase
                .from('calendar_events')
                .update({
                    status: 'rescheduled',
                    lifecycle_data: {
                        rescheduled_at: new Date().toISOString(),
                        rescheduled_by: eventsHook.coachId
                    }
                })
                .eq('id', meetToReschedule.id)

            // Success! Close modal and refresh
            setShowConfirmationModal(false)
            setPendingMeetData(null)
            setQuickSchedulerDate(null)
            setIsRescheduling(false)
            setMeetToReschedule(null)

            // Refresh events
            await eventsHook.getCoachEvents(true)

            console.log('✅ Reschedule request created successfully')
        } catch (error: any) {
            console.error('❌ Error in handleRescheduleConfirm:', error)
            throw error
        }
    }, [quickSchedulerDate, pendingMeetData, meetToReschedule, eventsHook, supabase])

    // Organizar eventos por fecha para el calendario
    const eventsByDate = useMemo(() => {
        const map: Record<string, CalendarEvent[]> = {}
        eventsHook.events.forEach(event => {
            const dateKey = format(new Date(event.start_time), 'yyyy-MM-dd')
            if (!map[dateKey]) map[dateKey] = []
            map[dateKey].push(event)
        })
        return map
    }, [eventsHook.events])

    return {
        // Hooks base
        ...eventsHook,
        ...availabilityHook,
        ...meetModalHook,
        googleConnected,
        setGoogleConnected,
        syncing,
        handleSyncGoogleCalendar,
        checkOverlap,

        // UI State
        currentDate,
        setCurrentDate,
        selectedDate,
        setSelectedDate,
        viewMode,
        setViewMode,
        calendarMode,
        setCalendarMode,
        showMonthSelector,
        setShowMonthSelector,
        monthPickerYear,
        setMonthPickerYear,
        showAddMenu,
        setShowAddMenu,
        showMeetNotifications,
        setShowMeetNotifications,
        meetNotificationsCount,
        eventsByDate,
        selectedEvent,
        setSelectedEvent,
        showQuickScheduler,
        setShowQuickScheduler,
        quickSchedulerDate,
        showConfirmationModal,
        setShowConfirmationModal,
        pendingMeetData,
        isRescheduling,
        meetToReschedule,

        // UI Handlers
        goToPreviousMonth,
        goToNextMonth,
        goToToday,
        changeMonth,
        handleDateClick,
        openMeetById,
        handleDayClickForScheduler,
        handleActivateScheduler,
        handleQuickSchedulerConfirm,
        handleQuickSchedulerCancel,
        handleConfirmMeet,
        handleCancelConfirmation,
        handleEditTime,
        handleStartReschedule,
        handleRescheduleConfirm,
        handleCancelReschedule,
        handleCancelRescheduleRequest
    }
}
