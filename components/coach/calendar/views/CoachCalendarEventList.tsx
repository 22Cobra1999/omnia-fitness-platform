import React from 'react'
import { Video, Calendar as CalendarIcon, GraduationCap } from "lucide-react"
import { format, isToday } from 'date-fns'
import { es } from 'date-fns/locale'
import { CalendarEvent } from '../../coach-calendar-screen'
import { cn } from '@/lib/utils/utils'

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
            <div className="flex items-center gap-2 mb-2">
                <h3 className="text-xs font-[1000] text-white uppercase italic tracking-[0.05em]">
                    {showAvailability ? 'Tus Actividades' : `${dateLabel}`}
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
                                    className={cn(
                                        "w-full rounded-xl border p-2.5 flex items-center justify-between gap-3 transition-all duration-200 select-none",
                                        isUrgent
                                            ? 'border-red-500/20 bg-red-500/5 opacity-80 backdrop-blur-md'
                                            : (m.is_ghost
                                                ? 'border-[#FF7939]/20 bg-[#FF7939]/5 border-dashed hover:opacity-100 hover:border-[#FF7939]/40 active:scale-[0.98] cursor-pointer'
                                                : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.04] backdrop-blur-md hover:border-white/10 active:scale-[0.98] cursor-pointer')
                                    )}
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => setSelectedMeetEvent(m)}
                                >
                                    <div className="w-full flex flex-col gap-0.5 min-w-0">
                                        {/* Row 1: Header (Icon + Title) */}
                                        <div className="flex items-start gap-2.5 min-w-0">
                                            <div className={cn(
                                                "w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5",
                                                isUrgent ? 'bg-red-500/10 text-red-400 border border-red-500/30' :
                                                    (m.event_type === 'workshop' ? 'bg-rose-500/5 text-rose-300 border border-rose-500/20' :
                                                        (m.is_ghost ? 'bg-[#FF7939]/10 text-[#FF7939] border border-[#FF7939]/30' :
                                                            (isPending ? 'bg-[#FF7939]/10 text-[#FF7939] border border-[#FF7939]/20' :
                                                                'bg-white/5 text-white/50 border border-white/5')))
                                            )}>
                                                {m.event_type === 'workshop' ? (
                                                    <GraduationCap className="h-4 w-4" />
                                                ) : m.source === 'google_calendar' ? (
                                                    <CalendarIcon className="h-4 w-4" />
                                                ) : (
                                                    <Video className="h-4 w-4" />
                                                )}
                                            </div>
                                            
                                            <div className="flex-1 min-w-0 pt-0.5">
                                                <div className="text-[11px] font-[1000] text-white/95 uppercase italic tracking-tight leading-[1.1]">
                                                    {m.title ? String(m.title).replace(/^Taller:\s*/i, '') : (m.event_type === 'workshop' ? 'Taller' : 'Meet')}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Row 2: Metadata & Actions */}
                                        <div className="flex items-center justify-between gap-4 pl-9">
                                            <div className="flex flex-col gap-0.5 min-w-0">
                                                <div className="text-[8.5px] text-white/30 font-bold uppercase tracking-widest leading-none">
                                                    {label}
                                                </div>
                                                {m.client_name && (
                                                    <div className="text-[8px] text-white/20 font-medium uppercase truncate max-w-[140px]">
                                                        {m.client_name}
                                                    </div>
                                                )}
                                                {m.event_type === 'workshop' && (
                                                    <span className="inline-block w-fit text-[7px] font-black uppercase text-rose-300/60 px-1 py-0.5 rounded bg-rose-500/5 border border-rose-500/20 mt-1">
                                                        TALLER
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                {(() => {
                                                    if (hasRequest) return <span className="text-[8px] font-bold uppercase text-red-400 px-1.5 py-0.5 rounded bg-red-500/10 border border-red-500/20">Cambio</span>;
                                                    if (m.is_ghost) return <span className="text-[8px] font-bold uppercase text-[#FFB366] px-1.5 py-0.5 rounded bg-[#FFB366]/10 border border-[#FFB366]/20">Propuesta</span>;
                                                    return null;
                                                })()}

                                                <button
                                                    type="button"
                                                    disabled={isCancelled}
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        handleMeetAction(m)
                                                    }}
                                                    className={cn(
                                                        "h-6 px-3 rounded-full text-[8.5px] font-black uppercase tracking-widest transition-all shadow-lg",
                                                        isCancelled
                                                            ? 'bg-white/5 text-white/20 cursor-not-allowed'
                                                            : 'text-black bg-[#FF7939] hover:bg-[#FFB366] shadow-[#FF7939]/20'
                                                    )}
                                                >
                                                    {(() => {
                                                        if (m.status === 'cancelled') return 'Cancelada'
                                                        if (m.rsvp_status === 'declined' || m.rsvp_status === 'cancelled') return 'Rechazada'
                                                        if (new Date(m.end_time || m.start_time) < new Date()) return 'Finalizada'
                                                        if (isToday(new Date(m.start_time))) return 'Unirse'
                                                        if (isPending) return 'Aceptar'
                                                        return 'Ver'
                                                    })()}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
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
                                    className={cn(
                                        "w-full rounded-xl border p-2.5 transition-all duration-200",
                                        isGoogleEvent 
                                            ? 'border-blue-500/10 bg-blue-500/5 backdrop-blur-md' 
                                            : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.04] backdrop-blur-md hover:border-white/10 cursor-pointer active:scale-[0.98]'
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 border",
                                            isGoogleEvent ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-white/5 text-white/30 border-white/5'
                                        )}>
                                            <CalendarIcon size={14} />
                                        </div>
                                        <div className="min-w-0 flex-1 flex flex-col gap-0.5">
                                            <div className="text-[11px] font-black text-white/90 truncate leading-tight uppercase italic">{event.title || 'Evento'}</div>
                                            <div className="flex items-center gap-2">
                                                <div className="text-[8.5px] text-white/30 font-bold uppercase tracking-widest">{label}</div>
                                                {isGoogleEvent && (
                                                    <span className="text-[7px] font-black uppercase text-blue-400/60 px-1.5 py-0.5 rounded bg-blue-500/5 border border-blue-500/20">GOOGLE</span>
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
