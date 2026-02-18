import React, { useCallback } from 'react'
import { WeeklySchedule } from '../planner-types'

interface UseWeeklyPlanReplicationProps {
    weeklySchedule: WeeklySchedule
    setWeeklySchedule: (updater: WeeklySchedule | ((prev: WeeklySchedule) => WeeklySchedule)) => void
    numberOfWeeks: number
    setNumberOfWeeks: (n: number) => void
    currentWeek: number
    setCurrentWeek: (updater: number | ((prev: number) => number)) => void
    replicationCount: number
    periods: number
    planLimits: { weeksLimit: number | null } | null
    saveToHistory: (s: WeeklySchedule) => void
    onScheduleChange?: (s: WeeklySchedule) => void
    userAddedWeeksRef: React.MutableRefObject<Set<number>>
    justAddedWeekRef: React.MutableRefObject<number | null>
}

export function useWeeklyPlanReplication({
    weeklySchedule,
    setWeeklySchedule,
    numberOfWeeks,
    setNumberOfWeeks,
    currentWeek,
    setCurrentWeek,
    replicationCount,
    periods,
    planLimits,
    saveToHistory,
    onScheduleChange,
    userAddedWeeksRef,
    justAddedWeekRef
}: UseWeeklyPlanReplicationProps) {
    /**
     * Adds a new empty week to the schedule.
     */
    const addWeek = useCallback(() => {
        const existing = Object.keys(weeklySchedule).map(Number).filter(n => !isNaN(n) && n > 0).sort((a, b) => a - b)
        const max = existing.length > 0 ? Math.max(...existing) : 0
        const nextW = max + 1
        const totalWithP = (existing.length + 1) * periods

        if (planLimits?.weeksLimit && totalWithP > planLimits.weeksLimit) {
            return { error: `Límite de semanas (${planLimits.weeksLimit}) alcanzado.` }
        }

        saveToHistory(weeklySchedule)
        const nextS: WeeklySchedule = { ...weeklySchedule, [nextW]: {} as Record<number, any> }
        for (let i = 1; i <= 7; i++) {
            nextS[nextW][i] = []
        }

        setWeeklySchedule(nextS)
        setNumberOfWeeks(nextW)
        justAddedWeekRef.current = nextW
        userAddedWeeksRef.current.add(nextW)
        setCurrentWeek(nextW)

        if (onScheduleChange) {
            setTimeout(() => onScheduleChange(nextS), 0)
        }
        return { error: null }
    }, [weeklySchedule, periods, planLimits, saveToHistory, setWeeklySchedule, setNumberOfWeeks, setCurrentWeek, onScheduleChange])

    /**
     * Removes a specific week (or current week) and reindexes if necessary.
     */
    const removeWeek = useCallback((w: number = currentWeek) => {
        if (numberOfWeeks <= 1) return

        saveToHistory(weeklySchedule)
        const temp: any = { ...weeklySchedule }
        delete temp[w]
        userAddedWeeksRef.current.delete(w)

        const reindexed: WeeklySchedule = {}
        let i = 1
        Object.keys(temp)
            .map(Number)
            .sort((a, b) => a - b)
            .forEach(k => {
                reindexed[i] = temp[k]
                i++
            })

        setWeeklySchedule(reindexed)
        const total = Math.max(1, Object.keys(reindexed).length)
        setNumberOfWeeks(total)
        setCurrentWeek(prev => Math.max(1, Math.min(prev, total)))

        if (onScheduleChange) {
            setTimeout(() => onScheduleChange(reindexed), 0)
        }
    }, [numberOfWeeks, currentWeek, weeklySchedule, saveToHistory, setWeeklySchedule, setNumberOfWeeks, setCurrentWeek, onScheduleChange])

    /**
     * Replicates the existing pattern N times (replicationCount).
     */
    const replicateWeeks = useCallback(() => {
        if (replicationCount <= 1) return
        const next: WeeklySchedule = { ...weeklySchedule }
        const base = Object.keys(weeklySchedule).map(Number).sort()
        const totalCount = numberOfWeeks * replicationCount

        if (planLimits?.weeksLimit && totalCount * periods > planLimits.weeksLimit) return

        for (let i = 1; i < replicationCount; i++) {
            base.forEach(b => {
                const n = b + (numberOfWeeks * i)
                next[n] = { ...weeklySchedule[b] }
            })
        }

        setWeeklySchedule(next)
        setNumberOfWeeks(totalCount)

        if (onScheduleChange) {
            setTimeout(() => onScheduleChange(next), 0)
        }
    }, [replicationCount, weeklySchedule, numberOfWeeks, planLimits, periods, setWeeklySchedule, setNumberOfWeeks, onScheduleChange])

    return {
        addWeek,
        removeWeek,
        replicateWeeks
    }
}
