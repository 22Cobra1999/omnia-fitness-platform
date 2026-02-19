
import React from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { CalendarWeekView as OriginalCalendarWeekView } from "../components/CalendarWeekView"

interface CalendarWeekViewWrapperProps {
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

export function CalendarWeekView(props: CalendarWeekViewWrapperProps) {
    return (
        <Card className="bg-zinc-900 border-zinc-800 w-full sm:max-w-none mt-4">
            <CardContent className="p-4">
                <div className="mt-4">
                    <OriginalCalendarWeekView {...props} />
                </div>
            </CardContent>
        </Card>
    )
}
