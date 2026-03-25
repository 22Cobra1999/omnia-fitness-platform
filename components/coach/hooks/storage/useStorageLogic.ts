import { useState, useEffect, useMemo, useCallback } from 'react'
import { useAuth } from '@/contexts/auth-context'

export interface StorageUsageData {
    total: number
    breakdown: {
        video: number
        image: number
        pdf: number
    }
    activityUsage: {
        video: number[]
        image: number[]
        pdf: number[]
    }
}

export interface StorageFile {
    fileId: string
    fileName: string
    concept: 'video' | 'image' | 'pdf'
    sizeBytes: number
    sizeGB: number
    usesCount: number
    activities: Array<{ id: number, name: string }>
    url?: string // URL pública del archivo
    libraryId?: string // Bunny Library ID
}

export type ViewMode = 'activity' | 'usage'
export type PlanType = 'free' | 'basico' | 'black' | 'premium'

export const PLAN_STORAGE_LIMITS: Record<PlanType, number> = {
    free: 1,      // Free/Inicial: 1 GB
    basico: 5,    // Básico: 5 GB
    black: 25,    // Black: 25 GB
    premium: 100  // Premium: 100 GB
}

const DEFAULT_PLAN: PlanType = 'free'

export function useStorageLogic(planProp?: PlanType) {
    const { user, loading: authLoading } = useAuth()

    // -- State --
    const [storageData, setStorageData] = useState<StorageUsageData | null>(null)
    const [storageFiles, setStorageFiles] = useState<StorageFile[]>([])
    const [calculatedTotal, setCalculatedTotal] = useState(0)
    const [loading, setLoading] = useState(false)
    const [loadingFiles, setLoadingFiles] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // UI State
    const [expanded, setExpanded] = useState(false)
    const [collapsed, setCollapsed] = useState(true)
    const [viewMode, setViewMode] = useState<ViewMode>('usage')
    const [conceptFilter, setConceptFilter] = useState<'all' | 'image' | 'video' | 'pdf'>('all')
    const [currentPlan, setCurrentPlan] = useState<PlanType | null>(null)

    // Handlers State
    const [fileToDelete, setFileToDelete] = useState<StorageFile | null>(null)
    const [showDeleteWarning, setShowDeleteWarning] = useState(false)
    const [editingFileName, setEditingFileName] = useState<string | null>(null)
    const [newFileName, setNewFileName] = useState<string>('')
    const [viewingFile, setViewingFile] = useState<StorageFile | null>(null)
    const [showReplaceChoice, setShowReplaceChoice] = useState(false)
    const [fileToReplace, setFileToReplace] = useState<StorageFile | null>(null)
    const [showGallery, setShowGallery] = useState(false)

    // -- Plan Loading --
    useEffect(() => {
        if (authLoading || !user) return

        if (!planProp) {
            fetch('/api/coach/plan', { credentials: 'include' })
                .then(res => {
                    if (!res.ok) { return { success: false } }
                    return res.json()
                })
                .then(result => {
                    if (result.success && result.plan) {
                        setCurrentPlan(result.plan.plan_type)
                    } else {
                        setCurrentPlan(DEFAULT_PLAN)
                    }
                })
                .catch((err) => {
                    console.error('Error cargando plan:', err)
                    setCurrentPlan(DEFAULT_PLAN)
                })
        } else {
            setCurrentPlan(planProp)
        }
    }, [planProp, authLoading, user])

    const planType = currentPlan || planProp || DEFAULT_PLAN
    const storageLimitGB = PLAN_STORAGE_LIMITS[planType] || PLAN_STORAGE_LIMITS[DEFAULT_PLAN]

    // -- Data Fetching --
    const loadStorageUsage = useCallback(async () => {
        setLoading(true)
        setError(null)
        console.log('📡 [useStorageLogic] Iniciando carga de storage usage...')

        try {
            const usageResponse = await fetch('/api/coach/storage-usage', { credentials: 'include' })

            if (!usageResponse.ok) {
                console.error(`❌ [useStorageLogic] Error en API usage: ${usageResponse.status}`)
                throw new Error(`HTTP error! status: ${usageResponse.status}`)
            }

            const usageResult = await usageResponse.json()
            console.log('📊 [useStorageLogic] Resultado de usage:', usageResult)

            if (usageResult.success && usageResult.storage) {
                console.log(`✅ [useStorageLogic] Storage data cargado: ${usageResult.storage.total} GB TOTAL`)
                setStorageData(usageResult.storage)
            } else {
                console.warn('⚠️ [useStorageLogic] Resultado success false o sin data:', usageResult)
                setError(usageResult.error || 'Error al cargar datos de almacenamiento')
                setStorageData(null)
            }

            // Cargar archivos detallados
            setLoadingFiles(true)
            console.log('📡 [useStorageLogic] Iniciando carga de storage-files...')
            try {
                const filesRes = await fetch('/api/coach/storage-files', { credentials: 'include' })
                if (filesRes.ok) {
                    const filesJson = await filesRes.json()
                    console.log(`📂 [useStorageLogic] ${filesJson.files?.length || 0} archivos cargados`)
                    if (filesJson.debug) {
                        console.log('🔍 [useStorageLogic] Debug Info de Bunny:', filesJson.debug)
                    }
                    if (filesJson.success && Array.isArray(filesJson.files)) {
                        setStorageFiles(filesJson.files as StorageFile[])
                    } else {
                        setStorageFiles([])
                    }
                } else {
                    console.error('❌ [useStorageLogic] Error en API files:', filesRes.status)
                    setStorageFiles([])
                }
            } catch (filesErr) {
                console.error('❌ [useStorageLogic] Error cargando archivos detallados:', filesErr)
            } finally {
                setLoadingFiles(false)
            }
        } catch (err) {
            console.error('❌ [useStorageLogic] Error fatal en loadStorageUsage:', err)
            setError(err instanceof Error ? err.message : 'Error de conexión')
            setStorageData(null)
        } finally {
            setLoading(false)
        }
    }, [user])

    useEffect(() => {
        if (storageFiles.length > 0) {
            const total = storageFiles.reduce((acc, f) => acc + (f.sizeGB || 0), 0)
            setCalculatedTotal(total)
        }
    }, [storageFiles])

    useEffect(() => {
        if (authLoading || !user) return
        loadStorageUsage()
    }, [authLoading, user, loadStorageUsage])

    // -- Computed Properties logic --
    const usedGB = calculatedTotal || storageData?.total || 0

    const activityViewData = useMemo(() => {
        const activityMap = new Map<number, { name: string, files: StorageFile[], totalGB: number }>()
        const filteredFiles = storageFiles.filter((file) => conceptFilter === 'all' || file.concept === conceptFilter)

        filteredFiles.forEach((file: StorageFile) => {
            file.activities.forEach((act: { id: number, name: string }) => {
                if (!activityMap.has(act.id)) {
                    activityMap.set(act.id, { name: act.name, files: [], totalGB: 0 })
                }
                const activity = activityMap.get(act.id)!
                activity.files.push(file)
                activity.totalGB += file.sizeGB
            })
        })

        return Array.from(activityMap.entries())
            .map(([id, data]) => ({ id, ...data }))
            .sort((a, b) => b.totalGB - a.totalGB)
    }, [storageFiles, conceptFilter])

    const usageViewData = useMemo(() => {
        const filteredFiles = storageFiles.filter((file: StorageFile) => conceptFilter === 'all' || file.concept === conceptFilter)
        return filteredFiles
            .map((file: StorageFile) => ({
                ...file,
                totalUsageGB: file.sizeGB * file.usesCount
            }))
            .sort((a, b) => b.totalUsageGB - a.totalUsageGB)
    }, [storageFiles, conceptFilter])

    // -- Actions --

    const handleDeleteFile = (file: StorageFile) => {
        setFileToDelete(file)
        setShowDeleteWarning(true)
    }

    const confirmDelete = async () => {
        if (!fileToDelete) return

        try {
            let endpoint = ''
            let body: any = {}

            if (fileToDelete.concept === 'video') {
                endpoint = '/api/bunny/delete-video'
                body = { videoId: fileToDelete.fileId }
            } else if (fileToDelete.concept === 'image' || fileToDelete.concept === 'pdf') {
                endpoint = '/api/storage/delete-file'
                body = {
                    fileName: fileToDelete.fileName,
                    concept: fileToDelete.concept,
                    activityIds: fileToDelete.activities.map(a => a.id)
                }
            }

            if (!endpoint) return

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(body)
            })

            const result = await response.json()

            if (response.ok && result.success) {
                setStorageFiles((prev) => prev.filter((f) => f.fileId !== fileToDelete.fileId))
                await loadStorageUsage()
                setShowDeleteWarning(false)
                setFileToDelete(null)
            } else {
                alert(result.error || 'Error al eliminar el archivo')
            }
        } catch (error) {
            console.error('Error eliminando archivo:', error)
            alert('Error al eliminar el archivo')
        }
    }

    const handleEditFileName = (file: StorageFile) => {
        setEditingFileName(file.fileId)
        setNewFileName(file.fileName)
    }

    const handleSaveFileName = async (file: StorageFile) => {
        if (!newFileName.trim()) return
        try {
            const response = await fetch('/api/storage/update-file-name', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    fileId: file.fileId,
                    fileName: newFileName.trim(),
                    concept: file.concept,
                }),
            })

            const result = await response.json()
            if (result.success) {
                setStorageFiles(prev =>
                    prev.map(f => (f.fileId === file.fileId || (f.concept === file.concept && f.fileName === file.fileName))
                        ? { ...f, fileName: newFileName.trim() }
                        : f
                    )
                )
                setEditingFileName(null)
                setNewFileName('')
            } else {
                alert(result.error || 'Error al actualizar el nombre')
            }
        } catch (error) {
            console.error('Error actualizando nombre:', error)
        }
    }

    const handleViewFile = (file: StorageFile) => {
        setViewingFile(file)
    }

    const handleReplaceFile = (file: StorageFile) => {
        setFileToReplace(file)
        setShowReplaceChoice(true)
    }

    const performReplace = async (file: StorageFile, newFile: File) => {
        try {
            setLoading(true)
            const formData = new FormData()
            formData.append('file', newFile)
            formData.append('oldFileId', file.fileId)
            formData.append('concept', file.concept)
            formData.append('oldFileName', file.fileName)

            const res = await fetch('/api/storage/replace-file', {
                method: 'POST',
                body: formData,
            })

            const result = await res.json()
            if (result.success) {
                alert(`Archivo reemplazado correctamente: ${result.message}`)
                await loadStorageUsage()
                setShowReplaceChoice(false)
                setFileToReplace(null)
            } else {
                alert(result.error || 'Error al reemplazar el archivo')
            }
        } catch (error) {
            console.error('Error reemplazando archivo:', error)
        } finally {
            setLoading(false)
        }
    }

    const performReplaceWithExisting = async (file: StorageFile, existingFile: StorageFile) => {
        try {
            setLoading(true)
            const response = await fetch('/api/storage/replace-with-existing', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    oldFileId: file.fileId,
                    newFileId: existingFile.fileId,
                    concept: file.concept,
                    oldFileName: file.fileName,
                    newFileName: existingFile.fileName
                })
            })

            const result = await response.json()
            if (result.success) {
                alert('Archivo actualizado con uno de la galería')
                await loadStorageUsage()
                setShowReplaceChoice(false)
                setShowGallery(false)
                setFileToReplace(null)
            } else {
                alert(result.error || 'Error al actualizar desde galería')
            }
        } catch (error) {
            console.error('Error reemplazando con existente:', error)
        } finally {
            setLoading(false)
        }
    }

    const confirmReplaceWithUpload = (newFile: File) => {
        if (!fileToReplace) return
        performReplace(fileToReplace, newFile)
    }

    return {
        state: {
            storageData,
            storageFiles,
            calculatedTotal,
            loading,
            loadingFiles,
            error,
            expanded,
            collapsed,
            viewMode,
            conceptFilter,
            currentPlan,
            fileToDelete,
            showDeleteWarning,
            editingFileName,
            newFileName,
            viewingFile,
            storageLimitGB,
            usedGB,
            activityViewData,
            usageViewData,
            showReplaceChoice,
            fileToReplace,
            showGallery
        },
        actions: {
            loadStorageUsage,
            setExpanded,
            setCollapsed,
            setViewMode,
            setConceptFilter,
            setShowDeleteWarning,
            setFileToDelete,
            setEditingFileName,
            setNewFileName,
            setViewingFile,
            handleDeleteFile,
            confirmDelete,
            handleEditFileName,
            handleSaveFileName,
            handleViewFile,
            handleReplaceFile,
            setShowReplaceChoice,
            setFileToReplace,
            setShowGallery,
            confirmReplaceWithUpload,
            confirmReplaceWithGalleryFile: (existing: StorageFile) => {
                if (!fileToReplace) return
                performReplaceWithExisting(fileToReplace, existing)
            }
        }
    }
}
