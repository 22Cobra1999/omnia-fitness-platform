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
    editingOriginalExercise: ExerciseExecution | null
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
    onActivityExpanded?: (row: ClientDaySummaryRow) => void
    loading: boolean
    dishNameMap?: Record<string, string>
    streak?: number
    nextActivityDate?: string | null
}

export const DayDetailsPanel: React.FC<DayDetailsPanelProps> = (props) => {
    const { 
        selectedDate, summaryRowsByDate, currentCoachId, clientId, 
        isSelectingNewDate, handleEditDate, streak, nextActivityDate 
    } = props
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
        
        // Filter out irrelevant past meets
        const now = new Date()
        const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
        const isPast = r.day < todayStr
        const isConfirmed = (r as any).confirmed === true || (r as any).is_confirmed === true || (r as any).status === 'confirmed'
        const isCancelled = (r as any).status === 'cancelled' || (r as any).confirmed === false
        
        if (isPast && (isCancelled || !isConfirmed)) return false

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

    const totalExercises = ownedProgramRows.reduce((a, r) => a + (Number(r.fit_items_o || 0)), 0)
    const totalDishes = ownedProgramRows.reduce((a, r) => a + (Number(r.nut_items_o || 0)), 0)

    const allExpandable = [...ownedProgramRows, ...myMeetRows]

    return (
        <div className="w-full h-full flex flex-col">
            {/* ── Streak & Next Activity ── */}
            <div className="flex items-center gap-4 mb-3">
                <div className="flex items-center gap-1.5 bg-[#FF7939]/10 px-2 py-0.5 rounded-lg border border-[#FF7939]/20">
                    <Flame className="h-3 w-3 text-[#FF7939]" fill="#FF7939" />
                    <span className="text-[10px] font-black text-[#FF7939] uppercase tracking-tighter">Racha: {streak || 0}</span>
                </div>
                {nextActivityDate && (
                    <div className="flex items-center gap-1.5 bg-zinc-800/60 px-2 py-0.5 rounded-lg border border-zinc-700/60">
                        <CalendarDays className="h-3 w-3 text-zinc-400" />
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">Próxima: {formatDate(new Date(nextActivityDate + 'T12:00:00'))}</span>
                    </div>
                )}
            </div>

            {/* ── Panel header ── */}
            <div className="flex items-start justify-between mb-4 pb-3 border-b border-zinc-800/60">
                <div className="flex items-start gap-2 min-w-0">
                    <CalendarDays className="h-4 w-4 text-[#FF7939] mt-0.5 flex-shrink-0" />
                    <div className="min-w-0">
                        <h4 className="text-sm font-bold text-white leading-snug">
                            {dayStr === new Date().toISOString().split('T')[0] ? 'Hoy: ' : ''}{formatDate(selectedDate)}
                        </h4>
                        <div className="flex items-center gap-3 mt-1">
                            {totalExercises > 0 && (
                                <div className="flex items-center gap-1">
                                    <Flame className="h-3 w-3 text-[#FF7939]" />
                                    <span className="text-[11px] text-zinc-400 font-bold">{totalExercises} ejs</span>
                                </div>
                            )}
                            {totalDishes > 0 && (
                                <div className="flex items-center gap-1">
                                    <svg className="h-3 w-3 text-[#FF7939]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/></svg>
                                    <span className="text-[11px] text-zinc-400 font-bold">{totalDishes} platos</span>
                                </div>
                            )}
                            {totalMins > 0 && (
                                <p className="text-[11px] text-zinc-500">• {formatMinutesCompact(totalMins)}</p>
                            )}
                        </div>
                    </div>
                </div>
                {(() => {
                    const today = new Date()
                    today.setHours(0, 0, 0, 0)
                    if (selectedDate < today) return null
                    
                    return (
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
                    )
                })()}
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
                                    <DaySummaryRow key={r.id} {...props} row={r} dayStr={dayStr} allowExpand={true} dishNameMap={props.dishNameMap} />
                                ))}
                            </div>
                        )}

                        {myMeetRows.length > 0 && (
                            <div className="mb-1 pt-2">
                                <p className="text-[9px] text-zinc-600 uppercase tracking-widest font-black mb-1 px-0.5">Meets con vos</p>
                                {myMeetRows.map(r => (
                                    <DaySummaryRow key={r.id} {...props} row={r} dayStr={dayStr} allowExpand={true} dishNameMap={props.dishNameMap} />
                                ))}
                            </div>
                        )}

                        {otherRows.length > 0 && (
                            <div className="mb-1 pt-2">
                                <p className="text-[9px] text-zinc-600 uppercase tracking-widest font-black mb-1 px-0.5">Otros del cliente</p>
                                {otherRows.map(r => (
                                    <DaySummaryRow key={r.id} {...props} row={r} dayStr={dayStr} allowExpand={true} dishNameMap={props.dishNameMap} />
                                ))}
                                <div className="flex items-center gap-2 py-1 px-0.5 opacity-40">
                                    <Clock2 className="h-3 w-3 text-zinc-600 flex-shrink-0" />
                                    <span className="text-[10px] text-zinc-500">{formatMinutesCompact(otherMins)} en total</span>
                                </div>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    )
}
