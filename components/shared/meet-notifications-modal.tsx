'use client'

import { useEffect, useMemo, useState } from 'react'
import { format, addDays } from 'date-fns'
import { es } from 'date-fns/locale'
import { Bell, Video, X, Clock, CheckCircle2, XCircle, Ban } from 'lucide-react'

// ... (existing code)

type Role = 'client' | 'coach'

type NotificationItem = {
  id: string
  kind: 'invitation' | 'status_update'
  eventId: string
  title: string
  startTime: string
  endTime: string | null
  reschedulePending?: {
    toStartTime: string
    toEndTime: string | null
    fromStartTime: string
    fromEndTime: string | null
    note: string | null
    requestedByUserId: string | null // NEW
    status?: 'pending' | 'accepted' | 'rejected' // NEW
  } | null
  meetLink: string | null
  otherUserId: string
  otherUserName: string
  rsvpStatus: string
  invitedByRole: string | null
  invitedByUserId: string | null // NEW
  updatedAt: string
}

// ... unchanged imports and props ...



// ... render ...
// Ensure "Ver" button style matches request (simple text/link style or button).
// The user example had "Ver" at the end.
// I will keep the existing "Ver" button but maybe style it cleaner (no border/bg unless hovered?) 
// Actually the current "Ver" button is fine, just need to ensure the layout flow.


