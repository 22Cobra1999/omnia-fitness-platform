import React from 'react'
import { WeeklyExercisePlanner } from "../../activities/weekly-exercise-planner"
import { getPlanLimit } from '@/lib/utils/plan-limits'

interface WeeklyPlanStepProps {
    editingProduct?: any
    persistentCsvData?: any[]
    coachCatalogExercises?: any[]
    productCategory: 'fitness' | 'nutricion'
    persistentCalendarSchedule: any
    periods: number
    setPersistentCalendarSchedule: (schedule: any) => void
    setPeriods: (periods: number) => void
    setWeeklyStats: (stats: any | ((prev: any) => any)) => void
    coachCatalogError?: string | null
    coachCatalogLoading: boolean
    planType: any
}

export const WeeklyPlanStep: React.FC<WeeklyPlanStepProps> = ({
    editingProduct,
    persistentCsvData,
    coachCatalogExercises,
    productCategory,
    persistentCalendarSchedule,
    periods,
    setPersistentCalendarSchedule,
    setPeriods,
    setWeeklyStats,
    coachCatalogError,
    coachCatalogLoading,
    planType
}) => {
    return (
        <div className="space-y-6">
            {coachCatalogError && (
                <div className="text-xs text-red-400">{coachCatalogError}</div>
            )}
            <WeeklyExercisePlanner
                activityId={editingProduct?.id}
                exercises={(persistentCsvData && persistentCsvData.length > 0 ? persistentCsvData : coachCatalogExercises) || []}
                productCategory={productCategory}
                initialSchedule={persistentCalendarSchedule}
                initialPeriods={periods}
                onScheduleChange={setPersistentCalendarSchedule}
                onPeriodsChange={setPeriods}
                onStatsChange={(stats: any) => {
                    setWeeklyStats((prev: any) => ({
                        ...prev,
                        semanas: stats?.totalWeeks ?? 0,
                        sesiones: stats?.totalSessions ?? stats?.totalDays ?? 0,
                        ejerciciosTotales: stats?.totalExercisesReplicated ?? stats?.totalExercises ?? 0,
                        ejerciciosUnicos: stats?.uniqueExercises ?? 0
                    }))
                }}
                planLimits={{
                    weeksLimit: getPlanLimit(planType, 'weeksPerProduct')
                }}
            />

            {coachCatalogLoading && (
                <div className="text-xs text-gray-500">Cargando ejercicios…</div>
            )}
        </div>
    )
}
