import React from "react"
import { MeetCreateEditModal } from "../modals/MeetCreateEditModal"
import { MeetConfirmationModal } from "../modals/MeetConfirmationModal"
import { MeetDetailModal } from "@/components/calendar/MeetDetailModal"
import { MeetNotificationsModal } from "@/components/shared/meet-notifications-modal"
import { CoachCalendarMonthPicker } from "../common/CoachCalendarMonthPicker"
import { CalendarEvent } from "../../coach-calendar-screen"

interface CoachCalendarModalsProps {
    showCreateEventModal: boolean
    setShowCreateEventModal: (show: boolean) => void
    meetModalMode: 'create' | 'edit'
    createEventLoading: boolean
    newEventTitle: string
    setNewEventTitle: (title: string) => void
    newEventNotes: string
    setNewEventNotes: (notes: string) => void
    newEventDate: Date | null
    setNewEventDate: (date: Date | null) => void
    newEventStartTime: string
    setNewEventStartTime: (time: string) => void
    newEventEndTime: string
    setNewEventEndTime: (time: string) => void
    newEventIsFree: boolean
    setNewEventIsFree: (free: boolean) => void
    newEventPrice: number | string
    setNewEventPrice: (price: number | string) => void
    clientsForMeet: any[]
    selectedClientIds: string[]
    setSelectedClientIds: (ids: string[]) => void
    showClientPicker: boolean
    setShowClientPicker: (show: boolean) => void
    clientSearch: string
    setClientSearch: (search: string) => void
    handleCreateEvent: () => void
    deleteMeeting: () => void
    showMeetNotifications: boolean
    setShowMeetNotifications: (show: boolean) => void
    supabase: any
    coachId: string
    openMeetById: (id: string) => Promise<any>
    setSelectedMeetEvent: (event: any) => void
    selectedMeetEvent: any
    pendingReschedule: any
    setPendingReschedule: (reschedule: any) => void
    setSelectedMeetParticipants: (participants: any[]) => void
    selectedMeetParticipants: any[]
    handleStartReschedule: (meet: any, data: any) => void
    handleCancelRescheduleRequest: () => void
    eventsByDate: Record<string, any[]>
    selectedMeetRsvpStatus: any
    setSelectedMeetRsvpStatus: (status: any) => void
    selectedMeetRsvpLoading: boolean
    setSelectedMeetRsvpLoading: (loading: boolean) => void
    showConfirmationModal: boolean
    handleCancelConfirmation: () => void
    quickSchedulerDate: Date | null
    pendingMeetData: any
    isRescheduling: boolean
    handleRescheduleConfirm: (data: any) => void
    handleConfirmMeet: (data: any) => void
    handleEditTime: () => void
    meetToReschedule: any
    showMonthSelector: boolean
    setShowMonthSelector: (show: boolean) => void
    currentDate: Date
    monthPickerYear: number
    setMonthPickerYear: (year: number) => void
    changeMonth: (date: Date) => void
    goToToday: () => void
}

