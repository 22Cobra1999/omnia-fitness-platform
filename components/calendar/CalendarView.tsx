"use client"

import { useState, useEffect, useMemo, useRef, Fragment, useCallback } from "react"
import { createClient } from '@/lib/supabase/supabase-client'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, addMonths, subMonths, startOfWeek, addDays } from "date-fns"
import { es } from "date-fns/locale"
import { Bell, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, Flame, Plus, Minus, Utensils, X, Zap, Target, GraduationCap, CheckCircle2, XCircle, Ban, Users, User, RotateCcw, ArrowRight, AlertTriangle, Globe, Video } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Image from "next/image"
import { MeetNotificationsModal } from "@/components/shared/meet-notifications-modal"
import { createCheckoutProPreference, redirectToMercadoPagoCheckout } from '@/lib/mercadopago/checkout-pro'
import dynamic from 'next/dynamic'
import { OmniaLoader } from "@/components/shared/ui/omnia-loader"
import { useCalendarData } from "./hooks/useCalendarData"
import { useMeetLogic } from "./hooks/useMeetLogic"
import { useCoachAvailability } from "./hooks/useCoachAvailability"
import { CalendarHeader } from "./components/CalendarHeader"
import { CalendarMonthGrid } from "./components/CalendarMonthGrid"
import { formatMinutes, START_HOUR, END_HOUR, TOTAL_MINS, toMins, add30, getTop, getHeight, coalesceSlots } from "./utils"
import { CalendarDaySplitView } from "./components/CalendarDaySplitView"
import { CalendarWeekView } from "./components/CalendarWeekView"
import { CalendarDayDetail } from "./components/CalendarDayDetail"
import { CalendarRescheduleModal } from "./components/CalendarRescheduleModal"
import { CalendarBookingModal } from "./components/CalendarBookingModal"
import { CalendarSuccessModal } from "./components/CalendarSuccessModal"
import { CalendarMoveActivitiesModal } from "./components/CalendarMoveActivitiesModal"
import { CalendarCoachSelector } from "./components/CalendarCoachSelector"
import { CalendarHeaderActions } from "./components/CalendarHeaderActions"
import { CalendarMonthHeader } from "./components/CalendarMonthHeader"
import { CalendarEditOverlay } from "./components/CalendarEditOverlay"

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
  const supabase = useMemo(() => createClient(), [])

  // Hydration fix: ensure consistent initial render or handle mount
  const [isMounted, setIsMounted] = useState(false)
  useEffect(() => {
    setIsMounted(true)
  }, [])

  /* -------------------------------------------------------------------------- */
  /*                                    HOOKS                                   */
  /* -------------------------------------------------------------------------- */

  // View Control State (Needed for Hooks)
  const [meetViewMode, setMeetViewMode] = useState<'month' | 'week' | 'day_split'>('month')
  const [meetWeekStart, setMeetWeekStart] = useState<Date>(startOfWeek(new Date(), { weekStartsOn: 1 }))
  const selectedCoachId = scheduleMeetContext?.coachId ? String(scheduleMeetContext.coachId) : null
  const purchaseContext = scheduleMeetContext?.purchase
  const isPaidMeetFlow = purchaseContext?.kind === 'consultation'

  // 1. Calendar Data Hook
  const {
    currentDate,
    setCurrentDate,
    selectedDate,
    setSelectedDate,
    authUserId,
    activitiesByDate,
    dayMinutesByDate,
    meetEventsByDate,
    setMeetEventsByDate,
    selectedDayActivityItems,
    activitiesInfo,
    loadDayMinutes,
    loadSelectedDayBreakdown
  } = useCalendarData(activityIds, meetViewMode, meetWeekStart)

  // Derived: Purchased Coach Ids (for availability/credits)
  const purchasedCoachIds = useMemo(() => {
    const ids = new Set<string>()
    Object.values(activitiesInfo || {}).forEach((a: any) => {
      const cid = String(a?.coach_id || '')
      if (cid) ids.add(cid)
    })
    return Array.from(ids)
  }, [activitiesInfo])

  // 2. Meet Logic Hook
  const {
    selectedMeetEvent,
    setSelectedMeetEvent,
    selectedMeetParticipants,
    meetCreditsByCoachId,
    pendingReschedule,
    setPendingReschedule,
    meetNotificationsCount,
    setMeetNotificationsCount,
    openMeetById
  } = useMeetLogic(authUserId, meetEventsByDate, purchasedCoachIds)

  // State for Consultation Type (Must be before useCoachAvailability)
  const [selectedConsultationType, setSelectedConsultationType] = useState<'express' | 'puntual' | 'profunda'>(() => {
    const mins = Number(scheduleMeetContext?.purchase?.durationMinutes ?? 30) || 30
    if (mins <= 15) return 'express'
    if (mins >= 60) return 'profunda'
    return 'puntual'
  })

  // 3. Coach Availability Hook
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
    coachAvailabilityRows,
    bookedSlotsByDay,
    bookedSlotsByDayMonth,
    getSlotsForDate,
    availableSlotsCountByDay
  } = useCoachAvailability(
    selectedCoachId,
    meetViewMode,
    meetWeekStart,
    currentDate,
    getDurationMinutes(selectedConsultationType)
  )

  // Edit Mode States
  const [isEditing, setIsEditing] = useState(false)
  const [sourceDate, setSourceDate] = useState<Date | null>(null)
  const [targetDate, setTargetDate] = useState<Date | null>(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [applyToAllSameDays, setApplyToAllSameDays] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  const [showAddMenu, setShowAddMenu] = useState(false)
  const [showCoachRow, setShowCoachRow] = useState(false)
  const [coachProfiles, setCoachProfiles] = useState<Array<{ id: string; full_name: string; avatar_url?: string | null }>>([])

  const [reschedulePreview, setReschedulePreview] = useState<
    | {
      dayKey: string
      timeHHMM: string
      toStartIso: string
      toEndIso: string
      note: string
    }
    | null
  >(null)
  const [rescheduleContext, setRescheduleContext] = useState<
    | {
      eventId: string
      coachId: string
      fromStart: string
      fromEnd: string | null
      durationMinutes: number
      snapshot: {
        id: string
        title?: string | null
        start_time: string
        end_time: string | null
        coach_id?: string | null
        meet_link?: string | null
        description?: string | null
      }
    }
    | null
  >(null)

  // Stats per activity (ID -> { minutes })
  const [activityStats, setActivityStats] = useState<Record<string, { minutes: number }>>({})

  const requiredSlotBlocks = useMemo(() => {
    const mins = Number(rescheduleContext?.durationMinutes ?? purchaseContext?.durationMinutes ?? 30) || 30
    return Math.max(1, Math.ceil(mins / 30))
  }, [purchaseContext?.durationMinutes, rescheduleContext?.durationMinutes])
  useEffect(() => {
    const mins = Number(scheduleMeetContext?.purchase?.durationMinutes ?? 0) || 0
    if (!mins) return
    if (mins <= 15) setSelectedConsultationType('express')
    else if (mins >= 60) setSelectedConsultationType('profunda')
    else setSelectedConsultationType('puntual')
  }, [scheduleMeetContext?.purchase?.durationMinutes])

  const [loading, setLoading] = useState(true)
  const [showMeetNotifications, setShowMeetNotifications] = useState(false)
  const [meetPurchasePaid, setMeetPurchasePaid] = useState(false)

  useEffect(() => {
    if (isMounted) {
      const timer = setTimeout(() => setLoading(false), 500)
      return () => clearTimeout(timer)
    }
  }, [isMounted])

  const applyConsultationSelection = useCallback(async (type: 'express' | 'puntual' | 'profunda') => {
    if (!selectedCoachId) return
    if (typeof window === 'undefined') return

    const consultation = coachConsultations[type]
    if (!consultation?.active || Number(consultation.price) <= 0) return

    setSelectedConsultationType(type)
    setMeetPurchasePaid(false)
    setSelectedMeetRequest(null)

    const durationMinutes = Number(consultation.time) || (type === 'express' ? 15 : type === 'profunda' ? 60 : 30)
    const price = Number(consultation.price) || 0
    const label = type === 'express' ? 'Meet 15 min' : type === 'puntual' ? 'Meet 30 min' : 'Meet 60 min'

    // Reusar activityId si ya se creó para este coach + tipo
    const cacheKey = `consultationActivityId:${String(selectedCoachId)}:${type}`
    const cached = localStorage.getItem(cacheKey)
    let activityId = cached ? String(cached) : ''

    if (!activityId) {
      try {
        const consultationTitle = type === 'express'
          ? 'Consulta Express - 15 min'
          : type === 'puntual'
            ? 'Consulta Puntual - 30 min'
            : 'Sesión Profunda - 60 min'

        const { data: inserted, error } = await (supabase
          .from('activities') as any)
          .insert({
            coach_id: selectedCoachId,
            title: consultationTitle,
            description: `Consulta con coach`,
            type: 'consultation',
            price,
            categoria: 'consultation',
            modality: 'online',
            is_public: false,
            is_active: true,
          })
          .select('id')
          .single()

        if (!error && inserted?.id != null) {
          activityId = String(inserted.id)
          try {
            localStorage.setItem(cacheKey, activityId)
          } catch {
            // ignore
          }
        }
      } catch {
        // ignore
      }
    }

    const nextCtx = {
      coachId: String(selectedCoachId),
      activityId: activityId || scheduleMeetContext?.activityId,
      source: scheduleMeetContext?.source || 'calendar',
      purchase: { kind: 'consultation' as const, durationMinutes, price, label },
    }

    try {
      localStorage.setItem('scheduleMeetContext', JSON.stringify(nextCtx))
    } catch {
      // ignore
    }
    onSetScheduleMeetContext?.(nextCtx)
  }, [coachConsultations, onSetScheduleMeetContext, scheduleMeetContext?.activityId, scheduleMeetContext?.source, selectedCoachId, supabase])
  const [selectedMeetRequest, setSelectedMeetRequest] = useState<
    | {
      coachId: string
      dayKey: string
      timeHHMM: string
      title: string
      description: string
    }
    | null
  >(null)
  /* UI States */
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [successModalData, setSuccessModalData] = useState<any>(null)

  const [confirmDeclineStep, setConfirmDeclineStep] = useState(false)
  const [selectedMeetRsvpLoading, setSelectedMeetRsvpLoading] = useState(false)
  const [selectedMeetRsvpStatus, setSelectedMeetRsvpStatus] = useState<string>('pending')

  const dayDetailRef = useRef<HTMLDivElement | null>(null)

  const selectedCoachProfile = useMemo(() => {
    if (!selectedCoachId) return null
    return coachProfiles.find((c) => c.id === selectedCoachId) || null
  }, [coachProfiles, selectedCoachId])

  useEffect(() => {
    const loadCoachProfiles = async () => {
      try {
        const ids = Array.from(
          new Set([
            ...(Array.isArray(purchasedCoachIds) ? purchasedCoachIds : []),
            selectedCoachId || '',
          ].filter((x) => !!x))
        )

        if (ids.length === 0) {
          setCoachProfiles([])
          return
        }

        const { data, error } = await (supabase
          .from('user_profiles') as any)
          .select('id, full_name, avatar_url')
          .in('id', ids)

        if (!error && data) {
          setCoachProfiles(data)
        }
      } catch {
        // ignore
      }
    }

    loadCoachProfiles()
  }, [purchasedCoachIds, selectedCoachId, supabase])

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

        // limpiar params
        url.searchParams.delete('purchase_success')
        url.searchParams.delete('preference_id')
        url.searchParams.delete('payment_id')
        url.searchParams.delete('activity_id')
        url.searchParams.delete('status')
        window.history.replaceState({}, '', url.toString())

        sessionStorage.removeItem('show_purchase_success')
        sessionStorage.removeItem('purchase_preference_id')
        sessionStorage.removeItem('purchase_payment_id')
      }
    } catch {
      // ignore
    }
  }, [isPaidMeetFlow, scheduleMeetContext?.activityId])


  const handlePickCoachForMeet = (coachId: string) => {
    const ctx = { coachId, source: 'calendar' as const }
    try {
      localStorage.setItem('scheduleMeetContext', JSON.stringify(ctx))
    } catch (e) {
      console.error('Error guardando scheduleMeetContext:', e)
    }
    onSetScheduleMeetContext?.(ctx)
    setShowCoachRow(false)
    setShowAddMenu(false)
  }

  const handleClearCoachForMeet = () => {
    try {
      localStorage.removeItem('scheduleMeetContext')
    } catch {
      // ignore
    }
    onSetScheduleMeetContext?.(null)
    setMeetViewMode('month')
    setSelectedMeetRequest(null)
    setSelectedMeetEvent(null)
    setMeetPurchasePaid(false)
  }

  // Navigation methods
  const previousMonth = () => setCurrentDate(subMonths(currentDate, 1))
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1))

  /* New logic for Edit Mode */
  const toggleEditMode = () => {
    if (isEditing) {
      setIsEditing(false)
      setSourceDate(null)
      setTargetDate(null)
      setShowConfirmModal(false)
    } else {
      setIsEditing(true)
      setSourceDate(null)
      setTargetDate(null)
    }
  }

  const getDayName = (dayIndex: number) => {
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
    return days[dayIndex] || ''
  }

  const handleConfirmUpdate = async () => {
    if (!selectedCoachId && !authUserId && !Boolean(activityIds.length)) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !sourceDate || !targetDate) return

    setIsUpdating(true)
    try {
      const sourceStr = format(sourceDate, 'yyyy-MM-dd')
      const targetStr = format(targetDate, 'yyyy-MM-dd')

      const { error: errorProg } = await (supabase
        .from('progreso_cliente') as any)
        .update({ fecha: targetStr })
        .eq('cliente_id', user.id)
        .eq('fecha', sourceStr)

      const { error: errorNut } = await (supabase
        .from('progreso_cliente_nutricion') as any)
        .update({ fecha: targetStr })
        .eq('cliente_id', user.id)
        .eq('fecha', sourceStr)

      if (errorProg || errorNut) throw new Error('Error al mover actividades')

      if (applyToAllSameDays) {
        const { data: futureProgress } = await (supabase
          .from('progreso_cliente') as any)
          .select('id, fecha')
          .eq('cliente_id', user.id)
          .gt('fecha', sourceStr)

        if (futureProgress && futureProgress.length > 0) {
          const dayOfWeek = sourceDate.getDay()
          const diffTime = targetDate.getTime() - sourceDate.getTime()
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

          const updates = futureProgress.filter((item: any) => {
            const d = new Date(item.fecha)
            const dLocal = new Date(d.getTime() + (d.getTimezoneOffset() * 60000))
            return dLocal.getDay() === dayOfWeek
          }).map((item: any) => {
            const d = new Date(item.fecha)
            const newD = new Date(d.getTime() + (diffDays * 24 * 60 * 60 * 1000))
            return {
              id: item.id,
              fecha: newD.toISOString().split('T')[0]
            }
          })

          if (updates.length > 0) {
            await (supabase.from('progreso_cliente') as any).upsert(updates)

            const { data: futureNut } = await (supabase
              .from('progreso_cliente_nutricion') as any)
              .select('id, fecha')
              .eq('cliente_id', user.id)
              .gt('fecha', sourceStr)

            if (futureNut && futureNut.length > 0) {
              const nutUpdates = futureNut.filter((item: any) => {
                const d = new Date(item.fecha)
                const dLocal = new Date(d.getTime() + (d.getTimezoneOffset() * 60000))
                return dLocal.getDay() === dayOfWeek
              }).map((item: any) => {
                const d = new Date(item.fecha)
                const newD = new Date(d.getTime() + (diffDays * 24 * 60 * 60 * 1000))
                return {
                  id: item.id,
                  fecha: newD.toISOString().split('T')[0]
                }
              })
              if (nutUpdates.length > 0) {
                await (supabase.from('progreso_cliente_nutricion') as any).upsert(nutUpdates)
              }
            }
          }
        }
      }

      setIsEditing(false)
      setSourceDate(null)
      setTargetDate(null)
      setShowConfirmModal(false)

      if (typeof window !== 'undefined') {
        window.location.reload()
      }

    } catch (error) {
      console.error('Error updating dates:', error)
      alert('Hubo un error al cambiar la fecha. Inténtalo de nuevo.')
    } finally {
      setIsUpdating(false)
    }
  }

  const monthLabel = useMemo(() => {
    const raw = format(currentDate, 'MMMM yyyy', { locale: es })
    if (!raw) return raw
    return raw.charAt(0).toUpperCase() + raw.slice(1)
  }, [currentDate])

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

    // Solo seleccionar el día y mostrar la lista de actividades debajo.
    // La navegación a la actividad se hace recién cuando el usuario hace
    // click en una de las actividades listadas.
    setSelectedDate(date)

    if (selectedCoachId) {
      const key = format(date, 'yyyy-MM-dd')
      if ((availableSlotsCountByDay?.[key] || 0) > 0) {
        // Switch to Week View first (Month -> Week -> Day/Split)
        setMeetViewMode('week')
        // Still update week start for context if needed
        setMeetWeekStart(startOfWeek(date, { weekStartsOn: 1 }))
        return
      }
    }

    setTimeout(() => {
      dayDetailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 80)
  }

  // --- TIMELINE HELPERS ---

  const handleTimelineClick = (e: React.MouseEvent<HTMLButtonElement>, blockStart: string, blockEnd: string, dayKey: string) => {
    console.log('[handleTimelineClick] Called with rescheduleContext:', rescheduleContext)
    // Calculate click position relative to the button (Available Block)
    const rect = e.currentTarget.getBoundingClientRect()
    const relativeY = e.clientY - rect.top
    const height = rect.height

    // Calculate total minutes in this specific block
    const startMins = toMins(blockStart)
    const endMins = toMins(blockEnd)
    const blockDuration = endMins - startMins

    // Calculate clicked minute
    const clickRatio = Math.max(0, Math.min(1, relativeY / height))
    const clickedMins = startMins + (clickRatio * blockDuration)

    // Snap to nearest 15 minutes
    const snappedMins = Math.round(clickedMins / 15) * 15
    const finalMins = Math.min(Math.max(startMins, snappedMins), endMins - 15) // Ensure it fits

    const h = Math.floor(finalMins / 60)
    const m = finalMins % 60
    const timeHHMM = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`

    setSelectedMeetRequest((prev) => ({
      coachId: String(selectedCoachId),
      dayKey,
      timeHHMM,
      // If we're in reschedule mode, use the original title/description from snapshot
      // Otherwise, preserve existing title if available
      title: rescheduleContext?.snapshot?.title || prev?.title || 'Meet',
      description: rescheduleContext?.snapshot?.description || prev?.description || '',
    }))
    console.log('[handleTimelineClick] Set selectedMeetRequest, rescheduleContext still:', rescheduleContext)
    setMeetViewMode('day_split') // Drill down to Day/Split View for booking
    const d = new Date(dayKey + 'T12:00:00') // Better parsing
    setSelectedDate(d)
    setMeetWeekStart(startOfWeek(d, { weekStartsOn: 1 }))
  }

  // --- RENDER HELPERS ---
  // --- SMART LAYOUT HELPER ---
  const getSmartLayout = (events: any[]) => {
    if (!events.length) return []
    // 1. Sort by start time
    const sorted = [...events].sort((a, b) => {
      const startA = parseInt(a.start_time.split('T')[1].replace(':', ''))
      const startB = parseInt(b.start_time.split('T')[1].replace(':', ''))
      return startA - startB
    })

    // 2. Assign columns
    const columns: any[][] = []

    // Helper to check overlap
    const overlaps = (evA: any, evB: any) => {
      const startA = parseInt(evA.start_time.split('T')[1].replace(':', ''))
      const endA = evA.end_time
        ? parseInt(evA.end_time.split('T')[1].replace(':', ''))
        : startA + 30
      const startB = parseInt(evB.start_time.split('T')[1].replace(':', ''))
      const endB = evB.end_time
        ? parseInt(evB.end_time.split('T')[1].replace(':', ''))
        : startB + 30
      return startA < endB && startB < endA
    }

    const eventLayouts = new Map()

    // Packing algorithm: Place in first compatible column
    sorted.forEach((ev) => {
      let placed = false
      for (let i = 0; i < columns.length; i++) {
        const col = columns[i]
        const lastEvInCol = col[col.length - 1]
        if (!overlaps(ev, lastEvInCol)) {
          col.push(ev)
          eventLayouts.set(ev.id, { colIndex: i })
          placed = true
          break
        }
      }
      if (!placed) {
        columns.push([ev])
        eventLayouts.set(ev.id, { colIndex: columns.length - 1 })
      }
    })

    const totalColumns = columns.length

    return sorted.map(ev => {
      const layout = eventLayouts.get(ev.id)
      return {
        ...ev,
        colIndex: layout.colIndex,
        totalCols: totalColumns
      }
    })
  }

  const renderClientEvents = (dayKey: string) => {
    const rawEvents = [...(meetEventsByDate[dayKey] || [])]

    // Merge Ghost Block if it exists for this day
    if (selectedMeetRequest && selectedMeetRequest.dayKey === dayKey) {
      // Construct ghost event relative to start/end
      const duration = coachConsultations[selectedConsultationType]?.time || 30
      const startIso = `${dayKey}T${selectedMeetRequest.timeHHMM}:00`
      // Calculate end time string manually or just populate enough fields for the helpers to work
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
        isGhost: true // Marker
      } as any)
    }

    // Group events that overlap into clusters to calculate independent layouts per cluster
    // Simply splitting by "connected components" of overlaps

    // Sort first
    const sorted = [...rawEvents].sort((a, b) => a.start_time.localeCompare(b.start_time))

    const clusters: any[][] = []
    let currentCluster: any[] = []

    // Simple clustering: if event overlaps with ANY event in current cluster, add to it.
    // If not, start new cluster. 
    // Note: sorting helps but "A overlaps B, B overlaps C, but A doesnt overlap C" means A-B-C is one cluster.
    // So we need to track "end of cluster".

    let clusterEnd = 0
    sorted.forEach(ev => {
      const startVal = parseInt(ev.start_time.split('T')[1].replace(':', ''))
      const endVal = ev.end_time
        ? parseInt(ev.end_time.split('T')[1].replace(':', ''))
        : startVal + 30

      if (currentCluster.length === 0) {
        currentCluster.push(ev)
        clusterEnd = endVal
      } else {
        if (startVal < clusterEnd) {
          // Overlaps with the cluster timeframe
          currentCluster.push(ev)
          clusterEnd = Math.max(clusterEnd, endVal)
        } else {
          // New cluster
          clusters.push(currentCluster)
          currentCluster = [ev]
          clusterEnd = endVal
        }
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
        // Adjust styles
        const style = {
          top: `${top}%`,
          height: `${height}%`,
          width: `calc(${width}% - 4px)`, // -4px for gap
          left: `calc(${(ev.colIndex || 0) * width}% + 2px)`, // Centered within its calculated width
        }

        // Optimization for small events
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
            title={`${ev.title || 'Meet'} (${ev.start_time.split('T')[1].substring(0, 5)} - ${ev.end_time ? ev.end_time.split('T')[1].substring(0, 5) : ''})`}
          >
            <div className={`${isSmall ? 'flex items-center gap-2 overflow-hidden w-full' : 'flex flex-col w-full h-full justify-center'}`}>
              <span className={`text-[10px] font-bold truncate leading-tight flex-shrink-0 flex items-center gap-1 ${isGhost ? 'text-black' : (ev.status === 'cancelled' || ev.rsvp_status === 'declined' ? 'text-red-500' : 'text-[#FFB366]')}`}>
                {ev.event_type === 'workshop' ? <GraduationCap className="w-3 h-3" /> : (ev.isGhost ? null : <Video className="w-3 h-3" />)}
                {ev.title || 'Meet'}
              </span>
              <div className={`${isSmall ? '' : 'flex items-center gap-1'}`}>
                <span className={`text-[9px] font-medium whitespace-nowrap leading-tight ${isGhost ? 'text-black/80' : 'text-[#FFB366]/80'}`}>
                  {isSmall
                    ? `${ev.start_time.split('T')[1].substring(0, 5)}${isGhost ? ` - ${ev.end_time?.split('T')[1].substring(0, 5)}` : ''}`
                    : `${ev.start_time.split('T')[1].substring(0, 5)} - ${ev.end_time ? ev.end_time.split('T')[1].substring(0, 5) : ''}`
                  }
                </span>
              </div>
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

  if (!isMounted) return null // Avoid hydration mismatch for date-dependent rendering

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
        applyConsultationSelection={applyConsultationSelection}
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
        onToday={() => setCurrentDate(new Date())}
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
                selectedDate={selectedDate}
                onSelectDate={(date) => {
                  setSelectedDate(date)
                  if (isEditing) {
                    if (!sourceDate) setSourceDate(date)
                    else if (!targetDate) setTargetDate(date)
                  } else if (selectedCoachId) {
                    setMeetViewMode('week')
                    // Calculate monday of the week for the selected date
                    const d = new Date(date)
                    const day = d.getDay()
                    const diff = d.getDate() - day + (day === 0 ? -6 : 1) // adjust when day is sunday
                    const monday = new Date(d.setDate(diff))
                    setMeetWeekStart(monday)
                  }
                }}
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
