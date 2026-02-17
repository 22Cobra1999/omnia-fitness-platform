import React from 'react'
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Flame, Utensils, Video } from "lucide-react"
import { formatMinutes, START_HOUR, END_HOUR, TOTAL_MINS, getTop, getHeight, coalesceSlots } from "../../utils"

interface DaySplitTimelineProps {
    selectedDate: Date
    activitiesByDate: Record<string, any[]>
    dayMinutesByDate: Record<string, any>
    renderClientEvents: (dayKey: string) => React.ReactNode
    getSlotsForDate: (d: Date, durationMinutes?: number) => string[]
    handleTimelineClick: (e: any, start: string, end: string, dayKey: string) => void
}

export function DaySplitTimeline({
    selectedDate,
    activitiesByDate,
    dayMinutesByDate,
    renderClientEvents,
    getSlotsForDate,
    handleTimelineClick
}: DaySplitTimelineProps) {
    const dayKey = format(selectedDate, 'yyyy-MM-dd')
    const dayActs = activitiesByDate[dayKey] || []
    const mins = dayMinutesByDate[dayKey]

    // Fallback if no specific data
    const hasActivities = dayActs.length > 0 || (mins?.fitnessMinutesTotal || 0) > 0 || (mins?.nutritionMinutesTotal || 0) > 0 || (mins?.meetsMinutes || 0) > 0

    return (
        <div className="w-full md:w-1/2">
            <div className="bg-transparent overflow-hidden flex flex-col relative">
                {/* Timeline Header (Daily Stats) */}
                <div className="flex bg-transparent">
                    <div className="w-6 flex-shrink-0" />
                    <div className="flex-1 text-center py-3">
                        {!hasActivities ? (
                            <div className="flex flex-col justify-center h-full">
                                <div className="text-[10px] text-white/40 uppercase font-bold tracking-wider mb-0.5">
                                    {format(selectedDate, 'EEEE d', { locale: es })}
                                </div>
                                <div className="text-sm font-bold text-zinc-600">
                                    Sin programación
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col justify-center h-full gap-2">
                                <div className="flex flex-wrap justify-center gap-3">
                                    {mins?.fitnessMinutesTotal > 0 && (
                                        <span className="inline-flex items-center justify-center px-3 py-1 rounded-full border text-xs font-semibold border-[#FF7939]/40 bg-[#FF7939]/10 text-[#FFB366]">
                                            <Flame className="w-3.5 h-3.5 mr-1.5" />
                                            {formatMinutes(mins.fitnessMinutesTotal)}
                                        </span>
                                    )}
                                    {mins?.nutritionMinutesTotal > 0 && (
                                        <span className="inline-flex items-center justify-center px-3 py-1 rounded-full border text-xs font-semibold border-[#FFB873]/40 bg-[#FFB873]/10 text-[#FFB366]">
                                            <Utensils className="w-3.5 h-3.5 mr-1.5" />
                                            {formatMinutes(mins.nutritionMinutesTotal)}
                                        </span>
                                    )}
                                    {mins?.meetsMinutes > 0 && (
                                        <span className="inline-flex items-center justify-center px-3 py-1 rounded-full border text-xs font-semibold border-[#FF7939]/30 bg-[#FF7939]/10 text-[#FFB366]">
                                            <Video className="w-3.5 h-3.5 mr-1.5" />
                                            {formatMinutes(mins.meetsMinutes)}
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Scrollable Body */}
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

                        {/* Day Column */}
                        <div className="flex-1 relative">
                            {/* Horizontal Lines */}
                            {Array.from({ length: END_HOUR - START_HOUR }).map((_, i) => (
                                <div key={`grid-${i}`} className="absolute w-full border-t border-white/5 pointer-events-none" style={{ top: `${(i * 60 / TOTAL_MINS) * 100}%` }} />
                            ))}

                            {/* Client Events */}
                            {renderClientEvents(dayKey)}

                            {/* Available Blocks */}
                            {(() => {
                                const slots = getSlotsForDate(selectedDate)
                                const blocks = coalesceSlots(slots)
                                return blocks.map((block, idx) => {
                                    const startMins = Number(block.start.split(':')[0]) * 60 + Number(block.start.split(':')[1])
                                    const endMins = Number(block.end.split(':')[0]) * 60 + Number(block.end.split(':')[1])
                                    const duration = endMins - startMins

                                    const slotDate = new Date(`${dayKey}T${block.start}:00`)
                                    const now = new Date()
                                    const minTime = new Date(now.getTime() + 60 * 60 * 1000) // Now + 1 hour
                                    const isBlocked = slotDate < minTime

                                    return (
                                        <button
                                            key={idx}
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
                                            className={`absolute left-0 right-0 mx-1 rounded-md border text-[10px] font-medium flex items-center justify-center
                                      overflow-hidden transition-all shadow-sm group
                                      ${isBlocked
                                                    ? 'bg-zinc-800/50 border-zinc-700/50 text-zinc-500 cursor-not-allowed opacity-60'
                                                    : 'bg-[#FF7939]/10 border-[#FF7939]/30 text-[#FFB366] hover:bg-[#FF7939]/20 hover:border-[#FF7939]/50 hover:scale-[1.02] z-10 hover:z-20 cursor-pointer'
                                                }`}
                                        >
                                            <div className="flex flex-col items-center justify-center leading-none gap-0.5 w-full h-full p-0.5">
                                                <span className="font-bold truncate">{block.start}</span>
                                                <span className="text-[8px] opacity-60">-</span>
                                                <span className="font-bold truncate">{block.end}</span>
                                            </div>
                                        </button>
                                    )
                                })
                            })()}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
