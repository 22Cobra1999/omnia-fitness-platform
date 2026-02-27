"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { createClient } from '@/lib/supabase/supabase-client'
import { format, startOfWeek } from "date-fns"
import { useToast } from "@/components/ui/use-toast"
import { createCheckoutProPreference, redirectToMercadoPagoCheckout } from '@/lib/mercadopago/checkout-pro'
import { OmniaLoader } from "@/components/shared/ui/omnia-loader"
import { useCalendarData } from "./hooks/useCalendarData"
import { useMeetLogic } from "./hooks/useMeetLogic"
import { useCoachAvailability } from "./hooks/useCoachAvailability"
import { snapTo15Mins } from "./CalendarViewHelpers"

// Modular Views
import { CalendarHeader } from "./views/CalendarHeader"
import { CalendarMonthView } from "./views/CalendarMonthView"
import { CalendarWeekView } from "./views/CalendarWeekView"
import { CalendarDayView } from "./views/CalendarDayView"
import { CalendarModals } from "./views/CalendarModals"

// Components needed for logic
import { CalendarCoachSelector } from "./components/CalendarCoachSelector"

// Refactored Hooks & Helpers
import { useCalendarViewNavigation } from "./hooks/useCalendarViewNavigation"
import { useCalendarEditMode } from "./hooks/useCalendarEditMode"
import { useCalendarCoachPicker } from "./hooks/useCalendarCoachPicker"
import { renderClientEvents } from "./config/event-layout"

interface CalendarViewProps {
  activityIds: string[]
  onActivityClick: (activityId: string) => void
  scheduleMeetContext?: {
    coachId: string
    activityId?: string
    source?: string
    purchase?: {
      kind: 'consultation'
      durationMinutes: number
      price: number
      label: string
    }
  } | null
  onSetScheduleMeetContext?: (ctx: {
    coachId: string
    activityId?: string
    source?: string
    purchase?: {
      kind: 'consultation'
      durationMinutes: number
      price: number
      label: string
    }
  } | null) => void
}

