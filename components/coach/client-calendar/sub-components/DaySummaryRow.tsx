"use client"
import React, { useRef, useEffect } from 'react'
import { Video, ChevronRight, Clock, Calendar, Zap, Utensils, UtensilsCrossed, ChevronDown, Edit2, Save, X, Trash2, Repeat2 } from 'lucide-react'
import { ClientDaySummaryRow as SummaryRowType, ExerciseExecution } from '../types'
import { formatMinutesCompact } from '../utils/date-helpers'
import { getSeriesBlocks, formatSeries } from '../utils/data-parsers'

interface DaySummaryRowProps {
    row: SummaryRowType
    dayStr: string
    allowExpand: boolean
    currentCoachId: string | null
    clientId: string
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
    onActivityExpanded?: (row: SummaryRowType) => void
    loading: boolean
    dishNameMap?: Record<string, string>
}
export const DaySummaryRow: React.FC<DaySummaryRowProps> = ({
    row, dayStr, allowExpand, currentCoachId, clientId,
    expandedActivityKeys, setExpandedActivityKeys,
    loadDayActivityDetails, loadEventDetails,
    eventDetailsByKey, activityDetailsByKey,
    nutritionPlateOptionsByActivity, dishNameMap,
    canEditNutritionForDay, canEditFitnessForDay,
    handleEditNutrition, editingExerciseId, editingOriginalExercise, setEditingExerciseId,
    setEditingOriginalExercise, loadAvailableExercises,
    showExerciseDropdown, setShowExerciseDropdown, availableExercises,
    handleChangeExercise, editingNutritionId, editingNutritionPlateId,
    editingNutritionMacros, setEditingNutritionPlateId, setEditingNutritionMacros,
    handleOpenIngredients, handleSaveNutrition, handleCancelNutrition,
    setConfirmDeleteNutritionId, router, handleEditFitness, handleSaveFitness,
    handleCancelFitness, editingFitnessValues, setEditingFitnessValues,
    onActivityExpanded, loading
}) => {
    const dropdownRef = useRef<HTMLDivElement>(null)
    const isNutri = !!(row as any).nutri_mins || (row as any).area === 'nutricion' || row.activity_title?.toLowerCase().includes('nutri')

    // Close dropdown on outside click
    useEffect(() => {
        if (!showExerciseDropdown) return
        const handler = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setShowExerciseDropdown(false)
            }
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [showExerciseDropdown, setShowExerciseDropdown])

    const isDirectOwner = currentCoachId && row.coach_id && String(row.coach_id) === String(currentCoachId)
    const isClientOwner = row.coach_id && String(row.coach_id) === String(clientId)
    const isNullCoachRow = row.coach_id === null || row.coach_id === undefined
    const isOwned = isDirectOwner || (!!row.calendar_event_id && isClientOwner) || (!row.calendar_event_id && isNullCoachRow)
    const isMeet = !!row.calendar_event_id

    let title = row.activity_title || (row.activity_id ? `Actividad ${row.activity_id}` : 'Evento')
    let extraLabel: string | null = null
    if (!isOwned) { title = isMeet ? "Otro Meet" : "Otra Actividad" }
    else if (isMeet) { extraLabel = "Meet" }
    else if (row.is_workshop) { extraLabel = "Taller" }
    else { extraLabel = "Programa" }

    const activityId = row.activity_id !== null && row.activity_id !== undefined ? Number(row.activity_id) : null
    const eventId = row.calendar_event_id
    const expandedKey = activityId ? `${dayStr}::${String(activityId)}` : (eventId ? `${dayStr}::event::${eventId}` : null)
    const expanded = expandedKey ? !!expandedActivityKeys?.[expandedKey] : false
    const isOtherCoach = currentCoachId && row.coach_id && String(row.coach_id) !== String(currentCoachId)
    const canExpand = allowExpand && (!!activityId || !!eventId) && !isOtherCoach
    const minutes = Number(row.total_mins ?? 0) || 0

    return (
        <div className="border-b border-zinc-800/50 last:border-b-0">
            {/* Row header */}
            <button
                type="button"
                onClick={async () => {
                    if (!canExpand || !expandedKey) return
                    // IF it's another coach's activity, don't expand (only show accumulated time)
                    if (currentCoachId && row.coach_id && String(row.coach_id) !== String(currentCoachId)) {
                        return
                    }
                    const next = !expanded
                    setExpandedActivityKeys(prev => ({ ...prev, [expandedKey]: next }))
                    if (next) {
                        onActivityExpanded?.(row)
                        if (activityId) await loadDayActivityDetails(dayStr, activityId)
                        if (eventId) await loadEventDetails(eventId)
                    }
                }}
                className={`w-full flex items-center justify-between py-3 group ${canExpand ? 'cursor-pointer' : 'cursor-default'}`}
            >
                <div className="flex items-center gap-2.5 min-w-0">
                    {/* Activity Icon Bubble */}
                    {(() => {
                        const isCompleted = (Number(row.items_completados) || 0) >= (Number(row.items_objetivo) || 1)
                        const bubbleBg = isCompleted ? (isNutri ? "bg-yellow-400" : "bg-[#FF7939]") : "bg-zinc-800/80"
                        const iconColor = isCompleted ? "text-white" : "text-zinc-500"
                        
                        return (
                            <div className={`p-1.5 rounded-full ${bubbleBg} flex-shrink-0 shadow-sm transition-all duration-300 group-hover:scale-110`}>
                                {isMeet ? (
                                    <Video className={`h-3 w-3 ${iconColor}`} />
                                ) : isNutri ? (
                                    <UtensilsCrossed className={`h-3 w-3 ${iconColor}`} />
                                ) : (
                                    <Zap className={`h-3 w-3 ${iconColor}`} />
                                )}
                            </div>
                        )
                    })()}
                    <div className="flex flex-col items-start min-w-0 min-h-[36px] justify-center">
                        <span className="text-sm font-bold text-gray-100 leading-tight truncate w-full">{title}</span>
                        {extraLabel && <span className="text-[10px] text-zinc-500 font-medium mt-0.5 uppercase tracking-wider">{extraLabel}</span>}
                    </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-xs text-zinc-500">{formatMinutesCompact(minutes) || '0m'}</span>
                    {canExpand && <ChevronRight className={`h-3.5 w-3.5 text-zinc-600 transition-transform duration-200 group-hover:text-[#FF7939] ${expanded ? 'rotate-90' : ''}`} />}
                </div>
            </button>

            {/* Expanded content */}
            {canExpand && expandedKey && expanded && (
                <div className="pb-3">
                    {/* Meet details */}
                    {eventId && eventDetailsByKey[eventId] && (
                        <div className="ml-5 pl-3 border-l border-zinc-800 space-y-2 py-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
                                    <Clock className="w-3 h-3" />
                                    <span>
                                        {new Date(eventDetailsByKey[eventId].start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} –{' '}
                                        {new Date(eventDetailsByKey[eventId].end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                {(() => {
                                    const startMs = new Date(eventDetailsByKey[eventId].start_time).getTime();
                                    const endMs = eventDetailsByKey[eventId].end_time ? new Date(eventDetailsByKey[eventId].end_time).getTime() : startMs + (60 * 60 * 1000);
                                    const nowMs = Date.now();
                                    const isOngoing = nowMs >= startMs && nowMs <= endMs;
                                    const rsvp = eventDetailsByKey[eventId].participants?.[0]?.rsvp_status || 'Pendiente';
                                    
                                    return (
                                        <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full ${
                                            isOngoing ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                                            ['confirmed','accepted'].includes(rsvp)
                                                ? 'bg-emerald-500/15 text-emerald-400'
                                                : ['cancelled','declined'].includes(rsvp)
                                                ? 'bg-red-500/15 text-red-400'
                                                : 'bg-amber-500/15 text-amber-400'
                                        }`}>
                                            {isOngoing ? 'En curso' : (rsvp === 'confirmed' ? 'Aceptada' : rsvp)}
                                        </span>
                                    );
                                })()}
                            </div>
                            {(() => {
                                const meetLink = eventDetailsByKey[eventId].meet_link || eventDetailsByKey[eventId].google_meet_data?.meet_link;
                                const startMs = new Date(eventDetailsByKey[eventId].start_time).getTime();
                                const endMs = eventDetailsByKey[eventId].end_time ? new Date(eventDetailsByKey[eventId].end_time).getTime() : startMs + (60 * 60 * 1000);
                                const nowMs = Date.now();
                                const isPast = nowMs > endMs;
                                
                                if (!meetLink || isPast) return null;
                                
                                const isReadyToJoin = nowMs >= (startMs - 30 * 60 * 1000);
                                if (!isReadyToJoin) {
                                    return (
                                        <div className="text-[10px] text-zinc-500 italic mt-1 font-medium">
                                            Link disponible 30 min antes
                                        </div>
                                    );
                                }

                                return (
                                    <a href={String(meetLink)} target="_blank" rel="noreferrer"
                                        className="text-[11px] text-[#FF7939] hover:underline flex items-center gap-1 font-bold mt-1">
                                        Unirse a la Meet ↗
                                    </a>
                                );
                            })()}
                        </div>
                    )}

                    {/* Exercise list */}
                    {activityId && (() => {
                        const items = activityDetailsByKey[expandedKey!] || []
                        if (items.length === 0) return (
                            <div className="ml-5 pl-3 border-l border-zinc-800 py-2 text-[11px] text-zinc-600 italic">
                                Cargando...
                            </div>
                        )
                        return (
                            <div className="ml-5 border-l border-zinc-800">
                                {items.map((exercise) => {
                                    const effectiveSeriesData = exercise.detalle_series
                                        || (exercise.sets != null && exercise.reps != null
                                            ? { sets: exercise.sets, reps: exercise.reps, kg: exercise.kg ?? 0 }
                                            : null)
                                    const seriesBlocks = getSeriesBlocks(effectiveSeriesData, exercise.duracion, exercise.ejercicio_id, exercise.minutosJson)
                                    const isEditing = editingExerciseId === exercise.id
                                    const isCompleted = exercise.completado
                                    const actIdStr = exercise.actividad_id !== null ? String(exercise.actividad_id) : null
                                    const nutritionPlateOptions = actIdStr ? (nutritionPlateOptionsByActivity[actIdStr] || []) : []
                                    // Collect all exercise IDs in this activity for the swap list
                                    const allActivityExerciseIds = items.map(i => String(i.ejercicio_id)).filter(Boolean)

                                    return (
                                        <div key={exercise.id} className="pl-3 py-2.5 border-b border-zinc-800/40 last:border-b-0 group">
                                            {/* Exercise name row */}
                                            <div className="flex items-center justify-between gap-2">
                                                <div className="flex items-center gap-2 min-w-0">
                                                    {exercise.is_nutricion ? (
                                                        <div className={`p-1 rounded-full ${isCompleted ? 'bg-yellow-400' : 'bg-yellow-500/10'} flex-shrink-0`}>
                                                            <UtensilsCrossed className={`h-2.5 w-2.5 ${isCompleted ? 'text-white' : 'text-yellow-500/60'}`} />
                                                        </div>
                                                    ) : exercise.is_workshop ? (
                                                        <div className={`p-1 rounded-full ${isCompleted ? 'bg-[#FF7939]' : 'bg-zinc-800'} flex-shrink-0`}>
                                                            <Calendar className={`h-2.5 w-2.5 ${isCompleted ? 'text-white' : 'text-zinc-400'}`} />
                                                        </div>
                                                    ) : (
                                                        <div className={`p-1 rounded-full ${isCompleted ? 'bg-[#FF7939]' : 'bg-[#FF7939]/10'} flex-shrink-0`}>
                                                            <Zap className={`h-2.5 w-2.5 ${isCompleted ? 'text-white' : 'text-[#FF7939]/60'}`} />
                                                        </div>
                                                    )}

                                                    {/* Exercise swap dropdown */}
                                                    {isEditing && !exercise.is_nutricion ? (
                                                        <div ref={dropdownRef} className="relative flex-1 min-w-0 z-[110]">
                                                            <button
                                                                type="button"
                                                                disabled={loading}
                                                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowExerciseDropdown(!showExerciseDropdown) }}
                                                                className="flex items-center gap-1.5 w-full text-left text-sm font-semibold text-white hover:text-[#FF7939] transition-colors disabled:opacity-50"
                                                            >
                                                                <span className="truncate">{editingOriginalExercise?.ejercicio_nombre || exercise.ejercicio_nombre}</span>
                                                                <div className="flex items-center gap-1 text-[#FF7939] flex-shrink-0">
                                                                    <Repeat2 className="h-3 w-3" />
                                                                    <ChevronDown className={`h-3 w-3 transition-transform ${showExerciseDropdown ? 'rotate-180' : ''}`} />
                                                                </div>
                                                            </button>
                                                            {showExerciseDropdown && (
                                                                <div className="absolute top-full left-0 z-[1000] mt-1.5 bg-zinc-900 border border-zinc-700/60 rounded-xl shadow-2xl overflow-hidden"
                                                                    style={{ minWidth: '220px', maxWidth: '320px', maxHeight: '320px', overflowY: 'auto' }}>
                                                                    {availableExercises.length > 0 ? (
                                                                        availableExercises.map((ex) => (
                                                                            <button
                                                                                type="button"
                                                                                key={ex.id}
                                                                                onMouseDown={(e) => {
                                                                                    // Use mousedown to beat the click-outside handler if possible
                                                                                    e.preventDefault();
                                                                                    e.stopPropagation();
                                                                                    console.log('[DaySummaryRow] Mousedown select:', ex.id);
                                                                                    handleChangeExercise(String(ex.id));
                                                                                    setShowExerciseDropdown(false);
                                                                                }}
                                                                                className={`w-full px-3 py-2 text-left text-xs hover:bg-zinc-800 transition-colors flex items-center gap-2 relative z-[1001] ${String(ex.id) === String(exercise.ejercicio_id) ? 'text-[#FF7939] bg-[#FF7939]/10' : 'text-gray-300'}`}
                                                                            >
                                                                                <Zap className="h-3 w-3 flex-shrink-0 opacity-50" />
                                                                                {ex.nombre_ejercicio}
                                                                            </button>
                                                                        ))
                                                                    ) : (
                                                                        <div className="px-3 py-3 text-[11px] text-zinc-500 text-center">Sin ejercicios disponibles</div>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-sm font-semibold text-gray-200 truncate">
                                                            {(() => {
                                                                if (exercise.is_nutricion) {
                                                                    // If name is numeric ID or looks like one, try lookup in options
                                                                    const rawName = exercise.ejercicio_nombre || '';
                                                                    const isNumeric = /^\d+$/.test(rawName);
                                                                    if (isNumeric || !rawName) {
                                                                        const tid = String(exercise.ejercicio_id);
                                                                        const bid = tid.split('_')[0];
                                                                        if (dishNameMap && (dishNameMap[tid] || dishNameMap[bid] || dishNameMap[exercise.ejercicio_id])) 
                                                                            return dishNameMap[tid] || dishNameMap[bid] || dishNameMap[exercise.ejercicio_id];
                                                                        
                                                                        const opt = nutritionPlateOptions.find(o => String(o.id) === tid || String(o.id) === bid);
                                                                        if (opt?.nombre_plato) return opt.nombre_plato;
                                                                        if (opt?.label) return opt.label;
                                                                        return isNumeric ? `Plato ${rawName}` : 'Plato sin nombre';
                                                                    }
                                                                }
                                                                return exercise.ejercicio_nombre;
                                                            })()}
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-1.5 flex-shrink-0">
                                                    {/* No badge — icon fill shows status */}
                                                    {/* Edit button */}
                                                    {!isEditing && !exercise.is_workshop && (() => {
                                                        const today = new Date()
                                                        today.setHours(0, 0, 0, 0)
                                                        const rowDate = new Date(dayStr + 'T12:00:00')
                                                        if (rowDate < today) return false
                                                        return exercise.is_nutricion ? canEditNutritionForDay(exercise) : canEditFitnessForDay(exercise)
                                                    })() && (
                                                        <button
                                                            type="button"
                                                            onClick={() => exercise.is_nutricion
                                                                ? handleEditNutrition(exercise)
                                                                : handleEditFitness(exercise, allActivityExerciseIds)
                                                            }
                                                            className="p-1 text-zinc-700 hover:text-[#FF7939] transition-colors opacity-0 group-hover:opacity-100"
                                                        >
                                                            <Edit2 className="h-3 w-3" />
                                                        </button>
                                                    )}
                                                    {isEditing && (
                                                        <button type="button" onClick={handleCancelFitness}
                                                            className="p-1 text-zinc-500 hover:text-white transition-colors">
                                                            <X className="h-3.5 w-3.5" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Meta info */}
                                            {(exercise.duracion || exercise.calorias_estimadas) && !isEditing && (
                                                <div className="flex items-center gap-3 mt-1 ml-5">
                                                    {exercise.duracion && (
                                                        <span className="text-[10px] text-zinc-600 flex items-center gap-0.5">
                                                            <Clock className="w-2.5 h-2.5" />{exercise.duracion}m
                                                        </span>
                                                    )}
                                                    {exercise.calorias_estimadas && (
                                                        <span className="text-[10px] text-zinc-600">{exercise.calorias_estimadas} kcal</span>
                                                    )}
                                                </div>
                                            )}

                                            {/* Nutrition macros */}
                                            {exercise.is_nutricion && exercise.nutricion_macros && !isEditing && (
                                                <div className="flex items-center gap-3 mt-1 ml-5">
                                                    {[
                                                        { label: 'Pg', val: exercise.nutricion_macros.proteinas, unit: '' },
                                                        { label: 'Cg', val: exercise.nutricion_macros.carbohidratos, unit: '' },
                                                        { label: 'Gg', val: exercise.nutricion_macros.grasas, unit: '' },
                                                    ].map(m => (
                                                        <span key={m.label} className="text-[10px] text-[#FF7939]/70 font-bold">
                                                            {m.label} {m.val || '0'}{m.unit}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Series blocks (PRs) */}
                                            {!exercise.is_nutricion && !exercise.is_workshop && seriesBlocks.length > 0 && !isEditing && (
                                                <div className="flex flex-wrap gap-2 mt-2 ml-5">
                                                    {seriesBlocks.map((block, idx) => (
                                                        <div key={idx} className="flex items-center gap-1.5 focus:outline-none">
                                                            <div className="text-center">
                                                                <div className="text-[8px] text-zinc-600 uppercase font-bold tracking-tight">P</div>
                                                                <div className="text-xs font-black text-[#FF7939] leading-none">{block.peso}</div>
                                                            </div>
                                                            <span className="text-zinc-700 text-[10px] select-none font-bold">\</span>
                                                            <div className="text-center">
                                                                <div className="text-[8px] text-zinc-600 uppercase font-bold tracking-tight">R</div>
                                                                <div className="text-xs font-black text-white leading-none">{block.reps}</div>
                                                            </div>
                                                            <span className="text-zinc-700 text-[10px] select-none font-bold">\</span>
                                                            <div className="text-center">
                                                                <div className="text-[8px] text-zinc-600 uppercase font-bold tracking-tight">S</div>
                                                                <div className="text-xs font-black text-white leading-none">{block.series}</div>
                                                            </div>
                                                            {idx < seriesBlocks.length - 1 && <span className="text-zinc-800 ml-1 font-bold">|</span>}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Fallback series text */}
                                            {!exercise.is_nutricion && seriesBlocks.length === 0 && exercise.detalle_series && !isEditing && (
                                                <div className="text-[10px] text-zinc-600 mt-1 ml-5 italic">{formatSeries(exercise.detalle_series)}</div>
                                            )}

                                            {/* Fitness Edit Form — minimal inline */}
                                            {isEditing && !exercise.is_nutricion && editingFitnessValues && (
                                                <div className="mt-2 ml-5">
                                                    <div className="flex items-center gap-3 flex-wrap">
                                                        {[
                                                            { label: 'S', key: 'sets' },
                                                            { label: 'R', key: 'reps' },
                                                            { label: 'KG', key: 'kg' },
                                                            { label: 'MIN', key: 'duracion' },
                                                            { label: 'KCAL', key: 'calorias' },
                                                        ].map(field => (
                                                            <div key={field.key} className="flex flex-col items-center gap-0.5">
                                                                <label className="text-[8px] text-zinc-600 uppercase font-black tracking-wider">{field.label}</label>
                                                                <input
                                                                    type="number"
                                                                    disabled={loading}
                                                                    value={editingFitnessValues[field.key]}
                                                                    onChange={(e) => setEditingFitnessValues((prev: any) => ({ ...prev, [field.key]: e.target.value }))}
                                                                    className="w-12 bg-transparent border-b border-zinc-700 px-1 py-0.5 text-xs text-white text-center font-bold focus:outline-none focus:border-[#FF7939] transition-colors disabled:opacity-50"
                                                                />
                                                            </div>
                                                        ))}
                                                        <button
                                                            disabled={loading}
                                                            onClick={(e) => { e.preventDefault(); handleSaveFitness() }}
                                                            className={`mt-4 px-3 py-1 bg-[#FF7939] text-black text-[10px] font-black rounded-md transition-colors uppercase ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#FF7939]/80'}`}
                                                        >
                                                            {loading ? 'Guardando...' : 'Guardar'}
                                                        </button>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Nutrition Edit Form */}
                                            {exercise.is_nutricion && editingNutritionId === exercise.id && editingNutritionMacros && (
                                                <div className="mt-2 ml-5 space-y-2">
                                                    <select
                                                        disabled={loading}
                                                        value={editingNutritionPlateId || ''}
                                                        onChange={(e) => {
                                                            const nextId = e.target.value
                                                            setEditingNutritionPlateId(nextId)
                                                            const plate = nutritionPlateOptions.find((p: any) => String(p?.id) === String(nextId))
                                                            if (plate) setEditingNutritionMacros((prev: any) => ({
                                                                ...prev,
                                                                proteinas: String(plate.proteinas ?? ''),
                                                                carbohidratos: String(plate.carbohidratos ?? ''),
                                                                grasas: String(plate.grasas ?? ''),
                                                                calorias: String(plate.calorias ?? plate.calorías ?? ''),
                                                                minutos: String(plate.minutos ?? '')
                                                            }))
                                                        }}
                                                        className="w-full px-2 py-1 text-xs bg-zinc-900 border border-zinc-700/60 rounded-lg text-white focus:outline-none focus:border-[#FF7939]/60 disabled:opacity-50"
                                                    >
                                                        <option value="">Seleccionar plato</option>
                                                        {nutritionPlateOptions.map((p: any) => (
                                                            <option key={String(p.id)} value={String(p.id)}>{p.nombre_plato || p.nombre || `Plato ${p.id}`}</option>
                                                        ))}
                                                    </select>
                                                    <div className="flex items-end gap-2 flex-wrap">
                                                        {['proteinas', 'carbohidratos', 'grasas', 'calorias'].map(field => (
                                                            <div key={field} className="flex flex-col gap-0.5">
                                                                <label className="text-[9px] text-zinc-500 uppercase font-black">{field.slice(0, 4)}</label>
                                                                <input
                                                                    type="number"
                                                                    disabled={loading}
                                                                    value={editingNutritionMacros[field]}
                                                                    onChange={(e) => setEditingNutritionMacros((prev: any) => ({ ...prev, [field]: e.target.value }))}
                                                                    className="w-14 bg-zinc-900 border border-zinc-700/60 rounded-lg px-2 py-1.5 text-sm text-white text-center font-bold focus:outline-none focus:border-[#FF7939]/60 disabled:opacity-50"
                                                                />
                                                            </div>
                                                        ))}
                                                        <button 
                                                            disabled={loading}
                                                            onClick={() => handleSaveNutrition(exercise)}
                                                            className={`mb-0.5 px-4 py-1.5 bg-[#FF7939] text-black text-xs font-black rounded-lg transition-colors uppercase ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#FF7939]/80'}`}>
                                                            {loading ? '...' : 'Guardar'}
                                                        </button>
                                                        {!loading && (
                                                            <button onClick={() => canEditNutritionForDay(exercise) && setConfirmDeleteNutritionId(exercise.id)}
                                                                className="mb-0.5 p-1.5 text-red-500/60 hover:text-red-400 transition-colors">
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        )
                    })()}
                </div>
            )}
        </div>
    )
}
