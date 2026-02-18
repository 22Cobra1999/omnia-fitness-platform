import { useState, useEffect, useCallback, useMemo } from "react"
import { subMonths, addMonths, subDays, addDays, addMinutes } from "date-fns"
import { CalendarEvent } from "@/components/coach/coach-calendar-screen"
import { SupabaseClient } from "@supabase/supabase-js"

interface UseCoachCalendarStateProps {
    supabase: SupabaseClient
    coachId: string | null
    events: CalendarEvent[]
    currentDate: Date
    setCurrentDate: React.Dispatch<React.SetStateAction<Date>>
}

export function useCoachCalendarState({
    supabase,
    coachId,
    events,
    currentDate,
    setCurrentDate
}: UseCoachCalendarStateProps) {
    // --- Estados de UI Base ---
    const [selectedDate, setSelectedDate] = useState<Date | null>(new Date())
    const [viewedClientId, setViewedClientId] = useState<string | null>(null)
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
    const [clientEvents, setClientEvents] = useState<any[]>([])

    // --- Lógica de Client Availability (para Reschedule) ---
    useEffect(() => {
        const fetchClientEvents = async () => {
            let clientIds: string[] = []
            let referenceDate = selectedDate || currentDate

            if (isRescheduling && meetToReschedule && quickSchedulerDate) {
                referenceDate = quickSchedulerDate
                const { data: participants } = await supabase
                    .from('calendar_event_participants')
                    .select('user_id')
                    .eq('event_id', meetToReschedule.id)
                    .neq('user_id', coachId)

                clientIds = participants?.map((p: any) => p.user_id) || []
            } else if (viewedClientId) {
                clientIds = [viewedClientId]
            }

            if (clientIds.length === 0) {
                setClientEvents([])
                return
            }

            const startRange = subDays(new Date(referenceDate), 7).toISOString()
            const endRange = addDays(new Date(referenceDate), 30).toISOString()

            const { data: participantEvents } = await supabase
                .from('calendar_event_participants')
                .select('event_id, calendar_events(id, start_time, end_time, title, status)')
                .in('user_id', clientIds)
                .in('rsvp_status', ['confirmed', 'accepted'])

            const parsedClientEvents = (participantEvents || [])
                .map((row: any) => row.calendar_events)
                .filter((ev: any) =>
                    ev &&
                    ev.status !== 'cancelled' &&
                    new Date(ev.start_time) >= new Date(startRange) &&
                    new Date(ev.end_time) <= new Date(endRange)
                )
                .map((ev: any) => ({
                    ...ev,
                    is_client_event: true,
                    title: 'Ocupado (Cliente)'
                }))

            setClientEvents(parsedClientEvents)
        }

        fetchClientEvents()
    }, [isRescheduling, meetToReschedule?.id, quickSchedulerDate, viewedClientId, selectedDate, currentDate, supabase, coachId])

    // --- Lógica de Notificaciones ---
    useEffect(() => {
        const loadMeetNotificationCount = async () => {
            if (!coachId) {
                setMeetNotificationsCount(0)
                return
            }
            try {
                const now = new Date().toISOString()

                const { data: myEvents } = await supabase
                    .from('calendar_events')
                    .select('id')
                    .eq('coach_id', coachId)
                    .eq('event_type', 'consultation')
                    .gte('start_time', now)
                    .limit(200)

                const ids = (myEvents || []).map((e: any) => String(e?.id || '')).filter(Boolean)

                let pendingRsvpCount = 0
                if (ids.length > 0) {
                    const { count } = await supabase
                        .from('calendar_event_participants')
                        .select('id', { count: 'exact' })
                        .in('event_id', ids)
                        .eq('rsvp_status', 'pending')
                        .neq('role', 'coach')
                    pendingRsvpCount = Number(count || 0)
                }

                const { count: rescheduleCount } = await supabase
                    .from('calendar_event_reschedule_requests')
                    .select('id', { count: 'exact' })
                    .in('event_id', ids)
                    .eq('status', 'pending')
                    .neq('requested_by_user_id', coachId)

                setMeetNotificationsCount(pendingRsvpCount + Number(rescheduleCount || 0))
            } catch {
                setMeetNotificationsCount(0)
            }
        }
        loadMeetNotificationCount()
    }, [coachId, events, supabase])

    // --- Navegación ---
    const goToPreviousMonth = useCallback(() => setCurrentDate(prev => subMonths(prev, 1)), [])
    const goToNextMonth = useCallback(() => setCurrentDate(prev => addMonths(prev, 1)), [])
    const goToToday = useCallback(() => {
        const now = new Date()
        setCurrentDate(now)
        setSelectedDate(now)
        setViewMode('today')
    }, [])
    const changeMonth = useCallback((monthIndex: number) => {
        setCurrentDate(prev => new Date(monthPickerYear, monthIndex, 1))
        setShowMonthSelector(false)
    }, [monthPickerYear])

    const handleDateClick = useCallback((date: Date) => {
        setSelectedDate(date)
        setViewMode('today')
    }, [])

    const openMeetById = useCallback(async (eventId: string): Promise<any | null> => {
        const found = events.find((e) => String(e.id) === String(eventId))
        if (found) return found

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
    }, [events, supabase])

    return {
        currentDate, setCurrentDate,
        selectedDate, setSelectedDate,
        viewedClientId, setViewedClientId,
        viewMode, setViewMode,
        calendarMode, setCalendarMode,
        showMonthSelector, setShowMonthSelector,
        monthPickerYear, setMonthPickerYear,
        showAddMenu, setShowAddMenu,
        showMeetNotifications, setShowMeetNotifications,
        meetNotificationsCount, setMeetNotificationsCount,
        selectedEvent, setSelectedEvent,
        showQuickScheduler, setShowQuickScheduler,
        quickSchedulerDate, setQuickSchedulerDate,
        showConfirmationModal, setShowConfirmationModal,
        pendingMeetData, setPendingMeetData,
        isRescheduling, setIsRescheduling,
        meetToReschedule, setMeetToReschedule,
        clientEvents, setClientEvents,
        goToPreviousMonth, goToNextMonth, goToToday, changeMonth, handleDateClick,
        openMeetById
    }
}
