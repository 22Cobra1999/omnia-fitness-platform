import { useState, useCallback } from 'react'
import { Exercise } from '../planner-types'

interface UseWeeklyPlanSelectionProps {
    finalAvailableExercises: Exercise[]
}

export function useWeeklyPlanSelection({
    finalAvailableExercises
}: UseWeeklyPlanSelectionProps) {
    const [selectedExercises, setSelectedExercises] = useState<Set<string>>(new Set())

    /**
     * Toggles the selection of an individual exercise.
     * Prevents selection of inactive exercises.
     */
    const toggleExerciseSelection = useCallback((id: string) => {
        const ex = finalAvailableExercises.find((e: Exercise) => String(e.id) === id)
        if (!ex || ex.is_active === false || ex.activo === false) return

        setSelectedExercises(prev => {
            const next = new Set(prev)
            if (next.has(id)) {
                next.delete(id)
            } else {
                next.add(id)
            }
            return next
        })
    }, [finalAvailableExercises])

    /**
     * Toggles between selecting all active exercises and clearing the selection.
     */
    const selectAllExercises = useCallback(() => {
        const activeIds = finalAvailableExercises
            .filter((ex: Exercise) => ex.is_active !== false && ex.activo !== false)
            .map((ex: Exercise) => String(ex.id))

        setSelectedExercises(prev => {
            if (activeIds.length > 0 && activeIds.every((id: string) => prev.has(id))) {
                return new Set()
            } else {
                return new Set(activeIds)
            }
        })
    }, [finalAvailableExercises])

    /**
     * Clears all selected exercises.
     */
    const clearSelection = useCallback(() => {
        setSelectedExercises(new Set())
    }, [])

    return {
        selectedExercises,
        setSelectedExercises,
        toggleExerciseSelection,
        selectAllExercises,
        clearSelection
    }
}
