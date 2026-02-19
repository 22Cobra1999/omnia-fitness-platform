import React from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { CoachCalendarHeader } from "../common/CoachCalendarHeader"
import { CoachCalendarClientSelector } from "../common/CoachCalendarClientSelector"

interface CoachCalendarTopSectionProps {
    showQuickScheduler: boolean
    isRescheduling: boolean
    isSelectingClient: boolean
    clientsForMeet: any[]
    activeClientData: any
    meetToReschedule: any
    setSelectedClientForQuickMeet: (client: any) => void
    setViewedClientId: (id: string | null) => void
    setIsSelectingClient: (is: boolean) => void
    handleActivateScheduler: () => void
    handleQuickSchedulerCancel: () => void
    handleCancelReschedule: () => void
    viewMode: any
    calendarMode: 'events' | 'availability'
    meetNotificationsCount: number
    setShowMeetNotifications: (show: boolean) => void
    setShowAddMenu: (show: boolean) => void
    showAddMenu: boolean
    setCalendarMode: (mode: 'events' | 'availability') => void
    setViewMode: (mode: any) => void
    currentDate: Date
    goToPreviousMonth: () => void
    goToNextMonth: () => void
}

export const CoachCalendarTopSection: React.FC<CoachCalendarTopSectionProps> = ({
    showQuickScheduler,
    isRescheduling,
    isSelectingClient,
    clientsForMeet,
    activeClientData,
    meetToReschedule,
    setSelectedClientForQuickMeet,
    setViewedClientId,
    setIsSelectingClient,
    handleActivateScheduler,
    handleQuickSchedulerCancel,
    handleCancelReschedule,
    viewMode,
    calendarMode,
    meetNotificationsCount,
    setShowMeetNotifications,
    setShowAddMenu,
    showAddMenu,
    setCalendarMode,
    setViewMode,
    currentDate,
    goToPreviousMonth,
    goToNextMonth,
}) => {
    return (
        <>
            {/* Selected Client (Positioned above the + button) */}
            {(showQuickScheduler || isRescheduling || isSelectingClient) && (
                <div className="flex justify-end mb-8 mr-1 relative z-30">
                    <CoachCalendarClientSelector
                        clients={clientsForMeet}
                        selectedClientId={activeClientData?.id || (isRescheduling ? meetToReschedule?.client_id : null)}
                        onSelectClient={(client) => {
                            setSelectedClientForQuickMeet(client)
                            setViewedClientId(client.id)
                            setIsSelectingClient(false)
                            if (!showQuickScheduler) handleActivateScheduler()
                        }}
                        onClear={() => {
                            handleQuickSchedulerCancel()
                            if (isRescheduling) handleCancelReschedule()
                            setSelectedClientForQuickMeet(null)
                            setViewedClientId(null)
                            setIsSelectingClient(true)
                        }}
                        isSelecting={isSelectingClient}
                    />
                </div>
            )}

            <CoachCalendarHeader
                viewMode={viewMode}
                calendarMode={calendarMode}
                notificationsCount={meetNotificationsCount}
                onShowNotifications={() => setShowMeetNotifications(true)}
                onToggleAddMenu={() => setShowAddMenu(!showAddMenu)}
                onToggleMode={() => setCalendarMode(calendarMode === 'events' ? 'availability' : 'events')}
                showAddMenu={showAddMenu}
                onCreateMeet={() => {
                    setShowAddMenu(false)
                    setCalendarMode('events')
                    setIsSelectingClient(true)
                }}
                onEditAvailability={() => {
                    setShowAddMenu(false)
                    setCalendarMode('availability')
                    setViewMode('month')
                }}
                isCreating={showQuickScheduler || isSelectingClient || isRescheduling}
                onCancelCreation={() => {
                    if (isSelectingClient) setIsSelectingClient(false)
                    if (showQuickScheduler) handleQuickSchedulerCancel()
                    if (isRescheduling) handleCancelReschedule()
                    setSelectedClientForQuickMeet(null)
                }}
                currentDateLabel={format(currentDate, 'MMMM yyyy', { locale: es })}
                onPrevMonth={goToPreviousMonth}
                onNextMonth={goToNextMonth}
            />
        </>
    )
}
