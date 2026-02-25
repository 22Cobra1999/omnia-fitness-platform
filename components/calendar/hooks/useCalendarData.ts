import { useEffect, useMemo, useCallback } from 'react'

// Modular hooks
import { useCalendarDataState } from './modules/useCalendarDataState'
import { useCalendarDataCalculations } from './modules/useCalendarDataCalculations'
import { useCalendarDataFetchers } from './modules/useCalendarDataFetchers'

export const useCalendarData = (
    activityIds: string[],
    meetViewMode: 'month' | 'week' | 'day_split',
    meetWeekStart: Date,
    currentDate: Date
) => {
    // 1. Initial State
    const state = useCalendarDataState()

    // 2. Pure Calculations
    const calcs = useCalendarDataCalculations()

    // 3. Data Fetchers
    const fetchers = useMemo(() => useCalendarDataFetchers({
        supabase: state.supabase,
        authUserId: state.authUserId,
        currentDate,
        meetViewMode,
        meetWeekStart,
        activitiesInfo: state.activitiesInfo,
        setActivitiesInfo: state.setActivitiesInfo,
        setActivitiesByDate: state.setActivitiesByDate,
        setDayMinutesByDate: state.setDayMinutesByDate,
        setMeetEventsByDate: state.setMeetEventsByDate,
        setSelectedDayActivityItems: state.setSelectedDayActivityItems,
        setDiscoveredActivityIds: state.setDiscoveredActivityIds,
        calculateAggregates: calcs.calculateAggregates,
        calculateBreakdown: calcs.calculateBreakdown
    }), [
        state.supabase,
        state.authUserId, // include so fetchers are rebuilt when auth resolves
        currentDate,
        meetViewMode,
        meetWeekStart,
        state.activitiesInfo,
        state.setActivitiesInfo,
        state.setActivitiesByDate,
        state.setDayMinutesByDate,
        state.setMeetEventsByDate,
        state.setSelectedDayActivityItems,
        state.setDiscoveredActivityIds,
        calcs.calculateAggregates,
        calcs.calculateBreakdown
    ])

    // --- Derived State ---
    const allRelevantIds = useMemo(() => {
        const set = new Set([...activityIds, ...state.discoveredActivityIds])
        return Array.from(set)
    }, [activityIds, state.discoveredActivityIds])

    // --- Side Effects ---

    // Load activity info when IDs change
    useEffect(() => {
        if (allRelevantIds.length > 0) {
            fetchers.loadActivityInfo(allRelevantIds)
        }
    }, [allRelevantIds, fetchers.loadActivityInfo])

    // Load month/week data — only after auth is resolved
    const loadDayMinutes = useCallback(async () => {
        if (!state.authUserId) return // guard against null auth
        await fetchers.loadDayMinutes()
    }, [fetchers.loadDayMinutes, state.authUserId])

    useEffect(() => {
        loadDayMinutes()
    }, [loadDayMinutes])

    // Load daily breakdown
    const loadSelectedDayBreakdown = useCallback(async () => {
        await fetchers.loadSelectedDayBreakdown(state.selectedDate)
    }, [state.selectedDate, fetchers.loadSelectedDayBreakdown])

    useEffect(() => {
        loadSelectedDayBreakdown()
    }, [loadSelectedDayBreakdown])

    return {
        // State
        selectedDate: state.selectedDate,
        setSelectedDate: state.setSelectedDate,
        authUserId: state.authUserId,
        activitiesByDate: state.activitiesByDate,
        dayMinutesByDate: state.dayMinutesByDate,
        meetEventsByDate: state.meetEventsByDate,
        setMeetEventsByDate: state.setMeetEventsByDate,
        selectedDayActivityItems: state.selectedDayActivityItems,
        activitiesInfo: state.activitiesInfo,

        // Actions
        loadDayMinutes,
        loadSelectedDayBreakdown
    }
}
