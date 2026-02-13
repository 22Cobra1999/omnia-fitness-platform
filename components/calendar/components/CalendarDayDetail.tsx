
import React from 'react'
import { format, isToday } from "date-fns"
import { es } from "date-fns/locale"
import { Flame, Utensils, Video, GraduationCap, Zap } from "lucide-react"
import { formatMinutes } from "../utils"

interface CalendarDayDetailProps {
    selectedDate: Date | null
    dayMinutesByDate: Record<string, any>
    meetEventsByDate: Record<string, any[]>
    selectedDayActivityItems: any[]
    activitiesByDate: Record<string, any[]>
    setSelectedMeetEvent: (evt: any) => void
    onActivityClick: (activityId: string) => void
    dayDetailRef: React.RefObject<HTMLDivElement | null>
    meetViewMode: string
}

export function CalendarDayDetail({
    selectedDate,
    dayMinutesByDate,
    meetEventsByDate,
    selectedDayActivityItems,
    activitiesByDate,
    setSelectedMeetEvent,
    onActivityClick,
    dayDetailRef,
    meetViewMode
}: CalendarDayDetailProps) {

    if (!selectedDate || meetViewMode !== 'month') return null

    const key = format(selectedDate, 'yyyy-MM-dd')
    const mins = dayMinutesByDate[key]
    const meets = meetEventsByDate[key] || []
    const pendingMinutes = (mins?.fitnessMinutesPending ?? 0) + (mins?.nutritionMinutesPending ?? 0)
    const pendingExercises = mins?.pendingExercises ?? 0
    const meetMinutes = mins?.meetsMinutes ?? 0
    const dateLabel = isToday(selectedDate) ? 'Hoy' : format(selectedDate, 'dd/MM/yyyy', { locale: es })

    return (
        <div className="mt-4" ref={dayDetailRef}>
            <div className="mb-3">
                <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-white/95">Actividades · {dateLabel}</h3>
                </div>
                {(pendingMinutes > 0 || meetMinutes > 0 || pendingExercises > 0) && (
                    <div className="mt-2 flex flex-wrap gap-2">
                        {(mins?.fitnessMinutesPending > 0 || (mins?.pendingExercises ?? 0) > 0) && (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-[#FF7939]/40 bg-[#FF7939]/10 text-[#FFB366] text-[10px] font-bold">
                                <Zap className="h-3 w-3" />
                                {mins?.fitnessMinutesPending > 0
                                    ? `Fitness ${formatMinutes(mins.fitnessMinutesPending)}`
                                    : `${mins?.pendingExercises} ejercicios`}
                            </div>
                        )}
                        {mins?.nutritionMinutesPending > 0 && (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-[#FFB873]/40 bg-[#FFB873]/10 text-[#FFB366] text-[10px] font-bold">
                                <Utensils className="h-3 w-3" />
                                Nutrición {formatMinutes(mins.nutritionMinutesPending)}
                            </div>
                        )}
                        {meetMinutes > 0 && (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-[#FF7939]/30 bg-[#FF7939]/10 text-[#FFB366] text-[10px] font-bold">
                                <Video className="h-3 w-3" />
                                {formatMinutes(meetMinutes)}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {meets.length > 0 && (
                <div className="mb-4">
                    <div className="text-[11px] tracking-widest text-white/45 mb-2">MEET</div>
                    <div className="space-y-2">
                        {meets.map((m) => {
                            const start = new Date(m.start_time)
                            const end = m.end_time ? new Date(m.end_time) : null
                            const label = `${format(start, 'HH:mm')}${end && !Number.isNaN(end.getTime()) ? ` – ${format(end, 'HH:mm')}` : ''}`
                            const rsvp = String((m as any)?.rsvp_status || 'pending')
                            const status = m.status || 'scheduled'
                            const isTodayEvent = isToday(start)

                            // Status Logic
                            let statusBadge = null
                            let statusColor = 'text-white/50' // Default time color

                            if (status === 'cancelled') {
                                statusBadge = <span className="text-[9px] font-bold uppercase text-red-500 px-1.5 py-0.5 rounded bg-red-500/10 border border-red-500/20">Cancelada</span>
                                statusColor = 'text-red-500/50'
                            } else if (rsvp === 'declined') {
                                statusBadge = <span className="text-[9px] font-bold uppercase text-red-400 px-1.5 py-0.5 rounded bg-red-500/10 border border-red-500/20">Rechazada</span>
                            } else if (rsvp === 'pending') {
                                statusBadge = <span className="text-[9px] font-bold uppercase text-yellow-500 px-1.5 py-0.5 rounded bg-yellow-500/10 border border-yellow-500/20">Pendiente</span>
                            } else if (rsvp === 'confirmed' || rsvp === 'accepted') {
                                statusBadge = (
                                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-[#FF7939]/30 bg-[#FF7939]/10 text-[#FFB366] text-[10px] font-bold">
                                        <Video className="h-3 w-3" />
                                        CONFIRMADA
                                    </div>
                                )
                            }

                            // Button Logic
                            // Only show 'Unirse' if: Today AND (Confirmed OR Accepted) AND Scheduled
                            const canJoin = isTodayEvent && (rsvp === 'confirmed' || rsvp === 'accepted') && status === 'scheduled' && m.meet_link

                            const handleEnter = () => {
                                if (canJoin && m.meet_link) {
                                    try {
                                        window.open(String(m.meet_link), '_blank', 'noopener,noreferrer')
                                        return
                                    } catch { }
                                }
                            }

                            const handleOpenDetail = () => {
                                setSelectedMeetEvent(m)
                            }

                            const isCancelled = status === 'cancelled' || rsvp === 'declined'

                            return (
                                <div
                                    key={m.id}
                                    className={
                                        `w-full rounded-2xl border px-4 py-3 flex items-center justify-between gap-3 transition-all duration-200 select-none ` +
                                        (isCancelled
                                            ? 'border-red-500/20 bg-red-500/5 opacity-80 backdrop-blur-md'
                                            : 'border-white/10 bg-white/5 hover:bg-white/10 backdrop-blur-md hover:border-white/20 active:scale-[0.98]')
                                    }
                                    role="button"
                                    tabIndex={0}
                                    onClick={handleOpenDetail}
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${isCancelled ? 'bg-red-500/10 text-red-400 border border-red-500/30' : (rsvp === 'pending' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' : 'bg-[#FF7939]/10 text-[#FF7939] border border-[#FF7939]/20')}`}>
                                            {m.event_type === 'workshop' ? <GraduationCap className="h-5 w-5" /> : <Video className="h-5 w-5" />}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="text-sm font-bold text-white truncate leading-snug">{m.title ? String(m.title) : (m.event_type === 'workshop' ? 'Taller' : 'Meet')}</div>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <div className={`text-[11px] font-medium ${statusColor}`}>{label}</div>
                                                {statusBadge}
                                            </div>
                                        </div>
                                    </div>

                                    {canJoin && (
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                handleEnter()
                                            }}
                                            className="h-8 px-4 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-all border-[#FF7939]/60 text-[#FFB366] bg-[#FF7939]/5 hover:bg-[#FF7939] hover:text-black shadow-[0_4px_12px_rgba(255,121,57,0.2)]"
                                        >
                                            Unirse
                                        </button>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {selectedDayActivityItems.length > 0 && (
                <div className="mb-4">
                    <div className="text-[11px] tracking-widest text-white/45 mb-2 uppercase">Programación</div>
                    <div className="space-y-3">
                        {selectedDayActivityItems.map((it: any) => {
                            const isNutri = String(it.area || '').toLowerCase().includes('nutri') || String(it.activityTypeLabel || '').toLowerCase().includes('nutri')

                            return (
                                <button
                                    key={it.activityId}
                                    type="button"
                                    onClick={() => onActivityClick(it.activityId)}
                                    className={`w-full text-left p-3 rounded-xl border relative ${it.borderClass} ${it.bgClass} hover:bg-white/5 transition-colors`}
                                >
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-3 min-w-0">
                                            {it.tipo === 'taller' || it.activityTypeLabel === 'TALLER' ? (
                                                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-blue-500/10 text-blue-400 border border-blue-500/30">
                                                    <GraduationCap className="h-5 w-5" />
                                                </div>
                                            ) : isNutri ? (
                                                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-[#FFB366]/10 text-[#FFB366] border border-[#FFB366]/20">
                                                    <Utensils className="h-5 w-5" />
                                                </div>
                                            ) : (
                                                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-[#FF7939]/10 text-[#FF7939] border border-[#FF7939]/20">
                                                    <Zap className="h-5 w-5" />
                                                </div>
                                            )}
                                            <div className="min-w-0">
                                                <div className="text-sm font-semibold text-white truncate">{it.activityTitle}</div>
                                                <div className="text-xs text-white/65 truncate flex items-center gap-2">
                                                    <span className="uppercase tracking-wider font-bold text-[9px] opacity-80">
                                                        {String(it.area || '').toUpperCase()} · {String(it.tipo || '').toUpperCase()}
                                                    </span>
                                                    <span className="text-[#FFB366] bg-[#FF7939]/10 px-1.5 rounded text-[10px] font-bold">
                                                        {(formatMinutes(it.pendingMinutes) || '0m') + ' restante'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {it.pendingCount > 0 && (
                                            <div
                                                className="flex-shrink-0 min-w-[20px] h-5 px-1.5 rounded-full flex items-center justify-center"
                                                style={{
                                                    background: '#FF7939',
                                                    color: '#000'
                                                }}
                                            >
                                                <div className="flex items-center gap-0.5">
                                                    <Flame className="w-2.5 h-2.5 text-black" fill="black" />
                                                    <span className="text-[10px] font-bold text-black leading-none">
                                                        {it.pendingCount}
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </button>
                            )
                        })}
                    </div>
                </div>
            )}

            {(() => {
                const hasMeets = meets.length > 0
                const hasBreakdown = selectedDayActivityItems.length > 0
                const hasLegacy = (activitiesByDate[key]?.length ?? 0) > 0
                if (hasMeets || hasBreakdown || hasLegacy) return null
                return <div className="text-sm text-gray-400">Sin actividades para este día</div>
            })()}
        </div>
    )
}
