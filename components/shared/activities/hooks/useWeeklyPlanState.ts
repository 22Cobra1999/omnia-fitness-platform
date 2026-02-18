import { useState, useMemo, useEffect } from 'react'
import { WeeklySchedule } from '../planner-types'
import { getExercisesFromDay, DEFAULT_NUTRITION_BLOCK_NAMES } from '../planner-utils'

/**
 * Helper to sanitize and fill block names based on product category.
 * Extracted from useWeeklyPlanner.ts
 */
export const sanitizeScheduleHelper = (schedule: WeeklySchedule, productCategory: string): WeeklySchedule => {
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

            currentEntry.blockCount = Math.max(currentEntry.blockCount || 1, maxBlock)
        })
    })
    return clean
}

interface UseWeeklyPlanStateProps {
    initialSchedule: WeeklySchedule | undefined
    productCategory: string
    onScheduleChange?: (schedule: WeeklySchedule) => void
}

export function useWeeklyPlanState({
    initialSchedule,
    productCategory,
    onScheduleChange
}: UseWeeklyPlanStateProps) {
    const [weeklySchedule, setWeeklySchedule] = useState<WeeklySchedule>(() =>
        sanitizeScheduleHelper(initialSchedule || {}, productCategory || '')
    )

    const numberOfWeeks = useMemo(() => Object.keys(weeklySchedule).length, [weeklySchedule])

    // Sync with parent if provided
    useEffect(() => {
        if (onScheduleChange) {
            onScheduleChange(weeklySchedule)
        }
    }, [weeklySchedule, onScheduleChange])

    return {
        weeklySchedule,
        setWeeklySchedule,
        numberOfWeeks
    }
}
