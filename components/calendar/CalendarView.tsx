"use client"

import { useState, useEffect, useMemo, useRef, useCallback } from "react"
import { createClient } from '@/lib/supabase/supabase-client'
import { format, isToday, startOfWeek } from "date-fns"
import { Video } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent } from "@/components/ui/card"
import { MeetNotificationsModal } from "@/components/shared/meet-notifications-modal"
import { createCheckoutProPreference, redirectToMercadoPagoCheckout } from '@/lib/mercadopago/checkout-pro'
import dynamic from 'next/dynamic'
import { OmniaLoader } from "@/components/shared/ui/omnia-loader"
import { useCalendarData } from "./hooks/useCalendarData"
import { useMeetLogic } from "./hooks/useMeetLogic"
import { useCoachAvailability } from "./hooks/useCoachAvailability"
import { CalendarHeader } from "./components/CalendarHeader"
import { CalendarMonthGrid } from "./components/CalendarMonthGrid"
import { START_HOUR, TOTAL_MINS, toMins } from "./utils"
import { CalendarDaySplitView } from "./components/CalendarDaySplitView"
import { CalendarWeekView } from "./components/CalendarWeekView"
import { CalendarDayDetail } from "./components/CalendarDayDetail"
import { CalendarRescheduleModal } from "./components/CalendarRescheduleModal"
import { CalendarBookingModal } from "./components/CalendarBookingModal"
import { CalendarSuccessModal } from "./components/CalendarSuccessModal"
import { CalendarMoveActivitiesModal } from "./components/CalendarMoveActivitiesModal"
import { CalendarCoachSelector } from "./components/CalendarCoachSelector"
import { CalendarEditOverlay } from "./components/CalendarEditOverlay"

// Refactored Hooks & Helpers
import { useCalendarViewNavigation } from "./hooks/useCalendarViewNavigation"
import { useCalendarEditMode } from "./hooks/useCalendarEditMode"
import { useCalendarCoachPicker } from "./hooks/useCalendarCoachPicker"
import { getSmartLayout, snapTo15Mins } from "./CalendarViewHelpers"

