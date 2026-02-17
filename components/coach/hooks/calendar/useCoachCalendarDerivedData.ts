import React from "react"
import { format, isToday } from "date-fns"
import { es } from "date-fns/locale"

export function useCoachCalendarDerivedData(
    selectedDate: Date | null,
    eventsByDate: Record<string, any[]>,
    quickSchedulerDate: Date | null,
    clientEvents: any[],
    selectedClientForQuickMeet: any,
    meetToReschedule: any,
    clientsForMeet: any[]
) {
    // Calclular eventos del día seleccionado para el detalle inferior
    const { dayEvents, meetEvents, otherEvents, dateLabel } = React.useMemo(() => {
        if (!selectedDate) return { dayEvents: [], meetEvents: [], otherEvents: [], dateLabel: '' }

        const dateKey = format(selectedDate, 'yyyy-MM-dd')
        const events = eventsByDate[dateKey] || []

        const meets = events.filter(e =>
            e.event_type === 'consultation' || e.event_type === 'workshop'
        )
        const others = events.filter(e =>
            e.event_type !== 'consultation' && e.event_type !== 'workshop'
        )
        const label = isToday(selectedDate)
            ? 'Hoy'
            : (() => {
                const raw = format(selectedDate, "eeee d 'de' MMMM", { locale: es });
                return raw.charAt(0).toUpperCase() + raw.slice(1);
            })();

        return { dayEvents: events, meetEvents: meets, otherEvents: others, dateLabel: label }
    }, [selectedDate, eventsByDate])

    // Calculate Client Day Events for Scheduler
    const clientDayEvents = React.useMemo(() => {
        if (!quickSchedulerDate || !clientEvents.length) return []
        const dayKey = format(quickSchedulerDate, 'yyyy-MM-dd')
        return clientEvents.filter(e => {
            const eDate = new Date(e.start_time)
            return format(eDate, 'yyyy-MM-dd') === dayKey
        })
    }, [quickSchedulerDate, clientEvents])

    // Calculate Client Events for Selected Date (Main List)
    const clientSelectedDateEvents = React.useMemo(() => {
        if (!selectedDate || !clientEvents.length) return []
        const dayKey = format(selectedDate, 'yyyy-MM-dd')
        return clientEvents.filter(e => {
            const eDate = new Date(e.start_time)
            return format(eDate, 'yyyy-MM-dd') === dayKey
        })
    }, [selectedDate, clientEvents])

    // Helper: Get Full Client Data (with credits)
    const activeClientData = React.useMemo(() => {
        if (selectedClientForQuickMeet) return selectedClientForQuickMeet
        if (meetToReschedule && clientsForMeet.length > 0) {
            return clientsForMeet.find((c: any) => c.id === meetToReschedule.client_id) || {
                id: meetToReschedule.client_id,
                full_name: meetToReschedule.client_name || 'Cliente',
                avatar_url: null,
                meet_credits_available: 0 // Fallback
            }
        }
        return null
    }, [selectedClientForQuickMeet, meetToReschedule, clientsForMeet])

    return {
        dayEvents,
        meetEvents,
        otherEvents,
        dateLabel,
        clientDayEvents,
        clientSelectedDateEvents,
        activeClientData
    }
}
