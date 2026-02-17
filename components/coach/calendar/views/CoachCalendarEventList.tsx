import React from 'react'
import { Video, Calendar as CalendarIcon, GraduationCap } from "lucide-react"
import { format, isToday } from 'date-fns'
import { es } from 'date-fns/locale'
import { CalendarEvent } from '../../coach-calendar-screen'

interface CoachCalendarEventListProps {
    dateLabel: string
    showAvailability: boolean
    meetEvents: CalendarEvent[]
    otherEvents: CalendarEvent[]
    clientSelectedDateEvents: CalendarEvent[]
    coachId: string | null
    setSelectedMeetEvent: (event: CalendarEvent) => void
}

export function CoachCalendarEventList({
    dateLabel,
    showAvailability,
    meetEvents,
    otherEvents,
    clientSelectedDateEvents,
    coachId,
    setSelectedMeetEvent
}: CoachCalendarEventListProps) {

    const handleMeetAction = (m: CalendarEvent) => {
        const isPending = (m as any).my_rsvp === 'pending'
        if (!isPending && m.meet_link) {
            try {
                window.open(String(m.meet_link), '_blank', 'noopener,noreferrer')
                return
            } catch { /* fallback */ }
        }
        setSelectedMeetEvent(m)
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
                <h3 className="text-base font-semibold text-white/95">
                    {showAvailability ? 'Tus Actividades' : `Actividades · ${dateLabel}`}
                </h3>
            </div>

            {/* Meet Section */}
            {meetEvents.length > 0 && (
                <div className="mb-4">
                    <div className="text-[11px] tracking-widest text-white/45 mb-2">MEET</div>
                    <div className="space-y-2">
                        {meetEvents.map((m) => {
                            const start = new Date(m.start_time)
                            const end = m.end_time ? new Date(m.end_time) : null
                            const label = `${format(start, 'HH:mm')}${end && !Number.isNaN(end.getTime()) ? ` – ${format(end, 'HH:mm')}` : ''}`
                            const isPending = (m as any).my_rsvp === 'pending'
                            const hasRequest = (m as any).pending_reschedule?.status === 'pending'
                            const isCancelled = m.status === 'cancelled' || m.rsvp_status === 'declined' || m.rsvp_status === 'cancelled'
                            const isUrgent = isCancelled || hasRequest

                            return (
                                <div
                                    key={m.id}
                                    className={
                                        `w-full rounded-2xl border px-4 py-3 flex items-center justify-between gap-3 transition-all duration-200 select-none ` +
                                        (isUrgent
                                            ? 'border-red-500/20 bg-red-500/5 opacity-80 backdrop-blur-md'
                                            : (m.is_ghost
                                                ? 'border-[#FF7939]/20 bg-[#FF7939]/5 border-dashed hover:opacity-100 hover:border-[#FF7939]/40 active:scale-[0.98] cursor-pointer'
                                                : 'border-white/10 bg-white/5 hover:bg-white/10 backdrop-blur-md hover:border-white/20 active:scale-[0.98] cursor-pointer'))
                                    }
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => setSelectedMeetEvent(m)}
                                >
                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${isUrgent ? 'bg-red-500/10 text-red-400 border border-red-500/30' : (m.is_ghost ? 'bg-[#FF7939]/10 text-[#FF7939] border border-[#FF7939]/30' : (isPending ? 'bg-[#FF7939]/10 text-[#FF7939] border border-[#FF7939]/20' : 'bg-white/5 text-white/70 border border-white/10'))}`}>
                                            {m.event_type === 'workshop' ? (
                                                <GraduationCap className="h-5 w-5" />
                                            ) : m.source === 'google_calendar' ? (
                                                <CalendarIcon className="h-5 w-5" />
                                            ) : (
                                                <Video className="h-5 w-5" />
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="text-sm font-bold text-white truncate leading-snug">{m.title ? String(m.title) : (m.event_type === 'workshop' ? 'Taller' : 'Meet')}</div>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <div className="text-[11px] text-white/50 font-medium whitespace-nowrap">
                                                    {label} {m.client_name && ` – ${m.client_name}`}
                                                </div>
                                                {m.status === 'cancelled' && (
                                                    <span className="text-[9px] font-bold uppercase text-red-500 px-0 py-0.5 rounded bg-transparent border-none">
                                                        {m.cancelled_by_user_id === coachId ? 'Cancelaste meet' : 'Canceló meet'}
                                                    </span>
                                                )}
                                                {(m.rsvp_status === 'pending' && m.status !== 'cancelled') && (
                                                    <span className="text-[9px] font-bold uppercase text-[#FFB366] px-0 py-0.5 rounded bg-transparent border-none">
                                                        {isPending
                                                            ? (m.invited_by_user_id === coachId ? 'Pendiente de que confirmes tú' : 'Solicitó meet')
                                                            : 'Pendiente de que confirme'}
                                                    </span>
                                                )}
                                                {hasRequest && (
                                                    <span className="text-[9px] font-bold uppercase text-red-400 px-1.5 py-0.5 rounded bg-red-500/10 border border-red-500/20">
                                                        {(m as any).pending_reschedule?.to_start_time
                                                            ? `Propuesta: ${format(new Date((m as any).pending_reschedule.to_start_time), 'd MMM HH:mm', { locale: es })}`
                                                            : 'Cambio Solicitado'}
                                                    </span>
                                                )}
                                                {m.is_ghost && <span className="text-[9px] font-bold uppercase text-[#FFB366] px-1.5 py-0.5 rounded bg-[#FFB366]/10 border border-[#FFB366]/20">Propuesta</span>}
                                                {m.event_type === 'workshop' && (
                                                    <>
                                                        <span className="text-[9px] font-bold uppercase text-[#FF7939] px-1.5 py-0.5 rounded bg-[#FF7939]/10 border border-[#FF7939]/20">Taller</span>
                                                        {(() => {
                                                            const confirmed = m.confirmed_participants || 0
                                                            const max = m.max_participants || 0
                                                            if (max > 0) {
                                                                const isFull = confirmed >= max
                                                                return (
                                                                    <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border ${isFull
                                                                        ? 'text-red-400 bg-red-500/10 border-red-500/20'
                                                                        : 'text-white/60 bg-white/5 border-white/10'
                                                                        }`}>
                                                                        {isFull ? 'Completo' : `${confirmed}/${max} cupos`}
                                                                    </span>
                                                                )
                                                            }
                                                            return null
                                                        })()}
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        disabled={isCancelled}
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            handleMeetAction(m)
                                        }}
                                        className={
                                            `h-8 px-4 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-all flex-shrink-0 ` +
                                            (isCancelled
                                                ? 'border-transparent bg-white/5 text-white/20 cursor-not-allowed'
                                                : 'border-transparent text-[#FFB366] bg-[#FF7939]/10 hover:bg-[#FF7939] hover:text-black shadow-[0_4px_12px_rgba(255,121,57,0.1)]')
                                        }
                                    >
                                        {(() => {
                                            if (m.status === 'cancelled') return 'Cancelada'
                                            if (m.rsvp_status === 'declined' || m.rsvp_status === 'cancelled') return 'Rechazada'
                                            if (hasRequest) return 'Cambio Solicitado'
                                            if (m.is_ghost) return 'Propuesta enviada'
                                            if (new Date(m.end_time || m.start_time) < new Date()) return 'Finalizada'
                                            if (isToday(new Date(m.start_time))) return 'Unirse'
                                            if (isPending) return 'Aceptar'
                                            if (m.status === 'scheduled' || m.status === 'rescheduled') {
                                                const confirmed = m.confirmed_participants || 0
                                                const total = m.total_guests || 0
                                                if (total > 0 && confirmed < total) {
                                                    return 'Pendiente'
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

            {/* Other events */}
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
                                    onClick={() => !isGoogleEvent && setSelectedMeetEvent(event)}
                                    className={`w-full rounded-2xl border px-4 py-3 transition-all duration-200 ${isGoogleEvent ? 'border-blue-500/20 bg-blue-500/5 backdrop-blur-md' : 'border-white/10 bg-white/5 hover:bg-white/10 backdrop-blur-md hover:border-white/20 cursor-pointer active:scale-[0.98]'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${isGoogleEvent ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-white/5 text-white/70 border border-white/10'}`}>
                                            <CalendarIcon className="h-5 w-5" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="text-sm font-bold text-white truncate leading-snug">{event.title || 'Evento'}</div>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <div className="text-[11px] text-white/50 font-medium">{label}</div>
                                                {isGoogleEvent && (
                                                    <span className="text-[9px] font-bold uppercase text-blue-400 px-1.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/20">Google</span>
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

            {/* Client Activities Section */}
            {showAvailability && (
                <div className="mt-8 pt-6 border-t border-dashed border-white/10">
                    <h3 className="text-sm font-bold text-[#FFB366] mb-3 flex items-center gap-2 uppercase tracking-wider">
                        Actividades del Cliente
                        <span className="text-xs font-normal text-[#FFB366]/50 bg-[#FFB366]/10 px-2 py-0.5 rounded-full">
                            {clientSelectedDateEvents.length}
                        </span>
                    </h3>
                    <div className="space-y-2">
                        {clientSelectedDateEvents.length === 0 ? (
                            <p className="text-xs text-zinc-500 italic">No tiene actividades programadas.</p>
                        ) : (
                            clientSelectedDateEvents.map((e: any) => {
                                const start = e.start_time ? new Date(e.start_time) : new Date()
                                const end = e.end_time ? new Date(e.end_time) : null
                                return (
                                    <div key={e.id || Math.random()} className="w-full rounded-2xl border border-[#FFB366]/20 bg-[#FFB366]/5 px-4 py-3 opacity-90">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-[#FFB366]/10 text-[#FFB366] border border-[#FFB366]/20">
                                                <CalendarIcon className="h-5 w-5" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="text-sm font-bold text-white/90 truncate">{e.title || 'Ocupado (Cliente)'}</div>
                                                <div className="text-[11px] text-[#FFB366]/70 font-medium">
                                                    {format(start, 'HH:mm')} - {end ? format(end, 'HH:mm') : ''}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>
                </div>
            )}

            {/* Empty state */}
            {meetEvents.length === 0 && otherEvents.length === 0 && (
                <div className="mt-4 text-center py-8">
                    <p className="text-sm text-gray-400">No hay eventos programados para este día</p>
                </div>
            )}
        </div>
    )
}
