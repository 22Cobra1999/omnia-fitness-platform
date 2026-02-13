
import { useMemo } from 'react'
import { Video, GraduationCap, Flame, Utensils, Zap } from "lucide-react"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday } from "date-fns"
import { es } from "date-fns/locale"
import { formatMinutes } from "../utils"

interface CalendarMonthGridProps {
    currentDate: Date
    activitiesByDate: Record<string, any[]>
    dayMinutesByDate: Record<string, {
        fitnessMinutesTotal: number
        nutritionMinutesTotal: number
        workshopMinutesTotal: number
        hasWorkshop?: boolean
        meetsMinutes: number
        fitnessMinutesPending: number
        nutritionMinutesPending: number
        pendingExercises?: number
        pendingPlates?: number
    }>
    meetEventsByDate: Record<string, any[]>
    availableSlotsCountByDay: Record<string, number>
    selectedDate: Date | null
    onSelectDate: (date: Date) => void
    isEditing: boolean
    sourceDate: Date | null
}

export function CalendarMonthGrid({
    currentDate,
    activitiesByDate,
    dayMinutesByDate,
    meetEventsByDate,
    availableSlotsCountByDay,
    selectedDate,
    onSelectDate,
    isEditing,
    sourceDate
}: CalendarMonthGridProps) {
    const { daysInMonth, leadingEmptyDays } = useMemo(() => {
        const monthStart = startOfMonth(currentDate)
        const monthEnd = endOfMonth(currentDate)
        const days = eachDayOfInterval({ start: monthStart, end: monthEnd })
        const leading = monthStart.getDay() // 0 = Sunday
        return { daysInMonth: days, leadingEmptyDays: leading }
    }, [currentDate])

    return (
        <>
            <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
                {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((day) => (
                    <div key={day} className="text-center text-sm font-semibold text-gray-400">
                        {day}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-1 sm:gap-2">
                {Array.from({ length: leadingEmptyDays }).map((_, idx) => (
                    <div key={`empty-${idx}`} className="aspect-square p-2" />
                ))}

                {daysInMonth.map((day) => {
                    const dateKey = format(day, 'yyyy-MM-dd')
                    const activities = activitiesByDate[dateKey] || []
                    const hasActivities = activities.length > 0

                    const mins = dayMinutesByDate[dateKey]
                    const fitnessMinutes = mins?.fitnessMinutesTotal ?? 0
                    const nutritionMinutes = mins?.nutritionMinutesTotal ?? 0
                    const busyMinutes = fitnessMinutes + nutritionMinutes
                    const meets = meetEventsByDate?.[dateKey] || []
                    const hasClientMeet = (meets.length ?? 0) > 0
                    const hasPendingClientMeet = meets.some((m) => String((m as any)?.rsvp_status || 'pending') === 'pending')

                    const isSource = isEditing && sourceDate && isSameDay(day, sourceDate)
                    const isSelected = selectedDate ? isSameDay(day, selectedDate) : false
                    const isTodayDate = isToday(day)

                    const coachSlotsCount = availableSlotsCountByDay[dateKey] || 0
                    const hasMeetSlots = coachSlotsCount > 0
                    const isBookingMode = Object.keys(availableSlotsCountByDay).length > 0;

                    // Check if day has fitness or nutrition activities
                    const hasFitnessActivities = fitnessMinutes > 0 || (mins?.pendingExercises ?? 0) > 0
                    const hasNutritionActivities = nutritionMinutes > 0 || (mins?.pendingPlates ?? 0) > 0

                    const totalPendingItems = (mins?.pendingExercises || 0)
                        + (mins?.pendingPlates || 0)
                        + (meets.length || 0)
                        + (mins?.hasWorkshop ? 1 : 0)

                    return (
                        <button
                            key={day.toISOString()}
                            type="button"
                            onClick={() => onSelectDate(day)}
                            className={
                                `min-h-[64px] sm:min-h-[120px] p-1.5 sm:p-2 rounded-xl text-sm font-medium transition-all flex flex-col items-center justify-start relative overflow-hidden ` +
                                `${isSelected ? 'backdrop-blur-md bg-white/10 border border-[#FF7939]/40 shadow-[0_8px_24px_rgba(0,0,0,0.35)] text-white' : 'border border-transparent'} ` +
                                `${isSource ? 'bg-[#FF7939]/20 ring-1 ring-[#FF7939] text-white' : ''} ` +
                                `${isTodayDate && !isSelected && !isSource ? 'bg-zinc-800 text-white' : ''} ` +
                                `${!isSelected && !isTodayDate && !isSource ? 'text-gray-400 hover:bg-zinc-800/50 hover:border-white/5' : ''}`
                            }
                        >
                            {isSource && (
                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#FF7939] rounded-full flex items-center justify-center text-[8px] font-bold text-white z-10">
                                    1
                                </div>
                            )}

                            <div className="w-full flex justify-between items-start">
                                {hasMeetSlots && !isSelected && !isTodayDate ? (
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ring-1 text-[11px] sm:text-sm font-bold ${coachSlotsCount < 120 ? 'ring-red-500 text-red-500 bg-red-500/10' : 'ring-[#FF7939] text-[#FF7939] bg-[#FF7939]/10'}`}>
                                        {format(day, 'd')}
                                    </div>
                                ) : (
                                    <span className={`text-[11px] sm:text-sm ${isTodayDate ? 'text-[#FF7939] font-bold' : ''}`}>
                                        {format(day, 'd')}
                                    </span>
                                )}
                            </div>

                            {/* Burbujas */}
                            <div className="flex flex-col gap-px mt-1 w-full items-center">
                                {isBookingMode ? (
                                    // Collapsed View for Booking Mode
                                    totalPendingItems > 0 && (
                                        <span className="flex items-center gap-1 text-[10px] bg-red-500/10 text-red-500 px-2 py-0.5 rounded-full font-bold leading-none border border-red-500/30">
                                            <Flame className="w-2.5 h-2.5" />
                                            {totalPendingItems}
                                        </span>
                                    )
                                ) : (
                                    // Standard Detailed View
                                    <>
                                        {/* Fitness Minutes Bubble */}
                                        {hasFitnessActivities && (mins?.fitnessMinutesPending > 0 || (mins?.pendingExercises ?? 0) > 0) && (
                                            <span className="flex items-center gap-1 text-[10px] bg-[#FF7939]/10 text-[#FF7939] px-2 py-0.5 rounded-full font-bold leading-none border border-[#FF7939]/30 shadow-sm">
                                                <Zap className="w-2.5 h-2.5" />
                                                {mins?.fitnessMinutesPending > 0 ? formatMinutes(mins.fitnessMinutesPending) : `${mins?.pendingExercises}e`}
                                            </span>
                                        )}

                                        {hasNutritionActivities && (mins?.nutritionMinutesPending > 0 || (mins?.pendingPlates ?? 0) > 0) && (
                                            <span className="flex items-center gap-1 text-[10px] bg-[#FFB366]/10 px-2 py-0.5 rounded-full text-[#FFB366] border border-[#FFB366]/30 leading-none font-bold">
                                                <Utensils className="w-2.5 h-2.5" />
                                                {mins?.nutritionMinutesPending > 0 ? formatMinutes(mins.nutritionMinutesPending) : `${mins?.pendingPlates}r`}
                                            </span>
                                        )}

                                        {(mins?.workshopMinutesTotal > 0 || mins?.hasWorkshop) && (
                                            <div className="flex items-center gap-1 mt-0.5 px-2 py-0.5 rounded-full border leading-none bg-blue-500/10 border-blue-500/30 text-blue-400 font-bold">
                                                <GraduationCap className="w-2.5 h-2.5 text-blue-400" />
                                                <span className="text-[10px]">{mins.workshopMinutesTotal > 0 ? formatMinutes(mins.workshopMinutesTotal) : 'Taller'}</span>
                                            </div>
                                        )}

                                        {(() => {
                                            const counts = { pending: 0, confirmed: 0, cancelled: 0 }
                                            meets.forEach((m: any) => {
                                                const rsvp = String(m?.rsvp_status || 'pending')
                                                const isCancelled = m.status === 'cancelled' || rsvp === 'declined'
                                                const isPending = !isCancelled && rsvp === 'pending'

                                                if (isCancelled) counts.cancelled++
                                                else if (isPending) counts.pending++
                                                else counts.confirmed++
                                            })

                                            return (
                                                <div className="flex flex-wrap items-center justify-center gap-1 mt-0.5">
                                                    {counts.confirmed > 0 && (
                                                        <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full border leading-none bg-[#FF7939]/10 border-[#FF7939]/30 text-[#FF7939]">
                                                            <Video className="w-2.5 h-2.5" />
                                                            {counts.confirmed > 1 && <span className="text-[9px] font-bold">{counts.confirmed}</span>}
                                                        </div>
                                                    )}
                                                    {counts.pending > 0 && (
                                                        <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full border leading-none bg-yellow-500/10 border-yellow-500/30 text-yellow-500">
                                                            <Video className="w-2.5 h-2.5" />
                                                            {counts.pending > 1 && <span className="text-[9px] font-bold">{counts.pending}</span>}
                                                        </div>
                                                    )}
                                                    {counts.cancelled > 0 && (
                                                        <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full border leading-none bg-red-500/10 border-red-500/30 text-red-500">
                                                            <Video className="w-2.5 h-2.5" />
                                                            {counts.cancelled > 1 && <span className="text-[9px] font-bold">{counts.cancelled}</span>}
                                                        </div>
                                                    )}
                                                </div>
                                            )
                                        })()}
                                    </>
                                )}
                            </div>
                        </button>
                    )
                })}
            </div>
        </>
    )
}
