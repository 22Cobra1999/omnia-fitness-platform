import { useState, useRef } from "react"
import { ManualFormState } from "../types"

export function useCsvState(parentSelectedRows?: Set<number>) {
    const [file, setFile] = useState<File | null>(null)
    const [csvData, setCsvData] = useState<any[]>([])
    const [existingData, setExistingData] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [processing, setProcessing] = useState(false)
    const [loadingExisting, setLoadingExisting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [invalidRows, setInvalidRows] = useState<string[]>([])
    const [result, setResult] = useState<any>(null)
    const [selectedRows, setSelectedRows] = useState<Set<number>>(parentSelectedRows || new Set())
    const [limitWarning, setLimitWarning] = useState<string | null>(null)

    const [exerciseUsage, setExerciseUsage] = useState<Record<number, { activities: Array<{ id: number; name: string }> }>>({})
    const [activityNamesMap, setActivityNamesMap] = useState<Record<number, string>>({})
    const [activityImagesMap, setActivityImagesMap] = useState<Record<number, string | null>>({})

    const [showVideoModal, setShowVideoModal] = useState(false)
    const [showMediaSourceModal, setShowMediaSourceModal] = useState(false)
    const [showRulesPanel, setShowRulesPanel] = useState(false)
    const [rulesCount, setRulesCount] = useState(0)
    const [uploadedFiles, setUploadedFiles] = useState<Array<{ name: string, timestamp: number }>>([])
    const [mode, setMode] = useState<'manual' | 'csv' | 'existentes'>('existentes')
    const [editingExerciseIndex, setEditingExerciseIndex] = useState<number | null>(null)
    const [currentPage, setCurrentPage] = useState(1)

    const [recipeSteps, setRecipeSteps] = useState<string[]>([])
    const [bodyParts, setBodyParts] = useState<string[]>([])
    const [equipoList, setEquipoList] = useState<string[]>([])
    const [seriesList, setSeriesList] = useState<any[]>([])
    const [showAssignedVideoPreview, setShowAssignedVideoPreview] = useState(false)

    const [manualForm, setManualForm] = useState<ManualFormState>({
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
    })

    return {
        file, setFile,
        csvData, setCsvData,
        existingData, setExistingData,
        loading, setLoading,
        processing, setProcessing,
        loadingExisting, setLoadingExisting,
        error, setError,
        invalidRows, setInvalidRows,
        result, setResult,
        selectedRows, setSelectedRows,
        limitWarning, setLimitWarning,
        exerciseUsage, setExerciseUsage,
        activityNamesMap, setActivityNamesMap,
        activityImagesMap, setActivityImagesMap,
        showVideoModal, setShowVideoModal,
        showMediaSourceModal, setShowMediaSourceModal,
        showRulesPanel, setShowRulesPanel,
        rulesCount, setRulesCount,
        uploadedFiles, setUploadedFiles,
        mode, setMode,
        editingExerciseIndex, setEditingExerciseIndex,
        currentPage, setCurrentPage,
        recipeSteps, setRecipeSteps,
        bodyParts, setBodyParts,
        equipoList, setEquipoList,
        seriesList, setSeriesList,
        showAssignedVideoPreview, setShowAssignedVideoPreview,
        manualForm, setManualForm
    }
}
