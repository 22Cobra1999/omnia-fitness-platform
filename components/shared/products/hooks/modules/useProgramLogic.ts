import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { ProductType } from '../../product-constants'

export function useProgramLogic(
    isOpen: boolean,
    selectedType: ProductType | null,
    editingProduct: any,
    productCategory: 'fitness' | 'nutricion'
) {
    const [persistentCsvData, setPersistentCsvData] = useState<any[] | undefined>(undefined)
    const [persistentSelectedRows, setPersistentSelectedRows] = useState<Set<number>>(new Set())
    const [persistentCalendarSchedule, setPersistentCalendarSchedule] = useState<any>({})
    const [planningClearedByContentChange, setPlanningClearedByContentChange] = useState(false)
    const [periods, setPeriods] = useState(1)

    const [coachCatalogExercises, setCoachCatalogExercises] = useState<any[]>([])
    const [coachCatalogLoading, setCoachCatalogLoading] = useState(false)
    const [coachCatalogError, setCoachCatalogError] = useState<string | null>(null)

    // Video mapping for exercises
    const [exerciseVideoFiles, setExerciseVideoFiles] = useState<Record<string, File>>({})
    const [videosPendingDeletion, setVideosPendingDeletion] = useState<Array<{
        exerciseId: string | number
        bunnyVideoId: string
        bunnyLibraryId?: number
        videoUrl?: string
    }>>([])

    const [weeklyStats, setWeeklyStats] = useState({
        semanas: 0,
        sesiones: 0,
        ejerciciosTotales: 0,
        ejerciciosUnicos: 0
    })

    const cachedPlanningFromDBRef = useRef<any>(null)

    const loadPlanningFromDB = async () => {
        if (!editingProduct?.id) return
        try {
            const response = await fetch(`/api/get-product-planning?actividad_id=${editingProduct.id}`)
            const json = await response.json()
            if (response.ok && json.success) {
                const weeklySchedule = json.data?.weeklySchedule || {}
                const loadedPeriods = json.data?.periods || 1
                cachedPlanningFromDBRef.current = { weeklySchedule, periods: loadedPeriods }
                setPersistentCalendarSchedule(weeklySchedule)
                setPeriods(loadedPeriods)
            }
        } catch (e) {
            console.error('Error loading planning', e)
        }
    }

    // Load planning when editing
    useEffect(() => {
        if (isOpen && selectedType === 'program' && editingProduct?.id && !planningClearedByContentChange) {
            if (cachedPlanningFromDBRef.current) {
                setPersistentCalendarSchedule(cachedPlanningFromDBRef.current.weeklySchedule)
                setPeriods(cachedPlanningFromDBRef.current.periods)
            } else {
                loadPlanningFromDB()
            }
        }
    }, [isOpen, selectedType, editingProduct?.id, planningClearedByContentChange])

    // Load coach catalog
    const loadCoachCatalog = useCallback(async () => {
        if (!isOpen) return
        setCoachCatalogLoading(true)
        setCoachCatalogError(null)
        try {
            const category = productCategory
            const res = await fetch(`/api/coach/exercises?category=${category}&active=true`)
            const data = await res.json()

            if (!res.ok) throw new Error(data.error || 'Failed to fetch catalog')

            if (data.success && Array.isArray(data.data)) {
                setCoachCatalogExercises(data.data)
            } else {
                setCoachCatalogExercises([])
            }
        } catch (err: any) {
            console.error('Error loading coach catalog:', err)
            setCoachCatalogError(err.message)
            setCoachCatalogExercises([])
        } finally {
            setCoachCatalogLoading(false)
        }
    }, [productCategory, isOpen])

    useEffect(() => {
        loadCoachCatalog()
    }, [loadCoachCatalog])

    // Derived stats
    const derivedPreviewStats = useMemo(() => {
        const schedule = persistentCalendarSchedule
        if (!schedule || typeof schedule !== 'object') return { sesiones: 0, ejerciciosTotales: 0, ejerciciosUnicos: 0 }

        const uniqueIds = new Set<string>()
        let totalEntries = 0
        let totalDaysWithExercises = 0

        for (const weekKey in schedule) {
            const weekData = schedule[weekKey]
            if (!weekData || typeof weekData !== 'object') continue

            for (const dayKey in weekData) {
                const dayData = weekData[dayKey]
                if (!dayData) continue

                let dayExercises = Array.isArray(dayData) ? dayData : ((dayData as any).ejercicios || (dayData as any).exercises || [])
                if (dayExercises.length > 0) {
                    totalDaysWithExercises += 1
                    dayExercises.forEach((ex: any) => {
                        if (ex && ex.id) uniqueIds.add(String(ex.id))
                        totalEntries += 1
                    })
                }
            }
        }

        const mul = periods || 1
        const stats = {
            sesiones: totalDaysWithExercises * mul,
            ejerciciosTotales: totalEntries * mul,
            ejerciciosUnicos: uniqueIds.size
        }

        // Update local stats state if needed, but return calculation
        return stats
    }, [persistentCalendarSchedule, periods])

    // Sync derived stats to weeklyStats state for persistence
    useEffect(() => {
        const stats = derivedPreviewStats
        const weeksCount = Object.keys(persistentCalendarSchedule || {}).length
        const totalWeeks = weeksCount * (periods || 1)

        setWeeklyStats({
            semanas: totalWeeks,
            sesiones: stats.sesiones,
            ejerciciosTotales: stats.ejerciciosTotales,
            ejerciciosUnicos: stats.ejerciciosUnicos
        })
    }, [derivedPreviewStats, persistentCalendarSchedule, periods])


    const getExerciseVideoKey = useCallback((exercise: any, index: number) => {
        if (!exercise) return `exercise-index-${index}`
        const id = exercise.id ?? exercise.tempId ?? exercise.tempRowId
        return id ? `exercise-${id}` : `exercise-index-${index}`
    }, [])


    const [isVideoModalOpen, setIsVideoModalOpen] = useState(false)

    // ... (existing code)

    const handleVideoSelection = useCallback((selection: any) => {
        if (!selection) {
            setIsVideoModalOpen(false)
            return
        }
        if (!persistentCsvData || persistentCsvData.length === 0) {
            setIsVideoModalOpen(false)
            return
        }

        const selectedIndices = Array.from(persistentSelectedRows)
        const { videoUrl, videoFile, fileName, bunnyVideoId, bunnyLibraryId, thumbnailUrl } = selection

        if (!videoUrl || videoUrl.trim() === '') {
            setIsVideoModalOpen(false)
            return
        }

        const updatedCsvData = persistentCsvData.map((exercise, index) => {
            if (!selectedIndices.includes(index)) return exercise
            if (!exercise || typeof exercise !== 'object') return exercise

            const updatedExercise = { ...exercise }
            updatedExercise.video_url = videoUrl
            if (videoFile) {
                updatedExercise.video_file_name = fileName || videoFile.name
                updatedExercise.video_source = 'local'
            } else {
                updatedExercise.video_file_name = fileName
                updatedExercise.video_source = 'existing'
                updatedExercise.bunny_video_id = bunnyVideoId
                updatedExercise.bunny_library_id = bunnyLibraryId
                updatedExercise.video_thumbnail_url = thumbnailUrl
            }
            return updatedExercise
        })

        setPersistentCsvData(updatedCsvData)

        // Handle file storage
        if (videoFile) {
            setExerciseVideoFiles(prev => {
                const next = { ...prev }
                selectedIndices.forEach(idx => {
                    const ex = updatedCsvData[idx]
                    const key = getExerciseVideoKey(ex, idx)
                    if (key) next[key] = videoFile
                })
                return next
            })
        }

        setPersistentSelectedRows(new Set())
        setIsVideoModalOpen(false)
    }, [persistentCsvData, persistentSelectedRows, getExerciseVideoKey])

    const handleClearExerciseVideo = useCallback((index: number, exercise: any, meta?: any) => {
        setExerciseVideoFiles(prev => {
            const next = { ...prev }
            const key = getExerciseVideoKey(exercise, index)
            if (key && next[key]) delete next[key]
            return next
        })

        if (meta?.bunnyVideoId) {
            setVideosPendingDeletion(prev => [
                ...prev,
                {
                    exerciseId: exercise?.id,
                    bunnyVideoId: meta.bunnyVideoId,
                    bunnyLibraryId: meta.bunnyLibraryId,
                    videoUrl: meta.videoUrl
                }
            ])
        }
    }, [getExerciseVideoKey])

    const openVideoModal = useCallback(() => {
        if (persistentSelectedRows.size === 0) {
            return
        }
        setIsVideoModalOpen(true)
    }, [persistentSelectedRows.size])

    const getStoredExerciseVideoFile = useCallback((exercise: any, index: number) => {
        const key = getExerciseVideoKey(exercise, index)
        return exerciseVideoFiles[key] || null
    }, [exerciseVideoFiles, getExerciseVideoKey])

    return {
        // State
        persistentCsvData,
        setPersistentCsvData,
        persistentSelectedRows,
        setPersistentSelectedRows,
        persistentCalendarSchedule,
        setPersistentCalendarSchedule,
        planningClearedByContentChange,
        setPlanningClearedByContentChange,
        periods,
        setPeriods,
        coachCatalogExercises,
        coachCatalogLoading,
        coachCatalogError,
        exerciseVideoFiles,
        setExerciseVideoFiles,
        videosPendingDeletion,
        setVideosPendingDeletion,
        weeklyStats,
        setWeeklyStats,
        isVideoModalOpen,
        setIsVideoModalOpen,

        // Handlers
        loadPlanningFromDB,
        getExerciseVideoKey,
        handleVideoSelection,
        handleClearExerciseVideo,
        openVideoModal,
        getStoredExerciseVideoFile
    }
}
