import React from 'react'
import { X } from "lucide-react"

interface CoachCalendarMonthPickerProps {
    isOpen: boolean
    onClose: () => void
    currentDate: Date
    monthPickerYear: number
    setMonthPickerYear: (year: number) => void
    changeMonth: (month: number) => void
    goToToday: () => void
}

export function CoachCalendarMonthPicker({
    isOpen,
    onClose,
    currentDate,
    monthPickerYear,
    setMonthPickerYear,
    changeMonth,
    goToToday
}: CoachCalendarMonthPickerProps) {
    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-zinc-900 border border-white/10 rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-white">Seleccionar Fecha</h3>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/50 hover:text-white transition-colors"
                        title="Cerrar"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="flex gap-4 h-[320px] mb-4">
                    {/* Columna de Años */}
                    <div className="w-24 overflow-y-auto flex flex-col gap-1 pr-2 border-r border-white/5 custom-scrollbar">
                        {Array.from({ length: 11 }, (_, i) => new Date().getFullYear() - 5 + i).map(year => (
                            <button
                                key={year}
                                onClick={() => setMonthPickerYear(year)}
                                className={
                                    `py-3 rounded-xl text-sm font-bold transition-all ` +
                                    (monthPickerYear === year
                                        ? 'bg-[#FF7939]/20 text-[#FF7939] border border-[#FF7939]/30'
                                        : 'text-white/40 hover:text-white hover:bg-white/5')
                                }
                            >
                                {year}
                            </button>
                        ))}
                    </div>

                    {/* Columna de Meses */}
                    <div className="flex-1 grid grid-cols-2 gap-2 overflow-y-auto pr-1 custom-scrollbar">
                        {['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Sept', 'Oct', 'Nov', 'Dic'].map((m, idx) => {
                            const isCurrent = currentDate.getMonth() === idx && currentDate.getFullYear() === monthPickerYear
                            return (
                                <button
                                    key={m}
                                    onClick={() => changeMonth(idx)}
                                    className={
                                        `h-12 rounded-xl text-xs font-bold transition-all ` +
                                        (isCurrent
                                            ? 'bg-[#FF7939] text-black shadow-[0_4px_12px_rgba(255,121,57,0.3)]'
                                            : 'bg-white/5 text-white/70 hover:bg-white/10 border border-white/5')
                                    }
                                >
                                    {m}
                                </button>
                            )
                        })}
                    </div>
                </div>

                <button
                    onClick={goToToday}
                    className="w-full mt-2 py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-bold text-sm hover:bg-white/10 transition-all"
                >
                    Ir a Hoy
                </button>
            </div>
        </div>
    )
}
