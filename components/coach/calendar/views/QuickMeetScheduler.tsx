import React, { useState } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Clock, Calendar, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface QuickMeetSchedulerProps {
    selectedDate: Date
    onConfirm: (startTime: string, durationMinutes: number) => void
    onCancel: () => void
}

export function QuickMeetScheduler({
    selectedDate,
    onConfirm,
    onCancel
}: QuickMeetSchedulerProps) {

    // Generate time slots (every 15 minutes from 6am to 10pm)
    const generateTimeSlots = () => {
        const slots: string[] = []
        for (let hour = 6; hour <= 22; hour++) {
            for (let minute = 0; minute < 60; minute += 15) {
                const h = String(hour).padStart(2, '0')
                const m = String(minute).padStart(2, '0')
                slots.push(`${h}:${m}`)
            }
        }
        return slots
    }

    const timeSlots = generateTimeSlots()
    const durations = [
        { value: 15, label: '15 min' },
        { value: 30, label: '30 min' },
        { value: 60, label: '1 hora' }
    ]

    const [selectedTime, setSelectedTime] = useState<string>('')
    const [selectedDuration, setSelectedDuration] = useState<number>(30)

    const handleConfirm = () => {
        if (!selectedTime) return
        onConfirm(selectedTime, selectedDuration)
    }

    return (
        <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-white/10 rounded-2xl p-6 backdrop-blur-md shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#FF7939]/10 flex items-center justify-center border border-[#FF7939]/20">
                        <Calendar className="w-5 h-5 text-[#FF7939]" />
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-white">Nueva Meet</h3>
                        <p className="text-xs text-white/50">
                            {format(selectedDate, "EEEE, dd 'de' MMMM", { locale: es })}
                        </p>
                    </div>
                </div>
                <button
                    onClick={onCancel}
                    className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors border border-white/10"
                >
                    <X className="w-4 h-4 text-white/70" />
                </button>
            </div>

            {/* Time Selector */}
            <div className="mb-6">
                <label className="text-xs font-bold text-white/70 uppercase tracking-wider mb-3 block">
                    Hora de inicio
                </label>
                <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                    {timeSlots.map((time) => (
                        <button
                            key={time}
                            onClick={() => setSelectedTime(time)}
                            className={`
                px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
                ${selectedTime === time
                                    ? 'bg-[#FF7939] text-black border-2 border-[#FF7939] shadow-lg shadow-[#FF7939]/20'
                                    : 'bg-white/5 text-white/70 border border-white/10 hover:bg-white/10 hover:border-white/20'
                                }
              `}
                        >
                            {time}
                        </button>
                    ))}
                </div>
            </div>

            {/* Duration Selector */}
            <div className="mb-6">
                <label className="text-xs font-bold text-white/70 uppercase tracking-wider mb-3 block">
                    Duración
                </label>
                <div className="grid grid-cols-3 gap-2">
                    {durations.map((duration) => (
                        <button
                            key={duration.value}
                            onClick={() => setSelectedDuration(duration.value)}
                            className={`
                px-4 py-3 rounded-lg text-sm font-bold transition-all duration-200
                ${selectedDuration === duration.value
                                    ? 'bg-[#FF7939] text-black border-2 border-[#FF7939] shadow-lg shadow-[#FF7939]/20'
                                    : 'bg-white/5 text-white/70 border border-white/10 hover:bg-white/10 hover:border-white/20'
                                }
              `}
                        >
                            <Clock className="w-4 h-4 mx-auto mb-1" />
                            {duration.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Summary */}
            {selectedTime && (
                <div className="mb-6 p-4 bg-white/5 border border-white/10 rounded-lg">
                    <div className="text-xs text-white/50 mb-1">Resumen</div>
                    <div className="text-sm font-bold text-white">
                        {selectedTime} · {durations.find(d => d.value === selectedDuration)?.label}
                    </div>
                </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
                <button
                    onClick={onCancel}
                    className="flex-1 px-4 py-3 rounded-xl text-sm font-bold text-white/70 bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
                >
                    Cancelar
                </button>
                <button
                    onClick={handleConfirm}
                    disabled={!selectedTime}
                    className={`
            flex-1 px-4 py-3 rounded-xl text-sm font-bold transition-all
            ${selectedTime
                            ? 'bg-[#FF7939] text-black hover:bg-[#FF7939]/90 shadow-lg shadow-[#FF7939]/20'
                            : 'bg-white/5 text-white/30 border border-white/10 cursor-not-allowed'
                        }
          `}
                >
                    <div className="flex items-center justify-center gap-2">
                        <Check className="w-4 h-4" />
                        Confirmar horario
                    </div>
                </button>
            </div>

            <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 121, 57, 0.3);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 121, 57, 0.5);
        }
      `}</style>
        </div>
    )
}
