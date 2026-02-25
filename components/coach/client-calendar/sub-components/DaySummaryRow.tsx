import React from 'react'
import { Video, ChevronRight, Clock, Calendar, Flame, ChevronDown, Edit, List, Save, X, Trash2, Utensils } from 'lucide-react'
import { ClientDaySummaryRow as SummaryRowType, ExerciseExecution } from '../types'
import { formatMinutesCompact } from '../utils/date-helpers'
import { getSeriesBlocks } from '../utils/data-parsers'

interface DaySummaryRowProps {
    row: SummaryRowType
    dayStr: string
    allowExpand: boolean
    currentCoachId: string | null
    clientId: string
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

export const DaySummaryRow: React.FC<DaySummaryRowProps> = ({
    row, dayStr, allowExpand, currentCoachId, clientId,
    expandedActivityKeys, setExpandedActivityKeys,
    loadDayActivityDetails, loadEventDetails,
    eventDetailsByKey, activityDetailsByKey,
    nutritionPlateOptionsByActivity,
    canEditNutritionForDay, canEditFitnessForDay,
    handleEditNutrition, editingExerciseId, setEditingExerciseId,
    setEditingOriginalExercise, loadAvailableExercises,
    showExerciseDropdown, setShowExerciseDropdown,
    availableExercises, handleChangeExercise,
    editingNutritionId, editingNutritionPlateId, editingNutritionMacros,
    setEditingNutritionPlateId, setEditingNutritionMacros,
    handleOpenIngredients, handleSaveNutrition, handleCancelNutrition,
    setConfirmDeleteNutritionId, router
}) => {
    const minutes = Number(row.total_mins ?? 0) || 0
    const isDirectOwner = currentCoachId && row.coach_id && String(row.coach_id) === String(currentCoachId)
    const isClientOwner = row.coach_id && String(row.coach_id) === String(clientId)
    // rows from progreso_diario_actividad have null coach_id — treat as owned by this coach
    const isNullCoachRow = row.coach_id === null || row.coach_id === undefined
    const isOwned = isDirectOwner || (!!row.calendar_event_id && isClientOwner) || (!row.calendar_event_id && isNullCoachRow)
    const isMeet = !!row.calendar_event_id

    let title = row.activity_title || (row.activity_id ? `Actividad ${row.activity_id}` : 'Evento')
    let extraLabel: string | null = null

    if (!isOwned) {
        title = isMeet ? "Otro Meet" : "Otra Actividad"
    } else if (isMeet) {
        extraLabel = "Meet"
    } else if (row.is_workshop) {
        extraLabel = "Taller"
    } else {
        // We could look up the type, but for now we label as "Programa" by default
        extraLabel = "Programa"
    }

    const activityId = row.activity_id !== null && row.activity_id !== undefined ? Number(row.activity_id) : null
    const eventId = row.calendar_event_id
    const expandedKey = activityId ? `${dayStr}::${String(activityId)}` : (eventId ? `${dayStr}::event::${eventId}` : null)
    const expanded = expandedKey ? !!expandedActivityKeys?.[expandedKey] : false
    const canExpand = allowExpand && (!!activityId || !!eventId)

    return (
        <div className="space-y-2 border-b border-zinc-700/30 pb-3 last:border-b-0">
            <button
                type="button"
                onClick={async () => {
                    if (!canExpand || !expandedKey) return
                    const next = !expanded
                    setExpandedActivityKeys((prev) => ({ ...prev, [expandedKey]: next }))
                    if (next) {
                        if (activityId) await loadDayActivityDetails(dayStr, activityId)
                        if (eventId) await loadEventDetails(eventId)
                    }
                }}
                className={`w-full flex items-center justify-between group ${canExpand ? 'cursor-pointer' : 'cursor-default'}`}
            >
                <div className="flex items-center gap-3">
                    <div className={`w-1 h-8 rounded-full transition-colors ${expanded ? 'bg-[#FF7939]' : 'bg-zinc-700 group-hover:bg-[#FF7939]/50'}`}></div>
                    <div className="text-sm font-semibold text-gray-200 text-left flex flex-col">
                        <div className="flex items-center gap-1.5">
                            {isMeet ? (
                                <Video className={`h-3.5 w-3.5 ${isOwned ? 'text-[#FF7939]' : 'text-zinc-500'}`} />
                            ) : row.is_workshop ? (
                                <Calendar className={`h-3.5 w-3.5 ${isOwned ? 'text-[#FF7939]' : 'text-zinc-500'}`} />
                            ) : (
                                <Flame className={`h-3.5 w-3.5 ${isOwned ? 'text-[#FF7939]' : 'text-zinc-500'}`} />
                            )}
                            <span>{title}</span>
                        </div>
                        {extraLabel && <span className="text-[10px] text-[#FF7939] leading-none uppercase tracking-wider font-bold opacity-80">{extraLabel}</span>}
                    </div>
                    {canExpand && <ChevronRight className={`h-4 w-4 text-[#FF7939] transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`} />}
                </div>
                <div className="flex items-center gap-3">
                    {(() => {
                        const planned = (row.fitness_items_planned ?? 0) + (row.nutri_items_planned ?? 0)
                        const done = (row.fitness_items_done ?? 0) + (row.nutri_items_done ?? 0)
                        const pending = planned - done
                        if (pending <= 0) return null
                        return (
                            <div className="flex-shrink-0 min-w-[24px] h-6 px-1.5 rounded-full flex items-center justify-center bg-[#FF7939]">
                                <div className="flex items-center gap-0.5">
                                    <Flame size={12} fill="black" className="text-black" />
                                    <span className="text-[10px] font-bold text-black leading-none">{pending}</span>
                                </div>
                            </div>
                        )
                    })()}
                    <div className="text-xs text-gray-400">{formatMinutesCompact(minutes) || '0m'}</div>
                </div>
            </button>

            {canExpand && expandedKey && expanded && (
                <div className="space-y-2">
                    {eventId && eventDetailsByKey[eventId] && (
                        <div className="pl-4 pr-2 py-2 text-sm text-gray-300 space-y-1 bg-zinc-800/20 rounded-lg">
                            <div className="flex items-center justify-between">
                                <div className="flex gap-2 text-xs text-gray-500">
                                    <Clock className="w-3 h-3" />
                                    <span>
                                        {new Date(eventDetailsByKey[eventId].start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -
                                        {new Date(eventDetailsByKey[eventId].end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                <div className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${eventDetailsByKey[eventId].participants?.[0]?.rsvp_status === 'confirmed' || eventDetailsByKey[eventId].participants?.[0]?.rsvp_status === 'accepted' ? 'bg-green-500/20 text-green-500' :
                                    eventDetailsByKey[eventId].participants?.[0]?.rsvp_status === 'cancelled' || eventDetailsByKey[eventId].participants?.[0]?.rsvp_status === 'declined' ? 'bg-red-500/20 text-red-500' :
                                        'bg-yellow-500/20 text-yellow-500'
                                    }`}>
                                    {eventDetailsByKey[eventId].participants?.[0]?.rsvp_status || 'Pendiente'}
                                </div>
                            </div>
                            {eventDetailsByKey[eventId].description && <div className="text-gray-400 text-xs italic">{eventDetailsByKey[eventId].description}</div>}
                            {eventDetailsByKey[eventId].meet_link && (
                                <a href={eventDetailsByKey[eventId].meet_link} target="_blank" rel="noreferrer" className="text-[#FF7939] hover:underline text-xs flex items-center gap-1 mt-1">Unirse a la llamada ↗</a>
                            )}
                            <button onClick={() => router.push(`/?tab=calendar&eventId=${eventId}`)} className="mt-3 text-xs bg-zinc-700 hover:bg-zinc-600 text-white px-3 py-1.5 rounded flex items-center gap-2 w-fit transition-colors">
                                Ir al detalle <Calendar className="h-3 w-3" />
                            </button>
                        </div>
                    )}

                    {activityId && (() => {
                        const items = activityDetailsByKey[expandedKey!] || []
                        return items.length > 0 ? (
                            <div className="space-y-0">
                                {items.map((exercise) => {
                                    const seriesBlocks = getSeriesBlocks(exercise.detalle_series, exercise.duracion, exercise.ejercicio_id, exercise.minutosJson)
                                    const isCompleted = exercise.completado
                                    const actIdStr = exercise.actividad_id !== null ? String(exercise.actividad_id) : null
                                    const nutritionPlateOptions = actIdStr ? (nutritionPlateOptionsByActivity[actIdStr] || []) : []
                                    const canEditN = exercise.is_nutricion ? canEditNutritionForDay(exercise) : false

                                    return (
                                        <div key={exercise.id} className="w-full flex items-start gap-3 py-3 border-b border-zinc-700/30 last:border-b-0 group">
                                            <div className="flex items-center justify-center w-10 pt-1 shrink-0">
                                                {exercise.is_nutricion ? (
                                                    <Utensils className={`h-5 w-5 ${isCompleted ? 'text-[#FF7939]' : 'text-gray-600'}`} />
                                                ) : exercise.is_workshop ? (
                                                    <Calendar className={`h-5 w-5 ${isCompleted ? 'text-[#FF7939]' : 'text-gray-600'}`} />
                                                ) : (
                                                    <Flame className={`h-5 w-5 ${isCompleted ? 'text-[#FF7939]' : 'text-gray-600'}`} fill={isCompleted ? "#FF7939" : "transparent"} />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                {editingExerciseId === exercise.id ? (
                                                    <div className="relative mb-1 exercise-dropdown">
                                                        <button type="button" onClick={(e) => { e.preventDefault(); setShowExerciseDropdown(!showExerciseDropdown) }} className="flex items-center justify-between w-full px-3 py-2 text-sm font-semibold text-white bg-[#2A2A2A] border border-[#3A3A3A] rounded-lg hover:bg-[#3A3A3A] transition-colors">
                                                            <span>{exercise.ejercicio_nombre}</span>
                                                            <ChevronDown className={`h-4 w-4 transition-transform ${showExerciseDropdown ? 'rotate-180' : ''}`} />
                                                        </button>
                                                        {showExerciseDropdown && (
                                                            <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-[#1E1E1E] border border-[#3A3A3A] rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                                                {availableExercises.length > 0 ? (
                                                                    availableExercises.map((ex) => (
                                                                        <button type="button" key={ex.id} onClick={(e) => { e.preventDefault(); handleChangeExercise(String(ex.id)) }} className={`w-full px-3 py-2 text-left text-sm hover:bg-[#3A3A3A] transition-colors ${String(ex.id) === String(exercise.ejercicio_id) ? 'bg-[#FF7939]/20 text-[#FF7939]' : 'text-white'}`}>
                                                                            {ex.nombre_ejercicio}
                                                                        </button>
                                                                    ))
                                                                ) : <div className="px-3 py-2 text-sm text-gray-400">No hay ejercicios disponibles</div>}
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center justify-between gap-2">
                                                        <div className="text-sm font-semibold text-gray-300 truncate">
                                                            {exercise.ejercicio_nombre}
                                                            {exercise.completado && (
                                                                <span className="ml-2 text-[10px] bg-green-500/20 text-green-500 px-1.5 py-0.5 rounded uppercase font-bold">
                                                                    {exercise.is_nutricion ? 'Consumido' : (exercise.is_workshop ? 'Asistió' : 'Completado')}
                                                                </span>
                                                            )}
                                                            {!exercise.completado && (
                                                                <span className="ml-2 text-[10px] bg-zinc-700 text-gray-400 px-1.5 py-0.5 rounded uppercase font-bold">Pendiente</span>
                                                            )}
                                                        </div>
                                                        {(() => {
                                                            const canE = exercise.is_nutricion ? canEditNutritionForDay(exercise) : (exercise.is_workshop ? false : canEditFitnessForDay(exercise))
                                                            if (!canE) return null
                                                            return (
                                                                <button type="button" onClick={() => {
                                                                    if (exercise.is_nutricion) handleEditNutrition(exercise)
                                                                    else {
                                                                        setEditingExerciseId(exercise.id); setEditingOriginalExercise({ ...exercise })
                                                                        if (exercise.actividad_id) loadAvailableExercises(Number(exercise.actividad_id))
                                                                    }
                                                                }} className="p-1 text-zinc-600 hover:text-[#FF7939] hover:bg-[#FF7939]/10 rounded transition-colors">
                                                                    <Edit className="h-3.5 w-3.5" />
                                                                </button>
                                                            )
                                                        })()}
                                                    </div>
                                                )}

                                                <div className="flex flex-wrap items-center gap-3 mt-1">
                                                    {exercise.duracion && <span className="text-xs text-gray-500">{exercise.duracion} min</span>}
                                                    {exercise.calorias_estimadas && <span className="text-xs text-gray-500">{exercise.calorias_estimadas} kcal</span>}
                                                    {exercise.is_nutricion && exercise.nutricion_macros && (
                                                        <div className="flex items-center gap-2 text-xs text-[#FF7939]">
                                                            {exercise.nutricion_macros.proteinas !== undefined && <span>P {exercise.nutricion_macros.proteinas}g</span>}
                                                            {exercise.nutricion_macros.grasas !== undefined && <span>G {exercise.nutricion_macros.grasas}g</span>}
                                                            {exercise.nutricion_macros.carbohidratos !== undefined && <span>C {exercise.nutricion_macros.carbohidratos}g</span>}
                                                        </div>
                                                    )}
                                                </div>
                                                {exercise.detalle_series && <div className="text-xs text-gray-500 mt-1">{exercise.detalle_series}</div>}

                                                {exercise.is_nutricion && editingNutritionId === exercise.id && editingNutritionMacros && (
                                                    <div className="mt-2 flex flex-wrap gap-2 items-end">
                                                        <div className="flex flex-col min-w-[180px]">
                                                            <label className="text-[10px] text-gray-500 mb-0.5">Plato</label>
                                                            <select value={editingNutritionPlateId || ''} onChange={(e) => {
                                                                const nextId = e.target.value; setEditingNutritionPlateId(nextId)
                                                                const plate = nutritionPlateOptions.find(p => String(p?.id) === String(nextId))
                                                                if (plate) setEditingNutritionMacros((prev: any) => ({ ...prev, proteinas: String(plate.proteinas ?? ''), carbohidratos: String(plate.carbohidratos ?? ''), grasas: String(plate.grasas ?? ''), calorias: String(plate.calorias ?? plate.calorías ?? ''), minutos: String(plate.minutos ?? '') }))
                                                            }} className="w-full px-2 py-1 text-xs bg-[#2A2A2A] border border-[#3A3A3A] rounded text-white">
                                                                <option value="">Seleccionar</option>
                                                                {nutritionPlateOptions.map((p: any) => <option key={String(p.id)} value={String(p.id)}>{p.nombre_plato || p.nombre || `Plato ${p.id}`}</option>)}
                                                            </select>
                                                        </div>
                                                        {['proteinas', 'carbohidratos', 'grasas', 'calorias', 'minutos'].map(field => (
                                                            <div key={field} className="flex flex-col">
                                                                <label className="text-[10px] text-gray-500 mb-0.5">{field.slice(0, 4)}</label>
                                                                <input type="number" value={editingNutritionMacros[field]} onChange={(e) => setEditingNutritionMacros((prev: any) => ({ ...prev, [field]: e.target.value }))} className="w-16 px-2 py-1 text-xs bg-[#2A2A2A] border border-[#3A3A3A] rounded text-white" />
                                                            </div>
                                                        ))}
                                                        <div className="flex items-center gap-1 mt-auto pb-1">
                                                            <button onClick={() => handleOpenIngredients(exercise)} className="px-3 py-1.5 bg-[#2A2A2A] border border-[#3A3A3A] text-gray-300 hover:text-white hover:border-[#FF7939] hover:bg-[#FF7939]/10 rounded-md text-xs font-medium transition-all flex items-center gap-2">
                                                                <List className="w-3 h-3" /> Ingredientes
                                                            </button>
                                                        </div>
                                                        <div className="flex items-center gap-2 ml-auto">
                                                            <button onClick={() => handleSaveNutrition(exercise)} disabled={!canEditN} className={`p-1 rounded transition-colors ${canEditN ? 'text-[#FF7939] hover:bg-[#FF7939]/10' : 'text-gray-600 cursor-not-allowed'}`}><Save className="h-4 w-4" /></button>
                                                            <button onClick={handleCancelNutrition} className="p-1 rounded text-gray-400 hover:text-white hover:bg-zinc-700/40 transition-colors"><X className="h-4 w-4" /></button>
                                                            <button onClick={() => canEditN && setConfirmDeleteNutritionId(exercise.id)} disabled={!canEditN} className={`p-1 rounded transition-colors ${canEditN ? 'text-red-500 hover:bg-red-500/10' : 'text-gray-600 cursor-not-allowed'}`}><Trash2 className="h-4 w-4" /></button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        ) : <div className="text-xs text-gray-500">Cargando detalle...</div>
                    })()}
                </div>
            )
            }
        </div >
    )
}
