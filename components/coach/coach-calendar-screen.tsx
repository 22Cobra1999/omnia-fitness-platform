"use client"

import React, { Suspense, useState } from "react"
import { Flame } from "lucide-react"
import { useCoachCalendarLogic } from "./hooks/calendar/useCoachCalendarLogic"
import { useCoachMeetDetail } from "./hooks/calendar/useCoachMeetDetail"
import { useCoachCalendarDerivedData } from "./hooks/calendar/useCoachCalendarDerivedData"
import { createClient } from "@/lib/supabase/supabase-client"

// Modular Components
import { CoachCalendarTopSection } from "./calendar/CoachCalendarScreen/CoachCalendarTopSection"
import { CoachCalendarViews } from "./calendar/CoachCalendarScreen/CoachCalendarViews"
import { CoachCalendarModals } from "./calendar/CoachCalendarScreen/CoachCalendarModals"

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
    viewMode, setViewMode, calendarMode, setCalendarMode, currentDate, selectedDate,
    showMonthSelector, setShowMonthSelector, monthPickerYear, setMonthPickerYear,
    goToToday, changeMonth, showAddMenu, setShowAddMenu, showMeetNotifications,
    setShowMeetNotifications, meetNotificationsCount, eventsByDate, loading,

    // Logic Hooks
    events, coachId, availabilityRules, availabilityDrafts, availabilitySaving,
    saveAvailability, deleteAvailabilityRule, setAvailabilityRules, setAvailabilityDrafts,

    // Meet Modal
    showCreateEventModal, setShowCreateEventModal, meetModalMode, createEventLoading,
    newEventTitle, setNewEventTitle, newEventNotes, setNewEventNotes, newEventDate,
    setNewEventDate, newEventStartTime, setNewEventStartTime, newEventEndTime,
    setNewEventEndTime, newEventIsFree, setNewEventIsFree, newEventPrice,
    setNewEventPrice, clientsForMeet, selectedClientIds, setSelectedClientIds,
    showClientPicker, setShowClientPicker, clientSearch, setClientSearch,

    // Actions
    goToPreviousMonth, goToNextMonth, handleCreateEvent, deleteMeeting,
    openMeetById, syncing,

    // Quick Scheduler
    showQuickScheduler, setShowQuickScheduler, quickSchedulerDate,
    handleDayClickForScheduler, handleActivateScheduler, handleQuickSchedulerConfirm,
    handleQuickSchedulerCancel,

    // Confirmation Modal
    showConfirmationModal, setShowConfirmationModal, pendingMeetData,
    handleConfirmMeet, handleCancelConfirmation, handleEditTime,

    // Rescheduling & Data
    isRescheduling, meetToReschedule, handleStartReschedule, handleRescheduleConfirm,
    handleCancelReschedule, handleCancelRescheduleRequest, checkOverlap,
    clientEvents, availableSlotsCountByDay, showAvailability, setViewedClientId
  } = useCoachCalendarLogic()

  const [selectedMeetEvent, setSelectedMeetEvent] = useState<any>(null)
  const [isSelectingClient, setIsSelectingClient] = useState(false)
  const [selectedClientForQuickMeet, setSelectedClientForQuickMeet] = useState<any>(null)

  const {
    selectedMeetParticipants, setSelectedMeetParticipants, pendingReschedule,
    setPendingReschedule, selectedMeetRsvpStatus, setSelectedMeetRsvpStatus,
    selectedMeetRsvpLoading, setSelectedMeetRsvpLoading
  } = useCoachMeetDetail(selectedMeetEvent, coachId)

  const {
    dayEvents, meetEvents, otherEvents, dateLabel, clientDayEvents,
    clientSelectedDateEvents, activeClientData
  } = useCoachCalendarDerivedData(
    selectedDate, eventsByDate, quickSchedulerDate, clientEvents,
    selectedClientForQuickMeet, meetToReschedule, clientsForMeet
  )

  const supabase = createClient()

  if (loading && !events.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0F1012] gap-4">
        <div className="relative flex items-center justify-center w-[120px] h-[120px]">
          <Flame size={80} className="absolute opacity-60 blur-[20px] text-[#FF7939] fill-[#FF7939]" />
          <Flame size={80} className="relative z-10 animate-pulse text-[#FF7939] fill-[#FF7939]" />
        </div>
        <div className="text-[18px] font-semibold text-[#FF7939] text-center">Cargando Agenda</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white pb-32">
      <div className="w-full mx-auto p-4 sm:p-8 space-y-6">
        <CoachCalendarTopSection
          showQuickScheduler={showQuickScheduler}
          isRescheduling={isRescheduling}
          isSelectingClient={isSelectingClient}
          clientsForMeet={clientsForMeet}
          activeClientData={activeClientData}
          meetToReschedule={meetToReschedule}
          setSelectedClientForQuickMeet={setSelectedClientForQuickMeet}
          setViewedClientId={setViewedClientId}
          setIsSelectingClient={setIsSelectingClient}
          handleActivateScheduler={handleActivateScheduler}
          handleQuickSchedulerCancel={handleQuickSchedulerCancel}
          handleCancelReschedule={handleCancelReschedule}
          viewMode={viewMode}
          calendarMode={calendarMode}
          meetNotificationsCount={meetNotificationsCount}
          setShowMeetNotifications={setShowMeetNotifications}
          setShowAddMenu={setShowAddMenu}
          showAddMenu={showAddMenu}
          setCalendarMode={setCalendarMode}
          setViewMode={setViewMode}
          currentDate={currentDate}
          goToPreviousMonth={goToPreviousMonth}
          goToNextMonth={goToNextMonth}
        />

        <CoachCalendarViews
          calendarMode={calendarMode}
          currentDate={currentDate}
          selectedDate={selectedDate}
          eventsByDate={eventsByDate}
          handleDayClickForScheduler={handleDayClickForScheduler}
          goToPreviousMonth={goToPreviousMonth}
          goToNextMonth={goToNextMonth}
          setShowMonthSelector={setShowMonthSelector}
          availableSlotsCountByDay={availableSlotsCountByDay}
          showAvailability={showAvailability}
          showQuickScheduler={showQuickScheduler}
          quickSchedulerDate={quickSchedulerDate}
          isSelectingClient={isSelectingClient}
          dayEvents={dayEvents}
          clientDayEvents={clientDayEvents}
          handleQuickSchedulerConfirm={handleQuickSchedulerConfirm}
          handleQuickSchedulerCancel={handleQuickSchedulerCancel}
          checkOverlap={checkOverlap}
          meetToReschedule={meetToReschedule}
          isRescheduling={isRescheduling}
          selectedClientForQuickMeet={selectedClientForQuickMeet}
          dateLabel={dateLabel}
          meetEvents={meetEvents as CalendarEvent[]}
          otherEvents={otherEvents as CalendarEvent[]}
          clientSelectedDateEvents={clientSelectedDateEvents as CalendarEvent[]}
          coachId={coachId}
          setSelectedMeetEvent={setSelectedMeetEvent}
          availabilityRules={availabilityRules}
          availabilityDrafts={availabilityDrafts}
          availabilitySaving={availabilitySaving}
          setAvailabilityRules={setAvailabilityRules}
          setAvailabilityDrafts={setAvailabilityDrafts}
          saveAvailability={saveAvailability}
          setCalendarMode={setCalendarMode}
          deleteAvailabilityRule={deleteAvailabilityRule}
        />
      </div>

      <CoachCalendarModals
        {...{
          showCreateEventModal, setShowCreateEventModal, meetModalMode, createEventLoading,
          newEventTitle, setNewEventTitle, newEventNotes, setNewEventNotes, newEventDate,
          setNewEventDate, newEventStartTime, setNewEventStartTime, newEventEndTime,
          setNewEventEndTime, newEventIsFree, setNewEventIsFree, newEventPrice,
          setNewEventPrice, clientsForMeet, selectedClientIds, setSelectedClientIds,
          showClientPicker, setShowClientPicker, clientSearch, setClientSearch,
          handleCreateEvent, deleteMeeting, showMeetNotifications, setShowMeetNotifications,
          supabase, coachId, openMeetById, setSelectedMeetEvent, selectedMeetEvent,
          pendingReschedule, setPendingReschedule, setSelectedMeetParticipants,
          selectedMeetParticipants, handleStartReschedule, handleCancelRescheduleRequest,
          eventsByDate, selectedMeetRsvpStatus, setSelectedMeetRsvpStatus,
          selectedMeetRsvpLoading, setSelectedMeetRsvpLoading, showConfirmationModal,
          handleCancelConfirmation, quickSchedulerDate, pendingMeetData, isRescheduling,
          handleRescheduleConfirm, handleConfirmMeet, handleEditTime, meetToReschedule,
          showMonthSelector, setShowMonthSelector, currentDate, monthPickerYear,
          setMonthPickerYear, changeMonth, goToToday
        }}
      />

      {syncing && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex flex-col items-center justify-center gap-4">
          <Flame className="w-12 h-12 text-[#FF7939] animate-bounce" />
          <p className="text-sm font-bold tracking-widest uppercase">Sincronizando con Google...</p>
        </div>
      )}
    </div>
  )
}

export default function CoachCalendarScreen() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center">Cargando...</div>}>
      <CoachCalendarContent />
    </Suspense>
  )
}