export const CoachCalendarModals: React.FC<CoachCalendarModalsProps> = ({
    showCreateEventModal,
    setShowCreateEventModal,
    meetModalMode,
    createEventLoading,
    newEventTitle,
    setNewEventTitle,
    newEventNotes,
    setNewEventNotes,
    newEventDate,
    setNewEventDate,
    newEventStartTime,
    setNewEventStartTime,
    newEventEndTime,
    setNewEventEndTime,
    newEventIsFree,
    setNewEventIsFree,
    newEventPrice,
    setNewEventPrice,
    clientsForMeet,
    selectedClientIds,
    setSelectedClientIds,
    showClientPicker,
    setShowClientPicker,
    clientSearch,
    setClientSearch,
    handleCreateEvent,
    deleteMeeting,
    showMeetNotifications,
    setShowMeetNotifications,
    supabase,
    coachId,
    openMeetById,
    setSelectedMeetEvent,
    selectedMeetEvent,
    pendingReschedule,
    setPendingReschedule,
    setSelectedMeetParticipants,
    selectedMeetParticipants,
    handleStartReschedule,
    handleCancelRescheduleRequest,
    eventsByDate,
    selectedMeetRsvpStatus,
    setSelectedMeetRsvpStatus,
    selectedMeetRsvpLoading,
    setSelectedMeetRsvpLoading,
    showConfirmationModal,
    handleCancelConfirmation,
    quickSchedulerDate,
    pendingMeetData,
    isRescheduling,
    handleRescheduleConfirm,
    handleConfirmMeet,
    handleEditTime,
    meetToReschedule,
    showMonthSelector,
    setShowMonthSelector,
    currentDate,
    monthPickerYear,
    setMonthPickerYear,
    changeMonth,
    goToToday,
}) => {
    return (
        <>
            <MeetCreateEditModal
                open={showCreateEventModal}
                onClose={() => setShowCreateEventModal(false)}
                mode={meetModalMode}
                loading={createEventLoading}
                title={newEventTitle}
                setTitle={setNewEventTitle}
                notes={newEventNotes}
                setNotes={setNewEventNotes}
                date={newEventDate}
                setDate={setNewEventDate}
                startTime={newEventStartTime}
                setStartTime={setNewEventStartTime}
                endTime={newEventEndTime}
                setEndTime={setNewEventEndTime}
                isFree={newEventIsFree}
                setIsFree={setNewEventIsFree}
                price={newEventPrice}
                setPrice={setNewEventPrice}
                clients={clientsForMeet}
                selectedClientIds={selectedClientIds}
                setSelectedClientIds={setSelectedClientIds}
                showClientPicker={showClientPicker}
                setShowClientPicker={setShowClientPicker}
                clientSearch={clientSearch}
                setClientSearch={setClientSearch}
                onSave={handleCreateEvent}
                onDelete={deleteMeeting}
            />

            <MeetNotificationsModal
                open={showMeetNotifications}
                onClose={() => setShowMeetNotifications(false)}
                role="coach"
                supabase={supabase}
                userId={coachId || ''}
                coachId={coachId || ''}
                onOpenMeet={async (eventId: string) => {
                    const event = await openMeetById(eventId)
                    if (event) {
                        setSelectedMeetEvent(event)
                        setShowMeetNotifications(false)
                    }
                }}
            />

            {selectedMeetEvent && (
                <MeetDetailModal
                    selectedMeetEvent={selectedMeetEvent}
                    setSelectedMeetEvent={setSelectedMeetEvent}
                    pendingReschedule={pendingReschedule}
                    setPendingReschedule={setPendingReschedule}
                    setSelectedMeetParticipants={setSelectedMeetParticipants}
                    selectedMeetParticipants={selectedMeetParticipants}
                    coachProfiles={[]}
                    authUserId={coachId}
                    onReschedule={(meet) => {
                        const guestIds = selectedMeetParticipants
                            .filter(p => String(p.user_id) !== String(coachId))
                            .map(p => p.user_id)

                        handleStartReschedule(meet, {
                            description: meet.description,
                            clientIds: guestIds
                        })
                        setSelectedMeetEvent(null)
                    }}
                    onCancelRescheduleRequest={handleCancelRescheduleRequest}
                    meetEventsByDate={eventsByDate}
                    setMeetEventsByDate={() => { }}
                    selectedMeetRsvpStatus={selectedMeetRsvpStatus}
                    setSelectedMeetRsvpStatus={setSelectedMeetRsvpStatus}
                    selectedMeetRsvpLoading={selectedMeetRsvpLoading}
                    setSelectedMeetRsvpLoading={setSelectedMeetRsvpLoading}
                    setRescheduleContext={() => { }}
                    handlePickCoachForMeet={() => { }}
                    setMeetViewMode={() => { }}
                    setMeetWeekStart={() => { }}
                />
            )}

            {showConfirmationModal && quickSchedulerDate && pendingMeetData && (
                <MeetConfirmationModal
                    isOpen={showConfirmationModal}
                    onClose={handleCancelConfirmation}
                    selectedDate={quickSchedulerDate}
                    startTime={pendingMeetData.startTime}
                    durationMinutes={pendingMeetData.durationMinutes}
                    onConfirm={isRescheduling ? handleRescheduleConfirm : handleConfirmMeet}
                    availableClients={clientsForMeet}
                    isRescheduling={isRescheduling}
                    onEditTime={handleEditTime}
                    originalMeet={meetToReschedule ? {
                        title: meetToReschedule.title,
                        start_time: meetToReschedule.start_time,
                        end_time: meetToReschedule.end_time || '',
                        description: meetToReschedule.description,
                        clientIds: [meetToReschedule.client_id].filter(Boolean) as string[],
                        isFree: meetToReschedule.pricing_data?.is_free,
                        price: meetToReschedule.pricing_data?.price
                    } : undefined}
                />
            )}

            <CoachCalendarMonthPicker
                isOpen={showMonthSelector}
                onClose={() => setShowMonthSelector(false)}
                currentDate={currentDate}
                monthPickerYear={monthPickerYear}
                setMonthPickerYear={setMonthPickerYear}
                changeMonth={changeMonth}
                goToToday={goToToday}
            />
        </>
    )
}
