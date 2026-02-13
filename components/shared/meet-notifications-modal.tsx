'use client'

import { useEffect, useMemo, useState } from 'react'
import { format, addDays, startOfDay } from 'date-fns'
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
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted'>('all')

  const range = useMemo(() => {
    const now = new Date()
    return {
      from: startOfDay(now).toISOString(), // From TODAY onwards
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
          .select('event_id, rsvp_status, updated_at, invited_by_user_id, invited_by_role')
          .eq('user_id', userId)
          .order('updated_at', { ascending: false })
          .limit(200)

        if (myPartsError) {
          setError(myPartsError.message || 'No se pudieron cargar las notificaciones')
          setItems([])
          return
        }

        const { data: myEvents, error: myEventsError } = await supabase
          .from('calendar_events')
          .select('id, title, start_time, end_time, google_meet_data, coach_id, event_type')
          .eq('created_by_user_id', userId)
          .lt('start_time', range.to)
          .order('start_time', { ascending: false })
          .limit(100)

        const eventIds = Array.from(
          new Set([
            ...(myParts || []).map((p: any) => String(p?.event_id || '')),
            ...(myEvents || []).map((e: any) => String(e?.id || ''))
          ].filter(Boolean))
        )

        if (eventIds.length === 0) {
          setItems([])
          return
        }

        const { data: events, error: eventsError } = await supabase
          .from('calendar_events')
          .select('id, title, start_time, end_time, google_meet_data, coach_id, event_type, created_by_user_id, status')
          .in('id', eventIds)
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

        const partByEventId: Record<string, any> = {}
          ; (myParts || []).forEach((p: any) => {
            partByEventId[String(p.event_id)] = p
          })

        const itemsMap = new Map<string, NotificationItem>()

          ; (events || []).forEach((ev: any) => {
            const eid = String(ev.id)
            const p = partByEventId[eid]

            // Participant or Creator
            const isCreator = String(ev.created_by_user_id) === userId

            // Prioritize global event status if it's cancelled or rescheduled
            let rsvpStatus = p ? String(p.rsvp_status || 'pending') : (isCreator ? 'confirmed' : 'pending')
            if (ev.status === 'cancelled') rsvpStatus = 'cancelled'
            else if (ev.status === 'rescheduled' && rsvpStatus !== 'pending') rsvpStatus = 'rescheduled'

            const updatedAt = p?.updated_at || ev.start_time

            const endIso = ev.end_time ? String(ev.end_time) : null
            const startIso = String(ev.start_time)
            const endsAfterNow = endIso ? endIso >= range.nowIso : startIso >= range.nowIso

            const isRecent = (new Date().getTime() - new Date(updatedAt).getTime()) < (30 * 24 * 60 * 60 * 1000)
            const isPending = rsvpStatus === 'pending'

            // Show if it's in the future OR recent OR pending invitation
            if (!endsAfterNow && !isRecent && !isPending) return

            const invitedByRole = p?.invited_by_role == null ? null : String(p.invited_by_role)
            const coachId = String(ev?.coach_id || '')
            const coachName = coachIdToName[coachId] || 'Coach'

            const kind: NotificationItem['kind'] = rsvpStatus === 'pending' ? 'invitation' : 'status_update'

            const rs = pendingRescheduleByEventId[eid]

            const item: NotificationItem = {
              id: `ev:${eid}`,
              kind,
              eventId: eid,
              title: ev.title ? String(ev.title) : (ev.event_type === 'workshop' ? 'Taller' : 'Meet'),
              startTime: String(ev.start_time),
              endTime: ev.end_time ? String(ev.end_time) : null,
              reschedulePending: rs ? {
                toStartTime: String(rs.to_start_time),
                toEndTime: rs.to_end_time ? String(rs.to_end_time) : null,
                fromStartTime: String(rs.from_start_time),
                fromEndTime: rs.from_end_time ? String(rs.from_end_time) : null,
                note: rs.note == null ? null : String(rs.note),
                requestedByUserId: rs.requested_by_user_id ? String(rs.requested_by_user_id) : null,
              } : null,
              meetLink: ev.google_meet_data?.meet_link ? String(ev.google_meet_data.meet_link) : null,
              otherUserId: coachId,
              otherUserName: coachName,
              rsvpStatus,
              invitedByRole,
              invitedByUserId: p?.invited_by_user_id || null,
              updatedAt: String(updatedAt),
            }
            itemsMap.set(eid, item)
          })

        const out = Array.from(itemsMap.values())
        out.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        setItems(out.slice(0, 30))
        return
      }

      const { data: events, error: eventsError } = await supabase
        .from('calendar_events')
        .select('id, title, start_time, end_time, google_meet_data, created_by_user_id, status')
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
        .select('event_id, user_id, rsvp_status, updated_at, role, participant_role, invited_by_user_id')
        .in('event_id', eventIds)
        .order('updated_at', { ascending: false })

      // Fetch ALL reschedules (pending and history)
      const { data: reschedules } = await supabase
        .from('calendar_event_reschedule_requests')
        .select('*')
        .in('event_id', eventIds)
        .order('created_at', { ascending: false })

      const reschedulesByEventId: Record<string, any[]> = {}
        ; (reschedules || []).forEach((r: any) => {
          const eid = String(r.event_id)
          if (!reschedulesByEventId[eid]) reschedulesByEventId[eid] = []
          reschedulesByEventId[eid].push(r)
        })

      const clientIds = new Set<string>()
      if (parts) {
        parts.forEach((p: any) => {
          const uidStr = String(p.user_id)
          if (uidStr !== String(userId)) clientIds.add(uidStr)
        })
      }
      if (reschedules) {
        reschedules.forEach((r: any) => {
          const uidStr = String(r.requested_by_user_id)
          if (uidStr && uidStr !== String(userId)) clientIds.add(uidStr)
        })
      }

      const { data: profiles } = clientIds.size
        ? await supabase.from('user_profiles').select('id, full_name').in('id', Array.from(clientIds))
        : { data: [] }

      const profileMap: Record<string, string> = {}
        ; (profiles || []).forEach((p: any) => { profileMap[String(p.id)] = p.full_name || 'Cliente' })

      const eventMap: Record<string, any> = {}
        ; (events || []).forEach((e: any) => { eventMap[String(e.id)] = e })

      // Consolidated Deduplicated Items
      const itemsMap = new Map<string, NotificationItem>()

        // 1. Participant Updates & Upcoming Events
        ; (events || []).forEach((ev: any) => {
          const eid = String(ev.id)
          // Find the client participant for this event
          const clientPart = (parts || []).find((p: any) => String(p.event_id) === eid && String(p.user_id) !== String(userId))

          const rsvp = clientPart ? String(clientPart.rsvp_status || 'pending') : 'confirmed'
          const updateTime = clientPart ? String(clientPart.updated_at || ev.start_time) : String(ev.start_time)
          // Try to find ANY participant who is not me to use as "other party"
          let cId = clientPart ? String(clientPart.user_id) : null
          if (!cId) {
            const otherP = (parts || []).find((p: any) => String(p.event_id) === eid && String(p.user_id) !== String(userId))
            if (otherP) cId = String(otherP.user_id)
          }
          if (!cId && ev.created_by_user_id && String(ev.created_by_user_id) !== String(userId)) {
            cId = String(ev.created_by_user_id)
          }

          const targetCId = cId || ''

          // Reschedule for this event
          const rsList = reschedulesByEventId[eid] || []
          const latestRs = rsList[0]

          const item: NotificationItem = {
            id: `ev:${eid}`,
            kind: rsvp === 'pending' ? 'invitation' : 'status_update',
            eventId: eid,
            title: ev.title || 'Meet',
            startTime: ev.start_time,
            endTime: ev.end_time || null,
            reschedulePending: latestRs ? {
              toStartTime: latestRs.to_start_time,
              toEndTime: latestRs.to_end_time,
              fromStartTime: latestRs.from_start_time,
              fromEndTime: latestRs.from_end_time,
              note: latestRs.note,
              requestedByUserId: latestRs.requested_by_user_id,
              status: latestRs.status
            } : null,
            meetLink: ev.google_meet_data?.meet_link || null,
            otherUserId: targetCId,
            otherUserName: targetCId ? (profileMap[targetCId] || 'Participante') : 'Participantes',
            rsvpStatus: rsvp,
            invitedByRole: clientPart?.invited_by_role,
            invitedByUserId: clientPart?.invited_by_user_id,
            updatedAt: latestRs && new Date(latestRs.created_at) > new Date(updateTime) ? latestRs.created_at : updateTime
          }

          const now = new Date()
          const eventEnd = ev.end_time ? new Date(ev.end_time) : new Date(ev.start_time)
          const isFuture = eventEnd >= now
          const isRecent = (now.getTime() - new Date(item.updatedAt).getTime()) < (10 * 24 * 60 * 60 * 1000)

          if (isFuture || isRecent) {
            itemsMap.set(eid, item)
          }
        })

        // 2. Pure Reschedule Requests (in case no participant row matched or to catch specific ghost updates)
        ; (reschedules || []).forEach((r: any) => {
          const eid = String(r.event_id)
          if (itemsMap.has(eid)) return // Already covered by participant or latest logic

          const ev = eventMap[eid]
          if (!ev) return

          const cId = String(r.requested_by_user_id || ev.created_by_user_id || '')
          if (!cId) return

          const item: NotificationItem = {
            id: `r:${r.id}`,
            kind: 'status_update',
            eventId: eid,
            title: ev.title || 'Meet',
            startTime: ev.start_time,
            endTime: ev.end_time || null,
            reschedulePending: {
              toStartTime: r.to_start_time,
              toEndTime: r.to_end_time,
              fromStartTime: r.from_start_time,
              fromEndTime: r.from_end_time,
              note: r.note,
              requestedByUserId: r.requested_by_user_id,
              status: r.status
            },
            meetLink: ev.google_meet_data?.meet_link || null,
            otherUserId: cId,
            otherUserName: profileMap[cId] || 'Cliente',
            rsvpStatus: 'confirmed',
            invitedByRole: null,
            invitedByUserId: null,
            updatedAt: r.created_at
          }

          const now = new Date()
          const isRecent = (now.getTime() - new Date(r.created_at).getTime()) < (10 * 24 * 60 * 60 * 1000)
          if (isRecent || r.status === 'pending') {
            itemsMap.set(eid, item)
          }
        })

      const final = Array.from(itemsMap.values())
      final.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      setItems(final.slice(0, 30))
    } finally {
      setLoading(false)
    }
  }

  const updateRsvp = async (it: NotificationItem, nextStatus: 'confirmed' | 'declined') => {
    // ... (unchanged)
  }

  const respondToReschedule = async (it: NotificationItem, action: 'accepted' | 'rejected') => {
    // ... (unchanged)
  }

  useEffect(() => {
    if (!open) return
    load()
  }, [open, role, userId, coachId])

  const title = role === 'coach' ? 'Notificaciones de meets' : 'Notificaciones'

  const describe = (it: NotificationItem) => {
    const isMe = (targetId: string | null) => targetId === userId
    const otherName = it.otherUserName

    if (it.reschedulePending) {
      const rStatus = it.reschedulePending.status
      const requestedByMe = isMe(it.reschedulePending.requestedByUserId)

      if (rStatus === 'accepted') {
        return requestedByMe ? 'Tu solicitud de nuevo horario fue aceptada' : `Aceptaste la reprogramación de ${otherName}`
      }
      if (rStatus === 'rejected') {
        return requestedByMe ? 'Tu solicitud de nuevo horario fue rechazada' : `Rechazaste la reprogramación de ${otherName}`
      }
      // Pending
      return requestedByMe ? 'Solicitaste un cambio de horario' : `${otherName} solicitó reprogramar`
    }

    if (role === 'coach') {
      if (it.rsvpStatus === 'pending') {
        return isMe(it.invitedByUserId) ? `Enviaste una invitación a ${otherName}` : `${otherName} solicitó una meet`
      }
      if (it.rsvpStatus === 'confirmed') {
        return isMe(it.invitedByUserId) ? `${otherName} aceptó la invitación` : `Confirmaste la meet con ${otherName}`
      }
      if (it.rsvpStatus === 'declined') {
        return isMe(it.invitedByUserId) ? `Rechazaste la solicitud de ${otherName}` : `${otherName} rechazó la meet`
      }
      if (it.rsvpStatus === 'cancelled') {
        return isMe(it.invitedByUserId) ? `Cancelaste la meet con ${otherName}` : `${otherName} canceló la meet`
      }
      return isMe(it.invitedByUserId) ? `Actualizaste la meet con ${otherName}` : `${otherName} actualizó la meet`
    }

    // Client role
    if (it.rsvpStatus === 'cancelled' || it.rsvpStatus === 'declined') {
      return `Meet cancelada o rechazada`
    }

    if (it.rsvpStatus === 'pending') {
      const isInvitedByMe = it.invitedByUserId === userId || it.otherUserId !== userId // simplified check
      const p = items.find(x => x.id === it.id)
      const invitedByMe = isInvitedByMe || (p?.invitedByRole === 'client')

      return invitedByMe ? `Solicitaste una meet a ${otherName}` : `${otherName} te invitó a una meet`
    }

    if (it.rsvpStatus === 'confirmed') {
      const isInvitedByMe = it.invitedByUserId === userId || it.otherUserId !== userId
      return isInvitedByMe ? `Tu solicitud fue aceptada por ${otherName}` : `Confirmaste la asistencia con ${otherName}`
    }

    return `Actualización de meet con ${otherName}`
  }

  const filteredItems = useMemo(() => {
    if (filter === 'all') return items
    if (filter === 'pending') {
      return items.filter(it => it.rsvpStatus === 'pending' || it.reschedulePending?.status === 'pending')
    }
    if (filter === 'accepted') {
      return items.filter(it => {
        const hasPendingReschedule = it.reschedulePending?.status === 'pending'
        return (it.rsvpStatus === 'confirmed' || it.rsvpStatus === 'rescheduled') && !hasPendingReschedule
      })
    }
    return items
  }, [items, filter])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[80] bg-black/60 flex items-center justify-center p-4" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl p-5 flex flex-col max-h-[85vh]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-2">
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

        {/* Minimalist Filter */}
        <div className="flex gap-1 mb-4 bg-white/5 p-1 rounded-xl w-fit">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${filter === 'all' ? 'bg-[#FF7939] text-black shadow-lg shadow-[#FF7939]/20' : 'text-white/40 hover:text-white/60'}`}
          >
            Todas
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${filter === 'pending' ? 'bg-[#FF7939] text-black shadow-lg shadow-[#FF7939]/20' : 'text-white/40 hover:text-white/60'}`}
          >
            Pendientes
          </button>
          <button
            onClick={() => setFilter('accepted')}
            className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${filter === 'accepted' ? 'bg-[#FF7939] text-black shadow-lg shadow-[#FF7939]/20' : 'text-white/40 hover:text-white/60'}`}
          >
            Aceptadas
          </button>
        </div>

        <div className="overflow-y-auto pr-1 custom-scrollbar flex-1">
          {loading ? (
            <div className="text-sm text-white/70 py-4">Cargando…</div>
          ) : error ? (
            <div className="text-sm text-red-300 py-4">{error}</div>
          ) : filteredItems.length === 0 ? (
            <div className="text-sm text-white/60 py-8 text-center italic">No hay notificaciones que coincidan.</div>
          ) : (
            <div className="space-y-2">
              {filteredItems.map((it) => {
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
                            <div className="text-[11px] text-[#FFB366] font-medium">
                              {format(new Date(it.reschedulePending.toStartTime), "d 'de' MMM", { locale: es })} · {format(new Date(it.reschedulePending.toStartTime), 'HH:mm')}
                              {it.reschedulePending.toEndTime && !Number.isNaN(new Date(it.reschedulePending.toEndTime).getTime()) && ` – ${format(new Date(it.reschedulePending.toEndTime), 'HH:mm')}`}
                            </div>
                            <div className="text-[10px] text-white/30 line-through">
                              {format(new Date(it.reschedulePending.fromStartTime), "d 'de' MMM", { locale: es })} · {format(new Date(it.reschedulePending.fromStartTime), 'HH:mm')}
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

                    {
                      (pending || (isRescheduleRequest && !isRescheduleResolved)) && (() => {
                        // Determine if current user should see action buttons
                        // Hide if: 
                        // 1. User sent the original invitation (invitedByUserId === userId)
                        // 2. User is client AND invitedByRole is 'client' (client sent request to coach)
                        // 3. User requested the reschedule (for reschedule requests)

                        const isSentByMe = it.invitedByUserId === userId
                        const isClientSentRequest = role === 'client' && it.invitedByRole === 'client'
                        const isMyRescheduleRequest = isRescheduleRequest && it.reschedulePending?.requestedByUserId === userId

                        const shouldHideActions = isSentByMe || isClientSentRequest || isMyRescheduleRequest

                        if (shouldHideActions) return null

                        return (
                          <div className="mt-2 flex items-center justify-end gap-2">
                            <button
                              type="button"
                              disabled={isActing}
                              onClick={() => isRescheduleRequest ? respondToReschedule(it, 'rejected') : updateRsvp(it, 'declined')}
                              className="px-3 py-1.5 rounded-full text-xs font-semibold border border-white/15 text-white/80 hover:bg-white/10 disabled:opacity-50"
                            >
                              Rechazar
                            </button>
                            <button
                              type="button"
                              disabled={isActing}
                              onClick={() => isRescheduleRequest ? respondToReschedule(it, 'accepted') : updateRsvp(it, 'confirmed')}
                              className="px-3 py-1.5 rounded-full text-xs font-semibold border border-[#FF7939]/60 text-[#FFB366] hover:bg-[#FF7939]/10 disabled:opacity-50"
                            >
                              Aceptar
                            </button>
                          </div>
                        )
                      })()
                    }
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div >
  )
}
