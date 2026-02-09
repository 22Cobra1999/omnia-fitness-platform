import React from 'react'
import { ExerciseData } from '../types'
import { FitnessTable } from './FitnessTable'
import { NutritionTable } from './NutritionTable'

interface CsvTableProps {
    data: ExerciseData[]
    startIndex: number
    selectedRows: Set<number>
    toggleRow: (actualIndex: number) => void
    toggleSelectAll: () => void
    isAllSelected: boolean
    onEdit: (item: ExerciseData, index: number) => void
    productCategory: 'fitness' | 'nutricion'
    activityId: number
    planLimits?: any
    exerciseUsage?: Record<number, { activities: Array<{ id: number; name: string }> }>
    activityNamesMap?: Record<number, string>
    activityImagesMap?: Record<number, string | null>
    duplicateNames?: string[]
    loadingExisting?: boolean
}

export function CsvTable({
    productCategory,
    ...props
}: CsvTableProps) {
    return (
        <div className="w-full overflow-x-auto pb-4">
            {productCategory === 'nutricion' ? (
                <NutritionTable
                    {...props}
                    duplicateNames={props.duplicateNames || []}
                    loadingExisting={!!props.loadingExisting}
                />
            ) : (
                <FitnessTable
                    {...props}
                    exerciseUsage={props.exerciseUsage || {}}
                    activityNamesMap={props.activityNamesMap || {}}
                    activityImagesMap={props.activityImagesMap || {}}
                    duplicateNames={props.duplicateNames || []}
                    loadingExisting={!!props.loadingExisting}
                />
            )}
        </div>
    )
}
