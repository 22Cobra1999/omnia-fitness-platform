import { useState, useCallback } from 'react'
import { ExerciseExecution } from '../types'
import { getDayName } from '../utils/date-helpers'

export function useFitness(
    supabase: any,
    clientId: string,
    fetchClientCalendarSummary: () => Promise<void>,
    loadDayActivityDetails: (day: string, actId: number) => Promise<void>,
    setCascadeModal: (modal: any) => void,
    setLoading: (val: boolean) => void
) {
    const [editingExerciseId, setEditingExerciseId] = useState<string | null>(null)
    const [editingOriginalExercise, setEditingOriginalExercise] = useState<ExerciseExecution | null>(null)
    const [availableExercises, setAvailableExercises] = useState<any[]>([])
    const [showExerciseDropdown, setShowExerciseDropdown] = useState(false)

    const canEditFitnessForDay = useCallback((ex: ExerciseExecution) => {
        const today = new Date().toISOString().split('T')[0]
        return ex.fecha_ejercicio >= today && !ex.completado
    }, [])

    const loadAvailableExercises = useCallback(async (activityId: number) => {
        const { data } = await supabase.from('ejercicios_detalles').select('*').contains('activity_id', { [activityId]: {} })
        setAvailableExercises(data || [])
    }, [supabase])

    const handleChangeExercise = useCallback((newId: string) => {
        // Logic to update exercise choice...
    }, [])

    return {
        editingExerciseId, setEditingExerciseId, setEditingOriginalExercise,
        showExerciseDropdown, setShowExerciseDropdown, availableExercises,
        loadAvailableExercises, handleChangeExercise, canEditFitnessForDay
    }
}
