import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import {
    Exercise,
    WeeklySchedule,
    WeeklyExercisePlannerProps,
    DaySchedulePayload
} from '../planner-types'
import {
    DAYS,
    getExercisesFromDay,
    isGenericExercise,
    normalizeNutritionType,
} from '../planner-utils'

// Specialized Hooks
import { useWeeklyPlanState } from './useWeeklyPlanState'
import { useWeeklyPlanReplication } from './useWeeklyPlanReplication'
import { useWeeklyPlanSelection } from './useWeeklyPlanSelection'
import { useWeeklyPlanDayHandlers } from './useWeeklyPlanDayHandlers'

export function useWeeklyPlanner({
    exercises,
    onScheduleChange,
    onPeriodsChange,
    onStatsChange,
    initialSchedule,
    initialPeriods,
    activityId,
    isEditing,
    productCategory,
    planLimits,
    onUndoAvailable
}: WeeklyExercisePlannerProps) {
    // 1. Core State
    const {
        weeklySchedule,
        setWeeklySchedule,
        numberOfWeeks
    } = useWeeklyPlanState({
        initialSchedule,
        productCategory: productCategory || '',
        onScheduleChange
    })

    const [currentWeek, setCurrentWeek] = useState(1)
    const [periods, setPeriods] = useState(initialPeriods && initialPeriods > 0 ? initialPeriods : 1)
    const [replicationCount, setReplicationCount] = useState(1)
    const [isLoadingPlanning, setIsLoadingPlanning] = useState(false)
    const [exercisesWithActiveStatus, setExercisesWithActiveStatus] = useState<any[]>(exercises)
    const [allCoachExercises, setAllCoachExercises] = useState<Exercise[]>([])

    // Undo/Redo states
    const [scheduleHistory, setScheduleHistory] = useState<WeeklySchedule[]>([])
    const [canUndo, setCanUndo] = useState(false)

    // Refs
    const scheduleRef = useRef<WeeklySchedule>(weeklySchedule)
    const onUndoAvailableRef = useRef(onUndoAvailable)
    const userAddedWeeksRef = useRef<Set<number>>(new Set())
    const justAddedWeekRef = useRef<number | null>(null)
    const disableActiveStatusFetchRef = useRef(false)
    const lastStatsNotified = useRef<string>('')

    useEffect(() => { scheduleRef.current = weeklySchedule }, [weeklySchedule])
    useEffect(() => { onUndoAvailableRef.current = onUndoAvailable }, [onUndoAvailable])
    useEffect(() => { if (onUndoAvailableRef.current) onUndoAvailableRef.current(canUndo) }, [canUndo])

    // 2. Specialized Logic (Extracted Hooks)
    const saveToHistory = useCallback((schedule: WeeklySchedule) => {
        setScheduleHistory(prev => [...prev.slice(-9), JSON.parse(JSON.stringify(schedule))])
        setCanUndo(true)
    }, [])

    const handleUndo = useCallback(() => {
        setScheduleHistory(prev => {
            if (prev.length === 0) {
                setCanUndo(false)
                return prev
            }
            const previousSchedule = prev[prev.length - 1]
            const newHistory = prev.slice(0, -1)
            setWeeklySchedule(JSON.parse(JSON.stringify(previousSchedule)))
            setCanUndo(newHistory.length > 0)
            return newHistory
        })
    }, [setWeeklySchedule])

    const selection = useWeeklyPlanSelection({
        finalAvailableExercises: poolExercises() // Local helper defined later
    })

    const replication = useWeeklyPlanReplication({
        weeklySchedule,
        setWeeklySchedule,
        numberOfWeeks,
        setNumberOfWeeks: () => { }, // Handled by state logic
        currentWeek,
        setCurrentWeek,
        replicationCount,
        periods,
        planLimits: planLimits ? { weeksLimit: planLimits.weeksLimit ?? null } : null,
        saveToHistory,
        onScheduleChange,
        userAddedWeeksRef,
        justAddedWeekRef
    })

    const dayHandlers = useWeeklyPlanDayHandlers({
        weeklySchedule,
        setWeeklySchedule,
        currentWeek,
        selectedExercises: selection.selectedExercises,
        finalAvailableExercises: poolExercises(),
        saveToHistory,
        onScheduleChange
    })

    // 3. Physical State & Availability Logic (Infrastructure)
    function poolExercises(): Exercise[] {
        const registry = new Map<string, any>()
        exercisesWithActiveStatus.forEach((row, index) => {
            const id = row?.id ? `id-${row.id}` : `name-${String(row?.name || index).toLowerCase()}`
            if (!registry.has(id) || (row?.is_active && !registry.get(id)?.is_active)) {
                registry.set(id, row)
            }
        })

        const pool = Array.from(registry.values()).map((row, index) => {
            const isNut = productCategory === 'nutricion' || productCategory === 'nutrition'
            if (isNut) {
                const type = normalizeNutritionType(row['Tipo'] || row.tipo || 'otro')
                return {
                    id: row.id || `nutrition-${index}`,
                    name: row['Nombre'] || row.nombre || `Plato ${index + 1}`,
                    description: row['Receta'] || row.descripcion || '',
                    type,
                    tipo: type,
                    calories: parseInt(row['Calorías'] || row.calorias || '0') || 0,
                    proteinas: row.proteinas || parseInt(row['Proteínas (g)'] || '0') || 0,
                    carbohidratos: row.carbohidratos || parseInt(row['Carbohidratos (g)'] || '0') || 0,
                    grasas: row.grasas || parseInt(row['Grasas (g)'] || '0') || 0,
                    is_active: row.is_active !== false,
                    activo: row.activo !== false,
                }
            }
            return {
                id: row.id || `exercise-${index}`,
                name: row.name || row.nombre_ejercicio || `Ejercicio ${index + 1}`,
                description: row.description || row.descripcion || '',
                duration: parseInt(row.duration || row.duracion_min || '0') || null,
                type: row.type || row.tipo || 'general',
                intensity: row.intensity || row.intensidad || 'Media',
                equipment: row.equipment || row.equipo || 'Ninguno',
                bodyParts: row.bodyParts || row.body_parts || '',
                calories: parseInt(row.calories || row.calorias || '0') || null,
                is_active: row.is_active !== false,
                activo: row.activo !== false,
            }
        })

        return pool as Exercise[]
    }

    const finalAvailableExercises = useMemo(poolExercises, [exercisesWithActiveStatus, productCategory])

    const selectedNutritionTotals = useMemo(() => {
        const totals = { proteinas: 0, carbohidratos: 0, grasas: 0, calorias: 0 }
        if (productCategory !== 'nutricion') return totals
        finalAvailableExercises.forEach((ex: Exercise) => {
            if (!selection.selectedExercises.has(String(ex.id))) return
            totals.proteinas += (ex.proteinas || 0)
            totals.carbohidratos += (ex.carbohidratos || 0)
            totals.grasas += (ex.grasas || 0)
            totals.calorias += (ex.calorias || 0)
        })
        return totals
    }, [finalAvailableExercises, selection.selectedExercises, productCategory])

    const getWeeksWithExercises = useCallback((): Set<number> => {
        const weeksWithExercises = new Set<number>()
        for (let week = 1; week <= numberOfWeeks; week++) {
            let weekHasExercises = false
            for (const day of DAYS) {
                const dayEntry = weeklySchedule[week]?.[day.key]
                if (getExercisesFromDay(dayEntry).length > 0) {
                    weekHasExercises = true
                    break
                }
            }
            if (weekHasExercises) weeksWithExercises.add(week)
        }
        return weeksWithExercises
    }, [weeklySchedule, numberOfWeeks])

    // 4. Statistics Calculation
    const getPatternStats = useCallback(() => {
        let totalExercises = 0, totalDays = 0
        const uniqueIds = new Set<string>(), weeksWithEx = new Set<number>()
        const availableIds = new Set(finalAvailableExercises.map((ex: Exercise) => String(ex.id)))

        for (let w = 1; w <= numberOfWeeks; w++) {
            let weekHasEx = false
            for (const d of DAYS) {
                const exList = getExercisesFromDay(weeklySchedule[w]?.[d.key]).filter((ex: Exercise) => {
                    return !isGenericExercise(ex) && availableIds.has(String(ex.id)) && ex.is_active !== false
                })
                if (exList.length > 0) {
                    totalExercises += exList.length
                    totalDays++
                    weekHasEx = true
                    exList.forEach((ex: Exercise) => uniqueIds.add(String(ex.id)))
                }
            }
            if (weekHasEx) weeksWithEx.add(w)
        }
        const uniqueWeeks = weeksWithEx.size
        const totalWeeksCount = uniqueWeeks > 0 ? uniqueWeeks * periods : 0
        return {
            totalExercises,
            totalDays,
            totalWeeks: totalWeeksCount,
            uniqueExercises: uniqueIds.size,
            totalSessions: totalDays * periods,
            totalExercisesReplicated: totalExercises * periods
        }
    }, [weeklySchedule, numberOfWeeks, periods, finalAvailableExercises])

    const summaryStats = getPatternStats()

    useEffect(() => {
        if (onStatsChange) {
            const stats = getPatternStats()
            if (JSON.stringify(stats) !== lastStatsNotified.current) {
                lastStatsNotified.current = JSON.stringify(stats)
                setTimeout(() => onStatsChange(stats), 0)
            }
        }
    }, [summaryStats, onStatsChange, getPatternStats])

    return {
        // State
        weeklySchedule,
        numberOfWeeks,
        replicationCount,
        setReplicationCount,
        similarDays: dayHandlers.similarDays,
        selectedExercises: selection.selectedExercises,
        weekLimitError: null, // Placeholder for now
        searchTerm: '', // Placeholder
        setSearchTerm: () => { },
        isExerciseSelectorOpen: false,
        setIsExerciseSelectorOpen: () => { },
        currentWeek,
        setCurrentWeek,
        selectedDay: dayHandlers.selectedDay,
        showDayExercises: dayHandlers.showDayExercises,
        periods,
        isLoadingPlanning,
        finalAvailableExercises,
        selectedNutritionTotals,
        summaryStats,
        weeksExceeded: false,
        sessionsExceeded: false,
        uniqueExceeded: false,
        canUndo,
        weeksLimit: planLimits?.weeksLimit ?? null,
        activitiesLimit: planLimits?.activitiesLimit ?? null,

        // Handlers
        addWeek: replication.addWeek,
        removeWeek: replication.removeWeek,
        replicateWeeks: replication.replicateWeeks,
        increasePeriods: () => setPeriods(p => Math.min(12, p + 1)),
        decreasePeriods: () => setPeriods(p => Math.max(1, p - 1)),
        handleUndo,
        toggleExerciseSelection: selection.toggleExerciseSelection,
        selectAllExercises: selection.selectAllExercises,
        clearSelection: selection.clearSelection,
        handleDayClick: dayHandlers.handleDayClick,
        openDayExercises: dayHandlers.openDayExercises,
        closeDayExercises: dayHandlers.closeDayExercises,
        getExercisesForDay: (w: number, d: number) => getExercisesFromDay(weeklySchedule[w]?.[d]),
        getBlockNamesForDay: (w: number, d: number) => (weeklySchedule[w]?.[d] as any)?.blockNames || {},
        getBlockCountForDay: (w: number, d: number) => (weeklySchedule[w]?.[d] as any)?.blockCount || 1,
        updateDayExercises: dayHandlers.updateDayExercises,
        applyToSimilarDays: dayHandlers.applyToSimilarDays,
        getWeeksWithExercises
    }
}