export default function CalendarView({ activityIds, onActivityClick, scheduleMeetContext, onSetScheduleMeetContext }: CalendarViewProps) {
  const { toast } = useToast()
  const supabase = useMemo(() => createClient(), [])

  // Hydration fix
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  /* -------------------------------------------------------------------------- */
  /*                                    HOOKS                                   */
  /* -------------------------------------------------------------------------- */

  // 1. Navigation Hook
  const {
    currentDate, setCurrentDate,
    meetViewMode, setMeetViewMode,
    meetWeekStart, setMeetWeekStart,
    monthLabel, previousMonth, nextMonth, goToToday
  } = useCalendarViewNavigation()

  const selectedCoachId = scheduleMeetContext?.coachId ? String(scheduleMeetContext.coachId) : null
  const purchaseContext = scheduleMeetContext?.purchase
  const isPaidMeetFlow = purchaseContext?.kind === 'consultation'

  // 2. Calendar Data Hook
  const {
    selectedDate, setSelectedDate,
    authUserId, activitiesByDate, dayMinutesByDate,
    meetEventsByDate, setMeetEventsByDate,
    selectedDayActivityItems, activitiesInfo,
    loadDayMinutes
  } = useCalendarData(activityIds, meetViewMode, meetWeekStart, currentDate)

  // Derived: Purchased Coach Ids
  const purchasedCoachIds = useMemo(() => {
    const ids = new Set<string>()
    Object.values(activitiesInfo || {}).forEach((a: any) => {
      const cid = String(a?.coach_id || '')
      if (cid) ids.add(cid)
    })
    return Array.from(ids)
  }, [activitiesInfo])

  // 3. Meet Logic Hook
  const {
    selectedMeetEvent, setSelectedMeetEvent,
    selectedMeetParticipants, setSelectedMeetParticipants,
    meetCreditsByCoachId, pendingReschedule, setPendingReschedule,
    meetNotificationsCount, setMeetNotificationsCount,
    openMeetById, selectedMeetRsvpStatus, setSelectedMeetRsvpStatus
  } = useMeetLogic(authUserId, meetEventsByDate, purchasedCoachIds)

  // 4. Edit Mode Hook
  const [sourceDate, setSourceDate] = useState<Date | null>(null)
  const [targetDate, setTargetDate] = useState<Date | null>(null)
  const {
    isEditing, setIsEditing, toggleEditMode,
    showConfirmModal, setShowConfirmModal,
    applyToAllSameDays, setApplyToAllSameDays,
    isUpdating, handleConfirmUpdate, getDayName
  } = useCalendarEditMode({
    supabase, authUserId,
    sourceDate, setSourceDate,
    targetDate, setTargetDate
  })

  // 5. Coach Picker Hook
  const [selectedMeetRequest, setSelectedMeetRequest] = useState<any>(null)
  const [meetPurchasePaid, setMeetPurchasePaid] = useState(false)

  const {
    showCoachRow, setShowCoachRow,
    showAddMenu, setShowAddMenu,
    coachProfiles,
    selectedConsultationType, setSelectedConsultationType,
    handlePickCoachForMeet, handleClearCoachForMeet,
    applyConsultationSelection, selectedCoachProfile
  } = useCalendarCoachPicker({
    supabase, selectedCoachId, purchasedCoachIds,
    scheduleMeetContext, onSetScheduleMeetContext,
    setMeetViewMode, setSelectedMeetRequest,
    setMeetPurchasePaid, setSelectedMeetEvent
  })

  // 6. Coach Availability Hook
  const getDurationMinutes = (type: 'express' | 'puntual' | 'profunda') => {
    switch (type) {
      case 'express': return 15
      case 'puntual': return 30
      case 'profunda': return 60
      default: return 30
    }
  }

  const {
    coachConsultations,
    getSlotsForDate,
    availableSlotsCountByDay
  } = useCoachAvailability(
    selectedCoachId,
    meetViewMode,
    meetWeekStart,
    currentDate,
    getDurationMinutes(selectedConsultationType)
  )

  const [loading, setLoading] = useState(true)
  const [showMeetNotifications, setShowMeetNotifications] = useState(false)

  const [reschedulePreview, setReschedulePreview] = useState<any>(null)
  const [rescheduleContext, setRescheduleContext] = useState<any>(null)
  const [selectedMeetRsvpLoading, setSelectedMeetRsvpLoading] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [successModalData, setSuccessModalData] = useState<any>(null)

  useEffect(() => {
    if (isMounted) {
      const timer = setTimeout(() => setLoading(false), 500)
      return () => clearTimeout(timer)
    }
  }, [isMounted])

  const dayDetailRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!isPaidMeetFlow) {
      setMeetPurchasePaid(false)
      return
    }
    if (typeof window === 'undefined') return
    try {
      const url = new URL(window.location.href)
      const purchaseSuccess = url.searchParams.get('purchase_success')
      const activityIdParam = url.searchParams.get('activity_id')
      const preferenceId = url.searchParams.get('preference_id')
      const paymentId = url.searchParams.get('payment_id')

      const ctxActivityId = scheduleMeetContext?.activityId ? String(scheduleMeetContext.activityId) : null
      const sameActivity = !!ctxActivityId && !!activityIdParam && String(activityIdParam) === String(ctxActivityId)

      const showSuccess = sessionStorage.getItem('show_purchase_success') === 'true'
      const storedActivityId = sessionStorage.getItem('last_purchase_activity_id')
      const sameStored = !!ctxActivityId && !!storedActivityId && String(storedActivityId) === String(ctxActivityId)

      if ((purchaseSuccess === 'true' || showSuccess) && (sameActivity || sameStored) && (preferenceId || paymentId)) {
        setMeetPurchasePaid(true)
        url.searchParams.delete('purchase_success')
        url.searchParams.delete('preference_id')
        url.searchParams.delete('payment_id')
        url.searchParams.delete('activity_id')
        url.searchParams.delete('status')
        window.history.replaceState({}, '', url.toString())
        sessionStorage.removeItem('show_purchase_success')
      }
    } catch { /* ignore */ }
  }, [isPaidMeetFlow, scheduleMeetContext?.activityId])

  const handleDateClick = (date: Date) => {
    if (isEditing) {
      if (!sourceDate) {
        setSourceDate(date)
      } else {
        setTargetDate(date)
        setShowConfirmModal(true)
      }
      return
    }
    setSelectedDate(date)
    if (selectedCoachId) {
      const key = format(date, 'yyyy-MM-dd')
      if ((availableSlotsCountByDay?.[key] || 0) > 0) {
        setMeetViewMode('week')
        setMeetWeekStart(startOfWeek(date, { weekStartsOn: 1 }))
        return
      }
    }
    setTimeout(() => {
      dayDetailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 80)
  }

  const handleTimelineClick = (e: React.MouseEvent<HTMLButtonElement>, blockStart: string, blockEnd: string, dayKey: string) => {
    const slotDate = new Date(`${dayKey}T${blockStart}:00`)
    const now = new Date()
    const minTime = new Date(now.getTime() + 60 * 60 * 1000)

    if (slotDate < minTime) {
      toast({
        variant: "destructive",
        title: "Horario no disponible",
        description: "Las reservas deben realizarse con al menos 1 hora de anticipación."
      })
      return
    }

    const rect = e.currentTarget.getBoundingClientRect()
    const relativeY = e.clientY - rect.top
    const timeHHMM = snapTo15Mins(relativeY, rect.height, blockStart, blockEnd)

    setSelectedMeetRequest((prev: any) => ({
      coachId: String(selectedCoachId),
      dayKey,
      timeHHMM,
      title: rescheduleContext?.snapshot?.title || prev?.title || 'Meet',
      description: rescheduleContext?.snapshot?.description || prev?.description || '',
    }))
    setMeetViewMode('day_split')
    const d = new Date(dayKey + 'T12:00:00')
    setSelectedDate(d)
    setMeetWeekStart(startOfWeek(d, { weekStartsOn: 1 }))
  }

  const handleRenderClientEvents = (dayKey: string) => {
    return renderClientEvents({
      dayKey,
      meetEventsByDate,
      selectedMeetRequest,
      coachConsultations,
      selectedConsultationType,
      openMeetById
    })
  }

  if (!isMounted) return null

  return (
    <div className="p-4 text-white w-full max-w-full overflow-x-hidden">
      {loading ? (
        <div className="flex items-center justify-center h-full min-h-[400px]">
          <OmniaLoader />
        </div>
      ) : (
        <>
          <CalendarCoachSelector
            showCoachRow={showCoachRow}
            selectedCoachId={selectedCoachId}
            coachProfiles={coachProfiles}
            meetCreditsByCoachId={meetCreditsByCoachId}
            handlePickCoachForMeet={handlePickCoachForMeet}
            handleClearCoachForMeet={handleClearCoachForMeet}
            isPaidMeetFlow={isPaidMeetFlow}
            selectedConsultationType={selectedConsultationType}
            applyConsultationSelection={(type) => applyConsultationSelection(type, coachConsultations)}
            coachConsultations={coachConsultations}
          />

          <CalendarHeader
            title={monthLabel}
            onPrev={previousMonth}
            onNext={nextMonth}
            onToday={goToToday}
            meetViewMode={meetViewMode}
            meetNotificationsCount={meetNotificationsCount}
            onNotificationsClick={() => setShowMeetNotifications(true)}
            onAddClick={() => setShowCoachRow(!showCoachRow)}
            isAddSectionOpen={showCoachRow}
          />

          {meetViewMode === 'month' && (
            <CalendarMonthView
              currentDate={currentDate}
              activitiesByDate={activitiesByDate}
              dayMinutesByDate={dayMinutesByDate}
              meetEventsByDate={meetEventsByDate}
              availableSlotsCountByDay={availableSlotsCountByDay}
              selectedDate={selectedDate!!}
              onSelectDate={handleDateClick}
              isEditing={isEditing}
              sourceDate={sourceDate}
              selectedDayActivityItems={selectedDayActivityItems}
              setSelectedMeetEvent={setSelectedMeetEvent}
              onActivityClick={onActivityClick}
              dayDetailRef={dayDetailRef}
              meetViewMode={meetViewMode}
              authUserId={authUserId}
              coachProfiles={coachProfiles}
            />
          )}

          {meetViewMode === 'week' && selectedCoachId && (
            <CalendarWeekView
              meetWeekStart={meetWeekStart}
              setMeetWeekStart={setMeetWeekStart}
              selectedDate={selectedDate!!}
              setSelectedDate={setSelectedDate}
              setMeetViewMode={setMeetViewMode}
              getSlotsForDate={getSlotsForDate}
              handleTimelineClick={handleTimelineClick}
              renderClientEvents={handleRenderClientEvents}
              dayMinutesByDate={dayMinutesByDate}
              selectedMeetRequest={selectedMeetRequest}
              setSelectedMeetRequest={setSelectedMeetRequest}
              setSelectedMeetEvent={setSelectedMeetEvent}
            />
          )}

          {meetViewMode === 'day_split' && selectedCoachId && selectedDate && (
            <CalendarDayView
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              setMeetViewMode={setMeetViewMode}
              rescheduleContext={rescheduleContext}
              setRescheduleContext={setRescheduleContext}
              setSelectedMeetRequest={setSelectedMeetRequest}
              setSelectedMeetEvent={setSelectedMeetEvent}
              activitiesByDate={activitiesByDate}
              dayMinutesByDate={dayMinutesByDate}
              renderClientEvents={handleRenderClientEvents}
              getSlotsForDate={getSlotsForDate}
              handleTimelineClick={handleTimelineClick}
              selectedMeetRequest={selectedMeetRequest}
              selectedConsultationType={selectedConsultationType}
              setSelectedConsultationType={setSelectedConsultationType}
              coachConsultations={coachConsultations}
              isPaidMeetFlow={isPaidMeetFlow}
              meetCreditsByCoachId={meetCreditsByCoachId}
              meetPurchasePaid={meetPurchasePaid}
              scheduleMeetContext={scheduleMeetContext}
              coachProfiles={coachProfiles}
              selectedCoachId={selectedCoachId}
              authUserId={authUserId}
              supabase={supabase}
              setSuccessModalData={setSuccessModalData}
              setShowSuccessModal={setShowSuccessModal}
              setSelectedMeetRsvpLoading={setSelectedMeetRsvpLoading}
              handleClearCoachForMeet={handleClearCoachForMeet}
              createCheckoutProPreference={createCheckoutProPreference}
              redirectToMercadoPagoCheckout={redirectToMercadoPagoCheckout}
              onSetScheduleMeetContext={onSetScheduleMeetContext}
              selectedMeetRsvpLoading={selectedMeetRsvpLoading}
              onEventUpdated={() => loadDayMinutes()}
              setMeetEventsByDate={setMeetEventsByDate}
            />
          )}

          <CalendarModals
            supabase={supabase}
            authUserId={authUserId}
            showMeetNotifications={showMeetNotifications}
            setShowMeetNotifications={setShowMeetNotifications}
            openMeetById={openMeetById}
            rescheduleContext={rescheduleContext}
            setRescheduleContext={setRescheduleContext}
            reschedulePreview={reschedulePreview}
            setReschedulePreview={setReschedulePreview}
            setMeetViewMode={setMeetViewMode}
            setSelectedMeetEvent={setSelectedMeetEvent}
            showConfirmModal={showConfirmModal}
            setShowConfirmModal={setShowConfirmModal}
            sourceDate={sourceDate}
            targetDate={targetDate}
            getDayName={(date: Date) => getDayName(date.getDay())}
            applyToAllSameDays={applyToAllSameDays}
            setApplyToAllSameDays={setApplyToAllSameDays}
            handleConfirmUpdate={handleConfirmUpdate}
            isUpdating={isUpdating}
            selectedMeetEvent={selectedMeetEvent}
            pendingReschedule={pendingReschedule}
            setPendingReschedule={setPendingReschedule}
            selectedMeetParticipants={selectedMeetParticipants}
            coachProfiles={coachProfiles}
            setSelectedMeetParticipants={setSelectedMeetParticipants}
            meetEventsByDate={meetEventsByDate}
            setMeetEventsByDate={setMeetEventsByDate}
            selectedMeetRsvpStatus={selectedMeetRsvpStatus}
            setSelectedMeetRsvpStatus={setSelectedMeetRsvpStatus}
            selectedMeetRsvpLoading={selectedMeetRsvpLoading}
            setSelectedMeetRsvpLoading={setSelectedMeetRsvpLoading}
            handlePickCoachForMeet={handlePickCoachForMeet}
            setMeetWeekStart={setMeetWeekStart}
            selectedMeetRequest={selectedMeetRequest}
            setSelectedMeetRequest={setSelectedMeetRequest}
            meetCreditsByCoachId={meetCreditsByCoachId}
            isPaidMeetFlow={isPaidMeetFlow}
            purchaseContext={purchaseContext}
            meetPurchasePaid={meetPurchasePaid}
            onSetScheduleMeetContext={onSetScheduleMeetContext!}
            selectedCoachId={selectedCoachId}
            selectedCoachProfile={selectedCoachProfile}
            handleClearCoachForMeet={handleClearCoachForMeet}
            setSuccessModalData={setSuccessModalData}
            setShowSuccessModal={setShowSuccessModal}
            createCheckoutProPreference={createCheckoutProPreference}
            redirectToMercadoPagoCheckout={redirectToMercadoPagoCheckout}
            scheduleMeetContext={scheduleMeetContext}
            showSuccessModal={showSuccessModal}
            successModalData={successModalData}
          />
        </>
      )}
    </div>
  )
}


