import { useCallback } from 'react'
import { normalizeExerciseType, getExerciseName } from '../utils/csv-helpers'
import { ManualFormState, ExerciseData } from '../types'

interface UseCsvExerciseDomainProps {
    productCategory: 'fitness' | 'nutricion'
    allData: any[]
    manualForm: ManualFormState
    setManualForm: (updater: any) => void
    setMode: (mode: 'csv' | 'manual') => void
    setEditingExerciseIndex: (index: number | null) => void
    setRecipeSteps: (steps: string[]) => void
    setBodyParts: (parts: string[]) => void
    setEquipoList: (equipo: string[]) => void
    setSeriesList: (series: any[]) => void
    updateErrorState: (msg: string | null, details?: string[]) => void
    seriesList: any[]
    bodyParts: string[]
    equipoList: string[]
    editingExerciseIndex: number | null
    evaluateAvailableSlots: (requested: number) => { allowed: number; blocked: number }
    setLimitWarning: (warning: string | null) => void
    planLimits: { activitiesLimit: number } | null
    clearLimitWarningIfNeeded: () => void
    setCsvData: (updater: any) => void
    parentSetCsvData?: (data: any[]) => void
    parentCsvData?: any[]
    cancelEdit: () => void
}

export function useCsvExerciseDomain({
    allData,
    manualForm,
    setManualForm,
    setMode,
    setEditingExerciseIndex,
    setRecipeSteps,
    setBodyParts,
    setEquipoList,
    setSeriesList,
    updateErrorState,
    seriesList,
    bodyParts,
    equipoList,
    editingExerciseIndex,
    evaluateAvailableSlots,
    setLimitWarning,
    planLimits,
    clearLimitWarningIfNeeded,
    setCsvData,
    parentSetCsvData,
    parentCsvData,
    cancelEdit
}: UseCsvExerciseDomainProps) {

    const handleEditExercise = useCallback((exercise: ExerciseData, index: number) => {
        setMode('manual')

        const exerciseData: any = {
            nombre: getExerciseName(exercise),
            descripcion: exercise['Descripción'] || exercise.descripcion || '',
            duracion_min: exercise['Duración (min)'] || exercise.duracion_min || '',
            tipo_ejercicio: normalizeExerciseType(exercise['Tipo de Ejercicio'] || exercise.tipo_ejercicio || ''),
            nivel_intensidad: exercise['Nivel de Intensidad'] || exercise.intensidad || '',
            equipo_necesario: exercise['Equipo Necesario'] || exercise.equipo_necesario || '',
            detalle_series: exercise['Detalle de Series (peso-repeticiones-series)'] || exercise.detalle_series || '',
            partes_cuerpo: exercise['Partes del Cuerpo'] || exercise.body_parts || '',
            calorias: exercise.Calorías || exercise.calorias || '',
            video_url: exercise.video_url || '',
            video_file_name: exercise.video_file_name || '',
            video_source: exercise.video_source || (exercise.video_url ? 'existing' : ''),
            bunny_video_id: exercise.bunny_video_id || '',
            bunny_library_id: exercise.bunny_library_id || '',
            video_thumbnail_url: exercise.video_thumbnail_url || ''
        }

        setManualForm((prev: any) => ({ ...prev, ...exerciseData }))
        setRecipeSteps([])

        if (exerciseData.partes_cuerpo) {
            setBodyParts(exerciseData.partes_cuerpo.toString().split(/;|,/).filter(Boolean).map((p: string) => p.trim()))
        }
        if (exerciseData.equipo_necesario) {
            setEquipoList(exerciseData.equipo_necesario.toString().split(/;|,/).filter(Boolean).map((e: string) => e.trim()))
        }
        if (exerciseData.detalle_series) {
            try {
                const seriesMatches = exerciseData.detalle_series.toString().match(/\(([^)]+)\)/g)
                if (seriesMatches) {
                    setSeriesList(seriesMatches.map((series: string) => {
                        const parts = series.replace(/[()]/g, '').split('-')
                        return { peso: parts[0] || '', repeticiones: parts[1] || '', series: parts[2] || '' }
                    }))
                }
            } catch (error) { console.error('Error parseando series:', error) }
        }

        setEditingExerciseIndex(index)
    }, [
        setMode,
        setManualForm,
        setRecipeSteps,
        setBodyParts,
        setEquipoList,
        setSeriesList,
        setEditingExerciseIndex
    ])

    const addManualExercise = useCallback(() => {
        if (!manualForm.nombre.trim()) {
            updateErrorState(`Completa al menos el campo "Nombre de la Actividad"`)
            return
        }
        updateErrorState(null)

        const detalleSeriesStr = seriesList.length ? seriesList.map(s => `(${s.peso}-${s.repeticiones}-${s.series})`).join(';') : manualForm.detalle_series
        const partesCuerpoStr = bodyParts.length ? bodyParts.join(';') : manualForm.partes_cuerpo
        const equipoNecesarioStr = equipoList.length ? equipoList.join(', ') : manualForm.equipo_necesario

        let item: any = {
            'Nombre de la Actividad': manualForm.nombre,
            'Descripción': manualForm.descripcion,
            'Duración (min)': manualForm.duracion_min,
            'Tipo de Ejercicio': normalizeExerciseType(manualForm.tipo_ejercicio),
            'Nivel de Intensidad': manualForm.nivel_intensidad,
            'Equipo Necesario': equipoNecesarioStr,
            'Detalle de Series (peso-repeticiones-series)': detalleSeriesStr,
            'Partes del Cuerpo': partesCuerpoStr,
            'Calorías': manualForm.calorias,
            video_url: manualForm.video_url || '',
            video_file_name: manualForm.video_file_name || '',
            video_source: manualForm.video_source || '',
            bunny_video_id: manualForm.bunny_video_id || '',
            bunny_library_id: manualForm.bunny_library_id || '',
            video_thumbnail_url: manualForm.video_thumbnail_url || '',
            isExisting: false
        }

        const editingRow = editingExerciseIndex !== null ? allData[editingExerciseIndex] : null
        item = {
            ...item,
            tempRowId: editingRow?.tempRowId || `manual-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
            csvRowId: editingRow?.csvRowId || (item as any).csvRowId
        }

        if (editingExerciseIndex !== null) {
            setCsvData((prev: any) => prev.map((row: any, idx: number) => idx === editingExerciseIndex ? { ...row, ...item } : row))
            if (parentSetCsvData) {
                parentSetCsvData((parentCsvData || []).map((row: any, idx: number) => idx === editingExerciseIndex ? { ...row, ...item } : row))
            }
            cancelEdit()
            return
        }

        const { allowed } = evaluateAvailableSlots(1)
        if (allowed === 0) {
            setLimitWarning(`Límite de ejercicios (${planLimits?.activitiesLimit}) alcanzado. No puedes agregar más ejercicios manualmente.`)
            return
        }
        clearLimitWarningIfNeeded()

        setCsvData((prev: any) => [...prev, item])
        if (parentSetCsvData) {
            parentSetCsvData([...(parentCsvData || []), item])
        }
    }, [
        manualForm,
        seriesList,
        bodyParts,
        equipoList,
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
        updateErrorState
    ])

    return {
        handleEditExercise,
        addManualExercise
    }
}
