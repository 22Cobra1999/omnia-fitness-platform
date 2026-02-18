import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/supabase-client'

export const useCalendarDataState = () => {
    const supabase = useMemo(() => createClient(), [])

    // Core Date State
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
                totalExercises: number
                completedExercises: number
                pendingPlates: number
                totalPlates: number
                completedPlates: number
            }
        >
    >({})

    const [meetEventsByDate, setMeetEventsByDate] = useState<Record<string, any[]>>({})
    const [selectedDayActivityItems, setSelectedDayActivityItems] = useState<any[]>([])
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

    return {
        supabase,
        selectedDate,
        setSelectedDate,
        authUserId,
        activitiesByDate,
        setActivitiesByDate,
        activitiesInfo,
        setActivitiesInfo,
        dayMinutesByDate,
        setDayMinutesByDate,
        meetEventsByDate,
        setMeetEventsByDate,
        selectedDayActivityItems,
        setSelectedDayActivityItems,
        discoveredActivityIds,
        setDiscoveredActivityIds
    }
}
