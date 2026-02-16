
import { useState, useEffect, useMemo, useCallback } from 'react'
import { createClient } from '@/lib/supabase/supabase-client'

interface MeetEvent {
    id: string
    title?: string | null
    start_time: string
    end_time: string | null
    coach_id?: string | null
    meet_link?: string | null
    description?: string | null
    invited_by_user_id?: string | null
    status?: string | null
    event_type?: string | null
    max_participants?: number | null
}

export const useMeetLogic = (
    authUserId: string | null,
    meetEventsByDate: Record<string, any[]>,
    purchasedCoachIds: string[]
) => {
    const supabase = useMemo(() => createClient(), [])

    // Selected Meet State
    const [selectedMeetEvent, setSelectedMeetEvent] = useState<MeetEvent | null>(null)
    const [selectedMeetParticipants, setSelectedMeetParticipants] = useState<any[]>([])
    const [selectedMeetRsvpStatus, setSelectedMeetRsvpStatus] = useState<string>('pending') // derived from participants?
    // Actually selectedMeetRsvpStatus is usually for the current user. 
    // In the original file it was state. Let's keep it state but maybe we can derive it?
    // In CalendarView lines 1148-1152 (approx) it updates this when selecting meet.

    // Credits State
    const [meetCreditsByCoachId, setMeetCreditsByCoachId] = useState<Record<string, number>>({})

    // Reschedule State
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

    // Notifications
    const [meetNotificationsCount, setMeetNotificationsCount] = useState(0)

    // Load Participants for Selected Meet
    useEffect(() => {
        const fetchParticipants = async () => {
            if (!selectedMeetEvent?.id) {
                setSelectedMeetParticipants([])
                return
            }

            try {
                const { data: participants, error: pError } = await supabase
                    .from('calendar_event_participants')
                    .select('id, user_id, rsvp_status, payment_status, role, invited_by_user_id, is_creator')
                    .eq('event_id', selectedMeetEvent.id)

                if (pError) throw pError

                const clientIds = (participants || []).map((p: any) => p.user_id).filter(Boolean)
                const profileMap: Record<string, any> = {}

                if (clientIds.length > 0) {
                    const { data: profiles, error: profError } = await supabase
                        .from('user_profiles')
                        .select('id, full_name, avatar_url')
                        .in('id', clientIds)

                    if (!profError && profiles) {
                        profiles.forEach((p: any) => {
                            profileMap[p.id] = p
                        })
                    }
                }

                const parts = (participants || []).map((p: any) => ({
                    ...p,
                    name: profileMap[p.user_id]?.full_name || 'Participante',
                    full_name: profileMap[p.user_id]?.full_name || 'Participante',
                    avatar_url: profileMap[p.user_id]?.avatar_url,
                    role: p.role || 'client', // Ensure role is passed
                    is_organizer: p.is_creator || (p.invited_by_user_id && p.user_id === p.invited_by_user_id)
                }))

                setSelectedMeetParticipants(parts)

                // Update RSVP status for current user
                if (authUserId) {
                    const myPart = parts.find((p: any) => p.user_id === authUserId)
                    if (myPart) {
                        setSelectedMeetRsvpStatus(myPart.rsvp_status || 'pending')
                    } else if (selectedMeetEvent.invited_by_user_id === authUserId || (selectedMeetEvent as any).created_by_user_id === authUserId) {
                        // If I am the creator/inviter but not in participants list (rare but possible for logic), assume confirmed or retrieve from event
                        setSelectedMeetRsvpStatus('confirmed')
                    } else {
                        setSelectedMeetRsvpStatus('pending')
                    }
                }
            } catch (err) {
                console.error('Error fetching participants:', err)
            }
        }

        fetchParticipants()
    }, [selectedMeetEvent?.id, supabase, authUserId])

    // Load Meet Notification Count
    useEffect(() => {
        const loadMeetNotificationCount = async () => {
            try {
                if (!authUserId) {
                    setMeetNotificationsCount(0)
                    return
                }

                const now = new Date().toISOString()

                // 1. Get my participant records (pending or cancelled status)
                const { data: myParts, error: partsError } = await supabase
                    .from('calendar_event_participants')
                    .select('event_id, rsvp_status')
                    .eq('user_id', authUserId)
                    .in('rsvp_status', ['pending', 'cancelled'])

                if (partsError) {
                    setMeetNotificationsCount(0)
                    return
                }

                // 2. Get event IDs and filter for future events
                const eventIds = Array.from(new Set((myParts || []).map((p: any) => p.event_id).filter(Boolean)))

                if (eventIds.length === 0) {
                    setMeetNotificationsCount(0)
                    return
                }

                const { data: events } = await supabase
                    .from('calendar_events')
                    .select('id, end_time, start_time')
                    .in('id', eventIds)

                const futureEventIds = new Set(
                    (events || [])
                        .filter((e: any) => {
                            const endTime = e.end_time || e.start_time
                            return endTime && endTime >= now
                        })
                        .map((e: any) => e.id)
                )

                // 3. Count pending reschedule requests for my events
                const { data: reschedules } = await supabase
                    .from('calendar_event_reschedule_requests')
                    .select('event_id')
                    .in('event_id', eventIds)
                    .eq('status', 'pending')

                const rescheduleEventIds = new Set((reschedules || []).map((r: any) => r.event_id))

                // 4. Combine counts: participants with actionable status + pending reschedules
                const actionableEventIds = new Set([
                    ...(myParts || [])
                        .filter((p: any) => futureEventIds.has(p.event_id))
                        .map((p: any) => p.event_id),
                    ...rescheduleEventIds
                ])

                setMeetNotificationsCount(actionableEventIds.size)
            } catch (err) {
                console.error('Error loading notification count:', err)
                setMeetNotificationsCount(0)
            }
        }

        loadMeetNotificationCount()
    }, [supabase, meetEventsByDate, authUserId])

    // Open Meet By ID (Deep Linking or Notification Click)
    const openMeetById = useCallback(async (eventId: string) => {
        try {
            const all = Object.values(meetEventsByDate || {}).flat()
            const found = all.find((m: any) => String(m?.id || '') === String(eventId))
            if (found) {
                setSelectedMeetEvent(found as any)
                return
            }

            const { data: ev, error } = await (supabase.from('calendar_events') as any)
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
        } catch {
            // ignore
        }
    }, [meetEventsByDate, supabase])

    // Load Meet Credits
    useEffect(() => {
        const loadMeetCredits = async () => {
            try {
                if (!authUserId) {
                    setMeetCreditsByCoachId({})
                    return
                }

                const { data, error } = await (supabase
                    .from('client_meet_credits_ledger') as any)
                    .select('coach_id, meet_credits_available')
                    .eq('client_id', authUserId)

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
    }, [authUserId, supabase])

    // Load Pending Reschedule
    useEffect(() => {
        const loadPendingReschedule = async () => {
            try {
                if (!selectedMeetEvent?.id || !authUserId) {
                    setPendingReschedule(null)
                    return
                }

                const { data: rr, error } = await (supabase
                    .from('calendar_event_reschedule_requests') as any)
                    .select(
                        'id, from_start_time, from_end_time, to_start_time, to_end_time, note, status, created_at, requested_by_user_id'
                    )
                    .eq('event_id', selectedMeetEvent.id)
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
                    requested_by_user_id: row.requested_by_user_id
                        ? String(row.requested_by_user_id)
                        : null,
                })
            } catch {
                setPendingReschedule(null)
            }
        }

        loadPendingReschedule()
    }, [selectedMeetEvent?.id, authUserId, supabase])


    return {
        selectedMeetEvent,
        setSelectedMeetEvent,
        selectedMeetParticipants,
        meetCreditsByCoachId,
        pendingReschedule,
        setPendingReschedule,
        selectedMeetRsvpStatus,
        setSelectedMeetRsvpStatus,
        meetNotificationsCount,
        setMeetNotificationsCount,
        openMeetById,
        setSelectedMeetParticipants
    }
}
