
import { Card, CardContent } from "@/components/ui/card"
import { CalendarMonthGrid } from "../components/CalendarMonthGrid"
import { CalendarEditOverlay } from "../components/CalendarEditOverlay"
import { CalendarDayDetail } from "../components/CalendarDayDetail"

interface CalendarMonthViewProps {
    currentDate: Date
    activitiesByDate: Record<string, any[]>
    dayMinutesByDate: Record<string, any>
    meetEventsByDate: Record<string, any[]>
    availableSlotsCountByDay: Record<string, number>
    selectedDate: Date | null
    onSelectDate: (date: Date) => void
    isEditing: boolean
    sourceDate: Date | null
    // Props for DayDetail
    selectedDayActivityItems: any[]
    setSelectedMeetEvent: (evt: any) => void
    onActivityClick: (activityId: string) => void
    dayDetailRef: React.RefObject<HTMLDivElement | null>
    meetViewMode: 'month' | 'week' | 'day_split'
    authUserId?: string | null
}

export function CalendarMonthView({
    currentDate,
    activitiesByDate,
    dayMinutesByDate,
    meetEventsByDate,
    availableSlotsCountByDay,
    selectedDate,
    onSelectDate,
    isEditing,
    sourceDate,
    selectedDayActivityItems,
    setSelectedMeetEvent,
    onActivityClick,
    dayDetailRef,
    meetViewMode,
    authUserId
}: CalendarMonthViewProps) {
    return (
        <>
            <Card className="bg-zinc-900 border-zinc-800 w-full sm:max-w-none mt-4">
                <CardContent className="p-4">
                    <CalendarEditOverlay
                        isEditing={isEditing}
                        sourceDate={sourceDate}
                    />
                    <div className="mt-4">
                        <CalendarMonthGrid
                            currentDate={currentDate}
                            activitiesByDate={activitiesByDate}
                            dayMinutesByDate={dayMinutesByDate}
                            meetEventsByDate={meetEventsByDate}
                            availableSlotsCountByDay={availableSlotsCountByDay}
                            selectedDate={selectedDate!!}
                            onSelectDate={onSelectDate}
                            isEditing={isEditing}
                            sourceDate={sourceDate}
                        />
                    </div>
                </CardContent>
            </Card>

            <CalendarDayDetail
                selectedDate={selectedDate}
                dayMinutesByDate={dayMinutesByDate}
                meetEventsByDate={meetEventsByDate}
                selectedDayActivityItems={selectedDayActivityItems}
                activitiesByDate={activitiesByDate}
                setSelectedMeetEvent={setSelectedMeetEvent}
                onActivityClick={onActivityClick}
                dayDetailRef={dayDetailRef}
                meetViewMode={meetViewMode}
                authUserId={authUserId}
            />
        </>
    )
}