export function MeetNotificationsModal({
  open,
  onClose,
  role,
  supabase,
  userId,
  coachId,
  onOpenMeet,
}: {
  open: boolean
  onClose: () => void
  role: Role
  supabase: any
  userId: string
  coachId?: string | null
  onOpenMeet: (eventId: string) => void
}) {
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState<NotificationItem[]>([])
  const [error, setError] = useState<string | null>(null)
  const [actingId, setActingId] = useState<string | null>(null)

  const range = useMemo(() => {
    const now = new Date()
    return {
      from: addDays(now, -45).toISOString(),
      to: addDays(now, 365).toISOString(),
      nowIso: now.toISOString(),
    }
  }, [])

  const load = async () => {
    if (!open) return
    if (!userId) return
    if (role === 'coach' && !coachId) return

    setLoading(true)
    setError(null)
    try {
      if (role === 'client') {
        const { data: myParts, error: myPartsError } = await supabase
          .from('calendar_event_participants')
          .select('event_id, rsvp_status, updated_at, invited_by_role, invited_by_user_id')
          .eq('client_id', userId)
          .order('updated_at', { ascending: false })
          .limit(200)

        if (myPartsError) {
          setError(myPartsError.message || 'No se pudieron cargar las notificaciones')
          setItems([])
          return
        }

        const eventIds = Array.from(
          new Set((myParts || []).map((p: any) => String(p?.event_id || '')).filter(Boolean))
        )

        if (eventIds.length === 0) {
          setItems([])
          return
        }

        const { data: events, error: eventsError } = await supabase
          .from('calendar_events')
          .select('id, title, start_time, end_time, meet_link, coach_id')
          .in('id', eventIds)
          .eq('event_type', 'consultation')
          .lt('start_time', range.to)

        if (eventsError) {
          setError(eventsError.message || 'No se pudieron cargar las notificaciones')
          setItems([])
          return
        }

        const coachIds = Array.from(
          new Set((events || []).map((e: any) => String(e?.coach_id || '')).filter(Boolean))
        )

        const { data: coachProfiles } = coachIds.length
          ? await supabase.from('user_profiles').select('id, full_name').in('id', coachIds)
          : { data: [] }

        const coachIdToName: Record<string, string> = {}
          ; (coachProfiles || []).forEach((p: any) => {
            coachIdToName[String(p.id)] = String(p.full_name || 'Coach')
          })

        const eventById: Record<string, any> = {}
          ; (events || []).forEach((e: any) => {
            eventById[String(e.id)] = e
          })

        const { data: reschedules } = await supabase
          .from('calendar_event_reschedule_requests')
          .select('event_id, from_start_time, from_end_time, to_start_time, to_end_time, note, status, created_at, requested_by_user_id')
          .in('event_id', eventIds)
          .eq('status', 'pending')
          .order('created_at', { ascending: false })

        const pendingRescheduleByEventId: Record<string, any> = {}
          ; (reschedules || []).forEach((r: any) => {
            const eid = String(r?.event_id || '')
            if (!eid) return
            if (pendingRescheduleByEventId[eid]) return
            pendingRescheduleByEventId[eid] = r
          })

        const out: NotificationItem[] = (myParts || [])
          .map((p: any) => {
            const eid = String(p?.event_id || '')
            const ev = eventById[eid]
            if (!ev?.id) return null

            const endIso = ev.end_time ? String(ev.end_time) : null
            const startIso = String(ev.start_time)
            const endsAfterNow = endIso ? endIso >= range.nowIso : startIso >= range.nowIso
            if (!endsAfterNow) return null

            const rsvpStatus = String(p?.rsvp_status || 'pending')
            const invitedByRole = p?.invited_by_role == null ? null : String(p.invited_by_role)
            const coachId = String(ev?.coach_id || '')
            const coachName = coachIdToName[coachId] || 'Coach'

            const kind: NotificationItem['kind'] = rsvpStatus === 'pending' ? 'invitation' : 'status_update'
            const labelId = `${eid}:${String(p?.updated_at || '')}:${rsvpStatus}`

            return {
              id: labelId,
              kind,
              eventId: eid,
              title: ev.title ? String(ev.title) : 'Meet',
              startTime: String(ev.start_time),
              endTime: ev.end_time ? String(ev.end_time) : null,
              reschedulePending: (() => {
                const rr = pendingRescheduleByEventId[eid]
                if (!rr?.to_start_time) return null
                return {
                  toStartTime: String(rr.to_start_time),
                  toEndTime: rr.to_end_time ? String(rr.to_end_time) : null,
                  fromStartTime: String(rr.from_start_time),
                  fromEndTime: rr.from_end_time ? String(rr.from_end_time) : null,
                  note: rr.note == null ? null : String(rr.note),
                  requestedByUserId: rr.requested_by_user_id ? String(rr.requested_by_user_id) : null,
                }
              })(),
              meetLink: ev.meet_link ? String(ev.meet_link) : null,
              otherUserId: coachId,
              otherUserName: coachName,
              rsvpStatus,
              invitedByRole,
              updatedAt: String(p?.updated_at || ev.start_time),
            }
          })
          .filter(Boolean)
          .slice(0, 30) as any

        setItems(out)
        return
      }

      const { data: events, error: eventsError } = await supabase
        .from('calendar_events')
        .select('id, title, start_time, end_time, meet_link, client_id')
        .eq('coach_id', coachId)
        .eq('event_type', 'consultation')
        .lt('start_time', range.to)

      if (eventsError) {
        setError(eventsError.message || 'No se pudieron cargar las notificaciones')
        setItems([])
        return
      }

      const eventIds = Array.from(new Set((events || []).map((e: any) => String(e?.id || '')).filter(Boolean)))
      if (eventIds.length === 0) {
        setItems([])
        return
      }

      const { data: parts, error: partsError } = await supabase
        .from('calendar_event_participants')
        .select('event_id, client_id, rsvp_status, updated_at, invited_by_role, invited_by_user_id, participant_role')
        .in('event_id', eventIds)
        .order('updated_at', { ascending: false })
        .limit(200)

      if (partsError) {
        setError(partsError.message || 'No se pudieron cargar las notificaciones')
        setItems([])
        return
      }

      // [MOVED UP] Fetch Reschedules (Pending + History)
      const { data: reschedules } = await supabase
        .from('calendar_event_reschedule_requests')
        .select('event_id, from_start_time, from_end_time, to_start_time, to_end_time, note, status, created_at, requested_by_user_id')
        .in('event_id', eventIds)
        .order('created_at', { ascending: false })
        .limit(20)

      const pendingRescheduleByEventId: Record<string, any> = {}
      const historyRescheduleByEventId: Record<string, any> = {}

        ; (reschedules || []).forEach((r: any) => {
          const eid = String(r?.event_id || '')
          if (!eid) return
          if (r.status === 'pending') {
            if (!pendingRescheduleByEventId[eid]) pendingRescheduleByEventId[eid] = r
          } else {
            // Keep latest history
            if (!historyRescheduleByEventId[eid]) historyRescheduleByEventId[eid] = r
          }
        })

      const clientIds = Array.from(
        new Set([
          ...(parts || [])
            .filter((p: any) => String(p?.participant_role || '') !== 'coach')
            .map((p: any) => String(p?.client_id || ''))
            .filter(Boolean),
          ...(reschedules || [])
            .map((r: any) => String(r?.requested_by_user_id || ''))
            .filter(Boolean)
        ])
      )

      const { data: clientProfiles } = clientIds.length
        ? await supabase.from('user_profiles').select('id, full_name').in('id', clientIds)
        : { data: [] }

      const clientIdToName: Record<string, string> = {}
        ; (clientProfiles || []).forEach((p: any) => {
          clientIdToName[String(p.id)] = String(p.full_name || 'Cliente')
        })

      // If I am a client, I also need the Coach's name to show "Sent to Coach X"
      let coachName = 'Coach'
      if (role === 'client' && coachId) {
        const { data: cProfile } = await supabase
          .from('user_profiles')
          .select('full_name')
          .eq('id', coachId)
          .single()
        if (cProfile) {
          coachName = String(cProfile.full_name || 'Coach')
        }
      }

      const eventById: Record<string, any> = {}
        ; (events || []).forEach((e: any) => {
          eventById[String(e.id)] = e
        })

      const out: NotificationItem[] = (parts || [])
        .filter((p: any) => String(p?.participant_role || '') !== 'coach')
        .map((p: any) => {
          const eid = String(p?.event_id || '')
          const ev = eventById[eid]
          if (!ev?.id) return null

          const endIso = ev.end_time ? String(ev.end_time) : null
          const startIso = String(ev.start_time)

          // Relax "endsAfterNow" -> allow if updated recently (e.g. 7 days) OR event is future
          const now = new Date()
          const eventEnd = endIso ? new Date(endIso) : new Date(startIso)
          const updateTime = p?.updated_at ? new Date(p.updated_at) : new Date(startIso)
          const isRecentUpdate = (now.getTime() - updateTime.getTime()) < (7 * 24 * 60 * 60 * 1000)
          const isFuture = eventEnd >= now

          if (!isFuture && !isRecentUpdate) return null

          const rsvpStatus = String(p?.rsvp_status || 'pending')
          const invitedByRole = p?.invited_by_role == null ? null : String(p.invited_by_role)
          const clientId = String(p?.client_id || '')
          const clientName = clientIdToName[clientId] || 'Cliente'
          const kind: NotificationItem['kind'] = rsvpStatus === 'pending' ? 'invitation' : 'status_update'
          const labelId = `${eid}:${clientId}:${String(p?.updated_at || '')}:${rsvpStatus}`

          return {
            id: labelId,
            kind,
            eventId: eid,
            title: ev.title ? String(ev.title) : 'Meet',
            startTime: String(ev.start_time),
            endTime: ev.end_time ? String(ev.end_time) : null,
            reschedulePending: (() => {
              const rr = pendingRescheduleByEventId[eid] || historyRescheduleByEventId[eid]
              if (!rr?.to_start_time) return null
              // If it's the SAME request we are viewing in history, status might be updated.
              return {
                toStartTime: String(rr.to_start_time),
                toEndTime: rr.to_end_time ? String(rr.to_end_time) : null,
                fromStartTime: String(rr.from_start_time),
                fromEndTime: rr.from_end_time ? String(rr.from_end_time) : null,
                note: rr.note == null ? null : String(rr.note),
                requestedByUserId: rr.requested_by_user_id ? String(rr.requested_by_user_id) : null,
                status: rr.status // Use actual status
              }
            })(),
            meetLink: ev.meet_link ? String(ev.meet_link) : null,
            otherUserId: clientId,
            otherUserName: clientName,
            rsvpStatus,
            invitedByRole,
            invitedByUserId: String(p?.invited_by_user_id || ''),
            updatedAt: String(p?.updated_at || ev.start_time),
          }
        })
        .filter(Boolean) as any

      // [Robustness] Add Orphaned Reschedule Requests (e.g. if participant row missing due to RLS)
      const processedEventIds = new Set(out.map(i => i.eventId))

      // Combine pending AND history for robustness
      const allReschedules = { ...historyRescheduleByEventId, ...pendingRescheduleByEventId }

      Object.values(allReschedules).forEach((rr: any) => {
        const eid = String(rr.event_id)
        // If we already showed this event via participant row, we might have attached the PENDING request.
        // But what if we have a HISTORY (accepted/rejected) request and the participant row logic didn't pick it up or didn't show the history?
        // The participant logic only attaches PENDING reschedules.
        // So if we have a resolved reschedule, we might want to show it as a standalone notification item here 
        // IF it wasn't already covered. 
        // But wait, if we have a participant row, we showed that. 
        // If the user wants to see "Accepted Request", it's a distinct event from "Participant Update" usually?
        // Actually, if I accept a request, the `status` of RR changes. The participant row might NOT change (unless I also updated RSVP).
        // So yes, we should add resolved RR items if they are recent.

        if (processedEventIds.has(eid)) {
          // Valid point: if we already show the event, we only showed PENDING RR. 
          // If this RR is resolved (accepted/rejected), we missed showing it in the main loop map 
          // because we only looked at `pendingRescheduleByEventId`.
          // We should probably allow adding a second item for the resolution? 
          // Or better, relying on this loop to add purely RR-based notifications.
          // Let's SKIP if it's PENDING and we already processed it (because we attached it).
          if (rr.status === 'pending') return
        }

        const ev = eventById[eid]
        if (!ev) return

        // Relaxed time check for RR
        const now = new Date()
        const updateTime = rr.created_at ? new Date(rr.created_at) : new Date() // created_at or updated_at? Table has created_at properly.
        const isRecent = (now.getTime() - updateTime.getTime()) < (7 * 24 * 60 * 60 * 1000)
        if (!isRecent && rr.status !== 'pending') return

        const reqUserId = rr.requested_by_user_id
        const labelId = `rr:${eid}:${rr.created_at}:${rr.status}`

        out.push({
          id: labelId,
          kind: 'status_update',
          eventId: eid,
          title: ev.title ? String(ev.title) : 'Meet',
          startTime: String(ev.start_time),
          endTime: ev.end_time ? String(ev.end_time) : null,
          reschedulePending: {
            toStartTime: String(rr.to_start_time),
            toEndTime: rr.to_end_time ? String(rr.to_end_time) : null,
            fromStartTime: String(rr.from_start_time),
            fromEndTime: rr.from_end_time ? String(rr.from_end_time) : null,
            note: rr.note == null ? null : String(rr.note),
            requestedByUserId: reqUserId ? String(reqUserId) : null,
            status: rr.status // 'pending' | 'accepted' | 'rejected'
          },
          meetLink: ev.meet_link ? String(ev.meet_link) : null,
          otherUserId: reqUserId || '',
          otherUserName: clientIdToName[reqUserId] || 'Cliente',
          rsvpStatus: 'confirmed',
          invitedByRole: null,
          invitedByUserId: null,
          updatedAt: String(rr.created_at || new Date().toISOString())
        })
      })

        // [Robustness] Add Orphaned Events (Legacy/Manual Inserts with client_id but no parts)
        ; (events || []).forEach((e: any) => {
          const eid = String(e.id)
          if (processedEventIds.has(eid)) return

          // If event has a direct client_id and wasn't processed in parts/reschedules
          if (e.client_id) {
            const cId = String(e.client_id)
            const startIso = String(e.start_time)
            const endIso = e.end_time ? String(e.end_time) : null

            // Apply same time filter
            const now = new Date()
            const eventEnd = endIso ? new Date(endIso) : new Date(startIso)
            const isFuture = eventEnd >= now
            if (!isFuture) return

            const labelId = `ev:${eid}:${startIso}`

            out.push({
              id: labelId,
              kind: 'invitation',
              eventId: eid,
              title: e.title ? String(e.title) : 'Meet',
              startTime: startIso,
              endTime: endIso,
              reschedulePending: null,
              meetLink: e.meet_link ? String(e.meet_link) : null,
              otherUserId: cId,
              otherUserName: clientIdToName[cId] || 'Cliente',
              rsvpStatus: 'confirmed',
              invitedByRole: 'coach',
              invitedByUserId: null,
              updatedAt: startIso
            })
          }
        })

      // Sort combined list
      out.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())

      setItems(out.slice(0, 30))
    } finally {
      setLoading(false)
    }
  }

  const updateRsvp = async (it: NotificationItem, nextStatus: 'confirmed' | 'declined') => {
    try {
      setActingId(it.id)
      setError(null)

      // Client updates their own participation
      if (role === 'client') {
        const { error: upErr } = await supabase
          .from('calendar_event_participants')
          .update({
            rsvp_status: nextStatus,
            updated_at: new Date().toISOString(),
          })
          .eq('event_id', it.eventId)
          .eq('client_id', userId)

        if (upErr) {
          setError(upErr.message || 'No se pudo actualizar la meet')
          return
        }
      } else {
        // Coach updates the client participant row for their event
        const { error: upErr } = await supabase
          .from('calendar_event_participants')
          .update({
            rsvp_status: nextStatus,
            updated_at: new Date().toISOString(),
          })
          .eq('event_id', it.eventId)
          .eq('client_id', it.otherUserId)

        if (upErr) {
          setError(upErr.message || 'No se pudo actualizar la meet')
          return
        }
      }

      await load()
    } catch (e: any) {
      setError(e?.message || 'No se pudo actualizar la meet')
    } finally {
      setActingId(null)
    }
  }

  const respondToReschedule = async (it: NotificationItem, action: 'accepted' | 'rejected') => {
    try {
      setActingId(it.id)
      setError(null)

      // 1. Update request status
      const { error: upErr } = await supabase
        .from('calendar_event_reschedule_requests')
        .update({ status: action })
        .eq('event_id', it.eventId)
        .eq('status', 'pending')

      if (upErr) throw upErr

      // 2. If accepted, update event time
      if (action === 'accepted' && it.reschedulePending) {
        const { error: evErr } = await supabase
          .from('calendar_events')
          .update({
            start_time: it.reschedulePending.toStartTime,
            end_time: it.reschedulePending.toEndTime
          })
          .eq('id', it.eventId)

        if (evErr) throw evErr
      }

      await load()
    } catch (e: any) {
      setError(e?.message || 'Error actualizando la solicitud')
    } finally {
      setActingId(null)
    }
  }

  useEffect(() => {
    if (!open) return
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, role, userId, coachId])

  const title = role === 'coach' ? 'Notificaciones de meets' : 'Notificaciones'

  const describe = (it: NotificationItem) => {
    // Priority: Reschedule Pending
    // Priority: Reschedule Pending or History
    if (it.reschedulePending) {
      // If I am the one who requested it:
      const rStatus = it.reschedulePending.status
      const isMyRequest = it.reschedulePending.requestedByUserId === userId
      const otherName = it.otherUserName

      if (rStatus === 'accepted') return isMyRequest ? 'Tu solicitud de nuevo horario fue aceptada' : `Solicitud de nuevo horario aceptada por ${otherName}`
      if (rStatus === 'rejected') return isMyRequest ? 'Tu solicitud de nuevo horario fue rechazada' : `Solicitud de nuevo horario rechazada por ${otherName}`

      // Pending
      return isMyRequest ? 'Solicitud de nuevo horario por ti' : `Solicitud de nuevo horario por ${otherName}`
    }

    if (role === 'coach') {
      if (it.rsvpStatus === 'pending') return `${it.otherUserName} solicitó una meet`
      if (it.rsvpStatus === 'confirmed') return `${it.otherUserName} aceptó la meet`
      if (it.rsvpStatus === 'declined') return `${it.otherUserName} rechazó la meet`
      if (it.rsvpStatus === 'cancelled') return `${it.otherUserName} canceló la meet`
      return `${it.otherUserName} actualizó la meet`
    }

    // Role is client
    if (it.rsvpStatus === 'pending') {
      // If I was invited by someone else (coach or other), show "invited you"
      // If invitedByUserId is me, default to "sent a request"
      // If invitedByUserId is null (legacy data), check invitedByRole
      if (it.invitedByUserId && it.invitedByUserId !== userId) {
        return `${it.otherUserName} te invitó a una meet`
      }
      if (it.invitedByRole === 'coach' && (!it.invitedByUserId || it.invitedByUserId !== userId)) {
        return `${it.otherUserName} te invitó a una meet`
      }
      return `Solicitud enviada a ${it.otherUserName}`
    }

    if (it.rsvpStatus === 'confirmed') return `Solicitud aceptada por ${it.otherUserName}`
    if (it.rsvpStatus === 'declined') return `Solicitud rechazada por ${it.otherUserName}`
    if (it.rsvpStatus === 'cancelled') return `Meet cancelada por ${it.otherUserName}`

    return `Meet actualizada con ${it.otherUserName}`
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[80] bg-black/60 flex items-center justify-center p-4" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-[#FF7939]" />
            <div className="text-white font-semibold">{title}</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-white/10 text-white flex items-center justify-center"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4">
          {loading ? (
            <div className="text-sm text-white/70">Cargando…</div>
          ) : error ? (
            <div className="text-sm text-red-300">{error}</div>
          ) : items.length === 0 ? (
            <div className="text-sm text-white/60">No tenés notificaciones por ahora.</div>
          ) : (
            <div className="space-y-2">
              {items.map((it) => {
                const start = new Date(it.startTime)
                const end = it.endTime ? new Date(it.endTime) : null
                const timeLabel = `${format(start, 'HH:mm')}${end && !Number.isNaN(end.getTime()) ? ` – ${format(end, 'HH:mm')}` : ''}`
                const dateLabel = format(start, "dd MMM", { locale: es })
                const pending = it.rsvpStatus === 'pending'
                const isRescheduleRequest = !!it.reschedulePending && it.reschedulePending.requestedByUserId !== userId
                const isRescheduleResolved = it.reschedulePending?.status === 'accepted' || it.reschedulePending?.status === 'rejected'
                const isActing = actingId === it.id

                const getStatusVisuals = () => {
                  if (it.reschedulePending) {
                    if (it.reschedulePending.status === 'accepted') return { icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-500/10', border: 'border-green-500/20' }
                    if (it.reschedulePending.status === 'rejected') return { icon: XCircle, color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20' }
                    return { icon: Clock, color: 'text-[#FF7939]', bg: 'bg-[#FF7939]/10', border: 'border-[#FF7939]/30' }
                  }
                  if (it.rsvpStatus === 'confirmed') return { icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-500/10', border: 'border-green-500/20' }
                  if (it.rsvpStatus === 'declined') return { icon: XCircle, color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20' }
                  if (it.rsvpStatus === 'cancelled') return { icon: Ban, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' }
                  // Pending / Invitation
                  return { icon: Clock, color: 'text-[#FF7939]', bg: 'bg-[#FF7939]/10', border: 'border-[#FF7939]/30' }
                }

                const visuals = getStatusVisuals()
                const StatusIcon = visuals.icon

                return (
                  <div key={it.id} className={`rounded-xl border ${visuals.border} ${visuals.bg} px-3 py-2`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-white truncate">{it.title}</div>
                        <div className="mt-0.5 text-xs text-white/65 truncate">{describe(it)}</div>
                        {it.reschedulePending ? (
                          <div className="mt-1 space-y-0.5">
                            <div className="text-xs text-[#FFB366]">
                              {format(new Date(it.reschedulePending.toStartTime), 'dd MMM', { locale: es })} ·
                              {' '}
                              {(() => {
                                const a = new Date(it.reschedulePending!.toStartTime)
                                const b = it.reschedulePending!.toEndTime ? new Date(it.reschedulePending!.toEndTime as string) : null
                                return `${format(a, 'HH:mm')}${b && !Number.isNaN(b.getTime()) ? ` – ${format(b, 'HH:mm')}` : ''}`
                              })()}
                            </div>
                            <div className="text-xs text-white/45 line-through">
                              {dateLabel} · {timeLabel}
                            </div>
                            {it.reschedulePending.note && it.reschedulePending.note.trim().length > 0 && (
                              <div className="text-[11px] text-white/60 truncate">Nota: {it.reschedulePending.note}</div>
                            )}
                          </div>
                        ) : (
                          <div className="mt-1 text-xs text-white/55">{dateLabel} · {timeLabel}</div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <StatusIcon className={`h-4 w-4 ${visuals.color}`} />
                        <button
                          type="button"
                          onClick={() => onOpenMeet(it.eventId)}
                          className={`px-3 py-1.5 rounded-full text-xs font-semibold border border-[#FF7939]/60 text-[#FFB366] hover:bg-[#FF7939]/10 ${pending || (isRescheduleRequest && !isRescheduleResolved) ? '' : 'hidden'}`}
                        >
                          Ver
                        </button>
                        {!pending && !(isRescheduleRequest && !isRescheduleResolved) && (
                          <button
                            type="button"
                            onClick={() => onOpenMeet(it.eventId)}
                            className="px-3 py-1.5 rounded-full text-xs font-semibold border border-white/10 text-white/60 hover:bg-white/5"
                          >
                            Ver
                          </button>
                        )}
                      </div>
                    </div>

                    {(pending || (isRescheduleRequest && !isRescheduleResolved)) && (
                      <div className="mt-2 flex items-center justify-end gap-2">
                        <button
                          type="button"
                          disabled={isActing}
                          onClick={() => isRescheduleRequest ? respondToReschedule(it, 'rejected') : updateRsvp(it, 'declined')}
                          className={`px-3 py-1.5 rounded-full text-xs font-semibold border border-white/15 text-white/80 hover:bg-white/10 disabled:opacity-50 ${((it.invitedByUserId === userId && !isRescheduleRequest) || (isRescheduleRequest && it.reschedulePending?.requestedByUserId === userId)) ? 'hidden' : ''}`}
                          style={{ display: ((it.invitedByUserId === userId && !isRescheduleRequest) || (isRescheduleRequest && it.reschedulePending?.requestedByUserId === userId)) ? 'none' : undefined }}
                        >
                          Rechazar
                        </button>
                        <button
                          type="button"
                          disabled={isActing}
                          onClick={() => isRescheduleRequest ? respondToReschedule(it, 'accepted') : updateRsvp(it, 'confirmed')}
                          className={`px-3 py-1.5 rounded-full text-xs font-semibold border border-[#FF7939]/60 text-[#FFB366] hover:bg-[#FF7939]/10 disabled:opacity-50 ${((it.invitedByUserId === userId && !isRescheduleRequest) || (isRescheduleRequest && it.reschedulePending?.requestedByUserId === userId)) ? 'hidden' : ''}`}
                          style={{ display: ((it.invitedByUserId === userId && !isRescheduleRequest) || (isRescheduleRequest && it.reschedulePending?.requestedByUserId === userId)) ? 'none' : undefined }}
                        >
                          Aceptar
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
