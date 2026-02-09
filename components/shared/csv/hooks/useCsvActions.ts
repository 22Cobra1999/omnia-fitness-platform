import { useCallback } from 'react'
import {
    normalizeExerciseType,
    extractBunnyVideoIdFromUrl,
    getRowIdentifier,
    getExerciseName
} from '../utils/csv-helpers'
import { ManualFormState, ExerciseData } from '../types'

interface UseCsvActionsProps {
    activityId: number
    coachId: string
    productCategory: 'fitness' | 'nutricion'
    csvData: any[]
    existingData: any[]
    parentCsvData?: any[]
    selectedRows: Set<number>
    setCsvData: (updater: any) => void
    setExistingData: (updater: any) => void
    setSelectedRows: (rows: any) => void
    parentSetCsvData?: (data: any[]) => void
    parentSetSelectedRows?: (rows: Set<number>) => void
    setManualForm: (updater: any) => void
    setMode: (mode: 'csv' | 'manual') => void
    setEditingExerciseIndex: (index: number | null) => void
    setShowAssignedVideoPreview: (show: boolean) => void
    setRecipeSteps: (steps: string[]) => void
    setBodyParts: (parts: string[]) => void
    setEquipoList: (equipo: string[]) => void
    setSeriesList: (series: any[]) => void
    setUploadedFiles: (updater: any) => void
    setFile: (file: File | null) => void
    setResult: (result: any) => void
    setProcessing: (processing: boolean) => void
    setLimitWarning: (warning: string | null) => void
    updateErrorState: (msg: string | null, details?: string[]) => void
    loadExistingData: () => Promise<void>
    onSuccess?: () => void
    onRemoveCSV?: () => void
    onItemsStatusChange?: (items: any[], action: 'disable' | 'reactivate' | 'remove') => void
    onVideoFileSelected?: (exercise: any, index: number, videoFile: File) => void
    onVideoCleared?: (index: number, exercise: any, meta?: any) => void
    fileInputRef: React.RefObject<HTMLInputElement | null>
    justDeletedRef: React.MutableRefObject<boolean>
    hasUserInteractedRef: React.MutableRefObject<boolean>
    allData: any[]
    evaluateAvailableSlots: (requested: number) => { allowed: number; blocked: number }
    clearLimitWarningIfNeeded: () => void
    seriesList: any[]
    bodyParts: string[]
    equipoList: string[]
    manualForm: ManualFormState
    editingExerciseIndex: number | null
    planLimits: { activitiesLimit: number } | null
}

