
import React from 'react'

interface CsvLimitBarProps {
    allDataLength: number
    existingCount: number
    newExercisesCount: number
    planLimits: {
        planType?: string
        activitiesLimit?: number
    } | null
    productCategory: 'fitness' | 'nutricion'
}

export function CsvLimitBar({
    allDataLength,
    existingCount,
    newExercisesCount,
    planLimits,
    productCategory
}: CsvLimitBarProps) {
    const activitiesLimitValue = planLimits?.activitiesLimit || null
    const exceedsActivitiesLimit = activitiesLimitValue !== null && allDataLength > activitiesLimitValue

    if (allDataLength === 0 && existingCount === 0) return null

    return (
        <div className="mb-4 w-full">
            <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-gray-300">
                    {productCategory === 'nutricion' ? 'Resumen de Platos' : 'Resumen de Ejercicios'}
                </h4>
                <div className={`text-xs ${exceedsActivitiesLimit ? 'text-red-400 font-semibold' : 'text-gray-400'}`}>
                    {activitiesLimitValue !== null
                        ? `${allDataLength}/${activitiesLimitValue}${planLimits?.planType ? ` (Plan ${planLimits.planType})` : ''}`
                        : `${allDataLength} ${productCategory === 'nutricion' ? 'platos' : 'ejercicios'}`}
                </div>
            </div>

            <div className={`flex rounded-xl overflow-hidden h-6 mb-2 w-full ${exceedsActivitiesLimit ? 'ring-1 ring-red-500/60' : ''}`}>
                {/* New Exercises/Dishes */}
                {newExercisesCount > 0 && (
                    <div
                        className="bg-[#FF7939] flex items-center justify-center text-white text-xs font-medium min-w-[24px]"
                        style={{
                            width: activitiesLimitValue && activitiesLimitValue > 0
                                ? `${Math.min((newExercisesCount / activitiesLimitValue) * 100, 100)}%`
                                : `${allDataLength > 0 ? (newExercisesCount / Math.max(allDataLength, 1)) * 100 : 0}%`
                        }}
                        title={`${newExercisesCount} nuevos`}
                    >
                        {newExercisesCount}
                    </div>
                )}

                {/* Existing Exercises/Dishes */}
                {existingCount > 0 && (
                    <div
                        className="bg-[#FF8C42] flex items-center justify-center text-white text-xs font-medium min-w-[24px]"
                        style={{
                            width: activitiesLimitValue && activitiesLimitValue > 0
                                ? `${Math.min((existingCount / activitiesLimitValue) * 100, 100)}%`
                                : `${allDataLength > 0 ? (existingCount / Math.max(allDataLength, 1)) * 100 : 0}%`
                        }}
                        title={`${existingCount} existentes`}
                    >
                        {existingCount}
                    </div>
                )}

                {/* Free Space */}
                {activitiesLimitValue !== null && allDataLength < activitiesLimitValue && (
                    <div
                        className="bg-gray-700/50 flex items-center justify-center text-gray-400 text-xs font-medium"
                        style={{ width: `${((activitiesLimitValue - allDataLength) / activitiesLimitValue) * 100}%` }}
                        title={`${activitiesLimitValue - allDataLength} espacios libres`}
                    >
                        {activitiesLimitValue - allDataLength > 0 && (activitiesLimitValue - allDataLength)}
                    </div>
                )}

                {/* Empty State */}
                {allDataLength === 0 && (
                    <div className="w-full bg-gray-700 flex items-center justify-center text-gray-400 text-xs">
                        Sin items
                    </div>
                )}
            </div>

            <div className="flex gap-4 text-xs text-gray-400">
                <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded bg-[#FF7939]"></div>
                    <span>Nuevos: {newExercisesCount}</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded bg-[#FF8C42]"></div>
                    <span>Existentes: {existingCount}</span>
                </div>
                {activitiesLimitValue !== null && allDataLength < activitiesLimitValue && (
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded bg-gray-700/50"></div>
                        <span>Libres: {activitiesLimitValue - allDataLength}</span>
                    </div>
                )}
            </div>
        </div>
    )
}
