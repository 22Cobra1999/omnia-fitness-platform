import { useState, useCallback } from 'react'
import { WeeklySchedule, Exercise, DaySchedulePayload } from '../planner-types'
import { getExercisesFromDay, isGenericExercise } from '../planner-utils'

interface UseWeeklyPlanDayHandlersProps {
    weeklySchedule: WeeklySchedule
    setWeeklySchedule: (updater: WeeklySchedule | ((prev: WeeklySchedule) => WeeklySchedule)) => void
    currentWeek: number
    selectedExercises: Set<string>
    finalAvailableExercises: Exercise[]
    saveToHistory: (s: WeeklySchedule) => void
    onScheduleChange?: (s: WeeklySchedule) => void
}

export function useWeeklyPlanDayHandlers({
    weeklySchedule,
    setWeeklySchedule,
    currentWeek,
    selectedExercises,
    finalAvailableExercises,
    saveToHistory,
    onScheduleChange
}: UseWeeklyPlanDayHandlersProps) {
    const [selectedDay, setSelectedDay] = useState<string | null>(null)
    const [showDayExercises, setShowDayExercises] = useState(false)
    const [similarDays, setSimilarDays] = useState<{ [key: string]: string[] }>({})

    const generateSelectionFingerprint = useCallback((exercisesList: Exercise[]) => {
        if (!exercisesList || !Array.isArray(exercisesList)) return ''
        return exercisesList.map(ex => ex.id).sort().join(',')
    }, [])

    const findSimilarDaysInSchedule = useCallback((schedule: WeeklySchedule, currentDayKey: string, currentExercises: Exercise[]) => {
        const currentFingerprint = generateSelectionFingerprint(currentExercises)
        const similarDaysList: string[] = []
        Object.keys(schedule).forEach(weekKey => {
            const wKey = parseInt(weekKey)
            Object.keys(schedule[wKey]).forEach(dayKey => {
                const dKey = parseInt(dayKey)
                const dayExercises = schedule[wKey][dKey]
                const dayExercisesList = getExercisesFromDay(dayExercises)
                const dayFingerprint = generateSelectionFingerprint(dayExercisesList)
                if (dayFingerprint === currentFingerprint && `${weekKey}-${dayKey}` !== currentDayKey) {
                    similarDaysList.push(`${weekKey}-${dayKey}`)
                }
            })
        })
        return similarDaysList
    }, [generateSelectionFingerprint])

    /**
     * Assigns all currently selected exercises to a specific day.
     */
    const assignSelectedToDay = useCallback((w: number, d: number) => {
        saveToHistory(weeklySchedule)
        const next = { ...weeklySchedule }
        if (!next[w]) next[w] = {}
        const dayEntry = next[w][d]
        const currentExercises = getExercisesFromDay(dayEntry)

        selectedExercises.forEach(id => {
            const ex = finalAvailableExercises.find((e: Exercise) => String(e.id) === id)
            if (!ex) return
            currentExercises.push(ex)
        })

        if (Array.isArray(dayEntry)) {
            next[w][d] = currentExercises
        } else if (dayEntry) {
            next[w][d] = { ...dayEntry, ejercicios: currentExercises, exercises: currentExercises }
        } else {
            next[w][d] = { ejercicios: currentExercises, exercises: currentExercises, blockNames: {} }
        }

        setWeeklySchedule(next)
        const currentDayKey = `${w}-${d}`
        const similar = findSimilarDaysInSchedule(next, currentDayKey, getExercisesFromDay(next[w][d]))
        setSimilarDays(prev => ({ ...prev, [currentDayKey]: similar }))
        if (onScheduleChange) {
            setTimeout(() => onScheduleChange(next), 0)
        }
    }, [weeklySchedule, selectedExercises, finalAvailableExercises, saveToHistory, setWeeklySchedule, findSimilarDaysInSchedule, onScheduleChange])

    /**
     * Handles clicking on a day in the planner.
     * If exercises are selected, it assigns them. Otherwise, it opens the day's exercise modal.
     */
    const handleDayClick = useCallback((d: number) => {
        if (selectedExercises.size > 0) {
            assignSelectedToDay(currentWeek, d)
        } else {
            setSelectedDay(String(d))
            setShowDayExercises(true)
        }
    }, [selectedExercises.size, assignSelectedToDay, currentWeek])

    /**
     * Updates the exercises for the currently selected day.
     */
    const updateDayExercises = useCallback((payload: DaySchedulePayload) => {
        if (!selectedDay) return
        saveToHistory(weeklySchedule)
        const exList = getExercisesFromDay(payload)
        const dNum = parseInt(selectedDay)

        setWeeklySchedule(prev => {
            const next = { ...prev }
            if (!next[currentWeek]) next[currentWeek] = {}

            if (exList.length === 0) {
                delete next[currentWeek][dNum]
                if (Object.keys(next[currentWeek]).length === 0) delete next[currentWeek]
            } else {
                next[currentWeek][dNum] = payload
            }

            const key = `${currentWeek}-${dNum}`
            setSimilarDays(s => ({ ...s, [key]: findSimilarDaysInSchedule(next, key, exList) }))

            if (onScheduleChange) {
                setTimeout(() => onScheduleChange(next), 0)
            }
            return next
        })
    }, [weeklySchedule, currentWeek, selectedDay, findSimilarDaysInSchedule, saveToHistory, setWeeklySchedule, onScheduleChange])

    /**
     * Applies changes from the current day to all other similar days in the schedule.
     */
    const applyToSimilarDays = useCallback((blockNames: any, exercisesList: Exercise[], blockCountCount: number) => {
        if (!selectedDay) return
        saveToHistory(weeklySchedule)
        const valid = exercisesList.filter(e => !isGenericExercise(e))
        if (valid.length === 0) return
        const dNum = parseInt(selectedDay)
        const curKey = `${currentWeek}-${dNum}`
        const similar = findSimilarDaysInSchedule(weeklySchedule, curKey, getExercisesFromDay(weeklySchedule[currentWeek]?.[dNum]))

        setWeeklySchedule(prev => {
            const next = { ...prev }
            if (!next[currentWeek]) next[currentWeek] = {}
            next[currentWeek][dNum] = { ejercicios: valid, exercises: valid, blockNames, blockCount: blockCountCount }
            similar.forEach(k => {
                const [wKey, dKey] = k.split('-').map(Number)
                if (!next[wKey]) next[wKey] = {}
                next[wKey][dKey] = { ejercicios: valid, exercises: valid, blockNames, blockCount: blockCountCount }
            })
            if (onScheduleChange) {
                setTimeout(() => onScheduleChange(next), 0)
            }
            return next
        })
    }, [weeklySchedule, currentWeek, selectedDay, findSimilarDaysInSchedule, saveToHistory, setWeeklySchedule, onScheduleChange])

    const openDayExercises = useCallback((d: string) => {
        setSelectedDay(d)
        setShowDayExercises(true)
    }, [])

    const closeDayExercises = useCallback(() => {
        setSelectedDay(null)
        setShowDayExercises(false)
    }, [])

    return {
        selectedDay,
        setSelectedDay,
        showDayExercises,
        setShowDayExercises,
        similarDays,
        handleDayClick,
        updateDayExercises,
        applyToSimilarDays,
        openDayExercises,
        closeDayExercises,
    }
}
