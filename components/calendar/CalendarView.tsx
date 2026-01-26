"use client"

import { useState, useEffect, useMemo, useRef, Fragment, useCallback } from "react"
import { createClient } from '@/lib/supabase/supabase-client'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, addMonths, subMonths, startOfWeek, addDays } from "date-fns"
import { es } from "date-fns/locale"
import { Bell, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, Flame, Plus, Minus, Utensils, Video, X, Zap, Target, GraduationCap, CheckCircle2, XCircle, Ban, Users, User, RotateCcw, ArrowRight, AlertTriangle } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Image from "next/image"
import { MeetNotificationsModal } from "@/components/shared/meet-notifications-modal"
import { createCheckoutProPreference, redirectToMercadoPagoCheckout } from '@/lib/mercadopago/checkout-pro'
import { OmniaLoader } from "@/components/shared/ui/omnia-loader"

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
  const [currentDate, setCurrentDate] = useState<Date>(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date())

  // Hydration fix: ensure consistent initial render or handle mount
  const [isMounted, setIsMounted] = useState(false)
  useEffect(() => {
    setIsMounted(true)
  }, [])
  const [authUserId, setAuthUserId] = useState<string | null>(null)
  const [activitiesByDate, setActivitiesByDate] = useState<Record<string, any[]>>({})
  const [activitiesInfo, setActivitiesInfo] = useState<Record<string, any>>({})
  const [dayMinutesByDate, setDayMinutesByDate] = useState<
    Record<
      string,
      {
        fitnessMinutesTotal: number
        fitnessMinutesPending: number
        nutritionMinutesTotal: number
        nutritionMinutesPending: number
        meetsMinutes: number
        pendingExercises: number
        pendingPlates: number
      }
    >
  >({})
  const [meetEventsByDate, setMeetEventsByDate] = useState<
    Record<
      string,
      Array<{
        id: string
        title?: string | null
        start_time: string
        end_time: string | null
        coach_id?: string | null
        meet_link?: string | null
        description?: string | null
        rsvp_status?: string | null
        invited_by_user_id?: string | null
      }>
    >
  >({})
  const [selectedDayActivityItems, setSelectedDayActivityItems] = useState<
    Array<{
      activityId: string
      activityTitle: string
      activityTypeLabel: string
      borderClass: string
      bgClass: string
      pendingCountLabel: string
      pendingMinutes: number
    }>
  >([])

  // Edit Mode States
  const [isEditing, setIsEditing] = useState(false)
  const [sourceDate, setSourceDate] = useState<Date | null>(null)
  const [targetDate, setTargetDate] = useState<Date | null>(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [applyToAllSameDays, setApplyToAllSameDays] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  const selectedDayKeyRef = useRef<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAddMenu, setShowAddMenu] = useState(false)
  const [showCoachRow, setShowCoachRow] = useState(false)
  const [coachProfiles, setCoachProfiles] = useState<Array<{ id: string; full_name: string; avatar_url?: string | null }>>([])
  const [meetCreditsByCoachId, setMeetCreditsByCoachId] = useState<Record<string, number>>({})
  const [coachConsultations, setCoachConsultations] = useState<{
    express: { active: boolean; price: number; time: number; name: string }
    puntual: { active: boolean; price: number; time: number; name: string }
    profunda: { active: boolean; price: number; time: number; name: string }
  }>({
    express: { active: false, price: 0, time: 15, name: 'Express' },
    puntual: { active: false, price: 0, time: 30, name: 'Consulta puntual' },
    profunda: { active: false, price: 0, time: 60, name: 'Sesión profunda' },
  })

  const selectedCoachId = scheduleMeetContext?.coachId ? String(scheduleMeetContext.coachId) : null

  const [selectedConsultationType, setSelectedConsultationType] = useState<'express' | 'puntual' | 'profunda'>(() => {
    const mins = Number(scheduleMeetContext?.purchase?.durationMinutes ?? 30) || 30
    if (mins <= 15) return 'express'
    if (mins >= 60) return 'profunda'
    return 'puntual'
  })
  const [coachAvailabilityRows, setCoachAvailabilityRows] = useState<
    Array<{
      id: string
      weekday: number
      start_time: string
      end_time: string
      scope: 'always' | 'month'
      year: number | null
      month: number | null
      timezone: string | null
    }>
  >([])

  const [selectedMeetRsvpStatus, setSelectedMeetRsvpStatus] = useState<string>('pending')
  const [selectedMeetParticipantsCount, setSelectedMeetParticipantsCount] = useState<number>(0)
  const [selectedMeetRsvpLoading, setSelectedMeetRsvpLoading] = useState<boolean>(false)
  const [confirmDeclineStep, setConfirmDeclineStep] = useState<boolean>(false)
  const [meetViewMode, setMeetViewMode] = useState<'month' | 'week' | 'day_split'>('month')
  const [meetWeekStart, setMeetWeekStart] = useState<Date>(startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [bookedSlotsByDay, setBookedSlotsByDay] = useState<Record<string, Set<string>>>({})
  const [bookedSlotsByDayMonth, setBookedSlotsByDayMonth] = useState<Record<string, Set<string>>>({})
  const [selectedMeetEvent, setSelectedMeetEvent] = useState<
    | {
      id: string
      title?: string | null
      start_time: string
      end_time: string | null
      coach_id?: string | null
      meet_link?: string | null
      description?: string | null
      invited_by_user_id?: string | null
    }
    | null
  >(null)

  const [meetPurchasePaid, setMeetPurchasePaid] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [successModalData, setSuccessModalData] = useState<{
    coachName: string
    date: string
    time: string
    duration: number
  } | null>(null)
  const purchaseContext = scheduleMeetContext?.purchase
  const isPaidMeetFlow = purchaseContext?.kind === 'consultation'

  const [pendingReschedule, setPendingReschedule] = useState<
    | {
      id: string
      from_start_time: string
      from_end_time: string | null
      to_start_time: string
      to_end_time: string | null
      note: string | null
      status: string
      requested_by_user_id: string | null
    }
    | null
  >(null)

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

  const hasAutoOpenedPaidFlowRef = useRef(false)

  useEffect(() => {
    const mins = Number(scheduleMeetContext?.purchase?.durationMinutes ?? 0) || 0
    if (!mins) return
    if (mins <= 15) setSelectedConsultationType('express')
    else if (mins >= 60) setSelectedConsultationType('profunda')
    else setSelectedConsultationType('puntual')
  }, [scheduleMeetContext?.purchase?.durationMinutes])

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

  const [showMeetNotifications, setShowMeetNotifications] = useState(false)
  const [meetNotificationsCount, setMeetNotificationsCount] = useState<number>(0)

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
  const dayDetailRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const loadAuthUserId = async () => {
      try {
        const { data } = await supabase.auth.getUser()
        const uid = data?.user?.id ? String(data.user.id) : null
        setAuthUserId(uid)
      } catch {
        setAuthUserId(null)
      }
    }
    loadAuthUserId()
  }, [supabase])

  const formatMinutes = (minsRaw: number) => {
    const mins = Number.isFinite(minsRaw) ? Math.max(0, Math.round(minsRaw)) : 0
    if (mins <= 0) return ''
    const h = Math.floor(mins / 60)
    const m = mins % 60
    if (h <= 0) return `${m}m`
    if (m <= 0) return `${h}h`
    return `${h}h ${m}m`
  }

  const purchasedCoachIds = useMemo(() => {
    const ids = new Set<string>()
    Object.values(activitiesInfo || {}).forEach((a: any) => {
      const cid = String(a?.coach_id || '')
      if (cid) ids.add(cid)
    })
    return Array.from(ids)
  }, [activitiesInfo])
  const selectedCoachProfile = useMemo(() => {
    if (!selectedCoachId) return null
    return coachProfiles.find((c) => c.id === selectedCoachId) || null
  }, [coachProfiles, selectedCoachId])

  useEffect(() => {
    const loadCoachConsultations = async () => {
      try {
        if (!selectedCoachId) return
        const { data, error } = await (supabase
          .from('coaches') as any)
          .select('cafe, cafe_enabled, meet_30, meet_30_enabled, meet_1, meet_1_enabled')
          .eq('id', selectedCoachId)
          .single()

        if (error || !data) return

        setCoachConsultations({
          express: {
            active: !!(data as any).cafe_enabled,
            price: Number((data as any).cafe ?? 0) || 0,
            time: 15,
            name: 'Express',
          },
          puntual: {
            active: !!(data as any).meet_30_enabled,
            price: Number((data as any).meet_30 ?? 0) || 0,
            time: 30,
            name: 'Consulta puntual',
          },
          profunda: {
            active: !!(data as any).meet_1_enabled,
            price: Number((data as any).meet_1 ?? 0) || 0,
            time: 60,
            name: 'Sesión profunda',
          },
        })
      } catch {
        // ignore
      }
    }

    loadCoachConsultations()
  }, [selectedCoachId, supabase])

  // Listener para resetear al origen cuando se presiona el tab activo
  useEffect(() => {
    const handleResetToOrigin = (event: CustomEvent) => {
      const { tab } = event.detail
      if (tab === 'calendar') {
        // Resetear fecha seleccionada
        setSelectedDate(new Date())

        // Scroll al inicio
        setTimeout(() => {
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }, 100)
      }
    }

    window.addEventListener('reset-tab-to-origin', handleResetToOrigin as EventListener)
    return () => {
      window.removeEventListener('reset-tab-to-origin', handleResetToOrigin as EventListener)
    }
  }, [])

  useEffect(() => {
    const fetchActivities = async () => {
      if (activityIds.length === 0) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const activitiesMap: Record<string, any[]> = {}

        // Obtener progreso del cliente para cada actividad
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          setLoading(false)
          return
        }

        // 1) Obtener metadata de las actividades (nombre, tipo, etc.)
        const numericIds = activityIds.map(id => Number(id))
        const { data: activitiesData, error: activitiesError } = await (supabase
          .from('activities') as any)
          .select('id, title, type, categoria, workshop_mode, coach_id')
          .in('id', numericIds)

        if (activitiesError) {
          console.error('Error fetching activities info:', activitiesError)
        } else if (activitiesData) {
          const infoMap: Record<string, any> = {}
          activitiesData.forEach((a: any) => {
            infoMap[a.id.toString()] = a
          })
          setActivitiesInfo(infoMap)
        }

        // 2) Obtener progreso del cliente para cada actividad y día del mes
        //    Calcular cantidad de actividades pendientes de HOY para cada actividad
        for (const activityId of activityIds) {
          const { data: progress } = await (supabase
            .from('progreso_cliente') as any)
            .select('fecha, actividad_id, ejercicios_pendientes, detalles_series')
            .eq('actividad_id', activityId)
            .eq('cliente_id', user.id)
            .gte('fecha', startOfMonth(currentDate).toISOString().split('T')[0])
            .lte('fecha', endOfMonth(currentDate).toISOString().split('T')[0])

          if (progress) {
            progress.forEach((p: any) => {
              const dateKey = p.fecha.split('T')[0]

              // Calcular cantidad de actividades pendientes de HOY
              let pendingCount = 0

              // Intentar desde ejercicios_pendientes (array)
              if (Array.isArray(p.ejercicios_pendientes)) {
                pendingCount = p.ejercicios_pendientes.length
              } else if (typeof p.ejercicios_pendientes === 'string') {
                try {
                  const parsed = JSON.parse(p.ejercicios_pendientes)
                  if (Array.isArray(parsed)) {
                    pendingCount = parsed.length
                  }
                } catch (e) {
                  // Ignorar error de parseo
                }
              }

              // Si no hay ejercicios_pendientes, intentar contar desde detalles_series
              if (pendingCount === 0 && p.detalles_series) {
                try {
                  const detalles = typeof p.detalles_series === 'string'
                    ? JSON.parse(p.detalles_series)
                    : p.detalles_series
                  if (detalles && typeof detalles === 'object') {
                    pendingCount = Object.keys(detalles).length
                  }
                } catch (e) {
                  // Ignorar error de parseo
                }
              }

              if (!activitiesMap[dateKey]) {
                activitiesMap[dateKey] = []
              }
              activitiesMap[dateKey].push({
                id: activityId,
                fecha: p.fecha,
                pendingCount
              })
            })
          }
        }

        setActivitiesByDate(activitiesMap)
      } catch (error) {
        console.error('Error fetching activities:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchActivities()
  }, [activityIds, currentDate, supabase])

  useEffect(() => {
    const loadDayMinutes = async () => {
      try {
        const { data: auth } = await supabase.auth.getUser()
        const user = auth?.user
        if (!user?.id) {
          setDayMinutesByDate({})
          setMeetEventsByDate({})
          return
        }

        let startISO: string
        let endISO: string

        if (meetViewMode === 'week' && meetWeekStart) {
          const wEnd = addDays(meetWeekStart, 7)
          startISO = meetWeekStart.toISOString().split('T')[0]
          endISO = wEnd.toISOString().split('T')[0]
        } else {
          const monthStart = startOfMonth(currentDate)
          const monthEnd = endOfMonth(currentDate)
          // Add buffer for month view typical grid (usually shows prev/next month days)
          const bufferedStart = addDays(monthStart, -7)
          const bufferedEnd = addDays(monthEnd, 14)
          startISO = bufferedStart.toISOString().split('T')[0]
          endISO = bufferedEnd.toISOString().split('T')[0]
        }

        const toInt = (v: any) => {
          const n = Number(v)
          return Number.isFinite(n) ? Math.round(n) : 0
        }

        const agg: Record<
          string,
          {
            fitnessMinutesTotal: number
            fitnessMinutesPending: number
            nutritionMinutesTotal: number
            nutritionMinutesPending: number
            meetsMinutes: number
            pendingExercises: number
            pendingPlates: number
          }
        > = {}

        console.log('📅 [loadDayMinutes] Query Range:', { meetViewMode, startISO, endISO })

        // 1) Resumen diario desde la NUEVA tabla: progreso_diario_actividad
        const { data: activityRows, error: activityError } = await (supabase
          .from('progreso_diario_actividad') as any)
          .select(
            'fecha, area, minutos, items_objetivo, items_completados, cantidad_actividades_adeudadas, actividad_id'
          )
          .eq('cliente_id', user.id)
          .gte('fecha', startISO)
          .lte('fecha', endISO)

        if (activityError) {
          console.error('Error fetching progreso_diario_actividad:', activityError)
        }

        console.log('📅 [loadDayMinutes] Activity Rows (New Table):', activityRows?.length, activityRows)

        const newActivityStats: Record<string, { minutes: number }> = {}

          ; (activityRows || []).forEach((row: any) => {
            const dayKey = String(row?.fecha || '').split('T')[0]
            if (!dayKey) return

            // Populate Activity Stats
            if (row.actividad_id) {
              const aid = String(row.actividad_id)
              if (!newActivityStats[aid]) newActivityStats[aid] = { minutes: 0 }
              newActivityStats[aid].minutes += (Number(row.minutos) || 0)
            }

            // Inicializar si no existe
            if (!agg[dayKey]) {
              agg[dayKey] = {
                fitnessMinutesTotal: 0,
                fitnessMinutesPending: 0,
                nutritionMinutesTotal: 0,
                nutritionMinutesPending: 0,
                meetsMinutes: 0,
                pendingExercises: 0,
                pendingPlates: 0,
              }
            }

            const area = String(row.area || '').toLowerCase()
            const mins = Number(row.minutos) || 0
            // Si no hay "cantidad_actividades_adeudadas" confiable, se puede calcular con items:
            // const pendingCount = Math.max(0, (row.items_objetivo || 0) - (row.items_completados || 0))
            // Pero la tabla tiene 'cantidad_actividades_adeudadas', probemos usar esa o sumar 1 si items_objetivo > items_completados
            const pendingItems = row.cantidad_actividades_adeudadas || Math.max(0, (row.items_objetivo || 0) - (row.items_completados || 0))

            if (area === 'fitness') {
              agg[dayKey].fitnessMinutesTotal += mins
              agg[dayKey].fitnessMinutesPending += mins // Ensure it shows in UI (Busy Minutes logic)
              // Aproximación de pendientes (si la tabla guarda pendientes por actividad)
              if (pendingItems > 0) {
                agg[dayKey].pendingExercises += pendingItems
              }
            } else if (area === 'nutricion' || area === 'nutrition') {
              agg[dayKey].nutritionMinutesTotal += mins
              agg[dayKey].nutritionMinutesPending += mins // Ensure it shows in UI
              if (pendingItems > 0) {
                agg[dayKey].pendingPlates += pendingItems
              }
            }
          })

        // 2) Meets del cliente en el mes
        const meetMap: Record<string, any[]> = {} // Initialize meetMap here
        const { data: myParts, error: myPartsError } = await (supabase
          .from('calendar_event_participants') as any)
          .select('event_id, rsvp_status, invited_by_role, invited_by_user_id')
          .eq('client_id', user.id)

        if (myPartsError) {
          console.error('Error fetching client meet participants:', myPartsError)
        }

        const eventIdToParticipantInfo: Record<string, { rsvp: string; invitedBy: string | null; invitedByUserId: string | null }> = {}
          ; (myParts || []).forEach((p: any) => {
            const eid = String(p?.event_id || '')
            if (!eid) return
            eventIdToParticipantInfo[eid] = {
              rsvp: String(p?.rsvp_status || 'pending'),
              invitedBy: p?.invited_by_role ? String(p.invited_by_role) : null,
              invitedByUserId: p?.invited_by_user_id ? String(p.invited_by_user_id) : null,
            }
          })

        const candidateEventIds = Object.keys(eventIdToParticipantInfo)
        const meetEventsRes = candidateEventIds.length
          ? await (supabase
            .from('calendar_events') as any)
            .select('id, title, description, meet_link, start_time, end_time, event_type, coach_id')
            .in('id', candidateEventIds)
            .eq('event_type', 'consultation')
            .gte('start_time', startISO)
            .lt('start_time', addDays(new Date(endISO), 1).toISOString())
          : { data: [], error: null }

        if (meetEventsRes && (meetEventsRes as any).error) {
          console.error('Error fetching client meet events (by ids):', (meetEventsRes as any).error)
        }

        const meetEvents = (meetEventsRes as any)?.data
        const meetEventsSafe = Array.isArray(meetEvents) ? meetEvents : []

          ; (meetEventsSafe || []).forEach((ev: any) => {
            if (!ev?.start_time) return
            const start = new Date(ev.start_time)
            if (Number.isNaN(start.getTime())) return
            const dayKey = format(start, 'yyyy-MM-dd')

            const end = ev.end_time ? new Date(ev.end_time) : null
            const minutes = (() => {
              if (end && !Number.isNaN(end.getTime())) {
                const diff = (end.getTime() - start.getTime()) / 60000
                return diff > 0 ? diff : 0
              }
              return 30
            })()

            if (!agg[dayKey]) {
              agg[dayKey] = {
                fitnessMinutesTotal: 0,
                fitnessMinutesPending: 0,
                nutritionMinutesTotal: 0,
                nutritionMinutesPending: 0,
                meetsMinutes: 0,
                pendingExercises: 0,
                pendingPlates: 0,
              }
            }
            agg[dayKey].meetsMinutes += Math.round(minutes)

            if (!meetMap[dayKey]) meetMap[dayKey] = []
            const pInfo = eventIdToParticipantInfo[String(ev.id)]
            meetMap[dayKey].push({
              id: String(ev.id),
              title: ev.title == null ? null : String(ev.title || ''),
              start_time: String(ev.start_time),
              end_time: ev.end_time ? String(ev.end_time) : null,
              coach_id: ev.coach_id ? String(ev.coach_id) : null,
              meet_link: ev.meet_link ? String(ev.meet_link) : null,
              description: ev.description == null ? null : String(ev.description || ''),
              rsvp_status: String(pInfo?.rsvp || 'pending'),
              invited_by_role: pInfo?.invitedBy || null,
              invited_by_user_id: pInfo?.invitedByUserId || null,
            })
          })

        Object.keys(meetMap).forEach((k) => {
          meetMap[k].sort((a, b) => String(a.start_time).localeCompare(String(b.start_time)))
        })

        console.log('📅 [loadDayMinutes] Final Agg:', agg)

        setDayMinutesByDate(agg)
        setActivityStats(newActivityStats)
        setMeetEventsByDate(meetMap)
      } catch (e) {
        console.error('Error loading day minutes:', e)
        setDayMinutesByDate({})
        setMeetEventsByDate({})
      }
    }

    loadDayMinutes()
  }, [currentDate, supabase, meetViewMode, meetWeekStart])

  useEffect(() => {
    const loadSelectedDayBreakdown = async () => {
      try {
        if (!selectedDate) {
          setSelectedDayActivityItems([])
          selectedDayKeyRef.current = null
          return
        }

        const { data: auth } = await supabase.auth.getUser()
        const user = auth?.user
        if (!user?.id) {
          // Evitar borrar el estado si hay un glitch temporal de auth; si no, desaparecen los pendientes.
          return
        }

        const dayKey = format(selectedDate, 'yyyy-MM-dd')
        selectedDayKeyRef.current = dayKey

        const toInt = (v: any) => {
          const n = Number(v)
          return Number.isFinite(n) ? Math.round(n) : 0
        }

        const parseMaybeJsonObject = (raw: any) => {
          try {
            if (!raw) return null
            if (typeof raw === 'object') return raw
            if (typeof raw === 'string') return JSON.parse(raw)
            return null
          } catch {
            return null
          }
        }

        const pendingKeysFromRaw = (raw: any): string[] => {
          const parsed = parseMaybeJsonObject(raw)
          if (!parsed) return []
          if (Array.isArray(parsed)) return parsed.map((x) => String(x))
          if (typeof parsed === 'object') return Object.keys(parsed)
          return []
        }

        const sumMinutesForPendingKeys = (minutesObj: any, pendingKeys: string[]) => {
          if (!minutesObj || typeof minutesObj !== 'object' || Array.isArray(minutesObj)) return 0
          const minutes: any = minutesObj
          let total = 0
          for (const k of Object.keys(minutes)) {
            const base = String(k).split('_')[0]
            if (!pendingKeys.some((pk) => String(pk).split('_')[0] === base)) continue
            total += toInt(minutes[k])
          }
          return total
        }

        const itemsByActivity: Record<
          string,
          {
            fitnessPendingCount: number
            fitnessPendingMinutes: number
            nutriPendingCount: number
            nutriPendingMinutes: number
          }
        > = {}

        // Fitness por actividad (progreso_cliente)
        const { data: progressRows, error: progressError } = await (supabase
          .from('progreso_cliente') as any)
          .select('actividad_id, minutos_json, ejercicios_pendientes')
          .eq('cliente_id', user.id)
          .eq('fecha', dayKey)

        if (progressError) {
          console.error('Error fetching progreso_cliente for day breakdown:', progressError)
        }

        ; (progressRows || []).forEach((row: any) => {
          const activityId = String(row?.actividad_id ?? '')
          if (!activityId) return
          const pendingKeys = pendingKeysFromRaw(row?.ejercicios_pendientes)
          const minutesObj = parseMaybeJsonObject(row?.minutos_json)
          const pendingMinutes = sumMinutesForPendingKeys(minutesObj, pendingKeys)

          if (!itemsByActivity[activityId]) {
            itemsByActivity[activityId] = {
              fitnessPendingCount: 0,
              fitnessPendingMinutes: 0,
              nutriPendingCount: 0,
              nutriPendingMinutes: 0,
            }
          }
          itemsByActivity[activityId].fitnessPendingCount += pendingKeys.length
          itemsByActivity[activityId].fitnessPendingMinutes += pendingMinutes
        })

        // Nutrición por actividad (progreso_cliente_nutricion)
        const { data: nutriRows, error: nutriError } = await (supabase
          .from('progreso_cliente_nutricion') as any)
          .select('actividad_id, macros, ejercicios_pendientes')
          .eq('cliente_id', user.id)
          .eq('fecha', dayKey)

        if (nutriError) {
          console.error('Error fetching progreso_cliente_nutricion for day breakdown:', nutriError)
        }

        ; (nutriRows || []).forEach((row: any) => {
          const activityId = String(row?.actividad_id ?? '')
          if (!activityId) return
          const pendingKeys = pendingKeysFromRaw(row?.ejercicios_pendientes)
          const macrosObj = parseMaybeJsonObject(row?.macros)
          const minutesObj: any = (() => {
            if (!macrosObj || typeof macrosObj !== 'object' || Array.isArray(macrosObj)) return null
            const out: any = {}
            Object.keys(macrosObj).forEach((k) => {
              const m = macrosObj?.[k]?.minutos
              if (m != null) out[k] = m
            })
            return out
          })()
          const pendingMinutes = sumMinutesForPendingKeys(minutesObj, pendingKeys)

          if (!itemsByActivity[activityId]) {
            itemsByActivity[activityId] = {
              fitnessPendingCount: 0,
              fitnessPendingMinutes: 0,
              nutriPendingCount: 0,
              nutriPendingMinutes: 0,
            }
          }
          itemsByActivity[activityId].nutriPendingCount += pendingKeys.length
          itemsByActivity[activityId].nutriPendingMinutes += pendingMinutes
        })

        // Cargar títulos si faltan
        const missingIds = Object.keys(itemsByActivity).filter((id) => !activitiesInfo[id])
        if (missingIds.length > 0) {
          const numericIds = missingIds.map((id) => Number(id)).filter((n) => Number.isFinite(n))
          if (numericIds.length > 0) {
            const { data: activitiesData } = await (supabase
              .from('activities') as any)
              .select('id, title, type, categoria')
              .in('id', numericIds)
            if (activitiesData) {
              setActivitiesInfo((prev) => {
                const next = { ...prev }
                activitiesData.forEach((a: any) => {
                  next[String(a.id)] = a
                })
                return next
              })
            }
          }
        }

        const buildStyle = (info: any) => {
          const type = info?.type || 'program'
          const categoria = String(info?.categoria || '').toLowerCase()
          let borderClass = 'border-[#FF7939]'
          let bgClass = 'bg-[#FF7939]/10'
          let label = 'Programa'
          if (type === 'workshop') {
            borderClass = 'border-[#FFB873]'
            bgClass = 'bg-[#FFB873]/12'
            label = 'Taller'
          } else if (categoria === 'nutricion' || categoria === 'nutrition') {
            borderClass = 'border-[#FFB873]'
            bgClass = 'bg-[#FFB873]/12'
            label = 'Nutrición'
          }
          return { borderClass, bgClass, label }
        }

        const list = Object.keys(itemsByActivity)
          .map((activityId) => {
            const info = activitiesInfo[activityId]
            const style = buildStyle(info)
            const counts = itemsByActivity[activityId]
            const pendingMinutes = Math.round((counts.fitnessPendingMinutes || 0) + (counts.nutriPendingMinutes || 0))
            const pendingCountLabelParts: string[] = []
            if (counts.fitnessPendingCount > 0) pendingCountLabelParts.push(`${counts.fitnessPendingCount} ejercicios`)
            if (counts.nutriPendingCount > 0) pendingCountLabelParts.push(`${counts.nutriPendingCount} platos`)
            const pendingCountLabel = pendingCountLabelParts.join(' · ') || 'Sin pendientes'

            return {
              activityId,
              activityTitle: info?.title || `Actividad ${activityId}`,
              activityTypeLabel: style.label,
              borderClass: style.borderClass,
              bgClass: style.bgClass,
              pendingCountLabel,
              pendingMinutes,
            }
          })
          .filter((x) => x.pendingMinutes > 0 || x.pendingCountLabel !== 'Sin pendientes')
          .sort((a, b) => b.pendingMinutes - a.pendingMinutes)

        setSelectedDayActivityItems(list)
      } catch (e) {
        console.error('Error loading selected day breakdown:', e)
        // No borrar el estado para evitar que desaparezcan pendientes por fallos transitorios.
      }
    }

    loadSelectedDayBreakdown()
  }, [activitiesInfo, selectedDate, supabase])

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

        if (error) {
          console.error('Error fetching coach profiles:', error)
          setCoachProfiles([])
          return
        }

        setCoachProfiles(
          (data || []).map((p: any) => ({
            id: String(p.id),
            full_name: String(p.full_name || 'Coach'),
            avatar_url: p.avatar_url || null,
          }))
        )
      } catch (e) {
        console.error('Error fetching coach profiles:', e)
        setCoachProfiles([])
      }
    }

    loadCoachProfiles()
  }, [purchasedCoachIds, supabase])

  useEffect(() => {
    const loadMeetNotificationCount = async () => {
      try {
        if (!authUserId) {
          setMeetNotificationsCount(0)
          return
        }

        const { count, error } = await (supabase
          .from('calendar_event_participants') as any)
          .select('id', { count: 'exact' })
          .eq('client_id', authUserId)
          .eq('rsvp_status', 'pending')

        if (error) {
          setMeetNotificationsCount(0)
          return
        }
        setMeetNotificationsCount(Number.isFinite(count as any) ? (count as any) : 0)
      } catch {
        setMeetNotificationsCount(0)
      }
    }

    loadMeetNotificationCount()
  }, [supabase, meetEventsByDate, authUserId])

  const openMeetById = async (eventId: string) => {
    try {
      const all = Object.values(meetEventsByDate || {}).flat()
      const found = all.find((m: any) => String(m?.id || '') === String(eventId))
      if (found) {
        setSelectedMeetEvent(found as any)
        setShowMeetNotifications(false)
        return
      }

      const { data: ev, error } = await (supabase
        .from('calendar_events') as any)
        .select('id, title, description, meet_link, start_time, end_time, coach_id')
        .eq('id', eventId)
        .maybeSingle()

      if (error || !ev?.id) return
      setSelectedMeetEvent({
        id: String(ev.id),
        title: ev.title == null ? null : String(ev.title || ''),
        start_time: String(ev.start_time),
        end_time: ev.end_time ? String(ev.end_time) : null,
        coach_id: ev.coach_id ? String(ev.coach_id) : null,
        meet_link: ev.meet_link ? String(ev.meet_link) : null,
        description: ev.description == null ? null : String(ev.description || ''),
      })
      setShowMeetNotifications(false)
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    const loadMeetCredits = async () => {
      try {
        if (!purchasedCoachIds || purchasedCoachIds.length === 0) {
          setMeetCreditsByCoachId({})
          return
        }

        const { data: auth } = await supabase.auth.getUser()
        const user = auth?.user
        if (!user?.id) {
          setMeetCreditsByCoachId({})
          return
        }

        const { data, error } = await (supabase
          .from('client_meet_credits_ledger') as any)
          .select('coach_id, meet_credits_available')
          .eq('client_id', user.id)
          .in('coach_id', purchasedCoachIds)

        if (error) {
          console.error('Error fetching meet credits:', error)
          setMeetCreditsByCoachId({})
          return
        }

        const map: Record<string, number> = {}
          ; (data || []).forEach((row: any) => {
            const coachId = String(row?.coach_id || '')
            if (!coachId) return
            const credits = Number(row?.meet_credits_available ?? 0)
            map[coachId] = Number.isFinite(credits) ? credits : 0
          })
        setMeetCreditsByCoachId(map)
      } catch (e) {
        console.error('Error fetching meet credits:', e)
        setMeetCreditsByCoachId({})
      }
    }

    loadMeetCredits()
  }, [purchasedCoachIds, supabase])

  useEffect(() => {
    if (!selectedMeetEvent?.id) {
      setConfirmDeclineStep(false)
      return
    }
    setConfirmDeclineStep(false)
  }, [selectedMeetEvent?.id])

  useEffect(() => {
    const loadPendingReschedule = async () => {
      try {
        if (!selectedMeetEvent?.id) {
          setPendingReschedule(null)
          return
        }
        const { data: auth } = await supabase.auth.getUser()
        const user = auth?.user
        if (!user?.id) {
          setPendingReschedule(null)
          return
        }

        const { data: rr, error } = await (supabase
          .from('calendar_event_reschedule_requests') as any)
          .select('id, from_start_time, from_end_time, to_start_time, to_end_time, note, status, created_at, requested_by_user_id')
          .eq('event_id', selectedMeetEvent.id)
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(1)

        if (error) {
          setPendingReschedule(null)
          return
        }
        const row = (rr || [])[0]
        if (!row?.id) {
          setPendingReschedule(null)
          return
        }
        setPendingReschedule({
          id: String(row.id),
          from_start_time: String(row.from_start_time),
          from_end_time: row.from_end_time ? String(row.from_end_time) : null,
          to_start_time: String(row.to_start_time),
          to_end_time: row.to_end_time ? String(row.to_end_time) : null,
          note: row.note == null ? null : String(row.note),
          status: String(row.status || 'pending'),
          requested_by_user_id: row.requested_by_user_id ? String(row.requested_by_user_id) : null
        })
      } catch {
        setPendingReschedule(null)
      }
    }

    loadPendingReschedule()
  }, [selectedMeetEvent?.id, supabase])

  useEffect(() => {
    const loadCoachAvailability = async () => {
      console.log('[CalendarView] loadCoachAvailability start', { selectedCoachId })
      try {
        if (!selectedCoachId) {
          setCoachAvailabilityRows([])
          return
        }

        const { data, error } = await (supabase
          .from('coach_availability_rules') as any)
          .select('id, weekday, start_time, end_time, scope, year, month, timezone')
          .eq('coach_id', selectedCoachId)

        if (error) {
          console.error('Error fetching coach availability rules:', error)
          setCoachAvailabilityRows([])
          return
        }

        const toHHMM = (t: any) => {
          const s = String(t || '')
          if (!s) return ''
          return s.slice(0, 5)
        }

        setCoachAvailabilityRows(
          (Array.isArray(data) ? data : []).map((r: any) => ({
            id: String(r.id),
            weekday: Number(r.weekday),
            start_time: toHHMM(r.start_time),
            end_time: toHHMM(r.end_time),
            scope: String(r.scope || '').toLowerCase() === 'month' ? 'month' : 'always',
            year: r.year == null ? null : Number(r.year),
            month: r.month == null ? null : Number(r.month),
            timezone: r.timezone ?? null,
          }))
        )


      } catch (e) {
        console.error('Error fetching coach availability rules:', e)
        setCoachAvailabilityRows([])
      }
    }

    loadCoachAvailability()
  }, [selectedCoachId, supabase])

  useEffect(() => {
    const loadBookedSlots = async () => {
      try {
        if (!selectedCoachId || meetViewMode !== 'week') {
          setBookedSlotsByDay({})
          return
        }

        const start = meetWeekStart
        const end = addDays(meetWeekStart, 7)

        const { data, error } = await (supabase
          .from('calendar_events') as any)
          .select('start_time, end_time, event_type, coach_id')
          .eq('coach_id', selectedCoachId)
          .eq('event_type', 'consultation')
          .gte('start_time', start.toISOString())
          .lt('start_time', end.toISOString())

        if (error) {
          console.error('Error fetching booked meet slots:', error)
          setBookedSlotsByDay({})
          return
        }

        const map: Record<string, Set<string>> = {}
          ; (data || []).forEach((row: any) => {
            const startDt = new Date(row.start_time)
            const endDt = row.end_time ? new Date(row.end_time) : new Date(startDt.getTime() + 30 * 60 * 1000)

            const startMs = startDt.getTime()
            const endMs = endDt.getTime()
            if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) return

            // Marcar todos los slots de 30 min que ocupa el evento
            const cursor = new Date(startDt)
            cursor.setSeconds(0, 0)
            while (cursor.getTime() < endMs) {
              const dayKey = format(cursor, 'yyyy-MM-dd')
              const timeKey = format(cursor, 'HH:mm')
              if (!map[dayKey]) map[dayKey] = new Set<string>()
              map[dayKey].add(timeKey)
              cursor.setMinutes(cursor.getMinutes() + 30)
            }
          })
        setBookedSlotsByDay(map)
      } catch (e) {
        console.error('Error fetching booked meet slots:', e)
        setBookedSlotsByDay({})
      }
    }

    loadBookedSlots()
  }, [meetViewMode, meetWeekStart, selectedCoachId, supabase])

  useEffect(() => {
    const loadBookedSlotsMonth = async () => {
      try {
        if (!selectedCoachId) {
          setBookedSlotsByDayMonth({})
          return
        }

        const start = startOfMonth(currentDate)
        const end = addDays(endOfMonth(currentDate), 1)


        const { data, error } = await (supabase
          .from('calendar_events') as any)
          .select('start_time, end_time, event_type, coach_id')
          .eq('coach_id', selectedCoachId)
          .eq('event_type', 'consultation')
          .gte('start_time', start.toISOString())
          .lt('start_time', end.toISOString())

        if (error) {
          console.error('Error fetching month booked meet slots:', error)
          setBookedSlotsByDayMonth({})
          return
        }

        const map: Record<string, Set<string>> = {}
          ; (data || []).forEach((row: any) => {
            const startDt = new Date(row.start_time)
            const endDt = row.end_time ? new Date(row.end_time) : new Date(startDt.getTime() + 30 * 60 * 1000)

            const startMs = startDt.getTime()
            const endMs = endDt.getTime()
            if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) return

            const cursor = new Date(startDt)
            cursor.setSeconds(0, 0)
            while (cursor.getTime() < endMs) {
              const dayKey = format(cursor, 'yyyy-MM-dd')
              const timeKey = format(cursor, 'HH:mm')
              if (!map[dayKey]) map[dayKey] = new Set<string>()
              map[dayKey].add(timeKey)
              cursor.setMinutes(cursor.getMinutes() + 30)
            }
          })
        setBookedSlotsByDayMonth(map)
      } catch (e) {
        console.error('Error fetching month booked meet slots:', e)
        setBookedSlotsByDayMonth({})
      }
    }

    loadBookedSlotsMonth()
  }, [currentDate, selectedCoachId, supabase])

  useEffect(() => {
    const loadSelectedMeetDetails = async () => {
      try {
        if (!selectedMeetEvent?.id) {
          setSelectedMeetRsvpStatus('pending')
          setSelectedMeetParticipantsCount(0)
          return
        }

        setSelectedMeetRsvpLoading(true)
        const { data: auth } = await supabase.auth.getUser()
        const user = auth?.user
        if (!user?.id) {
          setSelectedMeetRsvpStatus('pending')
          setSelectedMeetParticipantsCount(0)
          return
        }

        const { data: myPart, error: myPartErr } = await (supabase
          .from('calendar_event_participants') as any)
          .select('rsvp_status')
          .eq('event_id', selectedMeetEvent.id)
          .eq('client_id', user.id)
          .maybeSingle()

        if (!myPartErr) {
          setSelectedMeetRsvpStatus(String(myPart?.rsvp_status || 'pending'))
        } else {
          console.error('Error fetching meet participant status:', myPartErr)
          setSelectedMeetRsvpStatus('pending')
        }

        const { count, error: countErr } = await (supabase
          .from('calendar_event_participants') as any)
          .select('id', { count: 'exact', head: true })
          .eq('event_id', selectedMeetEvent.id)

        if (!countErr) {
          setSelectedMeetParticipantsCount(typeof count === 'number' ? count : 0)
        } else {
          console.error('Error fetching meet participants count:', countErr)
          setSelectedMeetParticipantsCount(0)
        }
      } catch (e) {
        console.error('Error loading selected meet details:', e)
        setSelectedMeetRsvpStatus('pending')
        setSelectedMeetParticipantsCount(0)
      } finally {
        setSelectedMeetRsvpLoading(false)
      }
    }

    loadSelectedMeetDetails()
  }, [selectedMeetEvent?.id, supabase])

  const availableSlotsCountByDay = useMemo(() => {
    if (!selectedCoachId) return {} as Record<string, number>

    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(currentDate)
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

    const month = monthStart.getMonth() + 1
    const year = monthStart.getFullYear()

    const toMinutes = (hhmm: string) => {
      const [h, m] = hhmm.split(':').map((x) => parseInt(x, 10))
      if (!Number.isFinite(h) || !Number.isFinite(m)) return 0
      return h * 60 + m
    }

    const result: Record<string, number> = {}
    for (const d of days) {
      const weekday = d.getDay() // 0..6

      // Compat: weekday puede venir en DB como:
      // - 0..6 (0=Domingo)
      // - 1..7 (7=Domingo)
      // - 0..6 (0=Lunes)
      const weekdayDbCandidates = new Set<number>([
        weekday, // 0=Domingo
        weekday === 0 ? 7 : weekday, // 1..7 (7=Domingo)
        (weekday + 6) % 7, // 0=Lunes
      ])

      const rows = coachAvailabilityRows.filter((r) => {
        if (!weekdayDbCandidates.has(r.weekday)) return false
        if (r.scope === 'always') return true
        if (!r.year || !r.month) return false
        return r.year === year && r.month === month
      })

      const dayKey = format(d, 'yyyy-MM-dd')
      const booked = bookedSlotsByDayMonth?.[dayKey] || new Set<string>()

      const slots = new Set<string>()
      for (const r of rows) {
        const start = toMinutes(r.start_time)
        const end = toMinutes(r.end_time)
        for (let t = start; t + 30 <= end; t += 30) {
          const h = Math.floor(t / 60)
          const m = t % 60
          const hhmm = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
          // Validar bloques contiguos según duración
          let ok = true
          for (let i = 0; i < requiredSlotBlocks; i++) {
            const nextMins = t + i * 30
            if (nextMins + 30 > end) {
              ok = false
              break
            }
            const nh = Math.floor(nextMins / 60)
            const nm = nextMins % 60
            const nHHMM = `${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}`
            if (booked.has(nHHMM)) {
              ok = false
              break
            }
          }
          if (ok) slots.add(hhmm)
        }
      }

      if (slots.size > 0) result[dayKey] = slots.size
    }

    return result
  }, [bookedSlotsByDayMonth, coachAvailabilityRows, currentDate, requiredSlotBlocks, selectedCoachId])

  const availableSlotDays = useMemo(() => {
    return new Set<string>(Object.keys(availableSlotsCountByDay || {}))
  }, [availableSlotsCountByDay])

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return
    if (!selectedCoachId) return

    const monthStart = startOfMonth(currentDate)
    const month = monthStart.getMonth() + 1
    const year = monthStart.getFullYear()
    const days = Array.from(availableSlotDays.values()).sort((a, b) => a.localeCompare(b))

    if (days.length === 0) {
      // no-op
    }
  }, [availableSlotDays, coachAvailabilityRows, currentDate, selectedCoachId])

  useEffect(() => {
    if (!isPaidMeetFlow) {
      hasAutoOpenedPaidFlowRef.current = false
      return
    }
    if (!selectedCoachId) return
    if (hasAutoOpenedPaidFlowRef.current) return

    const days = Array.from(availableSlotDays.values()).sort((a, b) => a.localeCompare(b))
    if (days.length === 0) return

    try {
      const first = new Date(`${days[0]}T00:00:00`)
      setSelectedDate(first)
      setMeetViewMode('week')
      setMeetWeekStart(startOfWeek(first, { weekStartsOn: 1 }))
      setShowCoachRow(true)
      setShowAddMenu(false)
      hasAutoOpenedPaidFlowRef.current = true
    } catch {
      // ignore
    }
  }, [availableSlotDays, isPaidMeetFlow, selectedCoachId])

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

  const getSlotsForDate = (date: Date) => {
    if (!selectedCoachId) return [] as string[]
    const weekday = date.getDay()
    const month = date.getMonth() + 1
    const year = date.getFullYear()

    const toMinutes = (hhmm: string) => {
      const [h, m] = hhmm.split(':').map((x) => parseInt(x, 10))
      if (!Number.isFinite(h) || !Number.isFinite(m)) return 0
      return h * 60 + m
    }
    const toHHMM = (mins: number) => {
      const h = Math.floor(mins / 60)
      const m = mins % 60
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
    }

    const weekdayDbCandidates = new Set<number>([
      weekday,
      weekday === 0 ? 7 : weekday,
      (weekday + 6) % 7,
    ])

    const rows = coachAvailabilityRows.filter((r) => {
      if (!weekdayDbCandidates.has(r.weekday)) return false
      if (r.scope === 'always') return true
      if (!r.year || !r.month) return false
      return r.year === year && r.month === month
    })

    const dayKey = format(date, 'yyyy-MM-dd')
    const booked = (meetViewMode === 'week' ? bookedSlotsByDay?.[dayKey] : bookedSlotsByDayMonth?.[dayKey]) || new Set<string>()

    const slots = new Set<string>()
    for (const r of rows) {
      const start = toMinutes(r.start_time)
      const end = toMinutes(r.end_time)
      for (let t = start; t + 30 <= end; t += 30) {
        // Validar bloques contiguos según duración
        let ok = true
        for (let i = 0; i < requiredSlotBlocks; i++) {
          const nextMins = t + i * 30
          if (nextMins + 30 > end) {
            ok = false
            break
          }
          const n = toHHMM(nextMins)
          if (booked.has(n)) {
            ok = false
            break
          }
        }
        if (ok) slots.add(toHHMM(t))
      }
    }
    return Array.from(slots.values()).sort((a, b) => a.localeCompare(b))
  }

  const getWeekSlotsMap = (weekStart: Date) => {
    const days = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i))
    const map: Record<string, string[]> = {}
    for (const d of days) {
      const dayKey = format(d, 'yyyy-MM-dd')
      map[dayKey] = getSlotsForDate(d)
    }
    return map
  }

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
    // No cambiamos el meetViewMode para quedarnos en el flujo de meet
    setSelectedMeetRequest(null)
    setSelectedMeetEvent(null)
    setMeetPurchasePaid(false)
  }

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })
  const leadingEmptyDays = monthStart.getDay()

  const previousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1))
  }

  const nextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1))
  }

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
      if (availableSlotDays.has(key)) {
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
  const START_HOUR = 6
  const END_HOUR = 23
  const TOTAL_MINS = (END_HOUR - START_HOUR) * 60

  const toMins = (h: string) => {
    const [hh, mm] = h.split(':').map(Number)
    if (!Number.isFinite(hh) || !Number.isFinite(mm)) return 0
    return hh * 60 + mm
  }

  const add30 = (hhmm: string) => {
    let m = toMins(hhmm) + 30
    const hh = Math.floor(m / 60)
    const mm = m % 60
    return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
  }

  const coalesceSlots = (slots: string[]) => {
    if (!slots.length) return []
    const sorted = [...slots].sort()
    const ranges: { start: string; end: string }[] = []

    let currentStart = sorted[0]
    let currentEnd = sorted[0]
    let expectedNext = add30(currentStart)

    for (let i = 1; i < sorted.length; i++) {
      const t = sorted[i]
      if (t === expectedNext) {
        currentEnd = t
        expectedNext = add30(t)
      } else {
        ranges.push({ start: currentStart, end: add30(currentEnd) })
        currentStart = t
        currentEnd = t
        expectedNext = add30(t)
      }
    }
    ranges.push({ start: currentStart, end: add30(currentEnd) })
    return ranges
  }

  const getTop = (hhmm: string) => {
    const [h, m] = hhmm.split(':').map(Number)
    const val = h * 60 + m
    const startVal = START_HOUR * 60
    return ((val - startVal) / TOTAL_MINS) * 100
  }

  const getHeight = (durationMins: number) => {
    return (durationMins / TOTAL_MINS) * 100
  }

  const handleTimelineClick = (e: React.MouseEvent<HTMLButtonElement>, blockStart: string, blockEnd: string, dayKey: string) => {
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

    setSelectedMeetRequest({
      coachId: String(selectedCoachId),
      dayKey,
      timeHHMM,
      title: 'Meet',
      description: '',
    })
    setMeetViewMode('day_split') // Drill down to Day/Split View for booking
    setSelectedDate(addDays(new Date(dayKey), 1)) // Force date update (offset by timezone if needed, but dayKey is accurate)
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
              <span className={`text-[10px] font-bold truncate leading-tight flex-shrink-0 ${isGhost ? 'text-black' : 'text-[#FFB366]'}`}>
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
          <OmniaLoader message="Cargando calendario..." />
        </div>
      </div>
    )
  }

  if (!isMounted) return null // Avoid hydration mismatch for date-dependent rendering

  return (
    <div className="p-4 text-white w-full max-w-full overflow-x-hidden">
      {/* Acciones arriba (fuera del frame del calendario) */}
      <div className="mb-3 relative flex items-center justify-between">
        <button
          type="button"
          onClick={() => setShowMeetNotifications(true)}
          className={
            `relative w-8 h-8 rounded-full border flex items-center justify-center ` +
            `backdrop-blur-md bg-white/10 border-white/20 shadow-[0_8px_24px_rgba(0,0,0,0.35)] ` +
            `hover:bg-white/15 transition-colors`
          }
          title="Notificaciones"
          aria-label="Notificaciones"
        >
          <Bell className="h-4 w-4 text-[#FF7939]" />
          {meetNotificationsCount > 0 && (
            <span
              className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center"
              style={{ background: '#FF7939', color: '#000' }}
            >
              {meetNotificationsCount}
            </span>
          )}
        </button>

        <div className="flex items-center gap-2">
          <div
            className={
              `flex items-center gap-2 transition-all duration-200 ease-out ` +
              (showAddMenu ? 'opacity-100 translate-x-0 max-w-[220px]' : 'opacity-0 translate-x-2 max-w-0 pointer-events-none')
            }
          >
            <button
              type="button"
              onClick={() => {
                setShowCoachRow(true)
              }}
              className={
                `px-4 py-1.5 rounded-full border text-sm ` +
                `backdrop-blur-md bg-white/10 border-white/20 shadow-[0_8px_24px_rgba(0,0,0,0.35)] ` +
                `text-[#FF7939] hover:bg-white/15 transition-colors whitespace-nowrap`
              }
            >
              Meet
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              setShowAddMenu((v) => {
                const next = !v
                if (!next) setShowCoachRow(false)
                return next
              })
            }}
            className={
              `w-8 h-8 rounded-full border flex items-center justify-center ` +
              `backdrop-blur-md bg-white/10 border-white/20 shadow-[0_8px_24px_rgba(0,0,0,0.35)] ` +
              `hover:bg-white/15 transition-colors`
            }
            title={showAddMenu ? 'Cerrar' : 'Acciones'}
            aria-label={showAddMenu ? 'Cerrar' : 'Acciones'}
          >
            {showAddMenu ? (
              <Minus className="h-4 w-4 text-[#FF7939]" />
            ) : (
              <Plus className="h-4 w-4 text-[#FF7939]" />
            )}
          </button>
        </div>
      </div>

      <MeetNotificationsModal
        open={showMeetNotifications}
        onClose={() => setShowMeetNotifications(false)}
        role="client"
        supabase={supabase}
        userId={authUserId || ''}
        onOpenMeet={(eventId) => openMeetById(eventId)}
      />

      {(showCoachRow || !!selectedCoachId) && (
        <div className="mb-3">
          {coachProfiles.length === 0 ? (
            <div className="text-sm text-gray-400">
              {selectedCoachId ? 'Cargando coach...' : 'No tenés coaches asociados a compras.'}
            </div>
          ) : (
            <div className="flex items-center gap-4 overflow-x-auto pb-4 px-1 scrollbar-hide">
              {coachProfiles.map((coach) => {
                const isSelected = !!selectedCoachId && coach.id === selectedCoachId
                const isDimmed = !!selectedCoachId && coach.id !== selectedCoachId
                const availableMeets = meetCreditsByCoachId[coach.id] ?? 0

                return (
                  <div key={coach.id} className="flex items-center gap-4 flex-shrink-0 animate-in fade-in slide-in-from-left-4 duration-500">
                    <button
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          handleClearCoachForMeet()
                        } else {
                          handlePickCoachForMeet(coach.id)
                        }
                      }}
                      className={
                        `relative py-2.5 px-3 rounded-[20px] border backdrop-blur-md transition-all duration-300 flex flex-col items-center gap-2 active:scale-95 ` +
                        (isSelected
                          ? 'bg-white/10 border-white/30 shadow-lg ring-1 ring-[#FF7939]/20'
                          : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20')
                      }
                    >
                      {/* Coach Circular Photo */}
                      <div className={
                        `relative w-11 h-11 rounded-full transition-all duration-300 ` +
                        (isSelected
                          ? 'ring-1 ring-[#FF7939] ring-offset-1 ring-offset-zinc-900 scale-105'
                          : 'ring-1 ring-white/10') +
                        (isDimmed ? ' opacity-40 grayscale blur-[0.5px]' : '')
                      }>
                        <Image
                          src={coach.avatar_url || '/placeholder.svg?height=160&width=160&query=coach'}
                          alt={coach.full_name}
                          fill
                          className="rounded-full object-cover"
                          sizes="44px"
                        />
                      </div>

                      <div className="flex flex-col items-center gap-1.5 leading-none">
                        <div className="relative">
                          {/* Video Icon Standalone Orange */}
                          <div className={
                            `flex items-center justify-center transition-all duration-300 ` +
                            (isSelected ? 'opacity-100 scale-110' : 'opacity-40')
                          }>
                            <Video className="w-3.5 h-3.5 text-[#FF7939]" />
                          </div>

                          {/* Notification-style Number Badge */}
                          {availableMeets > 0 && (
                            <div className="absolute -top-1.5 -right-2 bg-[#FF7939] text-black text-[9px] font-extrabold w-3.5 h-3.5 rounded-full flex items-center justify-center">
                              {availableMeets}
                            </div>
                          )}
                        </div>

                        <div className={
                          `text-[9px] font-medium leading-[1.1] text-center max-w-[60px] transition-colors ` +
                          (isSelected ? 'text-white' : 'text-white/40')
                        }>
                          {coach.full_name.split(' ').map((part, i) => (
                            <div key={i} className="capitalize">{part.toLowerCase()}</div>
                          ))}
                        </div>
                      </div>
                    </button>

                    {isPaidMeetFlow && isSelected && (
                      <div className="flex items-center gap-5 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 ml-1 animate-in fade-in slide-in-from-left-4 duration-500">
                        <button
                          type="button"
                          onClick={() => applyConsultationSelection('express')}
                          className={
                            `flex flex-col items-center transition-opacity ` +
                            (selectedConsultationType === 'express' ? 'opacity-100' : 'opacity-60 hover:opacity-100')
                          }
                        >
                          <Zap className="w-4 h-4 text-[#FF7939]" />
                          <div className="mt-1 text-white text-[9px] font-bold uppercase tracking-wider">Express</div>
                          <div className="text-gray-400 text-[8px]">15 min</div>
                          <div className="mt-0.5 text-[#FF7939] text-[11px] font-bold">${coachConsultations.express.price}</div>
                        </button>
                        <button
                          type="button"
                          onClick={() => applyConsultationSelection('puntual')}
                          className={
                            `flex flex-col items-center transition-opacity ` +
                            (selectedConsultationType === 'puntual' ? 'opacity-100' : 'opacity-60 hover:opacity-100')
                          }
                        >
                          <Utensils className="w-4 h-4 text-[#FF7939]" />
                          <div className="mt-1 text-white text-[9px] font-bold uppercase tracking-wider">Puntual</div>
                          <div className="text-gray-400 text-[8px]">30 min</div>
                          <div className="mt-0.5 text-[#FF7939] text-[11px] font-bold">${coachConsultations.puntual.price}</div>
                        </button>
                        <button
                          type="button"
                          onClick={() => applyConsultationSelection('profunda')}
                          className={
                            `flex flex-col items-center transition-opacity ` +
                            (selectedConsultationType === 'profunda' ? 'opacity-100' : 'opacity-60 hover:opacity-100')
                          }
                        >
                          <GraduationCap className="w-4 h-4 text-[#FF7939]" />
                          <div className="mt-1 text-white text-[9px] font-bold uppercase tracking-wider">Profunda</div>
                          <div className="text-gray-400 text-[8px]">60 min</div>
                          <div className="mt-0.5 text-[#FF7939] text-[11px] font-bold">${coachConsultations.profunda.price}</div>
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {
        rescheduleContext && reschedulePreview && (
          <div
            className="fixed inset-0 z-[75] bg-black/60 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            onClick={() => setReschedulePreview(null)}
          >
            <div
              className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl p-5"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <div className="text-white font-semibold text-xl">Confirmar reprogramación</div>
                <button
                  type="button"
                  onClick={() => setReschedulePreview(null)}
                  className="w-8 h-8 rounded-full hover:bg-white/10 text-white flex items-center justify-center"
                  aria-label="Cerrar"
                >
                  <span className="text-xl leading-none">×</span>
                </button>
              </div>

              <div className="mt-3 text-sm text-white/70">
                Revisá el nuevo horario antes de enviar la solicitud.
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-2 bg-black/30 border border-[#FF7939]/30 rounded-lg px-3 py-2 text-sm text-gray-200">
                  <CalendarIcon className="h-4 w-4 text-[#FFB366]" />
                  <span className="font-medium">{format(new Date(reschedulePreview.toStartIso), 'dd MMM yyyy', { locale: es })}</span>
                </div>
                <div className="flex items-center gap-2 bg-black/30 border border-[#FF7939]/30 rounded-lg px-3 py-2 text-sm text-gray-200">
                  <Clock className="h-4 w-4 text-[#FFB366]" />
                  <span className="font-medium">
                    {(() => {
                      const a = new Date(reschedulePreview.toStartIso)
                      const b = new Date(reschedulePreview.toEndIso)
                      return `${format(a, 'HH:mm')} – ${format(b, 'HH:mm')}`
                    })()}
                  </span>
                </div>

                <div className="flex items-center gap-2 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-xs text-white/55">
                  <CalendarIcon className="h-4 w-4 text-white/45" />
                  <span className="line-through">{format(new Date(rescheduleContext.fromStart), 'dd MMM yyyy', { locale: es })}</span>
                </div>
                <div className="flex items-center gap-2 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-xs text-white/55">
                  <Clock className="h-4 w-4 text-white/45" />
                  <span className="line-through">
                    {(() => {
                      const a = new Date(rescheduleContext.fromStart)
                      const b = rescheduleContext.fromEnd ? new Date(rescheduleContext.fromEnd) : null
                      return `${format(a, 'HH:mm')}${b && !Number.isNaN(b.getTime()) ? ` – ${format(b, 'HH:mm')}` : ''}`
                    })()}
                  </span>
                </div>
              </div>

              <div className="mt-4">
                <div className="text-base font-semibold text-white">Nota (opcional)</div>
                <textarea
                  value={reschedulePreview.note}
                  onChange={(e) => setReschedulePreview((p) => (p ? { ...p, note: e.target.value } : p))}
                  className="mt-2 w-full rounded-xl bg-zinc-900 border border-white/10 px-3 py-2 text-sm text-white outline-none focus:border-[#FF7939]/60"
                  rows={3}
                  placeholder="Dejá un mensaje para tu coach..."
                />
              </div>

              <div className="mt-4 flex flex-col gap-2">
                <button
                  type="button"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#FF7939] text-black text-sm font-semibold hover:opacity-95 transition-opacity"
                  onClick={() => {
                    const send = async () => {
                      try {
                        const { data: auth } = await supabase.auth.getUser()
                        const user = auth?.user
                        if (!user?.id) return

                        const { error } = await (supabase
                          .from('calendar_event_reschedule_requests') as any)
                          .insert({
                            event_id: rescheduleContext.eventId,
                            requested_by_user_id: user.id,
                            requested_by_role: 'client',
                            from_start_time: rescheduleContext.fromStart,
                            from_end_time: rescheduleContext.fromEnd,
                            to_start_time: reschedulePreview.toStartIso,
                            to_end_time: reschedulePreview.toEndIso,
                            note: reschedulePreview.note?.trim() ? reschedulePreview.note.trim() : null,
                            status: 'pending',
                          })

                        if (error) return

                        setReschedulePreview(null)
                        setRescheduleContext(null)
                        setMeetViewMode('month')
                        setSelectedMeetEvent(rescheduleContext.snapshot)
                      } catch {
                        // ignore
                      }
                    }
                    send()
                  }}
                >
                  Enviar solicitud
                </button>

                <button
                  type="button"
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 text-white text-sm border border-white/15 hover:bg-zinc-800 transition-colors"
                  onClick={() => setReschedulePreview(null)}
                >
                  Volver
                </button>
              </div>
            </div>
          </div>
        )
      }

      <Card className="bg-zinc-900 border-zinc-800">
        {meetViewMode === 'month' && (
          <CardHeader className="pb-3">
            {scheduleMeetContext?.coachId ? (
              <div className="mb-2 text-xs text-[#FFB366]">
                Agendá tu meet: elegí un día con disponibilidad
              </div>
            ) : null}
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                onClick={previousMonth}
                className="h-8 w-8 p-0 text-gray-300 hover:text-white hover:bg-zinc-800"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <CardTitle className="text-white text-lg font-semibold">
                <span className="text-white/80">{monthLabel}</span>
              </CardTitle>

              <Button
                variant="ghost"
                onClick={nextMonth}
                className="h-8 w-8 p-0 text-gray-300 hover:text-white hover:bg-zinc-800"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>

            </div>
          </CardHeader>
        )}

        <CardContent>
          {isEditing && (
            <div className="mb-4 bg-[#FF7939]/10 border border-[#FF7939]/20 rounded-lg p-2 text-center text-xs text-[#FF7939] animate-in fade-in slide-in-from-top-2">
              {!sourceDate
                ? "Selecciona el día que quieres mover"
                : "Ahora selecciona el día destino"}
            </div>
          )}
          {meetViewMode === 'day_split' && selectedCoachId && selectedDate ? (
            <div>
              {/* Header: Back + Title */}
              <div className="flex flex-col items-center justify-center mb-4 transition-all animate-in fade-in slide-in-from-top-2 relative z-10 pointer-events-auto">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    e.nativeEvent.stopImmediatePropagation()
                    setSelectedMeetRequest(null)
                    setSelectedMeetEvent(null)
                    setMeetViewMode('week')
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  onMouseUp={(e) => e.stopPropagation()}
                  className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold text-white/50 hover:text-white transition-colors cursor-pointer relative z-10 mb-4"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  Volver a semana
                </button>

                <div className="flex items-center gap-6">
                  <Button
                    variant="ghost"
                    className="h-8 w-8 p-0 text-white/50 hover:text-white hover:bg-white/10 rounded-full"
                    onClick={() => setSelectedDate(d => d ? addDays(d, -1) : d)}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <div className="text-white font-bold text-xl capitalize">
                    {format(selectedDate, 'EEEE d MMMM', { locale: es })}
                  </div>
                  <Button
                    variant="ghost"
                    className="h-8 w-8 p-0 text-white/50 hover:text-white hover:bg-white/10 rounded-full"
                    onClick={() => setSelectedDate(d => d ? addDays(d, 1) : d)}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-6">
                {/* LEFT PANEL: TIMELINE (Slots) */}
                <div className="w-full md:w-1/2">
                  <div className="bg-transparent overflow-hidden flex flex-col relative">
                    {/* Header */}
                    <div className="flex bg-transparent">
                      <div className="w-6 flex-shrink-0" />
                      <div className="flex-1 text-center py-3">
                        {(() => {
                          const dayKey = format(selectedDate, 'yyyy-MM-dd')
                          const dayActs = activitiesByDate[dayKey] || []
                          const mins = dayMinutesByDate[dayKey]

                          // Fallback if no specific data
                          if (!dayActs.length && (!mins || (mins.pendingExercises === 0 && mins.pendingPlates === 0))) {
                            return (
                              <div className="flex flex-col justify-center h-full">
                                <div className="text-[10px] text-white/40 uppercase font-bold tracking-wider mb-0.5">
                                  {format(selectedDate, 'EEEE', { locale: es })}
                                </div>
                                <div className="text-sm font-bold text-zinc-600">
                                  Sin programación
                                </div>
                              </div>
                            )
                          }

                          return (
                            <div className="flex flex-col justify-center h-full gap-2">
                              {/* <div className="text-[10px] text-white/40 uppercase font-bold tracking-wider">
                                Resumen
                              </div> */}
                              {/* Unified Total Hours Bubble (Matches Weekly/Monthly View) */}
                              <div className="flex flex-wrap justify-center gap-3">
                                {mins?.fitnessMinutesTotal > 0 && (
                                  <span
                                    className={
                                      `inline-flex items-center justify-center px-3 py-1 rounded-full border text-xs font-semibold ` +
                                      `border-[#FF7939]/40 bg-[#FF7939]/10 text-[#FFB366]`
                                    }
                                  >
                                    <Flame className="w-3.5 h-3.5 mr-1.5" />
                                    {formatMinutes(mins.fitnessMinutesTotal)}
                                  </span>
                                )}
                                {mins?.nutritionMinutesTotal > 0 && (
                                  <span
                                    className={
                                      `inline-flex items-center justify-center px-3 py-1 rounded-full border text-xs font-semibold ` +
                                      `border-[#FFB873]/40 bg-[#FFB873]/10 text-[#FFB366]`
                                    }
                                  >
                                    <Utensils className="w-3.5 h-3.5 mr-1.5" />
                                    {formatMinutes(mins.nutritionMinutesTotal)}
                                  </span>
                                )}
                                {mins?.meetsMinutes > 0 && (
                                  <span
                                    className={
                                      `inline-flex items-center justify-center px-3 py-1 rounded-full border text-xs font-semibold ` +
                                      `border-[#FF7939]/30 bg-[#FF7939]/10 text-[#FFB366]`
                                    }
                                  >
                                    <Video className="w-3.5 h-3.5 mr-1.5" />
                                    {formatMinutes(mins.meetsMinutes)}
                                  </span>
                                )}
                              </div>
                            </div>
                          )
                        })()}
                      </div>
                    </div>

                    {/* Scrollable Body */}
                    <div className="flex-1 relative">
                      <div className="flex min-h-[1000px] h-full relative">
                        {/* Time Axis */}
                        {/* Time Axis (Day View) */}
                        <div className="w-5 flex-shrink-0 bg-transparent text-[10px] text-white/40 font-bold text-left relative pl-1">
                          {Array.from({ length: END_HOUR - START_HOUR }).map((_, i) => {
                            const h = START_HOUR + i
                            return (
                              <div key={h} className="absolute w-full" style={{ top: `${(i * 60 / TOTAL_MINS) * 100}%` }}>
                                <span className="relative -top-2">{h}</span>
                              </div>
                            )
                          })}
                        </div>

                        {/* Day Column */}
                        <div className="flex-1 relative">
                          {/* Horizontal Lines */}
                          {Array.from({ length: END_HOUR - START_HOUR }).map((_, i) => (
                            <div key={`grid-${i}`} className="absolute w-full border-t border-white/5 pointer-events-none" style={{ top: `${(i * 60 / TOTAL_MINS) * 100}%` }} />
                          ))}

                          {/* Client Events */}
                          {renderClientEvents(format(selectedDate, 'yyyy-MM-dd'))}

                          {/* Available Blocks */}
                          {(() => {
                            const slots = getSlotsForDate(selectedDate)
                            const blocks = coalesceSlots(slots)
                            return blocks.map((block, idx) => {
                              const startMins = Number(block.start.split(':')[0]) * 60 + Number(block.start.split(':')[1])
                              const endMins = Number(block.end.split(':')[0]) * 60 + Number(block.end.split(':')[1])
                              const duration = endMins - startMins
                              return (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={(e) => {
                                    const dayKey = format(selectedDate, 'yyyy-MM-dd')
                                    handleTimelineClick(e, block.start, block.end, dayKey)
                                  }}
                                  style={{
                                    top: `${getTop(block.start)}%`,
                                    height: `${getHeight(duration)}%`
                                  }}
                                  className={`absolute left-0 right-0 mx-1 rounded-md border text-[10px] font-medium flex items-center justify-center
                                      overflow-hidden transition-all shadow-sm group
                                      bg-[#FF7939]/10 border-[#FF7939]/30 text-[#FFB366] hover:bg-[#FF7939]/20 hover:border-[#FF7939]/50 hover:scale-[1.02] z-10 hover:z-20`}
                                >
                                  <div className="flex flex-col items-center justify-center leading-none gap-0.5 w-full h-full p-0.5">
                                    <span className="font-bold truncate">{block.start}</span>
                                    <span className="text-[8px] opacity-60">-</span>
                                    <span className="font-bold truncate">{block.end}</span>
                                  </div>
                                </button>
                              )
                            })
                          })()}

                          {/* Ghost Block */}

                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* RIGHT PANEL: BOOKING FORM */}
                <div className="w-full md:w-1/2">
                  <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 h-full flex flex-col justify-center">
                    {!selectedMeetRequest ? (
                      <div className="text-center py-12">
                        <Clock className="w-12 h-12 text-white/10 mx-auto mb-3" />
                        <h3 className="text-white/40 font-medium">Seleccioná un horario</h3>
                        <p className="text-white/20 text-sm mt-1">Elige un bloque de la izquierda para continuar.</p>
                      </div>
                    ) : (
                      <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <h3 className="text-lg font-semibold text-white mb-4">Configurar Meet</h3>

                        {/* TITLE INPUT */}
                        <div className="mb-5">
                          <label className="text-xs text-white/50 font-semibold mb-2 block uppercase tracking-wide">Título</label>
                          <input
                            type="text"
                            value={selectedMeetRequest.title}
                            onChange={(e) => setSelectedMeetRequest(p => p ? ({ ...p, title: e.target.value }) : null)}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#FF7939]/50 transition-colors"
                            placeholder="Ej: Revisión de técnica"
                          />
                        </div>

                        {/* DURATION SELECTOR */}
                        <div className="mb-5">
                          <label className="text-xs text-white/50 font-semibold mb-2 block uppercase tracking-wide">Duración</label>
                          <div className="grid grid-cols-3 gap-2">
                            {([
                              { id: 'express', label: '15 min', min: 15 },
                              { id: 'puntual', label: '30 min', min: 30 },
                              { id: 'profunda', label: '60 min', min: 60 }
                            ] as const).map((opt) => {
                              const isActive = selectedConsultationType === opt.id
                              return (
                                <button
                                  key={opt.id}
                                  type="button"
                                  onClick={() => setSelectedConsultationType(opt.id)}
                                  className={`
                                    py-2 rounded-lg text-xs font-bold border transition-all
                                    ${isActive
                                      ? 'bg-white text-black border-white shadow-md'
                                      : 'bg-transparent text-white/60 border-white/10 hover:border-white/30'
                                    }
                                  `}
                                >
                                  {opt.label}
                                </button>
                              )
                            })}
                          </div>
                        </div>

                        {/* TIME EDITOR */}
                        <div className="mb-5">
                          <label className="text-xs text-white/50 font-semibold mb-2 block uppercase tracking-wide">Horario</label>
                          <div className="flex items-center gap-3">
                            <div className="flex-1">
                              <div className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 flex items-center gap-2 focus-within:border-[#FF7939]/50 transition-colors">
                                <Clock className="w-4 h-4 text-[#FF7939]" />
                                <input
                                  type="time"
                                  className="bg-transparent border-none text-white text-sm font-semibold focus:outline-none w-full [color-scheme:dark]"
                                  value={selectedMeetRequest.timeHHMM}
                                  onChange={(e) => {
                                    if (e.target.value) {
                                      setSelectedMeetRequest(p => p ? ({ ...p, timeHHMM: e.target.value }) : null)
                                    }
                                  }}
                                />
                              </div>
                            </div>
                            <div className="text-white/30 font-medium">➔</div>
                            <div className="flex-1">
                              <div className="bg-white/5 border border-white/5 rounded-xl px-3 py-2 flex items-center justify-center gap-2">
                                <span className="text-white/60 text-sm font-medium">
                                  {(() => {
                                    const mins = coachConsultations[selectedConsultationType].time
                                    const [h, m] = selectedMeetRequest.timeHHMM.split(':').map(x => parseInt(x) || 0)
                                    const total = h * 60 + m + mins
                                    const endH = Math.floor(total / 60) % 24
                                    const endM = total % 60
                                    return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`
                                  })()}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* NOTE */}
                        <div className="mb-6">
                          <label className="text-xs text-white/50 font-semibold mb-2 block uppercase tracking-wide">Nota</label>
                          <textarea
                            value={selectedMeetRequest.description || ''}
                            onChange={(e) => setSelectedMeetRequest(p => p ? ({ ...p, description: e.target.value }) : null)}
                            className="w-full h-20 bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#FF7939]/50 transition-colors resize-none"
                            placeholder="¿Sobre qué te gustaría hablar?"
                          />
                        </div>

                        {/* ACTION */}
                        <div className="flex flex-col gap-2">
                          <div className="text-xs text-white/40 text-center mb-2">
                            Se descontará {isPaidMeetFlow ? 'dinero' : `${Math.ceil(coachConsultations[selectedConsultationType].time / 15)} crédito${Math.ceil(coachConsultations[selectedConsultationType].time / 15) > 1 ? 's' : ''}`} de tu cuenta.
                          </div>
                          <button
                            type="button"
                            className="w-full py-3 rounded-xl bg-[#FF7939] text-black font-bold text-sm hover:opacity-90 transition-opacity shadow-[0_4px_12px_rgba(255,121,57,0.25)]"
                            onClick={async () => {
                              // REUSED LOGIC FROM MODAL
                              // We need to either call the same function or duplicate the logic. 
                              // For safety/speed, duplicating the core submission logic here.

                              const canConfirm = !isPaidMeetFlow
                                ? (Number(meetCreditsByCoachId?.[String(selectedMeetRequest.coachId)] ?? 0) > 0)
                                : meetPurchasePaid

                              if (!canConfirm && !isPaidMeetFlow) return // Prevent if no credits

                              if (isPaidMeetFlow && !meetPurchasePaid) {
                                // Trigger Payment Logic
                                const actId = scheduleMeetContext?.activityId ? String(scheduleMeetContext.activityId) : null
                                if (!actId) return

                                const duration = coachConsultations[selectedConsultationType].time
                                try {
                                  sessionStorage.setItem(
                                    'pending_meet_booking',
                                    JSON.stringify({
                                      coachId: String(selectedMeetRequest.coachId),
                                      activityId: actId,
                                      dayKey: selectedMeetRequest.dayKey,
                                      timeHHMM: selectedMeetRequest.timeHHMM,
                                      durationMinutes: duration,
                                    })
                                  )
                                } catch { }
                                const res = await createCheckoutProPreference(actId)
                                if (res?.success && res?.initPoint) {
                                  redirectToMercadoPagoCheckout(res.initPoint, actId, res.preferenceId)
                                }
                                return
                              }

                              // Perform Booking
                              try {
                                setSelectedMeetRsvpLoading(true)
                                const duration = coachConsultations[selectedConsultationType].time
                                const startIso = new Date(`${selectedMeetRequest.dayKey}T${selectedMeetRequest.timeHHMM}:00`).toISOString()
                                const endIso = new Date(new Date(startIso).getTime() + duration * 60 * 1000).toISOString()

                                const { data: auth } = await supabase.auth.getUser()
                                const user = auth?.user
                                if (!user?.id) return

                                const { data: newEvent, error } = await (supabase.from('calendar_events') as any).insert({
                                  title: selectedMeetRequest.title || 'Meet',
                                  description: selectedMeetRequest.description,
                                  start_time: startIso,
                                  end_time: endIso,
                                  coach_id: selectedMeetRequest.coachId,
                                  client_id: user.id, // RLS requirement: auth.uid() must match client_id for client bookings
                                  event_type: 'consultation',
                                  status: 'scheduled',
                                  activity_id: scheduleMeetContext?.activityId ? Number(scheduleMeetContext.activityId) : null
                                }).select('id').single()

                                if (!error && newEvent?.id) {
                                  // Must insert participant as well
                                  await (supabase.from('calendar_event_participants') as any).insert({
                                    event_id: newEvent.id,
                                    client_id: user.id,
                                    rsvp_status: 'pending',
                                    invited_by_user_id: user.id,
                                    invited_by_role: 'client',
                                  })

                                  // Refresh
                                  setMeetViewMode('month')
                                  setSelectedMeetRequest(null)
                                  if (onSetScheduleMeetContext) onSetScheduleMeetContext(null)
                                  setShowSuccessModal(true)
                                  setSuccessModalData({
                                    coachName: coachProfiles.find(c => c.id === selectedCoachId)?.full_name || 'Coach',
                                    date: format(new Date(startIso), 'dd MMM yyyy', { locale: es }),
                                    time: `${selectedMeetRequest.timeHHMM} – ...`,
                                    duration: duration
                                  })
                                }
                              } catch (e) {
                                console.error(e)
                              } finally {
                                setSelectedMeetRsvpLoading(false)
                              }
                            }}
                          >
                            {isPaidMeetFlow && !meetPurchasePaid ? 'Ir a Pagar' : 'Confirmar Reserva'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : meetViewMode === 'week' && selectedCoachId ? (
            <div>
              <div className="flex items-center justify-center mb-2">
                <Button
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedMeetRequest(null)
                    setSelectedMeetEvent(null)
                    setMeetViewMode('month')
                  }}
                  className="gap-1 px-4 py-1 text-xs text-white/60 hover:text-white transition-colors h-7 flex items-center"
                >
                  <ChevronLeft className="h-3 w-3" />
                  Volver al mes
                </Button>
              </div>
              <div className="flex items-center justify-between mb-3 px-2">
                <Button
                  variant="ghost"
                  onClick={() => setMeetWeekStart((d) => addDays(d, -7))}
                  className="h-8 w-8 p-0 text-gray-300 hover:text-white hover:bg-zinc-800"
                  title="Semana anterior"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="text-white font-bold text-lg capitalize">
                  {format(meetWeekStart, "MMMM", { locale: es })}
                  <span className="ml-1.5 text-sm font-normal text-white/50 lowercase">
                    {format(meetWeekStart, "d", { locale: es })} - {format(addDays(meetWeekStart, 6), "d", { locale: es })}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  onClick={() => setMeetWeekStart((d) => addDays(d, 7))}
                  className="h-8 w-8 p-0 text-gray-300 hover:text-white hover:bg-zinc-800"
                  title="Semana siguiente"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {(() => {
                const weekSlotsMap = getWeekSlotsMap(meetWeekStart)

                // Helper to merge adjacent 30-min slots
                const coalesceSlots = (slots: string[]) => {
                  if (!slots.length) return []
                  const sorted = [...slots].sort()
                  const ranges: { start: string; end: string }[] = []

                  let currentStart = sorted[0]
                  let currentEnd = sorted[0]

                  const toMins = (h: string) => {
                    const [hh, mm] = h.split(':').map(Number)
                    return hh * 60 + mm
                  }

                  const add30 = (h: string) => {
                    let m = toMins(h) + 30
                    const hh = Math.floor(m / 60)
                    const mm = m % 60
                    return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
                  }

                  let expectedNext = add30(currentStart)

                  for (let i = 1; i < sorted.length; i++) {
                    const t = sorted[i]
                    if (t === expectedNext) {
                      // Continuous
                      currentEnd = t
                      expectedNext = add30(t)
                    } else {
                      // Gap/Break
                      // End of previous block is currentEnd + 30 mins
                      ranges.push({ start: currentStart, end: add30(currentEnd) })
                      currentStart = t
                      currentEnd = t
                      expectedNext = add30(t)
                    }
                  }
                  // Push last
                  ranges.push({ start: currentStart, end: add30(currentEnd) })
                  return ranges
                }

                // Config for Vertical Axis
                const START_HOUR = 6
                const END_HOUR = 23
                const TOTAL_MINS = (END_HOUR - START_HOUR) * 60
                const getTop = (hhmm: string) => {
                  const [h, m] = hhmm.split(':').map(Number)
                  const val = h * 60 + m
                  const startVal = START_HOUR * 60
                  return ((val - startVal) / TOTAL_MINS) * 100
                }
                const getHeight = (durationMins: number) => {
                  return (durationMins / TOTAL_MINS) * 100
                }

                // (renderClientEvents helper moved to component scope)

                return (
                  <div className="relative overflow-hidden flex flex-col w-full h-full">
                    {/* Header Row */}
                    <div className="flex bg-transparent">
                      <div className="w-6 flex-shrink-0 border-r border-transparent" />
                      <div className="flex flex-1">
                        {Array.from({ length: 7 }).map((_, idx) => {
                          const d = addDays(meetWeekStart, idx)
                          const label = format(d, 'EEE', { locale: es })
                          const dayNum = format(d, 'd')
                          const isTodayDay = isToday(d)
                          const dayKey = format(d, 'yyyy-MM-dd')
                          const mins = dayMinutesByDate[dayKey]

                          const totalPendingMins = (mins?.fitnessMinutesPending || 0) + (mins?.nutritionMinutesPending || 0)
                          const totalPendingItems = (mins?.pendingPlates || 0) + (mins?.pendingExercises || 0)

                          return (
                            <div key={idx} className={`flex-1 text-center py-2 ${isTodayDay ? 'bg-white/5' : ''}`}>
                              <div className="text-xs text-white/50 uppercase font-semibold">{label}</div>
                              <div className={`text-sm font-bold ${isTodayDay ? 'text-[#FF7939]' : 'text-white'}`}>{dayNum}</div>

                              {/* Activity Summary Bubbles - Split by Category */}
                              <div className="flex flex-col items-center gap-1 mt-1.5 min-h-[22px]">
                                {mins?.fitnessMinutesTotal > 0 && (
                                  <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-full border text-[9px] font-semibold border-[#FF7939]/40 bg-[#FF7939]/10 text-[#FFB366] gap-0.5">
                                    <Flame className="w-2.5 h-2.5" />
                                    {formatMinutes(mins.fitnessMinutesTotal)}
                                  </span>
                                )}
                                {mins?.nutritionMinutesTotal > 0 && (
                                  <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-full border text-[9px] font-semibold border-[#FFB873]/40 bg-[#FFB873]/10 text-[#FFD1B5] gap-0.5">
                                    <Utensils className="w-2.5 h-2.5" />
                                    {formatMinutes(mins.nutritionMinutesTotal)}
                                  </span>
                                )}
                                {mins?.meetsMinutes > 0 && (
                                  <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-full border text-[9px] font-semibold border-white/20 bg-white/5 text-white/70 gap-0.5">
                                    <Video className="w-2.5 h-2.5" />
                                    {formatMinutes(mins.meetsMinutes)}
                                  </span>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* Scrollable Body (Week View) */}
                    <div className="flex-1 relative">
                      <div className="flex min-h-[1000px] h-full relative">
                        {/* Time Axis */}
                        <div className="w-5 flex-shrink-0 bg-transparent text-[10px] text-white/40 font-bold text-left relative pl-1">
                          {Array.from({ length: END_HOUR - START_HOUR }).map((_, i) => {
                            const h = START_HOUR + i
                            return (
                              <div key={h} className="absolute w-full" style={{ top: `${(i * 60 / TOTAL_MINS) * 100}%` }}>
                                <span className="relative -top-2">{h}</span>
                              </div>
                            )
                          })}
                        </div>

                        {/* Days Columns */}
                        <div className="flex flex-1 relative">
                          {/* Horizontal grid lines */}
                          {Array.from({ length: END_HOUR - START_HOUR }).map((_, i) => (
                            <div key={`grid-${i}`} className="absolute w-full border-t border-white/5 pointer-events-none" style={{ top: `${(i * 60 / TOTAL_MINS) * 100}%` }} />
                          ))}

                          {Array.from({ length: 7 }).map((_, idx) => {
                            const d = addDays(meetWeekStart, idx)
                            const dayKey = format(d, 'yyyy-MM-dd')
                            const slots = weekSlotsMap[dayKey] || []
                            const blocks = coalesceSlots(slots)
                            const isTodayDay = isToday(d)
                            const isGhost = selectedMeetRequest?.dayKey === dayKey

                            return (
                              <div key={dayKey} className={`flex-1 relative ${isTodayDay ? 'bg-white/5' : ''}`}>
                                {/* Client Events (Rendered BEFORE available slots so slots cover them? No, events should probably be ON TOP or clearly distinct) 
                      Actually, if an event exists, usually the slot is NOT available. 
                      But if the slot IS available (e.g. coach open), we want to show the client already has something?
                      Let's render events ON TOP (z-25) as defined in helper, blocks are (z-0 but hover z-10).
                  */}
                                {renderClientEvents(dayKey)}

                                {/* Available Blocks */}
                                {blocks.map((block, bIdx) => {
                                  const startMins = Number(block.start.split(':')[0]) * 60 + Number(block.start.split(':')[1])
                                  const endMins = Number(block.end.split(':')[0]) * 60 + Number(block.end.split(':')[1])
                                  const duration = endMins - startMins

                                  return (
                                    <button
                                      key={`${dayKey}-${bIdx}`}
                                      type="button"
                                      onClick={(e) => handleTimelineClick(e, block.start, block.end, dayKey)}
                                      style={{
                                        top: `${getTop(block.start)}%`,
                                        height: `${getHeight(duration)}%`
                                      }}
                                      className="absolute inset-x-0.5 rounded-md bg-[#FFB366]/20 border border-[#FFB366]/30 hover:bg-[#FFB366]/30 hover:z-10 transition-colors flex flex-col justify-center items-center px-1 py-1 group cursor-pointer"
                                    >
                                      <div className="flex flex-col items-center justify-center leading-tight">
                                        <span className="text-[10px] font-bold text-[#FFB366] group-hover:text-white truncate">
                                          {block.start}
                                        </span>
                                        <span className="text-[8px] text-[#FFB366]/60 group-hover:text-white/60">
                                          -
                                        </span>
                                        <span className="text-[10px] font-bold text-[#FFB366] group-hover:text-white truncate">
                                          {block.end}
                                        </span>
                                      </div>
                                    </button>
                                  )
                                })}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })()}

              <div className="flex justify-center mt-4">
                <button
                  type="button"
                  onClick={() => setMeetViewMode('month')}
                  className="px-4 py-2 rounded-full border text-sm backdrop-blur-md bg-white/10 border-white/20 text-white hover:bg-white/15 transition-colors"
                >
                  Volver al mes
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
                {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((day) => (
                  <div key={day} className="text-center text-sm font-semibold text-gray-400">
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1 sm:gap-2">
                {Array.from({ length: leadingEmptyDays }).map((_, idx) => (
                  <div key={`empty-${idx}`} className="aspect-square p-2" />
                ))}

                {daysInMonth.map((day) => {
                  const dateKey = format(day, 'yyyy-MM-dd')
                  const activities = activitiesByDate[dateKey] || []
                  const hasActivities = activities.length > 0
                  const totalPending = activities.reduce((sum, a: any) => {
                    const n = typeof a.pendingCount === 'number' ? a.pendingCount : 0
                    return sum + n
                  }, 0)

                  const mins = dayMinutesByDate[dateKey]
                  const pendingMinutes = (mins?.fitnessMinutesPending ?? 0) + (mins?.nutritionMinutesPending ?? 0)
                  const busyMinutes = pendingMinutes + (mins?.meetsMinutes ?? 0)
                  const meets = meetEventsByDate?.[dateKey] || []
                  const hasClientMeet = (meets.length ?? 0) > 0
                  const hasPendingClientMeet = meets.some((m) => String((m as any)?.rsvp_status || 'pending') === 'pending')

                  const isSource = isEditing && sourceDate && isSameDay(day, sourceDate)
                  const isSelected = selectedDate ? isSameDay(day, selectedDate) : false
                  const isTodayDate = isToday(day)

                  const coachSlotsCount = availableSlotsCountByDay[dateKey] || 0
                  const hasMeetSlots = coachSlotsCount > 0

                  return (
                    <button
                      key={day.toISOString()}
                      type="button"
                      onClick={() => handleDateClick(day)}
                      className={
                        `aspect-square p-1.5 sm:p-2 rounded-lg text-sm font-medium transition-colors flex flex-col items-center justify-start relative ` +
                        `${isSelected ? 'backdrop-blur-md bg-white/10 border border-[#FF7939]/40 shadow-[0_8px_24px_rgba(0,0,0,0.35)] text-white' : ''} ` +
                        `${isSource ? 'bg-[#FF7939]/20 ring-1 ring-[#FF7939] text-white' : ''} ` +
                        `${isTodayDate && !isSelected && !isSource ? 'bg-zinc-800 text-white' : ''} ` +
                        `${!isSelected && !isTodayDate && !isSource ? 'text-gray-400 hover:bg-zinc-800' : ''}`
                      }
                    >
                      {isSource && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#FF7939] rounded-full flex items-center justify-center text-[8px] font-bold text-white z-10">
                          1
                        </div>
                      )}
                      <div className="w-full text-center">
                        <span>
                          {format(day, 'd')}
                        </span>
                      </div>

                      {hasActivities && totalPending > 0 && (
                        <div className="mt-1 flex items-center justify-center">
                          <span
                            className="inline-flex items-center justify-center min-w-[18px] h-5 px-1.5 rounded-full text-xs font-semibold"
                            style={{ background: '#FF7939', color: '#000' }}
                          >
                            <span className="inline-flex items-center gap-0.5">
                              <Flame className="w-3 h-3" />
                              <span className="text-[10px] font-bold text-black leading-none">
                                {totalPending}
                              </span>
                            </span>
                          </span>
                        </div>
                      )}

                      {busyMinutes > 0 && (
                        <div className="mt-1 flex items-center justify-center">
                          <span
                            className={
                              `inline-flex items-center justify-center px-2 py-0.5 rounded-full border text-[10px] font-semibold ` +
                              `border-[#FF7939]/40 bg-[#FF7939]/10 text-[#FFB366]`
                            }
                          >
                            {formatMinutes(busyMinutes)}
                          </span>
                        </div>
                      )}

                      {hasMeetSlots && (
                        <div className="mt-1 flex items-center justify-center">
                          <span
                            className={
                              `inline-flex items-center justify-center px-2 py-0.5 rounded-full border text-[10px] font-semibold ` +
                              `border-[#FF7939]/30 bg-[#FF7939]/10 text-[#FFD1B5]`
                            }
                          >
                            {(() => {
                              const hrs = coachSlotsCount * 0.5
                              return `${hrs % 1 === 0 ? hrs : hrs.toFixed(1)}h disp`
                            })()}
                          </span>
                        </div>
                      )}

                      {hasClientMeet && (
                        <div className="mt-1 flex items-center justify-center">
                          <span
                            className={
                              hasPendingClientMeet
                                ? 'inline-flex items-center justify-center w-6 h-6 rounded-full border border-[#FF3B30]/40 bg-[#FF3B30]/15'
                                : 'inline-flex items-center justify-center w-6 h-6 rounded-full border border-white/20 bg-white/10'
                            }
                          >
                            <Video className={hasPendingClientMeet ? 'w-3.5 h-3.5 text-[#FF3B30]' : 'w-3.5 h-3.5 text-white'} />
                          </span>
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {
        selectedDate && meetViewMode === 'month' && (
          <div className="mt-4" ref={dayDetailRef}>
            {(() => {
              const key = format(selectedDate, 'yyyy-MM-dd')
              const mins = dayMinutesByDate[key]
              const meets = meetEventsByDate[key] || []
              const pendingMinutes = (mins?.fitnessMinutesPending ?? 0) + (mins?.nutritionMinutesPending ?? 0)
              const meetMinutes = mins?.meetsMinutes ?? 0
              const dateLabel = isToday(selectedDate) ? 'Hoy' : format(selectedDate, 'dd/MM/yyyy', { locale: es })
              const summaryParts: string[] = []
              if (pendingMinutes > 0) summaryParts.push(`${formatMinutes(pendingMinutes)} de actividades`)
              if (meetMinutes > 0) summaryParts.push(`${formatMinutes(meetMinutes)} en vivo`)
              const summary = summaryParts.join(' · ')

              return (
                <div className="mb-3">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-white/95">Actividades · {dateLabel}</h3>
                  </div>
                  {summaryParts.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {mins?.fitnessMinutesPending > 0 && (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-[#FF7939]/40 bg-[#FF7939]/10 text-[#FFB366] text-[10px] font-bold">
                          <Flame className="h-3 w-3" />
                          Fitness {formatMinutes(mins.fitnessMinutesPending)}
                        </div>
                      )}
                      {mins?.nutritionMinutesPending > 0 && (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-[#FFB873]/40 bg-[#FFB873]/10 text-[#FFB366] text-[10px] font-bold">
                          <Utensils className="h-3 w-3" />
                          Nutrición {formatMinutes(mins.nutritionMinutesPending)}
                        </div>
                      )}
                      {meetMinutes > 0 && (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-[#FF7939]/30 bg-[#FF7939]/10 text-[#FFB366] text-[10px] font-bold">
                          <Video className="h-3 w-3" />
                          {formatMinutes(meetMinutes)} en vivo
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })()}

            {(() => {
              const key = format(selectedDate, 'yyyy-MM-dd')
              const meets = meetEventsByDate[key] || []
              if (meets.length === 0) return null
              return (
                <div className="mb-4">
                  <div className="text-[11px] tracking-widest text-white/45 mb-2">MEET</div>
                  <div className="space-y-2">
                    {meets.map((m) => {
                      const start = new Date(m.start_time)
                      const end = m.end_time ? new Date(m.end_time) : null
                      const label = `${format(start, 'HH:mm')}${end && !Number.isNaN(end.getTime()) ? ` – ${format(end, 'HH:mm')}` : ''}`
                      const isPending = String((m as any)?.rsvp_status || 'pending') === 'pending'

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

                      const handleOpenDetail = () => {
                        setSelectedMeetEvent(m)
                      }

                      return (
                        <div
                          key={m.id}
                          className={
                            `w-full rounded-xl border px-3 py-2 flex items-center justify-between gap-3 ` +
                            `border-white/10 bg-white/5`
                          }
                          role="button"
                          tabIndex={0}
                          onClick={handleOpenDetail}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') handleOpenDetail()
                          }}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <Video className={isPending ? 'h-4 w-4 text-[#FF7939]' : 'h-4 w-4 text-white/70'} />
                            <div className="min-w-0">
                              <div className="text-sm font-semibold text-white truncate">{m.title ? String(m.title) : 'Meet'}</div>
                              <div className="text-xs text-white/65 truncate">{label}</div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEnter()
                            }}
                            className={
                              `px-4 py-1.5 rounded-full text-xs font-semibold border transition-colors flex-shrink-0 ` +
                              `border-[#FF7939]/60 text-[#FFB366] hover:bg-[#FF7939]/10`
                            }
                          >
                            Ir a la meet
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })()}

            {selectedDayActivityItems.length > 0 && (
              <div className="mb-4">
                <div className="text-[11px] tracking-widest text-white/45 mb-2">PENDIENTES</div>
                <div className="space-y-2">
                  {selectedDayActivityItems.map((it) => {
                    const isNutri = String(it.activityTypeLabel || '').toLowerCase().includes('nutri')
                    const coachNameForActivity = (() => {
                      const cid = activitiesInfo?.[String(it.activityId)]?.coach_id
                      if (!cid) return null
                      return coachProfiles.find((c) => c.id === String(cid))?.full_name || null
                    })()

                    const totalPlates = (() => {
                      const raw = String(it.pendingCountLabel || '')
                      if (!raw.toLowerCase().includes('plato')) return null
                      const m = raw.match(/(\d+)/)
                      if (!m) return null
                      const n = Number(m[1])
                      return Number.isFinite(n) ? n : null
                    })()
                    const done = 0
                    const subtitle = totalPlates != null ? `${done}/${totalPlates} platos` : it.pendingCountLabel

                    return (
                      <button
                        key={it.activityId}
                        type="button"
                        onClick={() => onActivityClick(it.activityId)}
                        className="w-full text-left px-3 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/7 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            {isNutri ? (
                              <Utensils className="h-4 w-4 text-[#FF7939]" />
                            ) : (
                              <Flame className="h-4 w-4 text-[#FF7939]" />
                            )}
                            <div className="min-w-0">
                              <div className="text-sm font-semibold text-white truncate">{it.activityTitle}</div>
                              <div className="text-xs text-white/65 truncate flex items-center gap-2">
                                <span>{subtitle}</span>
                                {/* Duration Badge */}
                                {activityStats[String(it.activityId)]?.minutes > 0 && (
                                  <span className="text-[#FFB366] bg-[#FF7939]/10 px-1.5 rounded text-[10px] font-bold">
                                    {formatMinutes(activityStats[String(it.activityId)].minutes)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <span
                            className={
                              `px-4 py-1.5 rounded-full text-xs font-semibold border transition-colors flex-shrink-0 ` +
                              `border-white/15 text-white/80 hover:bg-white/10`
                            }
                          >
                            Ir al programa
                          </span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {(() => {
              const key = format(selectedDate, 'yyyy-MM-dd')
              const hasMeets = (meetEventsByDate[key]?.length ?? 0) > 0
              const hasBreakdown = selectedDayActivityItems.length > 0
              const hasLegacy = (activitiesByDate[key]?.length ?? 0) > 0
              if (hasMeets || hasBreakdown || hasLegacy) return null
              return <div className="text-sm text-gray-400">Sin actividades para este día</div>
            })()}

            <div className="space-y-2">
              {(activitiesByDate[format(selectedDate, 'yyyy-MM-dd')] || []).map((activity, index) => {
                const info = activitiesInfo[activity.id]
                const type = info?.type || 'program'
                const categoria = (info?.categoria || '').toLowerCase()
                const pendingCount = typeof activity.pendingCount === 'number' ? activity.pendingCount : 0

                // Colores del frame según tipo:
                // - Naranja fuerte: programa
                // - Naranja claro: taller
                // - Blanco: consulta / meet con coach
                let borderClass = 'border-[#FF7939]'
                let bgClass = 'bg-[#FF7939]/10'
                let label = 'Programa'

                if (type === 'workshop') {
                  borderClass = 'border-[#FFB873]'
                  bgClass = 'bg-[#FFB873]/12'
                  label = 'Taller'
                } else if (type === 'consultation' || categoria === 'consultation') {
                  borderClass = 'border-white/80'
                  bgClass = 'bg-black'
                  label = 'Consulta / Meet'
                } else if (categoria === 'nutricion' || categoria === 'nutrition') {
                  label = 'Programa de nutrición'
                }

                return (
                  <button
                    key={index}
                    onClick={() => onActivityClick(activity.id)}
                    className={`
                    w-full text-left p-3 rounded-xl border relative
                    ${borderClass} ${bgClass}
                    hover:bg-white/5 transition-colors
                  `}
                    style={{ backgroundClip: 'padding-box' }}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex flex-col flex-1 min-w-0">
                        <span className="text-sm font-semibold text-white truncate">
                          {info?.title || `Actividad ${activity.id}`}
                        </span>
                        <span className="text-[11px] text-gray-300 mt-0.5 flex items-center gap-2">
                          {label}
                          {/* Duration Badge for non-pending items map (if any exist here) */}
                          {activityStats[String(activity.id)]?.minutes > 0 && (
                            <span className="text-[#FFB366] bg-[#FF7939]/10 px-1.5 rounded text-[10px] font-bold">
                              {formatMinutes(activityStats[String(activity.id)].minutes)}
                            </span>
                          )}
                        </span>
                      </div>

                      {/* Fuego con cantidad DENTRO del frame, bien visible */}
                      {pendingCount > 0 && (
                        <div
                          className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
                          style={{
                            background: '#FF7939',
                          }}
                        >
                          <div className="flex items-center gap-0.5">
                            <Flame className="w-3 h-3 text-black" />
                            <span className="text-[10px] font-bold text-black leading-none">
                              {pendingCount}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Tags adicionales si es taller o consulta */}
                      {type === 'workshop' && (
                        <span className="flex-shrink-0 px-2 py-1 rounded-full text-[10px] font-semibold text-[#FFB873] bg-black/40 border border-[#FFB873]/60">
                          Taller
                        </span>
                      )}
                      {(type === 'consultation' || categoria === 'consultation') && (
                        <span className="flex-shrink-0 px-2 py-1 rounded-full text-[10px] font-semibold text-white bg-black/60 border border-white/60">
                          Meet
                        </span>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )
      }

      {
        selectedMeetEvent && (
          <div
            className="fixed inset-0 z-[70] bg-black/60 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            onClick={() => setSelectedMeetEvent(null)}
          >
            <div
              className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl p-5"
              onClick={(e) => e.stopPropagation()}
            >


              {(() => {
                const start = new Date(selectedMeetEvent.start_time)
                const end = selectedMeetEvent.end_time ? new Date(selectedMeetEvent.end_time) : null
                const timeLabel = `${format(start, 'HH:mm')}${end && !Number.isNaN(end.getTime()) ? ` – ${format(end, 'HH:mm')}` : ''}`
                const dateLabel = format(start, 'dd MMM yyyy', { locale: es })
                const coachName = selectedMeetEvent.coach_id
                  ? (coachProfiles.find((c) => c.id === String(selectedMeetEvent.coach_id))?.full_name || 'Coach')
                  : 'Coach'
                const coachAvatarUrl = selectedMeetEvent.coach_id
                  ? (coachProfiles.find((c) => c.id === String(selectedMeetEvent.coach_id))?.avatar_url || null)
                  : null

                const nowMs = Date.now()
                const startMs = start.getTime()
                const canEditRsvp = Number.isFinite(startMs) && startMs - nowMs > 24 * 60 * 60 * 1000

                const isConfirmed = selectedMeetRsvpStatus === 'confirmed'
                const isDeclined = selectedMeetRsvpStatus === 'declined'
                const isCancelled = selectedMeetRsvpStatus === 'cancelled'
                const isGroup = selectedMeetParticipantsCount > 1
                const classLabel = isGroup ? 'Grupal' : '1:1'

                const invitedBy = (selectedMeetEvent as any)?.invited_by_role
                const isCoachHost = invitedBy === 'coach'

                const statusLabel = (() => {
                  if (isConfirmed) return 'Confirmada'
                  if (isDeclined) return 'Rechazada'
                  if (isCancelled) return 'Cancelada'
                  return 'Pendiente'
                })()

                const updateMeetStatus = async (eventId: string, newStatus: string) => {
                  try {
                    const { data: auth } = await supabase.auth.getUser()
                    const userId = auth.user?.id
                    if (!userId) return

                    const { data: existing } = await (supabase.from('calendar_event_participants') as any).select('id').eq('event_id', eventId).eq('client_id', userId).single()

                    if (existing) {
                      await (supabase.from('calendar_event_participants') as any).update({ rsvp_status: newStatus }).eq('id', existing.id)
                    } else {
                      await (supabase.from('calendar_event_participants') as any).insert({ event_id: eventId, client_id: userId, rsvp_status: newStatus, payment_status: 'unpaid' })
                    }

                    const start = new Date(selectedMeetEvent.start_time)
                    const dateKey = format(start, 'yyyy-MM-dd')

                    setMeetEventsByDate((prev: any) => {
                      const dayEvents = prev[dateKey] || []
                      return {
                        ...prev,
                        [dateKey]: dayEvents.map((e: any) => e.id === eventId ? { ...e, rsvp_status: newStatus } : e)
                      }
                    })

                    // Optimistic local state update
                    setSelectedMeetRsvpStatus(newStatus)

                  } catch (e) {
                    console.error('Error updating meet status:', e)
                  }
                }

                const handleCancelReschedule = async () => {
                  if (!pendingReschedule?.id) return
                  if (!confirm("¿Estás seguro que querés cancelar la solicitud?")) return

                  try {
                    setSelectedMeetRsvpLoading(true)
                    const { error } = await supabase
                      .from('calendar_event_reschedule_requests')
                      .delete()
                      .eq('id', pendingReschedule.id)

                    if (error) throw error

                    setSelectedMeetEvent(null)
                  } catch (e) {
                    console.error("Error cancelling reschedule:", e)
                    alert("No se pudo cancelar la solicitud")
                  } finally {
                    setSelectedMeetRsvpLoading(false)
                  }
                }

                const handleAccept = async () => {
                  try {
                    setSelectedMeetRsvpLoading(true)
                    await updateMeetStatus(String(selectedMeetEvent.id), 'confirmed')
                    setSelectedMeetEvent(null)
                  } finally {
                    setSelectedMeetRsvpLoading(false)
                  }
                }

                const handleDecline = async () => {
                  try {
                    setSelectedMeetRsvpLoading(true)
                    await updateMeetStatus(String(selectedMeetEvent.id), 'declined')
                    setSelectedMeetEvent(null)
                  } finally {
                    setSelectedMeetRsvpLoading(false)
                  }
                }

                const handleCancel = async () => {
                  if (!confirm('¿Estás seguro que querés cancelar esta meet?')) return
                  try {
                    setSelectedMeetRsvpLoading(true)
                    // Optimistic update
                    setSelectedMeetRsvpStatus('cancelled')
                    await updateMeetStatus(String(selectedMeetEvent.id), 'cancelled')

                    setSelectedMeetEvent(null)
                  } finally {
                    setSelectedMeetRsvpLoading(false)
                  }
                }

                const handleSuggestNewTime = () => {
                  if (!selectedMeetEvent?.coach_id) return
                  const durationMinutes = (() => {
                    const a = new Date(selectedMeetEvent.start_time).getTime()
                    const b = selectedMeetEvent.end_time ? new Date(selectedMeetEvent.end_time).getTime() : NaN
                    if (!Number.isFinite(a) || !Number.isFinite(b)) return 60
                    const mins = Math.round((b - a) / 60000)
                    return mins > 0 ? mins : 60
                  })()

                  setRescheduleContext({
                    eventId: String(selectedMeetEvent.id),
                    coachId: String(selectedMeetEvent.coach_id),
                    fromStart: String(selectedMeetEvent.start_time),
                    fromEnd: selectedMeetEvent.end_time ? String(selectedMeetEvent.end_time) : null,
                    durationMinutes,
                    snapshot: {
                      id: String(selectedMeetEvent.id),
                      title: selectedMeetEvent.title ?? null,
                      start_time: String(selectedMeetEvent.start_time),
                      end_time: selectedMeetEvent.end_time ? String(selectedMeetEvent.end_time) : null,
                      coach_id: selectedMeetEvent.coach_id ? String(selectedMeetEvent.coach_id) : null,
                      meet_link: selectedMeetEvent.meet_link ? String(selectedMeetEvent.meet_link) : null,
                      description: selectedMeetEvent.description ?? null,
                    },
                  })

                  handlePickCoachForMeet(String(selectedMeetEvent.coach_id))
                  setMeetViewMode('week')
                  setMeetWeekStart(startOfWeek(start, { weekStartsOn: 1 }))
                  setSelectedMeetEvent(null)
                }

                // Logic for "Rechazada por..."
                const isMyReschedule = pendingReschedule?.requested_by_user_id === authUserId
                const rejectionLabel = isMyReschedule ? 'Rechazada por ti' : 'Rechazada por coach'

                return (
                  <>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="text-white font-semibold text-xl leading-snug break-words whitespace-normal">
                          {selectedMeetEvent.title ? String(selectedMeetEvent.title) : 'Meet'}
                        </div>
                        <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider flex-shrink-0 ${isGroup ? 'bg-white/10 text-white/60' : 'bg-[#FF9500] text-black border border-[#FF9500]'}`}>
                          {classLabel}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedMeetEvent(null)}
                        className="w-8 h-8 -mt-1 -mr-2 rounded-full hover:bg-white/10 text-white flex items-center justify-center flex-shrink-0"
                        aria-label="Cerrar"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="mt-1 flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-white/10 border border-white/10 flex-shrink-0">
                        <Image
                          src={coachAvatarUrl || '/placeholder.svg?height=64&width=64&query=coach'}
                          alt={coachName}
                          width={32}
                          height={32}
                          className="w-8 h-8 object-cover"
                        />
                      </div>
                      <div className="text-sm font-medium text-white/60 flex items-center gap-2">
                        {coachName}
                        <div className={`px-1 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider scale-90 origin-left ${isCoachHost ? 'bg-[#FF7939] text-black' : 'bg-white/10 text-white/60'}`}>
                          {isCoachHost ? 'Anfitrión' : 'Invitado'}
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {(() => {
                        // Priority: Pending Reschedule > Cancelled > Confirmed > Declined (though declined + reschedule is handled above)

                        if (statusLabel === 'Rechazada') return null

                        let Icon = Clock
                        let style = 'bg-[#FF7939]/10 text-[#FFB366] border-[#FF7939]/30'
                        if (isConfirmed) {
                          Icon = CheckCircle2
                          style = 'bg-green-500/10 text-green-400 border-green-500/20'
                        } else if (isDeclined) {
                          return null
                        } else if (isCancelled) {
                          Icon = Ban
                          style = 'bg-red-500/10 text-red-400 border-red-500/20'
                        }

                        return (
                          <div className={`px-2.5 py-1 rounded-md text-xs font-semibold border flex items-center gap-1.5 ${style}`}>
                            <Icon className="h-3.5 w-3.5" />
                            {statusLabel}
                          </div>
                        )
                      })()}
                    </div>

                    <div className={`mt-3 flex ${pendingReschedule ? 'flex-col w-full gap-2' : 'flex-wrap items-center gap-2'}`}>
                      {pendingReschedule ? (
                        <>
                          {/* NEW DATE ROW - Pendiente */}
                          <div className="flex items-center justify-between gap-2 bg-black/30 border border-[#FF7939]/30 rounded-lg px-3 py-2 text-sm text-gray-200">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-2">
                                <CalendarIcon className="h-4 w-4 text-[#FFB366]" />
                                <span className="font-medium">{format(new Date(pendingReschedule.to_start_time), 'dd MMM yyyy', { locale: es })}</span>
                              </div>
                              <div className="w-[1px] h-4 bg-[#FF7939]/30"></div>
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-[#FFB366]" />
                                <span className="font-medium">
                                  {(() => {
                                    const a = new Date(pendingReschedule.to_start_time)
                                    const b = pendingReschedule.to_end_time ? new Date(pendingReschedule.to_end_time) : null
                                    return `${format(a, 'HH:mm')}${b && !Number.isNaN(b.getTime()) ? ` – ${format(b, 'HH:mm')}` : ''}`
                                  })()}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-[#FFB366] font-medium bg-[#FF7939]/10 px-2 py-0.5 rounded border border-[#FF7939]/20">
                              <Clock className="h-3 w-3" />
                              <span>Pendiente</span>
                            </div>
                          </div>

                          {/* OLD DATE ROW - Rechazada */}
                          <div className="flex items-center justify-between gap-2 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/55">
                            <div className="flex items-center gap-3 opacity-60">
                              <div className="flex items-center gap-2">
                                <CalendarIcon className="h-4 w-4 text-white/45" />
                                <span className="line-through">{format(new Date(pendingReschedule.from_start_time), 'dd MMM yyyy', { locale: es })}</span>
                              </div>
                              <div className="w-[1px] h-4 bg-white/10"></div>
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-white/45" />
                                <span className="line-through">
                                  {(() => {
                                    const a = new Date(pendingReschedule.from_start_time)
                                    const b = pendingReschedule.from_end_time ? new Date(pendingReschedule.from_end_time) : null
                                    return `${format(a, 'HH:mm')}${b && !Number.isNaN(b.getTime()) ? ` – ${format(b, 'HH:mm')}` : ''}`
                                  })()}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-red-400 font-medium bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
                              <XCircle className="h-3 w-3" />
                              <span>{rejectionLabel}</span>
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center gap-2 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200">
                            <CalendarIcon className="h-4 w-4 text-white/60" />
                            <span className="font-medium">{dateLabel}</span>
                          </div>
                          <div className="flex items-center gap-2 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200">
                            <Clock className="h-4 w-4 text-white/60" />
                            <span className="font-medium">{timeLabel}</span>
                          </div>
                        </>
                      )}
                    </div>

                    {selectedMeetEvent.description && String(selectedMeetEvent.description).trim().length > 0 && (
                      <div className="mt-4 mb-2">
                        <div className="text-base font-semibold text-white">Notas</div>
                        <div className="mt-1 text-sm text-white/80 whitespace-pre-wrap break-words">
                          {String(selectedMeetEvent.description)}
                        </div>
                      </div>
                    )}

                    {!canEditRsvp && !isConfirmed && !isDeclined && !isCancelled && (
                      <div className="mt-2 text-xs text-white/60">
                        Solo podés cambiar el estado si faltan más de 24hs para la meet.
                      </div>
                    )}

                    <div className="pt-4 flex flex-col gap-2">
                      {pendingReschedule ? (
                        <>
                          <button
                            type="button"
                            className="w-full px-4 py-2.5 rounded-xl bg-zinc-800 text-[#FFB366] text-sm font-semibold border border-[#FF7939]/30 cursor-default"
                          >
                            Solicitud enviada
                          </button>
                          <div className="flex items-center gap-2 mt-1">
                            <button
                              type="button"
                              disabled={selectedMeetRsvpLoading}
                              onClick={handleSuggestNewTime}
                              className="flex-1 px-4 py-2 rounded-xl bg-zinc-900 text-white/80 text-xs font-medium border border-white/10 hover:bg-zinc-800 transition-colors"
                            >
                              Editar solicitud
                            </button>
                            <button
                              type="button"
                              disabled={selectedMeetRsvpLoading}
                              onClick={handleCancelReschedule}
                              className="flex-1 px-4 py-2 rounded-xl bg-red-500/10 text-red-400 text-xs font-medium border border-red-500/20 hover:bg-red-500/20 transition-colors"
                            >
                              Cancelar solicitud
                            </button>
                          </div>
                        </>
                      ) : !isConfirmed ? (
                        <>
                          <>
                            {/* Logic: If I am the sender (invited_by_user_id === user.id), show Cancel/Edit only. No Accept/Reject. */}
                            {console.log('[DEBUG] Sender Check:', {
                              invitedByUserId: selectedMeetEvent?.invited_by_user_id,
                              authUserId: authUserId,
                              match: String(selectedMeetEvent?.invited_by_user_id) === String(authUserId),
                              eventId: selectedMeetEvent?.id
                            })}
                            {/* @ts-ignore */}
                            {(String(selectedMeetEvent?.invited_by_user_id) === String(authUserId))
                              ? (
                                <div className="flex flex-col gap-2">
                                  <div className="w-full px-4 py-2 bg-zinc-800/50 text-[#FFB366] text-xs font-semibold border border-[#FF7939]/20 text-center rounded-xl">
                                    Solicitud enviada enviada por ti
                                  </div>
                                  <button
                                    type="button"
                                    disabled={selectedMeetRsvpLoading}
                                    onClick={handleCancel}
                                    className="w-full px-4 py-2.5 rounded-xl bg-red-500/10 text-red-400 text-sm font-semibold border border-red-500/20 hover:bg-red-500/20 transition-colors"
                                  >
                                    Cancelar invitación
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    disabled={selectedMeetRsvpLoading || !canEditRsvp}
                                    onClick={handleAccept}
                                    className="w-full px-4 py-2.5 rounded-xl bg-[#FF7939] text-black text-sm font-semibold hover:opacity-95 transition-opacity disabled:opacity-60"
                                  >
                                    Aceptar
                                  </button>

                                  <button
                                    type="button"
                                    disabled={selectedMeetRsvpLoading || !canEditRsvp}
                                    onClick={handleSuggestNewTime}
                                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-800 text-white text-sm hover:bg-zinc-700 transition-colors disabled:opacity-60"
                                  >
                                    Sugerir nuevo horario
                                  </button>

                                  <button
                                    type="button"
                                    disabled={selectedMeetRsvpLoading || !canEditRsvp}
                                    onClick={() => {
                                      if (!confirmDeclineStep) {
                                        setConfirmDeclineStep(true)
                                        return
                                      }
                                      handleDecline()
                                    }}
                                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 text-white text-sm border border-white/15 hover:bg-zinc-800 transition-colors disabled:opacity-60"
                                  >
                                    {confirmDeclineStep ? 'Confirmar rechazo' : 'Rechazar'}
                                  </button>
                                </>
                              )
                            }
                          </>
                        </>
                      ) : (
                        <div className="flex items-center justify-between gap-3">
                          <button
                            type="button"
                            disabled={selectedMeetRsvpLoading}
                            onClick={handleCancel}
                            className="px-5 py-2.5 rounded-xl bg-zinc-900 text-white text-sm border border-white/15 hover:bg-zinc-800 transition-colors disabled:opacity-60"
                          >
                            Cancelar
                          </button>

                          {selectedMeetEvent.meet_link ? (
                            <button
                              type="button"
                              onClick={() => window.open(String(selectedMeetEvent.meet_link), '_blank')}
                              className="flex-1 px-4 py-2.5 rounded-xl bg-zinc-800 text-white text-sm hover:bg-zinc-700 transition-colors flex items-center justify-center gap-2"
                              title="Abrir enlace de Meet"
                            >
                              <Video className="h-4 w-4" />
                              Ir a la meet
                            </button>
                          ) : (
                            <div className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/40 text-sm flex items-center justify-center gap-2 cursor-not-allowed">
                              <Video className="h-4 w-4 opacity-50" />
                              <span>Sin link disponible</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </>
                )
              })()}
            </div>
          </div>
        )
      }

      {
        selectedMeetRequest && meetViewMode !== 'day_split' && (
          <div
            className="fixed inset-0 z-[70] bg-black/40 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            onClick={() => setSelectedMeetRequest(null)}
          >
            <div
              className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl p-5"
              onClick={(e) => e.stopPropagation()}
            >
              {(() => {
                const coachName =
                  coachProfiles.find((c) => c.id === String(selectedMeetRequest.coachId))?.full_name || 'Coach'
                const creditsAvailable = Number(meetCreditsByCoachId?.[String(selectedMeetRequest.coachId)] ?? 0)
                const dateLabel = format(new Date(`${selectedMeetRequest.dayKey}T00:00:00`), 'dd MMM yyyy', { locale: es })
                const durationMins = isPaidMeetFlow
                  ? (Number(purchaseContext?.durationMinutes ?? 30) || 30)
                  : 30
                const timeLabel = `${selectedMeetRequest.timeHHMM} – ${(() => {
                  const [h, m] = selectedMeetRequest.timeHHMM.split(':').map((x) => parseInt(x, 10))
                  const total = (Number.isFinite(h) ? h : 0) * 60 + (Number.isFinite(m) ? m : 0) + durationMins
                  const hh = Math.floor(total / 60)
                  const mm = total % 60
                  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
                })()}`

                const canConfirm = (() => {
                  if (isPaidMeetFlow) return meetPurchasePaid
                  return creditsAvailable > 0
                })()

                return (
                  <>
                    {/* HEADER MODAL: Avatar Coach + Boton Cerrar alineados */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          {/* Coach Avatar */}
                          {coachProfiles.find((c) => c.id === String(selectedMeetRequest.coachId))?.avatar_url ? (
                            <div className="w-10 h-10 rounded-full bg-zinc-800 overflow-hidden">
                              <img src={coachProfiles.find((c) => c.id === String(selectedMeetRequest.coachId))?.avatar_url ?? ''} className="w-full h-full object-cover" />
                            </div>
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-white">
                              {coachName.substring(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-[#FF7939] border-2 border-zinc-950" />
                        </div>
                        <div>
                          <div className="text-white font-semibold leading-tight">{coachName}</div>
                          <div className="text-xs text-[#FF7939]">Coach</div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setSelectedMeetRequest(null)}
                        className="w-8 h-8 rounded-full hover:bg-white/10 text-white/70 flex items-center justify-center transition-colors"
                        aria-label="Cerrar"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>

                    {/* FECHA Y HORA */}
                    <div className="flex gap-3 mb-4">
                      <div className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 flex items-center gap-2">
                        <CalendarIcon className="w-4 h-4 text-white/50" />
                        <span className="text-sm font-medium text-white">{dateLabel}</span>
                      </div>
                      <div className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-white/50" />
                        <span className="text-sm font-medium text-white">{timeLabel}</span>
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="text-base font-semibold text-white">Nombre</div>
                      <input
                        value={selectedMeetRequest.title}
                        onChange={(e) =>
                          setSelectedMeetRequest((prev) =>
                            prev
                              ? {
                                ...prev,
                                title: e.target.value,
                              }
                              : prev
                          )
                        }
                        className="mt-2 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#FF7939]/40"
                        placeholder="Ej: Check rápido · Dudas de rutina"
                      />
                    </div>

                    <div className="mt-4">
                      <div className="text-base font-semibold text-white">Descripción</div>
                      <textarea
                        value={selectedMeetRequest.description}
                        onChange={(e) =>
                          setSelectedMeetRequest((prev) =>
                            prev
                              ? {
                                ...prev,
                                description: e.target.value,
                              }
                              : prev
                          )
                        }
                        className="mt-2 w-full min-h-[96px] rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#FF7939]/40"
                        placeholder="Notas / objetivos de la meet..."
                      />
                    </div>

                    <div className="mt-4">
                      <div className="text-base font-semibold text-white">
                        {isPaidMeetFlow ? 'Resumen de pago' : 'Esto consumirá 1 crédito'}
                      </div>

                      {isPaidMeetFlow ? (
                        <div className="mt-1 text-sm text-white/70">
                          Total: <span className="text-white/90 font-semibold">${Number(purchaseContext?.price ?? 0) || 0}</span>
                          {' '}· Duración:{' '}
                          <span className="text-white/90 font-semibold">{Number(purchaseContext?.durationMinutes ?? 30) || 30} min</span>
                        </div>
                      ) : (
                        <div className="mt-1 text-sm text-white/70">
                          Tenés{' '}
                          <span className="text-white/90 font-semibold">{Number.isFinite(creditsAvailable) ? creditsAvailable : 0}</span>
                          {' '}créditos disponibles con este coach.
                        </div>
                      )}
                    </div>

                    <div className="mt-4 flex flex-col gap-2">
                      {isPaidMeetFlow && !meetPurchasePaid && (
                        <button
                          type="button"
                          disabled={!(scheduleMeetContext?.activityId)}
                          className={
                            scheduleMeetContext?.activityId
                              ? 'w-full px-4 py-2.5 rounded-xl bg-[#FF7939] text-black text-sm font-semibold hover:opacity-95 transition-opacity'
                              : 'w-full px-4 py-2.5 rounded-xl bg-white/10 text-white/70 text-sm font-semibold border border-white/15 cursor-not-allowed'
                          }
                          onClick={async () => {
                            const actId = scheduleMeetContext?.activityId ? String(scheduleMeetContext.activityId) : null
                            if (!actId) return

                            try {
                              sessionStorage.setItem(
                                'pending_meet_booking',
                                JSON.stringify({
                                  coachId: String(selectedMeetRequest.coachId),
                                  activityId: actId,
                                  dayKey: selectedMeetRequest.dayKey,
                                  timeHHMM: selectedMeetRequest.timeHHMM,
                                  durationMinutes: Number(purchaseContext?.durationMinutes ?? 30) || 30,
                                })
                              )
                            } catch {
                              // ignore
                            }

                            const res = await createCheckoutProPreference(actId)
                            if (res?.success && res?.initPoint) {
                              redirectToMercadoPagoCheckout(res.initPoint, actId, res.preferenceId)
                            }
                          }}
                        >
                          Pagar
                        </button>
                      )}

                      <button
                        type="button"
                        disabled={!canConfirm}
                        className={
                          canConfirm
                            ? 'w-full px-4 py-2.5 rounded-xl bg-[#FF7939] text-black text-sm font-semibold hover:opacity-95 transition-opacity'
                            : 'w-full px-4 py-2.5 rounded-xl bg-white/10 text-white/70 text-sm font-semibold border border-white/15 cursor-not-allowed'
                        }
                        onClick={async () => {
                          console.log('[CalendarView] Confirm button clicked', { authUserId, selectedCoachId, canConfirm, selectedMeetRequest })
                          if (!authUserId) return
                          if (!selectedCoachId) return
                          if (!canConfirm) return

                          try {
                            const startIso = new Date(`${selectedMeetRequest.dayKey}T${selectedMeetRequest.timeHHMM}:00`).toISOString()
                            const duration = isPaidMeetFlow
                              ? (Number(purchaseContext?.durationMinutes ?? 30) || 30)
                              : 30
                            const endIso = new Date(new Date(startIso).getTime() + duration * 60 * 1000).toISOString()

                            const payload = {
                              coach_id: selectedMeetRequest.coachId,
                              client_id: authUserId,
                              title: selectedMeetRequest.title,
                              description: selectedMeetRequest.description || null,
                              start_time: startIso,
                              end_time: endIso,
                              event_type: 'consultation',
                              status: 'scheduled',
                              activity_id: scheduleMeetContext?.activityId ? Number(scheduleMeetContext.activityId) : null,
                            };

                            console.log('[CalendarView] Inserting calendar event with payload:', payload);

                            const { data: newEvent, error: eventError } = await (supabase
                              .from('calendar_events') as any)
                              .insert(payload)
                              .select('id')
                              .single()

                            if (eventError || !newEvent?.id) {
                              console.error('[CalendarView] Insert failed:', eventError);
                              return
                            }

                            const { data: partData, error: partError } = await (supabase.from('calendar_event_participants') as any).insert({
                              event_id: newEvent.id,
                              client_id: authUserId,
                              rsvp_status: 'pending',
                              invited_by_user_id: authUserId,
                              invited_by_role: 'client',
                            })

                            const coachName = selectedCoachProfile?.full_name || 'Coach'
                            const dateFormatted = format(new Date(payload.start_time), "EEEE d 'de' MMMM", { locale: es })

                            setSuccessModalData({
                              coachName,
                              date: dateFormatted,
                              time: selectedMeetRequest.timeHHMM,
                              duration,
                            })

                            setMeetViewMode('month')
                            setSelectedMeetRequest(null)

                            if (onSetScheduleMeetContext) {
                              onSetScheduleMeetContext(null)
                            }

                            setShowSuccessModal(true)
                          } catch {
                            // ignore
                          }
                        }}
                      >
                        Confirmar solicitud
                      </button>

                      {!canConfirm && !isPaidMeetFlow && (
                        <div className="text-[11px] text-white/55">No tenés créditos disponibles para solicitar este meet.</div>
                      )}

                      <button
                        type="button"
                        className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 text-white text-sm border border-white/15 hover:bg-zinc-800 transition-colors"
                        onClick={() => setSelectedMeetRequest(null)}
                      >
                        Cancelar
                      </button>
                    </div>
                  </>
                )
              })()}
            </div>
          </div>
        )
      }
      {/* Success Modal */}
      {
        showSuccessModal && successModalData && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="max-w-sm w-full bg-[#1C1C1E]/90 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
                  <CalendarIcon className="w-8 h-8 text-green-500" />
                </div>

                <h3 className="text-xl font-bold text-white mb-2">¡Solicitud Enviada!</h3>

                <p className="text-white/70 text-sm leading-relaxed mb-6">
                  Tu solicitud fue enviada a <span className="text-white font-medium">{successModalData.coachName}</span> para un meet de {successModalData.duration} min el día {successModalData.date} a las {successModalData.time} hs.
                </p>

                <div className="bg-white/5 rounded-xl p-3 mb-6 w-full">
                  <div className="flex items-center gap-3 text-xs text-white/50">
                    <Clock className="w-4 h-4 text-[#FF7939]" />
                    <span>El coach suele responder en promedio en <span className="text-white">2 horas</span>.</span>
                  </div>
                </div>

                <button
                  onClick={() => setShowSuccessModal(false)}
                  className="w-full py-3 rounded-xl bg-[#FF7939] text-black font-bold text-sm hover:opacity-90 transition-opacity"
                >
                  Entendido
                </button>
              </div>
            </div>
          </div>
        )
      }
      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent className="bg-[#1A1C1F] border-zinc-800 text-white w-[90%] max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg">Mover actividades</DialogTitle>
            <DialogDescription className="text-gray-400">
              ¿Estás seguro que quieres cambiar la fecha de estas actividades?
            </DialogDescription>
          </DialogHeader>

          <div className="bg-[#141414] rounded-xl p-4 my-2 border border-zinc-800 flex items-center justify-between">
            <div className="flex flex-col items-center">
              <span className="text-xs text-gray-500 uppercase">De</span>
              <span className="text-xl font-bold text-white">{sourceDate?.getDate()}</span>
              <span className="text-xs text-[#FF7939]">{sourceDate && getDayName(sourceDate.getDay())}</span>
            </div>

            <ArrowRight className="text-gray-600" />

            <div className="flex flex-col items-center">
              <span className="text-xs text-gray-500 uppercase">A</span>
              <span className="text-xl font-bold text-white">{targetDate?.getDate()}</span>
              <span className="text-xs text-green-500">{targetDate && getDayName(targetDate.getDay())}</span>
            </div>
          </div>

          {sourceDate && (
            <div className="flex items-start gap-3 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
              <Checkbox
                id="apply-all"
                checked={applyToAllSameDays}
                onCheckedChange={(checked) => setApplyToAllSameDays(checked as boolean)}
                className="mt-0.5 border-blue-400 data-[state=checked]:bg-blue-500 data-[state=checked]:text-white"
              />
              <div className="grid gap-1.5 leading-none">
                <Label
                  htmlFor="apply-all"
                  className="text-sm font-medium leading-none text-blue-100 cursor-pointer"
                >
                  Mover todos los {getDayName(sourceDate.getDay())}s futuros
                </Label>
                <p className="text-xs text-blue-200/70">
                  Esto aplicará el mismo cambio a todos los {getDayName(sourceDate.getDay())}s en el futuro.
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-2 sm:justify-end mt-2">
            <Button variant="ghost" onClick={() => setShowConfirmModal(false)} className="flex-1 text-gray-400 hover:text-white">
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmUpdate}
              disabled={isUpdating}
              className="flex-1 bg-[#FF7939] hover:bg-[#FF6A00] text-white"
            >
              {isUpdating ? 'Guardando...' : 'Confirmar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div >
  )
}
