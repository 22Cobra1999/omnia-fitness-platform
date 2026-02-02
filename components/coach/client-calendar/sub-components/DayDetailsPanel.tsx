import React from 'react'
import { Clock, RotateCcw } from 'lucide-react'
import { DaySummaryRow } from './DaySummaryRow'
import { ExerciseExecution, ClientDaySummaryRow } from '../types'
import { formatDate, formatMinutesCompact } from '../utils/date-helpers'

interface DayDetailsPanelProps {
    selectedDate: Date
    summaryRowsByDate: Record<string, ClientDaySummaryRow[]>
    currentCoachId: string | null
    clientId: string
    isSelectingNewDate: boolean
    handleEditDate: (date: Date) => void
    expandedActivityKeys: Record<string, boolean>
    setExpandedActivityKeys: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
    loadDayActivityDetails: (day: string, id: number) => Promise<void>
    loadEventDetails: (id: string) => Promise<void>
    eventDetailsByKey: Record<string, any>
    activityDetailsByKey: Record<string, ExerciseExecution[]>
    nutritionPlateOptionsByActivity: Record<string, any[]>
    canEditNutritionForDay: (ex: ExerciseExecution) => boolean
    canEditFitnessForDay: (ex: ExerciseExecution) => boolean
    handleEditNutrition: (ex: ExerciseExecution) => void
    editingExerciseId: string | null
    setEditingExerciseId: (id: string | null) => void
    setEditingOriginalExercise: (ex: ExerciseExecution | null) => void
    loadAvailableExercises: (id: number) => Promise<void>
    showExerciseDropdown: boolean
    setShowExerciseDropdown: (show: boolean) => void
    availableExercises: any[]
    handleChangeExercise: (id: string) => void
    editingNutritionId: string | null
    editingNutritionPlateId: string | null
    editingNutritionMacros: any
    setEditingNutritionPlateId: (id: string | null) => void
    setEditingNutritionMacros: (macros: any) => void
    handleOpenIngredients: (ex: ExerciseExecution) => void
    handleSaveNutrition: (ex: ExerciseExecution) => void
    handleCancelNutrition: () => void
    setConfirmDeleteNutritionId: (id: string | null) => void
    router: any
}

export const DayDetailsPanel: React.FC<DayDetailsPanelProps> = (props) => {
    const { selectedDate, summaryRowsByDate, currentCoachId, clientId, isSelectingNewDate, handleEditDate } = props
    const dayStr = selectedDate.toISOString().split('T')[0]
    const rows = summaryRowsByDate[dayStr] || []

    const totalMins = rows.reduce((acc, r) => acc + (Number(r.total_mins ?? 0) || 0), 0)
    const ownedMins = rows.reduce((acc, r) => {
        if (r.activity_id === null || r.activity_id === undefined) return acc
        if (!currentCoachId) return acc + (Number(r.total_mins ?? 0) || 0)
        return String(r.coach_id) === String(currentCoachId) ? acc + (Number(r.total_mins ?? 0) || 0) : acc
    }, 0)
    const otherMinsTotal = Math.max(0, totalMins - ownedMins)

    if (rows.length === 0) return <div className="text-sm text-gray-500">Sin actividades para este día</div>

    const ownedActivityRows = rows.filter(r => {
        if (r.calendar_event_id) {
            if (!currentCoachId) return true
            return String(r.coach_id) === String(currentCoachId) || String(r.coach_id) === String(clientId)
        }
        if (r.activity_id === null || r.activity_id === undefined) return false
        return !currentCoachId || String(r.coach_id) === String(currentCoachId)
    })

    const otherRows = rows.filter(r => {
        if (r.calendar_event_id) {
            if (!currentCoachId) return false
            return String(r.coach_id) !== String(currentCoachId) && String(r.coach_id) !== String(clientId)
        }
        if (r.activity_id === null || r.activity_id === undefined) return true
        return currentCoachId && String(r.coach_id) !== String(currentCoachId)
    })

    const otherMeetRows = otherRows.filter(r => r.calendar_event_id)

    return (
        <div className="w-full">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-[#FF7939]" />
                    <h4 className="font-semibold text-sm text-white">{formatDate(selectedDate)}</h4>
                </div>
                <button onClick={() => { if (selectedDate < new Date(new Date().setHours(0, 0, 0, 0))) { alert('No puedes modificar la fecha de días pasados.'); return }; handleEditDate(selectedDate) }} className={`flex items-center gap-1 px-2 py-1 text-sm font-medium rounded-lg transition-colors ${selectedDate < new Date(new Date().setHours(0, 0, 0, 0)) ? 'text-gray-500 cursor-not-allowed opacity-50' : isSelectingNewDate ? 'bg-[#FF7939] text-white' : 'text-[#FF7939] hover:bg-[#FF7939]/10'}`}>
                    <RotateCcw className="h-4 w-4" />
                    {isSelectingNewDate ? 'Cancelar' : 'Fecha'}
                </button>
            </div>

            <div className="space-y-3">
                <div className="bg-zinc-800/30 rounded-lg p-3 border border-zinc-700/30">
                    <div className="flex items-center justify-between text-xs">
                        <span className="text-[#FF7939] font-medium">Tus programas</span>
                        <span className="text-[#FF7939] font-semibold">{formatMinutesCompact(ownedMins) || '0m'}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs mt-1">
                        <span className="text-gray-400">Otras actividades</span>
                        <span className="text-gray-200 font-semibold">{formatMinutesCompact(otherMinsTotal) || '0m'}</span>
                    </div>
                </div>

                {ownedActivityRows.length > 0 && (
                    <div className="space-y-3">
                        {ownedActivityRows.map((r) => <DaySummaryRow key={r.id} {...props} row={r} dayStr={dayStr} allowExpand={true} />)}
                    </div>
                )}

                {otherMeetRows.length > 0 && (
                    <div className="space-y-3">
                        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Otras actividades</div>
                        {otherMeetRows.map((r) => <DaySummaryRow key={r.id} {...props} row={r} dayStr={dayStr} allowExpand={false} />)}
                    </div>
                )}
            </div>
        </div>
    )
}
