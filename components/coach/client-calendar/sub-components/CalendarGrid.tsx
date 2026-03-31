import React from 'react'
import { Video, Zap, UtensilsCrossed } from 'lucide-react'
import { formatMinutesCompact } from '../utils/date-helpers'

interface CalendarGridProps {
    days: Date[]
    currentDate: Date
    selectedDate: Date | null
    handleDayClick: (date: Date) => void
    summaryRowsByDate: Record<string, any[]>
    monthlyProgress: any[]
    currentCoachId: string | null
    clientId: string
    selectedDayForEdit: Date | null
    targetDayForEdit: Date | null
    dayNames: string[]
    getDayData: (date: Date) => any
    isSelectingNewDate?: boolean
    maxMoveDate?: Date | null
}

export const CalendarGrid: React.FC<CalendarGridProps> = ({
    days, currentDate, selectedDate, handleDayClick,
    summaryRowsByDate, monthlyProgress, currentCoachId, clientId,
    selectedDayForEdit, targetDayForEdit, dayNames, getDayData,
    isSelectingNewDate, maxMoveDate
}) => {
    return (
        <div className="w-full">
            <div className="grid grid-cols-7 gap-1 mb-2">
                {dayNames.map(day => (
                    <div key={day} className="text-center text-xs font-semibold text-gray-400 py-2">{day}</div>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
                {days.map((date, index) => {
                    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
                    const isCurrentMonth = date.getMonth() === currentDate.getMonth()
                    const isToday = date.toDateString() === new Date().toDateString()
                    const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString()
                    const dayInfo = getDayData(date)
                    const hasAnyEx = dayInfo && dayInfo.exerciseCount > 0

                    const summary = summaryRowsByDate[dateStr] || []
                    const owned = summary.filter(e => {
                        // calendar_event_id rows need coach_id match
                        if (e.calendar_event_id) {
                            if (!currentCoachId) return false
                            return String(e.coach_id) === String(currentCoachId) || String(e.coach_id) === String(clientId)
                        }
                        // daily-rows from progreso_diario_actividad have coach_id null — treat as owned
                        if (e.coach_id === null || e.coach_id === undefined) return true
                        // legacy rows: check ownership
                        if (!currentCoachId) return false
                        return String(e.coach_id) === String(currentCoachId)
                    })

                    const hasOwned = owned.length > 0
                    const ownedCompleted = owned.filter(e => {
                        const p = monthlyProgress.find(x => x.fecha === dateStr && String(x.actividad_id) === String(e.activity_id))
                        return p && (Number(p.items_completados) || 0) >= (Number(p.items_objetivo) || 1)
                    }).length
                    const ownedStarted = owned.filter(e => {
                        const p = monthlyProgress.find(x => x.fecha === dateStr && String(x.actividad_id) === String(e.activity_id))
                        return p && (Number(p.items_completados) || 0) > 0
                    }).length

                    const ownedActs = owned.filter(e => !e.calendar_event_id)
                    const ownedMeets = owned.filter(e => !!e.calendar_event_id)
                    const actsMins = ownedActs.reduce((acc, e) => acc + (Number(e.total_mins) || 0), 0)
                    const meetsMins = ownedMeets.reduce((acc, e) => acc + (Number(e.total_mins) || 0), 0)

                    // Calculate total items (plates/exercises) for owned activities
                    const totalItems = ownedActs.reduce((acc, e) => {
                        const p = monthlyProgress.find(x => x.fecha === dateStr && String(x.actividad_id) === String(e.activity_id))
                        return acc + (Number(p?.items_objetivo) || 0)
                    }, 0)

                    const isAllCompleted = hasOwned && ownedCompleted === owned.length
                    const isPast = date < new Date(new Date().setHours(0, 0, 0, 0))
                    const isAbsent = hasOwned && isPast && ownedStarted === 0

                    const isSelectedForEdit = selectedDayForEdit && date.toDateString() === selectedDayForEdit.toDateString()
                    const isTargetForEdit = targetDayForEdit && date.toDateString() === targetDayForEdit.toDateString()
                    const isBlocked = !!(isSelectingNewDate && maxMoveDate && date > maxMoveDate)

                    let bgClass = "bg-transparent"
                    if (isBlocked) {
                        bgClass = "bg-zinc-950/20 border border-zinc-800/10 text-zinc-700 opacity-30 grayscale cursor-not-allowed"
                    } else if (hasOwned || hasAnyEx) {
                        bgClass = "bg-zinc-900/10 border border-zinc-800/20 text-white"
                    }

                    const selectionClass = isSelected ? "ring-2 ring-[#FF7939] shadow-[0_0_20px_rgba(255,121,57,0.4)] z-10 scale-[1.05] bg-[#FF7939]/10" : "hover:bg-white/5"

                    return (
                        <button 
                            key={index} 
                            onClick={() => !isBlocked && handleDayClick(date)} 
                            disabled={isBlocked}
                            className={`relative p-2 text-sm rounded-lg transition-all duration-300 min-h-[60px] flex flex-col items-center justify-start group ${!isCurrentMonth ? 'opacity-20' : ''} ${isSelectedForEdit ? 'bg-[#FF7939]/30 border-2 border-[#FF7939] text-white' : (isTargetForEdit ? 'bg-white text-black border-2 border-white' : `${bgClass} ${selectionClass}`)}`}
                        >
                            {isToday && (
                                <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[#FF7939]" />
                            )}
                            <div className="text-center font-semibold text-sm leading-none pt-1 mb-1">{date.getDate()}</div>
                            
                            <div className="w-full flex flex-wrap items-center justify-center gap-1 mt-auto">
                                {/* Individual Activity Bubbles */}
                                {ownedActs.map((act, actIdx) => {
                                    const p = monthlyProgress.find(x => x.fecha === dateStr && String(x.actividad_id) === String(act.activity_id))
                                    const completed = p && (Number(p.items_completados) || 0) >= (Number(p.items_objetivo) || 1)
                                    const started = p && (Number(p.items_completados) || 0) > 0
                                    
                                    if (isSelected && p) {
                                        console.log(`[CalendarGrid] Day ${date.getDate()} Act ${act.activity_id}: comp=${p.items_completados} obj=${p.items_objetivo} -> completed=${completed}`);
                                    }

                                    const isAbsentDay = isPast && !started
                                    const isPending = !completed && (!isPast || started)
                                    
                                    const activityTitle = (act.activity_title || '').toLowerCase()
                                    const isNutri = act.area === 'nutricion' || activityTitle.includes('nutri') || activityTitle.includes('comida') || activityTitle.includes('plato') || (act.nutri_mins > 0 && act.fitness_mins === 0)
                                    
                                    let bubbleBg = isNutri ? "bg-yellow-500/20" : "bg-[#FF7939]/20"
                                    let iconColor = isNutri ? "text-yellow-500/60" : "text-[#FF7939]/60"
                                    
                                    if (completed) {
                                        bubbleBg = isNutri ? "bg-yellow-400" : "bg-[#FF7939]"
                                        iconColor = "text-white"
                                    } else if (isAbsentDay) {
                                        bubbleBg = "bg-red-500/40"
                                        iconColor = "text-white"
                                    }

                                    return (
                                        <div 
                                            key={`${act.activity_id}-${actIdx}`}
                                            className={`p-1 rounded-full ${bubbleBg} transition-all duration-300 shadow-sm`}
                                            title={act.activity_title || ''}
                                        >
                                            {isNutri ? (
                                                <UtensilsCrossed className={`w-2.5 h-2.5 ${iconColor}`} />
                                            ) : (
                                                <Zap className={`w-2.5 h-2.5 ${iconColor}`} />
                                            )}
                                        </div>
                                    )
                                })}

                                {/* Meets bubble (keep as summary if many) */}
                                {ownedMeets.length > 0 && (
                                    <div className="p-1 rounded-full bg-[#FF7939]/20 border border-[#FF7939]/30">
                                        <Video className="w-2.5 h-2.5 text-[#FF7939]" />
                                    </div>
                                )}

                                {/* Fallback for other coach activities */}
                                {!hasOwned && hasAnyEx && (
                                    <div className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
                                )}
                            </div>
                            
                            {hasAnyEx && <div className="absolute inset-0 rounded-lg border-2 border-transparent group-hover:border-[#FF7939]/30 transition-all duration-200 pointer-events-none"></div>}
                        </button>
                    )
                })}
            </div>
        </div>
    )
}
