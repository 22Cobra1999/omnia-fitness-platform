
import React from 'react'
import { format, isToday } from "date-fns"
import { es } from "date-fns/locale"
import { Flame, Utensils, Video, GraduationCap, Zap, Users, RotateCcw } from "lucide-react"
import { formatMinutes } from "../utils"

interface CalendarDayDetailProps {
    selectedDate: Date | null
    dayMinutesByDate: Record<string, any>
    meetEventsByDate: Record<string, any[]>
    selectedDayActivityItems: any[]
    activitiesByDate: Record<string, any[]>
    setSelectedMeetEvent: (evt: any) => void
    onActivityClick: (activityId: string, date?: Date) => void
    dayDetailRef: React.RefObject<HTMLDivElement | null>
    meetViewMode: string
    authUserId?: string | null
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
    meetViewMode,
    authUserId
}: CalendarDayDetailProps) {

    if (!selectedDate || meetViewMode !== 'month') return null

    const key = format(selectedDate, 'yyyy-MM-dd')
    const mins = dayMinutesByDate[key]
    const meets = meetEventsByDate[key] || []
    const pendingMinutes = (mins?.fitnessMinutesPending ?? 0)
    const pendingExercises = mins?.pendingExercises ?? 0
    const pendingPlates = mins?.pendingPlates ?? 0
    const meetMinutes = mins?.meetsMinutes ?? 0
    const dateLabel = format(selectedDate, "EEEE dd 'de' MMMM yy", { locale: es })

    return (
        <div className="mt-4" ref={dayDetailRef}>
            <div className="mb-3">
                <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-white/95 text-transform-capitalize">
                        {dateLabel.charAt(0).toUpperCase() + dateLabel.slice(1)}
                    </h3>
                </div>
                {(pendingMinutes > 0 || meetMinutes > 0 || pendingExercises > 0 || pendingPlates > 0) && (
                    <div className="mt-2 flex flex-wrap gap-2">
                        {(mins?.fitnessMinutesPending > 0 || (mins?.pendingExercises ?? 0) > 0) && (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-[#FF7939]/40 bg-[#FF7939]/10 text-[#FFB366] text-[10px] font-bold">
                                <Zap className="h-3 w-3" />
                                {mins?.fitnessMinutesPending > 0
                                    ? `Fitness ${formatMinutes(mins.fitnessMinutesPending)}`
                                    : `${mins?.pendingExercises} ejercicios`}
                            </div>
                        )}
                        {pendingPlates > 0 && (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-[#FFB873]/40 bg-[#FFB873]/10 text-[#FFB366] text-[10px] font-bold">
                                <Utensils className="h-3 w-3" />
                                {pendingPlates}
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
                            let statusLabel = null
                            let statusColor = 'text-white/50'

                            const isMeCancelled = m.cancelled_by_user_id === authUserId
                            const coachParticipant = (m.participants || []).find((p: any) => p.user_id === m.coach_id)
                            const coachName = coachParticipant ? (coachParticipant.name || coachParticipant.full_name) : 'el coach'

                            if (status === 'cancelled') {
                                statusColor = 'text-red-500'
                                statusLabel = (
                                    <span className="text-[10px] font-bold uppercase text-red-500">
                                        {isMeCancelled ? 'Cancelaste meet' : 'Canceló meet'}
                                    </span>
                                )
                            } else if (rsvp === 'declined' || rsvp === 'cancelled') {
                                statusColor = 'text-red-500'
                                statusLabel = (
                                    <span className="text-[10px] font-bold uppercase text-red-500">
                                        Rechazada
                                    </span>
                                )
                            } else if (rsvp === 'pending' || (rsvp === 'confirmed' && status === 'scheduled' && (m.participants || []).some((p: any) => p.user_id === m.coach_id && (p.rsvp_status === 'pending' || p.rsvp_status === 'invited')))) {
                                statusColor = 'text-[#FFB366]'
                                const isCoachPending = (m.participants || []).some((p: any) => p.user_id === m.coach_id && (p.rsvp_status === 'pending' || p.rsvp_status === 'invited'))

                                statusLabel = (
                                    <span className="text-[10px] font-bold uppercase text-[#FFB366]">
                                        {rsvp === 'pending'
                                            ? (m.invited_by_user_id === authUserId ? 'Pendiente de que confirmes tú' : 'Solicitó meet')
                                            : 'Pendiente de que confirme'}
                                    </span>
                                )
                            }
                            else if (status === 'rescheduled') {
                                statusLabel = (
                                    <span className="text-[10px] font-bold uppercase text-blue-400 flex items-center gap-1">
                                        <RotateCcw className="h-3 w-3" />
                                        REPROGRAMADA
                                    </span>
                                )
                            } else if (rsvp === 'confirmed' || rsvp === 'accepted') {
                                statusLabel = (
                                    <span className="text-[10px] font-bold uppercase text-[#FF7939] flex items-center gap-1">
                                        <Video className="h-3 w-3" />
                                        CONFIRMADA
                                    </span>
                                )
                            }

                            if (m.pending_reschedule) {
                                statusLabel = (
                                    <span className="text-[10px] font-bold uppercase text-red-500 animate-pulse">
                                        CAMBIO SOLICITADO
                                    </span>
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

                            // Participant Logic
                            const isGroup = m.event_type === 'workshop' || (m.participants?.length || 0) > 2
                            const otherParty = (m.participants || []).find((p: any) => p.user_id !== (m as any).coach_id) // Simplistic: non-coach participant
                            // Actually, simpler: just exclude the current viewer if possible, but we don't have authUserId easily here without prop drilling.
                            // However, we can check coach_id. If current view is Coach, show Client. If Client, show Coach.
                            // We don't know "who am I" easily here?
                            // Wait, 'activitiesByDate' context implies we are viewing *my* schedule.
                            // If I created the event, or am a participant.
                            // BUT, we can just show "Con [Name]" if 1:1.
                            // If 1:1, usually 2 participants. One is coach, one is client.
                            // If I am observing, I see both names?
                            // Let's try to show the *Other* name.
                            // If I am the coach, I want to see the client name.
                            // The `m` object has `coach_id`.
                            // If `m.coach_id` exists.
                            // Let's blindly pick the participant that is NOT the coach_id?
                            // Failure case: I am the coach.

                            let displayParticipant = ''
                            if (!isGroup) {
                                const isMeCoach = String(m.coach_id) === String(authUserId)
                                if (isMeCoach) {
                                    const other = (m.participants || []).find((p: any) => String(p.user_id) !== String(authUserId))
                                    if (other) displayParticipant = ` – ${other.full_name || other.name || 'Cliente'}`
                                } else {
                                    displayParticipant = ` – ${m.coach_name || 'Coach'}`
                                }
                            }

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
                                    <div className="flex items-center gap-3 w-full">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${m.event_type === 'workshop' ? 'bg-[#FADADD]/10 text-[#FADADD] border border-[#FADADD]/30' : (isCancelled ? 'bg-red-500/10 text-red-400 border border-red-500/30' : (rsvp === 'pending' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' : 'bg-[#FF7939]/10 text-[#FF7939] border border-[#FF7939]/20'))}`}>
                                            {m.event_type === 'workshop' ? <GraduationCap className="h-5 w-5" /> : <Video className="h-5 w-5" />}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2">
                                                <div className="text-sm font-bold text-white truncate leading-snug">
                                                    {m.title ? String(m.title) : (m.event_type === 'workshop' ? '' : 'Meet')}
                                                </div>
                                                {isGroup ? (
                                                    <Users className="w-3 h-3 text-white/50" />
                                                ) : (
                                                    <span className="text-[10px] font-bold text-white/50 bg-white/10 px-1.5 rounded">1:1</span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <div className={`text-[11px] font-medium ${statusColor}`}>
                                                    {label}{displayParticipant}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Status Badge pushed to the right */}
                                        <div className="ml-auto flex-shrink-0">
                                            {!canJoin && statusLabel}
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
                                    </div>
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
                                    onClick={() => onActivityClick(it.activityId, selectedDate || undefined)}
                                    className={`w-full text-left p-3 rounded-xl border relative ${it.borderClass} ${it.bgClass} hover:bg-white/5 transition-colors`}
                                >
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-3 min-w-0">
                                            {it.tipo === 'taller' || it.activityTypeLabel === 'TALLER' ? (
                                                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-[#FADADD]/10 text-[#FADADD] border border-[#FADADD]/30">
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
                                                        {isNutri
                                                            ? `${it.pendingCount}`
                                                            : (formatMinutes(it.pendingMinutes) || '0m') + ' restante'
                                                        }
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
