import React from 'react'
import { format, isToday } from 'date-fns'
import { es } from 'date-fns/locale'
import { Clock, Users, Video, Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { QuickMeetScheduler } from './QuickMeetScheduler'

interface DayViewProps {
    selectedDate: Date
    events: any[]
    onEventClick: (event: any) => void
    onPrevDay: () => void
    onNextDay: () => void
    showQuickScheduler?: boolean
    onQuickSchedulerConfirm?: (startTime: string, durationMinutes: number) => void
    onQuickSchedulerCancel?: () => void
}

export function DayView({
    selectedDate,
    events,
    onEventClick,
    onPrevDay,
    onNextDay,
    showQuickScheduler = false,
    onQuickSchedulerConfirm,
    onQuickSchedulerCancel
}: DayViewProps) {

    // Filtrar meets
    const meetEvents = events.filter(e =>
        e.event_type === 'consultation' || e.event_type === 'workshop'
    )

    // Otros eventos
    const otherEvents = events.filter(e =>
        e.event_type !== 'consultation' && e.event_type !== 'workshop'
    )

    return (
        <div className="space-y-4">
            {/* Quick Scheduler - Aparece primero si está activo */}
            {showQuickScheduler && onQuickSchedulerConfirm && onQuickSchedulerCancel && (
                <QuickMeetScheduler
                    selectedDate={selectedDate}
                    onConfirm={onQuickSchedulerConfirm}
                    onCancel={onQuickSchedulerCancel}
                />
            )}

            {/* Header de hoy - Con navegación */}
            <div className="flex items-center justify-between bg-zinc-900 p-4 rounded-lg border border-zinc-800">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onPrevDay}
                    className="text-white hover:bg-zinc-800"
                >
                    <ChevronLeft className="w-5 h-5" />
                </Button>
                <div className="text-center">
                    <h2 className="text-base font-semibold text-white/95">
                        Actividades · {format(selectedDate, "dd/MM/yyyy", { locale: es })}
                    </h2>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onNextDay}
                    className="text-white hover:bg-zinc-800"
                >
                    <ChevronRight className="w-5 h-5" />
                </Button>
            </div>

            {/* Sección de Meets - IDÉNTICA AL CLIENTE */}
            {meetEvents.length > 0 && (
                <div className="mb-4">
                    <div className="text-[11px] tracking-widest text-white/45 mb-2">MEET</div>
                    <div className="space-y-2">
                        {meetEvents.map((m) => {
                            const start = new Date(m.start_time)
                            const end = m.end_time ? new Date(m.end_time) : null
                            const label = `${format(start, 'HH:mm')}${end && !Number.isNaN(end.getTime()) ? ` – ${format(end, 'HH:mm')}` : ''}`
                            const isPending = (m as any).my_rsvp === 'pending'
                            const isCancelled = m.status === 'cancelled' || m.rsvp_status === 'cancelled' || m.rsvp_status === 'declined'

                            const handleEnter = () => {
                                if (!isPending && m.meet_link) {
                                    try {
                                        window.open(String(m.meet_link), '_blank', 'noopener,noreferrer')
                                        return
                                    } catch {
                                        // fallback
                                    }
                                }
                                onEventClick(m)
                            }

                            return (
                                <div
                                    key={m.id}
                                    className={
                                        `w-full rounded-2xl border px-4 py-3 flex items-center justify-between gap-3 transition-all duration-200 select-none ` +
                                        (isCancelled
                                            ? 'border-red-500/20 bg-red-500/5 opacity-80 backdrop-blur-md'
                                            : 'border-white/10 bg-white/5 hover:bg-white/10 backdrop-blur-md hover:border-white/20 active:scale-[0.98] cursor-pointer')
                                    }
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => onEventClick(m)}
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${isCancelled ? 'bg-red-500/10 text-red-500 border border-red-500/20' : (isPending ? 'bg-[#FF7939]/10 text-[#FF7939] border border-[#FF7939]/20' : 'bg-white/5 text-white/70 border border-white/10')}`}>
                                            <Video className="h-5 w-5" />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="text-sm font-bold text-white truncate leading-snug">{m.title ? String(m.title) : 'Meet'}</div>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <div className="text-[11px] text-white/50 font-medium whitespace-nowrap">
                                                    {label} {m.client_name && ` – ${m.client_name}`}
                                                </div>
                                                {m.status === 'cancelled' ? (
                                                    <span className="text-[9px] font-bold uppercase text-red-500 px-1.5 py-0.5 rounded bg-red-500/10 border border-red-500/20">Cancelada</span>
                                                ) : (m.rsvp_status === 'declined' || m.rsvp_status === 'cancelled') ? (
                                                    <span className="text-[9px] font-bold uppercase text-red-500 px-1.5 py-0.5 rounded bg-red-500/10 border border-red-500/20">Rechazada</span>
                                                ) : null}
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        disabled={isCancelled}
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            handleEnter()
                                        }}
                                        className={
                                            `h-8 px-4 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-all ` +
                                            (isCancelled
                                                ? 'border-transparent bg-white/5 text-white/20 cursor-not-allowed'
                                                : 'border-[#FF7939]/60 text-[#FFB366] bg-[#FF7939]/5 hover:bg-[#FF7939] hover:text-black shadow-[0_4px_12px_rgba(255,121,57,0.2)]')
                                        }
                                    >
                                        {(() => {
                                            if (m.status === 'cancelled') return 'Cancelada'
                                            if (m.rsvp_status === 'declined' || m.rsvp_status === 'cancelled') return 'Rechazada'
                                            if (new Date(m.end_time || m.start_time) < new Date()) return 'Finalizada'
                                            if (isToday(new Date(m.start_time))) return 'Unirse'

                                            if (isPending) return 'Pendiente'

                                            if (m.status === 'scheduled' || m.status === 'rescheduled') {
                                                const confirmed = m.confirmed_participants || 0
                                                const total = m.total_guests || 0
                                                if (total > 0 && confirmed < total) {
                                                    return total > 1 ? `Inv. enviada (${confirmed}/${total})` : 'Invitación enviada'
                                                }
                                                return 'Confirmada'
                                            }
                                            return 'Confirmada'
                                        })()}
                                    </button>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* Otros eventos */}
            {otherEvents.length > 0 && (
                <div className="mb-4">
                    <div className="text-[11px] tracking-widest text-white/45 mb-2 uppercase">Otros Eventos</div>
                    <div className="space-y-2">
                        {otherEvents.map((event) => {
                            const isGoogleEvent = event.is_google_event || event.source === 'google_calendar'
                            const start = new Date(event.start_time)
                            const end = event.end_time ? new Date(event.end_time) : null
                            const label = `${format(start, 'HH:mm')}${end && !Number.isNaN(end.getTime()) ? ` – ${format(end, 'HH:mm')}` : ''}`

                            return (
                                <div
                                    key={event.id}
                                    onClick={() => !isGoogleEvent && onEventClick(event)}
                                    className={`
                    w-full rounded-2xl border px-4 py-3 transition-all duration-200
                    ${isGoogleEvent
                                            ? 'border-blue-500/20 bg-blue-500/5 backdrop-blur-md'
                                            : 'border-white/10 bg-white/5 hover:bg-white/10 backdrop-blur-md hover:border-white/20 cursor-pointer active:scale-[0.98]'
                                        }
                  `}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${isGoogleEvent ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-white/5 text-white/70 border border-white/10'}`}>
                                            <Calendar className="h-5 w-5" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="text-sm font-bold text-white truncate leading-snug">{event.title || 'Evento'}</div>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <div className="text-[11px] text-white/50 font-medium">{label}</div>
                                                {isGoogleEvent && (
                                                    <span className="text-[9px] font-bold uppercase text-blue-400 px-1.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/20">
                                                        Google
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* Empty state */}
            {events.length === 0 && (
                <Card className="bg-zinc-900 border-zinc-800">
                    <CardContent className="p-8">
                        <div className="flex flex-col items-center justify-center text-center">
                            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                                <Calendar className="w-8 h-8 text-white/20" />
                            </div>
                            <p className="text-sm text-gray-400">No hay eventos programados para este día</p>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
