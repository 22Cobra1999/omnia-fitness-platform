
import React from 'react'
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CardHeader, CardTitle } from "@/components/ui/card"

interface CalendarMonthHeaderProps {
    monthLabel: string
    previousMonth: () => void
    nextMonth: () => void
    scheduleMeetContext?: any
}

export function CalendarMonthHeader({
    monthLabel,
    previousMonth,
    nextMonth,
    scheduleMeetContext
}: CalendarMonthHeaderProps) {
    return (
        <CardHeader className="pb-3">
            {scheduleMeetContext?.coachId ? (
                <div className="mb-2 text-xs text-[#FFB366]">
                    Agendá tu meet: elegí un día con disponibilidad
                </div>
            ) : null}
            <div className="flex items-center justify-between">
                <Button
                    variant="ghost"
                    onClick={previousMonth}
                    className="h-8 w-8 p-0 text-gray-300 hover:text-white hover:bg-zinc-800"
                >
                    <ChevronLeft className="h-4 w-4" />
                </Button>

                <CardTitle className="text-white text-lg sm:text-2xl font-bold">
                    <span className="text-white/90">{monthLabel}</span>
                </CardTitle>

                <Button
                    variant="ghost"
                    onClick={nextMonth}
                    className="h-8 w-8 p-0 text-gray-300 hover:text-white hover:bg-zinc-800"
                >
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
        </CardHeader>
    )
}