const MeetDetailModal = dynamic(() => import('./MeetDetailModal').then(ctx => ctx.MeetDetailModal), {
  loading: () => <div className="fixed inset-0 z-[70] bg-black/60 flex items-center justify-center p-4"><div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl p-10 flex items-center justify-center"><OmniaLoader /></div></div>,
  ssr: false
})

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
  } = useCalendarData(activityIds, meetViewMode, meetWeekStart)

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

  const renderClientEvents = (dayKey: string) => {
    const rawEvents = [...(meetEventsByDate[dayKey] || [])]
    if (selectedMeetRequest && selectedMeetRequest.dayKey === dayKey) {
      const duration = coachConsultations[selectedConsultationType]?.time || 30
      const startIso = `${dayKey}T${selectedMeetRequest.timeHHMM}:00`
      const [h, m] = selectedMeetRequest.timeHHMM.split(':').map(Number)
      const totalMins = h * 60 + m + duration
      const endH = Math.floor(totalMins / 60)
      const endM = totalMins % 60
      const endIso = `${dayKey}T${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}:00`

      rawEvents.push({
        id: 'ghost-block',
        title: selectedMeetRequest.title || 'Nuevo Meet',
        start_time: startIso,
        end_time: endIso,
        isGhost: true
      } as any)
    }

    const sorted = [...rawEvents].sort((a, b) => a.start_time.localeCompare(b.start_time))
    const clusters: any[][] = []
    let currentCluster: any[] = []
    let clusterEnd = 0

    sorted.forEach(ev => {
      const startVal = parseInt(ev.start_time.split('T')[1].replace(':', ''))
      const endVal = ev.end_time
        ? parseInt(ev.end_time.split('T')[1].replace(':', ''))
        : startVal + 30

      if (currentCluster.length === 0) {
        currentCluster.push(ev)
        clusterEnd = endVal
      } else if (startVal < clusterEnd) {
        currentCluster.push(ev)
        clusterEnd = Math.max(clusterEnd, endVal)
      } else {
        clusters.push(currentCluster)
        currentCluster = [ev]
        clusterEnd = endVal
      }
    })
    if (currentCluster.length > 0) clusters.push(currentCluster)

    return clusters.flatMap(cluster => {
      const layoutEvents = getSmartLayout(cluster)
      return layoutEvents.map((ev) => {
        const startMins = Number(ev.start_time.split('T')[1].substring(0, 5).split(':')[0]) * 60 + Number(ev.start_time.split('T')[1].substring(0, 5).split(':')[1])
        const endMins = ev.end_time
          ? Number(ev.end_time.split('T')[1].substring(0, 5).split(':')[0]) * 60 + Number(ev.end_time.split('T')[1].substring(0, 5).split(':')[1])
          : startMins + 30

        const duration = endMins - startMins
        const top = ((startMins - START_HOUR * 60) / TOTAL_MINS) * 100
        const height = (duration / TOTAL_MINS) * 100
        if (top < 0) return null

        const width = 100 / ev.totalCols
        const style = {
          top: `${top}%`,
          height: `${height}%`,
          width: `calc(${width}% - 3px)`,
          left: `calc(${(ev.colIndex || 0) * width}% + 1.5px)`,
        }
        const isSmall = duration <= 30
        const isGhost = ev.isGhost === true

        return (
          <div
            key={ev.id}
            className={`absolute rounded-md border z-[30] overflow-hidden flex 
                    ${isSmall ? 'flex-row items-center px-1 gap-2' : 'flex-col justify-center px-2'} 
                    shadow-md pointer-events-auto hover:z-[50] transition-all 
                    ${isGhost ? 'bg-[#FF7939] border-white/20 select-none' : 'bg-zinc-900 border-[#FF7939] hover:bg-zinc-800'}`}
            style={style}
            onClick={(e) => {
              e.stopPropagation()
              if (!isGhost) openMeetById(ev.id)
            }}
          >
            <div className={`font-bold transition-colors truncate ${isGhost ? 'text-black text-[10px]' : 'text-white text-[10px]'}`}>
              {ev.title || 'Meet'}
            </div>
          </div>
        )
      })
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex-1 flex items-center justify-center min-h-[400px]">
          <OmniaLoader />
        </div>
      </div>
    )
  }

  if (!isMounted) return null

  return (
    <div className="p-4 text-white w-full max-w-full overflow-x-hidden">
      <MeetNotificationsModal
        open={showMeetNotifications}
        onClose={() => setShowMeetNotifications(false)}
        role="client"
        supabase={supabase}
        userId={authUserId || ''}
        onOpenMeet={(eventId) => openMeetById(eventId)}
      />

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

      <CalendarRescheduleModal
        rescheduleContext={rescheduleContext}
        reschedulePreview={reschedulePreview}
        setReschedulePreview={setReschedulePreview}
        setRescheduleContext={setRescheduleContext}
        setMeetViewMode={setMeetViewMode}
        setSelectedMeetEvent={setSelectedMeetEvent}
        supabase={supabase}
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

      <Card className="bg-zinc-900 border-zinc-800 w-full sm:max-w-none mt-4">
        <CardContent className="p-4">
          <CalendarEditOverlay
            isEditing={isEditing}
            sourceDate={sourceDate}
          />
          <div className="mt-4">
            {meetViewMode === 'month' ? (
              <CalendarMonthGrid
                currentDate={currentDate}
                activitiesByDate={activitiesByDate}
                dayMinutesByDate={dayMinutesByDate}
                meetEventsByDate={meetEventsByDate}
                availableSlotsCountByDay={availableSlotsCountByDay}
                selectedDate={selectedDate!!}
                onSelectDate={handleDateClick}
                isEditing={isEditing}
                sourceDate={sourceDate}
              />
            ) : meetViewMode === 'week' && selectedCoachId ? (
              <CalendarWeekView
                meetWeekStart={meetWeekStart}
                setMeetWeekStart={setMeetWeekStart}
                selectedDate={selectedDate!!}
                setSelectedDate={setSelectedDate}
                setMeetViewMode={setMeetViewMode}
                getSlotsForDate={getSlotsForDate}
                handleTimelineClick={handleTimelineClick}
                renderClientEvents={renderClientEvents}
                dayMinutesByDate={dayMinutesByDate}
                selectedMeetRequest={selectedMeetRequest}
                setSelectedMeetRequest={setSelectedMeetRequest}
                setSelectedMeetEvent={setSelectedMeetEvent}
              />
            ) : meetViewMode === 'day_split' && selectedCoachId && selectedDate ? (
              <CalendarDaySplitView
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
                setMeetViewMode={setMeetViewMode}
                rescheduleContext={rescheduleContext}
                setRescheduleContext={setRescheduleContext}
                setSelectedMeetRequest={setSelectedMeetRequest}
                setSelectedMeetEvent={setSelectedMeetEvent}
                activitiesByDate={activitiesByDate}
                dayMinutesByDate={dayMinutesByDate}
                renderClientEvents={renderClientEvents}
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
            ) : null}
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

      {selectedMeetEvent && (
        <MeetDetailModal
          selectedMeetEvent={selectedMeetEvent}
          setSelectedMeetEvent={setSelectedMeetEvent}
          pendingReschedule={pendingReschedule}
          setPendingReschedule={setPendingReschedule}
          selectedMeetParticipants={selectedMeetParticipants}
          coachProfiles={coachProfiles}
          authUserId={authUserId}
          setSelectedMeetParticipants={setSelectedMeetParticipants}
          meetEventsByDate={meetEventsByDate}
          setMeetEventsByDate={setMeetEventsByDate}
          selectedMeetRsvpStatus={selectedMeetRsvpStatus}
          setSelectedMeetRsvpStatus={setSelectedMeetRsvpStatus}
          selectedMeetRsvpLoading={selectedMeetRsvpLoading}
          setSelectedMeetRsvpLoading={setSelectedMeetRsvpLoading}
          setRescheduleContext={setRescheduleContext}
          handlePickCoachForMeet={handlePickCoachForMeet}
          setMeetViewMode={setMeetViewMode}
          setMeetWeekStart={setMeetWeekStart}
        />
      )}

      <CalendarBookingModal
        selectedMeetRequest={selectedMeetRequest}
        setSelectedMeetRequest={setSelectedMeetRequest}
        meetViewMode={meetViewMode}
        setMeetViewMode={setMeetViewMode}
        coachProfiles={coachProfiles}
        meetCreditsByCoachId={meetCreditsByCoachId}
        isPaidMeetFlow={isPaidMeetFlow}
        purchaseContext={purchaseContext}
        meetPurchasePaid={meetPurchasePaid}
        onSetScheduleMeetContext={(ctx) => onSetScheduleMeetContext?.(ctx)}
        authUserId={authUserId}
        selectedCoachId={selectedCoachId}
        selectedCoachProfile={selectedCoachProfile}
        rescheduleContext={rescheduleContext}
        setRescheduleContext={setRescheduleContext}
        setReschedulePreview={setReschedulePreview}
        handleClearCoachForMeet={handleClearCoachForMeet}
        setSuccessModalData={setSuccessModalData}
        setShowSuccessModal={setShowSuccessModal}
        supabase={supabase}
        createCheckoutProPreference={createCheckoutProPreference}
        redirectToMercadoPagoCheckout={redirectToMercadoPagoCheckout}
        scheduleMeetContext={scheduleMeetContext}
      />

      <CalendarSuccessModal
        show={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        data={successModalData}
      />

      <CalendarMoveActivitiesModal
        open={showConfirmModal}
        onOpenChange={setShowConfirmModal}
        sourceDate={sourceDate}
        targetDate={targetDate}
        getDayName={getDayName}
        applyToAllSameDays={applyToAllSameDays}
        setApplyToAllSameDays={setApplyToAllSameDays}
        handleConfirmUpdate={handleConfirmUpdate}
        isUpdating={isUpdating}
        onCancel={() => setShowConfirmModal(false)}
      />
    </div>
  )
}
