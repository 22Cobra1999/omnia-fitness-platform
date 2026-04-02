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
                        // 1. Calendar events (Meets) still need ownership/participation check
                        if (e.calendar_event_id) {
                            if (!currentCoachId) return false
                            return String(e.coach_id) === String(currentCoachId) || String(e.coach_id) === String(clientId)
                        }
                        
                        // 2. Program Activities (Fitness/Nutrition):
                        // We show ALL of them in the client's progress calendar view, 
                        // matching the client-side behavior to show the full picture.
                        return true
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
                                    const fitMins = ownedActs.filter(act => act.area === 'fitness').reduce((acc, act) => acc + (Number(act.fit_mins_o || 0)), 0)
                                    const nutItems = ownedActs.filter(act => act.area === 'nutricion').reduce((acc, act) => acc + (Number(act.nut_items_o || 0)), 0)

                                    const bubbles = []
                                    if (fitMins > 0) {
                                        bubbles.push(
                                            <div key="fit" className="relative group/bubble">
                                                <div className="flex items-center justify-center px-1.5 h-5 rounded-full border border-[#FF7939]/40 bg-[#FF7939]/10 gap-0.5 shadow-sm transition-all hover:scale-110">
                                                    <Zap className="w-2.5 h-2.5 text-[#FF7939] fill-[#FF7939]" />
                                                    <span className="text-[8px] font-bold text-[#FF7939]">{fitMins}m</span>
                                                </div>
                                            </div>
                                        )
                                    }
                                    if (nutItems > 0) {
                                        bubbles.push(
                                            <div key="nut" className="relative group/bubble">
                                                <div className="flex items-center justify-center px-1.5 h-5 rounded-full border border-yellow-500/40 bg-yellow-500/10 gap-0.5 shadow-sm transition-all hover:scale-110">
                                                    <UtensilsCrossed className="w-2.5 h-2.5 text-yellow-500" />
                                                    <span className="text-[8px] font-bold text-yellow-500">{nutItems}</span>
                                                </div>
                                            </div>
                                        )
                                    }
                                    return bubbles
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
