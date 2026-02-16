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
import { Video, ChevronDown, GraduationCap, ChevronLeft, ChevronRight } from 'lucide-react'
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
    availableSlotsCountByDay?: Record<string, number>
    showAvailability?: boolean
    hideHeader?: boolean
}

export function MonthView({
    currentDate,
    selectedDate,
    eventsByDate,
    onDateClick,
    onPrevMonth,
    onNextMonth,
    onMonthClick,
    availabilityRules = [],
    availableSlotsCountByDay = {},
    showAvailability = false,
    hideHeader = false
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
        <Card className="bg-zinc-900 border-zinc-800 w-full sm:max-w-none">
            {!hideHeader && (
                <CardHeader className="px-4 pt-4 pb-2">
                    <div className="flex items-center justify-between relative">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onPrevMonth}
                            className="text-white hover:bg-zinc-800 w-10 h-10 p-0"
                            title="Mes anterior"
                        >
                            <ChevronLeft className="h-5 w-5" />
                        </Button>

                        <button
                            type="button"
                            onClick={onMonthClick}
                            className="text-white font-bold text-lg sm:text-2xl flex items-center gap-2 hover:text-[#FFB366] transition-colors capitalize px-4 py-2"
                            title="Cambiar mes"
                        >
                            {format(currentDate, 'MMMM yyyy', { locale: es })}
                            <ChevronDown className="h-5 w-5 opacity-50" />
                        </button>

                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onNextMonth}
                            className="text-white hover:bg-zinc-800 w-10 h-10 p-0"
                            title="Mes siguiente"
                        >
                            <ChevronRight className="h-5 w-5" />
                        </Button>
                    </div>
                </CardHeader>
            )}

            <CardContent className="px-4 pb-4 pt-6">
                {/* Week Days Headers */}
                <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-3">
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

                        // Availability Logic (Smart Dots)
                        const slotsCount = availableSlotsCountByDay[dateKey] || 0
                        const hasSlots = showAvailability && slotsCount > 0

                        // Filtrar todos los eventos de tipo calendario
                        const calendarEvents = dayEvents.filter(e =>
                            (e.event_type === 'consultation' || e.event_type === 'workshop')
                        )

                        // Eventos de Google Calendar
                        const googleEvents = dayEvents.filter(e =>
                            e.source === 'google_calendar' || e.is_google_event
                        )

                        const hasUrgentEvent = calendarEvents.some(ev =>
                            ev.status === 'cancelled' || ev.rsvp_status === 'declined' || ev.pending_reschedule?.status === 'pending'
                        );

                        return (
                            <button
                                key={day.toISOString()}
                                type="button"
                                onClick={() => onDateClick(day)}
                                className={
                                    `min-h-[64px] sm:min-h-[120px] p-1.5 sm:p-2 rounded-xl text-sm font-medium transition-all flex flex-col items-center justify-start relative overflow-hidden ` +
                                    `${!isCurrentMonth ? 'opacity-20' : ''} ` +
                                    `${isSelected ? 'backdrop-blur-md bg-white/10 border border-[#FF7939]/40 shadow-[0_8px_24px_rgba(0,0,0,0.35)] text-white' : 'border border-transparent'} ` +
                                    `${isTodayDate && !isSelected ? 'bg-zinc-800 text-white' : ''} ` +
                                    `${!isSelected && !isTodayDate ? 'text-gray-400 hover:bg-zinc-800/50 hover:border-white/5' : ''}`
                                }
                            >
                                {hasSlots && !isSelected && !isTodayDate ? (
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ring-1 text-[11px] sm:text-sm font-bold ${slotsCount >= 120 ? 'ring-[#FF7939] text-[#FF7939] bg-[#FF7939]/10' : 'ring-red-500 text-red-500 bg-red-500/10'}`}>
                                        {format(day, 'd')}
                                    </div>
                                ) : (
                                    <span className={`text-[11px] sm:text-sm ${isTodayDate ? 'text-[#FF7939] font-bold' : (hasUrgentEvent ? 'text-red-500 font-bold' : '')}`}>
                                        {format(day, 'd')}
                                    </span>
                                )}

                                {/* Availability Dot Removed - using circle above */}

                                {/* Nombres de eventos en Desktop */}
                                <div className="hidden sm:flex flex-col gap-1 mt-2 w-full overflow-hidden text-left">
                                    {calendarEvents.slice(0, 3).map((ev: any) => {
                                        const isWorkshop = ev.event_type === 'workshop';
                                        const hasPendingReschedule = ev.pending_reschedule?.status === 'pending';

                                        // Rojo: Cancelados, Rechazados o con cambios pendientes
                                        const isRed = ev.status === 'cancelled' || ev.rsvp_status === 'declined' || hasPendingReschedule;

                                        // Naranja: Pendientes de RSVP inicial o Propuestas (ghosts)
                                        const isPending = (ev.rsvp_status === 'pending' || ev.is_ghost) && !isRed;

                                        return (
                                            <div
                                                key={ev.id}
                                                className={`text-[10px] truncate px-1.5 py-0.5 rounded flex items-center gap-1 border
                                                    ${isRed ? 'bg-red-500/10 border-red-500/30 text-red-500 font-bold' :
                                                        (isPending ? 'bg-[#FF7939]/10 border-[#FF7939]/30 text-[#FFB366]' : 'bg-white/5 border-white/10 text-white/70')}
                                                `}
                                            >
                                                {isWorkshop ? <GraduationCap className={`w-3.5 h-3.5 ${isRed ? 'text-red-500' : 'text-[#FF7939]'}`} /> : <Video className="w-2.5 h-2.5" />}
                                                <span className="truncate">{ev.title || (isWorkshop ? 'Taller' : 'Meet')}</span>
                                            </div>
                                        );
                                    })}
                                    {calendarEvents.length > 3 && (
                                        <div className="text-[9px] text-white/40 px-1.5 mt-0.5">
                                            + {calendarEvents.length - 3} más
                                        </div>
                                    )}

                                    {googleEvents.slice(0, 1).map((ev: any) => (
                                        <div key={ev.id} className="text-[10px] truncate px-1.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-300">
                                            {ev.title} (Google)
                                        </div>
                                    ))}
                                </div>

                                {/* Mobile Bubbles (Original UI) */}
                                <div className="mt-auto sm:hidden w-full flex flex-wrap gap-0.5 justify-center items-center">
                                    {(() => {
                                        const bubbles = [];

                                        // 1. Alertas (Rojo)
                                        const redMeets = calendarEvents.filter(m =>
                                            m.status === 'cancelled' ||
                                            m.rsvp_status === 'declined' ||
                                            m.pending_reschedule?.status === 'pending'
                                        )
                                        if (redMeets.length > 0) {
                                            const hasWorkshop = redMeets.some(m => m.event_type === 'workshop');
                                            const hasMeet = redMeets.some(m => m.event_type !== 'workshop');
                                            bubbles.push(
                                                <span key="red" className="inline-flex items-center justify-center px-1 h-5 rounded-full border border-red-500/50 bg-red-500/20 gap-0.5 scale-90">
                                                    {hasWorkshop && <GraduationCap className="w-2.5 h-2.5 text-red-500" />}
                                                    {hasMeet && <Video className="w-2.5 h-2.5 text-red-500" />}
                                                    {redMeets.length > 1 && (
                                                        <span className="text-[8px] font-bold text-red-500">
                                                            {redMeets.length}
                                                        </span>
                                                    )}
                                                </span>
                                            );
                                        }

                                        // 2. Pendientes (Naranja)
                                        const orangeMeets = calendarEvents.filter(m =>
                                            (m.is_ghost || m.rsvp_status === 'pending' || m.status === 'pending') &&
                                            !(m.status === 'cancelled' || m.rsvp_status === 'declined' || m.pending_reschedule?.status === 'pending')
                                        )
                                        if (orangeMeets.length > 0) {
                                            const hasWorkshop = orangeMeets.some(m => m.event_type === 'workshop');
                                            const hasMeet = orangeMeets.some(m => m.event_type !== 'workshop');
                                            bubbles.push(
                                                <span key="orange" className="inline-flex items-center justify-center px-1 h-5 rounded-full border border-[#FF7939]/60 bg-[#FF7939]/20 gap-0.5 scale-90">
                                                    {hasWorkshop && <GraduationCap className="w-2.5 h-2.5 text-[#FF7939]" />}
                                                    {hasMeet && <Video className="w-2.5 h-2.5 text-[#FF7939]" />}
                                                    {orangeMeets.length > 1 && (
                                                        <span className="text-[8px] font-bold text-[#FF7939]">
                                                            {orangeMeets.length}
                                                        </span>
                                                    )}
                                                </span>
                                            );
                                        }

                                        // 3. Confirmados (Gris/Blanco)
                                        const normalMeets = calendarEvents.filter(m =>
                                            (m.status === 'scheduled' || m.status === 'confirmed' || m.status === 'rescheduled') &&
                                            m.status !== 'cancelled' && m.rsvp_status !== 'pending' && m.rsvp_status !== 'declined' &&
                                            m.pending_reschedule?.status !== 'pending' && !m.is_ghost
                                        )
                                        if (normalMeets.length > 0) {
                                            const hasWorkshop = normalMeets.some(m => m.event_type === 'workshop');
                                            const hasMeet = normalMeets.some(m => m.event_type !== 'workshop');
                                            bubbles.push(
                                                <span key="normal" className="inline-flex items-center justify-center px-1 h-5 rounded-full border border-white/20 bg-white/10 gap-0.5 scale-90">
                                                    {hasWorkshop && <GraduationCap className="w-2.5 h-2.5 text-[#FF7939]" />}
                                                    {hasMeet && <Video className="w-2.5 h-2.5 text-white" />}
                                                    {normalMeets.length > 1 && (
                                                        <span className="text-[8px] font-bold text-white">
                                                            {normalMeets.length}
                                                        </span>
                                                    )}
                                                </span>
                                            );
                                        }

                                        return bubbles;
                                    })()}
                                </div>

                                {/* Mobile Google indicator */}
                                {googleEvents.length > 0 && (
                                    <div className="mt-1 sm:hidden flex items-center justify-center scale-90">
                                        <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-full border text-[9px] font-bold backdrop-blur-md bg-blue-500/10 border-blue-500/30 text-blue-400">
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
