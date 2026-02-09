
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { ChevronUp, ChevronDown, Flame } from 'lucide-react'
import { Exercise, DaySchedulePayload } from './planner-types'
import {
    DAYS,
    normalizeExerciseType,
    normalizeNutritionType,
    formatSeriesDisplay,
    getTypeColorScheme,
    allowedNutritionTypes,
    normalizeExerciseData
} from './planner-utils'

interface DayExercisesModalProps {
    dayKey: string
    dayLabel: string
    exercises: Exercise[]
    availableExercises: Exercise[]
    onClose: () => void
    onUpdateExercises: (payload: DaySchedulePayload) => void
    weekNumber: number
    blockNames?: { [key: number]: string }
    blockCountStored?: number
    productCategory?: string
    similarDays?: string[]
    onApplyToSimilarDays?: (blockNames: { [key: number]: string }, exercises: Exercise[], blockCount: number) => void
}

export function DayExercisesModal({
    dayKey,
    dayLabel,
    exercises,
    availableExercises,
    onClose,
    onUpdateExercises,
    weekNumber,
    blockNames = {},
    blockCountStored = 1,
    productCategory,
    similarDays = [],
    onApplyToSimilarDays
}: DayExercisesModalProps) {
    const [exercisesLocal, setExercisesLocal] = useState<Exercise[]>([])
    const [blockCount, setBlockCount] = useState(1)
    const [showAvailableExercises, setShowAvailableExercises] = useState(false)
    const [localBlockNames, setLocalBlockNames] = useState<{ [key: number]: string }>({})
    const [allCoachExercisesInModal, setAllCoachExercisesInModal] = useState<Exercise[]>([])
    const [searchQuery, setSearchQuery] = useState('')
    const [showSearchBar, setShowSearchBar] = useState(false)

    const isNutrition = productCategory === 'nutricion' || productCategory === 'nutrition'

    const blockNameOptions = isNutrition
        ? ['Desayuno', 'Almuerzo', 'Merienda', 'Cena', 'Colación', 'Pre-entreno', 'Post-entreno']
        : Array.from({ length: Math.max(blockCount, 12) }, (_, i) => `Bloque ${i + 1} `)

    const logicalOrder = isNutrition ? ['Desayuno', 'Almuerzo', 'Merienda', 'Cena', 'Colación', 'Pre-entreno', 'Post-entreno'] : []
    const repeatableNames = isNutrition ? ['Pre-entreno', 'Post-entreno'] : []

    useEffect(() => {
        if (isNutrition) {
            const loadAllCoachExercises = async () => {
                try {
                    const response = await fetch('/api/coach/exercises?category=nutricion')
                    if (response.ok) {
                        const result = await response.json()
                        if (result.success && Array.isArray(result.data)) {
                            setAllCoachExercisesInModal(result.data.map((plato: any) => ({
                                id: String(plato.id),
                                name: plato.nombre || plato.Nombre || plato.name || `Plato ID ${plato.id}`,
                                description: plato.receta || plato.descripcion || '',
                                type: plato.tipo || 'otro',
                                tipo: plato.tipo || 'otro',
                                calories: Number(plato.calorias || plato.calories || plato.kcal || plato['Calorías'] || plato.macros?.calories || plato.macros?.calorias || 0),
                                calorias: Number(plato.calorias || plato.calories || plato.kcal || plato['Calorías'] || plato.macros?.calories || plato.macros?.calorias || 0),
                                proteinas: Number(plato.proteinas || plato.protein || plato.proteins || plato['Proteínas'] || plato['Proteínas (g)'] || plato.macros?.protein || plato.macros?.proteinas || 0),
                                carbohidratos: Number(plato.carbohidratos || plato.carbs || plato.carbohydrates || plato['Carbohidratos'] || plato['Carbohidratos (g)'] || plato.macros?.carbs || plato.macros?.carbohidratos || 0),
                                grasas: Number(plato.grasas || plato.fat || plato.fats || plato['Grasas'] || plato['Grasas (g)'] || plato.macros?.fat || plato.macros?.grasas || 0),
                                duration: Number(plato.minutos || plato.minutes || plato.duration || 0),
                                duracion_min: Number(plato.minutos || plato.minutes || plato.duration || 0),
                                is_active: plato.is_active !== false && plato.activo !== false,
                                activo: plato.activo !== false && plato.is_active !== false,
                                dificultad: plato.dificultad || 'Principiante',
                                macros: plato.macros // Keep original macros object just in case
                            })))
                        }
                    }
                } catch (error) { }
            }
            loadAllCoachExercises()
        }
    }, [isNutrition])

    const exercisesToUse = useMemo(() => {
        // Combine both sources to ensure we match IDs if they exist in either list
        // This handles mixed content or cases where one source is incomplete
        const combined = [...availableExercises, ...allCoachExercisesInModal]
        // Deduplicate by ID
        const unique = new Map<string, Exercise>()
        combined.forEach(ex => {
            if (ex && ex.id) unique.set(String(ex.id), ex)
        })
        return Array.from(unique.values())
    }, [availableExercises, allCoachExercisesInModal])

    const filteredExercisesToUse = useMemo(() => {
        if (!searchQuery.trim()) return exercisesToUse
        const query = searchQuery.toLowerCase().trim()
        return exercisesToUse.filter(ex => (ex.name || '').toLowerCase().includes(query))
    }, [exercisesToUse, searchQuery])

    const availableExercisesMap = useMemo(() => {
        const map = new Map<string, Exercise>()
        exercisesToUse.forEach(ex => { if (ex && ex.id) map.set(String(ex.id), ex) })
        return map
    }, [exercisesToUse])

    const mergeExerciseData = useCallback((exercise: any, index: number): Exercise => {
        if (!exercise) return { id: `deleted - ${index} `, name: '', block: 1, type: 'general' }
        const exIdStr = exercise.id ? String(exercise.id) : null
        const source = exIdStr ? availableExercisesMap.get(exIdStr) : undefined

        const rawName = exercise.name || exercise.nombre_ejercicio || ''
        const isGenericName = !rawName || /^Ejercicio\s+\d+$/i.test(rawName) || /^Plato\s+\d+$/i.test(rawName)

        const preferredName = (!isGenericName && rawName) ? rawName : (source?.name || rawName)
        const preferredDescription = exercise.description || exercise.descripcion || source?.description || ''

        // Improve type resolution: source takes precedence if current is generic/missing
        const currentType = exercise.type || exercise.tipo
        const sourceType = source?.type
        const resolvedType = currentType && currentType !== 'general' && currentType !== 'otro' ? currentType : (sourceType || currentType || '')

        const preferredType = isNutrition
            ? normalizeNutritionType(resolvedType)
            : normalizeExerciseType(resolvedType)

        const preferredSeries = exercise.series || exercise.detalle_series || source?.series || ''
        const preferredDuration = Number(exercise.duration ?? exercise.duracion_min ?? source?.duration ?? source?.duracion_min ?? 0)

        // Robust nutrition extraction
        const getVal = (...args: any[]) => {
            // First pass: try to find a non-zero value
            for (const val of args) {
                if (val !== undefined && val !== null && val !== '') {
                    const n = Number(val)
                    if (!isNaN(n) && n > 0) return n
                }
            }
            // Second pass: accept zero if that's all we have
            for (const val of args) {
                if (val !== undefined && val !== null && val !== '') return Number(val)
            }
            return 0
        }

        const preferredCalories = getVal(
            exercise.calories, exercise.calorias, exercise.kcal, exercise['Calorías'], exercise.macros?.calories,
            source?.calories, source?.calorias, (source as any)?.kcal, (source as any)?.['Calorías'], (source as any)?.macros?.calories
        )
        const preferredProteins = getVal(
            exercise.proteinas, exercise.proteins, exercise.protein, exercise['Proteínas'], exercise.macros?.protein,
            source?.proteinas, (source as any)?.proteins, (source as any)?.protein, (source as any)?.['Proteínas'], (source as any)?.macros?.protein
        )
        const preferredCarbs = getVal(
            exercise.carbohidratos, exercise.carbs, exercise.carbohydrates, exercise['Carbohidratos'], exercise.macros?.carbs,
            source?.carbohidratos, (source as any)?.carbs, (source as any)?.carbohydrates, (source as any)?.['Carbohidratos'], (source as any)?.macros?.carbs
        )
        const preferredFats = getVal(
            exercise.grasas, exercise.fats, exercise.fat, exercise['Grasas'], exercise.macros?.fat,
            source?.grasas, (source as any)?.fats, (source as any)?.fat, (source as any)?.['Grasas'], (source as any)?.macros?.fat
        )

        return {
            ...source,
            ...exercise,
            id: String(exercise.id ?? source?.id ?? `exercise - ${index} `),
            name: preferredName,
            description: preferredDescription,
            type: preferredType,
            tipo: preferredType,
            series: preferredSeries,
            detalle_series: preferredSeries,
            duration: preferredDuration,
            duracion_min: preferredDuration,
            calories: preferredCalories,
            calorias: preferredCalories,
            proteinas: preferredProteins,
            carbohidratos: preferredCarbs,
            grasas: preferredFats,
            block: exercise.block ?? exercise.bloque ?? (source as any)?.block ?? 1,
            orden: exercise.orden ?? index + 1
        } as Exercise
    }, [availableExercisesMap])

    const assignBlockNames = useCallback((currentBlockNames: { [key: number]: string }, newBlockCount: number) => {
        const newBlockNames = { ...currentBlockNames }
        const assignedNames = Object.values(newBlockNames)
        for (let bId = 1; bId <= newBlockCount; bId++) {
            if (!newBlockNames[bId]) {
                if (!isNutrition) { newBlockNames[bId] = `Bloque ${bId} `; continue }
                let assignedName = null
                for (const name of logicalOrder) { if (!repeatableNames.includes(name) && !assignedNames.includes(name)) { assignedName = name; break } }
                if (!assignedName && repeatableNames.length > 0) {
                    const counts: any = {}
                    repeatableNames.forEach(n => counts[n] = assignedNames.filter(an => an === n).length)
                    assignedName = repeatableNames.reduce((a, b) => counts[a] < counts[b] ? a : b)
                }
                newBlockNames[bId] = assignedName ?? `Bloque ${bId} `
                assignedNames.push(newBlockNames[bId])
            } else if (!isNutrition) { newBlockNames[bId] = `Bloque ${bId} ` }
        }
        return newBlockNames
    }, [isNutrition, logicalOrder, repeatableNames])

    useEffect(() => {
        const base = (exercises || []).map((ex, idx) => mergeExerciseData(ex, idx)).filter(ex => {
            const name = ex.name || ''
            const deleted = String(ex.id).startsWith('deleted-')
            if (deleted) return false
            // Allow mostly anything to be shown in the modal if it's there? 
            // The issue might be that stored data has "Plato 1" as name because it wasn't updated with full data.
            // But we already try to matching with allCoachExercisesInModal in mergeExerciseData.
            return true
        })

        // Check if we really need to update to avoid infinite loops
        const currentSignature = exercisesLocal.map(e => `${e.id}| ${e.name}| ${e.type}| ${e.series} `).join('||')
        const newSignature = base.map(e => `${e.id}| ${e.name}| ${e.type}| ${e.series} `).join('||')

        // Only update if signature changed or we have no local exercises yet
        if (currentSignature !== newSignature || exercisesLocal.length === 0) {
            setExercisesLocal(base)
            const maxB = base.length > 0 ? Math.max(...base.map(e => e.block || 1)) : 1
            const finalCount = Math.max(blockCountStored || 1, maxB)
            setBlockCount(finalCount)
            setLocalBlockNames(assignBlockNames(blockNames, finalCount))
        }
    }, [exercises, blockNames, blockCountStored, mergeExerciseData, assignBlockNames, availableExercisesMap])

    const distributeEvenly = (newCount: number) => {
        const n = Math.max(1, newCount)
        const perB = Math.ceil(exercisesLocal.length / n)
        const reassigned = exercisesLocal.map((ex, idx) => ({ ...ex, block: Math.floor(idx / perB) + 1 }))
        setBlockCount(n)
        setExercisesLocal(reassigned)
        setLocalBlockNames(assignBlockNames(localBlockNames, n))
    }

    const saveChanges = () => {
        const valid = exercisesLocal.filter(ex => {
            const n = ex.name || ''
            return n.trim() !== '' && !/^Ejercicio\s+\d+$/i.test(n) && !/^Plato\s+\d+$/i.test(n) && !String(ex.id).startsWith('deleted-')
        })
        if (valid.length === 0) { onUpdateExercises({ exercises: [], ejercicios: [], blockCount: 0, blockNames: {} }); onClose(); return }
        const maxUsed = Math.max(...valid.map(e => e.block || 1))
        const pruned: any = {}
        for (let i = 1; i <= maxUsed; i++) { if (valid.some(e => (e.block || 1) === i) && localBlockNames[i]) pruned[i] = localBlockNames[i] }
        onUpdateExercises({ exercises: valid, ejercicios: valid, blockCount: maxUsed, blockNames: pruned })
        onClose()
    }

    const moveUpInBlock = (idx: number) => {
        const list = [...exercisesLocal], cur = list[idx], b = cur.block || 1
        let pIdx = idx - 1
        while (pIdx >= 0 && (list[pIdx].block || 1) !== b) pIdx--
        if (pIdx >= 0) { list[idx] = list[pIdx]; list[pIdx] = cur } else cur.block = Math.max(1, b - 1)
        setExercisesLocal(list)
    }

    const moveDownInBlock = (idx: number) => {
        const list = [...exercisesLocal], cur = list[idx], b = cur.block || 1
        let nIdx = idx + 1
        while (nIdx < list.length && (list[nIdx].block || 1) !== b) nIdx++
        if (nIdx < list.length) { list[idx] = list[nIdx]; list[nIdx] = cur } else cur.block = Math.min(blockCount, b + 1)
        setExercisesLocal(list)
    }

    return (
        <div className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center p-0 sm:p-4 overflow-hidden">
            <div className="bg-black p-4 md:p-6 pt-20 w-screen h-full max-w-4xl mx-auto overflow-hidden flex flex-col relative">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <span className="text-gray-500 text-xs font-bold uppercase tracking-widest block mb-1">Semana {weekNumber}</span>
                        <h3 className="text-white text-4xl font-black mb-1">{dayLabel}</h3>
                        <p className="text-gray-400 text-sm italic font-light">Organiza {isNutrition ? 'platos' : 'ejercicios'} en bloques</p>
                    </div>

                    {/* Daily Totals Summary */}
                    <div className="flex items-center gap-3">
                        {(() => {
                            const dailyTotals = exercisesLocal.reduce((acc, ex) => {
                                const norm = normalizeExerciseData(ex, isNutrition)
                                return {
                                    calories: acc.calories + (norm.calories || 0),
                                    proteinas: acc.proteinas + (norm.proteinas || 0),
                                    carbohidratos: acc.carbohidratos + (norm.carbohidratos || 0),
                                    grasas: acc.grasas + (norm.grasas || 0)
                                }
                            }, { calories: 0, proteinas: 0, carbohidratos: 0, grasas: 0 })

                            // Show calories if > 0 OR if it's a nutrition plan (so user sees 0 kcal instead of nothing)
                            if (dailyTotals.calories === 0 && !isNutrition) return null

                            return (
                                <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 mr-4">
                                    <div className="bg-[#FF7939]/10 border border-[#FF7939]/30 text-[#FF7939] rounded-2xl px-3 py-1 text-xs font-bold flex items-center gap-1 shadow-sm w-fit">
                                        <Flame className="w-3.5 h-3.5" />
                                        {Math.round(dailyTotals.calories)} kcal
                                    </div>

                                    {isNutrition && (
                                        <div className="bg-gray-800/50 border border-gray-700/50 text-gray-300 rounded-2xl px-3 py-1 text-xs font-medium flex items-center gap-2 w-fit">
                                            <span className="text-rose-400">P: {Math.round(dailyTotals.proteinas)}g</span>
                                            <span className="text-orange-400">C: {Math.round(dailyTotals.carbohidratos)}g</span>
                                            <span className="text-yellow-400">G: {Math.round(dailyTotals.grasas)}g</span>
                                        </div>
                                    )}
                                </div>
                            )
                        })()}

                        <div className="flex items-center gap-3">
                            <button onClick={() => setExercisesLocal([])} className="text-xs text-[#FF7939] hover:text-[#FF6B35]">Vaciar</button>
                            <button onClick={onClose} className="text-gray-400 hover:text-white text-xl">✕</button>
                        </div>
                    </div>
                </div>
                <div className="overflow-auto flex-1 pb-[400px]">
                    <div className="flex items-center justify-between mb-4 w-full">
                        <div className="flex items-center gap-2 flex-1"><span className="text-white text-sm">Bloques:</span><button onClick={() => distributeEvenly(blockCount - 1)} className="w-7 h-7 rounded-md border border-[#FF7939] text-[#FF7939]">-</button><span className="text-[#FF7939] text-sm w-6 text-center">{blockCount}</span><button onClick={() => distributeEvenly(isNutrition ? Math.min(blockNameOptions.length, blockCount + 1) : blockCount + 1)} className="w-7 h-7 rounded-md border border-[#FF7939] text-[#FF7939]">+</button></div>
                    </div>
                    <div className="mb-6 grid grid-cols-1 gap-4 w-full px-0">
                        {exercisesLocal.length === 0 && <div className="text-gray-400 text-sm">No hay {isNutrition ? 'platos' : 'ejercicios'} en este día.</div>}
                        {Array.from({ length: blockCount }, (_, i) => i + 1).map(bId => {
                            const items = exercisesLocal.filter(ex => (ex.block || 1) === bId)
                            // if (items.length === 0) return null // Don't hide empty blocks so user can add to them? Actually currently logic hides them. Let's keep it consistent.

                            return (
                                <div key={bId} className="w-full mb-6">
                                    <div className="flex items-center justify-between mb-2">
                                        {isNutrition ? (
                                            <div className="flex-1">
                                                <select
                                                    value={localBlockNames[bId] || blockNameOptions[Math.min(bId - 1, blockNameOptions.length - 1)]}
                                                    onChange={e => {
                                                        const val = e.target.value
                                                        setLocalBlockNames(prev => ({ ...prev, [bId]: val }))
                                                    }}
                                                    className="bg-gray-800 border border-gray-600 rounded-md px-2 py-1 text-white text-sm focus:border-[#FF7939] outline-none"
                                                >
                                                    {blockNameOptions.map(o => <option key={o} value={o}>{o}</option>)}
                                                </select>
                                            </div>
                                        ) : (
                                            <span className="text-sm text-white font-medium">{localBlockNames[bId] || `Bloque ${bId} `}</span>
                                        )}
                                        <div className="text-xs text-gray-400 ml-4 flex items-center gap-1">
                                            {items.length} {isNutrition ? 'platos' : 'ejercicios'}
                                            {/* Button to remove block if empty? */}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        {items.map((ex, idx) => {
                                            const inactive = ex.is_active === false || ex.activo === false
                                            const title = ex.name || `Ejercicio ${idx + 1} `
                                            if (!title.trim()) return null
                                            const typeLabel = ex.type || ex.tipo || (isNutrition ? 'otro' : 'General')
                                            const scheme = getTypeColorScheme(typeLabel, isNutrition)
                                            // Find global index for removal/move
                                            const globalIdx = exercisesLocal.indexOf(ex)

                                            return (
                                                <div key={idx} className={`w-full py-3 border-b border-white/5 last:border-0 ${inactive ? 'opacity-50' : ''}`}>
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex-1 min-w-0">
                                                            <p className={`text-base font-medium truncate ${inactive ? 'text-gray-500 line-through' : 'text-gray-100'}`}>{title}</p>
                                                            <div className={`flex flex-wrap items-center gap-2 text-xs mt-1 ${inactive ? 'text-gray-500' : 'text-gray-400'}`}>
                                                                {isNutrition ? (
                                                                    (() => {
                                                                        const norm = normalizeExerciseData(ex, true)
                                                                        return (
                                                                            <div className="flex items-center gap-2">
                                                                                <span className="text-rose-400">P: {norm.proteinas}g</span>
                                                                                <span className="text-orange-400">C: {norm.carbohidratos}g</span>
                                                                                <span className="text-yellow-400">G: {norm.grasas}g</span>
                                                                                <span className="text-gray-500">|</span>
                                                                                <span className="text-white font-medium">{norm.calories} kcal</span>
                                                                            </div>
                                                                        )
                                                                    })()
                                                                ) :
                                                                    <>
                                                                        <span className="px-2 py-0.5 rounded border font-medium" style={inactive ? undefined : { color: scheme.hex, borderColor: scheme.hex, backgroundColor: scheme.soft }}>{typeLabel}</span>
                                                                        {formatSeriesDisplay(ex) && <span>{formatSeriesDisplay(ex)}</span>}
                                                                        {(() => {
                                                                            const norm = normalizeExerciseData(ex, false)
                                                                            return norm.calories > 0 && <span className="text-[#FF7939] flex items-center gap-0.5"><Flame className="w-3 h-3" /> {norm.calories}</span>
                                                                        })()}
                                                                    </>
                                                                }
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <button onClick={() => moveUpInBlock(globalIdx)} className="w-8 h-8 rounded-full border border-gray-800 text-gray-400 flex items-center justify-center hover:bg-white/5 hover:text-white"><ChevronUp className="w-4 h-4" /></button>
                                                            <button onClick={() => moveDownInBlock(globalIdx)} className="w-8 h-8 rounded-full border border-gray-800 text-gray-400 flex items-center justify-center hover:bg-white/5 hover:text-white"><ChevronDown className="w-4 h-4" /></button>
                                                            <button onClick={() => setExercisesLocal(p => p.filter((_, i) => i !== globalIdx))} className="w-8 h-8 rounded-full border border-red-900/30 text-red-500 flex items-center justify-center hover:bg-red-900/20">✕</button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                    <div className="mb-6"><div className="flex items-center justify-between mb-3"><h4 className="text-white text-base font-bold uppercase tracking-wider">{isNutrition ? 'Selecciona platos' : 'Selecciona ejercicios'}</h4><button onClick={() => setShowAvailableExercises(!showAvailableExercises)} className="flex items-center gap-2 text-[#FF7939]"><span className="text-xl">+</span><span>{isNutrition ? 'platos' : 'ejercicios'}</span></button></div>
                        {isNutrition && <div className="mb-3 flex items-center gap-2"><button onClick={() => { setShowSearchBar(!showSearchBar); if (!showSearchBar) setSearchQuery('') }} className="text-[#FF7939] p-1.5"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.35-4.35"></path></svg></button>{showSearchBar && <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Buscar plato..." className="flex-1 bg-gray-800 border border-gray-600 rounded-md px-3 py-1.5 text-white text-sm focus:border-[#FF7939]" autoFocus />}</div>}
                        {showAvailableExercises && <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-h-96 overflow-y-auto">{filteredExercisesToUse.map(ex => {
                            const inactive = ex.is_active === false || ex.activo === false
                            const type = ex.type || ex.tipo || (isNutrition ? 'otro' : 'General')
                            const scheme = getTypeColorScheme(type, isNutrition)
                            return (
                                <div key={ex.id} onClick={() => !inactive && setExercisesLocal(p => [...p, { ...ex, block: 1, orden: p.length + 1 }])} className={`rounded - lg p - 2 transition - colors ${inactive ? 'bg-gray-800/10 opacity-50 cursor-not-allowed border border-gray-700/50' : 'bg-gray-800/30 cursor-pointer hover:bg-gray-800/50'} `}>
                                    <div className="flex items-start justify-between gap-3"><div className="min-w-0 flex-1"><p className={`text - xs font - medium truncate ${inactive ? 'text-gray-500 line-through' : 'text-white'} `}>{ex.name}</p>
                                        {isNutrition && ex.proteinas !== undefined ? <p className="text-[10px] text-gray-400">P:{ex.proteinas} C:{ex.carbohidratos} G:{ex.grasas} {ex.calorias}k</p> : <span className="px-1.5 py-0.5 rounded border text-[10px]" style={inactive ? undefined : { color: scheme.hex, borderColor: scheme.hex, backgroundColor: scheme.soft }}>{type}</span>}</div></div>
                                </div>
                            )
                        })}</div>}</div>
                    {similarDays.length > 0 && <div className="text-sm text-gray-400 mb-4 text-center">También aplica a: {similarDays.map(d => { const [w, dn] = d.split('-'); return `Semana ${w} - ${DAYS.find(o => o.key === parseInt(dn))?.fullLabel || dn} ` }).join(', ')}</div>}
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-black/95 pt-6 pb-24 border-t border-white/10 flex items-center justify-center z-[110]"><div className="flex items-center gap-3">{similarDays.length > 0 && <button onClick={() => { onApplyToSimilarDays?.(localBlockNames, exercisesLocal, blockCount); onClose() }} className="px-4 py-1.5 rounded-full bg-black text-[#FF7939] border border-[#FF7939]/40 text-sm">Aplicar a similares</button>}<button onClick={saveChanges} className="px-4 py-1.5 rounded-full bg-black text-[#FF7939] border border-[#FF7939]/40 text-sm">Guardar</button></div></div>
            </div>
        </div>
    )
}
