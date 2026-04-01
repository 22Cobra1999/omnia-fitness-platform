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
        <div className="flex flex-col gap-2 mb-4 mt-1">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Month Navigation */}
                <div className="flex items-center justify-center md:justify-start gap-4">
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

                {/* Legend */}
                <div className="flex items-center justify-center md:justify-end gap-5 px-1">
                    <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded bg-[#FF7939]/20 border border-[#FF7939]/30 backdrop-blur-[2px]"></div>
                        <span className="text-[10px] uppercase font-bold text-zinc-500">Completado</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded bg-red-500/10 border-transparent backdrop-blur-[2px]"></div>
                        <span className="text-[10px] uppercase font-bold text-zinc-500">Ausente</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded bg-yellow-500/20 border-transparent backdrop-blur-[2px]"></div>
                        <span className="text-[10px] uppercase font-bold text-zinc-500">Incompleto</span>
                    </div>
                </div>
            </div>
        </div>

    )
}
