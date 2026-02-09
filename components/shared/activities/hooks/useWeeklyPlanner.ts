import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import {
    Exercise,
    WeeklySchedule,
    WeeklyExercisePlannerProps,
    DayScheduleEntry,
    DaySchedulePayload
} from '../planner-types'
import {
    DAYS,
    getExercisesFromDay,
    isGenericExercise,
    normalizeExerciseType,
    normalizeNutritionType,
    DEFAULT_NUTRITION_BLOCK_NAMES
} from '../planner-utils'

// ... existing code ...

// Carga de estado activo y planificación desde backend


// Helper para sanitizar y rellenar nombres de bloques
const sanitizeScheduleHelper = (schedule: WeeklySchedule, productCategory: string): WeeklySchedule => {
    if (!schedule || Object.keys(schedule).length === 0) return {}
    const clean = JSON.parse(JSON.stringify(schedule))

    Object.keys(clean).forEach(weekKey => {
        const weekNum = parseInt(weekKey)
        if (!clean[weekNum]) return

        Object.keys(clean[weekNum]).forEach(dayKey => {
            const dayNum = parseInt(dayKey)
            const entry = clean[weekNum][dayNum]
            if (!entry) return

            // Ensure structure
            if (Array.isArray(entry)) {
                clean[weekNum][dayNum] = {
                    ejercicios: entry,
                    exercises: entry,
                    blockNames: {},
                    blockCount: 1
                }
            }

            const currentEntry = clean[weekNum][dayNum] as any
            const exercises = getExercisesFromDay(currentEntry)
            const blocksPresent = new Set(exercises.map((e: any) => e.block || e.bloque || 1))
            const maxBlock = blocksPresent.size > 0 ? Math.max(...Array.from(blocksPresent) as number[]) : 1

            if (!currentEntry.blockNames) currentEntry.blockNames = {}

            const isNutrition = productCategory === 'nutricion' || productCategory === 'nutrition'
            const hasGenericNames = Object.values(currentEntry.blockNames).some(n => String(n).startsWith('Bloque '))
            const shouldRegenerate = Object.keys(currentEntry.blockNames).length === 0 || (isNutrition && hasGenericNames)

            // Backfill or fix names
            if (shouldRegenerate) {
                if (isNutrition) {
                    blocksPresent.forEach((b: any) => {
                        // For nutrition, force standard names if regenerating
                        const bIdx = (Number(b) || 1) - 1
                        if (bIdx >= 0 && bIdx < DEFAULT_NUTRITION_BLOCK_NAMES.length) {
                            currentEntry.blockNames[b] = DEFAULT_NUTRITION_BLOCK_NAMES[bIdx]
                        } else {
                            currentEntry.blockNames[b] = `Desconocido ${b}`
                        }
                    })
                } else {
                    // For fitness, use Bloque X if empty
                    if (Object.keys(currentEntry.blockNames).length === 0) {
                        blocksPresent.forEach((b: any) => {
                            currentEntry.blockNames[b] = `Bloque ${b}`
                        })
                    }
                }
            }
            if (isNutrition) {
                // Ensure typical blocks if empty even with no exercises, for better UX? 
                // Mostly handled by modal, but strictly we stick to data presence here.
            }

            currentEntry.blockCount = Math.max(currentEntry.blockCount || 1, maxBlock)
        })
    })
    return clean
}

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
    const [weeklySchedule, setWeeklySchedule] = useState<WeeklySchedule>(() => sanitizeScheduleHelper(initialSchedule || {}, productCategory || ''))
    const [numberOfWeeks, setNumberOfWeeks] = useState(() => {
        const schedule = initialSchedule || {}
        const weekCount = Object.keys(schedule).filter(key => {
            const weekNum = Number(key)
            return !isNaN(weekNum) && weekNum > 0
        }).length
        return weekCount > 0 ? weekCount : 0
    })
    const [replicationCount, setReplicationCount] = useState(1)
    const [similarDays, setSimilarDays] = useState<{ [key: string]: string[] }>({})
    const [selectedExercises, setSelectedExercises] = useState<Set<string>>(new Set())
    const [weekLimitError, setWeekLimitError] = useState<string | null>(null)
    const [searchTerm, setSearchTerm] = useState<string>('')
    const [isExerciseSelectorOpen, setIsExerciseSelectorOpen] = useState(false)
    const [currentWeek, setCurrentWeek] = useState(1)
    const [selectedDay, setSelectedDay] = useState<string | null>(null)
    const [showDayExercises, setShowDayExercises] = useState(false)
    const [periods, setPeriods] = useState(initialPeriods && initialPeriods > 0 ? initialPeriods : 1)
    const [isLoadingPlanning, setIsLoadingPlanning] = useState(false)
    const [exercisesWithActiveStatus, setExercisesWithActiveStatus] = useState<any[]>(exercises)
    const [allCoachExercises, setAllCoachExercises] = useState<Exercise[]>([])

    // Undo/Redo states
    const [scheduleHistory, setScheduleHistory] = useState<WeeklySchedule[]>([])
    const [canUndo, setCanUndo] = useState(false)

    // Refs
    const previousFingerprintRef = useRef<string | null>(null)
    const scheduleRef = useRef<WeeklySchedule>(weeklySchedule)
    const disableActiveStatusFetchRef = useRef(false)
    const userAddedWeeksRef = useRef<Set<number>>(new Set())
    const hasLocalChangesRef = useRef<boolean>(initialSchedule && Object.keys(initialSchedule || {}).length > 0)
    const onUndoAvailableRef = useRef(onUndoAvailable)
    const isInitialMount = useRef(true)
    const lastStatsNotified = useRef<string>('')
    const justAddedWeekRef = useRef<number | null>(null)

    // Sincronizar refs
    useEffect(() => {
        onUndoAvailableRef.current = onUndoAvailable
    }, [onUndoAvailable])

    useEffect(() => {
        scheduleRef.current = weeklySchedule
    }, [weeklySchedule])

    // Fingerprint de ejercicios
    const availableExerciseIdsFingerprint = useMemo(() => {
        if (!exercises || !Array.isArray(exercises)) return ''
        try {
            const ids = exercises
                .map(ex => (ex && ex.id !== undefined && ex.id !== null ? String(ex.id) : ''))
                .filter(Boolean)
                .sort()
            return ids.join(',')
        } catch {
            return ''
        }
    }, [exercises])

    // Sincronizar con initialSchedule cuando cambia
    useEffect(() => {
        if (initialSchedule) {
            const hasContent = Object.keys(initialSchedule).length > 0
            if (hasContent) {
                const currentScheduleString = JSON.stringify(weeklySchedule)
                const initialScheduleString = JSON.stringify(initialSchedule)

                if (currentScheduleString !== initialScheduleString) {
                    const localSchedule = sanitizeScheduleHelper(initialSchedule || {}, productCategory || '')
                    setWeeklySchedule(localSchedule)
                    scheduleRef.current = localSchedule
                    hasLocalChangesRef.current = true
                    const weekNumbers = Object.keys(initialSchedule).map(Number).filter(n => !isNaN(n) && n > 0)
                    setNumberOfWeeks(weekNumbers.length > 0 ? Math.max(...weekNumbers) : 0)
                }
            } else {
                hasLocalChangesRef.current = false
            }
        }
    }, [JSON.stringify(initialSchedule)])

    // Sincronizar periods
    useEffect(() => {
        if (initialPeriods && initialPeriods > 0) {
            setPeriods(initialPeriods)
        }
    }, [initialPeriods])

    // Sincronizar exercisesWithActiveStatus
    useEffect(() => {
        setExercisesWithActiveStatus(exercises)
    }, [exercises.length])

    // Historial para undo
    const saveToHistory = useCallback((schedule: WeeklySchedule) => {
        setScheduleHistory(prev => [...prev.slice(-9), JSON.parse(JSON.stringify(schedule))])
        setCanUndo(true)
    }, [])

    const handleUndo = useCallback(() => {
        setScheduleHistory(prev => {
            if (prev.length === 0) {
                setCanUndo(false)
                if (onUndoAvailableRef.current) onUndoAvailableRef.current(false)
                return prev
            }
            const previousSchedule = prev[prev.length - 1]
            const newHistory = prev.slice(0, -1)
            const restoredSchedule = JSON.parse(JSON.stringify(previousSchedule))
            setWeeklySchedule(restoredSchedule)
            scheduleRef.current = restoredSchedule
            const restoredWeekNumbers = Object.keys(restoredSchedule).map(Number).filter(n => !isNaN(n) && n > 0)
            setNumberOfWeeks(restoredWeekNumbers.length > 0 ? Math.max(...restoredWeekNumbers) : 0)
            const stillCanUndo = newHistory.length > 0
            setCanUndo(stillCanUndo)
            if (onScheduleChange) setTimeout(() => onScheduleChange(previousSchedule), 0)
            if (onUndoAvailableRef.current) onUndoAvailableRef.current(stillCanUndo)
            return newHistory
        })
    }, [onScheduleChange])

    // Efecto para Ctrl+Z
    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
                e.preventDefault()
                if (canUndo) handleUndo()
            }
        }
        window.addEventListener('keydown', onKeyDown)
        return () => window.removeEventListener('keydown', onKeyDown)
    }, [canUndo, handleUndo])

    // Notificar al padre sobre undo
    useEffect(() => {
        if (onUndoAvailableRef.current) onUndoAvailableRef.current(canUndo)
    }, [canUndo])

    // Helper para días similares
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

    const findSimilarDays = useCallback((currentDayKey: string, currentExercises: Exercise[]) => {
        return findSimilarDaysInSchedule(weeklySchedule, currentDayKey, currentExercises)
    }, [weeklySchedule, findSimilarDaysInSchedule])

    // Cálculos de semanas con ejercicios
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

    // Getters para días
    const getExercisesForDay = useCallback((weekNumber: number, dayNumber: number): Exercise[] => {
        const dayData = weeklySchedule[weekNumber]?.[dayNumber]
        return getExercisesFromDay(dayData)
    }, [weeklySchedule])

    const getBlockCountForDay = useCallback((weekNumber: number, dayNumber: number): number => {
        const dayData = weeklySchedule[weekNumber]?.[dayNumber]
        if (dayData && typeof dayData === 'object' && 'blockCount' in (dayData as any)) {
            const count = Number((dayData as any).blockCount)
            return Number.isFinite(count) && count > 0 ? count : 1
        }
        return 1
    }, [weeklySchedule])

    const getBlockNamesForDay = useCallback((weekNumber: number, dayNumber: number): { [key: number]: string } => {
        const dayData = weeklySchedule[weekNumber]?.[dayNumber]
        if (dayData && typeof dayData === 'object' && 'blockNames' in dayData) {
            return (dayData as any).blockNames || {}
        }
        return {}
    }, [weeklySchedule])

    // Limpieza de ejercicios eliminados
    useEffect(() => {
        if (previousFingerprintRef.current !== null && availableExerciseIdsFingerprint === previousFingerprintRef.current) return
        previousFingerprintRef.current = availableExerciseIdsFingerprint
        const currentSchedule = scheduleRef.current

        if (!availableExerciseIdsFingerprint || availableExerciseIdsFingerprint.trim() === '') {
            if (currentSchedule && Object.keys(currentSchedule).length > 0) {
                if (hasLocalChangesRef.current || (initialSchedule && Object.keys(initialSchedule).length > 0)) return
                setWeeklySchedule({})
                scheduleRef.current = {}
                setNumberOfWeeks(0)
                if (onScheduleChange) setTimeout(() => onScheduleChange({}), 0)
                return
            }
            return
        }

        if (!currentSchedule || Object.keys(currentSchedule).length === 0) return

        const availableIds = new Set<string>()
        const availableIdsNum = new Set<number>()
        availableExerciseIdsFingerprint.split(',').filter(Boolean).forEach(id => {
            availableIds.add(id)
            const n = Number(id)
            if (!isNaN(n)) availableIdsNum.add(n)
        })

        const allAvailableIdsAreTemporary = availableExerciseIdsFingerprint.split(',').filter(Boolean).every(id => id.includes('-') || isNaN(Number(id)))
        let scheduleHasNumericIds = false
        let scheduleHasAnyExercises = false
        Object.values(currentSchedule).forEach((days: any) => {
            Object.values(days || {}).forEach((entry: any) => {
                const raw = Array.isArray(entry) ? entry : (entry?.ejercicios || entry?.exercises || [])
                if (raw.length > 0) {
                    scheduleHasAnyExercises = true
                    raw.forEach((ex: any) => {
                        if (ex && ex.id !== undefined && ex.id !== null) {
                            const exId = ex.id
                            if (typeof exId === 'number' || (!isNaN(Number(exId)) && !String(exId).includes('-'))) scheduleHasNumericIds = true
                        }
                    })
                }
            })
        })

        if (allAvailableIdsAreTemporary && scheduleHasNumericIds && scheduleHasAnyExercises) {
            if (hasLocalChangesRef.current || (initialSchedule && Object.keys(initialSchedule).length > 0)) return
            setWeeklySchedule({})
            scheduleRef.current = {}
            setNumberOfWeeks(0)
            if (onScheduleChange) setTimeout(() => onScheduleChange({}), 0)
            return
        }

        let changed = false
        const newSchedule: WeeklySchedule = {}
        Object.entries(currentSchedule).forEach(([weekKey, days]) => {
            const weekNumber = parseInt(weekKey)
            const cleanedDays: { [key: number]: DayScheduleEntry } = {}

            Object.entries(days as Record<number, DayScheduleEntry>).forEach(([dayKey, entry]) => {
                const dKey = parseInt(dayKey)
                const raw: Exercise[] = Array.isArray(entry) ? entry : (entry?.ejercicios || entry?.exercises || [])
                const dayHadExercises = raw.length > 0
                const filtered = raw.filter(ex => {
                    if (!ex || ex.id === undefined || ex.id === null) return false
                    const idStr = String(ex.id)
                    const idNum = Number(ex.id)
                    return availableIds.has(idStr) || (!isNaN(idNum) && availableIdsNum.has(idNum)) || availableIds.has(String(idNum))
                })

                if (filtered.length !== raw.length) changed = true
                if (filtered.length > 0) {
                    cleanedDays[dKey] = Array.isArray(entry)
                        ? filtered
                        : {
                            ...(entry as object),
                            ejercicios: filtered,
                            exercises: filtered,
                            blockCount: filtered.length > 0 ? ((entry as any).blockCount || 1) : 0
                        } as DayScheduleEntry
                } else if (dayHadExercises) {
                    changed = true
                } else {
                    cleanedDays[dKey] = entry as DayScheduleEntry
                }
            })
            newSchedule[weekNumber] = cleanedDays
        })

        if (changed) {
            setWeeklySchedule(newSchedule)
            scheduleRef.current = newSchedule
            if (onScheduleChange) setTimeout(() => onScheduleChange(newSchedule), 0)
        }
    }, [availableExerciseIdsFingerprint, onScheduleChange])

    // Carga de estado activo y planificación desde backend
    const loadPlanningFromBackend = useCallback(async () => {
        if (!activityId) return
        if (hasLocalChangesRef.current || (initialSchedule && Object.keys(initialSchedule).length > 0)) return
        if (!availableExerciseIdsFingerprint || availableExerciseIdsFingerprint.trim() === '') return

        setIsLoadingPlanning(true)
        try {
            const resp = await fetch(`/api/get-product-planning?actividad_id=${activityId}`)
            const res = await resp.json()
            if (res.success && res.data) {
                const { weeklySchedule: bSchedule, periods: bPeriods } = res.data
                if (hasLocalChangesRef.current || (initialSchedule && Object.keys(initialSchedule).length > 0)) return

                if (bSchedule && Object.keys(bSchedule).length > 0) {
                    // Backfill missing blockNames
                    Object.keys(bSchedule).forEach(weekKey => {
                        const weekNum = parseInt(weekKey)
                        if (!bSchedule[weekNum]) return

                        Object.keys(bSchedule[weekNum]).forEach(dayKey => {
                            const dayNum = parseInt(dayKey)
                            const dayData = bSchedule[weekNum][dayNum]
                            if (!dayData) return

                            // Ensure structure
                            if (Array.isArray(dayData)) {
                                bSchedule[weekNum][dayNum] = {
                                    ejercicios: dayData,
                                    exercises: dayData,
                                    blockNames: {},
                                    blockCount: 1
                                }
                            }

                            const entry = bSchedule[weekNum][dayNum] as any
                            const currentBlockNames = entry.blockNames || {}
                            const exercises = getExercisesFromDay(entry)
                            const blocksPresent = new Set(exercises.map((e: any) => e.block || e.bloque || 1))
                            const maxBlock = blocksPresent.size > 0 ? Math.max(...Array.from(blocksPresent) as number[]) : 1

                            // If blockNames are missing/empty, try to generate defaults
                            if (Object.keys(currentBlockNames).length === 0) {
                                if (productCategory === 'nutricion') {
                                    // Use standard nutrition names based on block index
                                    blocksPresent.forEach((b: any) => {
                                        const blockIndex = (Number(b) || 1) - 1
                                        if (blockIndex >= 0 && blockIndex < DEFAULT_NUTRITION_BLOCK_NAMES.length) {
                                            currentBlockNames[b] = DEFAULT_NUTRITION_BLOCK_NAMES[blockIndex]
                                        } else {
                                            currentBlockNames[b] = `Desconocido ${b}`
                                        }
                                    })
                                } else {
                                    // Default fitness names
                                    blocksPresent.forEach((b: any) => {
                                        currentBlockNames[b] = `Bloque ${b}`
                                    })
                                }
                            }

                            entry.blockNames = currentBlockNames
                            entry.blockCount = Math.max(entry.blockCount || 1, maxBlock)
                        })
                    })

                    setWeeklySchedule(bSchedule)
                    const weekNumbers = Object.keys(bSchedule).map(Number).filter(n => !isNaN(n) && n > 0)
                    setNumberOfWeeks(weekNumbers.length > 0 ? Math.max(...weekNumbers) : 0)
                    scheduleRef.current = bSchedule
                    previousFingerprintRef.current = null
                }
                if (bPeriods && bPeriods > 0) setPeriods(bPeriods)
                if (onScheduleChange && bSchedule) setTimeout(() => onScheduleChange(bSchedule), 0)
                if (onPeriodsChange && bPeriods) setTimeout(() => onPeriodsChange(bPeriods), 0)
                isInitialMount.current = false
            }
        } catch (e) {
            console.error('Error loadPlanningFromBackend:', e)
        } finally {
            setIsLoadingPlanning(false)
        }
    }, [activityId, availableExerciseIdsFingerprint, initialSchedule, onScheduleChange, onPeriodsChange, productCategory])

    useEffect(() => {
        if (isEditing && activityId && activityId > 0) {
            const hasLocalData = initialSchedule && Object.keys(initialSchedule).length > 0
            if (hasLocalData || hasLocalChangesRef.current) return
            if (availableExerciseIdsFingerprint && availableExerciseIdsFingerprint.trim() !== '') {
                const ids = availableExerciseIdsFingerprint.split(',').filter(Boolean)
                const allTemp = ids.length > 0 && ids.every(id => id.includes('-') || isNaN(Number(id)))
                if (allTemp) {
                    hasLocalChangesRef.current = true
                    return
                }
                loadPlanningFromBackend()
            }
        }
    }, [isEditing, activityId, availableExerciseIdsFingerprint, loadPlanningFromBackend])

    // Polling de estado activo
    useEffect(() => {
        if (!isEditing || !activityId || activityId <= 0 || disableActiveStatusFetchRef.current) return
        if (!availableExerciseIdsFingerprint || !availableExerciseIdsFingerprint.split(',').filter(Boolean).some(id => !id.includes('-') && !isNaN(Number(id)))) return

        const interval = setInterval(async () => {
            try {
                const resp = await fetch(`/api/activity-exercises/${activityId}?t=${Date.now()}`)
                if (resp.status === 400 || resp.status === 403 || resp.status === 404) {
                    disableActiveStatusFetchRef.current = true
                    clearInterval(interval)
                    return
                }
                if (!resp.ok) return
                const res = await resp.json()
                if (res.success && Array.isArray(res.data)) {
                    const map = new Map<number | string, boolean>()
                    res.data.forEach((ex: any) => { if (ex.id) map.set(ex.id, ex.is_active !== false) })
                    setExercisesWithActiveStatus(prev => prev.map((ex: any) => {
                        const id = typeof ex.id === 'string' && ex.id.includes('-') ? null : ex.id
                        if (id && map.has(id)) return { ...ex, is_active: map.get(id), activo: map.get(id) }
                        return ex
                    }))
                }
            } catch (e) { }
        }, 3000)
        return () => clearInterval(interval)
    }, [isEditing, activityId, availableExerciseIdsFingerprint])

    // Carga inicial de platos coach (nutrición)
    useEffect(() => {
        if (productCategory === 'nutricion') {
            const load = async () => {
                try {
                    const resp = await fetch(`/api/coach/exercises?category=nutricion`)
                    if (resp.ok) {
                        const res = await resp.json()
                        if (res.success && Array.isArray(res.data)) {
                            setAllCoachExercises(res.data.map((p: any) => ({
                                id: String(p.id),
                                name: p.nombre || p.name || '',
                                description: p.receta || p.descripcion || '',
                                type: p.tipo || 'otro',
                                tipo: p.tipo || 'otro',
                                calories: p.calorias || 0,
                                calorias: p.calorias || 0,
                                proteinas: p.proteinas || 0,
                                carbohidratos: p.carbohidratos || 0,
                                grasas: p.grasas || 0,
                                duration: p.minutos || 0,
                                duracion_min: p.minutos || 0,
                                is_active: p.is_active !== false && p.activo !== false,
                                activo: p.activo !== false && p.is_active !== false,
                                dificultad: p.dificultad || 'Principiante'
                            })))
                        }
                    }
                } catch (e) { }
            }
            load()
        }
    }, [productCategory])

    // Pool de ejercicios final
    const finalAvailableExercises = useMemo(() => {
        const registry = new Map<string, any>()
        exercisesWithActiveStatus.forEach((row, index) => {
            const rawId = row?.id ?? row?.name ?? `idx-${index}`
            const id = typeof rawId === 'number' ? `id-${rawId}` : `key-${String(rawId).trim().toLowerCase()}`
            if (!registry.has(id)) {
                registry.set(id, row)
            } else {
                const existing = registry.get(id)
                if (!(existing?.is_active !== false && existing?.activo !== false) && (row?.is_active !== false && row?.activo !== false)) {
                    registry.set(id, row)
                }
            }
        })
        const pool = Array.from(registry.values()).map((row, index) => {
            const isNut = row && typeof row === 'object' && ('Nombre' in row || 'Proteínas (g)' in row)
            if (isNut) {
                const type = normalizeNutritionType(row['Tipo'] || row.tipo || 'otro')
                return {
                    id: row.id || `nutrition-${index}`,
                    name: row['Nombre'] || row.nombre || `Plato ${index + 1}`,
                    description: row['Receta'] || row.descripcion || '',
                    duration: 0,
                    type,
                    tipo: type,
                    intensity: 'N/A',
                    equipment: 'N/A',
                    bodyParts: '',
                    calories: parseInt(row['Calorías'] || row.calorias || '0') || 0,
                    proteinas: row.proteinas || parseInt(row['Proteínas (g)'] || '0') || 0,
                    carbohidratos: row.carbohidratos || parseInt(row['Carbohidratos (g)'] || '0') || 0,
                    grasas: row.grasas || parseInt(row['Grasas (g)'] || '0') || 0,
                    is_active: row.is_active !== undefined ? row.is_active : row.activo !== undefined ? row.activo : true,
                    activo: row.activo !== undefined ? row.activo : row.is_active !== undefined ? row.is_active : true,
                }
            }
            return {
                id: row.id || `exercise-${index}`,
                name: row.name || row.nombre_ejercicio || `Ejercicio ${index + 1}`,
                description: row.description || row.descripcion || '',
                duration: parseInt(row.duration || row.duracion_min || '0') || null,
                type: row.type || row.tipo || 'General',
                intensity: row.intensity || row.intensidad || 'Media',
                equipment: row.equipment || row.equipo || 'Ninguno',
                bodyParts: row.bodyParts || row.body_parts || '',
                calories: parseInt(row.calories || row.calorias || '0') || null,
                peso: row.peso || '',
                reps: row.reps || '',
                series: row.series || row.detalle_series || '',
                is_active: row.is_active !== undefined ? row.is_active : row.activo !== undefined ? row.activo : true,
                activo: row.activo !== undefined ? row.activo : row.is_active !== undefined ? row.is_active : true,
            }
        })

        if (productCategory === 'nutricion') {
            const combined = new Map<string, Exercise>()
            allCoachExercises.forEach(ex => combined.set(String(ex.id), ex))
            pool.forEach(ex => combined.set(String(ex.id), ex as any))
            return Array.from(combined.values())
        }
        return pool.length > 0 ? pool as any : allCoachExercises
    }, [exercisesWithActiveStatus, allCoachExercises, productCategory])

    const selectedNutritionTotals = useMemo(() => {
        const totals = { proteinas: 0, carbohidratos: 0, grasas: 0, calorias: 0 }
        if (productCategory !== 'nutricion') return totals
        finalAvailableExercises.forEach((ex: Exercise) => {
            if (!selectedExercises.has(String(ex.id))) return
            totals.proteinas += (ex.proteinas || 0)
            totals.carbohidratos += (ex.carbohidratos || 0)
            totals.grasas += (ex.grasas || 0)
            totals.calorias += (ex.calorias || 0)
        })
        return totals
    }, [finalAvailableExercises, selectedExercises, productCategory])

    // Estadísticas
    const getPatternStats = useCallback(() => {
        let totalExercises = 0, totalDays = 0
        const uniqueIds = new Set<string>(), weeksWithEx = new Set<number>()
        const availableIds = new Set(finalAvailableExercises.map((ex: Exercise) => String(ex.id)))

        for (let w = 1; w <= numberOfWeeks; w++) {
            let weekHasEx = false
            for (const d of DAYS) {
                const exList = getExercisesFromDay(weeklySchedule[w]?.[d.key]).filter((ex: Exercise) => {
                    return !isGenericExercise(ex) && availableIds.has(String(ex.id)) && ex.activo !== false && ex.is_active !== false
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
    const weeksExceeded = planLimits?.weeksLimit !== null && (planLimits?.weeksLimit ?? 0) > 0 && summaryStats.totalWeeks > (planLimits?.weeksLimit ?? 0)
    const sessionsLimit = (planLimits?.weeksLimit ?? 0) * 7
    const sessionsExceeded = planLimits?.weeksLimit !== null && (planLimits?.weeksLimit ?? 0) > 0 && summaryStats.totalSessions > sessionsLimit
    const uniqueExceeded = planLimits?.activitiesLimit !== null && (planLimits?.activitiesLimit ?? 0) > 0 && summaryStats.uniqueExercises > (planLimits?.activitiesLimit ?? 0)

    useEffect(() => {
        if (onStatsChange) {
            const stats = getPatternStats()
            if (JSON.stringify(stats) !== lastStatsNotified.current) {
                lastStatsNotified.current = JSON.stringify(stats)
                setTimeout(() => onStatsChange(stats), 0)
            }
        }
    }, [summaryStats, onStatsChange, getPatternStats])

    // Handlers
    const toggleExerciseSelection = (id: string) => {
        const ex = finalAvailableExercises.find((e: Exercise) => String(e.id) === id)
        if (!ex || ex.is_active === false || ex.activo === false) return
        const next = new Set(selectedExercises)
        if (next.has(id)) {
            next.delete(id)
        } else {
            next.add(id)
        }
        setSelectedExercises(next)
    }

    const selectAllExercises = () => {
        const activeIds = finalAvailableExercises.filter((ex: Exercise) => ex.is_active !== false && ex.activo !== false).map((ex: Exercise) => String(ex.id))
        if (activeIds.length > 0 && activeIds.every((id: string) => selectedExercises.has(id))) {
            setSelectedExercises(new Set())
        } else {
            setSelectedExercises(new Set(activeIds))
        }
    }

    const clearSelection = () => setSelectedExercises(new Set())

    const assignSelectedToDay = (w: number, d: number) => {
        saveToHistory(weeklySchedule)
        const next = { ...weeklySchedule }
        if (!next[w]) next[w] = {}
        const dayEntry = next[w][d]
        const currentExercises = Array.isArray(dayEntry) ? dayEntry : (dayEntry?.ejercicios || dayEntry?.exercises || [])

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
        if (onScheduleChange) setTimeout(() => onScheduleChange(next), 0)
    }

    const handleDayClick = (d: number) => {
        if (selectedExercises.size > 0) assignSelectedToDay(currentWeek, d)
        else { setSelectedDay(String(d)); setShowDayExercises(true) }
    }

    const addWeek = () => {
        const existing = Object.keys(weeklySchedule).map(Number).filter(n => !isNaN(n) && n > 0).sort((a, b) => a - b)
        const max = existing.length > 0 ? Math.max(...existing) : 0
        const nextW = max + 1
        const totalWithP = (existing.length + 1) * periods
        if (planLimits?.weeksLimit && totalWithP > planLimits.weeksLimit) {
            setWeekLimitError(`Límite de semanas (${planLimits.weeksLimit}) alcanzado.`)
            return
        }
        setWeekLimitError(null)
        saveToHistory(weeklySchedule)
        const nextS = { ...weeklySchedule, [nextW]: {} }
        for (let i = 1; i <= 7; i++) nextS[nextW][i] = []
        setWeeklySchedule(nextS)
        setNumberOfWeeks(nextW)
        justAddedWeekRef.current = nextW
        userAddedWeeksRef.current.add(nextW)
        setCurrentWeek(nextW)
        if (onScheduleChange) setTimeout(() => onScheduleChange(nextS), 0)
    }

    const removeWeek = (w: number = currentWeek) => {
        if (numberOfWeeks <= 1) return
        saveToHistory(weeklySchedule)
        const temp = { ...weeklySchedule }; delete temp[w]
        userAddedWeeksRef.current.delete(w)
        const reindexed: WeeklySchedule = {}
        let i = 1
        Object.keys(temp).map(Number).sort((a, b) => a - b).forEach(k => { reindexed[i] = temp[k]; i++ })
        setWeeklySchedule(reindexed)
        const total = Math.max(1, Object.keys(reindexed).length)
        setNumberOfWeeks(total)
        setCurrentWeek(prev => Math.max(1, Math.min(prev, total)))
        if (onScheduleChange) setTimeout(() => onScheduleChange(reindexed), 0)
    }

    const replicateWeeks = () => {
        if (replicationCount <= 1) return
        const next = { ...weeklySchedule }
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
        if (onScheduleChange) setTimeout(() => onScheduleChange(next), 0)
    }

    const updateDayExercises = (payload: DaySchedulePayload) => {
        saveToHistory(weeklySchedule)
        const exList = getExercisesFromDay(payload)
        setWeeklySchedule(prev => {
            const next = { ...prev }
            if (!next[currentWeek]) next[currentWeek] = {}
            const dNum = parseInt(selectedDay!)
            if (exList.length === 0) {
                delete next[currentWeek][dNum]
                if (Object.keys(next[currentWeek]).length === 0) delete next[currentWeek]
            } else {
                next[currentWeek][dNum] = payload
            }
            const key = `${currentWeek}-${dNum}`
            setSimilarDays(s => ({ ...s, [key]: findSimilarDays(key, exList) }))
            if (onScheduleChange) setTimeout(() => onScheduleChange(next), 0)
            return next
        })
    }

    const applyToSimilarDays = (blockNames: any, exercisesList: Exercise[], blockCountCount: number) => {
        saveToHistory(weeklySchedule)
        const valid = exercisesList.filter(e => !isGenericExercise(e))
        if (valid.length === 0) return
        const curKey = `${currentWeek}-${selectedDay}`
        const similar = findSimilarDays(curKey, getExercisesForDay(currentWeek, parseInt(selectedDay!)))

        setWeeklySchedule(prev => {
            const next = { ...prev }
            if (!next[currentWeek]) next[currentWeek] = {}
            next[currentWeek][parseInt(selectedDay!)] = { ejercicios: valid, exercises: valid, blockNames, blockCount: blockCountCount }
            similar.forEach(k => {
                const [w, d] = k.split('-').map(Number)
                if (!next[w]) next[w] = {}
                next[w][d] = { ejercicios: valid, exercises: valid, blockNames, blockCount: blockCountCount }
            })
            if (onScheduleChange) setTimeout(() => onScheduleChange(next), 0)
            return next
        })
    }

    return {
        weeklySchedule,
        numberOfWeeks,
        replicationCount,
        setReplicationCount,
        similarDays,
        selectedExercises,
        weekLimitError,
        searchTerm,
        setSearchTerm,
        isExerciseSelectorOpen,
        setIsExerciseSelectorOpen,
        currentWeek,
        setCurrentWeek,
        selectedDay,
        showDayExercises,
        periods,
        isLoadingPlanning,
        finalAvailableExercises,
        selectedNutritionTotals,
        summaryStats,
        weeksExceeded,
        sessionsExceeded,
        uniqueExceeded,
        canUndo,
        weeksLimit: planLimits?.weeksLimit ?? null,
        activitiesLimit: planLimits?.activitiesLimit ?? null,

        // Handlers
        addWeek,
        removeWeek,
        replicateWeeks,
        increasePeriods: () => {
            const next = Math.min(12, periods + 1)
            const validW = getWeeksWithExercises().size || 1
            if (planLimits?.weeksLimit && validW * next > planLimits.weeksLimit) return
            setPeriods(next)
        },
        decreasePeriods: () => setPeriods(Math.max(1, periods - 1)),
        handleUndo,
        toggleExerciseSelection,
        selectAllExercises,
        clearSelection,
        handleDayClick,
        openDayExercises: (d: string) => { setSelectedDay(d); setShowDayExercises(true) },
        closeDayExercises: () => { setSelectedDay(null); setShowDayExercises(false) },
        getExercisesForDay,
        getBlockNamesForDay,
        getBlockCountForDay,
        updateDayExercises,
        applyToSimilarDays,
        getWeeksWithExercises
    }
}
