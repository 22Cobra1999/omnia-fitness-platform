import React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface CalendarHeaderProps {
    currentDate: Date
    showMonthPicker: boolean
    monthPickerYear: number
    setMonthPickerYear: React.Dispatch<React.SetStateAction<number>>
    goToPreviousMonth: () => void
    goToNextMonth: () => void
    toggleMonthPicker: () => void
    monthlyProgress: any[]
    monthNames: string[]
}

export const CalendarHeader: React.FC<CalendarHeaderProps> = ({
    currentDate, showMonthPicker, monthPickerYear, setMonthPickerYear,
    goToPreviousMonth, goToNextMonth, toggleMonthPicker,
    monthlyProgress, monthNames
}) => {
    return (
        <div className="flex flex-col gap-6 mb-8 mt-2">
            <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-6">
                <div className="flex items-center justify-center md:justify-start gap-4 order-2 md:order-1">
                    <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded bg-[#FF7939]/20 border border-[#FF7939]/30 backdrop-blur-[2px]"></div>
                        <span className="text-[10px] uppercase font-bold text-gray-400">Completado</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded bg-red-500/10 border border-red-500/20 backdrop-blur-[2px]"></div>
                        <span className="text-[10px] uppercase font-bold text-gray-400">Ausente</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded bg-yellow-500/20 border border-yellow-500/30 backdrop-blur-[2px]"></div>
                        <span className="text-[10px] uppercase font-bold text-gray-400">Pendiente</span>
                    </div>
                </div>

                <div className="flex items-center justify-center gap-4 order-1 md:order-2">
                    <button onClick={showMonthPicker ? () => setMonthPickerYear(y => y - 1) : goToPreviousMonth} className="p-1.5 hover:bg-[#FF7939]/20 rounded-lg transition-all duration-200 group">
                        <ChevronLeft className="h-4 w-4 text-gray-400 group-hover:text-[#FF7939]" />
                    </button>
                    <button type="button" onClick={toggleMonthPicker} className="text-lg font-bold text-white min-w-[140px] text-center hover:bg-[#FF7939]/10 rounded-lg px-2 py-1 transition-colors font-[var(--font-anton)] tracking-wide">
                        {showMonthPicker ? monthPickerYear : `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`}
                    </button>
                    <button onClick={showMonthPicker ? () => setMonthPickerYear(y => y + 1) : goToNextMonth} className="p-1.5 hover:bg-[#FF7939]/20 rounded-lg transition-all duration-200 group">
                        <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-[#FF7939]" />
                    </button>
                </div>

                <div className="flex items-center justify-center md:justify-end gap-8 order-3">
                    <div className="text-center">
                        <div className="text-sm font-bold flex items-baseline justify-center gap-0.5">
                            <span className="text-[#FF7939]">{monthlyProgress.filter(p => (Number(p.items_completados) || 0) >= (Number(p.items_objetivo) || 1)).length}</span>
                            <span className="text-gray-500 text-xs">/</span>
                            <span className="text-white">{monthlyProgress.length}</span>
                        </div>
                        <div className="text-[9px] uppercase font-bold text-gray-500 tracking-wider">Actividades</div>
                    </div>
                    <div className="text-center">
                        <div className="text-sm font-bold flex items-baseline justify-center gap-0.5">
                            <span className="text-[#FF7939]">
                                {(() => {
                                    const daysMap: Record<string, any[]> = {}
                                    monthlyProgress.forEach(p => { if (!daysMap[p.fecha]) daysMap[p.fecha] = []; daysMap[p.fecha].push(p) })
                                    return Object.values(daysMap).filter(items => items.every(p => (Number(p.items_completados) || 0) >= (Number(p.items_objetivo) || 1))).length
                                })()}
                            </span>
                            <span className="text-gray-500 text-xs">/</span>
                            <span className="text-white">{new Set(monthlyProgress.map(p => p.fecha)).size}</span>
                        </div>
                        <div className="text-[9px] uppercase font-bold text-gray-500 tracking-wider">Días</div>
                    </div>
                </div>
            </div>
        </div>
    )
}
