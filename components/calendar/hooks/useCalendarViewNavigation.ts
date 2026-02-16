
import { useState, useMemo } from "react"
import { format, subMonths, addMonths, startOfWeek } from "date-fns"
import { es } from "date-fns/locale"

export function useCalendarViewNavigation() {
    const [currentDate, setCurrentDate] = useState(new Date())
    const [meetViewMode, setMeetViewMode] = useState<'month' | 'week' | 'day_split'>('month')
    const [meetWeekStart, setMeetWeekStart] = useState<Date>(startOfWeek(new Date(), { weekStartsOn: 1 }))

    const monthLabel = useMemo(() => {
        const raw = format(currentDate, 'MMMM yyyy', { locale: es })
        if (!raw) return raw
        return raw.charAt(0).toUpperCase() + raw.slice(1)
    }, [currentDate])

    const previousMonth = () => setCurrentDate(subMonths(currentDate, 1))
    const nextMonth = () => setCurrentDate(addMonths(currentDate, 1))
    const goToToday = () => setCurrentDate(new Date())

    return {
        currentDate,
        setCurrentDate,
        meetViewMode,
        setMeetViewMode,
        meetWeekStart,
        setMeetWeekStart,
        monthLabel,
        previousMonth,
        nextMonth,
        goToToday
    }
}
