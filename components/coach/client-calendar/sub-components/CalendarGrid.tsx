import React from 'react'
import { Video, Zap, UtensilsCrossed } from 'lucide-react'
import { formatMinutesCompact } from '../utils/date-helpers'
import { cn } from "@/lib/utils/utils"

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
                        const comp = Number(p?.fit_items_c || 0) + Number(p?.nut_items_c || 0)
                        const obj = Number(p?.fit_items_o || 0) + Number(p?.nut_items_o || 0) || (e.tipo === 'documento' ? 1 : 0)
                        return comp >= (obj || 1)
                    }).length
                    const ownedStarted = owned.filter(e => {
                        const p = monthlyProgress.find(x => x.fecha === dateStr && String(x.actividad_id) === String(e.activity_id))
                        const comp = Number(p?.fit_items_c || 0) + Number(p?.nut_items_c || 0)
                        return comp > 0
                    }).length

                    const ownedActs = owned.filter(e => !e.calendar_event_id)
                    const ownedMeets = owned.filter(e => !!e.calendar_event_id)
                    const actsMins = ownedActs.reduce((acc, e) => acc + (Number(e.total_mins) || 0), 0)
                    const meetsMins = ownedMeets.reduce((acc, e) => acc + (Number(e.total_mins) || 0), 0)

                    // Calculate total items (plates/exercises) for owned activities
                    const totalItems = ownedActs.reduce((acc, e) => {
                        const p = monthlyProgress.find(x => x.fecha === dateStr && String(x.actividad_id) === String(e.activity_id))
                        return acc + (Number(p?.fit_items_o || 0) + Number(p?.nut_items_o || 0) || (e.tipo === 'documento' ? 1 : 0))
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
                        bgClass = isCurrentMonth 
                            ? "bg-zinc-900/10 border border-zinc-800/20 text-white"
                            : "bg-zinc-950/5 border border-zinc-900/40 text-zinc-500"
                    }

                    const selectionClass = isSelected ? "ring-2 ring-[#FF7939] shadow-[0_0_20px_rgba(255,121,57,0.4)] z-10 scale-[1.05] bg-[#FF7939]/10" : "hover:bg-white/5"

                    return (
                        <button 
                            key={index} 
                            onClick={() => !isBlocked && handleDayClick(date)} 
                            disabled={isBlocked}
                            className={`relative p-2 text-sm rounded-lg transition-all duration-300 min-h-[60px] flex flex-col items-center justify-start group ${isSelectedForEdit ? 'bg-[#FF7939]/30 border-2 border-[#FF7939] text-white' : (isTargetForEdit ? 'bg-white text-black border-2 border-white' : `${bgClass} ${selectionClass}`)}`}
                        >
                            {isToday && (
                                <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[#FF7939]" />
                            )}
                            <div className={cn(
                                "text-center font-semibold text-sm leading-none pt-1 mb-1 transition-colors",
                                isCurrentMonth ? "text-white" : "text-zinc-600 group-hover:text-zinc-400"
                            )}>
                                {date.getDate()}
                            </div>
                            
                            <div className="w-full flex flex-wrap items-center justify-center gap-1.5 mt-auto pb-1">
                                {(() => {
                                    const grouped: Record<string, { count: number, isNutri: boolean, status: 'completed' | 'absent' | 'pending' | 'future' }> = {}
                                    
                                    ownedActs.forEach(act => {
                                        const p = monthlyProgress.find(x => x.fecha === dateStr && String(x.actividad_id) === String(act.activity_id))
                                        
                                        // Use new columns fit_items_c/o and nut_items_c/o
                                        const comp = Number(p?.fit_items_c || 0) + Number(p?.nut_items_c || 0)
                                        const obj = Number(p?.fit_items_o || 0) + Number(p?.nut_items_o || 0) || (act.tipo === 'documento' ? 1 : 0)
                                        const completed = comp >= (obj || 1)
                                        const started = comp > 0
                                        
                                        const isFuture = !isPast && !isToday
                                        const status = completed ? 'completed' : (isPast && !started ? 'absent' : (isFuture ? 'future' : 'pending'))
                                        
                                        const activityTitle = (act.activity_title || '').toLowerCase()
                                        const isNutri = act.area === 'nutricion' || activityTitle.includes('nutri') || activityTitle.includes('comida') || activityTitle.includes('plato') || (act.nutri_mins > 0 && act.fitness_mins === 0)
                                        
                                        const key = `${isNutri ? 'nut' : 'fit'}-${status}`
                                        if (!grouped[key]) grouped[key] = { count: 0, isNutri, status }
                                        grouped[key].count++
                                    })

                                    return Object.entries(grouped).map(([key, group]) => {
                                        let bubbleBg = "bg-white/5 backdrop-blur-md border border-white/5"
                                        let iconColor = "text-zinc-600/60"
                                        
                                        if (group.status === 'completed') {
                                            bubbleBg = "bg-[#FF7939]/10 border-[#FF7939]/30 backdrop-blur-xl shadow-[0_0_10px_rgba(255,121,57,0.2)]"
                                            iconColor = "text-[#FF7939]"
                                        } else if (group.status === 'absent') {
                                            bubbleBg = "bg-red-500/10 border-transparent backdrop-blur-xl shadow-[0_0_10px_rgba(239,68,68,0.2)]"
                                            iconColor = "text-red-500"
                                        } else if (group.status === 'pending') {
                                            bubbleBg = "bg-[#FACC15]/10 border-transparent backdrop-blur-xl shadow-[0_0_10px_rgba(250,204,21,0.2)]"
                                            iconColor = "text-[#FACC15]"
                                        } else if (group.status === 'future') {
                                            bubbleBg = "bg-white/5 border-transparent backdrop-blur-sm shadow-sm"
                                            iconColor = "text-zinc-500/60"
                                        }

                                        return (
                                            <div key={key} className="relative">
                                                <div className={`p-1 rounded-full ${bubbleBg} transition-all duration-300 shadow-sm`}>
                                                    {group.isNutri ? (
                                                        <UtensilsCrossed className={`w-2.5 h-2.5 ${iconColor}`} />
                                                    ) : (
                                                        <Zap className={`w-2.5 h-2.5 ${iconColor}`} />
                                                    )}
                                                </div>
                                                {group.count > 1 && (
                                                    <div className="absolute -top-1 -right-1.5 bg-white text-black text-[7px] font-black w-3 h-3 rounded-full flex items-center justify-center border border-zinc-900">
                                                        {group.count}
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })
                                })()}

                                {/* Meets bubble (Confirmed: Grey, Unconfirmed/Absent: Red) */}
                                {ownedMeets.length > 0 && (() => {
                                    const isAnyUnconfirmed = ownedMeets.some(e => !e.is_confirmed && !e.confirmed)
                                    const isAnyAbsent = ownedMeets.some(e => e.asistencia === false || e.absent === true)
                                    const showRed = isAnyUnconfirmed || isAnyAbsent
                                    
                                    return (
                                        <div className={cn(
                                            "p-1 rounded-full backdrop-blur-md border",
                                            showRed 
                                                ? "bg-red-500/10 border-red-500/30" 
                                                : "bg-white/5 border-white/10"
                                        )}>
                                            <Video className={cn(
                                                "w-2.5 h-2.5",
                                                showRed ? "text-red-500" : "text-white/40"
                                            )} />
                                        </div>
                                    )
                                })()}

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
