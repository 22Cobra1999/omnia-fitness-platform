import { useCallback } from 'react'
import { getExerciseName } from '../utils/csv-helpers'
import { ManualFormState, ExerciseData } from '../types'

interface UseCsvNutritionDomainProps {
    allData: any[]
    manualForm: ManualFormState
    setManualForm: (updater: any) => void
    setMode: (mode: 'csv' | 'manual') => void
    setEditingExerciseIndex: (index: number | null) => void
    setRecipeSteps: (steps: string[]) => void
    updateErrorState: (msg: string | null, details?: string[]) => void
    editingExerciseIndex: number | null
    evaluateAvailableSlots: (requested: number) => { allowed: number; blocked: number }
    setLimitWarning: (warning: string | null) => void
    planLimits: { activitiesLimit: number } | null
    clearLimitWarningIfNeeded: () => void
    setCsvData: (updater: any) => void
    parentSetCsvData?: (data: any[]) => void
    parentCsvData?: any[]
    cancelEdit: () => void
    setNewlyAddedIds: (updater: any) => void
}

export function useCsvNutritionDomain({
    allData,
    manualForm,
    setManualForm,
    setMode,
    setEditingExerciseIndex,
    setRecipeSteps,
    updateErrorState,
    editingExerciseIndex,
    evaluateAvailableSlots,
    setLimitWarning,
    planLimits,
    clearLimitWarningIfNeeded,
    setCsvData,
    parentSetCsvData,
    parentCsvData,
    cancelEdit,
    setNewlyAddedIds
}: UseCsvNutritionDomainProps) {

    const handleEditExercise = useCallback((exercise: ExerciseData, index: number) => {
        setMode('manual')

        const recetaValue = (exercise['Receta'] || exercise.receta || exercise['Descripción'] || exercise.descripcion || '')
        const exerciseData: any = {
            nombre: getExerciseName(exercise),
            receta: recetaValue,
            descripcion: recetaValue,
            proteinas: exercise['Proteínas (g)'] || exercise.proteinas || '',
            carbohidratos: exercise['Carbohidratos (g)'] || exercise.carbohidratos || '',
            grasas: exercise['Grasas (g)'] || exercise.grasas || '',
            porciones: exercise['Porciones'] || exercise.porciones || '',
            minutos: exercise['Minutos'] || exercise.minutos || '',
            ingredientes: exercise['Ingredientes'] || exercise.ingredientes || '',
            dificultad: exercise['Dificultad'] || exercise.dificultad || 'Principiante',
            calorias: exercise.calorias ?? exercise.Calorías ?? exercise.calorías ?? '',
            tipo: exercise.tipo || exercise.Comida || '',
            video_url: exercise.video_url || '',
            video_file_name: exercise.video_file_name || '',
            video_source: exercise.video_source || (exercise.video_url ? 'existing' : ''),
            bunny_video_id: exercise.bunny_video_id || '',
            bunny_library_id: exercise.bunny_library_id || '',
            video_thumbnail_url: exercise.video_thumbnail_url || ''
        }

        setManualForm((prev: any) => ({ ...prev, ...exerciseData }))

        if (exerciseData.descripcion) {
            const descripcion = exerciseData.descripcion
            const stepPattern = /^\d+\.\s*(.+)$/gm
            const matches = descripcion.match(stepPattern)
            if (matches && matches.length > 0) {
                setRecipeSteps(matches.map((match: string) => match.replace(/^\d+\.\s*/, '').trim()))
            } else {
                const lines = descripcion.split('\n').filter((line: string) => line.trim())
                setRecipeSteps(lines.length > 1 ? lines.map((line: string) => line.replace(/^\d+\.\s*/, '').trim()) : [])
            }
        } else {
            setRecipeSteps([])
        }

        setEditingExerciseIndex(index)
    }, [
        setMode,
        setManualForm,
        setRecipeSteps,
        setEditingExerciseIndex
    ])

    const addManualExercise = useCallback(() => {
        console.log("🥘 [NutritionDomain] Starting addManualExercise - Form State:", {
            nombre: manualForm.nombre,
            tipo: manualForm.tipo,
            calorias: manualForm.calorias,
            macros: { p: manualForm.proteinas, c: manualForm.carbohidratos, g: manualForm.grasas },
            ingredientesLen: manualForm.ingredientes?.length || 0,
            porciones: manualForm.porciones,
            minutos: manualForm.minutos
        })

        if (!manualForm.nombre.trim()) {
            console.warn("⚠️ [NutritionDomain] Aborting - Name is empty")
            updateErrorState(`Completa al menos el campo "Nombre del Plato"`)
            return
        }
        updateErrorState(null)

        let item: any = {
            'Día': 'Lunes',
            'Comida': manualForm.tipo || 'Desayuno',
            'Nombre': manualForm.nombre,
            tipo: manualForm.tipo || 'Desayuno',
            'Receta': manualForm.receta || manualForm.descripcion,
            'Calorías': manualForm.calorias,
            calorias: manualForm.calorias, // Canonical key
            'Proteínas (g)': manualForm.proteinas,
            'Carbohidratos (g)': manualForm.carbohidratos,
            'Grasas (g)': manualForm.grasas,
            'Dificultad': manualForm.dificultad || 'Principiante',
            'Ingredientes': manualForm.ingredientes,
            'Porciones': manualForm.porciones,
            'Minutos': manualForm.minutos,
            video_url: manualForm.video_url || '',
            video_file_name: manualForm.video_file_name || '',
            video_source: manualForm.video_source || '',
            bunny_video_id: manualForm.bunny_video_id || '',
            bunny_library_id: manualForm.bunny_library_id || '',
            video_thumbnail_url: manualForm.video_thumbnail_url || '',
            isExisting: false
        }

        const editingRow = editingExerciseIndex !== null ? allData[editingExerciseIndex] : null
        const rowId = editingRow?.id
        const tempId = editingRow?.tempRowId

        item = {
            ...item,
            id: rowId || item.id,
            tempRowId: tempId || `manual-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
            csvRowId: editingRow?.csvRowId || (item as any).csvRowId,
            isExisting: editingRow ? !!editingRow.isExisting : false
        }

        if (editingRow) {
            const updater = (prev: any[]) => {
                const identifierMatch = (r: any) =>
                    (rowId && r.id === rowId) || (tempId && r.tempRowId === tempId)

                const exists = prev.some(identifierMatch)
                if (exists) {
                    return prev.map((r: any) => identifierMatch(r) ? { ...r, ...item } : r)
                } else {
                    return [...prev, item]
                }
            }

            setCsvData(updater)
            if (parentSetCsvData) {
                parentSetCsvData(updater(parentCsvData || []))
            }
            cancelEdit()
            console.log("🥘 [NutritionDomain] Edit SUCCESS. Item ID:", item.id || item.tempRowId)
            return item
        }

        const { allowed } = evaluateAvailableSlots(1)
        if (allowed === 0) {
            setLimitWarning(`Límite de platos (${planLimits?.activitiesLimit}) alcanzado. No puedes agregar más platos manualmente.`)
            return
        }
        clearLimitWarningIfNeeded()

        setCsvData((prev: any) => [item, ...prev])
        if (parentSetCsvData) {
            parentSetCsvData([item, ...(parentCsvData || [])])
        }

        // --- NEW UX ENHANCEMENTS ---
        const newItemIdentifier = item.id || item.tempRowId
        setNewlyAddedIds((prev: Set<string | number>) => {
            const next = new Set(prev)
            next.add(newItemIdentifier)
            return next
        })

        // Auto-scroll to table
        setTimeout(() => {
            const tableElement = document.getElementById('csv-table-scroll-target')
            if (tableElement) {
                tableElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
            }
        }, 100)

        console.log("🥘 [NutritionDomain] addManualExercise SUCCESS. Item ID:", newItemIdentifier)
        return item
    }, [
        manualForm,
        editingExerciseIndex,
        allData,
        setCsvData,
        parentSetCsvData,
        parentCsvData,
        cancelEdit,
        evaluateAvailableSlots,
        setLimitWarning,
        planLimits,
        clearLimitWarningIfNeeded,
        updateErrorState,
        setNewlyAddedIds
    ])

    return {
        handleEditExercise,
        addManualExercise
    }
}
