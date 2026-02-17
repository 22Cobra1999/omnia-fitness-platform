import { useState, useMemo, useEffect, useCallback } from 'react'
import { startOfDay, addDays } from 'date-fns'

export type Role = 'client' | 'coach'

export type NotificationItem = {
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
        requestedByUserId: string | null
        status?: 'pending' | 'accepted' | 'rejected'
    } | null
    meetLink: string | null
    otherUserId: string
    otherUserName: string
    rsvpStatus: string
    invitedByRole: string | null
    invitedByUserId: string | null
    isCreator: boolean
    updatedAt: string
}

interface UseMeetNotificationsLogicProps {
    open: boolean
    role: Role
    supabase: any
    userId: string
    coachId?: string | null
}

export function useMeetNotificationsLogic({
    open,
    role,
    supabase,
    userId,
    coachId
}: UseMeetNotificationsLogicProps) {
    const [loading, setLoading] = useState(false)
    const [items, setItems] = useState<NotificationItem[]>([])
    const [error, setError] = useState<string | null>(null)
    const [actingId, setActingId] = useState<string | null>(null)
    const [filter, setFilter] = useState<'all' | 'pending' | 'accepted'>('pending')

    const range = useMemo(() => {
        const now = new Date()
        return {
            from: startOfDay(now).toISOString(),
            to: addDays(now, 365).toISOString(),
            nowIso: now.toISOString(),
        }
    }, [])

    const load = useCallback(async () => {
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
                        const isCreator = String(ev.created_by_user_id) === userId
                        let rsvpStatus = p ? String(p.rsvp_status || 'pending') : 'pending'
                        const updatedAt = p?.updated_at || ev.start_time
                        const endIso = ev.end_time ? String(ev.end_time) : null
                        const startIso = String(ev.start_time)
                        const endsAfterNow = endIso ? endIso >= range.nowIso : startIso >= range.nowIso

                        if (!endsAfterNow) return

                        const invitedByRole = p?.invited_by_role == null ? null : String(p.invited_by_role)
                        const cId = String(ev?.coach_id || '')
                        const coachName = coachIdToName[cId] || 'Coach'
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
                                status: rs.status
                            } : null,
                            meetLink: ev.google_meet_data?.meet_link ? String(ev.google_meet_data.meet_link) : null,
                            otherUserId: cId,
                            otherUserName: coachName,
                            rsvpStatus,
                            invitedByRole,
                            invitedByUserId: p?.invited_by_user_id || null,
                            isCreator,
                            updatedAt: String(updatedAt),
                        }
                        itemsMap.set(eid, item)
                    })

                const out = Array.from(itemsMap.values())
                out.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
                setItems(out.slice(0, 30))
                return
            }

            // Coach Role Logic
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

            const { data: parts } = await supabase
                .from('calendar_event_participants')
                .select('event_id, user_id, rsvp_status, updated_at, role, invited_by_user_id')
                .in('event_id', eventIds)
                .order('updated_at', { ascending: false })

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

            const itemsMap = new Map<string, NotificationItem>()
                ; (events || []).forEach((ev: any) => {
                    const eid = String(ev.id)
                    const clientPart = (parts || []).find((p: any) => String(p.event_id) === eid && String(p.user_id) !== String(userId))
                    const rsvp = clientPart ? String(clientPart.rsvp_status || 'pending') : 'confirmed'
                    const updateTime = clientPart ? String(clientPart.updated_at || ev.start_time) : String(ev.start_time)

                    let targetCId = clientPart ? String(clientPart.user_id) : (ev.created_by_user_id && String(ev.created_by_user_id) !== String(userId) ? String(ev.created_by_user_id) : '')

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
                        isCreator: String(ev.created_by_user_id) === String(userId),
                        updatedAt: latestRs && new Date(latestRs.created_at) > new Date(updateTime) ? latestRs.created_at : updateTime
                    }

                    const now = new Date()
                    const eventEnd = ev.end_time ? new Date(ev.end_time) : new Date(ev.start_time)
                    if (eventEnd >= now || (now.getTime() - new Date(item.updatedAt).getTime()) < (10 * 24 * 60 * 60 * 1000)) {
                        itemsMap.set(eid, item)
                    }
                })

            const final = Array.from(itemsMap.values())
            final.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
            setItems(final.slice(0, 30))
        } finally {
            setLoading(false)
        }
    }, [open, role, userId, coachId, range, supabase])

    const updateRsvp = async (it: NotificationItem, nextStatus: 'confirmed' | 'declined') => {
        setActingId(it.id)
        try {
            const { error: partError } = await supabase
                .from('calendar_event_participants')
                .update({ rsvp_status: nextStatus === 'confirmed' ? 'accepted' : 'declined' }) // DB uses 'accepted'
                .eq('event_id', it.eventId)
                .eq('user_id', userId)

            if (partError) throw partError

            // If accepted and it's a 1-to-1 meet, confirm the event too
            if (nextStatus === 'confirmed' && it.invitedByRole !== 'workshop') {
                await supabase
                    .from('calendar_events')
                    .update({ status: 'confirmed' })
                    .eq('id', it.eventId)
            }

            await load()
        } catch (e) {
            console.error('Error updating RSVP:', e)
            setError('No se pudo actualizar la asistencia.')
        } finally {
            setActingId(null)
        }
    }

    const respondToReschedule = async (it: NotificationItem, action: 'accepted' | 'rejected') => {
        if (!it.reschedulePending) return
        setActingId(it.id)
        try {
            // 1. Update request status
            const { error: reqErr } = await supabase
                .from('calendar_event_reschedule_requests')
                .update({ status: action === 'accepted' ? 'accepted' : 'declined' }) // DB uses 'accepted'/'declined'
                .eq('event_id', it.eventId)
                .eq('status', 'pending')

            if (reqErr) throw reqErr

            // 2. If accepted, update event time and status
            if (action === 'accepted') {
                const { error: evtErr } = await supabase
                    .from('calendar_events')
                    .update({
                        start_time: it.reschedulePending.toStartTime,
                        end_time: it.reschedulePending.toEndTime,
                        status: 'confirmed'
                    })
                    .eq('id', it.eventId)
                if (evtErr) throw evtErr
            }

            await load()
        } catch (e) {
            console.error('Error responding to reschedule:', e)
            setError('No se pudo procesar la reprogramación.')
        } finally {
            setActingId(null)
        }
    }

    useEffect(() => {
        load()
    }, [load])

    const describe = (it: NotificationItem) => {
        const isMe = (targetId: string | null) => targetId === userId
        const otherName = it.otherUserName

        if (it.reschedulePending) {
            const rStatus = it.reschedulePending.status
            const requestedByMe = isMe(it.reschedulePending.requestedByUserId)

            if (rStatus === 'accepted') {
                return requestedByMe ? 'Tu solicitud de nuevo horario fue aceptada' : `Aceptaste la reprogramación de ${otherName}`
            }
            if (rStatus === 'rejected' || rStatus === 'declined') {
                return requestedByMe ? 'Tu solicitud de nuevo horario fue rechazada' : `Rechazaste la reprogramación de ${otherName}`
            }
            return requestedByMe ? 'Solicitaste un cambio de horario' : `${otherName} solicitó reprogramar`
        }

        if (role === 'coach') {
            if (it.rsvpStatus === 'pending') {
                const iSentInvite = it.invitedByUserId ? isMe(it.invitedByUserId) : it.isCreator
                return iSentInvite ? `Enviaste una invitación a ${otherName}` : `${otherName} solicitó una meet`
            }
            if (it.rsvpStatus === 'accepted' || it.rsvpStatus === 'confirmed') {
                const iSentInvite = it.invitedByUserId ? isMe(it.invitedByUserId) : it.isCreator
                return iSentInvite ? `${otherName} aceptó la invitación` : `Confirmaste la meet con ${otherName}`
            }
            if (it.rsvpStatus === 'declined') {
                return isMe(it.invitedByUserId) ? `Rechazaste la solicitud de ${otherName}` : `${otherName} rechazó la meet`
            }
            if (it.rsvpStatus === 'cancelled') {
                return isMe(it.invitedByUserId) ? `Cancelaste la meet con ${otherName}` : `${otherName} canceló la meet`
            }
        } else {
            // Client role
            if (it.rsvpStatus === 'cancelled' || it.rsvpStatus === 'declined') {
                const wasCancelledByMe = it.invitedByUserId ? (it.invitedByUserId === userId) : it.isCreator
                return wasCancelledByMe ? `Cancelaste tu solicitud a ${otherName}` : `${otherName} canceló la meet`
            }
            if (it.rsvpStatus === 'pending') {
                const isInvitedByMe = it.invitedByUserId ? (it.invitedByUserId === userId) : it.isCreator
                return isInvitedByMe ? `Solicitaste una meet a ${otherName}` : `${otherName} te invitó a una meet`
            }
            if (it.rsvpStatus === 'accepted' || it.rsvpStatus === 'confirmed') {
                const isInvitedByMe = it.invitedByUserId ? (it.invitedByUserId === userId) : it.isCreator
                return isInvitedByMe ? `${otherName} aceptó tu solicitud` : `Confirmaste la meet con ${otherName}`
            }
        }
        return `Actualización de meet con ${otherName}`
    }

    const filteredItems = useMemo(() => {
        if (filter === 'all') return items
        if (filter === 'pending') {
            return items.filter(it => {
                if (it.rsvpStatus === 'cancelled') return true
                if (it.reschedulePending?.status === 'pending') return true
                if (it.rsvpStatus === 'pending') return true
                return false
            })
        }
        if (filter === 'accepted') {
            return items.filter(it => {
                const hasPendingReschedule = it.reschedulePending?.status === 'pending'
                return (it.rsvpStatus === 'confirmed' || it.rsvpStatus === 'accepted' || it.rsvpStatus === 'rescheduled') && !hasPendingReschedule
            })
        }
        return items
    }, [items, filter])

    return {
        loading,
        error,
        items,
        filteredItems,
        filter,
        setFilter,
        actingId,
        updateRsvp,
        respondToReschedule,
        describe,
        load
    }
}
