"use client"

import React, { Suspense } from "react"
import { Flame } from "lucide-react"
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useCoachCalendarLogic } from "./hooks/calendar/useCoachCalendarLogic"
import { useCoachMeetDetail } from "./hooks/calendar/useCoachMeetDetail"
import { useCoachCalendarDerivedData } from "./hooks/calendar/useCoachCalendarDerivedData"
import { CoachCalendarHeader } from "./calendar/common/CoachCalendarHeader"
import { CoachCalendarClientSelector } from "./calendar/common/CoachCalendarClientSelector"
import { CoachCalendarMonthPicker } from "./calendar/common/CoachCalendarMonthPicker"
import { MonthView } from "./calendar/views/MonthView"
import { AvailabilityEditor } from "./calendar/views/AvailabilityEditor"
import { InlineMeetScheduler } from "./calendar/views/InlineMeetScheduler"
import { CoachCalendarEventList } from "./calendar/views/CoachCalendarEventList"
import { MeetCreateEditModal } from "./calendar/modals/MeetCreateEditModal"
import { MeetConfirmationModal } from "./calendar/modals/MeetConfirmationModal"
import { MeetDetailModal } from "@/components/calendar/MeetDetailModal"
import { MeetNotificationsModal } from "@/components/shared/meet-notifications-modal"
import { createClient } from "@/lib/supabase/supabase-client"

// Definición de interfaces para mantener compatibilidad
export interface CalendarEvent {
  id: string
  title: string
  start_time: string
  end_time: string
  event_type?: 'consultation' | 'workshop' | 'other'
  status?: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled'
  activity_id?: string
  meet_link?: string
  google_event_id?: string
  attendance_tracked?: boolean
  description?: string
  is_free?: boolean
  price?: number | string
  currency?: string
  coach_id?: string
  client_id?: string
  client_name?: string
  product_name?: string
  is_google_event?: boolean
  source?: 'omnia' | 'google_calendar'
  current_participants?: number
  confirmed_participants?: number
  total_guests?: number
  is_ghost?: boolean
  original_event_id?: string
  pending_reschedule?: any
  max_participants?: number | null
  rsvp_status?: string
  cancelled_by_user_id?: string
  cancellation_reason?: string
  cancelled_at?: string
  invited_by_user_id?: string
  lifecycle_data?: any
  pricing_data?: any
}

function CoachCalendarContent() {
  const {
    // UI State
    viewMode,
    setViewMode,
    calendarMode,
    setCalendarMode,
    currentDate,
    selectedDate,
    showMonthSelector,
    setShowMonthSelector,
    monthPickerYear,
    setMonthPickerYear,
    goToToday,
    changeMonth,
    showAddMenu,
    setShowAddMenu,
    showMeetNotifications,
    setShowMeetNotifications,
    meetNotificationsCount,
    eventsByDate,
    loading,

    // Logic Hooks/Handlers
    events,
    coachId,

    // Availability
    availabilityRules,
    availabilityDrafts,
    availabilitySaving,
    saveAvailability,
    deleteAvailabilityRule,
    setAvailabilityRules,
    setAvailabilityDrafts,

    // Meet Modal
    showCreateEventModal,
    setShowCreateEventModal,
    createEventLoading,
    meetModalMode,
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

    // Actions
    goToPreviousMonth,
    goToNextMonth,
    handleCreateEvent,
    deleteMeeting,
    openMeetById,
    syncing,

    // Quick Scheduler
    showQuickScheduler,
    setShowQuickScheduler,
    quickSchedulerDate,
    handleDayClickForScheduler,
    handleActivateScheduler,
    handleQuickSchedulerConfirm,
    handleQuickSchedulerCancel,

    // Confirmation Modal
    showConfirmationModal,
    setShowConfirmationModal,
    pendingMeetData,
    handleConfirmMeet,
    handleCancelConfirmation,
    handleEditTime,

    // Rescheduling
    isRescheduling,
    meetToReschedule,
    handleStartReschedule,
    handleRescheduleConfirm,
    handleCancelReschedule,
    handleCancelRescheduleRequest,
    checkOverlap,
    clientEvents,
    availableSlotsCountByDay,
    showAvailability,
    setViewedClientId
  } = useCoachCalendarLogic()

  const [selectedMeetEvent, setSelectedMeetEvent] = React.useState<any>(null)
  const [isSelectingClient, setIsSelectingClient] = React.useState(false)
  const [selectedClientForQuickMeet, setSelectedClientForQuickMeet] = React.useState<any>(null)

  // Externalized Detail Logic
  const {
    selectedMeetParticipants,
    setSelectedMeetParticipants,
    pendingReschedule,
    setPendingReschedule,
    selectedMeetRsvpStatus,
    setSelectedMeetRsvpStatus,
    selectedMeetRsvpLoading,
    setSelectedMeetRsvpLoading
  } = useCoachMeetDetail(selectedMeetEvent, coachId)

  const supabase = createClient()

  // Externalized Derived Data
  const {
    dayEvents,
    meetEvents,
    otherEvents,
    dateLabel,
    clientDayEvents,
    clientSelectedDateEvents,
    activeClientData
  } = useCoachCalendarDerivedData(
    selectedDate,
    eventsByDate,
    quickSchedulerDate,
    clientEvents,
    selectedClientForQuickMeet,
    meetToReschedule,
    clientsForMeet
  )

  if (loading && !events.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0F1012] gap-4">
        <div className="relative flex items-center justify-center w-[120px] h-[120px]">
          <div className="absolute opacity-60 scale-[1.5] blur-[20px]">
            <Flame size={80} color="#FF7939" fill="#FF7939" />
          </div>
          <div className="relative z-10 animate-pulse">
            <Flame size={80} color="#FF7939" fill="#FF7939" />
          </div>
        </div>
        <div className="text-[18px] font-semibold text-[#FF7939] text-center">Cargando Agenda</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white pb-32">
      <div className="w-full mx-auto p-4 sm:p-8 space-y-6">

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
          viewMode={viewMode as any}
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

        {calendarMode === 'events' ? (
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
                      meetEvents={meetEvents as CalendarEvent[]}
                      otherEvents={otherEvents as CalendarEvent[]}
                      clientSelectedDateEvents={clientSelectedDateEvents as CalendarEvent[]}
                      coachId={coachId}
                      setSelectedMeetEvent={setSelectedMeetEvent}
                    />
                  )}
                </div>
              </div>
            )}
          </>
        ) : (
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
        )}
      </div>

      {/* Modals */}
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
        onOpenMeet={async (eventId) => {
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

      {syncing && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex flex-col items-center justify-center gap-4">
          <Flame className="w-12 h-12 text-[#FF7939] animate-bounce" />
          <p className="text-sm font-bold tracking-widest uppercase">Sincronizando con Google...</p>
        </div>
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
    </div>
  )
}

export default function CoachCalendarScreen() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <CoachCalendarContent />
    </Suspense>
  )
}