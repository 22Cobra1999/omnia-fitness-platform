import { useState, useCallback, useRef } from "react"
import { createClient } from "@/lib/supabase/supabase-client"
import { startOfMonth, endOfMonth, subMonths, addMonths } from "date-fns"
import { CalendarEvent } from "@/components/coach/coach-calendar-screen"

export function useCoachEvents(currentDate: Date, googleConnected: boolean) {
    const [events, setEvents] = useState<CalendarEvent[]>([])
    const [loading, setLoading] = useState(true)
    const cachedEvents = useRef<Map<string, CalendarEvent[]>>(new Map()) // Use Ref to avoid re-renders
    const [coachId, setCoachId] = useState<string | null>(null)
    const [coachProfile, setCoachProfile] = useState<{ id: string, name: string, avatar_url: string | null } | null>(null)

    const supabase = createClient()

    const getCoachEvents = useCallback(async (force = false) => {
        try {
            const cacheKey = `${currentDate.getFullYear()}-${currentDate.getMonth()}`

            if (!force && cachedEvents.current.has(cacheKey)) {
                const cached = cachedEvents.current.get(cacheKey) || []
                setEvents(cached)
                setLoading(false)

                const prevMonth = subMonths(currentDate, 1)
                const nextMonth = addMonths(currentDate, 1)
                const prevKey = `${prevMonth.getFullYear()}-${prevMonth.getMonth()}`
                const nextKey = `${nextMonth.getFullYear()}-${nextMonth.getMonth()}`

                if (cachedEvents.current.has(prevKey) && cachedEvents.current.has(nextKey)) {
                    return
                }
            }

            setLoading(true)

            const { data: { user }, error: userError } = await supabase.auth.getUser()
            if (userError || !user) {
                setLoading(false)
                setEvents([])
                return
            }

            const currentCoachId = user.id
            setCoachId(currentCoachId)

            if (!coachProfile) {
                const { data: profile } = await supabase.from('user_profiles').select('id, full_name, avatar_url').eq('id', user.id).single()
                if (profile) {
                    setCoachProfile({
                        id: profile.id,
                        name: profile.full_name || 'Coach',
                        avatar_url: profile.avatar_url
                    })
                }
            }

            const monthStart = startOfMonth(subMonths(currentDate, 1))
            const monthEnd = endOfMonth(addMonths(currentDate, 1))
            const monthNum = currentDate.getMonth()
            const year = currentDate.getFullYear()
            const monthStartISO = monthStart.toISOString()
            const monthEndISO = monthEnd.toISOString()

            let calendarEvents: any[] = []

            const { data: ownedEvents, error: ownedError } = await supabase
                .from('calendar_events')
                .select(`
                  id, title, start_time, end_time, event_type, status,
                  description, coach_id, created_by_user_id, invited_by_user_id,
                  google_meet_data, pricing_data, relations_data, timing_data,
                  cancelled_by_user_id, cancellation_reason, cancelled_at
                `)
                .eq('coach_id', currentCoachId)
                .gte('start_time', monthStartISO)
                .lte('start_time', monthEndISO)

            const { data: guestEventsRaw, error: guestError } = await supabase
                .from('calendar_event_participants')
                .select(`
                  event_id,
                  calendar_events!inner(
                    id, title, start_time, end_time, event_type, status,
                    description, coach_id, created_by_user_id, invited_by_user_id,
                    google_meet_data, pricing_data, relations_data, timing_data,
                    cancelled_by_user_id, cancellation_reason, cancelled_at
                  )
                `)
                .eq('user_id', currentCoachId)
                .gte('calendar_events.start_time', monthStartISO)
                .lte('calendar_events.start_time', monthEndISO)

            if (ownedError && guestError) {
                console.error("Error getting events from Supabase:", ownedError, guestError)
            } else {
                const merged = [...(ownedEvents || [])]
                const existingIds = new Set(merged.map(e => e.id))
                if (guestEventsRaw) {
                    guestEventsRaw.forEach((row: any) => {
                        const ev = row.calendar_events
                        if (ev && !existingIds.has(ev.id)) {
                            merged.push(ev)
                            existingIds.add(ev.id)
                        }
                    })
                }
                calendarEvents = merged
            }

            const omniaEventIds = (calendarEvents || []).map((e: any) => e?.id).filter(Boolean)
            const reschedulesByEventId = new Map<string, any>()
            const countByEvent = new Map<string, number>()
            const confirmedCountByEvent = new Map<string, number>()
            const guestsCountByEvent = new Map<string, number>()
            const rsvpByEvent = new Map<string, string>()
            const myRsvpByEvent = new Map<string, string>()
            let allParticipants: any[] = []

            if (omniaEventIds.length > 0) {
                // Fetch reschedules
                const { data: reschedules } = await supabase
                    .from('calendar_event_reschedule_requests')
                    .select('*')
                    .in('event_id', omniaEventIds as any)
                    .order('created_at', { ascending: false })

                if (reschedules) {
                    // console.log('🔍 [useCoachEvents] Total reschedules recuperados:', reschedules.length)
                    reschedules.forEach((r: any) => {
                        const eid = String(r.event_id)
                        const current = reschedulesByEventId.get(eid)
                        if (!current || (current.status !== 'pending' && r.status === 'pending')) {
                            reschedulesByEventId.set(eid, r)
                        }
                    })
                }

                // Fetch participants
                const { data: participantsData } = await supabase
                    .from('calendar_event_participants')
                    .select('event_id, rsvp_status, user_id, role')
                    .in('event_id', omniaEventIds as any)

                if (participantsData) {
                    allParticipants = participantsData
                    allParticipants.forEach((p: any) => {
                        const eid = String(p?.event_id || '')
                        if (!eid) return
                        countByEvent.set(eid, (countByEvent.get(eid) || 0) + 1)

                        const pUserId = String(p.user_id || '')
                        const isCoach = pUserId === currentCoachId || p.role === 'coach' || p.role === 'host'

                        if (!isCoach) {
                            guestsCountByEvent.set(eid, (guestsCountByEvent.get(eid) || 0) + 1)
                            const isConfirmed = p.rsvp_status === 'confirmed' || p.rsvp_status === 'accepted'
                            if (isConfirmed) {
                                confirmedCountByEvent.set(eid, (confirmedCountByEvent.get(eid) || 0) + 1)
                            }

                            const currentRsvp = rsvpByEvent.get(eid)
                            if (isConfirmed) {
                                rsvpByEvent.set(eid, 'confirmed')
                            } else if (!currentRsvp || currentRsvp === 'pending') {
                                rsvpByEvent.set(eid, p.rsvp_status || 'pending')
                            }
                        } else {
                            myRsvpByEvent.set(eid, p.rsvp_status || 'pending')
                        }
                    })
                }
            }

            const ghostEvents: any[] = []
            calendarEvents = calendarEvents.map((e: any) => {
                const eid = String(e?.id || '')
                const count = countByEvent.get(eid) || 0
                const pendingReschedule = reschedulesByEventId.get(eid)
                const participants = allParticipants.filter((p: any) => String(p.event_id) === eid)
                const clientParticipant = participants.find((p: any) => p.role !== 'coach' && p.role !== 'host')
                const clientId = clientParticipant ? clientParticipant.user_id : (e.created_by_user_id !== currentCoachId ? e.created_by_user_id : null)

                /* 
                if (eid === '7ca77961-fd5c-456a-96ed-7c76f60ea182' || e.start_time.includes('2024-02-18')) {
                    console.log('🔍 [useCoachEvents] Procesando evento del 18:', e.title, 'ID:', eid)
                    console.log('🔍 [useCoachEvents] Reschedule:', pendingReschedule?.status || 'NINGUNO')
                    console.log('🔍 [useCoachEvents] RSVP representativo:', rsvpByEvent.get(eid) || 'confirmed')
                }
                */

                const enriched = {
                    ...e,
                    meet_link: e.google_meet_data?.meet_link,
                    google_event_id: e.google_meet_data?.google_event_id,
                    activity_id: e.relations_data?.activity_id,
                    enrollment_id: e.relations_data?.enrollment_id,
                    price: e.pricing_data?.price,
                    currency: e.pricing_data?.currency,
                    is_free: e.pricing_data?.is_free ?? true,
                    client_id: clientId,
                    current_participants: count,
                    confirmed_participants: confirmedCountByEvent.get(eid) || 0,
                    total_guests: guestsCountByEvent.get(eid) || 0,
                    rsvp_status: rsvpByEvent.get(eid) || 'confirmed',
                    my_rsvp: myRsvpByEvent.get(eid) || 'confirmed',
                    max_participants: e.relations_data?.max_participants ?? (count > 0 ? count : null),
                    pending_reschedule: pendingReschedule
                }

                return enriched
            })

            let googleEvents: CalendarEvent[] = []
            try {
                const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'
                const googleResponse = await fetch(
                    `${baseUrl}/api/google/calendar/events?monthNum=${monthNum}&year=${year}`,
                    { credentials: 'include' }
                )

                if (googleResponse.ok) {
                    const googleData = await googleResponse.json()
                    if (googleData.success && googleData.events) {
                        googleEvents = googleData.events.map((event: any) => ({
                            ...event,
                            is_google_event: true,
                            source: 'google_calendar',
                        }))
                    }
                }
            } catch (gErr) {
                console.warn("Google Calendar error (ignoring):", gErr)
            }

            let allEvents: CalendarEvent[] = []
            if (calendarEvents.length > 0) {
                const clientIds = [...new Set(calendarEvents.map(e => e.client_id).filter(Boolean))]
                let clientNames: Record<string, string> = {}
                if (clientIds.length > 0) {
                    const { data: clients } = await supabase.from('user_profiles').select('id, full_name').in('id', clientIds)
                    if (clients) clients.forEach((c: any) => { clientNames[c.id] = c.full_name || 'Cliente' })
                }

                const activityIds = [...new Set(calendarEvents.map(e => e.activity_id).filter(Boolean))]
                let activityNames: Record<string, string> = {}
                if (activityIds.length > 0) {
                    const { data: activities } = await supabase.from('activities').select('id, title').in('id', activityIds)
                    if (activities) activities.forEach((a: any) => { activityNames[a.id] = a.title || 'Actividad' })
                }

                allEvents = calendarEvents.map(event => ({
                    ...event,
                    client_name: event.client_id ? clientNames[event.client_id] : undefined,
                    product_name: event.activity_id ? activityNames[event.activity_id] : undefined,
                    is_google_event: false,
                    source: 'omnia',
                }))
            }

            allEvents = [...allEvents, ...googleEvents]
            allEvents.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())

            const newCache = new Map(cachedEvents.current)
            for (let i = -1; i <= 1; i++) {
                const d = addMonths(currentDate, i)
                const k = `${d.getFullYear()}-${d.getMonth()}`
                const mS = startOfMonth(d)
                const mE = endOfMonth(d)
                newCache.set(k, allEvents.filter(e => {
                    const dt = new Date(e.start_time)
                    return dt >= mS && dt <= mE
                }))
            }
            cachedEvents.current = newCache

            const curStart = startOfMonth(currentDate)
            const curEnd = endOfMonth(currentDate)
            setEvents(allEvents.filter(e => {
                const dt = new Date(e.start_time)
                return dt >= curStart && dt <= curEnd
            }))

            if (typeof window !== 'undefined' && googleConnected && calendarEvents.length > 0) {
                const workshops = calendarEvents.filter(e =>
                    e.event_type === 'workshop' &&
                    !e.google_meet_data?.meet_link &&
                    !e.google_meet_data?.google_event_id &&
                    e.coach_id === currentCoachId
                )
                if (workshops.length > 0) {
                    Promise.all(workshops.map(async (e) => {
                        try {
                            const res = await fetch('/api/google/calendar/auto-create-meet', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ eventId: e.id }),
                            })
                            return (await res.json()).success
                        } catch { return false }
                    })).then(results => {
                        if (results.some(r => r === true)) setTimeout(() => getCoachEvents(), 2000)
                    })
                }
            }

        } catch (err: any) {
            console.error("❌ Error in getCoachEvents:", err)
            setEvents([])
        } finally {
            setLoading(false)
        }
    }, [currentDate, googleConnected, coachProfile, supabase]) // cachedEvents is REF, so no dep

    return {
        events,
        loading,
        setLoading,
        getCoachEvents,
        cachedEvents,
        coachId,
        coachProfile
    }
}
