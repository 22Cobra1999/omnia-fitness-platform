import { startOfMonth, endOfMonth, addDays } from 'date-fns'

interface DataFetchersProps {
    supabase: any
    authUserId: string | null
    currentDate: Date
    meetViewMode: 'month' | 'week' | 'day_split'
    meetWeekStart: Date
    activitiesInfo: Record<string, any>
    setActivitiesInfo: React.Dispatch<React.SetStateAction<Record<string, any>>>
    setActivitiesByDate: (data: Record<string, any[]>) => void
    setDayMinutesByDate: (data: Record<string, any>) => void
    setMeetEventsByDate: (data: Record<string, any[]>) => void
    setSelectedDayActivityItems: (data: any[]) => void
    setDiscoveredActivityIds: React.Dispatch<React.SetStateAction<string[]>>
    calculateAggregates: (rows: any[]) => any
    calculateBreakdown: (progData: any[], info: any) => any
}

export const useCalendarDataFetchers = ({
    supabase,
    authUserId,
    currentDate,
    meetViewMode,
    meetWeekStart,
    activitiesInfo,
    setActivitiesInfo,
    setActivitiesByDate,
    setDayMinutesByDate,
    setMeetEventsByDate,
    setSelectedDayActivityItems,
    setDiscoveredActivityIds,
    calculateAggregates,
    calculateBreakdown
}: DataFetchersProps) => {

    const loadActivityInfo = async (ids: string[]) => {
        if (ids.length === 0) return

        const missingIds = ids.filter(id => !activitiesInfo[id])
        if (missingIds.length === 0) return

        try {
            const { data, error } = await supabase
                .from('activities')
                .select('id, title, type, categoria, coach_id')
                .in('id', missingIds)

            if (data) {
                setActivitiesInfo(prev => {
                    const next = { ...prev }
                    data.forEach((a: any) => { next[String(a.id)] = a })
                    return next
                })
            }
        } catch (err) {
            console.error('Error loading activity info:', err)
        }
    }

    const loadDayMinutes = async () => {
        if (!authUserId) {
            setDayMinutesByDate({})
            setMeetEventsByDate({})
            return
        }

        let startISO: string, endISO: string
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

        try {
            // 1. Fetch Progress
            const { data: rows } = await supabase
                .from('progreso_diario_actividad')
                .select('id, actividad_id, fecha, area, items_objetivo, items_completados, minutos, tipo, minutos_objetivo')
                .eq('cliente_id', authUserId)
                .neq('tipo', 'documento')
                .gte('fecha', startISO)
                .lte('fecha', endISO)

            const { agg, discoveredIds, activitiesByDate } = calculateAggregates(rows || [])
            setActivitiesByDate(activitiesByDate)
            setDayMinutesByDate(agg)

            if (discoveredIds.length > 0) {
                setDiscoveredActivityIds(prev => Array.from(new Set([...prev, ...discoveredIds])))
            }

            // 2. Fetch Meets
            const { data: myParts } = await supabase
                .from('calendar_event_participants')
                .select('event_id, rsvp_status, invited_by_user_id')
                .eq('user_id', authUserId)

            const { data: createdEvents } = await supabase
                .from('calendar_events')
                .select('id')
                .eq('created_by_user_id', authUserId)
                .gte('start_time', `${startISO}T00:00:00`)
                .lte('start_time', `${endISO}T23:59:59`)

            const participantMap: Record<string, any> = {}
                ; (myParts || []).forEach((p: any) => participantMap[String(p.event_id)] = { rsvp: p.rsvp_status, invitedBy: p.invited_by_user_id })
                ; (createdEvents || []).forEach((ev: any) => {
                    if (!participantMap[String(ev.id)]) participantMap[String(ev.id)] = { rsvp: 'confirmed', invitedBy: authUserId }
                })

            const myEventIds = Object.keys(participantMap)
            const newMeets: Record<string, any[]> = {}

            if (myEventIds.length > 0) {
                const { data: eventsData } = await supabase
                    .from('calendar_events')
                    .select('*, cancelled_by_user_id, cancellation_reason, cancelled_at, invited_by_user_id')
                    .in('id', myEventIds)
                    .gte('start_time', `${startISO}T00:00:00`)
                    .lte('start_time', `${endISO}T23:59:59`)

                // Participants/Coach info logic (Simplified for clarity, preserving functionality)
                const { data: partsData } = await supabase
                    .from('calendar_event_participants')
                    .select('event_id, user_id, is_creator, rsvp_status, invited_by_user_id, user_profiles(full_name, avatar_url)')
                    .in('event_id', myEventIds)

                const participantsByEvent: Record<string, any[]> = {}
                partsData?.forEach((p: any) => {
                    const eid = String(p.event_id)
                    if (!participantsByEvent[eid]) participantsByEvent[eid] = []
                    participantsByEvent[eid].push({
                        user_id: p.user_id,
                        name: p.user_profiles?.full_name || 'Participante',
                        avatar_url: p.user_profiles?.avatar_url || null,
                        is_organizer: p.is_creator || p.user_id === p.invited_by_user_id,
                        rsvp_status: p.rsvp_status
                    })
                })

                eventsData?.forEach((e: any) => {
                    const dayKey = String(e.start_time).split('T')[0]
                    if (!newMeets[dayKey]) newMeets[dayKey] = []

                    const durationMins = Math.round((new Date(e.end_time).getTime() - new Date(e.start_time).getTime()) / 60000)
                    if (agg[dayKey]) agg[dayKey].meetsMinutes += durationMins

                    newMeets[dayKey].push({
                        ...e,
                        rsvp_status: participantMap[e.id]?.rsvp || 'pending',
                        participants: participantsByEvent[e.id] || []
                    })
                })
            }
            setMeetEventsByDate(newMeets)

        } catch (err) {
            console.error('Error in loadDayMinutes:', err)
        }
    }

    const loadSelectedDayBreakdown = async (selectedDate: Date | null) => {
        if (!selectedDate || !authUserId) {
            setSelectedDayActivityItems([])
            return
        }

        const dayKey = selectedDate.toISOString().split('T')[0]
        try {
            const { data: progData } = await supabase
                .from('progreso_diario_actividad')
                .select('actividad_id, items_objetivo, items_completados, minutos, minutos_objetivo, area, tipo')
                .eq('cliente_id', authUserId)
                .neq('tipo', 'documento')
                .eq('fecha', dayKey)

            if (progData) {
                const breakdown = calculateBreakdown(progData, activitiesInfo)
                setSelectedDayActivityItems(breakdown)
            }
        } catch (err) {
            console.error('Error loading day breakdown:', err)
        }
    }

    return {
        loadActivityInfo,
        loadDayMinutes,
        loadSelectedDayBreakdown
    }
}