export function useCsvActions({
    activityId,
    coachId,
    productCategory,
    csvData,
    existingData,
    parentCsvData,
    selectedRows,
    setCsvData,
    setExistingData,
    setSelectedRows,
    parentSetCsvData,
    parentSetSelectedRows,
    setManualForm,
    setMode,
    setEditingExerciseIndex,
    setShowAssignedVideoPreview,
    setRecipeSteps,
    setBodyParts,
    setEquipoList,
    setSeriesList,
    setUploadedFiles,
    setFile,
    setResult,
    setProcessing,
    setLimitWarning,
    updateErrorState,
    loadExistingData,
    onSuccess,
    onRemoveCSV,
    onItemsStatusChange,
    onVideoFileSelected,
    onVideoCleared,
    fileInputRef,
    justDeletedRef,
    hasUserInteractedRef,
    allData,
    evaluateAvailableSlots,
    clearLimitWarningIfNeeded,
    seriesList,
    bodyParts,
    equipoList,
    manualForm,
    editingExerciseIndex,
    planLimits
}: UseCsvActionsProps) {

    const handleRowSelection = useCallback((index: number) => {
        const newSelected = new Set(selectedRows)
        if (newSelected.has(index)) {
            newSelected.delete(index)
        } else {
            newSelected.add(index)
        }

        setSelectedRows(newSelected)
        if (parentSetSelectedRows) {
            parentSetSelectedRows(newSelected)
        }
    }, [selectedRows, setSelectedRows, parentSetSelectedRows])

    const cancelEdit = useCallback(() => {
        setEditingExerciseIndex(null)
        setMode('manual')
        setShowAssignedVideoPreview(false)
        setRecipeSteps([])
        setManualForm((prev: any) => ({
            ...prev,
            nombre: '',
            descripcion: '',
            duracion_min: '',
            tipo_ejercicio: '',
            nivel_intensidad: '',
            equipo_necesario: '',
            detalle_series: '',
            partes_cuerpo: '',
            calorias: '',
            comida: '',
            tipo: '',
            proteinas: '',
            carbohidratos: '',
            grasas: '',
            dificultad: 'Principiante',
            peso: '',
            receta: '',
            ingredientes: '',
            porciones: '',
            minutos: '',
            video_url: '',
            video_file_name: '',
            video_source: '',
            bunny_video_id: '',
            bunny_library_id: '',
            video_thumbnail_url: ''
        }))
        setBodyParts([])
        setEquipoList([])
        setSeriesList([])
    }, [
        setEditingExerciseIndex,
        setMode,
        setShowAssignedVideoPreview,
        setRecipeSteps,
        setManualForm,
        setBodyParts,
        setEquipoList,
        setSeriesList
    ])

    const handleEditExercise = useCallback((exercise: ExerciseData, index: number) => {
        setMode('manual')

        const exerciseData: any = {
            nombre: getExerciseName(exercise),
            descripcion: productCategory === 'nutricion'
                ? (exercise['Receta'] || exercise.receta || exercise['Descripción'] || exercise.descripcion || '')
                : (exercise['Descripción'] || exercise.descripcion || ''),
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

        if (productCategory === 'nutricion') {
            exerciseData.proteinas = exercise['Proteínas (g)'] || exercise.proteinas || ''
            exerciseData.carbohidratos = exercise['Carbohidratos (g)'] || exercise.carbohidratos || ''
            exerciseData.grasas = exercise['Grasas (g)'] || exercise.grasas || ''
            exerciseData.porciones = exercise['Porciones'] || exercise.porciones || ''
            exerciseData.minutos = exercise['Minutos'] || exercise.minutos || ''
            exerciseData.ingredientes = exercise['Ingredientes'] || exercise.ingredientes || ''
            exerciseData.dificultad = exercise['Dificultad'] || exercise.dificultad || 'Principiante'
        }

        setManualForm((prev: any) => ({ ...prev, ...exerciseData }))

        if (productCategory === 'nutricion' && exerciseData.descripcion) {
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
        productCategory,
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
            updateErrorState(`Completa al menos el campo "${productCategory === 'nutricion' ? 'Nombre del Plato' : 'Nombre de la Actividad'}"`)
            return
        }
        updateErrorState(null)

        let item: any

        if (productCategory === 'nutricion') {
            item = {
                'Día': 'Lunes',
                'Comida': 'Desayuno',
                'Nombre': manualForm.nombre,
                tipo: manualForm.tipo || 'Desayuno',
                'Receta': manualForm.descripcion,
                'Calorías': manualForm.calorias,
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
        } else {
            const detalleSeriesStr = seriesList.length ? seriesList.map(s => `(${s.peso}-${s.repeticiones}-${s.series})`).join(';') : manualForm.detalle_series
            const partesCuerpoStr = bodyParts.length ? bodyParts.join(';') : manualForm.partes_cuerpo
            const equipoNecesarioStr = equipoList.length ? equipoList.join(', ') : manualForm.equipo_necesario

            item = {
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
        }

        const editingRow = editingExerciseIndex !== null ? allData[editingExerciseIndex] : null
        item = {
            ...item,
            tempRowId: editingRow?.tempRowId || `manual-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
            csvRowId: editingRow?.csvRowId || item.csvRowId
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
        productCategory,
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

    const handleDeleteSelected = useCallback(() => {
        if (selectedRows.size === 0) return

        const currentData = allData
        const selectedIndices = Array.from(selectedRows)
        const selectedKeys = new Set(selectedIndices.map(index => getRowIdentifier(currentData[index], index)).filter(Boolean))

        const markInactive = (row: any, index?: number) => {
            const key = getRowIdentifier(row, index)
            return (key && selectedKeys.has(key)) ? { ...row, is_active: false, activo: false } : row
        }

        const rowsToDisable = selectedIndices.map(index => currentData[index])
        setCsvData((prev: any) => prev.map((row: any, idx: number) => markInactive(row, idx)))
        setExistingData((prev: any) => prev.map((row: any, idx: number) => markInactive(row, idx)))

        if (onItemsStatusChange && rowsToDisable.length > 0) {
            onItemsStatusChange(rowsToDisable, 'disable')
        }

        if (parentSetCsvData) {
            parentSetCsvData((parentCsvData || []).map((row: any, idx: number) => markInactive(row, idx)))
        }

        setSelectedRows(new Set())
        if (parentSetSelectedRows) parentSetSelectedRows(new Set())
    }, [allData, selectedRows, setCsvData, setExistingData, onItemsStatusChange, parentSetCsvData, parentCsvData, setSelectedRows, parentSetSelectedRows])

    const handleRemoveSelected = useCallback(async () => {
        if (selectedRows.size === 0) {
            updateErrorState('Selecciona al menos una fila para eliminar')
            return
        }

        const selectedIndices = Array.from(selectedRows)
        const selectedItems = selectedIndices.map(index => allData[index])
        const idsToDelete = selectedItems.filter(item => item.id).map(item => item.id).filter((id): id is number => id !== undefined)
        const itemsToRemove = new Set(selectedIndices.map((index, i) => getRowIdentifier(selectedItems[i], index)).filter(Boolean))

        if (idsToDelete.length > 0 && (activityId >= 0)) {
            try {
                const endpoint = productCategory === 'nutricion' ? '/api/delete-nutrition-items' : '/api/delete-exercise-items'
                const response = await fetch(endpoint, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ids: idsToDelete, activityId })
                })

                if (!response.ok) {
                    const errorData = await response.json()
                    updateErrorState(`Error al eliminar filas: ${errorData.error}`)
                    return
                }
                justDeletedRef.current = true
            } catch (error) {
                updateErrorState('Error al eliminar filas de la base de datos')
                return
            }
        }

        const shouldRemoveItem = (item: any, index?: number) => itemsToRemove.has(getRowIdentifier(item, index) || '')

        setCsvData((prev: any) => prev.filter((item: any, idx: number) => !shouldRemoveItem(item, idx)))
        setExistingData((prev: any) => prev.filter((item: any, idx: number) => !shouldRemoveItem(item, idx)))

        if (parentSetCsvData) {
            const filteredParent = (parentCsvData || []).filter((item: any, idx: number) => !shouldRemoveItem(item, idx))
            parentSetCsvData(filteredParent)
            if (activityId > 0) {
                sessionStorage.setItem(`activities_draft_${activityId}`, JSON.stringify(filteredParent))
                sessionStorage.setItem(`activities_draft_${activityId}_interacted`, 'true')
                hasUserInteractedRef.current = true
            }
        }

        setSelectedRows(new Set())
        if (parentSetSelectedRows) parentSetSelectedRows(new Set())
        setLimitWarning(null)
    }, [
        selectedRows,
        allData,
        activityId,
        productCategory,
        updateErrorState,
        setCsvData,
        setExistingData,
        parentSetCsvData,
        parentCsvData,
        setSelectedRows,
        parentSetSelectedRows,
        setLimitWarning,
        justDeletedRef,
        hasUserInteractedRef
    ])

    const handleReactivateSelected = useCallback(() => {
        if (selectedRows.size === 0) return

        const currentData = allData
        const selectedIndices = Array.from(selectedRows)
        const selectedKeys = new Set(selectedIndices.map(index => getRowIdentifier(currentData[index], index)).filter(Boolean))

        const markActive = (row: any, index?: number) => {
            const key = getRowIdentifier(row, index)
            return (key && selectedKeys.has(key)) ? { ...row, is_active: true, activo: true } : row
        }

        const rowsToReactivateRaw = selectedIndices.map(index => currentData[index])
        const rowsToReactivate = rowsToReactivateRaw.filter((item: any) => {
            if (!item || !item.isExisting || !item.id) return false
            if (activityId <= 0) return true
            const activityMap = item.activity_assignments || item.activity_map || item.activity_id
            return activityMap && typeof activityMap === 'object' && String(activityId) in activityMap
        })

        if (rowsToReactivate.length < rowsToReactivateRaw.length) {
            updateErrorState(`Se ignoraron algunos ejercicios porque ya no pertenecen a esta actividad.`)
        }

        if (rowsToReactivate.length === 0) {
            setSelectedRows(new Set())
            if (parentSetSelectedRows) parentSetSelectedRows(new Set())
            return
        }

        setCsvData((prev: any) => prev.map((row: any, idx: number) => markActive(row, idx)))
        setExistingData((prev: any) => prev.map((row: any, idx: number) => markActive(row, idx)))

        if (onItemsStatusChange) onItemsStatusChange(rowsToReactivate, 'reactivate')

        if (parentSetCsvData) {
            parentSetCsvData((parentCsvData || []).map((row: any, idx: number) => markActive(row, idx)))
        }

        setSelectedRows(new Set())
        if (parentSetSelectedRows) parentSetSelectedRows(new Set())
    }, [allData, selectedRows, activityId, setCsvData, setExistingData, onItemsStatusChange, parentSetCsvData, parentCsvData, setSelectedRows, parentSetSelectedRows, updateErrorState])

    const handleVideoSelection = useCallback(async (mediaUrl: string, _mediaType: string, mediaFile?: File, fileName?: string) => {
        const derivedBunnyId = extractBunnyVideoIdFromUrl(mediaUrl)
        const videoFile = mediaFile || null
        const resolvedName = fileName || (videoFile?.name ?? '').trim() || (derivedBunnyId ? `video_${derivedBunnyId.slice(0, 12)}.mp4` : '')

        if (videoFile) {
            const selectedIndices = Array.from(selectedRows)
            const currentData = csvData.length > 0 ? csvData : (parentCsvData || [])
            selectedIndices.forEach((idx) => {
                const exercise = currentData[idx]
                if (exercise && onVideoFileSelected) onVideoFileSelected(exercise, idx, videoFile)
            })
        }

        const applyVideo = (row: any) => ({
            ...row,
            video_url: mediaUrl,
            video_file_name: resolvedName,
            video_source: videoFile ? 'upload' : 'existing',
            bunny_video_id: derivedBunnyId || row.bunny_video_id || '',
            bunny_library_id: null,
            video_thumbnail_url: derivedBunnyId ? `${mediaUrl.split(derivedBunnyId)[0]}${derivedBunnyId}/thumbnail.jpg` : null
        })

        setCsvData((prev: any) => prev.map((row: any, idx: number) => selectedRows.has(idx) ? applyVideo(row) : row))
        if (parentSetCsvData) {
            parentSetCsvData((parentCsvData || []).map((row: any, idx: number) => selectedRows.has(idx) ? applyVideo(row) : row))
        }
        setExistingData((prev: any) => prev.map((row: any) => {
            const matchingIndex = Array.from(selectedRows).find(idx => {
                const selectedRow = allData[idx]
                return selectedRow && (String(selectedRow.id) === String(row.id) || selectedRow.tempRowId === row.tempRowId)
            })
            return matchingIndex !== undefined ? applyVideo(row) : row
        }))

        setSelectedRows(new Set())
        if (parentSetSelectedRows) parentSetSelectedRows(new Set())
    }, [selectedRows, csvData, parentCsvData, setCsvData, parentSetCsvData, setExistingData, onVideoFileSelected, parentSetSelectedRows, setSelectedRows, allData])

    const handleRemoveVideoFromManualForm = useCallback(() => {
        setManualForm((prev: any) => ({
            ...prev,
            video_url: '',
            video_file_name: '',
            bunny_video_id: '',
            bunny_library_id: '',
            video_thumbnail_url: ''
        }))
        setShowAssignedVideoPreview(false)

        if (editingExerciseIndex !== null) {
            const existingRow = allData[editingExerciseIndex]
            if (onVideoCleared) {
                onVideoCleared(editingExerciseIndex, existingRow, {
                    bunnyVideoId: existingRow?.bunny_video_id,
                    bunnyLibraryId: existingRow?.bunny_library_id,
                    videoUrl: existingRow?.video_url
                })
            }

            const applyClear = (row: any) => ({
                ...row,
                video_url: '',
                video_file_name: '',
                video_source: '',
                bunny_video_id: '',
                bunny_library_id: '',
                video_thumbnail_url: ''
            })

            setCsvData((prev: any) => prev.map((row: any, idx: number) => idx === editingExerciseIndex ? applyClear(row) : row))
            if (parentSetCsvData) {
                parentSetCsvData((parentCsvData || []).map((row: any, idx: number) => idx === editingExerciseIndex ? applyClear(row) : row))
            }
            setExistingData((prev: any) => prev.map((row: any) => (String(row.id) === String(existingRow.id) || row.tempRowId === existingRow.tempRowId) ? applyClear(row) : row))
        }
    }, [editingExerciseIndex, allData, setManualForm, setShowAssignedVideoPreview, onVideoCleared, setCsvData, parentSetCsvData, parentCsvData, setExistingData])

    const handleProcess = useCallback(async () => {
        if (!csvData.length) return
        if (!activityId || activityId <= 0) {
            updateErrorState('Primero guarda el programa para obtener un ID y poder guardar ejercicios.')
            return
        }

        setProcessing(true)
        updateErrorState(null)

        try {
            const response = await fetch('/api/process-csv-simple', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ csvData, activityId, coachId }),
            })

            const result = await response.json()
            if (!response.ok) throw new Error(result.error || 'Error al procesar el CSV')

            setResult(result)
            await loadExistingData()
            if (onSuccess) onSuccess()
        } catch (error) {
            updateErrorState(error instanceof Error ? error.message : 'Error desconocido')
        } finally {
            setProcessing(false)
        }
    }, [csvData, activityId, coachId, updateErrorState, setProcessing, setResult, loadExistingData, onSuccess])

    const handleReset = useCallback(async () => {
        justDeletedRef.current = true

        const allCurrentData = [...csvData, ...(parentCsvData || [])]
        const idsToDelete = allCurrentData.filter(item => !item.isExisting && item.id).map(item => item.id)

        if (idsToDelete.length > 0 && (activityId >= 0)) {
            try {
                const endpoint = productCategory === 'nutricion' ? '/api/delete-nutrition-items' : '/api/delete-exercise-items'
                const response = await fetch(endpoint, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ids: idsToDelete, activityId })
                })

                if (!response.ok) {
                    const errorData = await response.json()
                    updateErrorState(`Error al eliminar filas: ${errorData.error}`)
                    justDeletedRef.current = false
                }
            } catch (error) {
                updateErrorState('Error al eliminar filas de la base de datos')
                justDeletedRef.current = false
            }
        }

        setFile(null)
        setUploadedFiles((prev: any) => [])
        updateErrorState(null)
        setResult(null)
        setSelectedRows(new Set())
        if (fileInputRef.current) fileInputRef.current.value = ''

        const onlyExistingData = existingData.filter(item => item.isExisting)
        setCsvData(onlyExistingData)

        if (parentSetCsvData) {
            const parentOnlyExisting = (parentCsvData || []).filter((item: any) => item.isExisting)
            parentSetCsvData(parentOnlyExisting)
            if (activityId > 0) {
                sessionStorage.setItem(`activities_draft_${activityId}`, JSON.stringify(parentOnlyExisting))
                sessionStorage.setItem(`activities_draft_${activityId}_interacted`, 'true')
                hasUserInteractedRef.current = true
            }
        }

        if (parentSetSelectedRows) parentSetSelectedRows(new Set())
        if (onRemoveCSV) onRemoveCSV()
        setLimitWarning(null)
        justDeletedRef.current = true
    }, [
        csvData,
        parentCsvData,
        activityId,
        productCategory,
        setFile,
        setUploadedFiles,
        updateErrorState,
        setResult,
        setSelectedRows,
        fileInputRef,
        existingData,
        setCsvData,
        parentSetCsvData,
        parentSetSelectedRows,
        onRemoveCSV,
        setLimitWarning,
        justDeletedRef,
        hasUserInteractedRef
    ])

    return {
        handleRowSelection,
        handleEditExercise,
        cancelEdit,
        handleDeleteSelected,
        handleRemoveSelected,
        handleReactivateSelected,
        handleVideoSelection,
        handleRemoveVideoFromManualForm,
        handleProcess,
        handleReset,
        addManualExercise
    }
}
