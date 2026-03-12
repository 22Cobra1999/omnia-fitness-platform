import React from 'react'
import { RotateCcw, CalendarDays, Flame, Video, Clock2 } from 'lucide-react'
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
    loadDayActivityDetails: (day: string, id: number, forceRefresh?: boolean) => Promise<void>
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
    handleEditFitness: (ex: ExerciseExecution, knownExerciseIds?: string[]) => void
    handleSaveFitness: () => Promise<void>
    handleCancelFitness: () => void
    editingFitnessValues: any
    setEditingFitnessValues: (values: any) => void
    loading: boolean
}

export const DayDetailsPanel: React.FC<DayDetailsPanelProps> = (props) => {
    const { selectedDate, summaryRowsByDate, currentCoachId, clientId, isSelectingNewDate, handleEditDate } = props
    const dayStr = selectedDate.toISOString().split('T')[0]
    const rows = summaryRowsByDate[dayStr] || []

    // Classify rows
    const ownedProgramRows = rows.filter(r => {
        if (r.calendar_event_id) return false // meets handled separately
        if (r.activity_id === null || r.activity_id === undefined) return false
        if (r.coach_id === null || r.coach_id === undefined) return true
        return !currentCoachId || String(r.coach_id) === String(currentCoachId)
    })

    const myMeetRows = rows.filter(r => {
        if (!r.calendar_event_id) return false
        if (!currentCoachId) return true
        return String(r.coach_id) === String(currentCoachId) || String(r.coach_id) === String(clientId)
    })

    const otherRows = rows.filter(r => {
        if (r.calendar_event_id) {
            if (!currentCoachId) return false
            return String(r.coach_id) !== String(currentCoachId) && String(r.coach_id) !== String(clientId)
        }
        if (r.activity_id === null || r.activity_id === undefined) return true
        if (r.coach_id === null || r.coach_id === undefined) return false
        return currentCoachId && String(r.coach_id) !== String(currentCoachId)
    })

    // Summary stats
    const programMins = ownedProgramRows.reduce((a, r) => a + (Number(r.total_mins ?? 0) || 0), 0)
    const meetMins = myMeetRows.reduce((a, r) => a + (Number(r.total_mins ?? 0) || 0), 0)
    const otherMins = otherRows.reduce((a, r) => a + (Number(r.total_mins ?? 0) || 0), 0)
    const totalMins = programMins + meetMins + otherMins

    const allExpandable = [...ownedProgramRows, ...myMeetRows]

    return (
        <div className="w-full h-full flex flex-col">
            {/* ── Panel header ── */}
            <div className="flex items-start justify-between mb-4 pb-3 border-b border-zinc-800/60">
                <div className="flex items-start gap-2 min-w-0">
                    <CalendarDays className="h-4 w-4 text-[#FF7939] mt-0.5 flex-shrink-0" />
                    <div className="min-w-0">
                        <h4 className="text-sm font-bold text-white leading-snug">{formatDate(selectedDate)}</h4>
                        {totalMins > 0 && (
                            <p className="text-[11px] text-zinc-500 mt-0.5">{formatMinutesCompact(totalMins)} en total</p>
                        )}
                    </div>
                </div>
                <button
                    onClick={() => handleEditDate(selectedDate)}
                    className={`flex-shrink-0 flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-lg transition-colors ml-2 ${
                        isSelectingNewDate
                            ? 'bg-[#FF7939] text-black'
                            : 'text-[#FF7939] hover:bg-[#FF7939]/10 border border-[#FF7939]/20'
                    }`}
                >
                    <RotateCcw className="h-3 w-3" />
                    {isSelectingNewDate ? 'Cancelar' : 'Fecha'}
                </button>
            </div>

            {rows.length === 0 ? (
                <div className="flex-1 flex items-center justify-center py-8">
                    <p className="text-sm text-zinc-600 italic">Sin actividades</p>
                </div>
            ) : (
                <>
                    {/* ── Summary totals ── */}
                    <div className="flex items-center gap-4 mb-5 pb-4 border-b border-zinc-900">
                        <div className="flex flex-col">
                            <span className="text-[8px] text-zinc-600 uppercase font-black tracking-widest mb-1">Tus programas</span>
                            <div className="flex items-center gap-1.5">
                                <Flame className="h-3 w-3 text-[#FF7939]" />
                                <span className="text-sm font-black text-white">{formatMinutesCompact(programMins) || '0m'}</span>
                            </div>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[8px] text-zinc-600 uppercase font-black tracking-widest mb-1">Meets con vos</span>
                            <div className="flex items-center gap-1.5">
                                <Video className="h-3 w-3 text-[#FF7939]" />
                                <span className="text-sm font-black text-white">{formatMinutesCompact(meetMins) || '0m'}</span>
                            </div>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[8px] text-zinc-600 uppercase font-black tracking-widest mb-1">Otros del cliente</span>
                            <div className="flex items-center gap-1.5">
                                <Clock2 className="h-3 w-3 text-zinc-500" />
                                <span className="text-sm font-black text-zinc-500">{formatMinutesCompact(otherMins) || '0m'}</span>
                            </div>
                        </div>
                    </div>

                    <div className="w-full h-px bg-zinc-800/40 mb-3" />

                    {/* ── Activities ── */}
                    <div className="flex-1 overflow-y-auto space-y-0 min-h-0">
                        {ownedProgramRows.length > 0 && (
                            <div className="mb-1">
                                <p className="text-[9px] text-zinc-600 uppercase tracking-widest font-black mb-1 px-0.5">Tus programas</p>
                                {ownedProgramRows.map(r => (
                                    <DaySummaryRow key={r.id} {...props} row={r} dayStr={dayStr} allowExpand={true} />
                                ))}
                            </div>
                        )}

                        {myMeetRows.length > 0 && (
                            <div className="mb-1 pt-2">
                                <p className="text-[9px] text-zinc-600 uppercase tracking-widest font-black mb-1 px-0.5">Meets con vos</p>
                                {myMeetRows.map(r => (
                                    <DaySummaryRow key={r.id} {...props} row={r} dayStr={dayStr} allowExpand={true} />
                                ))}
                            </div>
                        )}

                        {otherRows.length > 0 && (
                            <div className="mb-1 pt-2">
                                <p className="text-[9px] text-zinc-600 uppercase tracking-widest font-black mb-1 px-0.5">Otros del cliente</p>
                                <div className="flex items-center gap-2 py-2 px-0.5">
                                    <Clock2 className="h-3 w-3 text-zinc-600 flex-shrink-0" />
                                    <span className="text-xs text-zinc-500">{formatMinutesCompact(otherMins)}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    )
}
