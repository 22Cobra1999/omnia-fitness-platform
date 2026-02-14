
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
    const dateLabel = format(selectedDate, "EEEE dd 'de' MMMM yy", { locale: es })

    return (
        <div className="mt-4" ref={dayDetailRef}>
            <div className="mb-3">
                <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-white/95 text-transform-capitalize">
                        {dateLabel.charAt(0).toUpperCase() + dateLabel.slice(1)}
                    </h3>
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

                            console.log(`[CalendarDayDetail] Item: ${m.title} (${m.id})`, {
                                status,
                                rsvp,
                                pending_reschedule: (m as any).pending_reschedule
                            })

                            if (status === 'cancelled') {
                                console.log(`[CalendarDayDetail] -> CANCELADA`)
                                statusBadge = (
                                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-red-500/20 bg-red-500/10 text-red-400 text-[10px] font-bold uppercase">
                                        CANCELADA
                                    </div>
                                )
                                statusColor = 'text-red-500/50'
                            } else if ((m as any).pending_reschedule) {
                                console.log(`[CalendarDayDetail] -> CAMBIO SOLICITADO`)
                                statusBadge = (
                                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-red-500/20 bg-red-500/10 text-red-400 text-[10px] font-bold uppercase shadow-[0_0_10px_rgba(239,68,68,0.1)]">
                                        CAMBIO SOLICITADO
                                    </div>
                                )
                            } else if (rsvp === 'declined' || rsvp === 'cancelled') {
                                console.log(`[CalendarDayDetail] -> RECHAZADA`)
                                statusBadge = (
                                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-red-500/20 bg-red-500/10 text-red-400 text-[10px] font-bold uppercase">
                                        RECHAZADA
                                    </div>
                                )
                            } else if (rsvp === 'pending') {
                                console.log(`[CalendarDayDetail] -> PENDIENTE`)
                                statusBadge = (
                                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-yellow-500/20 bg-yellow-500/10 text-yellow-500 text-[10px] font-bold uppercase">
                                        PENDIENTE
                                    </div>
                                )
                            } else if (status === 'rescheduled') {
                                console.log(`[CalendarDayDetail] -> REPROGRAMADA`)
                                statusBadge = (
                                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-blue-500/20 bg-blue-500/10 text-blue-400 text-[10px] font-bold uppercase">
                                        <RotateCcw className="h-3 w-3" />
                                        REPROGRAMADA
                                    </div>
                                )
                            } else if (rsvp === 'confirmed' || rsvp === 'accepted') {
                                console.log(`[CalendarDayDetail] -> CONFIRMADA`)
                                statusBadge = (
                                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-[#FF7939]/30 bg-[#FF7939]/10 text-[#FFB366] text-[10px] font-bold uppercase shadow-[0_0_15px_rgba(255,121,57,0.15)]">
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
                                // Try to find the participant name that isn't the coach?
                                // Or simply listing the other person.
                                // If I am client, I see coach name? 
                                // `m.coach_id` is an ID. We don't have coach name here easily unless we fetch it or it is in participants.
                                // Note: `useCalendarData` fetches participants. The coach IS a participant usually?
                                // If coach is not in participants list (because they are owner/organizer?), we might miss them.
                                // BUT `calendar_event_participants` usually includes everyone.

                                const pnames = (m.participants || []).map((p: any) => p.full_name)
                                // If 1:1, we expect 2 names.
                                // We want to show the one that is NOT "Me".
                                // But "Me" is not passed.
                                // Heuristic: Show the one that is NOT "Coach" if possible, or just show the *other* one.
                                // If I am client, I want "Con [Coach]".
                                // If I am coach, I want "Con [Client]".

                                // Let's just join them? No, too long.
                                // "Con Franco Pomati"

                                // If we don't know who "Me" is, we can't perfectly allow "Con [Other]".
                                // BUT events usually have `coach_id`.
                                // If m.coach_id is present, we can try to find the participant that matches it?
                                // Wait, simple approach:
                                // "10:00 - 11:00 - Juan Perez"
                                // Just list the *client* name?
                                // For the client view, they want to see "Con [Coach]".
                                // For coach view, "Con [Client]".

                                // Let's try to display the non-host participant if available.
                                const guests = (m.participants || []).filter((p: any) => p.user_id !== m.coach_id)
                                if (guests.length > 0) {
                                    displayParticipant = ` - ${guests[0].full_name}`
                                } else {
                                    // Maybe I am the guest? Show coach?
                                    // If no guests found (maybe I am the guest and I filtered myself out if I mistakenly thought I was coach?),
                                    // or simply only coach is in param?
                                    // Let's fallback to showing the *first* participant if any.
                                    if (m.participants?.length > 0) {
                                        // displayParticipant = ` - ${m.participants[0].full_name}`
                                    }
                                }

                                // User request: "en la meet pone al lado del rango de horario - y con quien es la meet"
                                // "nivel del nombre de la meet poner 1:1 ... y simbolo de personas si es grupal"
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
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${isCancelled ? 'bg-red-500/10 text-red-400 border border-red-500/30' : (rsvp === 'pending' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' : 'bg-[#FF7939]/10 text-[#FF7939] border border-[#FF7939]/20')}`}>
                                            {m.event_type === 'workshop' ? <GraduationCap className="h-5 w-5" /> : <Video className="h-5 w-5" />}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2">
                                                <div className="text-sm font-bold text-white truncate leading-snug">
                                                    {m.title ? String(m.title) : (m.event_type === 'workshop' ? 'Taller' : 'Meet')}
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
                                            {!canJoin && statusBadge}
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
