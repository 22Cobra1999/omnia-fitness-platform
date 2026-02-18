import { useState, useEffect, useMemo } from "react"
import { useSearchParams } from "next/navigation"
import { format } from "date-fns"
import { createClient } from "@/lib/supabase/supabase-client"

import { useCoachEvents } from "./useCoachEvents"
import { useCoachAvailability } from "./useCoachAvailability"
import { useCoachAvailability as useSharedCoachAvailability } from "@/components/calendar/hooks/useCoachAvailability"
import { useCoachMeetModal } from "./useCoachMeetModal"
import { useGoogleCalendarSync } from "./useGoogleCalendarSync"

// Modular hooks
import { useCoachCalendarState } from "./modules/useCoachCalendarState"
import { useCoachCalendarEventHandlers } from "./modules/useCoachCalendarEventHandlers"
import { useCoachCalendarReschedule } from "./modules/useCoachCalendarReschedule"

export function useCoachCalendarLogic() {
    const searchParams = useSearchParams()
    const supabase = createClient()

    // 1. Core Shared State (managed here to avoid circularity)
    const [currentDate, setCurrentDate] = useState(new Date())

    // 2. Google Calendar Sync
    const {
        googleConnected,
        setGoogleConnected,
        syncing,
        checkGoogleConnection,
        handleSyncGoogleCalendar
    } = useGoogleCalendarSync(async () => {
        await eventsHook.getCoachEvents()
    })

    // 3. Events Hook (needs currentDate)
    const eventsHook = useCoachEvents(currentDate, googleConnected)

    // 4. Fragmented State Module (needs events result)
    const state = useCoachCalendarState({
        supabase,
        coachId: eventsHook.coachId,
        events: eventsHook.events,
        currentDate,
        setCurrentDate
    })

    // 5. Availability Hook (Coach specific)
    const availabilityHook = useCoachAvailability(eventsHook.coachId)

    // 6. Shared Availability (for Monthly Dots)
    const dummyDate = useMemo(() => new Date(), [])
    const { availableSlotsCountByDay } = useSharedCoachAvailability(
        eventsHook.coachId,
        'month',
        dummyDate,
        currentDate,
        30
    )

    // 7. Meet Modal Hook
    const meetModalHook = useCoachMeetModal(eventsHook.coachId, async () => {
        await eventsHook.getCoachEvents(true)
    })

    // 8. Event Handlers Module
    const handlers = useCoachCalendarEventHandlers({
        supabase,
        coachId: eventsHook.coachId,
        events: eventsHook.events,
        clientEvents: state.clientEvents,
        clientsForMeet: meetModalHook.clientsForMeet,
        isRescheduling: state.isRescheduling,
        setIsRescheduling: state.setIsRescheduling,
        setMeetToReschedule: state.setMeetToReschedule,
        setSelectedDate: state.setSelectedDate,
        setQuickSchedulerDate: state.setQuickSchedulerDate,
        showQuickScheduler: state.showQuickScheduler,
        setShowQuickScheduler: state.setShowQuickScheduler,
        setViewMode: state.setViewMode,
        setPendingMeetData: state.setPendingMeetData,
        setShowConfirmationModal: state.setShowConfirmationModal,
        getCoachEvents: eventsHook.getCoachEvents
    })

    // 9. Rescheduling Module
    const reschedule = useCoachCalendarReschedule({
        supabase,
        coachId: eventsHook.coachId,
        getCoachEvents: eventsHook.getCoachEvents,
        setMeetToReschedule: state.setMeetToReschedule,
        setIsRescheduling: state.setIsRescheduling,
        setSelectedEvent: state.setSelectedEvent,
        setViewMode: state.setViewMode,
        setShowQuickScheduler: state.setShowQuickScheduler,
        setQuickSchedulerDate: state.setQuickSchedulerDate,
        setShowConfirmationModal: state.setShowConfirmationModal,
        setPendingMeetData: state.setPendingMeetData
    })

    // --- Side Effects ---
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

    // Deep Linking
    useEffect(() => {
        const eventIdParam = searchParams.get('eventId')
        if (eventIdParam && !eventsHook.loading) {
            state.openMeetById(eventIdParam)
        }
    }, [searchParams, eventsHook.loading, state.openMeetById])

    // Events by Date Memo
    const eventsByDate = useMemo(() => {
        const map: Record<string, any[]> = {}
        eventsHook.events.forEach(event => {
            const dateKey = format(new Date(event.start_time), 'yyyy-MM-dd')
            if (!map[dateKey]) map[dateKey] = []
            map[dateKey].push(event)
        })
        return map
    }, [eventsHook.events])

    return {
        // Base Hooks
        ...eventsHook,
        ...availabilityHook,
        ...meetModalHook,
        googleConnected,
        setGoogleConnected,
        syncing,
        handleSyncGoogleCalendar,
        showAvailability: state.showQuickScheduler || state.isRescheduling,

        // UI State
        ...state,
        eventsByDate,

        // Handlers
        ...handlers,
        ...reschedule,

        // Custom Overrides/Wrappers
        handleActivateScheduler: (date?: Date) => handlers.handleActivateScheduler(date, state.selectedDate),
        handleConfirmMeet: (data: any) => handlers.handleConfirmMeet(data, state.quickSchedulerDate, state.pendingMeetData),
        handleCancelReschedule: () => reschedule.handleCancelReschedule(state.meetToReschedule),
        handleRescheduleConfirm: (data: any) => reschedule.handleRescheduleConfirm(data, state.quickSchedulerDate, state.pendingMeetData, state.meetToReschedule),

        // Expose dots logic
        availableSlotsCountByDay
    }
}
