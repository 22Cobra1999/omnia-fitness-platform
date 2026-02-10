import React, { useState, useMemo } from 'react'
import { format, parse, addMinutes } from 'date-fns'
import { es } from 'date-fns/locale'
import { Clock, Check } from 'lucide-react'

interface InlineMeetSchedulerProps {
    selectedDate: Date
    existingEvents: any[]
    onConfirm: (startTime: string, durationMinutes: number) => void
    onCancel: () => void
    checkOverlap: (date: Date, startTime: string, durationMinutes: number) => boolean
    meetTitle?: string // For rescheduling
    isRescheduling?: boolean
}

export function InlineMeetScheduler({
    selectedDate,
    existingEvents,
    onConfirm,
    onCancel,
    checkOverlap,
    meetTitle = 'Meet nueva',
    isRescheduling = false
}: InlineMeetSchedulerProps) {
    const [startTime, setStartTime] = useState('')
    const [selectedDuration, setSelectedDuration] = useState(30)

    const durations = [
        { value: 15, label: '15' },
        { value: 30, label: '30' },
        { value: 60, label: '60' }
    ]

    const hasOverlap = useMemo(() => {
        if (!startTime || !/^\d{2}:\d{2}$/.test(startTime)) return false
        return checkOverlap(selectedDate, startTime, selectedDuration)
    }, [startTime, selectedDuration, selectedDate, checkOverlap])

    // Create preview event
    const previewEvent = useMemo(() => {
        if (!startTime || !/^\d{2}:\d{2}$/.test(startTime)) return null

        try {
            const startDateTime = parse(startTime, 'HH:mm', selectedDate)
            const endDateTime = addMinutes(startDateTime, selectedDuration)

            return {
                id: 'preview',
                title: meetTitle,
                start_time: startDateTime.toISOString(),
                end_time: endDateTime.toISOString(),
                isPreview: true
            }
        } catch {
            return null
        }
    }, [startTime, selectedDuration, selectedDate, meetTitle])

    // Combine existing events with preview
    const allEvents = useMemo(() => {
        const events = [...existingEvents]
        if (previewEvent) {
            events.push(previewEvent)
        }
        return events.sort((a, b) =>
            new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
        )
    }, [existingEvents, previewEvent])

    const handleConfirm = () => {
        if (!startTime || !/^\d{2}:\d{2}$/.test(startTime)) return
        onConfirm(startTime, selectedDuration)
    }

    const isValidTime = startTime && /^\d{2}:\d{2}$/.test(startTime)

    return (
        <div className="space-y-4">
            {/* Message for rescheduling */}
            {isRescheduling && (
                <div className="bg-[#FF7939]/10 border border-[#FF7939]/20 rounded-xl p-3">
                    <p className="text-sm text-[#FF7939] font-medium">
                        📅 Selecciona el nuevo horario para esta meet
                    </p>
                </div>
            )}

            {/* Scheduler Controls */}
            <div className={`bg-white/5 border rounded-xl p-4 transition-all duration-300 ${hasOverlap ? 'border-red-500/50 bg-red-500/5' : 'border-white/10'}`}>
                <div className="flex items-center gap-3 mb-4">
                    <Clock className={`w-5 h-5 ${hasOverlap ? 'text-red-500' : 'text-[#FF7939]'}`} />
                    <span className="text-sm font-bold text-white">
                        {isRescheduling ? 'Nuevo horario' : 'Horario de inicio'}
                    </span>
                    {hasOverlap && (
                        <span className="ml-auto text-[10px] bg-red-500 text-white px-2 py-0.5 rounded-full font-black uppercase tracking-widest animate-pulse">
                            Superposición
                        </span>
                    )}
                </div>

                {hasOverlap && (
                    <div className="mb-4 text-xs text-red-400/80 font-medium">
                        ⚠️ Ya tenés otra actividad en este horario.
                    </div>
                )}

                <div className="flex items-center gap-3">
                    {/* Time Input */}
                    <input
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className={`flex-1 px-4 py-2.5 bg-white/5 border rounded-xl text-white focus:outline-none transition-all ${hasOverlap ? 'border-red-500/30' : 'border-white/10 focus:border-[#FF7939]/50 focus:bg-white/10'}`}
                        placeholder="12:00"
                    />

                    {/* Duration Buttons */}
                    <div className="flex gap-2">
                        {durations.map((duration) => (
                            <button
                                key={duration.value}
                                onClick={() => setSelectedDuration(duration.value)}
                                className={`
                  px-4 py-2.5 rounded-xl text-sm font-bold transition-all min-w-[60px]
                  ${selectedDuration === duration.value
                                        ? 'bg-[#FF7939] text-black shadow-lg shadow-[#FF7939]/20'
                                        : 'bg-white/5 text-white/70 border border-white/10 hover:bg-white/10'
                                    }
                `}
                            >
                                {duration.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Confirm Button */}
                {isValidTime && (
                    <button
                        onClick={handleConfirm}
                        className={`w-full mt-3 px-4 py-2.5 rounded-xl text-sm font-bold shadow-lg transition-all flex items-center justify-center gap-2 ${hasOverlap ? 'bg-zinc-800 text-white hover:bg-zinc-700' : 'bg-[#FF7939] text-black hover:bg-[#FF7939]/90 shadow-[#FF7939]/20'}`}
                    >
                        {hasOverlap ? (
                            <>Confirmar aun con superposición</>
                        ) : (
                            <>
                                <Check className="w-4 h-4" />
                                Confirmar horario
                            </>
                        )}
                    </button>
                )}
            </div>

            {/* Activities List with Preview */}
            <div>
                <h3 className="text-sm font-bold text-white/70 uppercase tracking-wider mb-3">
                    Actividades de hoy
                </h3>

                {allEvents.length === 0 ? (
                    <div className="text-center py-8 text-white/40 text-sm">
                        No hay actividades programadas
                    </div>
                ) : (
                    <div className="space-y-2">
                        {allEvents.map((event) => {
                            const start = new Date(event.start_time)
                            const end = event.end_time ? new Date(event.end_time) : null
                            const timeLabel = `${format(start, 'HH:mm')}${end && !Number.isNaN(end.getTime()) ? ` – ${format(end, 'HH:mm')}` : ''}`
                            const isPreview = event.isPreview

                            return (
                                <div
                                    key={event.id}
                                    className={`
                    w-full rounded-xl border px-4 py-3 transition-all
                    ${isPreview
                                            ? 'border-[#FF7939]/50 bg-[#FF7939]/10 shadow-lg shadow-[#FF7939]/10'
                                            : 'border-white/10 bg-white/5'
                                        }
                  `}
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className={`text-sm font-bold ${isPreview ? 'text-[#FF7939]' : 'text-white'}`}>
                                                {event.title || 'Sin título'}
                                                {isPreview && ' (vista previa)'}
                                            </div>
                                            <div className="text-xs text-white/50 mt-0.5">
                                                {timeLabel}
                                            </div>
                                        </div>
                                        {isPreview && (
                                            <div className="w-2 h-2 rounded-full bg-[#FF7939] animate-pulse" />
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}
