
import React from 'react'
import { format, addDays, isToday } from "date-fns"
import { es } from "date-fns/locale"
import { ChevronLeft, ChevronRight, Flame, Utensils, Video } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatMinutes, START_HOUR, END_HOUR, TOTAL_MINS, getTop, getHeight, coalesceSlots } from "../utils"

interface CalendarWeekViewProps {
    meetWeekStart: Date
    setMeetWeekStart: React.Dispatch<React.SetStateAction<Date>>
    selectedDate: Date
    setSelectedDate: React.Dispatch<React.SetStateAction<Date | null>>
    setMeetViewMode: (mode: 'month' | 'week' | 'day_split') => void
    getSlotsForDate: (d: Date) => string[]
    handleTimelineClick: (e: any, start: string, end: string, dayKey: string) => void
    renderClientEvents: (dayKey: string) => React.ReactNode
    dayMinutesByDate: Record<string, any>
    selectedMeetRequest: any
    setSelectedMeetRequest: (req: any) => void
    setSelectedMeetEvent: (evt: any) => void
}

export function CalendarWeekView({
    meetWeekStart,
    setMeetWeekStart,
    selectedDate,
    setSelectedDate,
    setMeetViewMode,
    getSlotsForDate,
    handleTimelineClick,
    renderClientEvents,
    dayMinutesByDate,
    selectedMeetRequest,
    setSelectedMeetRequest,
    setSelectedMeetEvent
}: CalendarWeekViewProps) {

    const weekSlotsMap: Record<string, string[]> = {}
    for (let i = 0; i < 7; i++) {
        const d = addDays(meetWeekStart, i)
        const key = format(d, 'yyyy-MM-dd')
        weekSlotsMap[key] = getSlotsForDate(d)
    }

    return (
        <div>
            <div className="flex items-center justify-center mb-2">
                <Button
                    variant="ghost"
                    onClick={(e) => {
                        e.stopPropagation()
                        setSelectedMeetRequest(null)
                        setSelectedMeetEvent(null)
                        setMeetViewMode('month')
                    }}
                    className="gap-1 px-4 py-1 text-xs text-white/60 hover:text-white transition-colors h-7 flex items-center"
                >
                    <ChevronLeft className="h-3 w-3" />
                    Volver al mes
                </Button>
            </div>
            <div className="flex items-center justify-between mb-3 px-2">
                <Button
                    variant="ghost"
                    onClick={() => setMeetWeekStart((d) => addDays(d, -7))}
                    className="h-8 w-8 p-0 text-gray-300 hover:text-white hover:bg-zinc-800"
                    title="Semana anterior"
                >
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="text-white font-bold text-lg capitalize">
                    {format(meetWeekStart, "MMMM", { locale: es })}
                    <span className="ml-1.5 text-sm font-normal text-white/50 lowercase">
                        {format(meetWeekStart, "d", { locale: es })} - {format(addDays(meetWeekStart, 6), "d", { locale: es })}
                    </span>
                </div>
                <Button
                    variant="ghost"
                    onClick={() => setMeetWeekStart((d) => addDays(d, 7))}
                    className="h-8 w-8 p-0 text-gray-300 hover:text-white hover:bg-zinc-800"
                    title="Semana siguiente"
                >
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>

            <div className="relative overflow-hidden flex flex-col w-full h-full">
                {/* Header Row */}
                <div className="flex bg-transparent">
                    <div className="w-6 flex-shrink-0 border-r border-transparent" />
                    <div className="flex flex-1">
                        {Array.from({ length: 7 }).map((_, idx) => {
                            const d = addDays(meetWeekStart, idx)
                            const label = format(d, 'EEE', { locale: es })
                            const dayNum = format(d, 'd')
                            const isTodayDay = isToday(d)
                            const dayKey = format(d, 'yyyy-MM-dd')
                            const mins = dayMinutesByDate[dayKey]

                            return (
                                <div
                                    key={idx}
                                    className={`flex-1 text-center py-2 cursor-pointer hover:bg-white/10 transition-colors ${isTodayDay ? 'bg-white/5' : ''}`}
                                    onClick={() => {
                                        setSelectedDate(d)
                                        setMeetViewMode('day_split')
                                    }}
                                >
                                    <div className="text-xs text-white/50 uppercase font-semibold">{label}</div>
                                    <div className={`text-sm font-bold ${isTodayDay ? 'text-[#FF7939]' : 'text-white'}`}>{dayNum}</div>

                                    {/* Activity Summary Bubbles - Split by Category */}
                                    <div className="flex flex-col items-center gap-1 mt-1.5 min-h-[22px]">
                                        {mins?.fitnessMinutesTotal > 0 && (
                                            <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-full border text-[9px] font-semibold border-[#FF7939]/40 bg-[#FF7939]/10 text-[#FFB366] gap-0.5">
                                                <Flame className="w-2.5 h-2.5" />
                                                {formatMinutes(mins.fitnessMinutesTotal)}
                                            </span>
                                        )}
                                        {mins?.nutritionMinutesTotal > 0 && (
                                            <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-full border text-[9px] font-semibold border-[#FFB873]/40 bg-[#FFB873]/10 text-[#FFD1B5] gap-0.5">
                                                <Utensils className="w-2.5 h-2.5" />
                                                {formatMinutes(mins.nutritionMinutesTotal)}
                                            </span>
                                        )}
                                        {mins?.meetsMinutes > 0 && (
                                            <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-full border text-[9px] font-semibold border-white/20 bg-white/5 text-white/70 gap-0.5">
                                                <Video className="w-2.5 h-2.5" />
                                                {formatMinutes(mins.meetsMinutes)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Scrollable Body (Week View) */}
                <div className="flex-1 relative">
                    <div className="flex min-h-[1000px] h-full relative">
                        {/* Time Axis */}
                        <div className="w-5 flex-shrink-0 bg-transparent text-[10px] text-white/40 font-bold text-left relative pl-1">
                            {Array.from({ length: END_HOUR - START_HOUR }).map((_, i) => {
                                const h = START_HOUR + i
                                return (
                                    <div key={h} className="absolute w-full" style={{ top: `${(i * 60 / TOTAL_MINS) * 100}%` }}>
                                        <span className="relative -top-2">{h}</span>
                                    </div>
                                )
                            })}
                        </div>

                        {/* Days Columns */}
                        <div className="flex flex-1 relative">
                            {/* Horizontal grid lines */}
                            {Array.from({ length: END_HOUR - START_HOUR }).map((_, i) => (
                                <div key={`grid-${i}`} className="absolute w-full border-t border-white/5 pointer-events-none" style={{ top: `${(i * 60 / TOTAL_MINS) * 100}%` }} />
                            ))}

                            {Array.from({ length: 7 }).map((_, idx) => {
                                const d = addDays(meetWeekStart, idx)
                                const dayKey = format(d, 'yyyy-MM-dd')
                                const slots = weekSlotsMap[dayKey] || []
                                const blocks = coalesceSlots(slots)
                                const isTodayDay = isToday(d)

                                return (
                                    <div key={dayKey} className={`flex-1 relative ${isTodayDay ? 'bg-white/5' : ''}`}>
                                        {renderClientEvents(dayKey)}

                                        {/* Available Blocks */}
                                        {blocks.map((block, bIdx) => {
                                            const startMins = Number(block.start.split(':')[0]) * 60 + Number(block.start.split(':')[1])
                                            const endMins = Number(block.end.split(':')[0]) * 60 + Number(block.end.split(':')[1])
                                            const duration = endMins - startMins

                                            // Validation: Past or < Now + 1hr
                                            const slotDate = new Date(`${dayKey}T${block.start}:00`)
                                            const now = new Date()
                                            const minTime = new Date(now.getTime() + 60 * 60 * 1000) // Now + 1 hour
                                            const isBlocked = slotDate < minTime

                                            return (
                                                <button
                                                    key={`${dayKey}-${bIdx}`}
                                                    type="button"
                                                    onClick={(e) => {
                                                        if (isBlocked) {
                                                            alert('No se pueden reservar turnos con menos de 1 hora de anticipación.')
                                                            e.stopPropagation()
                                                            return
                                                        }
                                                        handleTimelineClick(e, block.start, block.end, dayKey)
                                                    }}
                                                    style={{
                                                        top: `${getTop(block.start)}%`,
                                                        height: `${getHeight(duration)}%`
                                                    }}
                                                    className={`absolute inset-x-0.5 rounded-md flex flex-col justify-center items-center px-1 py-1 group transition-colors 
                                                        ${isBlocked
                                                            ? 'bg-zinc-800/50 border border-zinc-700/50 cursor-not-allowed opacity-60'
                                                            : 'bg-[#FFB366]/20 border border-[#FFB366]/30 hover:bg-[#FFB366]/30 hover:z-10 cursor-pointer'
                                                        }`}
                                                >
                                                    <div className="flex flex-col items-center justify-center leading-tight">
                                                        <span className={`text-[10px] font-bold truncate ${isBlocked ? 'text-zinc-500' : 'text-[#FFB366] group-hover:text-white'}`}>
                                                            {block.start}
                                                        </span>
                                                        <span className={`text-[8px] ${isBlocked ? 'text-zinc-600' : 'text-[#FFB366]/60 group-hover:text-white/60'}`}>
                                                            -
                                                        </span>
                                                        <span className={`text-[10px] font-bold truncate ${isBlocked ? 'text-zinc-500' : 'text-[#FFB366] group-hover:text-white'}`}>
                                                            {block.end}
                                                        </span>
                                                    </div>
                                                </button>
                                            )
                                        })}
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-center mt-4">
                <button
                    type="button"
                    onClick={() => setMeetViewMode('month')}
                    className="px-4 py-2 rounded-full border text-sm backdrop-blur-md bg-white/10 border-white/20 text-white hover:bg-white/15 transition-colors"
                >
                    Volver al mes
                </button>
            </div>
        </div>
    )
}
