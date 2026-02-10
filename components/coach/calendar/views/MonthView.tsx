import React from 'react'
import {
    format,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    isToday
} from 'date-fns'
import { es } from 'date-fns/locale'
import { Video, ChevronDown } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface MonthViewProps {
    currentDate: Date
    selectedDate: Date | null
    eventsByDate: Record<string, any[]>
    onDateClick: (date: Date) => void
    onPrevMonth: () => void
    onNextMonth: () => void
    onMonthClick: () => void
    availabilityRules?: any[]
}

export function MonthView({
    currentDate,
    selectedDate,
    eventsByDate,
    onDateClick,
    onPrevMonth,
    onNextMonth,
    onMonthClick,
    availabilityRules = []
}: MonthViewProps) {
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(monthStart)
    const startDate = startOfWeek(monthStart)
    const endDate = endOfWeek(monthEnd)

    const calendarDays = eachDayOfInterval({
        start: startDate,
        end: endDate,
    })

    // Dias de la semana
    const weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

    return (
        <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="px-4 pt-4 pb-2">
                <div className="flex items-center justify-between relative">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onPrevMonth}
                        className="text-white hover:bg-zinc-800"
                        title="Mes anterior"
                    >
                        ←
                    </Button>

                    <button
                        type="button"
                        onClick={onMonthClick}
                        className="text-white font-semibold text-lg flex items-center gap-2 hover:text-[#FFB366] transition-colors capitalize"
                        title="Cambiar mes"
                    >
                        {format(currentDate, 'MMMM yyyy', { locale: es })}
                        <ChevronDown className="h-4 w-4" />
                    </button>

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onNextMonth}
                        className="text-white hover:bg-zinc-800"
                        title="Mes siguiente"
                    >
                        →
                    </Button>
                </div>
            </CardHeader>

            <CardContent className="px-4 pb-4">
                {/* Week Days Headers */}
                <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
                    {weekDays.map((day) => (
                        <div key={day} className="text-center text-sm font-semibold text-gray-400">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Days Grid */}
                <div className="grid grid-cols-7 gap-1 sm:gap-2">
                    {Array.from({ length: startDate.getDay() }).map((_, idx) => (
                        <div key={`empty-${idx}`} className="aspect-square p-2" />
                    ))}

                    {calendarDays.map((day) => {
                        const dateKey = format(day, 'yyyy-MM-dd')
                        const dayEvents = eventsByDate[dateKey] || []
                        const isSelected = selectedDate && isSameDay(day, selectedDate)
                        const isTodayDate = isToday(day)
                        const isCurrentMonth = isSameMonth(day, monthStart)

                        // Filtrar meets (consultations y workshops) activos
                        const meetEvents = dayEvents.filter(e =>
                            (e.event_type === 'consultation' || e.event_type === 'workshop') &&
                            e.status !== 'cancelled'
                        )

                        // Eventos de Google Calendar
                        const googleEvents = dayEvents.filter(e =>
                            e.source === 'google_calendar' || e.is_google_event
                        )

                        return (
                            <button
                                key={day.toISOString()}
                                type="button"
                                onClick={() => onDateClick(day)}
                                className={
                                    `aspect-square p-1.5 sm:p-2 rounded-lg text-sm font-medium transition-colors flex flex-col items-center justify-start relative ` +
                                    `${!isCurrentMonth ? 'opacity-30' : ''} ` +
                                    `${isSelected ? 'backdrop-blur-md bg-white/10 border border-[#FF7939]/40 shadow-[0_8px_24px_rgba(0,0,0,0.35)] text-white' : ''} ` +
                                    `${isTodayDate && !isSelected ? 'bg-zinc-800 text-white' : ''} ` +
                                    `${!isSelected && !isTodayDate ? 'text-gray-400 hover:bg-zinc-800' : ''}`
                                }
                            >
                                <div className="w-full text-center">
                                    <span>
                                        {format(day, 'd')}
                                    </span>
                                </div>

                                {/* Burbuja de Meet (Video) - IDÉNTICA AL CLIENTE */}
                                {meetEvents.length > 0 && (
                                    <div className="mt-1 flex flex-wrap items-center justify-center gap-1">
                                        {/* Confirmed Meets Indicator */}
                                        {(() => {
                                            const confirmedMeets = meetEvents.filter(m => {
                                                const isFullyConfirmed = (m.status === 'scheduled' || m.status === 'confirmed' || m.status === 'rescheduled') &&
                                                    m.rsvp_status !== 'pending' &&
                                                    m.pending_reschedule?.status !== 'pending' &&
                                                    !m.is_ghost;
                                                return isFullyConfirmed;
                                            })
                                            if (confirmedMeets.length === 0) return null
                                            return (
                                                <span className="inline-flex items-center justify-center px-1.5 h-6 rounded-full border border-white/20 bg-white/10 gap-1">
                                                    <Video className="w-3.5 h-3.5 text-white" />
                                                    {confirmedMeets.length > 1 && (
                                                        <span className="text-[10px] font-bold text-white">
                                                            {confirmedMeets.length}
                                                        </span>
                                                    )}
                                                </span>
                                            )
                                        })()}

                                        {/* Pending/Ghost Meets Indicator */}
                                        {(() => {
                                            const pendingMeets = meetEvents.filter(m => {
                                                const isActuallyPending = m.is_ghost ||
                                                    m.rsvp_status === 'pending' ||
                                                    m.pending_reschedule?.status === 'pending';
                                                return isActuallyPending;
                                            })
                                            if (pendingMeets.length === 0) return null
                                            return (
                                                <span className="inline-flex items-center justify-center px-1.5 h-6 rounded-full border border-[#FF3B30]/60 bg-[#FF3B30]/30 gap-1">
                                                    <Video className="w-3.5 h-3.5 text-[#FF3B30]" />
                                                    {pendingMeets.length > 1 && (
                                                        <span className="text-[10px] font-bold text-[#FF3B30]">
                                                            {pendingMeets.length}
                                                        </span>
                                                    )}
                                                </span>
                                            )
                                        })()}
                                    </div>
                                )}

                                {/* Indicador de eventos de Google Calendar */}
                                {googleEvents.length > 0 && (
                                    <div className="mt-1 flex items-center justify-center">
                                        <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full border text-[10px] font-bold backdrop-blur-md bg-blue-500/10 border-blue-500/30 text-blue-400">
                                            {googleEvents.length}
                                        </span>
                                    </div>
                                )}
                            </button>
                        )
                    })}
                </div>
            </CardContent>
        </Card>
    )
}
