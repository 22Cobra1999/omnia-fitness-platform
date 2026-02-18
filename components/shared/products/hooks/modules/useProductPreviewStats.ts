import { useMemo } from "react"
import { ProductType } from "../../product-constants"

interface UseProductPreviewStatsProps {
    selectedType: ProductType | null
    workshopSchedule: any[]
    persistentCalendarSchedule: any
    periods: number
}

export function useProductPreviewStats({
    selectedType,
    workshopSchedule,
    persistentCalendarSchedule,
    periods
}: UseProductPreviewStatsProps) {
    const derivedPreviewStats = useMemo(() => {
        if (selectedType === 'workshop') {
            if (!workshopSchedule || workshopSchedule.length === 0) {
                return { sesiones: 0, ejerciciosTotales: 0, ejerciciosUnicos: 0, semanas: 0 }
            }

            const uniqueDays = new Set(workshopSchedule.map(s => s.date)).size
            const uniqueThemes = new Set(workshopSchedule.map(s => s.title).filter(Boolean)).size

            // Calculate weeks from date range
            const sortedDates = [...workshopSchedule]
                .map(s => new Date(s.date))
                .sort((a, b) => a.getTime() - b.getTime())

            let weeks = 0
            if (sortedDates.length > 0) {
                const firstDate = sortedDates[0]
                const lastDate = sortedDates[sortedDates.length - 1]
                const diffTime = Math.abs(lastDate.getTime() - firstDate.getTime())
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
                weeks = Math.max(1, Math.ceil((diffDays + 1) / 7))
            }

            return {
                sesiones: uniqueDays,
                ejerciciosTotales: workshopSchedule.length,
                ejerciciosUnicos: uniqueThemes,
                semanas: weeks
            }
        }

        const schedule = persistentCalendarSchedule
        if (!schedule || typeof schedule !== 'object') return { sesiones: 0, ejerciciosTotales: 0, ejerciciosUnicos: 0, semanas: 0 }
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
        return {
            sesiones: totalDaysWithExercises * mul,
            ejerciciosTotales: totalEntries * mul,
            ejerciciosUnicos: uniqueIds.size,
            semanas: 0 // Will be handled by weeklyPlan logic if needed
        }
    }, [persistentCalendarSchedule, periods, selectedType, workshopSchedule])

    return {
        derivedPreviewStats
    }
}
