import React from 'react'
import { Video } from 'lucide-react'
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
}

export const CalendarGrid: React.FC<CalendarGridProps> = ({
    days, currentDate, selectedDate, handleDayClick,
    summaryRowsByDate, monthlyProgress, currentCoachId, clientId,
    selectedDayForEdit, targetDayForEdit, dayNames, getDayData
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
                    const dateStr = date.toISOString().split('T')[0]
                    const isCurrentMonth = date.getMonth() === currentDate.getMonth()
                    const isToday = date.toDateString() === new Date().toDateString()
                    const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString()
                    const dayInfo = getDayData(date)
                    const hasAnyEx = dayInfo && dayInfo.exerciseCount > 0

                    const summary = summaryRowsByDate[dateStr] || []
                    const owned = summary.filter(e => {
                        if (!currentCoachId) return false
                        if (e.calendar_event_id) {
                            return String(e.coach_id) === String(currentCoachId) || (e.coach_id && String(e.coach_id) === String(clientId))
                        }
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

                    let bgClass = "bg-transparent/5"
                    if (hasOwned) {
                        if (isAllCompleted) bgClass = "bg-[#FF7939]/20 backdrop-blur-[2px] border border-[#FF7939]/30 text-white"
                        else if (isAbsent) bgClass = "bg-red-500/10 backdrop-blur-[2px] border border-red-500/20 text-white"
                        else bgClass = "bg-yellow-500/10 backdrop-blur-[2px] border border-yellow-500/20 text-yellow-100"
                    } else if (hasAnyEx) {
                        bgClass = "bg-zinc-900/40 border border-zinc-800 text-gray-500 opacity-70"
                    }

                    const selectionClass = isSelected ? "ring-1 ring-white shadow-[0_0_10px_rgba(255,255,255,0.1)] z-10 scale-[1.02] bg-opacity-40" : ""

                    return (
                        <button key={index} onClick={() => handleDayClick(date)} className={`relative p-2 text-sm rounded-lg transition-all duration-300 min-h-[50px] flex flex-col items-center justify-start group ${!isCurrentMonth ? 'opacity-20' : ''} ${isSelectedForEdit ? 'bg-[#FF7939]/30 border-2 border-[#FF7939] text-white' : (isTargetForEdit ? 'bg-white text-black border-2 border-white' : `${bgClass} ${selectionClass}`)}`}>
                            {isToday && (
                                <div className={`absolute top-1 right-1 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center ${isAllCompleted ? 'bg-white text-[#FF7939]' : (hasOwned && !isAbsent && !isAllCompleted) ? 'bg-yellow-500 text-black' : 'bg-[#FF7939] text-white'}`}>H</div>
                            )}
                            <div className="text-center font-semibold text-sm leading-none pt-1">{date.getDate()}</div>
                            <div className="mt-1 min-h-[20px] w-full flex flex-col items-center justify-start gap-px">
                                {ownedActs.length > 0 && (
                                    <div className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none ${isTargetForEdit ? 'bg-black text-white' : isAllCompleted ? 'bg-[#FF7939] text-white' : isAbsent ? 'bg-red-500/40 text-white' : 'bg-yellow-500/20 text-yellow-200'}`}>
                                        {formatMinutesCompact(actsMins) || '0m'}
                                    </div>
                                )}
                                {ownedMeets.length > 0 && (
                                    <div className="flex items-center gap-1 mt-0.5 px-1.5 py-0.5 rounded-full bg-[#FF7939]/10 border border-[#FF7939]/20">
                                        <Video className="w-2.5 h-2.5 text-[#FF7939]" />
                                        {ownedMeets.length > 1 && (
                                            <span className="text-[9px] font-bold text-[#FF7939] leading-none">{ownedMeets.length}</span>
                                        )}
                                    </div>
                                )}
                                {!hasOwned && hasAnyEx && (
                                    <div className="text-[9px] bg-zinc-700/50 text-gray-400 px-1.5 py-0.5 rounded-full">{formatMinutesCompact(dayInfo.totalMinutes)}</div>
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
