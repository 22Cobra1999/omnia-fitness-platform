"use client"

import React, { Suspense } from "react"
import { Flame, Video, Calendar as CalendarIcon } from "lucide-react"
import { format, isToday } from 'date-fns'
import { es } from 'date-fns/locale'
import { useCoachCalendarLogic } from "./hooks/calendar/useCoachCalendarLogic"
import { CoachCalendarHeader } from "./calendar/common/CoachCalendarHeader"
import { MonthView } from "./calendar/views/MonthView"
import { AvailabilityEditor } from "./calendar/views/AvailabilityEditor"
import { InlineMeetScheduler } from "./calendar/views/InlineMeetScheduler"
import { MeetCreateEditModal } from "./calendar/modals/MeetCreateEditModal"
import { MeetConfirmationModal } from "./calendar/modals/MeetConfirmationModal"
import { MeetDetailModal } from "@/components/calendar/MeetDetailModal"
import { MeetNotificationsModal } from "@/components/shared/meet-notifications-modal"
import { createClient } from "@/lib/supabase/supabase-client"

// Definición de interfaces para mantener compatibilidad if needed
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
  is_ghost?: boolean
  original_event_id?: string
  pending_reschedule?: any
  max_participants?: number | null
  rsvp_status?: string
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
    setSelectedDate,
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
    openCreateEventModal,
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
    checkOverlap
  } = useCoachCalendarLogic()

  const supabase = createClient()
  const [selectedMeetEvent, setSelectedMeetEvent] = React.useState<any>(null)
  const [selectedMeetParticipants, setSelectedMeetParticipants] = React.useState<any[]>([])
  const [pendingReschedule, setPendingReschedule] = React.useState<any>(null)
  const [selectedMeetRsvpStatus, setSelectedMeetRsvpStatus] = React.useState('pending')
  const [selectedMeetRsvpLoading, setSelectedMeetRsvpLoading] = React.useState(false)

  // Calclular eventos del día seleccionado para el detalle inferior
  const { dayEvents, meetEvents, otherEvents, dateLabel } = React.useMemo(() => {
    if (!selectedDate) return { dayEvents: [], meetEvents: [], otherEvents: [], dateLabel: '' }

    const dateKey = format(selectedDate, 'yyyy-MM-dd')
    const events = eventsByDate[dateKey] || []

    const meets = events.filter(e =>
      e.event_type === 'consultation' || e.event_type === 'workshop'
    )
    const others = events.filter(e =>
      e.event_type !== 'consultation' && e.event_type !== 'workshop'
    )
    const label = isToday(selectedDate)
      ? 'Hoy'
      : (() => {
        const raw = format(selectedDate, "eeee d 'de' MMMM", { locale: es });
        return raw.charAt(0).toUpperCase() + raw.slice(1);
      })();

    return { dayEvents: events, meetEvents: meets, otherEvents: others, dateLabel: label }
  }, [selectedDate, eventsByDate])

  // Load participants and reschedule when meet is selected
  React.useEffect(() => {
    if (!selectedMeetEvent) {
      setSelectedMeetParticipants([])
      setPendingReschedule(null)
      return
    }

    const loadMeetDetails = async () => {
      try {
        const actualEventId = selectedMeetEvent.is_ghost ? selectedMeetEvent.original_event_id : selectedMeetEvent.id
        console.log('🔍 Loading meet details for:', actualEventId)

        // Load participants with their profiles
        const { data: participants, error: participantsError } = await supabase
          .from('calendar_event_participants')
          .select('*')
          .eq('event_id', actualEventId)

        if (participantsError) {
          console.error('❌ Error loading participants:', participantsError)
        }

        console.log('👥 Participants found:', participants?.length || 0, participants)

        // Load profiles for all participants
        const participantIds = participants?.map((p: any) => p.user_id).filter(Boolean) || []

        // Also include coach
        if (selectedMeetEvent.coach_id && !participantIds.includes(selectedMeetEvent.coach_id)) {
          participantIds.push(selectedMeetEvent.coach_id)
        }

        console.log('🔍 Loading profiles for IDs:', participantIds)

        const { data: profiles, error: profilesError } = await supabase
          .from('user_profiles')
          .select('id, full_name, avatar_url, email')
          .in('id', participantIds)

        if (profilesError) {
          console.error('❌ Error loading profiles:', profilesError)
        }

        console.log('👤 Profiles loaded:', profiles?.length || 0, profiles)

        // Map participants with their profile data
        const participantsWithProfiles = (participants || []).map((p: any) => {
          const profile = profiles?.find((prof: any) => prof.id === p.user_id)
          const isCoach = String(p.user_id) === String(selectedMeetEvent.coach_id)

          return {
            ...p,
            name: profile?.full_name || 'Usuario',
            avatar_url: profile?.avatar_url,
            client_id: p.user_id, // Keep client_id for backwards compatibility
            is_organizer: isCoach || p.participant_role === 'coach' || p.participant_role === 'host'
          }
        })

        console.log('✅ Participants with profiles:', participantsWithProfiles)

        // Add coach as host if not already in participants
        const coachProfile = profiles?.find((p: any) => p.id === selectedMeetEvent.coach_id)
        const coachInParticipants = participantsWithProfiles.some((p: any) => String(p.user_id) === String(selectedMeetEvent.coach_id))

        if (!coachInParticipants && coachProfile) {
          console.log('➕ Adding coach as participant:', coachProfile)
          participantsWithProfiles.push({
            id: selectedMeetEvent.coach_id,
            user_id: selectedMeetEvent.coach_id,
            client_id: selectedMeetEvent.coach_id,
            name: coachProfile.full_name || 'Coach',
            avatar_url: coachProfile.avatar_url,
            rsvp_status: 'accepted',
            role: 'host',
            participant_role: 'host',
            is_organizer: true,
            is_creator: false
          })
        }

        setSelectedMeetParticipants(participantsWithProfiles)

        // Find my RSVP status
        const myParticipation = participantsWithProfiles.find((p: any) => p.user_id === coachId)
        if (myParticipation) {
          setSelectedMeetRsvpStatus(myParticipation.rsvp_status || 'pending')
        } else {
          // Coach is always accepted
          setSelectedMeetRsvpStatus('accepted')
        }

        // Load reschedule (pending to show suggest, accepted to show history)
        const { data: reschedule } = await supabase
          .from('calendar_event_reschedule_requests')
          .select('*')
          .eq('event_id', actualEventId)
          .in('status', ['pending', 'accepted'])
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (reschedule) {
          setPendingReschedule(reschedule)
        }
      } catch (err) {
        console.error('Error loading meet details:', err)
      }
    }

    loadMeetDetails()
  }, [selectedMeetEvent, coachId])

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
      <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-6">

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
            handleActivateScheduler()
          }}
          onEditAvailability={() => {
            setShowAddMenu(false)
            setCalendarMode('availability')
            setViewMode('month')
          }}
        />

        {isRescheduling && !showQuickScheduler && (
          <div className="bg-[#FF7939]/10 border border-[#FF7939]/20 rounded-2xl p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#FF7939]/20 flex items-center justify-center">
                <CalendarIcon className="w-5 h-5 text-[#FF7939]" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Reprogramando meet</p>
                <p className="text-xs text-white/60">Selecciona el nuevo día en el calendario</p>
              </div>
            </div>
            <button
              onClick={() => {
                if (meetToReschedule) {
                  setSelectedMeetEvent(meetToReschedule as any)
                }
                handleCancelReschedule()
              }}
              className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/70 text-[10px] font-bold uppercase tracking-wider hover:bg-white/10 transition-all font-sans"
            >
              Cancelar
            </button>
          </div>
        )}

        {calendarMode === 'events' ? (
          <>
            <MonthView
              currentDate={currentDate}
              selectedDate={selectedDate}
              eventsByDate={eventsByDate}
              onDateClick={(date) => handleDayClickForScheduler(date)}
              onPrevMonth={goToPreviousMonth}
              onNextMonth={goToNextMonth}
              onMonthClick={() => { }} // TODO: Selector de mes
            />

            {/* Detalle del día seleccionado - DEBAJO DEL CALENDARIO como en cliente */}
            {selectedDate && (
              <div className="mt-4">
                <div className="mb-3">
                  {/* Inline Scheduler - Aparece primero si está activo */}
                  {showQuickScheduler && quickSchedulerDate && (
                    <div className="mb-4">
                      <InlineMeetScheduler
                        selectedDate={quickSchedulerDate}
                        existingEvents={dayEvents}
                        onConfirm={handleQuickSchedulerConfirm}
                        onCancel={handleQuickSchedulerCancel}
                        checkOverlap={checkOverlap}
                        meetTitle={meetToReschedule?.title || 'Meet nueva'}
                        isRescheduling={isRescheduling}
                      />
                    </div>
                  )}

                  {/* Only show activities list when scheduler is NOT active */}
                  {!showQuickScheduler && (
                    <>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-semibold text-white/95">Actividades · {dateLabel}</h3>
                      </div>

                      {/* Sección de Meets */}
                      {meetEvents.length > 0 && (
                        <div className="mt-4 mb-4">
                          <div className="text-[11px] tracking-widest text-white/45 mb-2">MEET</div>
                          <div className="space-y-2">
                            {meetEvents.map((m) => {
                              const start = new Date(m.start_time)
                              const end = m.end_time ? new Date(m.end_time) : null
                              const label = `${format(start, 'HH:mm')}${end && !Number.isNaN(end.getTime()) ? ` – ${format(end, 'HH:mm')}` : ''}`
                              const isPending = String(m.rsvp_status || 'pending') === 'pending'
                              const isCancelled = m.status === 'cancelled'

                              const handleEnter = () => {
                                if (!isPending && m.meet_link) {
                                  try {
                                    window.open(String(m.meet_link), '_blank', 'noopener,noreferrer')
                                    return
                                  } catch {
                                    // fallback
                                  }
                                }
                                setSelectedMeetEvent(m)
                              }

                              return (
                                <div
                                  key={m.id}
                                  className={
                                    `w-full rounded-2xl border px-4 py-3 flex items-center justify-between gap-3 transition-all duration-200 select-none ` +
                                    (isCancelled
                                      ? 'border-red-500/20 bg-red-500/5 opacity-80 backdrop-blur-md'
                                      : (m.is_ghost
                                        ? 'border-white/10 bg-white/5 border-dashed opacity-60 hover:opacity-100 hover:border-white/20 active:scale-[0.98] cursor-pointer'
                                        : 'border-white/10 bg-white/5 hover:bg-white/10 backdrop-blur-md hover:border-white/20 active:scale-[0.98] cursor-pointer'))
                                  }
                                  role="button"
                                  tabIndex={0}
                                  onClick={() => setSelectedMeetEvent(m)}
                                >
                                  <div className="flex items-center gap-3 min-w-0">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${isCancelled ? 'bg-red-500/10 text-red-500 border border-red-500/20' : (m.is_ghost ? 'bg-white/5 text-white/40 border border-white/5' : (isPending ? 'bg-[#FF7939]/10 text-[#FF7939] border border-[#FF7939]/20' : 'bg-white/5 text-white/70 border border-white/10'))}`}>
                                      {m.event_type === 'workshop' ? (
                                        <CalendarIcon className="h-5 w-5" />
                                      ) : (
                                        <Video className="h-5 w-5" />
                                      )}
                                    </div>
                                    <div className="min-w-0">
                                      <div className="text-sm font-bold text-white truncate leading-snug">{m.title ? String(m.title) : 'Meet'}</div>
                                      <div className="flex items-center gap-2 mt-0.5">
                                        <div className="text-[11px] text-white/50 font-medium">{label}</div>
                                        {isCancelled && <span className="text-[9px] font-bold uppercase text-red-500 px-1.5 py-0.5 rounded bg-red-500/10 border border-red-500/20">Cancelada</span>}
                                        {m.is_ghost && <span className="text-[9px] font-bold uppercase text-[#FFB366] px-1.5 py-0.5 rounded bg-[#FFB366]/10 border border-[#FFB366]/20">Propuesta</span>}
                                        {m.event_type === 'workshop' && <span className="text-[9px] font-bold uppercase text-[#FF7939] px-1.5 py-0.5 rounded bg-[#FF7939]/10 border border-[#FF7939]/20">Taller</span>}
                                      </div>
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    disabled={isCancelled}
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleEnter()
                                    }}
                                    className={
                                      `h-8 px-4 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-all ` +
                                      (isCancelled
                                        ? 'border-transparent bg-white/5 text-white/20 cursor-not-allowed'
                                        : 'border-[#FF7939]/60 text-[#FFB366] bg-[#FF7939]/5 hover:bg-[#FF7939] hover:text-black shadow-[0_4px_12px_rgba(255,121,57,0.2)]')
                                    }
                                  >
                                    {(() => {
                                      if (isCancelled) return 'Cancelada'
                                      if (m.is_ghost) return 'Propuesta sugerida'

                                      // Check for pending reschedule requests first
                                      if (m.pending_reschedule?.status === 'pending') {
                                        return m.pending_reschedule.requested_by_user_id === coachId
                                          ? 'Cambio pedido'
                                          : 'Responder cambio'
                                      }

                                      if (new Date(m.end_time || m.start_time) < new Date()) return 'Finalizada'
                                      if (isToday(new Date(m.start_time))) return 'Unirse'

                                      // If it's confirmed or rescheduled-and-accepted
                                      if (m.status === 'scheduled' || m.status === 'rescheduled') return 'Confirmada'

                                      if (isPending) return 'Pendiente de confirmar'
                                      return 'Confirmada'
                                    })()}
                                  </button>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}

                      {/* Otros eventos */}
                      {otherEvents.length > 0 && (
                        <div className="mb-4">
                          <div className="text-[11px] tracking-widest text-white/45 mb-2 uppercase">Otros Eventos</div>
                          <div className="space-y-2">
                            {otherEvents.map((event) => {
                              const isGoogleEvent = event.is_google_event || event.source === 'google_calendar'
                              const start = new Date(event.start_time)
                              const end = event.end_time ? new Date(event.end_time) : null
                              const label = `${format(start, 'HH:mm')}${end && !Number.isNaN(end.getTime()) ? ` – ${format(end, 'HH:mm')}` : ''}`

                              return (
                                <div
                                  key={event.id}
                                  onClick={() => !isGoogleEvent && setSelectedMeetEvent(event)}
                                  className={`
                                        w-full rounded-2xl border px-4 py-3 transition-all duration-200
                                        ${isGoogleEvent
                                      ? 'border-blue-500/20 bg-blue-500/5 backdrop-blur-md'
                                      : 'border-white/10 bg-white/5 hover:bg-white/10 backdrop-blur-md hover:border-white/20 cursor-pointer active:scale-[0.98]'
                                    }
                                      `}
                                >
                                  <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${isGoogleEvent ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-white/5 text-white/70 border border-white/10'}`}>
                                      <CalendarIcon className="h-5 w-5" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <div className="text-sm font-bold text-white truncate leading-snug">{event.title || 'Evento'}</div>
                                      <div className="flex items-center gap-2 mt-0.5">
                                        <div className="text-[11px] text-white/50 font-medium">{label}</div>
                                        {isGoogleEvent && (
                                          <span className="text-[9px] font-bold uppercase text-blue-400 px-1.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/20">
                                            Google
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}

                      {/* Empty state */}
                      {dayEvents.length === 0 && (
                        <div className="mt-4 text-center py-8">
                          <p className="text-sm text-gray-400">No hay eventos programados para este día</p>
                        </div>
                      )}
                    </>
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

      {/* Modales */}
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

      {/* Meet Detail Modal */}
      {selectedMeetEvent && (
        <MeetDetailModal
          selectedMeetEvent={selectedMeetEvent}
          setSelectedMeetEvent={setSelectedMeetEvent}
          pendingReschedule={pendingReschedule}
          setPendingReschedule={setPendingReschedule}
          selectedMeetParticipants={selectedMeetParticipants}
          coachProfiles={[]}
          authUserId={coachId}
          onReschedule={(meet) => {
            handleStartReschedule(meet)
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

      {/* Meet Confirmation Modal */}
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
            end_time: meetToReschedule.end_time || ''
          } : undefined}
        />
      )}

      {/* Sync Status Overlay */}
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
    <Suspense fallback={<div>Cargando...</div>}>
      <CoachCalendarContent />
    </Suspense>
  )
}