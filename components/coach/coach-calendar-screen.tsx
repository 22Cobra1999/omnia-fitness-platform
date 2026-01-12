'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { createClient } from "@/lib/supabase/supabase-client"
import { Bell, Calendar, Clock, Video, ExternalLink, Users, RefreshCw, Plus, Minus, Search, Pencil, ChevronDown, Trash2 } from "lucide-react"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, addMonths, subMonths, addDays, subDays, addYears, subYears, differenceInMinutes } from "date-fns"
import { es } from "date-fns/locale"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from 'sonner'
// Google components removed - functionality to be reimplemented if needed
// import { ConnectGoogleButton } from "@/components/google/ConnectGoogleButton"
// import { MeetingJoinButton } from "@/components/google/MeetingJoinButton"
import { WorkshopEventModal } from "./workshop-event-modal"
import { WorkshopEventDetailModal } from "./workshop-event-detail-modal"
import { parseISO } from 'date-fns'
import { DeleteConfirmationDialog } from "@/components/shared/ui/delete-confirmation-dialog"
import { MeetNotificationsModal } from "@/components/shared/meet-notifications-modal"

interface CalendarEvent {
  id: string
  title: string
  start_time: string
  end_time: string
  event_type: 'workshop' | 'consultation' | 'other'
  status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled'
  client_id?: string
  client_name?: string
  activity_id?: number
  product_name?: string
  // Google Meet fields
  meet_link?: string
  meet_link_id?: string
  google_event_id?: string
  attendance_tracked?: boolean
  // Additional fields for modal
  description?: string
  notes?: string
  max_participants?: number
  current_participants?: number
  activity_name?: string
  // Google Calendar fields
  is_google_event?: boolean
  source?: string
  location?: string
  attendees?: Array<{ email: string; displayName?: string }>
}

