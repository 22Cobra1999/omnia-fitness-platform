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
    bunnyVideoTitles?: Record<string, string>
    sortConfig?: { key: string; direction: 'asc' | 'desc' } | null
    onSort?: (key: string) => void
    newlyAddedIds?: Set<string | number>
    onDelete?: (index: number) => void
}

export function CsvTable({
    productCategory,
    newlyAddedIds = new Set(),
    ...props
}: CsvTableProps) {
    return (
        <div className="w-full overflow-x-auto pb-4" id="csv-table-scroll-target">
            {productCategory === 'nutricion' ? (
                <NutritionTable
                    {...props}
                    newlyAddedIds={newlyAddedIds}
                    duplicateNames={props.duplicateNames || []}
                    loadingExisting={!!props.loadingExisting}
                    bunnyVideoTitles={props.bunnyVideoTitles}
                    sortConfig={props.sortConfig}
                    onSort={props.onSort}
                />
            ) : (
                <FitnessTable
                    {...props}
                    newlyAddedIds={newlyAddedIds}
                    exerciseUsage={props.exerciseUsage || {}}
                    activityNamesMap={props.activityNamesMap || {}}
                    activityImagesMap={props.activityImagesMap || {}}
                    duplicateNames={props.duplicateNames || []}
                    loadingExisting={!!props.loadingExisting}
                    bunnyVideoTitles={props.bunnyVideoTitles}
                    sortConfig={props.sortConfig}
                    onSort={props.onSort}
                />
            )}
        </div>
    )
}
