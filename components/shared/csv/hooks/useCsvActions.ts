import { useCallback, useMemo } from 'react'
import { ManualFormState } from '../types'
import { useCsvSelection } from './useCsvSelection'
import { useCsvVideoDomain } from './useCsvVideoDomain'
import { useCsvPersistence } from './useCsvPersistence'
import { useCsvExerciseDomain } from './useCsvExerciseDomain'
import { useCsvNutritionDomain } from './useCsvNutritionDomain'

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

export function useCsvActions(props: UseCsvActionsProps) {
    const {
        setEditingExerciseIndex,
        setMode,
        setShowAssignedVideoPreview,
        setRecipeSteps,
        setManualForm,
        setBodyParts,
        setEquipoList,
        setSeriesList,
        productCategory
    } = props

    const selection = useCsvSelection({
        selectedRows: props.selectedRows,
        setSelectedRows: props.setSelectedRows,
        parentSetSelectedRows: props.parentSetSelectedRows
    })

    const video = useCsvVideoDomain({
        selectedRows: props.selectedRows,
        setSelectedRows: props.setSelectedRows,
        parentSetSelectedRows: props.parentSetSelectedRows,
        csvData: props.csvData,
        setCsvData: props.setCsvData,
        parentCsvData: props.parentCsvData,
        parentSetCsvData: props.parentSetCsvData,
        existingData: props.existingData,
        setExistingData: props.setExistingData,
        allData: props.allData,
        onVideoFileSelected: props.onVideoFileSelected,
        onVideoCleared: props.onVideoCleared,
        setManualForm: props.setManualForm,
        setShowAssignedVideoPreview: props.setShowAssignedVideoPreview,
        editingExerciseIndex: props.editingExerciseIndex
    })

    const persistence = useCsvPersistence({
        activityId: props.activityId,
        coachId: props.coachId,
        productCategory: props.productCategory,
        csvData: props.csvData,
        setCsvData: props.setCsvData,
        existingData: props.existingData,
        setExistingData: props.setExistingData,
        parentCsvData: props.parentCsvData,
        parentSetCsvData: props.parentSetCsvData,
        selectedRows: props.selectedRows,
        setSelectedRows: props.setSelectedRows,
        parentSetSelectedRows: props.parentSetSelectedRows,
        onItemsStatusChange: props.onItemsStatusChange,
        onSuccess: props.onSuccess,
        onRemoveCSV: props.onRemoveCSV,
        updateErrorState: props.updateErrorState,
        setProcessing: props.setProcessing,
        setResult: props.setResult,
        loadExistingData: props.loadExistingData,
        justDeletedRef: props.justDeletedRef,
        hasUserInteractedRef: props.hasUserInteractedRef,
        fileInputRef: props.fileInputRef,
        setFile: props.setFile,
        setUploadedFiles: props.setUploadedFiles,
        setLimitWarning: props.setLimitWarning,
        allData: props.allData
    })

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

    const exerciseDomain = useCsvExerciseDomain({
        productCategory: props.productCategory,
        allData: props.allData,
        manualForm: props.manualForm,
        setManualForm: props.setManualForm,
        setMode: props.setMode,
        setEditingExerciseIndex: props.setEditingExerciseIndex,
        setRecipeSteps: props.setRecipeSteps,
        setBodyParts: props.setBodyParts,
        setEquipoList: props.setEquipoList,
        setSeriesList: props.setSeriesList,
        updateErrorState: props.updateErrorState,
        seriesList: props.seriesList,
        bodyParts: props.bodyParts,
        equipoList: props.equipoList,
        editingExerciseIndex: props.editingExerciseIndex,
        evaluateAvailableSlots: props.evaluateAvailableSlots,
        setLimitWarning: props.setLimitWarning,
        planLimits: props.planLimits,
        clearLimitWarningIfNeeded: props.clearLimitWarningIfNeeded,
        setCsvData: props.setCsvData,
        parentSetCsvData: props.parentSetCsvData,
        parentCsvData: props.parentCsvData,
        cancelEdit
    })

    const nutritionDomain = useCsvNutritionDomain({
        allData: props.allData,
        manualForm: props.manualForm,
        setManualForm: props.setManualForm,
        setMode: props.setMode,
        setEditingExerciseIndex: props.setEditingExerciseIndex,
        setRecipeSteps: props.setRecipeSteps,
        updateErrorState: props.updateErrorState,
        editingExerciseIndex: props.editingExerciseIndex,
        evaluateAvailableSlots: props.evaluateAvailableSlots,
        setLimitWarning: props.setLimitWarning,
        planLimits: props.planLimits,
        clearLimitWarningIfNeeded: props.clearLimitWarningIfNeeded,
        setCsvData: props.setCsvData,
        parentSetCsvData: props.parentSetCsvData,
        parentCsvData: props.parentCsvData,
        cancelEdit
    })

    const domainActions = useMemo(() => {
        if (productCategory === 'nutricion') {
            return {
                handleEditExercise: nutritionDomain.handleEditExercise,
                addManualExercise: nutritionDomain.addManualExercise
            }
        }
        return {
            handleEditExercise: exerciseDomain.handleEditExercise,
            addManualExercise: exerciseDomain.addManualExercise
        }
    }, [productCategory, nutritionDomain, exerciseDomain])

    return {
        handleRowSelection: selection.handleRowSelection,
        handleEditExercise: domainActions.handleEditExercise,
        cancelEdit,
        handleDeleteSelected: persistence.handleDeleteSelected,
        handleRemoveSelected: persistence.handleRemoveSelected,
        handleReactivateSelected: persistence.handleReactivateSelected,
        handleVideoSelection: video.handleVideoSelection,
        handleRemoveVideoFromManualForm: video.handleRemoveVideoFromManualForm,
        handleProcess: persistence.handleProcess,
        handleReset: persistence.handleReset,
        addManualExercise: domainActions.addManualExercise
    }
}