export default function CoachCalendarScreen() {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date())
  const [coachId, setCoachId] = useState<string | null>(null)
  const [googleConnected, setGoogleConnected] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [showEventModal, setShowEventModal] = useState(false)
  const [viewMode, setViewMode] = useState<'month' | 'today'>('month') // ✅ Vista: mes o hoy
  const [syncing, setSyncing] = useState(false)
  const [showMonthSelector, setShowMonthSelector] = useState(false)
  const [monthPickerYear, setMonthPickerYear] = useState<number>(() => new Date().getFullYear())
  const [cachedEvents, setCachedEvents] = useState<Map<string, CalendarEvent[]>>(new Map())

  const [calendarMode, setCalendarMode] = useState<'events' | 'availability'>('events')
  const [showAddMenu, setShowAddMenu] = useState(false)
  const [showMeetNotifications, setShowMeetNotifications] = useState(false)
  const [meetNotificationsCount, setMeetNotificationsCount] = useState<number>(0)
  const [availabilityStart, setAvailabilityStart] = useState('09:00')
  const [availabilityEnd, setAvailabilityEnd] = useState('18:00')
  const [availabilityScope, setAvailabilityScope] = useState<'month' | 'always'>('month')
  const [availabilitySelectingDays, setAvailabilitySelectingDays] = useState(false)
  const [availabilityWeekdays, setAvailabilityWeekdays] = useState<boolean[]>([false, false, false, false, false, false, false])
  const [availabilityShowExtraLine, setAvailabilityShowExtraLine] = useState(false)
  const [availabilityIsEditingRules, setAvailabilityIsEditingRules] = useState(false)
  const [availabilitySaving, setAvailabilitySaving] = useState(false)
  const [availabilityOpenDaysForRuleId, setAvailabilityOpenDaysForRuleId] = useState<string | null>(null)
  const [availabilityOpenMonthsForRuleId, setAvailabilityOpenMonthsForRuleId] = useState<string | null>(null)
  const [availabilityOpenTimeForRuleId, setAvailabilityOpenTimeForRuleId] = useState<string | null>(null)
  const [availabilityDrafts, setAvailabilityDrafts] = useState<
    Record<
      string,
      {
        start: string
        end: string
        days: number[]
        months: number[]
      }
    >
  >({})
  const [availabilityRules, setAvailabilityRules] = useState<
    Array<{
      id: string
      dbKey?: {
        start: string
        end: string
        scope: 'always' | 'month'
        year?: number | null
        month?: number | null
      }
      dbIds?: string[]
      start: string
      end: string
      days: number[]
      months?: number[]
      scope: 'always' | 'months'
    }>
  >([])

  const [showCreateEventModal, setShowCreateEventModal] = useState(false)
  const [createEventLoading, setCreateEventLoading] = useState(false)
  const [meetModalMode, setMeetModalMode] = useState<'create' | 'edit'>('create')
  const [editingEventId, setEditingEventId] = useState<string | null>(null)
  const [editingEventMeetLink, setEditingEventMeetLink] = useState<string | null>(null)
  const [editingEventGoogleId, setEditingEventGoogleId] = useState<string | null>(null)
  const [isMeetEditing, setIsMeetEditing] = useState(false)
  const [showDeleteMeetDialog, setShowDeleteMeetDialog] = useState(false)
  const [clientsForMeet, setClientsForMeet] = useState<
    Array<{
      id: string
      name: string
      email?: string
      avatar_url?: string | null
      status?: 'active' | 'pending' | 'inactive'
      meet_credits_available?: number
    }>
  >([])
  const [meetParticipants, setMeetParticipants] = useState<
    Array<{ client_id: string; rsvp_status?: string; payment_status?: string; payment_id?: number | null }>
  >([])
  const [newEventTitle, setNewEventTitle] = useState('')
  const [newEventNotes, setNewEventNotes] = useState('')
  const [newEventDate, setNewEventDate] = useState<string>('')
  const [newEventStartTime, setNewEventStartTime] = useState<string>('')
  const [newEventEndTime, setNewEventEndTime] = useState<string>('')
  const [selectedClientIds, setSelectedClientIds] = useState<string[]>([])
  const [newEventIsFree, setNewEventIsFree] = useState(true)
  const [newEventPrice, setNewEventPrice] = useState<string>('')
  const [showClientPicker, setShowClientPicker] = useState(false)
  const [clientSearch, setClientSearch] = useState('')

  const meetDateInputRef = useRef<HTMLInputElement | null>(null)

  const supabase = createClient()

  useEffect(() => {
    const loadMeetNotificationCount = async () => {
      try {
        if (!coachId) {
          setMeetNotificationsCount(0)
          return
        }

        const { data: myEvents, error: myEventsError } = await supabase
          .from('calendar_events')
          .select('id')
          .eq('coach_id', coachId)
          .eq('event_type', 'consultation')
          .limit(200)

        if (myEventsError) {
          setMeetNotificationsCount(0)
          return
        }

        const ids = (myEvents || []).map((e: any) => String(e?.id || '')).filter(Boolean)
        if (ids.length === 0) {
          setMeetNotificationsCount(0)
          return
        }

        const { count, error } = await supabase
          .from('calendar_event_participants')
          .select('id', { count: 'exact' })
          .in('event_id', ids)
          .eq('rsvp_status', 'pending')
          .neq('participant_role', 'coach')

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
  }, [coachId, supabase, events])

  const openMeetById = async (eventId: string) => {
    try {
      const found = events.find((e) => String(e.id) === String(eventId))
      if (found) {
        await openCreateEventModal(found)
        setShowMeetNotifications(false)
        return
      }

      const { data: ev, error } = await supabase
        .from('calendar_events')
        .select('id, title, description, start_time, end_time, event_type, status, meet_link, google_event_id')
        .eq('id', eventId)
        .maybeSingle()

      if (error || !ev?.id) return
      await openCreateEventModal({
        id: String(ev.id),
        title: String(ev.title || 'Meet'),
        start_time: String(ev.start_time),
        end_time: String(ev.end_time),
        event_type: 'consultation',
        status: (ev.status as any) || 'scheduled',
        description: ev.description == null ? undefined : String(ev.description || ''),
        meet_link: ev.meet_link == null ? undefined : String(ev.meet_link || ''),
        google_event_id: ev.google_event_id == null ? undefined : String(ev.google_event_id || ''),
      } as any)
      setShowMeetNotifications(false)
    } catch {
      // ignore
    }
  }

  const pad2 = (n: number) => String(n).padStart(2, '0')
  const formatArs = (value: any) => {
    const n = Number(value)
    const safe = Number.isFinite(n) ? n : 0
    try {
      return new Intl.NumberFormat('es-AR').format(safe)
    } catch {
      return String(safe)
    }
  }
  const getDefaultStartTime = () => {
    const now = new Date()
    now.setMinutes(0, 0, 0)
    now.setHours(now.getHours() + 1)
    return `${pad2(now.getHours())}:${pad2(now.getMinutes())}`
  }

  const deleteMeeting = async () => {
    if (meetModalMode !== 'edit' || !editingEventId) return

    setCreateEventLoading(true)
    try {
      const { error } = await supabase.from('calendar_events').delete().eq('id', editingEventId)
      if (error) {
        toast.error(error.message || 'No se pudo eliminar la reunión')
        return
      }

      toast.success('Reunión eliminada')
      closeCreateEventModal()
      await getCoachEvents(true)
      await ensureClientsLoaded()
    } finally {
      setCreateEventLoading(false)
    }
  }
  const getDefaultEndTime = (startTime: string) => {
    const [h, m] = startTime.split(':').map((v) => Number(v))
    const end = new Date()
    end.setHours(h, m || 0, 0, 0)
    end.setHours(end.getHours() + 1)
    return `${pad2(end.getHours())}:${pad2(end.getMinutes())}`
  }

  const openCreateEventModal = async (event?: CalendarEvent) => {
    // Modo editar (reunión existente)
    if (event && event.event_type === 'consultation') {
      const start = parseISO(event.start_time)
      const end = parseISO(event.end_time)

      setMeetModalMode('edit')
      setEditingEventId(event.id)
      setEditingEventMeetLink(event.meet_link || null)
      setEditingEventGoogleId(event.google_event_id || null)
      setIsMeetEditing(false)

      setNewEventDate(format(start, 'yyyy-MM-dd'))
      setNewEventStartTime(format(start, 'HH:mm'))
      setNewEventEndTime(format(end, 'HH:mm'))
      setNewEventTitle(event.title || '')
      setNewEventNotes(String(event.description || ''))

      // Cargar invitados desde calendar_event_participants (source of truth)
      try {
        const { data: parts, error: partsErr } = await supabase
          .from('calendar_event_participants')
          .select('client_id, rsvp_status, payment_status, payment_id')
          .eq('event_id', event.id)

        if (!partsErr && Array.isArray(parts)) {
          const ids = parts
            .map((p: any) => String(p?.client_id || ''))
            .filter((id: string) => !!id)
          setSelectedClientIds(ids)
          setMeetParticipants(
            parts
              .map((p: any) => ({
                client_id: String(p?.client_id || ''),
                rsvp_status: p?.rsvp_status,
                payment_status: p?.payment_status,
                payment_id: p?.payment_id ?? null,
              }))
              .filter((p: any) => !!p.client_id)
          )
        } else {
          setSelectedClientIds([])
          setMeetParticipants([])
        }
      } catch {
        setSelectedClientIds([])
        setMeetParticipants([])
      }
      setNewEventIsFree(true)
      setNewEventPrice('')
      setShowClientPicker(false)
      setClientSearch('')
      setShowCreateEventModal(true)

      if (clientsForMeet.length === 0) await ensureClientsLoaded()
      return
    }

    // Modo crear
    setMeetModalMode('create')
    setEditingEventId(null)
    setEditingEventMeetLink(null)
    setEditingEventGoogleId(null)
    setIsMeetEditing(true)

    const baseDate = selectedDate || new Date()
    setNewEventDate(format(baseDate, 'yyyy-MM-dd'))
    const defaultStart = getDefaultStartTime()
    setNewEventStartTime(defaultStart)
    setNewEventEndTime(getDefaultEndTime(defaultStart))
    setNewEventTitle('')
    setNewEventNotes('')
    setSelectedClientIds([])
    setNewEventIsFree(true)
    setNewEventPrice('')
    setShowClientPicker(false)
    setClientSearch('')
    setShowCreateEventModal(true)

    if (clientsForMeet.length === 0) await ensureClientsLoaded()
  }

  const closeCreateEventModal = () => {
    setShowCreateEventModal(false)
    setMeetModalMode('create')
    setEditingEventId(null)
    setEditingEventMeetLink(null)
    setEditingEventGoogleId(null)
    setIsMeetEditing(false)
    setShowDeleteMeetDialog(false)
  }

  const ensureClientsLoaded = useCallback(async () => {
    try {
      const res = await fetch('/api/coach/clients', { credentials: 'include' })
      const data = await res.json().catch(() => null)
      const list = Array.isArray(data?.clients) ? data.clients : []
      setClientsForMeet(
        list.map((c: any) => ({
          id: String(c?.id || ''),
          name: String(c?.name || 'Cliente'),
          email: String(c?.email || ''),
          avatar_url: c?.avatar_url || null,
          status: c?.status,
          meet_credits_available: Number(
            c?.meet_credits_available ?? c?.credits_available ?? c?.available_meet_credits ?? 0
          ),
        })).filter((c: any) => !!c.id)
      )
    } catch {
      setClientsForMeet([])
    }
  }, [])

  const handleCreateEvent = async () => {
    if (!coachId) return
    if (!newEventTitle.trim()) {
      toast.error('Ingresá un tema')
      return
    }
    if (meetModalMode === 'create' && selectedClientIds.length === 0) {
      toast.error('Seleccioná un cliente')
      return
    }
    if (!newEventDate) {
      toast.error('Seleccioná una fecha')
      return
    }

    const finalStartTime = newEventStartTime || getDefaultStartTime()
    const finalEndTime = newEventEndTime || getDefaultEndTime(finalStartTime)

    const startISO = new Date(`${newEventDate}T${finalStartTime}:00`).toISOString()
    const endISO = new Date(`${newEventDate}T${finalEndTime}:00`).toISOString()

    setCreateEventLoading(true)
    try {
      if (meetModalMode === 'edit' && editingEventId) {
        const { error: updateError } = await supabase
          .from('calendar_events')
          .update({
            title: newEventTitle.trim(),
            start_time: startISO,
            end_time: endISO,
            description: newEventNotes.trim() ? newEventNotes.trim() : null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingEventId)

        if (updateError) {
          console.error('Error updating event:', updateError)
          toast.error(updateError.message || 'No se pudo actualizar el evento')
          return
        }

        if (editingEventGoogleId) {
          try {
            await fetch('/api/google/calendar/update-event', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({
                eventId: editingEventId,
                startTime: startISO,
                endTime: endISO,
                title: newEventTitle.trim(),
                description: newEventNotes.trim() ? newEventNotes.trim() : undefined,
              }),
            })
          } catch {
            // No bloquear
          }
        }

        closeCreateEventModal()
        toast.success('Cambios guardados')
        await getCoachEvents(true)
        await ensureClientsLoaded()
        return
      }

      const normalizedPrice = newEventIsFree
        ? null
        : (String(newEventPrice || '').trim() ? Number(newEventPrice) : 0)

      if (selectedClientIds.length === 0) {
        toast.error('Seleccioná al menos 1 cliente para enviar la solicitud de Meet')
        return
      }

      // Nuevo modelo: 1 evento + N participantes en calendar_event_participants
      const { data: insertedEvent, error } = await supabase
        .from('calendar_events')
        .insert({
          coach_id: coachId,
          title: newEventTitle.trim(),
          start_time: startISO,
          end_time: endISO,
          event_type: 'consultation',
          status: 'scheduled',
          description: newEventNotes.trim() ? newEventNotes.trim() : null,
          is_free: newEventIsFree,
          price: normalizedPrice,
          currency: 'ARS',
        } as any)
        .select('id')
        .maybeSingle()

      if (error || !insertedEvent?.id) {
        console.error('Error creating event:', error)
        toast.error(error?.message || 'No se pudo crear el evento')
        return
      }

      // Insertar participantes (bloqueante). Si falla, rollback borrando el evento.
      const participantRows = [
        // Coach como host
        {
          event_id: insertedEvent.id,
          client_id: coachId,
          rsvp_status: 'confirmed',
          payment_status: 'free',
          participant_role: 'coach',
          is_host: true,
          invited_by_role: 'coach',
          invited_by_user_id: coachId,
        },
        // Cliente(s) invitados
        ...selectedClientIds.map((clientId) => {
          const clientData = clientsForMeet.find(c => c.id === clientId)
          const availableCredits = clientData?.meet_credits_available || 0

          // Calcular costo en créditos (1 crédito cada 15 min)
          const minutes = differenceInMinutes(parseISO(endISO), parseISO(startISO))
          const cost = Math.ceil(minutes / 15)

          // Lógica de pago: 
          // 1. Si es gratis -> 'free'
          // 2. Si tiene créditos suficientes -> 'credit_deduction' (se descontarán al insertar)
          // 3. Si no tiene suficientes -> 'unpaid' (debe pagar diferencia/total)
          let paymentStatus = 'unpaid'
          if (availableCredits >= cost) {
            paymentStatus = 'credit_deduction'
          } else if (newEventIsFree) {
            paymentStatus = 'free'
          } else {
            paymentStatus = 'unpaid'
          }

          return {
            event_id: insertedEvent.id,
            client_id: clientId,
            rsvp_status: 'pending',
            payment_status: paymentStatus,
            participant_role: 'client',
            is_host: false,
            invited_by_role: 'coach',
            invited_by_user_id: coachId,
          }
        }),
      ]

      const { error: partErr } = await supabase
        .from('calendar_event_participants')
        .upsert(participantRows as any, { onConflict: 'event_id,client_id' })

      if (partErr) {
        console.error('Error inserting participants:', partErr)
        // rollback: evitar events huérfanos que el cliente no ve
        try {
          await supabase.from('calendar_events').delete().eq('id', insertedEvent.id)
        } catch {
          // best effort
        }
        toast.error(partErr.message || 'No se pudo enviar la solicitud al cliente')
        return
      }

      // Si se insertó correctamente, verificar si hubo pagos parciales y aplicar deducción manual
      // AHORA: Siempre intentamos descontar créditos parciales, incluso si es 'Gratis' (el saldo restante será $0 o $Precio)
      {
        for (const clientId of selectedClientIds) {
          const clientData = clientsForMeet.find(c => c.id === clientId)
          const availableCredits = clientData?.meet_credits_available || 0

          const minutes = differenceInMinutes(parseISO(endISO), parseISO(startISO))
          const cost = Math.ceil(minutes / 15)

          // Si tiene algo de saldo pero NO cubre el costo, usar lo que tenga
          if (availableCredits > 0 && availableCredits < cost) {
            await supabase.rpc('deduct_client_credits', {
              p_client_id: clientId,
              p_amount: availableCredits,
              p_event_id: insertedEvent.id,
              p_description: `Pago parcial reserva (Req: ${cost}, Disp: ${availableCredits})`
            })
          }
        }
      }

      closeCreateEventModal()
      toast.success('Evento creado')

      // Crear Meet link automáticamente para reuniones creadas con el +
      // Usar el endpoint dedicado (create-meet) porque auto-create-meet está pensado para talleres.
      {
        const eventId = insertedEvent.id
        let anyMeetError = false
        if (eventId) {
          try {
            const resp = await fetch('/api/google/calendar/create-meet', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({ eventId }),
            })

            const json = await resp.json().catch(() => null)
            if (!resp.ok || !json?.success) {
              // Si no está conectado, dejar mensaje claro
              if (json?.connected === false) {
                anyMeetError = true
              } else {
                anyMeetError = true
              }
            }
          } catch {
            anyMeetError = true
          }
        }

        if (anyMeetError) {
          toast.error('No se pudo generar el link de Meet')
        }
      }

      await getCoachEvents(true)
      await ensureClientsLoaded()
    } finally {
      setCreateEventLoading(false)
    }
  }

  // Verificar conexión con Google
  const checkGoogleConnection = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: tokens, error } = await supabase
        .from('google_oauth_tokens')
        .select('*')
        .eq('coach_id', user.id)
        .maybeSingle()

      // Si no hay error y hay tokens, está conectado
      setGoogleConnected(!error && !!tokens)
    } catch (error) {
      console.error('Error checking Google connection:', error)
      setGoogleConnected(false)
    }
  }, [supabase])

  // Nota: La creación de Google Meet ahora es automática al crear eventos

  // Obtener eventos del coach (Omnia + Google Calendar)
  // Optimizado: carga eventos de 3 meses (mes anterior, actual, siguiente) para cachear
  const getCoachEvents = useCallback(async (force = false) => {
    try {
      const cacheKey = `${currentDate.getFullYear()}-${currentDate.getMonth()}`

      // Verificar si ya tenemos eventos en caché para este mes
      // Solo usar cache si no estamos forzando recarga
      if (!force && cachedEvents.has(cacheKey)) {
        const cached = cachedEvents.get(cacheKey) || []
        // Si el cache tiene eventos o es un array vacío válido, usarlo
        setEvents(cached)
        setLoading(false)
        // Cargar en background para meses adyacentes si no están en cache
        const prevMonth = subMonths(currentDate, 1)
        const nextMonth = addMonths(currentDate, 1)
        const prevKey = `${prevMonth.getFullYear()}-${prevMonth.getMonth()}`
        const nextKey = `${nextMonth.getFullYear()}-${nextMonth.getMonth()}`

        if (!cachedEvents.has(prevKey) || !cachedEvents.has(nextKey)) {
          // Continuar con la carga normal para poblar cache de meses adyacentes
        } else {
          return // Ya tenemos todo en cache
        }
      }

      setLoading(true)

      // 1. Obtener usuario actual
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        console.error('Error obteniendo usuario:', userError)
        setLoading(false)
        setEvents([])
        return
      }

      setCoachId(user.id)

      // 2. Obtener eventos del calendario del coach para un rango amplio (3 meses)
      // Cargar mes anterior, actual y siguiente para tener cache
      const monthStart = startOfMonth(subMonths(currentDate, 1)) // Mes anterior
      const monthEnd = endOfMonth(addMonths(currentDate, 1)) // Mes siguiente
      const monthNum = currentDate.getMonth()
      const year = currentDate.getFullYear()

      // Asegurar que las fechas estén en formato ISO correcto
      const monthStartISO = monthStart.toISOString()
      const monthEndISO = monthEnd.toISOString()

      // Obtener eventos de Omnia
      let calendarEvents: any[] = []
      try {
        const { data, error: eventsError } = await supabase
          .from('calendar_events')
          .select(`
            id,
            title,
            start_time,
            end_time,
            event_type,
            status,
            activity_id,
            meet_link,
            meet_link_id,
            google_event_id,
            attendance_tracked,
            description,
            is_free,
            price,
            currency
          `)
          .eq('coach_id', user.id)
          .gte('start_time', monthStartISO)
          .lte('start_time', monthEndISO)
          .order('start_time', { ascending: true })

        if (eventsError) {
          console.error("Error getting events from Supabase:", eventsError)
          console.warn("⚠️ Continuando sin eventos de Omnia. Intentando cargar eventos de Google Calendar...")
          calendarEvents = []
        } else {
          calendarEvents = data || []
        }
      } catch (supabaseError: any) {
        console.error("Error inesperado obteniendo eventos de Supabase:", supabaseError)
        calendarEvents = []
      }

      // Enriquecer participantes desde calendar_event_participants (solo para eventos Omnia)
      try {
        const omniaEventIds = (calendarEvents || []).map((e: any) => e?.id).filter(Boolean)
        if (omniaEventIds.length > 0) {
          const { data: parts, error: partsErr } = await supabase
            .from('calendar_event_participants')
            .select('event_id')
            .in('event_id', omniaEventIds as any)

          if (!partsErr && Array.isArray(parts)) {
            const countByEvent = new Map<string, number>()
            for (const p of parts as any[]) {
              const eid = String(p?.event_id || '')
              if (!eid) continue
              countByEvent.set(eid, (countByEvent.get(eid) || 0) + 1)
            }
            calendarEvents = (calendarEvents || []).map((e: any) => {
              const count = countByEvent.get(String(e?.id || '')) || 0
              return {
                ...e,
                current_participants: count,
                max_participants: e?.max_participants ?? (count > 0 ? count : null),
              }
            })
          }
        }
      } catch {
        // No bloquear
      }

      // Obtener eventos de Google Calendar en paralelo
      let googleEvents: CalendarEvent[] = []
      try {
        // Usar timeout para evitar que la request se cuelgue
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 8000) // 8 segundos timeout (reducido para producción)

        // Construir URL absoluta para producción
        const baseUrl = typeof window !== 'undefined'
          ? window.location.origin
          : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

        const googleResponse = await fetch(
          `${baseUrl}/api/google/calendar/events?monthNum=${monthNum}&year=${year}`,
          {
            credentials: 'include',
            signal: controller.signal,
            headers: {
              'Content-Type': 'application/json',
            },
            cache: 'no-store' // Evitar cache en producción
          }
        )

        clearTimeout(timeoutId)

        if (!googleResponse.ok) {
          // Si la respuesta no es exitosa, intentar leer el JSON para obtener el mensaje de error
          try {
            const errorData = await googleResponse.json()
            console.warn("⚠️ Error en respuesta de Google Calendar:", {
              status: googleResponse.status,
              error: errorData.error,
              needsReconnect: errorData.needsReconnect,
              connected: errorData.connected
            })
            if (errorData.needsReconnect) {
              setGoogleConnected(false)
              console.warn("⚠️ Google Calendar requiere reconexión. Ve al perfil para reconectar.")
            }
          } catch (parseError) {
            console.warn(`⚠️ Error HTTP ${googleResponse.status} obteniendo eventos de Google Calendar. El calendario continuará funcionando sin eventos de Google.`)
          }
          setGoogleConnected(false)
        } else {
          try {
            const googleData = await googleResponse.json()

            if (googleData.success && googleData.events) {
              googleEvents = googleData.events.map((event: any) => ({
                ...event,
                is_google_event: true,
                source: 'google_calendar',
              }))
              setGoogleConnected(true)
              console.log(`📅 Eventos de Google Calendar obtenidos: ${googleEvents.length}`)
            } else if (googleData.connected === false) {
              setGoogleConnected(false)
            } else if (googleData.needsReconnect) {
              setGoogleConnected(false)
              console.warn("⚠️ Google Calendar requiere reconexión:", googleData.error || 'Token expirado o inválido')
              // Mostrar mensaje más específico al usuario
              if (googleData.error) {
                console.error("Detalle del error:", googleData.error)
              }
            }
          } catch (jsonError) {
            console.warn("⚠️ Error parseando respuesta de Google Calendar. Continuando sin eventos de Google.")
            setGoogleConnected(false)
          }
        }
      } catch (googleError: any) {
        // Manejar diferentes tipos de errores
        if (googleError.name === 'AbortError') {
          console.warn("⏱️ Timeout obteniendo eventos de Google Calendar. El calendario continuará funcionando.")
        } else if (googleError.message?.includes('fetch')) {
          console.warn("⚠️ Error de red obteniendo eventos de Google Calendar. El calendario continuará funcionando con eventos de Omnia.")
        } else {
          console.error("❌ Error obteniendo eventos de Google Calendar:", googleError.message || googleError)
        }
        // No fallar si Google Calendar no está disponible - el calendario debe funcionar solo con eventos de Omnia
        setGoogleConnected(false)
      }

      // Combinar eventos de Omnia y Google Calendar
      let allEvents: CalendarEvent[] = []

      // Procesar eventos de Omnia
      if (calendarEvents && calendarEvents.length > 0) {
        // Obtener nombres de clientes
        const clientIds = [...new Set(calendarEvents.map(e => e.client_id).filter(Boolean))]
        let clientNames: Record<string, string> = {}

        if (clientIds.length > 0) {
          const { data: clients } = await supabase
            .from('user_profiles')
            .select('id, full_name')
            .in('id', clientIds)

          if (clients) {
            clientNames = clients.reduce((acc: Record<string, string>, client: { id: string; full_name: string | null }) => {
              acc[client.id] = client.full_name || 'Cliente'
              return acc
            }, {} as Record<string, string>)
          }
        }

        // Obtener nombres de actividades
        const activityIds = [...new Set(calendarEvents.map(e => e.activity_id).filter(Boolean))]
        let activityNames: Record<string, string> = {}

        if (activityIds.length > 0) {
          const { data: activities } = await supabase
            .from('activities')
            .select('id, title')
            .in('id', activityIds)

          if (activities) {
            activityNames = activities.reduce((acc: Record<string, string>, activity: { id: number; title: string | null }) => {
              acc[activity.id] = activity.title || 'Actividad'
              return acc
            }, {} as Record<string, string>)
          }
        }

        // Formatear eventos de Omnia con nombres de clientes y actividades
        const formattedOmniaEvents = calendarEvents.map(event => ({
          ...event,
          client_name: event.client_id ? clientNames[event.client_id] : undefined,
          product_name: event.activity_id ? activityNames[event.activity_id] : undefined,
          is_google_event: false,
          source: 'omnia',
        }))

        allEvents = [...formattedOmniaEvents]
      }

      // Agregar eventos de Google Calendar
      allEvents = [...allEvents, ...googleEvents]

      // Ordenar todos los eventos por fecha/hora
      allEvents.sort((a, b) => {
        const dateA = new Date(a.start_time).getTime()
        const dateB = new Date(b.start_time).getTime()
        return dateA - dateB
      })

      console.log(`📊 Total eventos: ${allEvents.length} (Omnia: ${calendarEvents?.length || 0}, Google: ${googleEvents.length})`)

      // Guardar eventos en caché por mes
      const newCache = new Map(cachedEvents)
      // Guardar eventos para cada mes del rango cargado (mes anterior, actual, siguiente)
      for (let i = -1; i <= 1; i++) {
        const monthDate = addMonths(currentDate, i)
        const monthKey = `${monthDate.getFullYear()}-${monthDate.getMonth()}`
        const monthStart = startOfMonth(monthDate)
        const monthEnd = endOfMonth(monthDate)

        const monthEvents = allEvents.filter(event => {
          const eventDate = new Date(event.start_time)
          return eventDate >= monthStart && eventDate <= monthEnd
        })
        newCache.set(monthKey, monthEvents)
      }
      setCachedEvents(newCache)

      // Filtrar eventos solo del mes actual para mostrar
      const currentMonthStart = startOfMonth(currentDate)
      const currentMonthEnd = endOfMonth(currentDate)
      const currentMonthEvents = allEvents.filter(event => {
        const eventDate = new Date(event.start_time)
        return eventDate >= currentMonthStart && eventDate <= currentMonthEnd
      })

      setEvents(currentMonthEvents)

      // Si hay un evento seleccionado, actualizarlo con los datos frescos
      // Esto se hace después de que todos los eventos se hayan cargado
      setSelectedEvent(prevEvent => {
        if (!prevEvent) return null
        const updatedEvent = allEvents.find(e => e.id === prevEvent.id)
        return updatedEvent || prevEvent
      })

      // Crear Meets automáticamente para eventos de taller que no tienen Meet
      // Solo si Google Calendar está conectado y estamos en el cliente (no durante build)
      // Esto se desactiva durante el build para evitar timeouts
      if (
        typeof window !== 'undefined' &&
        googleConnected &&
        calendarEvents &&
        calendarEvents.length > 0
      ) {
        const eventosSinMeet = calendarEvents.filter(
          (e: any) =>
            e.event_type === 'workshop' &&
            !e.meet_link &&
            !e.google_event_id
        );

        if (eventosSinMeet.length > 0) {
          console.log(`🔗 Creando Meets automáticamente para ${eventosSinMeet.length} talleres...`);

          // Crear Meets en paralelo (sin bloquear la UI)
          // Usar Promise.all para evitar múltiples recargas
          Promise.all(
            eventosSinMeet.map(async (event: any) => {
              try {
                const response = await fetch('/api/google/calendar/auto-create-meet', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ eventId: event.id }),
                });

                const result = await response.json();
                if (result.success) {
                  console.log(`✅ Meet creado automáticamente para: ${event.title}`);
                  return true;
                } else {
                  console.log(`⚠️  Meet no creado para: ${event.title} - ${result.message || 'Error desconocido'}`);
                  return false;
                }
              } catch (error: any) {
                console.error(`❌ Error creando Meet para: ${event.title}`, error);
                return false;
              }
            })
          ).then((results) => {
            // Solo recargar si al menos uno fue exitoso
            if (results.some(r => r === true)) {
              setTimeout(() => {
                getCoachEvents();
              }, 2000); // Aumentado a 2 segundos para evitar loops
            }
          });
        }
      }

    } catch (err: any) {
      console.error("❌ Error in getCoachEvents:", err)
      // Mostrar error al usuario solo si es crítico
      if (err?.message?.includes('fetch') || err?.name === 'TypeError') {
        console.error("❌ Error de red al cargar eventos del calendario")
      }
      // Asegurar que siempre tengamos un array de eventos, incluso si está vacío
      // Esto previene errores de renderizado en producción
      // IMPORTANTE: En producción, el calendario debe funcionar incluso con errores
      setEvents([])
    } finally {
      // Siempre desactivar loading, incluso si hay errores
      // Esto es crítico para que la UI no se quede en estado de carga
      setLoading(false)
      console.log('✅ Loading desactivado en getCoachEvents')
    }
  }, [supabase, googleConnected, cachedEvents])

  // Generar días del mes
  const daysInMonth = useMemo(() => {
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(currentDate)
    return eachDayOfInterval({ start: monthStart, end: monthEnd })
  }, [currentDate])

  const leadingEmptyDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate)
    return monthStart.getDay()
  }, [currentDate])

  // Obtener eventos para una fecha específica
  const getEventsForDate = useCallback((date: Date) => {
    return events.filter(event =>
      isSameDay(new Date(event.start_time), date)
    )
  }, [events])

  // Efectos
  useEffect(() => {
    // Verificar si tenemos eventos en caché para el mes actual
    const cacheKey = `${currentDate.getFullYear()}-${currentDate.getMonth()}`
    const cached = cachedEvents.get(cacheKey)

    if (cached !== undefined) {
      // Usar eventos del cache (incluso si está vacío, significa que ya cargamos)
      setEvents(cached)
      setLoading(false)

      // Cargar eventos en background para meses adyacentes si no están en cache
      const prevMonth = subMonths(currentDate, 1)
      const nextMonth = addMonths(currentDate, 1)
      const prevKey = `${prevMonth.getFullYear()}-${prevMonth.getMonth()}`
      const nextKey = `${nextMonth.getFullYear()}-${nextMonth.getMonth()}`

      if (!cachedEvents.has(prevKey) || !cachedEvents.has(nextKey)) {
        // Cargar en background sin mostrar loading - solo poblar cache
        getCoachEvents().catch(console.error)
      }
    } else {
      // No hay cache, cargar normalmente
      getCoachEvents()
    }
    checkGoogleConnection()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDate]) // Solo recargar cuando cambia el mes

  // Cerrar selectores al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('[data-month-selector]')) {
        setShowMonthSelector(false)
      }
    }

    if (showMonthSelector) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showMonthSelector])

  // Efecto separado para verificar conexión de Google cuando cambia el usuario
  useEffect(() => {
    checkGoogleConnection()
  }, [checkGoogleConnection])

  const goToPreviousMonth = () => setCurrentDate(subMonths(currentDate, 1))
  const goToNextMonth = () => setCurrentDate(addMonths(currentDate, 1))
  const goToPreviousPickerYear = () => setMonthPickerYear((y) => y - 1)
  const goToNextPickerYear = () => setMonthPickerYear((y) => y + 1)

  // Cambiar mes directamente
  const changeMonth = (monthIndex: number) => {
    setCurrentDate(new Date(monthPickerYear, monthIndex, 1))
    setShowMonthSelector(false)
  }

  // Meses en español
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ]

  const currentYear = currentDate.getFullYear()

  // Manejar click en evento
  const handleEventClick = (event: CalendarEvent) => {
    if (event.event_type === 'workshop') {
      setSelectedEvent(event)
      setShowEventModal(true)
      return
    }

    if (event.event_type === 'consultation') {
      openCreateEventModal(event)
    }
  }

  const handleEventUpdate = useCallback(async () => {
    // Recargar eventos después de actualizar
    await getCoachEvents()

    // No actualizar selectedEvent aquí porque el modal se cerrará
    // y selectedEvent se limpiará en handleCloseModal
  }, [getCoachEvents])

  // Manejar cerrar modal
  const handleCloseModal = () => {
    setShowEventModal(false)
    // Limpiar el evento seleccionado para evitar mostrar datos antiguos
    setSelectedEvent(null)
  }

  // Manejar conectar Google
  const handleConnectGoogle = () => {
    checkGoogleConnection()
  }

  // Sincronizar con Google Calendar
  const handleSyncGoogleCalendar = async () => {
    if (!googleConnected) {
      toast.error('Google Calendar no está conectado')
      return
    }

    setSyncing(true)
    try {
      // Crear un AbortController para timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 60000) // 60 segundos timeout

      const response = await fetch('/api/google/calendar/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }))
        throw new Error(errorData.error || `Error ${response.status}`)
      }

      const result = await response.json()

      if (result.success) {
        const errorMsg = result.errors && result.errors.length > 0
          ? ` (${result.errors.length} errores)`
          : ''
        toast.success(`Sincronización completada: ${result.synced || 0} eventos sincronizados${errorMsg}`)
        // Recargar eventos después de sincronizar
        await getCoachEvents()
      } else {
        toast.error(result.error || 'Error al sincronizar con Google Calendar')
      }
    } catch (error: any) {
      console.error('Error sincronizando:', error)
      if (error.name === 'AbortError') {
        toast.error('La sincronización tardó demasiado. Intenta de nuevo con menos eventos.')
      } else {
        toast.error(error.message || 'Error al sincronizar con Google Calendar')
      }
    } finally {
      setSyncing(false)
    }
  }

  useEffect(() => {
    if (!coachId) return

    const loadAvailability = async () => {
      try {
        const { data, error } = await supabase
          .from('coach_availability_rules')
          .select('id, coach_id, weekday, start_time, end_time, scope, year, month, timezone')
          .eq('coach_id', coachId)
          .order('start_time', { ascending: true })

        if (error) {
          console.error('Error loading coach availability:', error)
          return
        }

        const toHHMM = (t: any) => {
          const s = String(t || '')
          if (!s) return ''
          return s.slice(0, 5)
        }

        const rows = Array.isArray(data) ? data : []

        type Group = {
          id: string
          dbIds: string[]
          start: string
          end: string
          scope: 'always' | 'months'
          dbKey: { start: string; end: string; scope: 'always' | 'month'; year?: number | null; month?: number | null }
          days: Set<number>
          months: Set<number>
        }

        const groups = new Map<string, Group>()

        for (const r of rows as any[]) {
          const start = toHHMM(r?.start_time)
          const end = toHHMM(r?.end_time)
          const weekday = Number(r?.weekday)
          const dbScope = String(r?.scope || '').toLowerCase() === 'month' ? 'month' : 'always'
          const year = r?.year == null ? null : Number(r.year)
          const month = r?.month == null ? null : Number(r.month)
          const id = String(r?.id || '')

          if (!id || !start || !end || !Number.isFinite(weekday)) continue

          const key = `${start}|${end}|${dbScope}|${year ?? ''}|${month ?? ''}`
          const existing = groups.get(key)
          if (!existing) {
            const monthIndex = dbScope === 'month' && Number.isFinite(month) ? (month as number) - 1 : null
            groups.set(key, {
              id: key,
              dbIds: [id],
              start,
              end,
              scope: dbScope === 'month' ? 'months' : 'always',
              dbKey: { start, end, scope: dbScope, year, month },
              days: new Set([weekday]),
              months: new Set(monthIndex == null ? [] : [monthIndex]),
            })
          } else {
            existing.dbIds.push(id)
            existing.days.add(weekday)
            if (dbScope === 'month' && Number.isFinite(month)) existing.months.add((month as number) - 1)
          }
        }

        const uiRules = Array.from(groups.values())
          .map((g) => {
            const days = Array.from(g.days.values()).sort((a, b) => a - b)
            const months = Array.from(g.months.values()).sort((a, b) => a - b)
            return {
              id: g.id,
              dbKey: g.dbKey,
              dbIds: g.dbIds,
              start: g.start,
              end: g.end,
              days,
              months: g.scope === 'months' ? months : undefined,
              scope: g.scope,
            }
          })
          .sort((a, b) => (a.start + a.end).localeCompare(b.start + b.end))

        setAvailabilityRules(uiRules)
      } catch (e) {
        console.error('Error loading coach availability:', e)
      }
    }

    loadAvailability()
  }, [coachId, supabase])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#121212]">
        <div className="text-white">Cargando calendario...</div>
      </div>
    )
  }

  if (!coachId) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#121212]">
        <div className="text-white">Por favor inicia sesión para ver tu calendario</div>
      </div>
    )
  }

  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : []

  // Fecha para la vista "hoy" - usar selectedDate si existe y estamos en vista hoy, sino usar hoy
  const viewDate = viewMode === 'today' ? (selectedDate || new Date()) : new Date()
  const todayEvents = getEventsForDate(viewDate)

  // Función para cambiar la vista
  const toggleView = () => {
    if (viewMode === 'month') {
      setViewMode('today')
      if (!selectedDate) {
        setSelectedDate(new Date()) // Seleccionar hoy cuando cambiamos a vista hoy
      }
    } else {
      setViewMode('month')
    }
  }

  // Función para ir a hoy
  const goToToday = () => {
    setCurrentDate(new Date())
    setSelectedDate(new Date())
    if (viewMode === 'month') {
      setViewMode('today')
    }
  }

  // Funciones para navegar días en vista "hoy"
  const goToPreviousDay = () => {
    const newDate = subDays(viewDate, 1)
    setSelectedDate(newDate)
  }

  const goToNextDay = () => {
    const newDate = addDays(viewDate, 1)
    setSelectedDate(newDate)
  }

  // Generar horas del día (00:00 a 23:00)
  const hoursOfDay = Array.from({ length: 24 }, (_, i) => i)

  // Obtener eventos para una hora específica del día seleccionado
  const getEventsForHour = (hour: number) => {
    const dateToCheck = new Date(viewDate)
    dateToCheck.setHours(0, 0, 0, 0)
    return todayEvents.filter(event => {
      const eventDate = new Date(event.start_time)
      return eventDate.getHours() === hour && isSameDay(eventDate, viewDate)
    })
  }

  const weekdayShort = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
  const weekdayLong = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
  const monthLong = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
  const monthTitle = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

  const formatDaysShort = (days: number[]) => {
    if (days.length === 7) return 'Todos los días'
    return days
      .slice()
      .sort((a, b) => a - b)
      .map((d) => weekdayShort[d] || '')
      .filter(Boolean)
      .join(', ')
  }

  const formatDaysLong = (days: number[]) => {
    if (days.length === 7) return 'todos los días'
    return days
      .slice()
      .sort((a, b) => a - b)
      .map((d) => weekdayLong[d] || '')
      .filter(Boolean)
      .join(', ')
  }

  const formatMonthsTitle = (months?: number[]) => {
    const safe = Array.isArray(months) ? months : []
    if (safe.length === 0) return ''
    return safe
      .slice()
      .sort((a, b) => a - b)
      .map((m) => monthTitle[m] || '')
      .filter(Boolean)
      .join(', ')
  }

  const formatMonthsLong = (months?: number[]) => {
    const safe = Array.isArray(months) ? months : []
    if (safe.length === 0) return ''
    return safe
      .slice()
      .sort((a, b) => a - b)
      .map((m) => monthLong[m] || '')
      .filter(Boolean)
      .join(' y ')
  }

  const isAllDays = (days: number[]) => Array.isArray(days) && new Set(days).size === 7
  const isAllMonths = (months: number[]) => Array.isArray(months) && new Set(months).size === 12
  const getTimezone = () => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
    } catch {
      return 'UTC'
    }
  }

  const ensureDraftsFromRules = () => {
    setAvailabilityDrafts((prev) => {
      const next = { ...prev }
      for (const r of availabilityRules) {
        if (next[r.id]) continue
        next[r.id] = {
          start: r.start,
          end: r.end,
          days: Array.isArray(r.days) ? r.days.slice() : [],
          months:
            r.scope === 'always'
              ? Array.from({ length: 12 }, (_, i) => i)
              : Array.isArray(r.months)
                ? r.months.slice()
                : [],
        }
      }
      return next
    })
  }

  const setDraft = (ruleId: string, patch: Partial<{ start: string; end: string; days: number[]; months: number[] }>) => {
    setAvailabilityDrafts((prev) => ({
      ...prev,
      [ruleId]: {
        start: patch.start ?? prev[ruleId]?.start ?? '09:00',
        end: patch.end ?? prev[ruleId]?.end ?? '18:00',
        days: patch.days ?? prev[ruleId]?.days ?? [0, 1, 2, 3, 4, 5, 6],
        months: patch.months ?? prev[ruleId]?.months ?? Array.from({ length: 12 }, (_, i) => i),
      },
    }))
  }

  const saveAllAvailabilityDrafts = async () => {
    if (!coachId) return
    if (availabilitySaving) return

    setAvailabilitySaving(true)
    try {
      const tz = getTimezone()
      const year = currentYear
      const all: Array<{ oldDbIds: string[]; inserts: any[]; ruleId: string }> = []

      for (const r of availabilityRules) {
        const d = availabilityDrafts[r.id]
        if (!d) continue

        const start = String(d.start || '').slice(0, 5)
        const end = String(d.end || '').slice(0, 5)
        const days = Array.isArray(d.days) ? Array.from(new Set(d.days)).sort((a, b) => a - b) : []
        const months = Array.isArray(d.months) ? Array.from(new Set(d.months)).sort((a, b) => a - b) : []

        if (!start || !end || days.length === 0) continue

        const always = isAllDays(days) && isAllMonths(months)
        const inserts: any[] = []

        if (always) {
          for (const wd of days) {
            inserts.push({
              coach_id: coachId,
              weekday: wd,
              start_time: `${start}:00`,
              end_time: `${end}:00`,
              scope: 'always',
              year: null,
              month: null,
              timezone: tz,
            })
          }
        } else {
          for (const m of months) {
            for (const wd of days) {
              inserts.push({
                coach_id: coachId,
                weekday: wd,
                start_time: `${start}:00`,
                end_time: `${end}:00`,
                scope: 'month',
                year,
                month: m + 1,
                timezone: tz,
              })
            }
          }
        }

        all.push({ oldDbIds: Array.isArray(r.dbIds) ? r.dbIds : [], inserts, ruleId: r.id })
      }

      // Delete + insert per rule (to keep it simple and consistent)
      for (const item of all) {
        if (item.oldDbIds.length > 0) {
          const { error: delErr } = await supabase
            .from('coach_availability_rules')
            .delete()
            .in('id', item.oldDbIds as any)

          if (delErr) {
            console.error('Error deleting old availability rows:', delErr)
            toast.error(delErr.message || 'No se pudo guardar la disponibilidad')
            return
          }
        }

        if (item.inserts.length > 0) {
          const { error: insErr } = await supabase
            .from('coach_availability_rules')
            .insert(item.inserts as any)

          if (insErr) {
            console.error('Error inserting availability rows:', insErr)
            toast.error(insErr.message || 'No se pudo guardar la disponibilidad')
            return
          }
        }
      }

      toast.success('Disponibilidad guardada')
    } finally {
      setAvailabilitySaving(false)
    }
  }

  const deleteAvailabilityRule = async (id: string) => {
    const rule = availabilityRules.find((r) => r.id === id)
    if (!rule?.dbIds || rule.dbIds.length === 0) {
      setAvailabilityRules((prev) => prev.filter((r) => r.id !== id))
      return
    }

    try {
      const { error } = await supabase
        .from('coach_availability_rules')
        .delete()
        .in('id', rule.dbIds as any)

      if (error) {
        console.error('Error deleting availability rule:', error)
        toast.error(error.message || 'No se pudo eliminar la regla')
        return
      }

      setAvailabilityRules((prev) => prev.filter((r) => r.id !== id))
    } catch (e) {
      console.error('Error deleting availability rule:', e)
      toast.error('No se pudo eliminar la regla')
    }
  }

  return (
    <div className="h-screen bg-[#121212] overflow-y-auto pb-20">
      <div className="p-4">
        {/* Acciones arriba */}
        <div className="mb-3 relative flex items-center justify-between">
          {calendarMode === 'availability' ? (
            <div className="flex items-center justify-end w-full">
              <button
                type="button"
                onClick={() => {
                  setCalendarMode('events')
                  setShowAddMenu(false)
                  setAvailabilitySelectingDays(false)
                  setAvailabilityShowExtraLine(false)
                }}
                className={
                  `w-8 h-8 rounded-full border flex items-center justify-center ` +
                  `backdrop-blur-md bg-white/10 border-white/20 shadow-[0_8px_24px_rgba(0,0,0,0.35)] ` +
                  `hover:bg-white/15 transition-colors`
                }
                title="Cerrar"
                aria-label="Cerrar"
              >
                <Minus className="h-4 w-4 text-[#FF7939]" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between w-full">
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
                    (showAddMenu ? 'opacity-100 translate-x-0 max-w-[320px]' : 'opacity-0 translate-x-2 max-w-0 pointer-events-none')
                  }
                >
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddMenu(false)
                      setCalendarMode('availability')
                      setViewMode('month')
                    }}
                    className={
                      `px-4 py-1.5 rounded-full border text-sm ` +
                      `backdrop-blur-md bg-white/10 border-white/20 shadow-[0_8px_24px_rgba(0,0,0,0.35)] ` +
                      `text-[#FF7939] hover:bg-white/15 transition-colors whitespace-nowrap`
                    }
                  >
                    Disponibilidad
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      setShowAddMenu(false)
                      setCalendarMode('events')
                      if (clientsForMeet.length === 0) await ensureClientsLoaded()
                      await openCreateEventModal()
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
                  onClick={() => setShowAddMenu((v) => !v)}
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
          )}
        </div>

        <MeetNotificationsModal
          open={showMeetNotifications}
          onClose={() => setShowMeetNotifications(false)}
          role="coach"
          supabase={supabase}
          userId={coachId || ''}
          coachId={coachId || ''}
          onOpenMeet={(eventId) => openMeetById(eventId)}
        />

        {/* Vista Mes */}
        {viewMode === 'month' && (
          <>
            {calendarMode === 'availability' && (
              <div className="mb-4 relative z-[200]">
                <div className="text-[12px] text-gray-400 mb-2">
                  Los clientes sabrán cuándo estás disponible para invitarte a una meet
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                  <div className="text-white font-semibold">Disponibilidad</div>
                  <div className="flex flex-wrap items-center gap-2 justify-start sm:justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        if (!availabilityIsEditingRules) {
                          ensureDraftsFromRules()
                          setAvailabilityIsEditingRules(true)
                        }
                        const newId = `new-${Date.now()}`
                        setAvailabilityRules((prev) => [
                          ...prev,
                          {
                            id: newId,
                            dbIds: [],
                            start: '09:00',
                            end: '18:00',
                            days: [0, 1, 2, 3, 4, 5, 6],
                            months: undefined,
                            scope: 'always',
                          },
                        ])
                        setDraft(newId, {
                          start: '09:00',
                          end: '18:00',
                          days: [0, 1, 2, 3, 4, 5, 6],
                          months: Array.from({ length: 12 }, (_, i) => i),
                        })
                        setAvailabilityOpenDaysForRuleId(newId)
                        setAvailabilityOpenMonthsForRuleId(null)
                      }}
                      className={
                        `flex items-center justify-center gap-1.5 px-3 py-1 rounded-full border text-[11px] ` +
                        `backdrop-blur-md bg-white/10 border-[#FF7939]/30 shadow-[0_8px_24px_rgba(0,0,0,0.35)] ` +
                        `text-[#FF7939] hover:bg-white/15 transition-colors whitespace-nowrap`
                      }
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Agregar horario
                    </button>

                    <button
                      type="button"
                      onClick={async () => {
                        if (availabilityIsEditingRules) {
                          await saveAllAvailabilityDrafts()
                          setAvailabilityIsEditingRules(false)
                          setAvailabilityOpenDaysForRuleId(null)
                          setAvailabilityOpenMonthsForRuleId(null)
                          setAvailabilityOpenTimeForRuleId(null)
                        } else {
                          ensureDraftsFromRules()
                          setAvailabilityIsEditingRules(true)
                        }
                      }}
                      className={
                        `px-3 py-1 rounded-full border text-[11px] transition-colors ` +
                        `backdrop-blur-md bg-white/10 shadow-[0_8px_24px_rgba(0,0,0,0.35)] ` +
                        (availabilityIsEditingRules
                          ? 'border-white/20 text-white hover:bg-white/15'
                          : 'border-[#FF7939]/30 text-[#FF7939] hover:bg-white/15') +
                        ` whitespace-nowrap`
                      }
                    >
                      {availabilityIsEditingRules ? (availabilitySaving ? 'Guardando…' : 'Listo') : 'Editar'}
                    </button>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md shadow-[0_8px_24px_rgba(0,0,0,0.35)] overflow-visible">
                  {availabilityRules.map((rule, idx) => {
                    const daysShort = formatDaysShort(rule.days)
                    const monthsShort = rule.scope === 'always' ? 'Siempre' : formatMonthsTitle(rule.months)
                    const daysLong = formatDaysLong(rule.days)
                    const monthsLong = rule.scope === 'always' ? '' : formatMonthsLong(rule.months)

                    const nonEditText =
                      rule.scope === 'always'
                        ? `Disponible de ${rule.start} a ${rule.end} ${daysLong}`
                        : `Disponible de ${rule.start} a ${rule.end} ${daysLong} en ${monthsLong}`

                    const editText =
                      rule.scope === 'always'
                        ? `${rule.start} – ${rule.end} · ${daysShort} · Siempre`
                        : `${rule.start} – ${rule.end} · ${daysShort} · ${monthsShort}`

                    const draft = availabilityDrafts[rule.id]
                    const draftDays = draft?.days ?? rule.days
                    const draftMonths = draft?.months ?? (rule.scope === 'always' ? Array.from({ length: 12 }, (_, i) => i) : (rule.months ?? []))
                    const isAlwaysDraft = isAllDays(draftDays) && isAllMonths(draftMonths)

                    return (
                      <div
                        key={rule.id}
                        className={
                          `flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 ` +
                          (idx !== availabilityRules.length - 1 ? 'border-b border-white/10' : '')
                        }
                      >
                        <div className="flex items-start sm:items-center gap-3 min-w-0 w-full">
                          <div className="w-6 h-6 rounded-full border border-[#FF7939]/40 bg-[#FF7939]/10 flex items-center justify-center flex-shrink-0">
                            <Clock className="h-3.5 w-3.5 text-[#FFB366]" />
                          </div>
                          {availabilityIsEditingRules ? (
                            <div className="flex flex-wrap items-center gap-2 min-w-0 w-full">
                              <div className="relative flex-shrink-0">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setAvailabilityOpenDaysForRuleId(null)
                                    setAvailabilityOpenMonthsForRuleId(null)
                                    setAvailabilityOpenTimeForRuleId((v) => (v === rule.id ? null : rule.id))
                                  }}
                                  className="inline-flex items-center px-1.5 py-0.5 rounded-xl border backdrop-blur-md bg-white/10 border-white/20 shadow-[0_8px_24px_rgba(0,0,0,0.35)] text-white text-[10px] leading-none tabular-nums tracking-tight whitespace-nowrap hover:bg-white/15 transition-colors"
                                >
                                  {`${(draft?.start ?? rule.start) || '00:00'} - ${(draft?.end ?? rule.end) || '00:00'}`}
                                </button>

                                {availabilityOpenTimeForRuleId === rule.id && (
                                  <div className="absolute z-[9999] mt-2 w-44 rounded-xl border border-white/10 bg-zinc-950/95 backdrop-blur-md shadow-[0_12px_40px_rgba(0,0,0,0.6)] p-2">
                                    <div className="flex items-center justify-between gap-2">
                                      <input
                                        type="time"
                                        value={draft?.start ?? rule.start}
                                        onChange={(e) => setDraft(rule.id, { start: e.target.value })}
                                        className="h-8 w-full bg-black/40 border border-white/10 rounded-lg px-2 text-[12px] text-white focus:outline-none focus:border-[#FF7939] appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:opacity-0"
                                        aria-label="Hora inicio"
                                      />
                                      <input
                                        type="time"
                                        value={draft?.end ?? rule.end}
                                        onChange={(e) => setDraft(rule.id, { end: e.target.value })}
                                        className="h-8 w-full bg-black/40 border border-white/10 rounded-lg px-2 text-[12px] text-white focus:outline-none focus:border-[#FF7939] appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:opacity-0"
                                        aria-label="Hora fin"
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>

                              <div className="relative">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setAvailabilityOpenMonthsForRuleId(null)
                                    setAvailabilityOpenDaysForRuleId((v) => (v === rule.id ? null : rule.id))
                                  }}
                                  className="px-2 py-1 rounded-xl border backdrop-blur-md bg-white/10 border-white/20 shadow-[0_8px_24px_rgba(0,0,0,0.35)] text-[11px] text-white hover:bg-white/15 transition-colors whitespace-nowrap max-w-[220px] truncate"
                                >
                                  {isAllDays(draftDays) ? 'Todos los días' : formatDaysShort(draftDays)}
                                </button>

                                {availabilityOpenDaysForRuleId === rule.id && (
                                  <div className="absolute z-[9999] mt-2 w-44 rounded-xl border border-white/10 bg-zinc-950/95 backdrop-blur-md shadow-[0_12px_40px_rgba(0,0,0,0.6)] p-2">
                                    <label className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-[12px] text-white hover:bg-white/10 cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={isAllDays(draftDays)}
                                        onChange={() => setDraft(rule.id, { days: [0, 1, 2, 3, 4, 5, 6] })}
                                        className="accent-[#FF7939]"
                                      />
                                      Todos
                                    </label>

                                    {weekdayShort.map((lbl, d) => {
                                      const selected = draftDays.includes(d)
                                      return (
                                        <label
                                          key={lbl}
                                          className={
                                            `flex items-center gap-2 px-2 py-1.5 rounded-lg text-[12px] hover:bg-white/10 cursor-pointer ` +
                                            (selected ? 'text-[#FFB366]' : 'text-white')
                                          }
                                        >
                                          <input
                                            type="checkbox"
                                            checked={selected}
                                            onChange={() => {
                                              // Si estaba en "Todos los días", al tocar un día lo desmarcamos (todos menos ese).
                                              if (isAllDays(draftDays)) {
                                                const next = [0, 1, 2, 3, 4, 5, 6].filter((x) => x !== d)
                                                setDraft(rule.id, { days: next.length === 0 ? [d] : next })
                                                return
                                              }

                                              const next = selected ? draftDays.filter((x) => x !== d) : [...draftDays, d]
                                              // Evitar selección vacía
                                              setDraft(rule.id, { days: next.length === 0 ? [d] : next })
                                            }}
                                            className="accent-[#FF7939]"
                                          />
                                          {lbl}
                                        </label>
                                      )
                                    })}
                                  </div>
                                )}
                              </div>

                              <div className="relative">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setAvailabilityOpenDaysForRuleId(null)
                                    setAvailabilityOpenMonthsForRuleId((v) => (v === rule.id ? null : rule.id))
                                  }}
                                  className={
                                    `px-2 py-1 rounded-xl border backdrop-blur-md shadow-[0_8px_24px_rgba(0,0,0,0.35)] text-[11px] transition-colors whitespace-nowrap max-w-[220px] truncate ` +
                                    'bg-white/10 border-white/20 text-white hover:bg-white/15'
                                  }
                                >
                                  {isAllMonths(draftMonths) ? 'Todos los meses' : formatMonthsTitle(draftMonths)}
                                </button>

                                {availabilityOpenMonthsForRuleId === rule.id && (
                                  <div className="absolute z-[9999] mt-2 w-44 rounded-xl border border-white/10 bg-zinc-950/95 backdrop-blur-md shadow-[0_12px_40px_rgba(0,0,0,0.6)] p-2 max-h-64 overflow-auto">
                                    <label className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-[12px] text-white hover:bg-white/10 cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={isAllMonths(draftMonths)}
                                        onChange={() => setDraft(rule.id, { months: Array.from({ length: 12 }, (_, i) => i) })}
                                        className="accent-[#FF7939]"
                                      />
                                      Todos
                                    </label>

                                    {monthTitle.map((lbl, m) => {
                                      const selected = draftMonths.includes(m)
                                      return (
                                        <label
                                          key={lbl}
                                          className={
                                            `flex items-center gap-2 px-2 py-1.5 rounded-lg text-[12px] hover:bg-white/10 cursor-pointer ` +
                                            (selected ? 'text-[#FFB366]' : 'text-white')
                                          }
                                        >
                                          <input
                                            type="checkbox"
                                            checked={selected}
                                            onChange={() => {
                                              // Si estaba en "Todos los meses", al tocar uno lo desmarcamos (todos menos ese).
                                              if (isAllMonths(draftMonths)) {
                                                const next = Array.from({ length: 12 }, (_, i) => i).filter((x) => x !== m)
                                                setDraft(rule.id, { months: next.length === 0 ? [m] : next })
                                                return
                                              }

                                              const next = selected ? draftMonths.filter((x) => x !== m) : [...draftMonths, m]
                                              // Evitar selección vacía
                                              setDraft(rule.id, { months: next.length === 0 ? [m] : next })
                                            }}
                                            className="accent-[#FF7939]"
                                          />
                                          {lbl}
                                        </label>
                                      )
                                    })}
                                  </div>
                                )}
                              </div>

                              <button
                                type="button"
                                onClick={() => {
                                  // Siempre = todos los días + todos los meses
                                  setDraft(rule.id, {
                                    days: [0, 1, 2, 3, 4, 5, 6],
                                    months: Array.from({ length: 12 }, (_, i) => i),
                                  })
                                }}
                                className={
                                  `px-2 py-1 rounded-xl border backdrop-blur-md shadow-[0_8px_24px_rgba(0,0,0,0.35)] text-[11px] transition-colors whitespace-nowrap ` +
                                  (isAlwaysDraft
                                    ? 'bg-[#FF7939]/20 border-[#FF7939]/50 text-[#FF7939]'
                                    : 'bg-white/10 border-white/20 text-white hover:bg-white/15')
                                }
                              >
                                Siempre
                              </button>
                            </div>
                          ) : (
                            <div className="text-[15px] text-gray-200 w-full sm:w-auto break-words">
                              {nonEditText}
                            </div>
                          )}
                        </div>

                        {availabilityIsEditingRules && (
                          <button
                            type="button"
                            onClick={() => deleteAvailabilityRule(rule.id)}
                            className={
                              `w-9 h-9 rounded-full border flex items-center justify-center flex-shrink-0 ` +
                              `border-[#FF7939]/40 bg-[#FF7939]/10 text-[#FFB366] ` +
                              `hover:bg-[#FF7939]/20 transition-colors`
                            }
                            aria-label="Eliminar"
                            title="Eliminar"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Calendario */}
            <Card className="bg-zinc-900 border-zinc-800 mb-6">
              <CardHeader className="px-4 pt-4 pb-2">
                <div className="flex items-center justify-between relative">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={showMonthSelector ? goToPreviousPickerYear : goToPreviousMonth}
                    className="text-white hover:bg-zinc-800"
                    title={showMonthSelector ? 'Año anterior' : 'Mes anterior'}
                  >
                    ←
                  </Button>

                  <button
                    type="button"
                    onClick={() => {
                      setMonthPickerYear(currentYear)
                      setShowMonthSelector((v) => !v)
                    }}
                    className="text-white font-semibold text-lg flex items-center gap-2 hover:text-[#FFB366] transition-colors"
                    title="Cambiar mes"
                  >
                    {monthNames[currentDate.getMonth()]} {currentYear}
                    <ChevronDown className="h-4 w-4" />
                  </button>

                  {showMonthSelector && (
                    <div
                      data-month-selector
                      className="absolute top-11 left-1/2 -translate-x-1/2 z-50 w-[320px] rounded-2xl border border-white/10 bg-zinc-950/95 backdrop-blur-md shadow-[0_12px_40px_rgba(0,0,0,0.6)] p-3"
                    >
                      <div className="grid grid-cols-[1fr_96px] gap-3">
                        {/* Meses */}
                        <div className="grid grid-cols-1 gap-1 max-h-[260px] overflow-auto pr-1">
                          {monthNames.map((m, idx) => {
                            const active = idx === currentDate.getMonth() && monthPickerYear === currentYear
                            return (
                              <button
                                key={m}
                                type="button"
                                onClick={() => changeMonth(idx)}
                                className={
                                  `px-3 py-2 rounded-xl text-left text-sm transition-colors ` +
                                  (active
                                    ? 'bg-[#FF7939]/20 text-[#FFB366] border border-[#FF7939]/40'
                                    : 'text-white hover:bg-white/10')
                                }
                              >
                                {m}
                              </button>
                            )
                          })}
                        </div>

                        {/* Año */}
                        <div className="flex flex-col items-center justify-between">
                          <button
                            type="button"
                            onClick={goToNextPickerYear}
                            className="w-full h-10 rounded-xl border border-white/10 bg-white/5 text-white hover:bg-white/10 transition-colors"
                            aria-label="Año siguiente"
                          >
                            +
                          </button>

                          <div className="w-full text-center py-3 rounded-xl border border-white/10 bg-white/5 text-[#FFB366] font-semibold">
                            {monthPickerYear}
                          </div>

                          <button
                            type="button"
                            onClick={goToPreviousPickerYear}
                            className="w-full h-10 rounded-xl border border-white/10 bg-white/5 text-white hover:bg-white/10 transition-colors"
                            aria-label="Año anterior"
                          >
                            −
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={showMonthSelector ? goToNextPickerYear : goToNextMonth}
                    className="text-white hover:bg-zinc-800"
                    title={showMonthSelector ? 'Año siguiente' : 'Mes siguiente'}
                  >
                    →
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="px-4 pb-4">
                <div className="grid grid-cols-7 gap-2 text-center text-xs text-gray-400 mb-2">
                  {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((day, idx) => (
                    <div key={day} className="flex flex-col items-center gap-1">
                      {calendarMode === 'availability' && availabilitySelectingDays ? (
                        <button
                          type="button"
                          onClick={() =>
                            setAvailabilityWeekdays((prev) => {
                              const next = [...prev]
                              next[idx] = !next[idx]
                              return next
                            })
                          }
                          className={
                            `w-5 h-5 rounded-full border backdrop-blur-md ` +
                            (availabilityWeekdays[idx]
                              ? 'bg-[#FF7939]/25 border-[#FF7939]'
                              : 'bg-white/10 border-white/20 hover:bg-white/15')
                          }
                          aria-label={`Toggle ${day}`}
                          title={day}
                        />
                      ) : (
                        <div className="h-5" />
                      )}
                      <div>{day}</div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1 sm:gap-2">
                  {Array.from({ length: leadingEmptyDays }).map((_, idx) => (
                    <div key={`empty-${idx}`} className="aspect-square p-2" />
                  ))}
                  {daysInMonth.map((day) => {
                    const dayEvents = getEventsForDate(day)
                    const hasEvents = dayEvents.length > 0
                    const isSelected = selectedDate && isSameDay(day, selectedDate)
                    const isTodayDate = isToday(day)

                    return (
                      <button
                        key={day.toISOString()}
                        type="button"
                        onClick={() => setSelectedDate(day)}
                        className={
                          `aspect-square p-1.5 sm:p-2 rounded-lg text-sm font-medium transition-colors flex flex-col items-start justify-start ` +
                          `${isSelected ? 'backdrop-blur-md bg-white/10 border border-[#FF7939]/40 shadow-[0_8px_24px_rgba(0,0,0,0.35)] text-white' : ''} ` +
                          `${isTodayDate && !isSelected ? 'bg-zinc-800 text-white' : ''} ` +
                          `${!isSelected && !isTodayDate ? 'text-gray-400 hover:bg-zinc-800' : ''}`
                        }
                      >
                        <div className="w-full text-center">{format(day, 'd')}</div>

                        {hasEvents && (
                          <>
                            {/* Mobile: mostrar solo cantidad */}
                            <div className="sm:hidden mt-1 flex items-center justify-center w-full">
                              <div
                                className={
                                  `w-6 h-6 rounded-full border flex items-center justify-center ` +
                                  `backdrop-blur-md bg-[#FF7939]/10 border-[#FF7939]/40 shadow-[0_8px_24px_rgba(0,0,0,0.35)]`
                                }
                              >
                                <span className={`text-[11px] font-bold leading-none ${isSelected ? 'text-white' : 'text-[#FFB366]'}`}>
                                  {dayEvents.length}
                                </span>
                              </div>
                            </div>

                            {/* Desktop/tablet: mostrar títulos */}
                            <div className="hidden sm:block mt-1 w-full space-y-1">
                              {dayEvents.slice(0, 2).map((ev: any) => (
                                <div
                                  key={ev.id}
                                  className={
                                    `w-full px-1.5 py-1 rounded-full border text-[10px] leading-none truncate ` +
                                    `backdrop-blur-md shadow-[0_8px_24px_rgba(0,0,0,0.35)] ` +
                                    (ev?.event_type === 'workshop'
                                      ? 'border-[#FF7939]/50 bg-[#FF7939]/50 text-zinc-950'
                                      : 'border-[#FF7939]/40 bg-[#FF7939]/10 text-[#FFB366]')
                                  }
                                  title={ev.title}
                                >
                                  {ev.title}
                                </div>
                              ))}
                              {dayEvents.length > 2 && (
                                <div
                                  className={
                                    `w-full px-1.5 py-1 rounded-full border text-[10px] leading-none text-center ` +
                                    `backdrop-blur-md shadow-[0_8px_24px_rgba(0,0,0,0.35)] ` +
                                    `border-[#FF7939]/40 bg-transparent text-[#FFB366]`
                                  }
                                >
                                  + {dayEvents.length - 2} más
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </button>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Resumen de eventos - Minimalista */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-3 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-[#FF7939]" />
                  <span className="text-sm font-medium text-white">Resumen del Mes</span>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <span className="text-[#FFB366] font-medium">
                        {events.filter(e => e.is_google_event || e.source === 'google_calendar').length}
                      </span>
                      <span className="text-gray-400">Calendar</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-[#FF7939] font-medium">
                        {events.filter(e => !e.is_google_event && e.source !== 'google_calendar').length}
                      </span>
                      <span className="text-gray-400">Omnia</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Eventos del día seleccionado */}
            {selectedDate && (
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-white text-lg">
                    {format(selectedDate, "d 'de' MMMM", { locale: es })}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedDateEvents.length === 0 ? (
                    <p className="text-gray-400 text-sm text-center py-4">
                      No hay eventos programados para este día
                    </p>
                  ) : (
                    <div className="space-y-1">
                      {selectedDateEvents.map(event => {
                        const isGoogleEvent = event.is_google_event || event.source === 'google_calendar'
                        const isWorkshop = event.event_type === 'workshop'
                        const isConsultation = event.event_type === 'consultation'
                        return (
                          <div
                            key={event.id}
                            onClick={() => handleEventClick(event)}
                            className={`p-2 rounded-lg border transition-colors cursor-pointer hover:bg-zinc-800/80 ${isGoogleEvent
                              ? 'bg-blue-950/30 border-blue-700/50 hover:border-blue-600/70'
                              : isWorkshop
                                ? 'bg-[#FF7939]/10 border-[#FF7939]/40 hover:bg-[#FF7939]/15'
                                : 'bg-zinc-800/60 border-zinc-700/30 hover:border-[#FF7939]/40'
                              }`}
                          >
                            {/* Diseño mejorado y más limpio */}
                            <div className="space-y-3">
                              {/* Header: Producto y título */}
                              <div className="space-y-1">
                                {isGoogleEvent && (
                                  <div className="flex items-center gap-1 mb-1">
                                    <Calendar className="h-3 w-3 text-blue-400" />
                                    <div className="text-xs text-blue-400 font-medium">Google Calendar</div>
                                  </div>
                                )}
                                {event.product_name && !isGoogleEvent && (
                                  <div className="text-xs text-[#FF7939] font-medium uppercase tracking-wide">
                                    {event.product_name}
                                  </div>
                                )}
                                <h3 className="font-semibold text-white text-sm leading-tight">
                                  {event.title}
                                </h3>
                                {event.location && isGoogleEvent && (
                                  <div className="text-xs text-gray-400">{event.location}</div>
                                )}
                              </div>

                              {/* Info bar: Compacta y organizada */}
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 text-xs">
                                  {/* Horario */}
                                  <div className="flex items-center gap-1 text-gray-300">
                                    <Clock className="h-3 w-3" />
                                    <span className="font-mono">
                                      {format(new Date(event.start_time), 'HH:mm')}-{format(new Date(event.end_time), 'HH:mm')}
                                    </span>
                                  </div>

                                  {/* Participantes - Solo para eventos de Omnia */}
                                  {!isGoogleEvent && (
                                    <div className="flex items-center gap-1 text-gray-300">
                                      <Users className="h-3 w-3" />
                                      <span className="font-medium">
                                        {(event.event_type === 'consultation' ? 1 : (event.current_participants || 0))}/{(event.event_type === 'consultation' ? 1 : (event.max_participants || 'N/A'))}
                                      </span>
                                    </div>
                                  )}

                                  {/* Tipo - Solo para eventos de Omnia */}
                                  {!isGoogleEvent && (
                                    <div
                                      className={
                                        `px-2 py-0.5 rounded-full text-xs font-medium border ` +
                                        (isWorkshop
                                          ? 'bg-[#FF7939]/50 text-zinc-950 border-[#FF7939]/50'
                                          : isConsultation
                                            ? 'bg-[#FF7939]/10 text-[#FFB366] border-[#FF7939]/40'
                                            : 'bg-zinc-700 text-gray-300 border-zinc-600')
                                      }
                                    >
                                      {isWorkshop ? 'Taller' : isConsultation ? 'Meet' : event.event_type === 'other' ? 'Doc' : event.event_type}
                                    </div>
                                  )}

                                  {/* Badge para eventos de Google */}
                                  {isGoogleEvent && (
                                    <div className="px-2 py-0.5 rounded-full bg-blue-900/50 text-blue-300 text-xs font-medium">
                                      Google
                                    </div>
                                  )}
                                </div>

                                {/* Meet Link - Solo mostrar si es un link válido de Google Meet */}
                                {event.meet_link &&
                                  event.meet_link.includes('meet.google.com/') &&
                                  !event.meet_link.includes('test-') &&
                                  !event.meet_link.includes('xxx-') && (
                                    <Button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        window.open(event.meet_link, '_blank')
                                      }}
                                      size="sm"
                                      variant="ghost"
                                      className="h-7 px-2 gap-1.5 hover:bg-[#FF7939]/20 rounded-lg transition-colors text-[#FF7939]"
                                      title="Abrir Google Meet"
                                    >
                                      <Video className="h-3.5 w-3.5" />
                                      <span className="text-xs font-medium">Meet</span>
                                    </Button>
                                  )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}


          </>
        )}

        {/* Vista Hoy - Detalle de franja horaria */}
        {viewMode === 'today' && (
          <div className="space-y-4">
            {/* Header de hoy - Con navegación */}
            <div className="mb-6 flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={goToPreviousDay}
                className="text-white hover:bg-zinc-800"
              >
                ←
              </Button>
              <h2 className="text-lg font-semibold text-[#FFB366] capitalize">
                {format(viewDate, "EEEE, d 'de' MMMM", { locale: es })}
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={goToNextDay}
                className="text-white hover:bg-zinc-800"
              >
                →
              </Button>
            </div>

            {/* Calendario de horas */}
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="p-0">
                {todayEvents.length === 0 ? (
                  // Vista colapsada: solo mostrar horarios clave si no hay eventos
                  <div className="divide-y divide-zinc-800">
                    {[6, 12, 18, 24].map(hour => {
                      const displayHour = hour === 24 ? 0 : hour
                      const hourStart = new Date(viewDate)
                      hourStart.setHours(displayHour, 0, 0, 0)
                      const now = new Date()
                      const isPast = hourStart < now && !isSameDay(hourStart, now) || (isSameDay(hourStart, now) && hourStart < now)
                      const isCurrentHour = isSameDay(hourStart, now) && now.getHours() === displayHour

                      return (
                        <div
                          key={hour}
                          className={`
                            min-h-[60px] p-3 flex gap-4 items-center
                            ${isPast ? 'opacity-50' : ''}
                            ${isCurrentHour ? 'bg-zinc-800/30' : ''}
                          `}
                        >
                          {/* Hora */}
                          <div className="w-16 flex-shrink-0">
                            <div className="text-sm font-medium text-gray-400">
                              {format(hourStart, 'HH:mm')}
                            </div>
                          </div>

                          {/* Sin eventos */}
                          <div className="flex-1">
                            <div className="text-xs text-gray-600">Sin eventos</div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  // Vista completa: mostrar horarios clave (6am, 12pm, 6pm, 12am) más horarios de eventos
                  <div className="divide-y divide-zinc-800">
                    {(() => {
                      // Obtener horarios únicos de los eventos
                      const eventHours = new Set<number>()
                      todayEvents.forEach(event => {
                        const eventDate = new Date(event.start_time)
                        if (isSameDay(eventDate, viewDate)) {
                          eventHours.add(eventDate.getHours())
                        }
                      })

                      // Horarios clave: 6am, 12pm, 6pm, 12am (0)
                      const keyHours = [6, 12, 18, 0]

                      // Combinar horarios clave con horarios de eventos, eliminar duplicados
                      const allHoursSet = new Set([...keyHours, ...eventHours])

                      // Separar horarios antes y después de medianoche
                      const hoursBeforeMidnight = Array.from(allHoursSet).filter(h => h !== 0).sort((a, b) => a - b)
                      const midnight = allHoursSet.has(0) ? [0] : []

                      // Ordenar: todos los horarios antes de medianoche, luego 00:00 al final
                      const allHoursOrdered = [...hoursBeforeMidnight, ...midnight]

                      return allHoursOrdered.map(hour => {
                        const hourEvents = getEventsForHour(hour)
                        const hourStart = new Date(viewDate)
                        hourStart.setHours(hour, 0, 0, 0)
                        const hourEnd = new Date(viewDate)
                        hourEnd.setHours(hour, 59, 59, 999)
                        const now = new Date()
                        const isPast = hourEnd < now && !isSameDay(hourEnd, now) || (isSameDay(hourEnd, now) && hourEnd < now)
                        const isCurrentHour = isSameDay(viewDate, now) && now.getHours() === hour
                        const isKeyHour = keyHours.includes(hour)

                        return (
                          <div
                            key={hour}
                            className={`
                            min-h-[80px] p-3 flex gap-4
                            ${isPast ? 'opacity-50' : ''}
                            ${isCurrentHour ? 'bg-zinc-800/30' : ''}
                          `}
                          >
                            {/* Hora */}
                            <div className="w-16 flex-shrink-0">
                              <div className={`text-sm font-medium ${isKeyHour ? 'text-gray-300' : 'text-gray-400'}`}>
                                {format(hourStart, 'HH:mm')}
                              </div>
                            </div>

                            {/* Eventos de esta hora */}
                            <div className="flex-1 space-y-2">
                              {hourEvents.length === 0 ? (
                                <div className="text-xs text-gray-600">Sin eventos</div>
                              ) : (
                                hourEvents.map(event => {
                                  const isGoogleEvent = event.is_google_event || event.source === 'google_calendar'
                                  return (
                                    <div
                                      key={event.id}
                                      onClick={() => handleEventClick(event)}
                                      className={`p-3 rounded-lg border transition-colors cursor-pointer hover:bg-zinc-800/80 ${isGoogleEvent
                                        ? 'bg-blue-950/30 border-blue-700/50 hover:border-blue-600/70'
                                        : 'bg-zinc-800/60 border-zinc-700/30 hover:border-[#FF7939]/40'
                                        }`}
                                    >
                                      <div className="space-y-2">
                                        {/* Header: Producto y título */}
                                        <div className="space-y-1">
                                          {isGoogleEvent && (
                                            <div className="flex items-center gap-1 mb-1">
                                              <Calendar className="h-3 w-3 text-blue-400" />
                                              <div className="text-xs text-blue-400 font-medium">Google Calendar</div>
                                            </div>
                                          )}
                                          {event.product_name && !isGoogleEvent && (
                                            <div className="text-xs text-[#FF7939] font-medium uppercase tracking-wide">
                                              {event.product_name}
                                            </div>
                                          )}
                                          <h3 className="font-semibold text-white text-sm leading-tight">
                                            {event.title}
                                          </h3>
                                          {event.location && isGoogleEvent && (
                                            <div className="text-xs text-gray-400">{event.location}</div>
                                          )}
                                        </div>

                                        {/* Info bar: Compacta y organizada */}
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center gap-3 text-xs">
                                            {/* Horario completo */}
                                            <div className="flex items-center gap-1 text-gray-300">
                                              <Clock className="h-3 w-3" />
                                              <span className="font-mono">
                                                {format(new Date(event.start_time), 'HH:mm')}-{format(new Date(event.end_time), 'HH:mm')}
                                              </span>
                                            </div>

                                            {/* Participantes - Solo para eventos de Omnia */}
                                            {!isGoogleEvent && (
                                              <div className="flex items-center gap-1 text-gray-300">
                                                <Users className="h-3 w-3" />
                                                <span className="font-medium">
                                                  {(event.event_type === 'consultation' ? 1 : (event.current_participants || 0))}/{(event.event_type === 'consultation' ? 1 : (event.max_participants || 'N/A'))}
                                                </span>
                                              </div>
                                            )}

                                            {/* Tipo - Solo para eventos de Omnia */}
                                            {!isGoogleEvent && (
                                              <div className="px-2 py-0.5 rounded-full bg-zinc-700 text-gray-300 text-xs font-medium">
                                                {event.event_type === 'workshop' ? 'Taller' :
                                                  event.event_type === 'consultation' ? 'Meet' :
                                                    event.event_type === 'other' ? 'Doc' : event.event_type}
                                              </div>
                                            )}

                                            {/* Badge para eventos de Google */}
                                            {isGoogleEvent && (
                                              <div className="px-2 py-0.5 rounded-full bg-blue-900/50 text-blue-300 text-xs font-medium">
                                                Google
                                              </div>
                                            )}
                                          </div>

                                          {/* Meet Link - Solo mostrar si es un link válido de Google Meet */}
                                          {event.meet_link &&
                                            event.meet_link.includes('meet.google.com/') &&
                                            !event.meet_link.includes('test-') &&
                                            !event.meet_link.includes('xxx-') && (
                                              <Button
                                                onClick={(e) => {
                                                  e.stopPropagation()
                                                  window.open(event.meet_link, '_blank')
                                                }}
                                                size="sm"
                                                variant="ghost"
                                                className="h-7 px-2 gap-1.5 hover:bg-[#FF7939]/20 rounded-lg transition-colors text-[#FF7939]"
                                                title="Abrir Google Meet"
                                              >
                                                <Video className="h-3.5 w-3.5" />
                                                <span className="text-xs font-medium">Meet</span>
                                              </Button>
                                            )}
                                        </div>
                                      </div>
                                    </div>
                                  )
                                })
                              )}
                            </div>
                          </div>
                        )
                      })
                    })()}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Resumen de hoy */}
            {todayEvents.length > 0 && (
              <Card className="bg-zinc-900/50 border border-zinc-800">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-[#FF7939]" />
                      <span className="text-sm font-medium text-white">Resumen de Hoy</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                      <div className="flex items-center gap-1">
                        <span className="text-blue-400 font-medium">
                          {todayEvents.filter(e => e.is_google_event || e.source === 'google_calendar').length}
                        </span>
                        <span className="text-gray-400">de calendar</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[#FF7939] font-medium">
                          {todayEvents.filter(e => !e.is_google_event && e.source !== 'google_calendar').length}
                        </span>
                        <span className="text-gray-400">eventos de omnia</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Modal para editar eventos de taller */}
        {selectedEvent && selectedEvent.event_type === 'workshop' && (
          <WorkshopEventDetailModal
            event={selectedEvent}
            isOpen={showEventModal}
            onClose={handleCloseModal}
            onUpdate={handleEventUpdate}
          />
        )}

        {/* Las reuniones (consultation) reutilizan el modal de crear/editar Meet */}
      </div>

      {showCreateEventModal && (
        <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl p-5">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex-1 min-w-0 pt-1">
                {meetModalMode === 'edit' ? (
                  isMeetEditing ? (
                    <textarea
                      value={newEventTitle}
                      onChange={(e) => setNewEventTitle(e.target.value)}
                      rows={2}
                      className="w-full bg-transparent text-white font-semibold text-xl leading-snug focus:outline-none resize-none"
                      placeholder="Reunión"
                    />
                  ) : (
                    <div className="text-white font-semibold text-xl leading-snug break-words whitespace-normal pr-2">
                      {newEventTitle || 'Reunión'}
                    </div>
                  )
                ) : (
                  <textarea
                    value={newEventTitle}
                    onChange={(e) => setNewEventTitle(e.target.value)}
                    rows={2}
                    className="w-full bg-transparent text-white font-semibold text-xl leading-snug focus:outline-none resize-none placeholder:text-gray-500"
                    placeholder="Escribí nombre de la meet"
                  />
                )}
              </div>

              <div className="flex items-center gap-1 flex-shrink-0 -mt-1 -mr-1">
                {meetModalMode === 'edit' && !isMeetEditing && (
                  <button
                    type="button"
                    onClick={() => setIsMeetEditing(true)}
                    className="w-8 h-8 rounded-full hover:bg-white/10 text-white flex items-center justify-center transition-colors"
                    title="Editar"
                    aria-label="Editar"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={closeCreateEventModal}
                  className="w-8 h-8 rounded-full hover:bg-white/10 text-white flex items-center justify-center transition-colors"
                  aria-label="Cerrar"
                >
                  <span className="text-xl leading-none">&times;</span>
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {meetModalMode === 'edit' && !isMeetEditing && (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200">
                    <Calendar className="h-4 w-4 text-gray-300" />
                    <span className="font-medium">
                      {newEventDate ? format(new Date(`${newEventDate}T00:00:00`), 'dd MMM yyyy', { locale: es }) : '—'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200">
                    <Clock className="h-4 w-4 text-gray-300" />
                    <span className="font-medium">
                      {(newEventStartTime && newEventEndTime) ? `${newEventStartTime} – ${newEventEndTime}` : '—'}
                    </span>
                  </div>

                  <div
                    className={
                      `ml-auto px-3 py-2 rounded-lg text-sm font-semibold ` +
                      (newEventIsFree
                        ? 'bg-emerald-900/40 text-emerald-200 border border-emerald-800/40'
                        : 'bg-orange-900/40 text-orange-200 border border-orange-800/40')
                    }
                  >
                    {newEventIsFree ? 'Gratis' : `$${formatArs(newEventPrice || '0')}`}
                  </div>
                </div>
              )}

              <div>
                <div className="text-sm font-semibold text-white">Notas</div>
                {meetModalMode === 'edit' && !isMeetEditing ? (
                  <div className="text-sm text-gray-300 mt-1">{newEventNotes || '—'}</div>
                ) : (
                  <textarea
                    value={newEventNotes}
                    onChange={(e) => setNewEventNotes(e.target.value)}
                    rows={3}
                    className="w-full mt-1 bg-black/40 border border-white/10 rounded-lg px-3 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#FF7939] resize-none min-h-[88px]"
                    placeholder="Añadir detalles adicionales..."
                  />
                )}
              </div>

              <div className="border-t border-dashed border-white/10" />

              {meetModalMode === 'edit' && !isMeetEditing ? null : (
                <>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-300 flex-shrink-0" />

                    <div className="relative flex-shrink-0">
                      <input
                        id="create-meet-date"
                        type="date"
                        ref={meetDateInputRef}
                        value={newEventDate}
                        onChange={(e) => setNewEventDate(e.target.value)}
                        className="h-7 bg-black/40 border border-white/10 rounded-lg pl-2 pr-6 text-[13px] text-white focus:outline-none focus:border-[#FF7939]"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const el = meetDateInputRef.current
                          if (!el) return
                            // showPicker is supported in some browsers; fallback focuses/clicks.
                            ; (el as any).showPicker?.()
                          el.focus()
                          el.click()
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-5 w-5 flex items-center justify-center"
                        aria-label="Elegir fecha"
                      >
                        <ChevronDown className="h-3 w-3 text-[#FF7939]" />
                      </button>
                    </div>

                    <div className="relative flex-shrink-0">
                      <input
                        type="time"
                        value={newEventStartTime}
                        onChange={(e) => setNewEventStartTime(e.target.value)}
                        className="h-7 bg-black/40 border border-white/10 rounded-lg pl-2 pr-6 text-[13px] text-white focus:outline-none focus:border-[#FF7939]"
                        aria-label="Hora inicio"
                      />
                      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-500" />
                    </div>

                    <Clock className="h-4 w-4 text-gray-300 flex-shrink-0" />

                    <div className="relative flex-shrink-0">
                      <input
                        type="time"
                        value={newEventEndTime}
                        onChange={(e) => setNewEventEndTime(e.target.value)}
                        className="h-7 bg-black/40 border border-white/10 rounded-lg pl-2 pr-6 text-[13px] text-white focus:outline-none focus:border-[#FF7939]"
                        aria-label="Hora fin"
                      />
                      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-500" />
                    </div>
                  </div>

                  <div className="w-full mt-3 flex items-center justify-center -translate-x-4">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setNewEventIsFree((prev) => {
                            const nextIsFree = !prev
                            if (!nextIsFree) {
                              // Activado (con precio): default $0 si está vacío
                              setNewEventPrice((p) => (String(p || '').trim() ? p : '0'))
                            } else {
                              // Gratis
                              setNewEventPrice('')
                            }
                            return nextIsFree
                          })
                        }}
                        className={`w-12 h-6 rounded-full transition-colors ${newEventIsFree ? 'bg-zinc-700' : 'bg-[#FF7939]'}`}
                        aria-label="Toggle gratis"
                      >
                        <div
                          className={`h-5 w-5 rounded-full bg-black transition-transform ${newEventIsFree ? 'translate-x-1' : 'translate-x-6'
                            }`}
                        />
                      </button>

                      {newEventIsFree ? (
                        <div className="text-sm font-semibold text-gray-400">Gratis</div>
                      ) : (
                        <div className="bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 flex items-center gap-2 focus-within:border-[#FF7939]">
                          <div className="text-sm text-gray-300">$</div>
                          <input
                            inputMode="decimal"
                            value={String(newEventPrice || '')}
                            onChange={(e) => setNewEventPrice(e.target.value)}
                            className="w-20 bg-transparent text-sm text-white placeholder-gray-500 focus:outline-none"
                            placeholder="0"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              <div className="pt-1">
                <div className="text-white font-semibold mb-2">
                  Clientes ({selectedClientIds.length})
                </div>

                <div className={meetModalMode === 'edit' && !isMeetEditing ? "space-y-2" : "border border-white/10 rounded-xl overflow-hidden bg-black/20"}>
                  {selectedClientIds.length > 0 && (
                    <div className={meetModalMode === 'edit' && !isMeetEditing ? "" : "border-b border-white/10"}>
                      {selectedClientIds
                        .map((id) => clientsForMeet.find((c) => c.id === id) || ({ id, name: 'Cliente' } as any))
                        .filter(Boolean)
                        .map((c: any) => {
                          const credits = Number(c.meet_credits_available ?? 0)
                          const dotColor = c.status === 'active' ? 'bg-emerald-500' : 'bg-orange-500'
                          const participant = meetParticipants.find((p) => p.client_id === c.id)
                          const rsvp = String(participant?.rsvp_status || 'pending')
                          const pay = String(participant?.payment_status || '')
                          const badge =
                            rsvp === 'confirmed'
                              ? { text: 'Confirmado', cls: 'bg-emerald-900/40 text-emerald-200 border border-emerald-800/40' }
                              : rsvp === 'declined' || rsvp === 'cancelled'
                                ? { text: 'Cancelado', cls: 'bg-red-900/40 text-red-300 border border-red-800/40' }
                                : { text: 'Pendiente', cls: 'bg-orange-900/40 text-orange-200 border border-orange-800/40' }

                          // Calcular costo estimado en UI
                          let cost = 0
                          if (newEventStartTime && newEventEndTime) {
                            const [sh, sm] = newEventStartTime.split(':').map(Number)
                            const [eh, em] = newEventEndTime.split(':').map(Number)
                            if (!isNaN(sh) && !isNaN(eh)) {
                              const s = new Date(); s.setHours(sh, sm, 0, 0)
                              const e = new Date(); e.setHours(eh, em, 0, 0)
                              if (e < s) e.setDate(e.getDate() + 1) // asume crossing midnight
                              const mins = differenceInMinutes(e, s)
                              cost = Math.ceil(mins / 15)
                            }
                          }

                          const creditsLine =
                            credits >= cost
                              ? (cost > 0 ? `Consumirá ${cost} créditos` : `${credits} créditos disponibles`)
                              : `Consumirá ${cost} créditos (Saldo: ${credits})`
                          return (
                            <div
                              key={c.id}
                              className={
                                meetModalMode === 'edit' && !isMeetEditing
                                  ? 'px-3 py-3 flex items-center justify-between gap-3 bg-black/20 border border-white/10 rounded-xl'
                                  : 'px-3 py-3 flex items-center gap-3 border-b border-white/10 last:border-b-0'
                              }
                            >
                              <div className="relative">
                                <div className="w-10 h-10 rounded-full bg-zinc-800 overflow-hidden" />
                                <div
                                  className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full ${dotColor} border-2 border-zinc-950`}
                                />
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="text-white text-sm font-medium leading-tight truncate">{c.name}</div>
                                <div className="text-xs text-gray-400">{creditsLine}</div>
                              </div>

                              {meetModalMode === 'edit' && !isMeetEditing ? (
                                <div className="flex flex-col items-end gap-1">
                                  <div className={`px-3 py-1 rounded-lg text-xs font-semibold ${badge.cls}`}>{badge.text}</div>
                                  {badge.text === 'Pendiente' && (
                                    <div className="text-xs text-orange-200">Consumirá 1 crédito</div>
                                  )}
                                </div>
                              ) : (
                                <div className="flex flex-col items-end">
                                  <div className={`text-xs font-medium whitespace-nowrap ${credits >= cost ? 'text-[#FF7939]' : (newEventIsFree && credits > 0 ? 'text-[#FF7939]' : 'text-red-400')}`}>
                                    {/* 
                                      Lógica de visualización:
                                      1. Tiene créditos suficientes (>= cost): "Consumirá X créditos" (Orange)
                                      2. Es Gratis:
                                         - Si tiene parciales: "Gratis (+ usa X créditos)" 
                                         - Si no tiene: "Gratis"
                                      3. No es Gratis y no alcanza: "Saldo insuficiente" + Detalles cobro
                                    */}
                                    {credits >= cost
                                      ? `Consumirá ${cost} créditos`
                                      : (newEventIsFree
                                        ? (credits > 0 ? `Gratis (+ usa ${credits} créd.)` : 'Gratis')
                                        : (cost > 0 ? `Saldo insuficiente (${credits})` : 'Calculando...')
                                      )
                                    }
                                  </div>
                                  {!newEventIsFree && cost > credits && (
                                    <div className="flex flex-col items-end mt-0.5">
                                      <div className="text-[11px] text-red-300 font-semibold">
                                        Cobrar ${formatArs(((Number(newEventPrice) || 0) / (cost || 1)) * (cost - credits))}
                                      </div>
                                      <div className="text-[10px] text-orange-300/80">
                                        + usa {credits} créditos
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}

                              {!(meetModalMode === 'edit' && !isMeetEditing) && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setSelectedClientIds((prev) => prev.filter((x) => x !== c.id))
                                  }
                                  className="ml-2 w-7 h-7 rounded-md hover:bg-white/10 text-gray-300 flex items-center justify-center"
                                  aria-label="Quitar cliente"
                                >
                                  ×
                                </button>
                              )}
                            </div>
                          )
                        })}
                    </div>
                  )}

                  {!(meetModalMode === 'edit' && !isMeetEditing) && (
                    <button
                      type="button"
                      onClick={() => setShowClientPicker((v) => !v)}
                      className="w-full text-left px-3 py-2.5 text-gray-400 hover:text-gray-300 flex items-center gap-2 hover:bg-white/5 transition-colors"
                    >
                      <span className="text-lg leading-none">+</span>
                      <span className="text-sm">Seleccionar cliente</span>
                    </button>
                  )}

                  {showClientPicker && (
                    <div className="p-3 border-t border-white/10">
                      <div className="relative mb-3">
                        <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          value={clientSearch}
                          onChange={(e) => setClientSearch(e.target.value)}
                          className="w-full bg-black/40 border border-white/10 rounded-lg pl-9 pr-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#FF7939]"
                          placeholder="Buscar cliente..."
                        />
                      </div>

                      <div className="max-h-56 overflow-y-auto rounded-lg border border-white/10">
                        {clientsForMeet
                          .filter((c) =>
                            String(c.name || '')
                              .toLowerCase()
                              .includes(String(clientSearch || '').trim().toLowerCase())
                          )
                          .filter((c) => !selectedClientIds.includes(c.id))
                          .map((c) => {
                            const selected = selectedClientIds.includes(c.id)
                            const credits = Number(c.meet_credits_available ?? 0)
                            const dotColor = c.status === 'active' ? 'bg-emerald-500' : 'bg-orange-500'

                            return (
                              <button
                                key={c.id}
                                type="button"
                                onClick={() => {
                                  setSelectedClientIds((prev) =>
                                    prev.includes(c.id) ? prev.filter((x) => x !== c.id) : [...prev, c.id]
                                  )
                                }}
                                className={`w-full text-left px-3 py-3 flex items-center gap-3 border-b border-white/10 last:border-b-0 hover:bg-white/5 transition-colors ${selected ? 'bg-white/5' : ''
                                  }`}
                              >
                                <div className="relative">
                                  <div className="w-10 h-10 rounded-full bg-zinc-800 overflow-hidden" />
                                  <div
                                    className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full ${dotColor} border-2 border-zinc-950`}
                                  />
                                </div>

                                <div className="flex-1 min-w-0">
                                  <div className="text-white text-sm font-medium leading-tight truncate">{c.name}</div>
                                </div>

                                <div className="text-[#FF7939] text-xs font-medium whitespace-nowrap">
                                  {credits} créditos disponibles
                                </div>
                              </button>
                            )
                          })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {(meetModalMode === 'edit' || meetModalMode === 'create') && (
                <div className="pt-3 flex items-center justify-between gap-3">
                  {meetModalMode === 'edit' && !isMeetEditing && editingEventMeetLink ? (
                    <button
                      type="button"
                      onClick={() => window.open(editingEventMeetLink, '_blank')}
                      className="flex-1 px-4 py-2.5 rounded-xl bg-zinc-800 text-white text-sm hover:bg-zinc-700 transition-colors flex items-center justify-center gap-2"
                      disabled={createEventLoading}
                      title="Abrir enlace de Meet"
                    >
                      <Video className="h-4 w-4" />
                      Ir a la meet
                    </button>
                  ) : (
                    <div className="flex-1" />
                  )}

                  {(meetModalMode === 'edit' && isMeetEditing) && (
                    <div className="flex items-center justify-between gap-2 w-full">
                      <button
                        type="button"
                        onClick={() => setShowDeleteMeetDialog(true)}
                        className="px-4 py-2.5 rounded-xl bg-zinc-900 border border-red-500/30 text-red-400 text-sm hover:bg-red-500/10 transition-colors flex items-center gap-2"
                        disabled={createEventLoading}
                        title="Eliminar"
                        aria-label="Eliminar"
                      >
                        <Trash2 className="h-4 w-4" />
                        Eliminar
                      </button>

                      <div className="flex items-center gap-2 justify-end">
                        <button
                          type="button"
                          onClick={() => setIsMeetEditing(false)}
                          className="px-5 py-2.5 rounded-xl bg-zinc-800 text-white text-sm hover:bg-zinc-700 transition-colors"
                          disabled={createEventLoading}
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={handleCreateEvent}
                          className="px-5 py-2.5 rounded-xl bg-[#FF7939] text-black text-sm font-medium hover:bg-[#ff8a55] transition-colors"
                          disabled={createEventLoading}
                        >
                          Guardar cambios
                        </button>
                      </div>
                    </div>
                  )}

                  {meetModalMode === 'create' && (
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        type="button"
                        onClick={closeCreateEventModal}
                        className="px-5 py-2.5 rounded-xl bg-zinc-800 text-white text-sm hover:bg-zinc-700 transition-colors"
                        disabled={createEventLoading}
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={handleCreateEvent}
                        className="px-5 py-2.5 rounded-xl bg-[#FF7939] text-black text-sm font-medium hover:bg-[#ff8a55] transition-colors"
                        disabled={createEventLoading}
                      >
                        {createEventLoading ? 'Creando…' : 'Crear'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <DeleteConfirmationDialog
            isOpen={showDeleteMeetDialog}
            onClose={() => setShowDeleteMeetDialog(false)}
            onConfirm={async () => {
              setShowDeleteMeetDialog(false)
              await deleteMeeting()
            }}
            title="Eliminar Meet"
            description="¿Seguro que querés eliminar esta reunión? Esta acción no se puede deshacer."
          />
        </div>
      )}
    </div>
  )
}