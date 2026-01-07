"use client"

import { useState, useEffect, useMemo, useRef, Fragment } from "react"
import { createClient } from '@/lib/supabase/supabase-client'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, addMonths, subMonths, startOfWeek, addDays } from "date-fns"
import { es } from "date-fns/locale"
import { ChevronLeft, ChevronRight, Flame, Plus, Minus, Video, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Image from "next/image"

interface CalendarViewProps {
  activityIds: string[]
  onActivityClick: (activityId: string) => void
  scheduleMeetContext?: { coachId: string; activityId?: string; source?: string } | null
  onSetScheduleMeetContext?: (ctx: { coachId: string; activityId?: string; source?: string } | null) => void
}

export default function CalendarView({ activityIds, onActivityClick, scheduleMeetContext, onSetScheduleMeetContext }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date())
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
  const [loading, setLoading] = useState(true)
  const [showAddMenu, setShowAddMenu] = useState(false)
  const [showCoachRow, setShowCoachRow] = useState(false)
  const [coachProfiles, setCoachProfiles] = useState<Array<{ id: string; full_name: string; avatar_url?: string | null }>>([])
  const [meetCreditsByCoachId, setMeetCreditsByCoachId] = useState<Record<string, number>>({})
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
  const [meetViewMode, setMeetViewMode] = useState<'month' | 'week'>('month')
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
      }
    | null
  >(null)

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
  const supabase = createClient()
  const dayDetailRef = useRef<HTMLDivElement | null>(null)

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

  const selectedCoachId = scheduleMeetContext?.coachId ? String(scheduleMeetContext.coachId) : null
  const selectedCoachProfile = useMemo(() => {
    if (!selectedCoachId) return null
    return coachProfiles.find((c) => c.id === selectedCoachId) || null
  }, [coachProfiles, selectedCoachId])

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
        const { data: activitiesData, error: activitiesError } = await supabase
          .from('activities')
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
          const { data: progress } = await supabase
            .from('progreso_cliente')
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

        const monthStart = startOfMonth(currentDate)
        const monthEnd = endOfMonth(currentDate)
        const startISO = monthStart.toISOString().split('T')[0]
        const endISO = monthEnd.toISOString().split('T')[0]

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

        // 1) Resumen diario (progreso_cliente_daily_summary)
        const { data: summaryRows, error: summaryError } = await supabase
          .from('progreso_cliente_daily_summary')
          .select(
            'fecha, fitness_mins, fitness_mins_objetivo, nutri_mins, nutri_mins_objetivo, ejercicios_pendientes, platos_pendientes'
          )
          .eq('cliente_id', user.id)
          .gte('fecha', startISO)
          .lte('fecha', endISO)

        if (summaryError) {
          console.error('Error fetching progreso_cliente_daily_summary:', summaryError)
        }

        ;(summaryRows || []).forEach((row: any) => {
          const dayKey = String(row?.fecha || '').split('T')[0]
          if (!dayKey) return
          const fitnessTotal = toInt(row?.fitness_mins)
          const fitnessGoal = toInt(row?.fitness_mins_objetivo)
          const nutriTotal = toInt(row?.nutri_mins)
          const nutriGoal = toInt(row?.nutri_mins_objetivo)

          const fitnessPending = Math.max(0, fitnessGoal - fitnessTotal)
          const nutriPending = Math.max(0, nutriGoal - nutriTotal)

          agg[dayKey] = {
            fitnessMinutesTotal: fitnessTotal,
            fitnessMinutesPending: fitnessPending,
            nutritionMinutesTotal: nutriTotal,
            nutritionMinutesPending: nutriPending,
            meetsMinutes: 0,
            pendingExercises: toInt(row?.ejercicios_pendientes),
            pendingPlates: toInt(row?.platos_pendientes),
          }
        })

        // 3) Meets del cliente en el mes
        //    Hacemos 2 pasos (participants -> events) para evitar edge cases con joins.
        const { data: myParts, error: myPartsError } = await supabase
          .from('calendar_event_participants')
          .select('event_id, rsvp_status')
          .eq('client_id', user.id)

        if (myPartsError) {
          console.error('Error fetching client meet participants:', myPartsError)
        }

        // Diagnóstico: si en DB existe la fila pero acá viene 0, suele ser RLS o proyecto/env equivocado.
        if (!myPartsError && Array.isArray(myParts) && myParts.length === 0) {
          try {
            const sessionRes = await supabase.auth.getSession()
            const sessionUserId = sessionRes?.data?.session?.user?.id

            const diagCountRes = await supabase
              .from('calendar_event_participants')
              .select('id', { count: 'exact' })
              .eq('client_id', user.id)

            console.log('📅 [CalendarView] participants empty diagnostics', {
              envSupabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
              userIdFromContext: user.id,
              userIdFromSession: sessionUserId,
              countForClientId: diagCountRes?.count ?? null,
              diagError: diagCountRes?.error ?? null,
            })
          } catch (e) {
            console.error('📅 [CalendarView] participants empty diagnostics failed', e)
          }
        }

        const eventIdToRsvp: Record<string, string> = {}
        ;(myParts || []).forEach((p: any) => {
          const eid = String(p?.event_id || '')
          if (!eid) return
          eventIdToRsvp[eid] = String(p?.rsvp_status || 'pending')
        })

        const candidateEventIds = Object.keys(eventIdToRsvp)
        const meetEventsRes = candidateEventIds.length
          ? await supabase
              .from('calendar_events')
              .select('id, title, description, meet_link, start_time, end_time, event_type, coach_id')
              .in('id', candidateEventIds)
              .eq('event_type', 'consultation')
              .gte('start_time', monthStart.toISOString())
              .lt('start_time', addDays(monthEnd, 1).toISOString())
          : { data: [], error: null }

        if (meetEventsRes && (meetEventsRes as any).error) {
          console.error('Error fetching client meet events (by ids):', (meetEventsRes as any).error)
        }

        const meetEvents = (meetEventsRes as any)?.data
        // Nota: si el select falla, supabase devuelve data=null; normalizamos.
        const meetEventsSafe = Array.isArray(meetEvents) ? meetEvents : []

        if (process.env.NODE_ENV !== 'production') {
          console.log('📅 [CalendarView] client meet fetch debug', {
            monthStart: monthStart.toISOString(),
            monthEndExclusive: addDays(monthEnd, 1).toISOString(),
            participantRows: Array.isArray(myParts) ? myParts.length : 0,
            candidateEventIds: candidateEventIds.length,
            meetEventsFetched: meetEventsSafe.length,
          })
        }

        const meetMap: Record<
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
          }>
        > = {}
        ;(meetEventsSafe || []).forEach((ev: any) => {
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
          meetMap[dayKey].push({
            id: String(ev.id),
            title: ev.title == null ? null : String(ev.title || ''),
            start_time: String(ev.start_time),
            end_time: ev.end_time ? String(ev.end_time) : null,
            coach_id: ev.coach_id ? String(ev.coach_id) : null,
            meet_link: ev.meet_link ? String(ev.meet_link) : null,
            description: ev.description == null ? null : String(ev.description || ''),
            rsvp_status: String(eventIdToRsvp[String(ev.id)] || 'pending'),
          })
        })

        Object.keys(meetMap).forEach((k) => {
          meetMap[k].sort((a, b) => String(a.start_time).localeCompare(String(b.start_time)))
        })

        setDayMinutesByDate(agg)
        setMeetEventsByDate(meetMap)
      } catch (e) {
        console.error('Error loading day minutes:', e)
        setDayMinutesByDate({})
        setMeetEventsByDate({})
      }
    }

    loadDayMinutes()
  }, [currentDate, supabase])

  useEffect(() => {
    const loadSelectedDayBreakdown = async () => {
      try {
        if (!selectedDate) {
          setSelectedDayActivityItems([])
          return
        }

        const { data: auth } = await supabase.auth.getUser()
        const user = auth?.user
        if (!user?.id) {
          setSelectedDayActivityItems([])
          return
        }

        const dayKey = format(selectedDate, 'yyyy-MM-dd')

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
        const { data: progressRows, error: progressError } = await supabase
          .from('progreso_cliente')
          .select('actividad_id, minutos_json, ejercicios_pendientes')
          .eq('cliente_id', user.id)
          .eq('fecha', dayKey)

        if (progressError) {
          console.error('Error fetching progreso_cliente for day breakdown:', progressError)
        }

        ;(progressRows || []).forEach((row: any) => {
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
        const { data: nutriRows, error: nutriError } = await supabase
          .from('progreso_cliente_nutricion')
          .select('actividad_id, macros, ejercicios_pendientes')
          .eq('cliente_id', user.id)
          .eq('fecha', dayKey)

        if (nutriError) {
          console.error('Error fetching progreso_cliente_nutricion for day breakdown:', nutriError)
        }

        ;(nutriRows || []).forEach((row: any) => {
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
            const { data: activitiesData } = await supabase
              .from('activities')
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
        setSelectedDayActivityItems([])
      }
    }

    loadSelectedDayBreakdown()
  }, [activitiesInfo, selectedDate, supabase])

  useEffect(() => {
    const loadCoachProfiles = async () => {
      try {
        if (!purchasedCoachIds || purchasedCoachIds.length === 0) {
          setCoachProfiles([])
          return
        }

        const { data, error } = await supabase
          .from('user_profiles')
          .select('id, full_name, avatar_url')
          .in('id', purchasedCoachIds)

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

        const { data, error } = await supabase
          .from('client_meet_credits_ledger')
          .select('coach_id, meet_credits_available')
          .eq('client_id', user.id)
          .in('coach_id', purchasedCoachIds)

        if (error) {
          console.error('Error fetching meet credits:', error)
          setMeetCreditsByCoachId({})
          return
        }

        const map: Record<string, number> = {}
        ;(data || []).forEach((row: any) => {
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
    const loadCoachAvailability = async () => {
      try {
        if (!selectedCoachId) {
          setCoachAvailabilityRows([])
          return
        }

        const { data, error } = await supabase
          .from('coach_availability_rules')
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

        if (process.env.NODE_ENV === 'development') {
          const rows = (Array.isArray(data) ? data : []) as any[]
          const weekdays = rows.map((r) => Number(r.weekday)).filter((n) => Number.isFinite(n))
          const dist: Record<string, number> = {}
          weekdays.forEach((w) => {
            const k = String(w)
            dist[k] = (dist[k] || 0) + 1
          })
          console.log('[MeetCalendar][Availability] coach', selectedCoachId, {
            totalRows: rows.length,
            weekdayDistribution: dist,
            sample: rows.slice(0, 8).map((r) => ({
              weekday: r.weekday,
              start_time: String(r.start_time || '').slice(0, 5),
              end_time: String(r.end_time || '').slice(0, 5),
              scope: r.scope,
              year: r.year,
              month: r.month,
              timezone: r.timezone,
            })),
          })
        }
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

        const { data, error } = await supabase
          .from('calendar_events')
          .select('start_time, event_type, coach_id')
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
        ;(data || []).forEach((row: any) => {
          const dt = new Date(row.start_time)
          const dayKey = format(dt, 'yyyy-MM-dd')
          const timeKey = format(dt, 'HH:mm')
          if (!map[dayKey]) map[dayKey] = new Set<string>()
          map[dayKey].add(timeKey)
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
        if (!selectedCoachId || meetViewMode !== 'month') {
          setBookedSlotsByDayMonth({})
          return
        }

        const start = startOfMonth(currentDate)
        const end = addDays(endOfMonth(currentDate), 1)

        const { data, error } = await supabase
          .from('calendar_events')
          .select('start_time, event_type, coach_id')
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
        ;(data || []).forEach((row: any) => {
          const dt = new Date(row.start_time)
          const dayKey = format(dt, 'yyyy-MM-dd')
          const timeKey = format(dt, 'HH:mm')
          if (!map[dayKey]) map[dayKey] = new Set<string>()
          map[dayKey].add(timeKey)
        })
        setBookedSlotsByDayMonth(map)
      } catch (e) {
        console.error('Error fetching month booked meet slots:', e)
        setBookedSlotsByDayMonth({})
      }
    }

    loadBookedSlotsMonth()
  }, [currentDate, meetViewMode, selectedCoachId, supabase])

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

        const { data: myPart, error: myPartErr } = await supabase
          .from('calendar_event_participants')
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

        const { count, error: countErr } = await supabase
          .from('calendar_event_participants')
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
          if (!booked.has(hhmm)) slots.add(hhmm)
        }
      }

      if (slots.size > 0) result[dayKey] = slots.size
    }

    return result
  }, [bookedSlotsByDayMonth, coachAvailabilityRows, currentDate, selectedCoachId])

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

    console.log('[MeetCalendar][AvailableDays] coach', selectedCoachId, {
      year,
      month,
      computedDaysCount: days.length,
      firstDays: days.slice(0, 14),
    })

    if (days.length === 0) {
      console.warn('[MeetCalendar][AvailableDays] No se computaron días disponibles. Revisar weekday/scope/mes/año.', {
        year,
        month,
        availabilityRowsCount: coachAvailabilityRows.length,
        sampleRows: coachAvailabilityRows.slice(0, 8),
      })
    }
  }, [availableSlotDays, coachAvailabilityRows, currentDate, selectedCoachId])

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

    const slots = new Set<string>()
    for (const r of rows) {
      const start = toMinutes(r.start_time)
      const end = toMinutes(r.end_time)
      for (let t = start; t + 30 <= end; t += 30) {
        slots.add(toHHMM(t))
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

  const monthLabel = useMemo(() => {
    const raw = format(currentDate, 'MMMM yyyy', { locale: es })
    if (!raw) return raw
    return raw.charAt(0).toUpperCase() + raw.slice(1)
  }, [currentDate])

  const handleDateClick = (date: Date) => {
    // Solo seleccionar el día y mostrar la lista de actividades debajo.
    // La navegación a la actividad se hace recién cuando el usuario hace
    // click en una de las actividades listadas.
    setSelectedDate(date)

    if (selectedCoachId) {
      const key = format(date, 'yyyy-MM-dd')
      if (availableSlotDays.has(key)) {
        setMeetViewMode('week')
        setMeetWeekStart(startOfWeek(date, { weekStartsOn: 1 }))
        return
      }
    }

    setTimeout(() => {
      dayDetailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 80)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-white">Cargando calendario...</div>
      </div>
    )
  }

  return (
    <div className="p-4 text-white">
      {/* Acciones arriba (fuera del frame del calendario) */}
      <div className="mb-3 relative flex items-center justify-end">
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

      {(showCoachRow || !!selectedCoachProfile) && (
        <div className="mb-3">
          {coachProfiles.length === 0 ? (
            <div className="text-sm text-gray-400">No tenés coaches asociados a compras.</div>
          ) : (
            <div className="flex items-center gap-3 overflow-x-auto pb-1">
              {coachProfiles.map((coach) => {
                const isSelected = !!selectedCoachId && coach.id === selectedCoachId
                const isDimmed = !!selectedCoachId && coach.id !== selectedCoachId
                return (
                  <button
                    key={coach.id}
                    type="button"
                    onClick={() => handlePickCoachForMeet(coach.id)}
                    className={
                      `relative w-[180px] h-[120px] rounded-2xl overflow-hidden flex-shrink-0 border bg-black/30 transition-colors ` +
                      (isSelected
                        ? 'border-[#FF7939]/60 shadow-[0_10px_30px_rgba(255,121,57,0.18)]'
                        : 'border-white/10 hover:bg-white/5') +
                      (isDimmed ? ' opacity-45' : '')
                    }
                  >
                    <div className="absolute inset-0">
                      <Image
                        src={coach.avatar_url || '/placeholder.svg?height=160&width=160&query=coach'}
                        alt={coach.full_name}
                        fill
                        className={(isDimmed ? 'object-cover grayscale' : 'object-cover')}
                        sizes="180px"
                      />
                    </div>

                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                    <div className="absolute left-3 right-3 bottom-3">
                      <div className="text-white text-base font-semibold truncate">{coach.full_name}</div>
                      <div className="mt-2 inline-flex items-center px-2.5 py-1 rounded-full border text-[11px] font-semibold backdrop-blur-md bg-white/10 border-[#FF7939]/40 text-white">
                        {(meetCreditsByCoachId[coach.id] ?? 0)} meets disponibles
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          {selectedCoachId && (
            <div className="mt-2 flex items-center justify-end">
              <button
                type="button"
                onClick={() => {
                  try {
                    localStorage.removeItem('scheduleMeetContext')
                  } catch {
                    // ignore
                  }
                  onSetScheduleMeetContext?.(null)
                  setMeetViewMode('month')
                }}
                className="px-3 py-1.5 rounded-full border text-[11px] font-semibold backdrop-blur-md bg-white/10 border-white/20 text-white hover:bg-white/15 transition-colors"
              >
                Quitar coach
              </button>
            </div>
          )}
        </div>
      )}

      <Card className="bg-zinc-900 border-zinc-800">
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

        <CardContent>
          {meetViewMode === 'week' && selectedCoachId ? (
            <div>
              <div className="flex items-center justify-between mb-3">
                <Button
                  variant="ghost"
                  onClick={() => setMeetWeekStart((d) => addDays(d, -7))}
                  className="h-8 w-8 p-0 text-gray-300 hover:text-white hover:bg-zinc-800"
                  title="Semana anterior"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="text-white font-semibold">
                  {format(meetWeekStart, "MMMM d", { locale: es })} – {format(addDays(meetWeekStart, 6), "d, yyyy", { locale: es })}
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
                const allSlots = Object.values(weekSlotsMap).flat()
                const toMinutes = (hhmm: string) => {
                  const [h, m] = hhmm.split(':').map((x) => parseInt(x, 10))
                  if (!Number.isFinite(h) || !Number.isFinite(m)) return 0
                  return h * 60 + m
                }
                const min = allSlots.length ? Math.min(...allSlots.map(toMinutes)) : 8 * 60
                const max = allSlots.length ? Math.max(...allSlots.map(toMinutes)) + 30 : 20 * 60

                const startMin = Math.min(Math.max(6 * 60, Math.floor(min / 30) * 30), 22 * 60)
                const endMin = Math.max(startMin + 60, Math.min(23 * 60 + 30, Math.ceil(max / 30) * 30))
                const rows = [] as number[]
                for (let t = startMin; t < endMin; t += 30) rows.push(t)

                const toHHMM = (mins: number) => {
                  const h = Math.floor(mins / 60)
                  const m = mins % 60
                  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
                }

                return (
                  <div className="overflow-x-auto">
                    <div className="min-w-[820px]">
                      <div className="grid" style={{ gridTemplateColumns: '72px repeat(7, minmax(0, 1fr))' }}>
                        <div />
                        {Array.from({ length: 7 }).map((_, idx) => {
                          const d = addDays(meetWeekStart, idx)
                          const dayKey = format(d, 'yyyy-MM-dd')
                          const label = format(d, 'EEE', { locale: es })
                          const dayNum = format(d, 'd')
                          const isHighlighted = availableSlotDays.has(dayKey)
                          return (
                            <div
                              key={dayKey}
                              className="text-center text-sm font-semibold text-white/90 pb-2 border-b border-white/10"
                            >
                              <span className="text-white/60">{label}</span>{' '}
                              <span className={isHighlighted ? 'text-[#FFB366]' : 'text-white/90'}>{dayNum}</span>
                            </div>
                          )
                        })}

                        {rows.map((tmin) => {
                          const t = toHHMM(tmin)
                          return (
                            <Fragment key={`row-${t}`}>
                              <div className="text-xs text-white/60 py-2 pr-2 text-right border-b border-white/10">
                                {t}
                              </div>
                              {Array.from({ length: 7 }).map((_, idx) => {
                                const d = addDays(meetWeekStart, idx)
                                const dayKey = format(d, 'yyyy-MM-dd')
                                const slots = weekSlotsMap[dayKey] || []
                                const isSlot = slots.includes(t)
                                const booked = bookedSlotsByDay?.[dayKey]?.has(t) ?? false

                                if (!isSlot) {
                                  return <div key={`${dayKey}-${t}`} className="border-b border-white/10" />
                                }

                                const disabled = booked
                                return (
                                  <div key={`${dayKey}-${t}`} className="border-b border-white/10 px-2 py-1">
                                    <button
                                      type="button"
                                      disabled={disabled}
                                      onClick={() => {
                                        if (disabled) return
                                        if (!selectedCoachId) return
                                        setSelectedMeetRequest({
                                          coachId: String(selectedCoachId),
                                          dayKey,
                                          timeHHMM: t,
                                          title: 'Meet',
                                          description: '',
                                        })
                                      }}
                                      className={
                                        disabled
                                          ? 'w-full rounded-lg border border-dashed border-[#FF7939]/50 bg-transparent text-[#FFB366]/70 py-2 text-sm font-semibold'
                                          : 'w-full rounded-lg border border-[#FF7939]/50 bg-[#FF7939]/10 text-[#FFB366] py-2 text-sm font-semibold hover:bg-[#FF7939]/15 transition-colors'
                                      }
                                    >
                                      <div className="leading-none">{t}</div>
                                      <div className="mt-1 text-[10px] font-medium text-white/70">
                                        {disabled ? '0 lugares' : '1 lugar'}
                                      </div>
                                    </button>
                                  </div>
                                )
                              })}
                            </Fragment>
                          )
                        })}
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

                  const isSelected = selectedDate && isSameDay(day, selectedDate)
                  const isTodayDate = isToday(day)
                  const coachSlotsCount = selectedCoachId ? (availableSlotsCountByDay?.[dateKey] ?? 0) : 0
                  const hasMeetSlots = coachSlotsCount > 0

                  return (
                    <button
                      key={day.toISOString()}
                      type="button"
                      onClick={() => handleDateClick(day)}
                      className={
                        `aspect-square p-1.5 sm:p-2 rounded-lg text-sm font-medium transition-colors flex flex-col items-center justify-start ` +
                        `${isSelected ? 'backdrop-blur-md bg-white/10 border border-[#FF7939]/40 shadow-[0_8px_24px_rgba(0,0,0,0.35)] text-white' : ''} ` +
                        `${isTodayDate && !isSelected ? 'bg-zinc-800 text-white' : ''} ` +
                        `${!isSelected && !isTodayDate ? 'text-gray-400 hover:bg-zinc-800' : ''}`
                      }
                    >
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
                              <span className="text-[10px] font-semibold">{totalPending}</span>
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
                            {coachSlotsCount} slots
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

      {selectedDate && meetViewMode === 'month' && (
        <div className="mt-4" ref={dayDetailRef}>
          <h3 className="text-sm font-semibold mb-3 text-white/90">
            Actividades para {format(selectedDate, 'dd/MM/yyyy', { locale: es })}
          </h3>

          {(() => {
            const key = format(selectedDate, 'yyyy-MM-dd')
            const mins = dayMinutesByDate[key]
            if (!mins) return null
            const pending = (mins.fitnessMinutesPending || 0) + (mins.nutritionMinutesPending || 0)
            const total = pending + (mins.meetsMinutes || 0)
            if (total <= 0) return null
            return (
              <div className="mb-3">
                <div className="text-xs text-white/70">
                  {pending > 0 ? (
                    <span>Pendiente: <span className="text-white/90 font-semibold">{formatMinutes(pending)}</span></span>
                  ) : null}
                  {pending > 0 && mins.meetsMinutes > 0 ? <span> · </span> : null}
                  {mins.meetsMinutes > 0 ? (
                    <span>Meets: <span className="text-white/90 font-semibold">{formatMinutes(mins.meetsMinutes)}</span></span>
                  ) : null}
                </div>

                {(mins.pendingExercises > 0 || mins.pendingPlates > 0 || pending > 0) && (
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {mins.pendingExercises > 0 && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full border text-[11px] font-semibold backdrop-blur-md bg-white/10 border-white/20 text-white">
                        {mins.pendingExercises} ejercicios
                      </span>
                    )}
                    {mins.pendingPlates > 0 && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full border text-[11px] font-semibold backdrop-blur-md bg-white/10 border-white/20 text-white">
                        {mins.pendingPlates} platos
                      </span>
                    )}
                    {pending > 0 && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full border text-[11px] font-semibold border-[#FF7939]/40 bg-[#FF7939]/10 text-[#FFB366]">
                        {formatMinutes(pending)}
                      </span>
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
              <div className="mb-3 space-y-2">
                {meets.map((m) => {
                  const start = new Date(m.start_time)
                  const end = m.end_time ? new Date(m.end_time) : null
                  const label = `${format(start, 'HH:mm')}${end && !Number.isNaN(end.getTime()) ? ` – ${format(end, 'HH:mm')}` : ''}`
                  const coachName = m.coach_id
                    ? (coachProfiles.find((c) => c.id === String(m.coach_id))?.full_name || 'Coach')
                    : 'Coach'
                  const isPending = String((m as any)?.rsvp_status || 'pending') === 'pending'
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setSelectedMeetEvent(m)}
                      className="w-full text-left p-3 rounded-xl border border-white/30 bg-black hover:bg-white/5 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex flex-col flex-1 min-w-0">
                          <span className="text-sm font-semibold text-white truncate">{m.title ? String(m.title) : 'Meet'}</span>
                          <span className="text-[11px] text-gray-300 mt-0.5">{label} · {coachName}</span>
                        </div>
                        <span
                          className={
                            isPending
                              ? 'flex-shrink-0 px-2 py-1 rounded-full text-[10px] font-semibold text-[#FF3B30] bg-[#FF3B30]/10 border border-[#FF3B30]/50'
                              : 'flex-shrink-0 px-2 py-1 rounded-full text-[10px] font-semibold text-white bg-black/60 border border-white/60'
                          }
                        >
                          Meet
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>
            )
          })()}

          {selectedDayActivityItems.length > 0 && (
            <div className="mb-3 space-y-2">
              {selectedDayActivityItems.map((it) => (
                <button
                  key={it.activityId}
                  type="button"
                  onClick={() => onActivityClick(it.activityId)}
                  className={
                    `w-full text-left p-3 rounded-xl border relative ` +
                    `${it.borderClass} ${it.bgClass} ` +
                    `hover:bg-white/5 transition-colors`
                  }
                  style={{ backgroundClip: 'padding-box' }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="text-sm font-semibold text-white truncate">{it.activityTitle}</span>
                      <span className="text-[11px] text-gray-300 mt-0.5">{it.activityTypeLabel} · {it.pendingCountLabel}</span>
                    </div>

                    {it.pendingMinutes > 0 && (
                      <span className="flex-shrink-0 inline-flex items-center px-2.5 py-1 rounded-full border text-[11px] font-semibold border-[#FF7939]/40 bg-[#FF7939]/10 text-[#FFB366]">
                        {formatMinutes(it.pendingMinutes)}
                      </span>
                    )}
                  </div>
                </button>
              ))}
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
                      <span className="text-[11px] text-gray-300 mt-0.5">
                        {label}
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
      )}

      {selectedMeetEvent && (
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
            <div className="flex items-center justify-end mb-2">
              <button
                type="button"
                onClick={() => setSelectedMeetEvent(null)}
                className="w-8 h-8 rounded-full hover:bg-white/10 text-white flex items-center justify-center"
                aria-label="Cerrar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {(() => {
              const start = new Date(selectedMeetEvent.start_time)
              const end = selectedMeetEvent.end_time ? new Date(selectedMeetEvent.end_time) : null
              const timeLabel = `${format(start, 'HH:mm')}${end && !Number.isNaN(end.getTime()) ? ` – ${format(end, 'HH:mm')}` : ''}`
              const dateLabel = format(start, 'dd MMM yyyy', { locale: es })
              const coachName = selectedMeetEvent.coach_id
                ? (coachProfiles.find((c) => c.id === String(selectedMeetEvent.coach_id))?.full_name || 'Coach')
                : 'Coach'

              const isConfirmed = selectedMeetRsvpStatus === 'confirmed'
              const isDeclined = selectedMeetRsvpStatus === 'declined'
              const isCancelled = selectedMeetRsvpStatus === 'cancelled'
              const isGroup = selectedMeetParticipantsCount > 1
              const classLabel = isGroup ? 'Clase grupal' : 'Individual'

              const handleAccept = async () => {
                try {
                  setSelectedMeetRsvpLoading(true)
                  const { data: auth } = await supabase.auth.getUser()
                  const user = auth?.user
                  if (!user?.id) return

                  const { data: updated, error: updErr } = await supabase
                    .from('calendar_event_participants')
                    .update({ rsvp_status: 'confirmed' })
                    .eq('event_id', selectedMeetEvent.id)
                    .eq('client_id', user.id)
                    .select('id')

                  if (updErr) {
                    console.error('Error accepting meet (update):', updErr)
                    return
                  }

                  if (!updated || updated.length === 0) {
                    const { error: insErr } = await supabase
                      .from('calendar_event_participants')
                      .insert({
                        event_id: selectedMeetEvent.id,
                        client_id: user.id,
                        rsvp_status: 'confirmed',
                        payment_status: 'unpaid',
                      })

                    if (insErr) {
                      console.error('Error accepting meet (insert):', insErr)
                      return
                    }
                  }

                  setSelectedMeetRsvpStatus('confirmed')
                } finally {
                  setSelectedMeetRsvpLoading(false)
                }
              }

              const handleDecline = async () => {
                try {
                  setSelectedMeetRsvpLoading(true)
                  const { data: auth } = await supabase.auth.getUser()
                  const user = auth?.user
                  if (!user?.id) return

                  const { data: updated, error: updErr } = await supabase
                    .from('calendar_event_participants')
                    .update({ rsvp_status: 'declined' })
                    .eq('event_id', selectedMeetEvent.id)
                    .eq('client_id', user.id)
                    .select('id')

                  if (updErr) {
                    console.error('Error declining meet (update):', updErr)
                    return
                  }

                  if (!updated || updated.length === 0) {
                    const { error: insErr } = await supabase
                      .from('calendar_event_participants')
                      .insert({
                        event_id: selectedMeetEvent.id,
                        client_id: user.id,
                        rsvp_status: 'declined',
                        payment_status: 'unpaid',
                      })

                    if (insErr) {
                      console.error('Error declining meet (insert):', insErr)
                      return
                    }
                  }

                  setSelectedMeetRsvpStatus('declined')
                  setSelectedMeetEvent(null)
                } finally {
                  setSelectedMeetRsvpLoading(false)
                }
              }

              const handleCancel = async () => {
                try {
                  setSelectedMeetRsvpLoading(true)
                  const { data: auth } = await supabase.auth.getUser()
                  const user = auth?.user
                  if (!user?.id) return

                  const { data: updated, error: updErr } = await supabase
                    .from('calendar_event_participants')
                    .update({ rsvp_status: 'cancelled' })
                    .eq('event_id', selectedMeetEvent.id)
                    .eq('client_id', user.id)
                    .select('id')

                  if (updErr) {
                    console.error('Error cancelling meet (update):', updErr)
                    return
                  }

                  if (!updated || updated.length === 0) {
                    const { error: insErr } = await supabase
                      .from('calendar_event_participants')
                      .insert({
                        event_id: selectedMeetEvent.id,
                        client_id: user.id,
                        rsvp_status: 'cancelled',
                        payment_status: 'unpaid',
                      })

                    if (insErr) {
                      console.error('Error cancelling meet (insert):', insErr)
                      return
                    }
                  }

                  setSelectedMeetRsvpStatus('cancelled')
                  setSelectedMeetEvent(null)
                } finally {
                  setSelectedMeetRsvpLoading(false)
                }
              }

              const handleSuggestNewTime = () => {
                if (!selectedMeetEvent?.coach_id) return
                handlePickCoachForMeet(String(selectedMeetEvent.coach_id))
                setMeetViewMode('week')
                setMeetWeekStart(startOfWeek(start, { weekStartsOn: 1 }))
                setSelectedMeetEvent(null)
              }

              return (
                <>
                  <div className="mb-1 text-white font-semibold text-xl leading-snug break-words whitespace-normal">
                    {selectedMeetEvent.title ? String(selectedMeetEvent.title) : 'Meet'}
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-2 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200">
                      <span className="font-medium">{dateLabel}</span>
                    </div>
                    <div className="flex items-center gap-2 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200">
                      <span className="font-medium">{timeLabel}</span>
                    </div>
                    <div className="ml-auto px-3 py-2 rounded-lg text-sm font-semibold bg-[#FF7939]/10 text-[#FFB366] border border-[#FF7939]/40">
                      {coachName}
                    </div>
                  </div>

                  <div className="mt-3 text-sm font-semibold text-white/90">
                    {classLabel}
                  </div>

                  {selectedMeetEvent.description && String(selectedMeetEvent.description).trim().length > 0 && (
                    <div className="mt-4">
                      <div className="text-base font-semibold text-white">Notas</div>
                      <div className="mt-1 text-sm text-white/80 whitespace-pre-wrap break-words">
                        {String(selectedMeetEvent.description)}
                      </div>
                    </div>
                  )}

                  {(isDeclined || isCancelled) && (
                    <div className="mt-2 text-xs text-white/70">
                      Estado: <span className="text-white/90 font-semibold">{isDeclined ? 'Rechazada' : 'Cancelada'}</span>
                    </div>
                  )}

                  <div className="pt-4 flex flex-col gap-2">
                    {!isConfirmed ? (
                      <>
                        <button
                          type="button"
                          disabled={selectedMeetRsvpLoading}
                          onClick={handleAccept}
                          className="w-full px-4 py-2.5 rounded-xl bg-[#FF7939] text-black text-sm font-semibold hover:opacity-95 transition-opacity disabled:opacity-60"
                        >
                          Aceptar
                        </button>

                        <button
                          type="button"
                          disabled={selectedMeetRsvpLoading}
                          onClick={handleSuggestNewTime}
                          className="w-full px-4 py-2.5 rounded-xl bg-zinc-800 text-white text-sm hover:bg-zinc-700 transition-colors disabled:opacity-60"
                        >
                          Sugerir nuevo horario
                        </button>

                        <button
                          type="button"
                          disabled={selectedMeetRsvpLoading}
                          onClick={handleDecline}
                          className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 text-white text-sm border border-white/15 hover:bg-zinc-800 transition-colors disabled:opacity-60"
                        >
                          Rechazar
                        </button>
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
                          <div className="flex-1 text-sm text-gray-400">Sin link disponible</div>
                        )}
                      </div>
                    )}
                  </div>
                </>
              )
            })()}
          </div>
        </div>
      )}

      {selectedMeetRequest && (
        <div
          className="fixed inset-0 z-[70] bg-black/60 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setSelectedMeetRequest(null)}
        >
          <div
            className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="text-white font-semibold text-xl">Solicitar Meet</div>
              <button
                type="button"
                onClick={() => setSelectedMeetRequest(null)}
                className="w-8 h-8 rounded-full hover:bg-white/10 text-white flex items-center justify-center"
                aria-label="Cerrar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {(() => {
              const coachName =
                coachProfiles.find((c) => c.id === String(selectedMeetRequest.coachId))?.full_name || 'Coach'
              const creditsAvailable = Number(meetCreditsByCoachId?.[String(selectedMeetRequest.coachId)] ?? 0)
              const dateLabel = format(new Date(`${selectedMeetRequest.dayKey}T00:00:00`), 'dd MMM yyyy', { locale: es })
              const timeLabel = `${selectedMeetRequest.timeHHMM} – ${(() => {
                const [h, m] = selectedMeetRequest.timeHHMM.split(':').map((x) => parseInt(x, 10))
                const total = (Number.isFinite(h) ? h : 0) * 60 + (Number.isFinite(m) ? m : 0) + 30
                const hh = Math.floor(total / 60)
                const mm = total % 60
                return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
              })()}`

              return (
                <>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-2 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200">
                      <span className="font-medium">{dateLabel}</span>
                    </div>
                    <div className="flex items-center gap-2 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200">
                      <span className="font-medium">{timeLabel}</span>
                    </div>
                    <div className="ml-auto px-3 py-2 rounded-lg text-sm font-semibold bg-[#FF7939]/10 text-[#FFB366] border border-[#FF7939]/40">
                      {coachName}
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
                    <div className="text-base font-semibold text-white">Esto consumirá 1 crédito</div>
                    <div className="mt-1 text-sm text-white/70">
                      Tenés <span className="text-white/90 font-semibold">{Number.isFinite(creditsAvailable) ? creditsAvailable : 0}</span> créditos disponibles con este coach.
                    </div>
                  </div>

                  <div className="pt-4 flex flex-col gap-2">
                    <button
                      type="button"
                      className="w-full px-4 py-2.5 rounded-xl bg-[#FF7939] text-black text-sm font-semibold hover:opacity-95 transition-opacity"
                      onClick={() => {
                        // TODO: crear la solicitud en DB (calendar_events + participants) vía RPC/endpoint.
                        setSelectedMeetRequest(null)
                      }}
                    >
                      Confirmar solicitud
                    </button>

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
      )}
    </div>
  )
}
