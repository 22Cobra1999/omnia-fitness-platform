import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/supabase-client'
import { startOfMonth, endOfMonth, addDays, startOfWeek } from 'date-fns'

export const useCalendarData = (
    activityIds: string[],
    meetViewMode: 'month' | 'week' | 'day_split',
    meetWeekStart: Date
) => {
    const supabase = useMemo(() => createClient(), [])

    // Core Date State
    const [currentDate, setCurrentDate] = useState<Date>(new Date())
    const [selectedDate, setSelectedDate] = useState<Date | null>(new Date())
    const [authUserId, setAuthUserId] = useState<string | null>(null)

    // Data State
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
                workshopMinutesTotal: number
                hasWorkshop: boolean
                meetsMinutes: number
                pendingExercises: number
                pendingPlates: number
            }
        >
    >({})

    // Meet Events State (Needed for calendar display)
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
                status?: string | null
                event_type?: string | null
                cancelled_by_user_id?: string | null
                cancellation_reason?: string | null
                cancelled_at?: string | null
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

    const [discoveredActivityIds, setDiscoveredActivityIds] = useState<string[]>([])

    // Load Auth User
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

    // Load Activity Info
    const allRelevantIds = useMemo(() => {
        const set = new Set([...activityIds, ...discoveredActivityIds])
        return Array.from(set)
    }, [activityIds, discoveredActivityIds])

    useEffect(() => {
        const loadAllActivityInfo = async () => {
            if (allRelevantIds.length === 0) return

            const missingIds = allRelevantIds.filter(id => !activitiesInfo[id])
            if (missingIds.length === 0) return

            try {
                const { data: activitiesData, error } = await supabase
                    .from('activities')
                    .select('id, title, type, categoria, coach_id')
                    .in('id', missingIds)

                if (error) {
                    console.error('Error fetching activities info:', error)
                    return
                }

                if (activitiesData) {
                    setActivitiesInfo((prev) => {
                        const next = { ...prev }
                        activitiesData.forEach((a: any) => {
                            next[String(a.id)] = a
                        })
                        return next
                    })
                }
            } catch (err) {
                console.error('Error loading activity info:', err)
            }
        }

        loadAllActivityInfo()
    }, [allRelevantIds, activitiesInfo, supabase])

    // Load Day Minutes and Meets (Aggregated View + Event Participants)
    // Load Day Minutes and Meets
    const loadDayMinutes = useCallback(async () => {
        try {
            if (!authUserId) {
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
                const bufferedStart = addDays(monthStart, -7)
                const bufferedEnd = addDays(monthEnd, 14)
                startISO = bufferedStart.toISOString().split('T')[0]
                endISO = bufferedEnd.toISOString().split('T')[0]
            }

            // 1. Fetch Daily Progress from the new table
            const anySupabase = supabase as any
            const { data: rows, error: progError } = await anySupabase
                .from('progreso_diario_actividad')
                .select('id, actividad_id, fecha, area, items_objetivo, items_completados, minutos, tipo, minutos_objetivo')
                .eq('cliente_id', authUserId)
                .neq('tipo', 'documento')
                .gte('fecha', startISO)
                .lte('fecha', endISO)

            if (progError) {
                console.error('Error fetching progreso_diario_actividad:', progError)
            }

            const agg: Record<string, any> = {};
            const newActivitiesByDate: Record<string, any[]> = {};

            (rows || []).forEach((row: any) => {
                const dayKey = String(row.fecha).split('T')[0]
                if (!agg[dayKey]) {
                    agg[dayKey] = {
                        fitnessMinutesTotal: 0,
                        fitnessMinutesPending: 0,
                        nutritionMinutesTotal: 0,
                        nutritionMinutesPending: 0,
                        workshopMinutesTotal: 0,
                        hasWorkshop: false,
                        meetsMinutes: 0,
                        pendingExercises: 0,
                        pendingPlates: 0,
                    }
                }

                const foundIds = new Set<string>()
                if (row.actividad_id) foundIds.add(String(row.actividad_id))
                if (foundIds.size > 0) {
                    setDiscoveredActivityIds(prev => {
                        const next = new Set([...prev, ...Array.from(foundIds)])
                        if (next.size === prev.length) return prev
                        return Array.from(next)
                    })
                }

                const objCount = Number(row.items_objetivo) || 0
                const complCount = Number(row.items_completados) || 0
                const pendingCount = objCount - complCount

                const mins_obj = Number(row.minutos_objetivo) || 0


                // Calculate Proportional Pending Minutes
                const remainingRatio = objCount > 0 ? (Math.max(0, pendingCount) / objCount) : 1
                const pendingMins = Math.round(mins_obj * remainingRatio)

                if (row.tipo === 'taller') {
                    agg[dayKey].workshopMinutesTotal += mins_obj
                    agg[dayKey].hasWorkshop = true
                } else if (row.tipo === 'programa') {
                    if (row.area === 'fitness') {
                        agg[dayKey].fitnessMinutesTotal += mins_obj
                        agg[dayKey].pendingExercises += Math.max(0, pendingCount)
                        if (pendingCount > 0) agg[dayKey].fitnessMinutesPending += pendingMins
                    } else if (row.area === 'nutricion') {
                        agg[dayKey].nutritionMinutesTotal += mins_obj
                        agg[dayKey].pendingPlates += Math.max(0, pendingCount)
                        if (pendingCount > 0) agg[dayKey].nutritionMinutesPending += pendingMins
                    }
                }

                if (row.actividad_id) {
                    const aid = String(row.actividad_id)
                    if (!newActivitiesByDate[dayKey]) newActivitiesByDate[dayKey] = []
                    if (!newActivitiesByDate[dayKey].find(a => a.id === aid)) {
                        newActivitiesByDate[dayKey].push({
                            id: aid,
                            fecha: dayKey,
                            type: 'activity',
                        })
                    }
                }
            })

            // 2. Client Calendar Events (Meets)
            const { data: myParts, error: myPartsError } = await anySupabase
                .from('calendar_event_participants')
                .select('event_id, rsvp_status, invited_by_user_id')
                .eq('user_id', authUserId)

            if (myPartsError) console.error('Error fetching participants:', myPartsError)

            const { data: createdEvents } = await anySupabase
                .from('calendar_events')
                .select('id')
                .eq('created_by_user_id', authUserId)
                .gte('start_time', `${startISO}T00:00:00`)
                .lte('start_time', `${endISO}T23:59:59`)

            const eventIdToParticipantInfo: Record<string, { rsvp: string, invitedBy?: string }> = {}
                ; (myParts || []).forEach((p: any) => {
                    eventIdToParticipantInfo[String(p.event_id)] = { rsvp: p.rsvp_status, invitedBy: p.invited_by_user_id }
                })
                ; (createdEvents || []).forEach((ev: any) => {
                    const eid = String(ev.id)
                    // If I created it, I am auto-confirmed (unless I have a specific participant row saying otherwise)
                    if (!eventIdToParticipantInfo[eid]) {
                        eventIdToParticipantInfo[eid] = { rsvp: 'confirmed', invitedBy: authUserId }
                    }
                })

            const myEventIds = Object.keys(eventIdToParticipantInfo)
            const newMeetEventsByDate: Record<string, any[]> = {}

            if (myEventIds.length > 0) {
                const { data: eventsData } = await anySupabase
                    .from('calendar_events')
                    .select('*, cancelled_by_user_id, cancellation_reason, cancelled_at, invited_by_user_id')
                    .in('id', myEventIds)
                    .gte('start_time', `${startISO}T00:00:00`)
                    .lte('start_time', `${endISO}T23:59:59`)

                // Safe fetch for participant names
                let participantsByEventId: Record<string, any[]> = {}
                try {
                    const { data: partsData } = await anySupabase
                        .from('calendar_event_participants')
                        .select('event_id, user_id, is_creator, rsvp_status, invited_by_user_id, user_profiles(full_name, avatar_url)')
                        .in('event_id', myEventIds)

                    if (partsData) {
                        partsData.forEach((p: any) => {
                            const eid = String(p.event_id)
                            if (!participantsByEventId[eid]) participantsByEventId[eid] = []
                            participantsByEventId[eid].push({
                                user_id: p.user_id,
                                name: p.user_profiles?.full_name || 'Participante',
                                full_name: p.user_profiles?.full_name || 'Participante',
                                avatar_url: p.user_profiles?.avatar_url || null,
                                is_organizer: p.is_creator || (p.invited_by_user_id && p.user_id === p.invited_by_user_id),
                                rsvp_status: p.rsvp_status
                            })
                        })
                    }

                    // ENSURE COACH IS PRESENT (Fallback for older records)
                    myEventIds.forEach(eid => {
                        const event = eventsData?.find((e: any) => String(e.id) === eid)
                        if (!event || event.event_type !== 'meet') return

                        const coachId = String(event.coach_id)
                        const parts = participantsByEventId[eid] || []
                        const hasCoach = parts.some(p => String(p.user_id) === coachId)

                        if (!hasCoach) {
                            if (!participantsByEventId[eid]) participantsByEventId[eid] = []
                            participantsByEventId[eid].push({
                                user_id: coachId,
                                name: 'Coach',
                                full_name: 'Coach',
                                avatar_url: null,
                                is_organizer: false,
                                rsvp_status: 'pending'
                            })
                        }
                    })
                } catch (e) {
                    console.error('Error fetching participant details:', e)
                    // Continue without participant names
                }

                // Fetch pending reschedule requests
                let pendingReschedulesByEventId: Record<string, any> = {}
                try {
                    const { data: reschedules } = await anySupabase
                        .from('calendar_event_reschedule_requests')
                        .select('event_id, status, requested_by_user_id, created_at, to_start_time, to_end_time, from_start_time, reason, note')
                        .in('event_id', myEventIds)
                        .eq('status', 'pending')

                    if (reschedules) {
                        reschedules.forEach((r: any) => {
                            const eid = String(r.event_id)
                            const current = pendingReschedulesByEventId[eid]

                            // If we already have a request for this event
                            if (current) {
                                const currentCreated = new Date(current.created_at).getTime()
                                const newCreated = new Date(r.created_at).getTime()
                                if (newCreated > currentCreated) {
                                    pendingReschedulesByEventId[eid] = r
                                }
                            } else {
                                // No request yet, take this one
                                pendingReschedulesByEventId[eid] = r
                            }
                        })
                    }
                } catch (e) {
                    console.error('Error fetching reschedules:', e)
                }

                if (eventsData) {
                    eventsData.forEach((e: any) => {
                        const s = new Date(e.start_time)
                        const dayKey = s.toISOString().split('T')[0]
                        if (!newMeetEventsByDate[dayKey]) newMeetEventsByDate[dayKey] = []

                        const durationMs = new Date(e.end_time).getTime() - s.getTime()
                        const mins = Math.round(durationMs / 60000)

                        if (!agg[dayKey]) {
                            agg[dayKey] = {
                                fitnessMinutesTotal: 0,
                                fitnessMinutesPending: 0,
                                nutritionMinutesTotal: 0,
                                nutritionMinutesPending: 0,
                                workshopMinutesTotal: 0,
                                hasWorkshop: false,
                                meetsMinutes: 0,
                                pendingExercises: 0,
                                pendingPlates: 0,
                            }
                        }
                        agg[dayKey].meetsMinutes += mins

                        const pendingReschedule = pendingReschedulesByEventId[String(e.id)]

                        newMeetEventsByDate[dayKey].push({
                            id: e.id,
                            pending_reschedule: pendingReschedule || null,
                            title: e.title,
                            start_time: e.start_time,
                            end_time: e.end_time,
                            coach_id: e.coach_id,
                            description: e.description,
                            rsvp_status: eventIdToParticipantInfo[e.id]?.rsvp || 'pending',
                            status: e.status,
                            event_type: e.event_type,
                            participants: participantsByEventId[e.id] || [],
                            cancelled_by_user_id: e.cancelled_by_user_id,
                            cancellation_reason: e.cancellation_reason,
                            cancelled_at: e.cancelled_at,
                            invited_by_user_id: e.invited_by_user_id
                        })
                    })
                }
            }

            setActivitiesByDate(newActivitiesByDate)
            setDayMinutesByDate(agg)

            console.log('[useCalendarData] loadDayMinutes SETTING EVENTS:', {
                count: Object.keys(newMeetEventsByDate).length,
                sample: Object.values(newMeetEventsByDate)[0]?.[0]
            })

            setMeetEventsByDate(newMeetEventsByDate)

        } catch (err) {
            console.error('Error in loadDayMinutes:', err)
        }
    }, [authUserId, currentDate, meetViewMode, meetWeekStart, supabase])

    // Load breakdown when selected date changes
    const loadSelectedDayBreakdown = useCallback(async () => {
        if (!selectedDate || !authUserId) {
            setSelectedDayActivityItems([])
            return
        }

        const dayKey = selectedDate.toISOString().split('T')[0]

        try {
            const anySupabase = supabase as any
            const { data: progData, error: progError } = await anySupabase
                .from('progreso_diario_actividad')
                .select('actividad_id, items_objetivo, items_completados, minutos, minutos_objetivo, area, tipo')
                .eq('cliente_id', authUserId)
                .neq('tipo', 'documento')
                .eq('fecha', dayKey)

            if (progError) {
                console.error('Error loading day breakdown:', progError)
                return
            }

            const itemsMap: Record<string, any> = {}

                ; (progData || []).forEach((row: any) => {
                    const aid = row.actividad_id ? String(row.actividad_id) : `general-${row.area}`
                    const act = activitiesInfo[aid] || {
                        title: row.area === 'fitness' ? 'Fitness' : row.area === 'nutricion' ? 'Nutrición' : 'Actividad',
                        categoria: row.area,
                        color_theme: row.tipo === 'taller' ? 'blue' : (row.area === 'fitness' ? 'orange' : row.area === 'nutricion' ? 'green' : 'blue')
                    }

                    let borderClass = 'border-white/10'
                    let bgClass = 'bg-white/5'
                    if (act.color_theme === 'orange') { borderClass = 'border-orange-500/20'; bgClass = 'bg-orange-500/5' }
                    else if (act.color_theme === 'blue') { borderClass = 'border-blue-500/20'; bgClass = 'bg-blue-500/5' }
                    else if (act.color_theme === 'green') { borderClass = 'border-green-500/20'; bgClass = 'bg-green-500/5' }

                    if (!itemsMap[aid]) {
                        itemsMap[aid] = {
                            activityId: aid,
                            activityTitle: act.title || '',
                            activityTypeLabel: act.categoria || row.area || 'Actividad',
                            area: row.area,
                            tipo: row.tipo,
                            borderClass,
                            bgClass,
                            pendingCountLabel: '',
                            pendingMinutes: 0,
                            totalCount: 0,
                            pendingCount: 0
                        }
                    }


                    const pending = (row.items_objetivo || 0) - (row.items_completados || 0)
                    const totalObj = Math.max(1, row.items_objetivo || 1) // Prevent division by zero
                    const targetMins = row.minutos_objetivo || 0

                    // Proportional Remaining Minutes Calculation
                    // If items_objetivo is 0 (shouldn't happen for valid programs), we assume all pending
                    const remainingRatio = (row.items_objetivo || 0) > 0
                        ? (Math.max(0, pending) / row.items_objetivo)
                        : 1

                    const minsRemaining = Math.round(targetMins * remainingRatio)

                    itemsMap[aid].totalCount += (row.items_objetivo || 0)
                    itemsMap[aid].pendingCount += Math.max(0, pending)
                    itemsMap[aid].pendingMinutes += minsRemaining
                })

            const result = Object.values(itemsMap).map((i: any) => {
                i.pendingCountLabel = `${i.totalCount - i.pendingCount}/${i.totalCount}`
                return i
            })

            setSelectedDayActivityItems(result)

        } catch (err) {
            console.error('Error loading detailed breakdown:', err)
        }
    }, [selectedDate, authUserId, activitiesInfo, supabase])


    // Effect to trigger loadDayMinutes when dependencies change
    useEffect(() => {
        loadDayMinutes()
    }, [loadDayMinutes])

    // Effect to trigger breakdown load
    useEffect(() => {
        loadSelectedDayBreakdown()
    }, [loadSelectedDayBreakdown])


    return {
        // State
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

        // Actions
        loadDayMinutes,
        loadSelectedDayBreakdown
    }
}
