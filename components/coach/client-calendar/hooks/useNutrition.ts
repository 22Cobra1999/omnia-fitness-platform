import { useState, useCallback } from 'react'
import { ExerciseExecution } from '../types'
import { parseMaybeJson, buildNewNutritionPayload, normalizeNutritionContainerToObject } from '../utils/data-parsers'
import { getDayName } from '../utils/date-helpers'

export function useNutrition(
    supabase: any,
    clientId: string,
    fetchClientCalendarSummary: () => Promise<void>,
    loadDayActivityDetails: (day: string, actId: number) => Promise<void>,
    setCascadeModal: (modal: any) => void,
    setLoading: (val: boolean) => void
) {
    const [editingNutritionId, setEditingNutritionId] = useState<string | null>(null)
    const [editingNutritionMacros, setEditingNutritionMacros] = useState<any>(null)
    const [editingNutritionPlateId, setEditingNutritionPlateId] = useState<string | null>(null)
    const [nutritionPlateOptionsByActivity, setNutritionPlateOptionsByActivity] = useState<Record<string, any[]>>({})
    const [showIngredientsModal, setShowIngredientsModal] = useState(false)
    const [editingIngredientsList, setEditingIngredientsList] = useState<any[]>([])
    const [editingNutritionExercise, setEditingNutritionExercise] = useState<ExerciseExecution | null>(null)
    const [confirmDeleteNutritionId, setConfirmDeleteNutritionId] = useState<string | null>(null)

    const canEditNutritionForDay = useCallback((ex: ExerciseExecution) => {
        const today = new Date().toISOString().split('T')[0]
        return ex.fecha_ejercicio >= today && !ex.completado
    }, [])

    const handleEditNutrition = useCallback((ex: ExerciseExecution) => {
        setEditingNutritionId(ex.id)
        setEditingNutritionMacros({
            proteinas: String(ex.nutricion_macros?.proteinas ?? ''),
            carbohidratos: String(ex.nutricion_macros?.carbohidratos ?? ''),
            grasas: String(ex.nutricion_macros?.grasas ?? ''),
            calorias: String(ex.nutricion_macros?.calorias ?? ''),
            minutos: String(ex.nutricion_macros?.minutos ?? '')
        })
        setEditingNutritionPlateId(ex.ejercicio_id)

        if (ex.actividad_id && !nutritionPlateOptionsByActivity[ex.actividad_id]) {
            supabase.from('nutrition_program_details').select('*').eq('activity_id', ex.actividad_id)
                .then(({ data }: any) => {
                    if (data) setNutritionPlateOptionsByActivity(prev => ({ ...prev, [ex.actividad_id!]: data }))
                })
        }
    }, [supabase, nutritionPlateOptionsByActivity])

    const handleOpenIngredients = useCallback((ex: ExerciseExecution) => {
        setEditingNutritionExercise(ex)
        const ings = ex.ingredientes_detalle || {}
        setEditingIngredientsList(Object.keys(ings).map(k => ({ _key: k, ...ings[k] })))
        setShowIngredientsModal(true)
    }, [])

    const handleSaveNutrition = useCallback(async (ex: ExerciseExecution, extra?: any) => {
        if (!ex.nutrition_record_id || !ex.nutrition_key) return
        setLoading(true)
        try {
            const { data: record } = await supabase.from('progreso_cliente_nutricion').select('*').eq('id', ex.nutrition_record_id).single()
            if (!record) return

            const macros = parseMaybeJson(record.macros) || {}
            const ingredients = parseMaybeJson(record.ingredientes) || {}

            const newMacros = {
                proteinas: Number(editingNutritionMacros.proteinas),
                carbohidratos: Number(editingNutritionMacros.carbohidratos),
                grasas: Number(editingNutritionMacros.grasas),
                calorias: Number(editingNutritionMacros.calorias),
                minutos: Number(editingNutritionMacros.minutos)
            }

            macros[ex.nutrition_key] = newMacros
            if (extra?.ingredientes) ingredients[ex.nutrition_key] = extra.ingredientes

            await supabase.from('progreso_cliente_nutricion').update({ macros, ingredientes: ingredients }).eq('id', ex.nutrition_record_id)

            await fetchClientCalendarSummary()
            if (ex.actividad_id) await loadDayActivityDetails(ex.fecha_ejercicio, ex.actividad_id)

            setCascadeModal({
                isOpen: true, type: 'nutrition', mode: 'update', sourceDate: ex.fecha_ejercicio,
                sourceDayName: getDayName(new Date(ex.fecha_ejercicio).getDay()),
                itemName: ex.ejercicio_nombre || 'Plato',
                payload: { macros: newMacros, ingredients: extra?.ingredientes || ingredients[ex.nutrition_key], newId: ex.ejercicio_id }
            })
        } catch (e) { console.error(e) } finally { setLoading(false); setEditingNutritionId(null) }
    }, [editingNutritionMacros, supabase, fetchClientCalendarSummary, loadDayActivityDetails, setCascadeModal, setLoading])

    const handleCancelNutrition = useCallback(() => {
        setEditingNutritionId(null); setEditingNutritionMacros(null); setEditingNutritionPlateId(null)
    }, [])

    const handleDeleteNutrition = useCallback(async (id: string) => {
        // Implementation...
    }, [])

    return {
        editingNutritionId, editingNutritionMacros, editingNutritionPlateId,
        setEditingNutritionPlateId, setEditingNutritionMacros,
        nutritionPlateOptionsByActivity, showIngredientsModal, setShowIngredientsModal,
        editingIngredientsList, setEditingIngredientsList, editingNutritionExercise,
        confirmDeleteNutritionId, setConfirmDeleteNutritionId,
        handleEditNutrition, handleSaveNutrition, handleCancelNutrition, handleDeleteNutrition,
        handleOpenIngredients, canEditNutritionForDay
    }
}
