
import React from 'react'
import { format, isToday } from "date-fns"
import { es } from "date-fns/locale"
import { Flame, Utensils, Video, GraduationCap, Zap, Users, RotateCcw, Clock } from "lucide-react"
import { formatMinutes } from "../utils"

interface CalendarDayDetailProps {
    selectedDate: Date | null
    dayMinutesByDate: Record<string, any>
    meetEventsByDate: Record<string, any[]>
    selectedDayActivityItems: any[]
    activitiesByDate: Record<string, any[]>
    setSelectedMeetEvent: (evt: any) => void
    onActivityClick: (activityId: string, date?: Date) => void
    onSelectDate: (date: Date) => void
    dayDetailRef: React.RefObject<HTMLDivElement | null>
    meetViewMode: string
    authUserId?: string | null
    coachProfiles?: any[]
}

export function CalendarDayDetail({
    selectedDate,
    dayMinutesByDate,
    meetEventsByDate,
    selectedDayActivityItems,
    activitiesByDate,
    setSelectedMeetEvent,
    onActivityClick,
    onSelectDate,
    dayDetailRef,
    meetViewMode,
    authUserId,
    coachProfiles
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
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-[#E6BE8A]/40 bg-[#E6BE8A]/10 text-[#E6BE8A] text-[10px] font-bold">
                                {mins?.hasWorkshop ? <GraduationCap className="h-3 w-3" /> : <Video className="h-3 w-3" />}
                                {formatMinutes(meetMinutes)}
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="mb-4">
                <div className="text-[11px] tracking-widest text-white/45 mb-2 uppercase">Programación</div>
                <div className="space-y-3">
                    {(() => {
                        const itemsToRender: any[] = [];
                        const consumedActivityIds = new Set<string>();
                        const consumedMeetIds = new Set<string>();

                        // 1. Try to merge activities with corresponding meets
                        selectedDayActivityItems.forEach((it: any) => {
                            const isWorkshop = it.tipo === 'taller' || it.activityTypeLabel === 'TALLER';
                            const relatedMeet = meets.find(m => String(m.activity_id) === String(it.activityId) || (isWorkshop && m.event_type === 'workshop' && (m.activity_title === it.activityTitle || m.workshop_name === it.activityTitle)));

                            if (relatedMeet) {
                                itemsToRender.push({ type: 'merged', activity: it, meet: relatedMeet });
                                consumedActivityIds.add(String(it.activityId));
                                consumedMeetIds.add(String(relatedMeet.id));
                            } else {
                                itemsToRender.push({ type: 'activity', activity: it });
                            }
                        });

                        // 2. Add remaining meets that weren't merged
                        meets.forEach((m: any) => {
                            if (!consumedMeetIds.has(String(m.id))) {
                                itemsToRender.push({ type: 'meet', meet: m });
                            }
                        });

                        return itemsToRender.map((item, idx) => {
                            if (item.type === 'merged' || item.type === 'meet') {
                                const m = item.meet;
                                const it = item.activity;
                                const start = new Date(m.start_time);
                                const end = m.end_time ? new Date(m.end_time) : null;
                                const timeLabel = `${format(start, 'HH:mm')}${end && !Number.isNaN(end.getTime()) ? ` – ${format(end, 'HH:mm')}` : ''}`;
                                const rsvp = String((m as any)?.rsvp_status || 'pending');
                                const status = m.status || 'scheduled';
                                const isCancelled = status === 'cancelled' || rsvp === 'declined';
                                
                                let statusLabel = null;
                                if (status === 'cancelled') statusLabel = <span className="text-[10px] font-bold uppercase text-red-500">Cancelada</span>;
                                else if (rsvp === 'declined') statusLabel = <span className="text-[10px] font-bold uppercase text-red-500">Rechazada</span>;
                                else if (rsvp === 'pending') statusLabel = <span className="text-[10px] font-bold uppercase text-red-500">Pendiente</span>;
                                else if (rsvp === 'confirmed' || rsvp === 'accepted') {
                                    statusLabel = <span className="text-[10px] font-bold uppercase text-[#FF7939] flex items-center gap-1"><Video className="h-3 w-3" />CONFIRMADA</span>;
                                }

                                const isWorkshop = m.event_type === 'workshop' || (it && (it.tipo === 'taller' || it.activityTypeLabel === 'TALLER'));
                                const canJoin = (rsvp === 'confirmed' || rsvp === 'accepted') && status === 'scheduled' && m.meet_link;

                                return (
                                    <button
                                        key={m.id}
                                        onClick={() => setSelectedMeetEvent(m)}
                                        className={`w-full text-left p-3 rounded-xl border relative backdrop-blur-md transition-all ${isCancelled ? 'border-red-500/20 bg-red-500/5' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}
                                    >
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${isWorkshop ? 'bg-[#E6BE8A]/10 text-[#E6BE8A] border border-[#E6BE8A]/30' : (isCancelled || rsvp === 'pending' ? 'bg-red-500/10 text-red-400 border border-red-500/30' : 'bg-[#FF7939]/10 text-[#FF7939] border border-[#FF7939]/20')}`}>
                                                    {isWorkshop ? <GraduationCap className="h-5 w-5" /> : <Video className="h-5 w-5" />}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex flex-col">
                                                        <div className="text-sm font-bold text-white truncate">
                                                            {isWorkshop 
                                                                ? (m.title ? String(m.title).replace(/^(Taller|Workshop):\s*/i, '') : 'Tema')
                                                                : (m.title ? String(m.title).replace(/^(Meet|Consulta):\s*/i, '') : 'Meet')
                                                            }
                                                        </div>
                                                        {isWorkshop && (
                                                            <div className="text-[10px] text-white/60 truncate mt-0.5 font-medium italic">
                                                                - {it?.activityTitle || m.activity_title || m.workshop_name || 'Workshop'}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="text-xs text-white/50 truncate flex items-center gap-2 mt-0.5 font-medium">
                                                        <span>{timeLabel}</span>
                                                        {statusLabel}
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center gap-2">
                                                {it && (
                                                    <div className="flex-shrink-0 min-w-[20px] h-5 px-1.5 rounded-full flex items-center justify-center bg-[#FF7939] text-black shadow-lg">
                                                        <div className="flex items-center gap-0.5">
                                                            <Flame className="w-2.5 h-2.5" fill="black" />
                                                            <span className="text-[10px] font-bold leading-none">{it.totalCount - it.pendingCount}/{it.totalCount}</span>
                                                        </div>
                                                    </div>
                                                )}
                                                {canJoin && (
                                                    <button
                                                        type="button"
                                                        onClick={(e) => { e.stopPropagation(); if (m.meet_link) window.open(m.meet_link, '_blank', 'noopener,noreferrer'); }}
                                                        className="h-7 px-3 rounded-full text-[9px] font-bold uppercase border border-[#FF7939]/60 text-[#FFB366] bg-[#FF7939]/5 shadow-lg"
                                                    >
                                                        Unirse
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </button>
                                );
                            } else {
                                const it = item.activity;
                                const isNutri = String(it.area || '').toLowerCase().includes('nutri') || String(it.activityTypeLabel || '').toLowerCase().includes('nutri');
                                const isWorkshop = it.tipo === 'taller' || it.activityTypeLabel === 'TALLER';

                                return (
                                    <button
                                        key={it.activityId}
                                        onClick={() => onActivityClick(it.activityId, selectedDate || undefined)}
                                        className={`w-full text-left p-3 rounded-xl border relative ${it.borderClass} ${it.bgClass} hover:bg-white/5 transition-colors`}
                                    >
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-3 min-w-0">
                                                {isWorkshop ? (
                                                    <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-[#E6BE8A]/10 text-[#E6BE8A] border border-[#E6BE8A]/30">
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
                                                    <div className="text-xs text-white/50 truncate flex items-center gap-1.5 mt-0.5 font-medium">
                                                        <Clock className="h-3 w-3" />
                                                        {isNutri
                                                            ? `${formatMinutes(it.totalMinutes)} total`
                                                            : (formatMinutes(it.pendingMinutes + (it.totalCount - it.pendingCount) * 10) || '0m') + ' total' 
                                                        }
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex-shrink-0 min-w-[20px] h-5 px-1.5 rounded-full flex items-center justify-center transition-all bg-[#FF7939] text-black shadow-lg">
                                                <div className="flex items-center gap-0.5">
                                                    <Flame className="w-2.5 h-2.5" fill="black" />
                                                    <span className="text-[10px] font-bold leading-none">{it.totalCount - it.pendingCount}/{it.totalCount}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                );
                            }
                        });
                    })()}
                </div>
            </div>

            {(() => {
                const hasMeets = meets.length > 0
                const hasBreakdown = selectedDayActivityItems.length > 0
                const hasLegacy = (activitiesByDate[key]?.length ?? 0) > 0
                const isDayEmpty = !hasMeets && !hasBreakdown && !hasLegacy;

                if (isDayEmpty) return <div className="mt-8 text-sm text-gray-400 text-center">Sin actividades para este día</div>
                return null
            })()}
        </div>
    )
}
