import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar } from '@/components/ui/calendar'
import { Calendar as CalendarIcon } from 'lucide-react'

interface ScheduleCalendarProps {
    allDates: Date[]
    colors: { [key: string]: string }
    getDateBlockColor: (date: Date) => string | null
}

export function ScheduleCalendar({ allDates, colors, getDateBlockColor }: ScheduleCalendarProps) {
    return (
        <Card className="bg-[#0A0A0A] border-[#1A1A1A]">
            <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5" />
                    Calendario de Horarios
                </CardTitle>
            </CardHeader>
            <CardContent>
                <Calendar
                    selectedDates={allDates}
                    onDateSelect={() => { }}
                    onDateDeselect={() => { }}
                    blockColors={colors}
                    getDateBlockColor={getDateBlockColor}
                />
            </CardContent>
        </Card>
    )
}
