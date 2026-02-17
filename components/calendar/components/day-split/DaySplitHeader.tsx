import React from 'react'
import { format, addDays } from "date-fns"
import { es } from "date-fns/locale"
import { ChevronLeft, ChevronRight, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

interface DaySplitHeaderProps {
    selectedDate: Date
    setSelectedDate: React.Dispatch<React.SetStateAction<Date | null>>
    setMeetViewMode: (mode: 'month' | 'week' | 'day_split') => void
    rescheduleContext: any
    setRescheduleContext: (ctx: any) => void
    setSelectedMeetRequest: (req: any) => void
    setSelectedMeetEvent: (evt: any) => void
}

export function DaySplitHeader({
    selectedDate,
    setSelectedDate,
    setMeetViewMode,
    rescheduleContext,
    setRescheduleContext,
    setSelectedMeetRequest,
    setSelectedMeetEvent
}: DaySplitHeaderProps) {
    return (
        <div className="flex flex-col items-center justify-center mb-4 transition-all animate-in fade-in slide-in-from-top-2 relative z-10 pointer-events-auto">
            <div className="flex items-center gap-2 mb-4">
                <button
                    type="button"
                    onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        e.nativeEvent.stopImmediatePropagation()
                        setSelectedMeetRequest(null)
                        setSelectedMeetEvent(null)
                        setMeetViewMode('week')
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                    onMouseUp={(e) => e.stopPropagation()}
                    className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold text-white/50 hover:text-white transition-colors cursor-pointer relative z-10"
                >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    Volver a semana
                </button>

                {rescheduleContext && (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            setRescheduleContext(null)
                            setMeetViewMode('month')
                            setSelectedMeetRequest(null)
                        }}
                        className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 transition-colors cursor-pointer relative z-10 ml-2"
                    >
                        <XCircle className="h-3.5 w-3.5" />
                        Cancelar reprogramación
                    </button>
                )}
            </div>

            <div className="flex items-center gap-6">
                <Button
                    variant="ghost"
                    className="h-8 w-8 p-0 text-white/50 hover:text-white hover:bg-white/10 rounded-full"
                    onClick={() => setSelectedDate(d => d ? addDays(d, -1) : d)}
                >
                    <ChevronLeft className="h-5 w-5" />
                </Button>
                <div className="text-white font-bold text-xl capitalize">
                    {format(selectedDate, 'EEEE d MMMM', { locale: es })}
                </div>
                <Button
                    variant="ghost"
                    className="h-8 w-8 p-0 text-white/50 hover:text-white hover:bg-white/10 rounded-full"
                    onClick={() => setSelectedDate(d => d ? addDays(d, 1) : d)}
                >
                    <ChevronRight className="h-5 w-5" />
                </Button>
            </div>
        </div>
    )
}
