import { useState, useCallback } from 'react'
import { ExerciseExecution } from '../types'
import { parseMaybeJson, updateKeyContainer } from '../utils/data-parsers'
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
    const [availableExercises, setAvailableExercises] = useState<any[]>([])
    const [showExerciseDropdown, setShowExerciseDropdown] = useState(false)
    const [editingFitnessValues, setEditingFitnessValues] = useState<any>(null)

    const canEditFitnessForDay = useCallback((ex: ExerciseExecution) => {
        // Coach can always edit exercises
        return true
    }, [])

    const loadAvailableExercises = useCallback(async (activityId: number, knownExerciseIds?: string[]) => {
        try {
            // Fetch everything initially to avoid complex JSONB queries that might fail (400)
            // But we filter by activityId in JS
            const { data: allLib, error: libError } = await supabase
                .from('ejercicios_detalles')
                .select('id, nombre_ejercicio, tipo, equipo, body_parts, calorias, duracion_min, activity_id')
                .limit(2000)

            if (libError) console.error('[useFitness] Library query error:', libError)

            if (allLib) {
                // activity_id is a JSONB map: { "actividad_id": { "activo": true } }
                const filtered = allLib.filter((ex: any) => {
                    // Widen search: Show anything that looks like a fitness exercise (not nutrition)
                    // Or if specific activity requested, we could prioritize, but user wants "entire program"
                    return ex.tipo !== 'nutricion' && ex.tipo !== 'comida'
                })
                
                if (filtered.length > 0) {
                    setAvailableExercises(filtered)
                    return
                }
            }

            // Fallback: search in previous progress
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
                    .select('id, nombre_ejercicio, tipo, equipo, body_parts, calorias, duracion_min')
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
        const ex = editingOriginalExercise
        if (!ex.actividad_id) return

        console.log('[useFitness] handleChangeExercise swap starting:', { newExerciseId, ex })
        
        // CLEAR STATE IMMEDIATELY to prevent race conditions (e.g. clicking Save while swap is in progress)
        setShowExerciseDropdown(false)
        setEditingExerciseId(null)
        setEditingOriginalExercise(null)
        setLoading(true)

        try {
            const { data: record, error: recordError } = await supabase.from('progreso_cliente')
                .select('*')
                .eq('cliente_id', clientId)
                .eq('fecha', ex.fecha_ejercicio)
                .eq('actividad_id', ex.actividad_id)
                .maybeSingle()

            if (recordError) {
                console.error('[useFitness] Swap record fetch error:', recordError)
                alert('No se pudo encontrar el registro: ' + recordError.message)
                return
            }

            if (!record) {
                console.warn('[useFitness] No record found for swap', { clientId, fecha: ex.fecha_ejercicio, actId: ex.actividad_id })
                alert('No se encontró el registro de progreso para este día y actividad.')
                return
            }

            // Fetch new exercise details
            const { data: newDetails } = await supabase.from('ejercicios_detalles')
                .select('*')
                .eq('id', newExerciseId)
                .maybeSingle()

            const oldFullKey = (ex as any).exercise_key || editingExerciseId.split('-').pop() || ''
            const newFullKey = `${newExerciseId}_1_1`

            console.log('[useFitness] Processing keys:', { oldFullKey, newFullKey })

            const parseCol = (col: any) => {
                if (!col) return {}
                if (typeof col === 'string') { try { return JSON.parse(col) } catch { return {} } }
                return typeof col === 'object' ? col : {}
            }

            // Update key containers
            const pend = parseCol(record.ejercicios_pendientes)
            delete pend[oldFullKey]
            pend[newFullKey] = Number(newExerciseId) // Standard value is the exercise ID as number

            const comp = parseCol(record.ejercicios_completados)
            delete comp[oldFullKey]
            
            // New defaults
            const newPrescription = {
                sets: Number(newDetails?.sets || 0),
                reps: Number(newDetails?.reps || 0),
                kg: Number(newDetails?.kg || 0),
                minutos: Number(newDetails?.duracion_min || 0),
                calorias: Number(newDetails?.calorias || 0),
                ejercicio_id: newExerciseId
            }

            // Update ALL relevant columns to keep data in sync
            const info = parseCol(record.informacion)
            delete info[oldFullKey]
            info[newFullKey] = { ...newPrescription, id: Number(newExerciseId), orden: 1, bloque: 1 }

            const detalles = parseCol(record.detalles_series)
            delete detalles[oldFullKey]
            detalles[newFullKey] = { ...newPrescription, id: Number(newExerciseId), orden: 1, bloque: 1 }

            const seriesMap = parseCol(record.series); delete seriesMap[oldFullKey]; seriesMap[newFullKey] = newPrescription.sets
            const repsMap = parseCol(record.reps); delete repsMap[oldFullKey]; repsMap[newFullKey] = newPrescription.reps
            const pesoMap = parseCol(record.peso); delete pesoMap[oldFullKey]; pesoMap[newFullKey] = newPrescription.kg
            const minutosMap = parseCol(record.minutos); delete minutosMap[oldFullKey]; minutosMap[newFullKey] = newPrescription.minutos
            const caloriasMap = parseCol(record.calorias); delete caloriasMap[oldFullKey]; caloriasMap[newFullKey] = newPrescription.calorias

            console.log('[useFitness] Sending swap update to DB for row:', record.id)

            const { error: updateError } = await supabase.from('progreso_cliente')
                .update({ 
                    ejercicios_pendientes: pend, 
                    ejercicios_completados: comp,
                    informacion: info,
                    detalles_series: detalles,
                    series: seriesMap,
                    reps: repsMap,
                    peso: pesoMap,
                    minutos: minutosMap,
                    calorias: caloriasMap
                })
                .eq('id', record.id)

            if (updateError) {
                console.error('[useFitness] Swap update error:', updateError)
                alert('Error al actualizar el ejercicio: ' + updateError.message)
            } else {
                console.log('[useFitness] Swap successful DB update for row ID:', record.id, 'New Key:', newFullKey)
                
                // Refresh data
                await fetchClientCalendarSummary()
                await loadDayActivityDetails(ex.fecha_ejercicio, ex.actividad_id, true)
                console.log('[useFitness] Data refresh triggered after swap')
            }
        } catch (e: any) { 
            console.error('[useFitness] Unexpected swap error:', e)
            alert('Error inesperado: ' + e.message)
        } finally { 
            setLoading(false) 
        }
    }, [editingOriginalExercise, editingExerciseId, supabase, clientId, fetchClientCalendarSummary, loadDayActivityDetails, setLoading, setShowExerciseDropdown, setEditingExerciseId, setEditingOriginalExercise])

    const handleSaveFitness = useCallback(async () => {
        if (!editingOriginalExercise || !editingExerciseId || !editingFitnessValues) {
            console.warn('[useFitness] handleSaveFitness blocked: missing state', { 
                editingOriginalExercise: !!editingOriginalExercise, 
                editingExerciseId, 
                editingFitnessValues: !!editingFitnessValues 
            })
            return
        }
        const ex = editingOriginalExercise
        if (!ex.actividad_id) {
            console.error('[useFitness] handleSaveFitness missing actividad_id')
            return
        }

        console.log('[useFitness] handleSaveFitness starting for:', ex.id)
        setLoading(true)
        try {
            const { data: record, error: recordError } = await supabase.from('progreso_cliente')
                .select('*')
                .eq('cliente_id', clientId)
                .eq('fecha', ex.fecha_ejercicio)
                .eq('actividad_id', ex.actividad_id)
                .maybeSingle()

            if (recordError) {
                console.error('[useFitness] Save record fetch error:', recordError)
                alert('Error al buscar el registro: ' + recordError.message)
                return
            }

            if (!record) {
                console.warn('[useFitness] No record found for', { clientId, fecha: ex.fecha_ejercicio, actividad_id: ex.actividad_id })
                alert('No se pudo encontrar el registro de progreso para guardar.')
                return
            }

            const fullKey = (ex as any).exercise_key || editingExerciseId.split('-').pop() || ''
            if (!fullKey) {
                console.error('[handleSaveFitness] Missing exercise_key/fullKey for', ex)
                alert('Error técnico: No se pudo identificar la clave del ejercicio.')
                return
            }

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
            const detalles = parseCol(record.detalles_series)
            detalles[fullKey] = newPrescription

            const seriesMap = parseCol(record.series); seriesMap[fullKey] = newSets
            const repsMap = parseCol(record.reps); repsMap[fullKey] = newReps
            const pesoMap = parseCol(record.peso); pesoMap[fullKey] = newKg
            const minutosMap = parseCol(record.minutos); minutosMap[fullKey] = newMins
            const caloriasMap = parseCol(record.calorias); caloriasMap[fullKey] = newCals

            const infoMap = parseCol(record.informacion)
            infoMap[fullKey] = { ...(infoMap[fullKey] || {}), ...newPrescription }

            const { error: updateError } = await supabase.from('progreso_cliente')
                .update({
                    detalles_series: detalles,
                    series: seriesMap,
                    reps: repsMap,
                    peso: pesoMap,
                    minutos: minutosMap,
                    calorias: caloriasMap,
                    informacion: infoMap
                })
                .eq('id', record.id)

            if (updateError) {
                console.error('[handleSaveFitness] Update error:', updateError)
                alert('No se pudo guardar la edición: ' + (updateError.message || 'Error desconocido'))
            } else {
                console.log('[useFitness] Save successful')
                await fetchClientCalendarSummary()
                await loadDayActivityDetails(ex.fecha_ejercicio, ex.actividad_id, true)
                
                setCascadeModal({
                    isOpen: true, type: 'fitness', mode: 'update', sourceDate: ex.fecha_ejercicio,
                    sourceDayName: getDayName(new Date(ex.fecha_ejercicio).getDay()),
                    itemName: ex.ejercicio_nombre || 'Ejercicio',
                    payload: { prescription: newPrescription, itemKey: fullKey }
                })
                
                setEditingExerciseId(null)
            }
        } catch (e: any) { 
            console.error('[handleSaveFitness] Unexpected error:', e)
            alert('Error inesperado al guardar: ' + e.message)
        } finally { 
            setLoading(false) 
        }
    }, [editingOriginalExercise, editingExerciseId, editingFitnessValues, supabase, clientId, fetchClientCalendarSummary, loadDayActivityDetails, setCascadeModal, setLoading, setEditingExerciseId])

    const handleCancelFitness = useCallback(() => {
        setEditingExerciseId(null); setEditingOriginalExercise(null); setEditingFitnessValues(null); setShowExerciseDropdown(false)
    }, [])

    return {
        editingExerciseId, setEditingExerciseId, setEditingOriginalExercise,
        showExerciseDropdown, setShowExerciseDropdown, availableExercises,
        editingFitnessValues, setEditingFitnessValues,
        loadAvailableExercises, handleChangeExercise, canEditFitnessForDay,
        handleEditFitness, handleSaveFitness, handleCancelFitness
    }
}
