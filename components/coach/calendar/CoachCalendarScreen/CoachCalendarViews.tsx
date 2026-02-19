import React from "react"
import { MonthView } from "../views/MonthView"
import { AvailabilityEditor } from "../views/AvailabilityEditor"
import { InlineMeetScheduler } from "../views/InlineMeetScheduler"
import { CoachCalendarEventList } from "../views/CoachCalendarEventList"
import { CalendarEvent } from "../../coach-calendar-screen"

interface CoachCalendarViewsProps {
    calendarMode: 'events' | 'availability'
    currentDate: Date
    selectedDate: Date
    eventsByDate: Record<string, any[]>
    handleDayClickForScheduler: (date: Date) => void
    goToPreviousMonth: () => void
    goToNextMonth: () => void
    setShowMonthSelector: (show: boolean) => void
    availableSlotsCountByDay: Record<string, number>
    showAvailability: boolean
    showQuickScheduler: boolean
    quickSchedulerDate: Date
    isSelectingClient: boolean
    dayEvents: any[]
    clientDayEvents: any[]
    handleQuickSchedulerConfirm: (data: any) => void
    handleQuickSchedulerCancel: () => void
    checkOverlap: (data: any) => Promise<boolean>
    meetToReschedule: any
    isRescheduling: boolean
    selectedClientForQuickMeet: any
    dateLabel: string
    meetEvents: CalendarEvent[]
    otherEvents: CalendarEvent[]
    clientSelectedDateEvents: CalendarEvent[]
    coachId: string
    setSelectedMeetEvent: (event: any) => void
    availabilityRules: any[]
    availabilityDrafts: Record<string, any>
    availabilitySaving: boolean
    setAvailabilityRules: React.Dispatch<React.SetStateAction<any[]>>
    setAvailabilityDrafts: React.Dispatch<React.SetStateAction<Record<string, any>>>
    saveAvailability: (year: number) => void
    setCalendarMode: (mode: 'events' | 'availability') => void
    deleteAvailabilityRule: (id: string) => void
}

export const CoachCalendarViews: React.FC<CoachCalendarViewsProps> = ({
    calendarMode,
    currentDate,
    selectedDate,
    eventsByDate,
    handleDayClickForScheduler,
    goToPreviousMonth,
    goToNextMonth,
    setShowMonthSelector,
    availableSlotsCountByDay,
    showAvailability,
    showQuickScheduler,
    quickSchedulerDate,
    isSelectingClient,
    dayEvents,
    clientDayEvents,
    handleQuickSchedulerConfirm,
    handleQuickSchedulerCancel,
    checkOverlap,
    meetToReschedule,
    isRescheduling,
    selectedClientForQuickMeet,
    dateLabel,
    meetEvents,
    otherEvents,
    clientSelectedDateEvents,
    coachId,
    setSelectedMeetEvent,
    availabilityRules,
    availabilityDrafts,
    availabilitySaving,
    setAvailabilityRules,
    setAvailabilityDrafts,
    saveAvailability,
    setCalendarMode,
    deleteAvailabilityRule,
}) => {
    if (calendarMode === 'events') {
        return (
            <>
                <MonthView
                    currentDate={currentDate}
                    selectedDate={selectedDate}
                    eventsByDate={eventsByDate}
                    onDateClick={(date) => handleDayClickForScheduler(date)}
                    onPrevMonth={goToPreviousMonth}
                    onNextMonth={goToNextMonth}
                    onMonthClick={() => setShowMonthSelector(true)}
                    availableSlotsCountByDay={availableSlotsCountByDay}
                    showAvailability={showAvailability}
                    hideHeader={true}
                />

                {selectedDate && (
                    <div className="mt-4">
                        <div className="mb-3">
                            {showQuickScheduler && quickSchedulerDate && !isSelectingClient && (
                                <div className="mb-4">
                                    <InlineMeetScheduler
                                        selectedDate={quickSchedulerDate}
                                        existingEvents={[...dayEvents, ...clientDayEvents]}
                                        onConfirm={handleQuickSchedulerConfirm}
                                        onCancel={handleQuickSchedulerCancel}
                                        checkOverlap={checkOverlap}
                                        meetTitle={meetToReschedule?.title || 'Meet nueva'}
                                        isRescheduling={isRescheduling}
                                        previewClientName={selectedClientForQuickMeet?.full_name}
                                    />
                                </div>
                            )}

                            {!showQuickScheduler && !isSelectingClient && (
                                <CoachCalendarEventList
                                    dateLabel={dateLabel}
                                    showAvailability={showAvailability}
                                    meetEvents={meetEvents}
                                    otherEvents={otherEvents}
                                    clientSelectedDateEvents={clientSelectedDateEvents}
                                    coachId={coachId}
                                    setSelectedMeetEvent={setSelectedMeetEvent}
                                />
                            )}
                        </div>
                    </div>
                )}
            </>
        )
    }

    return (
        <AvailabilityEditor
            rules={availabilityRules}
            drafts={availabilityDrafts}
            isSaving={availabilitySaving}
            onAddRule={() => {
                const newId = `new-${Date.now()}`
                setAvailabilityRules(prev => [...prev, {
                    id: newId,
                    start: '09:00',
                    end: '18:00',
                    days: [1, 2, 3, 4, 5],
                    scope: 'always'
                }])
                setAvailabilityDrafts(prev => ({
                    ...prev,
                    [newId]: {
                        start: '09:00',
                        end: '18:00',
                        days: [1, 2, 3, 4, 5],
                        months: Array.from({ length: 12 }, (_, i) => i)
                    }
                }))
            }}
            onDeleteRule={deleteAvailabilityRule}
            onUpdateDraft={(id, data) => {
                setAvailabilityDrafts(prev => ({
                    ...prev,
                    [id]: { ...(prev[id] || {}), ...data }
                }))
            }}
            onSave={() => saveAvailability(currentDate.getFullYear())}
            onCancel={() => setCalendarMode('events')}
        />
    )
}
