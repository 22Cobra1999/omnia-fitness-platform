import { useState, useCallback } from 'react'
import { ExerciseExecution } from '../types'
import { parseMaybeJson, updateKeyContainer, inferMetaFromKey } from '../utils/data-parsers'
import { getDayName } from '../utils/date-helpers'

export function useFitness(
    supabase: any,
    clientId: string,
    fetchClientCalendarSummary: () => Promise<void>,
    loadDayActivityDetails: (day: string, actId: number, forceRefresh?: boolean) => Promise<void>,
    setCascadeModal: (modal: any) => void,
    setLoading: (val: boolean) => void
) {
    const [editingExerciseId, setEditingExerciseId] = useState<string | null>(null)
    const [editingOriginalExercise, setEditingOriginalExercise] = useState<ExerciseExecution | null>(null)
    const [initialExerciseKey, setInitialExerciseKey] = useState<string | null>(null)
    const [availableExercises, setAvailableExercises] = useState<any[]>([])
    const [showExerciseDropdown, setShowExerciseDropdown] = useState(false)
    const [editingFitnessValues, setEditingFitnessValues] = useState<any>(null)

    const canEditFitnessForDay = useCallback((ex: ExerciseExecution) => {
        // Coach can always edit exercises
        return true
    }, [])

    const loadAvailableExercises = useCallback(async (activityId: number, knownExerciseIds?: string[]) => {
        try {
            const { data: allLib, error: libError } = await supabase
                .from('ejercicios_detalles')
                .select('id, nombre_ejercicio, tipo, equipo, body_parts, calorias, duracion_min, activity_id, detalle_series')
                .limit(2000)

            if (libError) console.error('[useFitness] Library query error:', libError)

            if (allLib) {
                const filtered = allLib.filter((ex: any) => {
                    return ex.tipo !== 'nutricion' && ex.tipo !== 'comida'
                })
                
                if (filtered.length > 0) {
                    setAvailableExercises(filtered)
                    return
                }
            }

            const { data: allProgress } = await supabase
                .from('progreso_cliente')
                .select('ejercicios_pendientes, ejercicios_completados')
                .eq('actividad_id', activityId)
                .eq('cliente_id', clientId)

            const exerciseIdSet = new Set<string>()
            if (allProgress) {
                allProgress.forEach((rec: any) => {
                    const pend = parseMaybeJson(rec.ejercicios_pendientes)
                    const comp = parseMaybeJson(rec.ejercicios_completados)
                    const allIds = [
                        ...(Array.isArray(pend) ? pend : Object.keys(pend)),
                        ...(Array.isArray(comp) ? comp : Object.keys(comp))
                    ]
                    allIds.forEach((rawId: any) => {
                        const baseId = String(rawId).split('_')[0].split('-').pop() || ''
                        if (baseId && !isNaN(Number(baseId))) exerciseIdSet.add(baseId)
                    })
                })
            }

            if (exerciseIdSet.size > 0) {
                const { data: exercises } = await supabase
                    .from('ejercicios_detalles')
                    .select('id, nombre_ejercicio, tipo, equipo, body_parts, calorias, duracion_min, detalle_series')
                    .in('id', Array.from(exerciseIdSet))
                if (exercises && exercises.length > 0) {
                    setAvailableExercises(exercises)
                }
            }
        } catch (e) {
            console.error('[useFitness] loadAvailableExercises error:', e)
            setAvailableExercises([])
        }
    }, [supabase, clientId])

    const handleEditFitness = useCallback((ex: ExerciseExecution, knownExerciseIds?: string[]) => {
        setEditingExerciseId(ex.id)
        setEditingOriginalExercise({ ...ex })
        
        const fullKey = (ex as any).exercise_key || ex.id.split('-').pop() || ''
        setInitialExerciseKey(fullKey)

        setEditingFitnessValues({
            sets: String(ex.sets ?? ''),
            reps: String(ex.reps ?? ''),
            kg: String(ex.kg ?? ''),
            duracion: String(ex.duracion ?? ''),
            calorias: String(ex.calorias_estimadas ?? '')
        })
        if (ex.actividad_id) loadAvailableExercises(Number(ex.actividad_id), knownExerciseIds)
    }, [loadAvailableExercises])

    const handleChangeExercise = useCallback(async (newExerciseId: string) => {
        if (!editingOriginalExercise || !editingExerciseId) return
        
        console.log('[useFitness] handleChangeExercise local swap starting:', { newExerciseId })
        setLoading(true)

        try {
            // Fetch new exercise details from the library
            const { data: newDetails, error: detailsError } = await supabase.from('ejercicios_detalles')
                .select('*')
                .eq('id', newExerciseId)
                .maybeSingle()

            if (detailsError) {
                console.error('[useFitness] Error fetching exercise details:', detailsError)
                return
            }

            if (!newDetails) {
                console.warn('[useFitness] Exercise details not found for:', newExerciseId)
                return
            }

            const suffix = initialExerciseKey ? initialExerciseKey.split('_').slice(1).join('_') : '1_1'
            const newFullKey = `${newExerciseId}_${suffix || '1_1'}`

            console.log('[useFitness] New key generated:', newFullKey, 'from suffix:', suffix)

            // Parse default variables from detalle_series
            let defaultSets = 0
            let defaultReps = 0
            let defaultKg = 0

            if (newDetails.detalle_series) {
                try {
                    if (typeof newDetails.detalle_series === 'string') {
                        const ds = JSON.parse(newDetails.detalle_series)
                        defaultSets = Number(ds.series || ds.sets || 0)
                        defaultReps = Number(ds.repeticiones || ds.reps || 0)
                        defaultKg = Number(ds.peso || ds.load || ds.kg || 0)
                    } else if (typeof newDetails.detalle_series === 'object') {
                        const ds = newDetails.detalle_series
                        defaultSets = Number(ds.series || ds.sets || 0)
                        defaultReps = Number(ds.repeticiones || ds.reps || 0)
                        defaultKg = Number(ds.peso || ds.load || ds.kg || 0)
                    }
                } catch (e) {
                    // Fallback to custom format (P-R-S)
                    const match = String(newDetails.detalle_series).match(/\((\d+)-(\d+)-(\d+)\)/)
                    if (match) {
                        defaultKg = parseInt(match[1]) || 0
                        defaultReps = parseInt(match[2]) || 0
                        defaultSets = parseInt(match[3]) || 0
                    }
                }
            }

            // Update local state ONLY
            setEditingOriginalExercise(prev => {
                if (!prev) return prev
                return {
                    ...prev,
                    ejercicio_id: String(newExerciseId),
                    ejercicio_nombre: newDetails.nombre_ejercicio,
                    exercise_key: newFullKey,
                    // Clear old details as we are swapping
                    detalle_series: null,
                    sets: defaultSets,
                    reps: defaultReps,
                    kg: defaultKg,
                    duracion: newDetails.duracion_min || 0,
                    calorias_estimadas: newDetails.calorias || 0
                }
            })

            setEditingFitnessValues({
                sets: String(defaultSets || ''),
                reps: String(defaultReps || ''),
                kg: String(defaultKg || ''),
                duracion: String(newDetails.duracion_min || ''),
                calorias: String(newDetails.calorias || '')
            })

            setShowExerciseDropdown(false)
            console.log('[useFitness] Local swap completed')
        } catch (e) {
            console.error('[useFitness] handleChangeExercise unexpected error:', e)
        } finally {
            setLoading(false)
        }
    }, [editingOriginalExercise, editingExerciseId, supabase, setLoading])

    const handleSaveFitness = useCallback(async () => {
        if (!editingOriginalExercise || !editingExerciseId || !editingFitnessValues) {
            console.warn('[useFitness] handleSaveFitness blocked: missing state')
            return
        }
        const ex = editingOriginalExercise
        if (!ex.actividad_id) return

        console.log('[useFitness] handleSaveFitness starting for:', ex.id)
        setLoading(true)
        try {
            const { data: record, error: recordError } = await supabase.from('progreso_cliente')
                .select('*')
                .eq('cliente_id', clientId)
                .eq('fecha', ex.fecha_ejercicio)
                .eq('actividad_id', ex.actividad_id)
                .maybeSingle()

            if (recordError || !record) {
                console.error('[useFitness] Save record fetch error:', recordError)
                alert('No se pudo encontrar el registro para guardar.')
                return
            }
            console.log('[useFitness] Record found for save:', record)

            const currentFullKey = ex.exercise_key || editingExerciseId.split('-').pop() || ''
            const oldFullKey = initialExerciseKey

            const newSets = Number(editingFitnessValues.sets) || 0
            const newReps = Number(editingFitnessValues.reps) || 0
            const newKg = Number(editingFitnessValues.kg) || 0
            const newMins = Number(editingFitnessValues.duracion) || 0
            const newCals = Number(editingFitnessValues.calorias) || 0

            const newPrescription = { sets: newSets, reps: newReps, kg: newKg, minutos: newMins, calorias: newCals }

            const parseCol = (col: any) => {
                if (!col) return {}
                if (typeof col === 'string') { try { return JSON.parse(col) } catch { return {} } }
                return typeof col === 'object' ? col : {}
            }

            let pend = parseCol(record.ejercicios_pendientes)
            let comp = parseCol(record.ejercicios_completados)
            let info = parseCol(record.informacion)
            let detalles = parseCol(record.detalles_series)
            let seriesMap = parseCol(record.series)
            let repsMap = parseCol(record.reps)
            let pesoMap = parseCol(record.peso)
            let minutosMap = parseCol(record.minutos)
            let caloriasMap = parseCol(record.calorias)

            console.log('[useFitness] Initial state before swap:', {
                pendType: Array.isArray(pend) ? 'Array' : 'Object',
                pendKeys: Array.isArray(pend) ? pend : Object.keys(pend)
            })

            const meta = inferMetaFromKey(currentFullKey)
            const finalPrescription = { ...newPrescription, ...meta, id: Number(ex.ejercicio_id) }

            // If a swap happened
            if (oldFullKey && currentFullKey !== oldFullKey) {
                console.log('[useFitness] Swap detected:', oldFullKey, '->', currentFullKey)
                
                pend = updateKeyContainer(pend, oldFullKey, currentFullKey, Number(ex.ejercicio_id))
                comp = updateKeyContainer(comp, oldFullKey) // Remove from completed if it was there
                info = updateKeyContainer(info, oldFullKey, currentFullKey, finalPrescription)
                detalles = updateKeyContainer(detalles, oldFullKey, currentFullKey, finalPrescription)
                
                // Manual update for numeric maps
                const updateNumericMap = (m: any, ok: string, nk: string, nv: number) => {
                    const obj = { ...m }
                    delete obj[ok]
                    obj[nk] = nv
                    return obj
                }
                seriesMap = updateNumericMap(seriesMap, oldFullKey, currentFullKey, newSets)
                repsMap = updateNumericMap(repsMap, oldFullKey, currentFullKey, newReps)
                pesoMap = updateNumericMap(pesoMap, oldFullKey, currentFullKey, newKg)
                minutosMap = updateNumericMap(minutosMap, oldFullKey, currentFullKey, newMins)
                caloriasMap = updateNumericMap(caloriasMap, oldFullKey, currentFullKey, newCals)
            } else {
                // Just update values for existing key
                if (typeof pend === 'object' && !Array.isArray(pend)) pend[currentFullKey] = Number(ex.ejercicio_id)
                
                info[currentFullKey] = finalPrescription
                detalles[currentFullKey] = finalPrescription
                seriesMap[currentFullKey] = newSets
                repsMap[currentFullKey] = newReps
                pesoMap[currentFullKey] = newKg
                minutosMap[currentFullKey] = newMins
                caloriasMap[currentFullKey] = newCals
            }

            console.log('[useFitness] Final state to save:', {
                pendFinal: pend,
                currentFullKey
            })

            console.log('[useFitness] Performing update with filters:', {
                cliente_id: clientId,
                fecha: ex.fecha_ejercicio,
                actividad_id: ex.actividad_id,
                payloadKeys: Object.keys(pend)
            })

            const { data: updateData, error: updateError } = await supabase.from('progreso_cliente')
                .update({
                    ejercicios_pendientes: pend,
                    ejercicios_completados: comp,
                    detalles_series: detalles,
                    series: seriesMap,
                    reps: repsMap,
                    peso: pesoMap,
                    minutos: minutosMap,
                    calorias: caloriasMap,
                    informacion: info,
                    fecha_actualizacion: new Date().toISOString()
                })
                .eq('cliente_id', clientId)
                .eq('fecha', ex.fecha_ejercicio)
                .eq('actividad_id', ex.actividad_id)
                .select()

            console.log('[useFitness] Sync update result:', { updateData, updateError })

            if (updateError) {
                console.error('[handleSaveFitness] Update error:', updateError)
                alert('No se pudo guardar la edición: ' + updateError.message)
            } else {
                console.log('[useFitness] Save successful')
                await fetchClientCalendarSummary()
                await loadDayActivityDetails(ex.fecha_ejercicio, ex.actividad_id, true)
                
                setCascadeModal({
                    isOpen: true, type: 'fitness', mode: 'update', sourceDate: ex.fecha_ejercicio,
                    sourceDayName: getDayName(new Date(ex.fecha_ejercicio).getDay()),
                    itemName: ex.ejercicio_nombre || 'Ejercicio',
                    payload: { prescription: newPrescription, itemKey: currentFullKey }
                })
                
                setEditingExerciseId(null)
                setInitialExerciseKey(null)
            }
        } catch (e: any) { 
            console.error('[handleSaveFitness] Unexpected error:', e)
            alert('Error inesperado al guardar: ' + e.message)
        } finally { 
            setLoading(false) 
        }
    }, [editingOriginalExercise, editingExerciseId, editingFitnessValues, initialExerciseKey, supabase, clientId, fetchClientCalendarSummary, loadDayActivityDetails, setCascadeModal, setLoading, setEditingExerciseId])

    const handleCancelFitness = useCallback(() => {
        setEditingExerciseId(null); setEditingOriginalExercise(null); setEditingFitnessValues(null); setShowExerciseDropdown(false); setInitialExerciseKey(null)
    }, [])

    return {
        editingExerciseId, setEditingExerciseId, editingOriginalExercise, setEditingOriginalExercise,
        showExerciseDropdown, setShowExerciseDropdown, availableExercises,
        editingFitnessValues, setEditingFitnessValues,
        loadAvailableExercises, handleChangeExercise, canEditFitnessForDay,
        handleEditFitness, handleSaveFitness, handleCancelFitness
    }
}
