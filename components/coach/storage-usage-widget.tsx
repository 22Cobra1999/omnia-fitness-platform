'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/auth-context'
import { 
  RefreshCw,
  Layers,
  FileCheck,
  ChevronDown,
  ChevronUp,
  Film,
  Image as ImageIcon,
  FileText,
  Video,
  Image,
  File as FileIcon,
  Edit,
  Trash2,
  Plus,
  X,
  AlertTriangle,
  Save,
  Eye
} from 'lucide-react'
import { UniversalVideoPlayer } from '@/components/shared/video/universal-video-player'

interface StorageUsageData {
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

interface StorageFile {
  fileId: string
  fileName: string
  concept: 'video' | 'image' | 'pdf'
  sizeBytes: number
  sizeGB: number
  usesCount: number
  activities: Array<{ id: number, name: string }>
  url?: string // URL pública del archivo
}

type ViewMode = 'activity' | 'usage'

// Planes y sus límites de almacenamiento
export type PlanType = 'free' | 'basico' | 'black' | 'premium'

export const PLAN_STORAGE_LIMITS: Record<PlanType, number> = {
  free: 1,      // Free/Inicial: 1 GB
  basico: 5,    // Básico: 5 GB
  black: 25,    // Black: 25 GB
  premium: 100  // Premium: 100 GB
}

// Por defecto usar plan Free
const DEFAULT_PLAN: PlanType = 'free'

interface StorageUsageWidgetProps {
  plan?: PlanType // Plan del coach, por defecto 'free'
}

export function StorageUsageWidget(props: StorageUsageWidgetProps = {}) {
  const { plan: planProp } = props
  const { user } = useAuth()
  const [storageData, setStorageData] = useState<StorageUsageData | null>(null)
  const [storageFiles, setStorageFiles] = useState<StorageFile[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingFiles, setLoadingFiles] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)
  const [collapsed, setCollapsed] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>('usage')
  const [conceptFilter, setConceptFilter] = useState<'all' | 'image' | 'video' | 'pdf'>('all')
  const [currentPlan, setCurrentPlan] = useState<PlanType | null>(null)
  const [editing, setEditing] = useState(true) // Siempre en modo edición
  const [fileToDelete, setFileToDelete] = useState<StorageFile | null>(null)
  const [showDeleteWarning, setShowDeleteWarning] = useState(false)
  const [editingFileName, setEditingFileName] = useState<string | null>(null)
  const [newFileName, setNewFileName] = useState<string>('')
  const [viewingFile, setViewingFile] = useState<StorageFile | null>(null)
  
  // Obtener el plan desde la API si no se proporciona como prop
  useEffect(() => {
    if (!planProp) {
      fetch('/api/coach/plan', {
        credentials: 'include'
      })
        .then(res => {
          if (!res.ok) {
            console.warn(`Error obteniendo plan: ${res.status}`)
            return { success: false }
          }
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
  }, [planProp])
  
  // Obtener límite de almacenamiento según el plan
  const planType = currentPlan || planProp || DEFAULT_PLAN
  const storageLimitGB = PLAN_STORAGE_LIMITS[planType] || PLAN_STORAGE_LIMITS[DEFAULT_PLAN]

  const loadStorageUsage = async () => {
    setLoading(true)
    setError(null)

    console.log('[storage-widget] loadStorageUsage start', {
      hasUser: !!user,
      userId: (user as any)?.id || null,
      planProp: planProp || null,
      currentPlan: currentPlan || null,
      planType,
      conceptFilter,
      viewMode,
    })
    
    try {
      const usageResponse = await fetch('/api/coach/storage-usage', { credentials: 'include' })
      
      if (!usageResponse.ok) {
        console.warn('[storage-widget] storage-usage non-ok', {
          status: usageResponse.status,
          statusText: usageResponse.statusText
        })
        throw new Error(`HTTP error! status: ${usageResponse.status}`)
      }
      
      const usageResult = await usageResponse.json()

      console.log('[storage-widget] storage-usage response', {
        success: usageResult?.success,
        hasStorage: !!usageResult?.storage,
        error: usageResult?.error,
        total: usageResult?.storage?.total,
        breakdown: usageResult?.storage?.breakdown
      })
      
      if (usageResult.success && usageResult.storage) {
        setStorageData(usageResult.storage)
      } else {
        console.error('Error en respuesta de storage-usage:', usageResult)
        setError(usageResult.error || 'Error al cargar datos de almacenamiento')
        // Aún así, establecer storageData como null para mostrar el estado correcto
        setStorageData(null)
      }

      // Cargar archivos detallados para las vistas (no bloquea el renderizado principal)
      setLoadingFiles(true)
      try {
        const filesRes = await fetch('/api/coach/storage-files', { credentials: 'include' })
        if (filesRes.ok) {
          const filesJson = await filesRes.json()
          if (filesJson.success && Array.isArray(filesJson.files)) {
            const files = filesJson.files as StorageFile[]
            const counts = files.reduce(
              (acc: Record<string, number>, f: StorageFile) => {
                acc[f.concept] = (acc[f.concept] || 0) + 1
                return acc
              },
              {}
            )

            console.log('[storage-widget] storage-files response', {
              success: filesJson.success,
              total: files.length,
              counts,
              sample: files.slice(0, 12).map((f) => ({
                concept: f.concept,
                fileId: f.fileId,
                fileName: f.fileName,
                usesCount: f.usesCount,
                activitiesCount: f.activities?.length || 0,
                url: f.url || null
              }))
            })

            setStorageFiles(filesJson.files as StorageFile[])
          } else {
            console.warn('[storage-widget] storage-files invalid payload', filesJson)
            setStorageFiles([])
          }
        } else {
          let body: any = null
          try {
            body = await filesRes.text()
          } catch {
            body = null
          }
          console.warn('[storage-widget] storage-files non-ok', {
            status: filesRes.status,
            statusText: filesRes.statusText,
            body
          })
          setStorageFiles([])
        }
      } catch (filesErr) {
        console.error('Error cargando archivos detallados:', filesErr)
        // No establecer error aquí, es opcional
      } finally {
        setLoadingFiles(false)
      }
    } catch (err) {
      console.error('Error cargando storage usage:', err)
      setError(err instanceof Error ? err.message : 'Error de conexión')
      setStorageData(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStorageUsage()
  }, [])

  const formatMB = (gb: number) => {
    const mb = gb * 1024
    if (mb < 1) return `${(mb * 1024).toFixed(0)} KB`
    return `${mb.toFixed(1)} MB`
  }

  const formatGB = (gb: number) => {
    if (gb < 0.001) return '0 GB'
    return `${gb.toFixed(2)} GB`
  }

  const handleDeleteFile = async (file: StorageFile) => {
    // Si el archivo está siendo usado en actividades, mostrar advertencia
    if (file.activities.length > 0) {
      setFileToDelete(file)
      setShowDeleteWarning(true)
      return
    }
    
    // Si no está en uso, eliminar directamente
    await deleteFile(file)
  }

  const deleteFile = async (file: StorageFile) => {
    try {
      let endpoint = ''
      let body: any = {}

      if (file.concept === 'video') {
        // Extraer videoId del fileId (formato: video-{activityId}-{idx} o bunny_video_id)
        const videoIdMatch = file.fileId.match(/^([a-zA-Z0-9-]+)$/)
        if (!videoIdMatch) {
          alert('No se pudo identificar el video para eliminar')
          return
        }
        endpoint = '/api/bunny/delete-video'
        body = { videoId: file.fileId }
      } else if (file.concept === 'image' || file.concept === 'pdf') {
        // Para imágenes y PDFs, necesitamos el nombre real del archivo
        // El fileName puede ser sintético, necesitamos extraer el nombre real
        endpoint = '/api/storage/delete-file'
        body = { 
          fileName: file.fileName,
          concept: file.concept,
          activityIds: file.activities.map(a => a.id)
        }
      }

      if (!endpoint) {
        console.error('Tipo de archivo no soportado para eliminación')
        return
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body)
      })

      const result = await response.json()

      if (response.ok && result.success) {
        // Remover localmente para UX inmediata (la API ya limpió BD best-effort)
        setStorageFiles((prev) => prev.filter((f) => f.fileId !== file.fileId))
        // Recargar datos
        await loadStorageUsage()
        setShowDeleteWarning(false)
        setFileToDelete(null)
      } else {
        console.error('Error eliminando archivo:', result.error)
        alert(result.error || 'Error al eliminar el archivo')
      }
    } catch (error) {
      console.error('Error eliminando archivo:', error)
      alert('Error al eliminar el archivo')
    }
  }

  const confirmDelete = async () => {
    if (fileToDelete) {
      await deleteFile(fileToDelete)
    }
  }

  const handleEditFileName = (file: StorageFile) => {
    setEditingFileName(file.fileId)
    setNewFileName(file.fileName)
  }

  const handleSaveFileName = async (file: StorageFile) => {
    if (!newFileName.trim()) {
      alert('El nombre no puede estar vacío')
      return
    }

    try {
      // Llamar al endpoint para actualizar en la BD
      console.log('[storage-widget] Guardando nombre:', { fileId: file.fileId, fileName: newFileName.trim(), concept: file.concept })
      
      const response = await fetch('/api/storage/update-file-name', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          fileId: file.fileId,
          fileName: newFileName.trim(),
          concept: file.concept,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('[storage-widget] Error response:', response.status, errorText)
        let errorData
        try {
          errorData = JSON.parse(errorText)
        } catch {
          errorData = { error: errorText || `Error ${response.status}` }
        }
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      console.log('[storage-widget] Respuesta del servidor:', result)

      if (!result.success) {
        throw new Error(result.error || 'Error al actualizar el nombre')
      }

      // Actualizar localmente solo si la actualización fue exitosa
      const updatedFiles = storageFiles.map(f => 
        f.fileId === file.fileId 
          ? { ...f, fileName: newFileName.trim() }
          : f
      )
      setStorageFiles(updatedFiles)
      setEditingFileName(null)
      setNewFileName('')
      
      // Recargar los datos para asegurar consistencia con la BD
      await loadStorageUsage()
    } catch (error) {
      console.error('Error actualizando nombre:', error)
      alert(error instanceof Error ? error.message : 'Error al actualizar el nombre del archivo')
    }
  }

  const handleViewFile = (file: StorageFile) => {
    setViewingFile(file)
  }

  // Agrupar por actividad
  const getActivityView = () => {
    const activityMap = new Map<number, { name: string, files: StorageFile[], totalGB: number }>()
    
    const filteredFiles = storageFiles.filter((file) => conceptFilter === 'all' || file.concept === conceptFilter)

    filteredFiles.forEach(file => {
      file.activities.forEach(act => {
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
  }

  // Calcular uso total por archivo (tamaño * usos)
  const getUsageView = () => {
    const filteredFiles = storageFiles.filter((file) => conceptFilter === 'all' || file.concept === conceptFilter)
    return filteredFiles
      .map(file => ({
        ...file,
        totalUsageGB: file.sizeGB * file.usesCount
      }))
      .sort((a, b) => b.totalUsageGB - a.totalUsageGB)
  }

  const usedGB = storageData?.total || 0
  const remainingGB = Math.max(0, storageLimitGB - usedGB)
  
  // Calcular porcentajes basados en el límite total del plan
  const videoGB = storageData?.breakdown.video || 0
  const imageGB = storageData?.breakdown.image || 0
  const pdfGB = storageData?.breakdown.pdf || 0
  
  const videoPercent = storageLimitGB > 0 ? (videoGB / storageLimitGB) * 100 : 0
  const imagePercent = storageLimitGB > 0 ? (imageGB / storageLimitGB) * 100 : 0
  const pdfPercent = storageLimitGB > 0 ? (pdfGB / storageLimitGB) * 100 : 0
  const availablePercent = storageLimitGB > 0 ? (remainingGB / storageLimitGB) * 100 : 100

  return (
    <div className="bg-black p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-300">Almacenamiento</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={loadStorageUsage}
          disabled={loading}
          className="text-gray-400 hover:text-white h-6 w-6 p-0"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {error ? (
        <div className="text-red-500 text-xs text-center py-2">
          {error}
        </div>
      ) : loading && !storageData ? (
        <div className="flex justify-center items-center py-4">
          <RefreshCw className="w-6 h-6 animate-spin text-[#FF7939]" />
        </div>
      ) : storageData ? (
        <>
          {/* Barra con Videos, Imágenes, PDFs y Disponible */}
          <div className="relative h-8 rounded-xl overflow-hidden border-2 border-gray-700 bg-gray-600 shadow-inner mb-4">
            <div className="flex h-full items-center">
              {/* Videos - Naranja más oscuro #FF6B35 */}
              {videoPercent > 0 && (
                <div 
                  className="bg-[#FF6B35] h-full transition-all"
                  style={{ width: `${videoPercent}%`, minWidth: videoPercent > 0.5 ? '4px' : '0px' }}
                  title={`Videos: ${formatMB(videoGB)}`}
                />
              )}
              
              {/* Imágenes - Naranja semi claro #FF9F5A */}
              {imagePercent > 0 && (
                <div 
                  className="bg-[#FF9F5A] h-full transition-all"
                  style={{ width: `${imagePercent}%`, minWidth: imagePercent > 0.5 ? '4px' : '0px' }}
                  title={`Imágenes: ${formatMB(imageGB)}`}
                />
              )}
              
              {/* PDFs - Naranja muy claro #FFC999 */}
              {pdfPercent > 0 && (
                <div 
                  className="bg-[#FFC999] h-full transition-all"
                  style={{ width: `${pdfPercent}%`, minWidth: pdfPercent > 0.5 ? '4px' : '0px' }}
                  title={`PDFs: ${formatMB(pdfGB)}`}
                />
              )}
              
              {/* Disponible - Gris */}
              {availablePercent > 0 && (
                <div 
                  className="bg-gray-600 h-full transition-all"
                  style={{ width: `${availablePercent}%`, minWidth: availablePercent > 0.5 ? '4px' : '0px' }}
                  title={`Disponible: ${formatGB(remainingGB)}`}
                />
              )}
            </div>
          </div>

          {/* Leyenda de colores - Video naranja oscuro, Imagen naranja semi claro, PDF naranja claro */}
          <div className="flex items-center justify-center gap-4 mb-3 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-[#FF6B35]"></div>
              <span className="text-gray-400">Video</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-[#FF9F5A]"></div>
              <span className="text-gray-400">Imagen</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-[#FFC999]"></div>
              <span className="text-gray-400">PDF</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-gray-600"></div>
              <span className="text-gray-400">Disponible</span>
            </div>
          </div>

          {/* Información de uso y disponible */}
          <div className="space-y-2 mb-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400">Usado</span>
              <span className="text-[#FF7939] font-semibold">{formatGB(usedGB)}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400">Disponible</span>
              <span className="text-white font-semibold">
                {formatGB(remainingGB > 0 ? remainingGB : 0)}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400">Total</span>
              <span className="text-gray-300 font-medium">{formatGB(storageLimitGB)}</span>
            </div>
          </div>

          {/* Botón expandir/colapsar - Centrado, negrita y naranja */}
          <div className="mb-2 flex items-center justify-center">
            <button
              onClick={() => {
                setCollapsed(!collapsed)
                if (collapsed) {
                  // Cuando se expande, cambiar a vista de uso total
                  setViewMode('usage')
                }
              }}
              className="flex items-center justify-center gap-1 text-sm font-bold text-[#FF7939] hover:text-[#FF8C42] transition-colors py-1"
            >
              {collapsed ? (
                <>
                  Ver detalles <ChevronDown className="w-3 h-3" />
                </>
              ) : (
                <>
                  Ocultar detalles <ChevronUp className="w-3 h-3" />
                </>
              )}
            </button>
          </div>

          {/* Tabs (solo cuando expandido) */}
          {!collapsed && (
          <div className="flex gap-1 mb-3 border-b border-gray-800">
            <button
              onClick={() => setViewMode('activity')}
              className={`flex-1 py-2 px-2 text-xs font-medium transition-colors ${
                viewMode === 'activity'
                  ? 'text-[#FF7939] border-b-2 border-[#FF7939]'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              <div className="flex items-center justify-center gap-1">
                <Layers className="w-3 h-3" />
                Actividades
              </div>
            </button>
            <button
              onClick={() => setViewMode('usage')}
              className={`flex-1 py-2 px-2 text-xs font-medium transition-colors ${
                viewMode === 'usage'
                  ? 'text-[#FF7939] border-b-2 border-[#FF7939]'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              <div className="flex items-center justify-center gap-1">
                <FileCheck className="w-3 h-3" />
                Uso Total
              </div>
            </button>
          </div>
          )}

          {/* Contenido según vista (solo cuando expandido) */}
          {!collapsed && (
          <div className="space-y-2">
            {/* Filtros por tipo (imagen / video / pdf) */}
            <div className="flex items-center justify-center gap-2 pb-2 border-b border-gray-800">
              <button
                onClick={() => setConceptFilter('image')}
                className={`p-2 rounded-lg border transition-colors ${
                  conceptFilter === 'image'
                    ? 'bg-[#FF7939]/20 border-[#FF7939]/40 text-[#FF7939]'
                    : 'bg-transparent border-gray-800 text-gray-400 hover:text-white hover:border-gray-700'
                }`}
                title="Filtrar: imágenes"
              >
                <ImageIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => setConceptFilter('video')}
                className={`p-2 rounded-lg border transition-colors ${
                  conceptFilter === 'video'
                    ? 'bg-[#FF7939]/20 border-[#FF7939]/40 text-[#FF7939]'
                    : 'bg-transparent border-gray-800 text-gray-400 hover:text-white hover:border-gray-700'
                }`}
                title="Filtrar: videos"
              >
                <Film className="w-4 h-4" />
              </button>
              <button
                onClick={() => setConceptFilter('pdf')}
                className={`p-2 rounded-lg border transition-colors ${
                  conceptFilter === 'pdf'
                    ? 'bg-[#FF7939]/20 border-[#FF7939]/40 text-[#FF7939]'
                    : 'bg-transparent border-gray-800 text-gray-400 hover:text-white hover:border-gray-700'
                }`}
                title="Filtrar: PDFs"
              >
                <FileText className="w-4 h-4" />
              </button>
              <button
                onClick={() => setConceptFilter('all')}
                className={`ml-2 px-2 py-1 rounded-lg border text-[11px] transition-colors ${
                  conceptFilter === 'all'
                    ? 'bg-gray-800 border-gray-700 text-white'
                    : 'bg-transparent border-gray-800 text-gray-400 hover:text-white hover:border-gray-700'
                }`}
                title="Quitar filtro"
                type="button"
              >
                Todos
              </button>
            </div>

            {/* Vista por Actividad */}
            {viewMode === 'activity' && (
              <>
                {loadingFiles ? (
                  <div className="flex justify-center items-center py-4">
                    <RefreshCw className="w-5 h-5 animate-spin text-[#FF7939]" />
                  </div>
                ) : getActivityView().length > 0 ? (
                  <>
                    {getActivityView().slice(0, expanded ? getActivityView().length : 5).map((activity, idx) => {
                      const uniqueConcepts = [...new Set(activity.files.map(f => f.concept))]
                      
                      return (
                        <div key={`activity-${activity.id}-${idx}`} className="text-xs pb-3 border-b border-gray-800 last:border-0">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-start gap-2 flex-1 min-w-0">
                              <Layers className="h-4 w-4 text-[#FF7939] mt-0.5 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <div className="text-white font-medium truncate mb-1">{activity.name}</div>
                                <div className="text-gray-500 text-[10px]">
                                  {activity.files.length} {activity.files.length === 1 ? 'archivo' : 'archivos'} • {uniqueConcepts.length} {uniqueConcepts.length === 1 ? 'tipo' : 'tipos'}
                                </div>
                              </div>
                            </div>
                            <span className="text-white font-semibold ml-2">
                              {formatMB(activity.totalGB)}
                            </span>
                          </div>
                          {/* Scroll horizontal de archivos */}
                          <div className="flex gap-1 overflow-x-auto pb-1 hide-scrollbar">
                            {activity.files.map((file, fileIdx) => {
                              const getFileIcon = () => {
                                if (file.concept === 'video') return <Film className="w-3 h-3" />
                                if (file.concept === 'image') return <ImageIcon className="w-3 h-3" />
                                return <FileText className="w-3 h-3" />
                              }
                              return (
                                <span
                                  key={fileIdx}
                                  className="bg-[#FF7939]/20 text-[#FF7939] text-[10px] px-2 py-1 rounded-full font-medium border border-[#FF7939]/30 whitespace-nowrap flex-shrink-0 flex items-center gap-1"
                                  title={file.fileName}
                                >
                                  {getFileIcon()}
                                  {file.fileName.length > 15 ? `${file.fileName.substring(0, 15)}...` : file.fileName}
                                </span>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })}
                    
                    {getActivityView().length > 5 && (
                      <button
                        onClick={() => setExpanded(!expanded)}
                        className="w-full flex items-center justify-center gap-1 text-xs text-gray-400 hover:text-white transition-colors py-1"
                      >
                        {expanded ? (
                          <>
                            Ver menos <ChevronUp className="w-3 h-3" />
                          </>
                        ) : (
                          <>
                            Ver {getActivityView().length - 5} más <ChevronDown className="w-3 h-3" />
                          </>
                        )}
                      </button>
                    )}
                  </>
                ) : (
                  <div className="text-center py-4 text-gray-400 text-xs">
                    No hay actividades disponibles
                  </div>
                )}
              </>
            )}

            {/* Vista por Uso Total */}
            {viewMode === 'usage' && (
              <>
                {loadingFiles ? (
                  <div className="flex justify-center items-center py-4">
                    <RefreshCw className="w-5 h-5 animate-spin text-[#FF7939]" />
                  </div>
                ) : getUsageView().length > 0 ? (
                  <>
                    {getUsageView().slice(0, expanded ? getUsageView().length : 5).map((file, idx) => {
                      const getIcon = () => {
                        if (file.concept === 'video') return <Film className="h-4 w-4 text-[#FF7939]" />
                        if (file.concept === 'image') return <ImageIcon className="h-4 w-4 text-[#FF8C42]" />
                        return <FileText className="h-4 w-4 text-[#FF9F5A]" />
                      }

                      const isEditingThisFile = editingFileName === file.fileId

                      return (
                        <div key={`usage-${file.fileId}-${idx}`} className="text-xs pb-2 border-b border-gray-800 last:border-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-2 flex-1 min-w-0">
                              {getIcon()}
                              <div className="flex-1 min-w-0">
                                {isEditingThisFile ? (
                                  <div className="flex items-center gap-1 mb-1">
                                    <input
                                      type="text"
                                      value={newFileName}
                                      onChange={(e) => setNewFileName(e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          handleSaveFileName(file)
                                        } else if (e.key === 'Escape') {
                                          setEditingFileName(null)
                                          setNewFileName('')
                                        }
                                      }}
                                      className="flex-1 px-2 py-1 bg-gray-800 border border-gray-700 rounded text-white text-xs focus:outline-none focus:border-[#FF7939]"
                                      autoFocus
                                    />
                                    <button
                                      onClick={() => handleSaveFileName(file)}
                                      className="p-1 text-[#FF7939] hover:text-[#FF8C42] transition-colors"
                                      title="Guardar"
                                    >
                                      <Save className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => {
                                        setEditingFileName(null)
                                        setNewFileName('')
                                      }}
                                      className="p-1 text-gray-400 hover:text-white transition-colors"
                                      title="Cancelar"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ) : (
                                  <div 
                                    className={`text-white font-medium truncate ${editing ? 'cursor-pointer hover:text-[#FF7939]' : ''}`}
                                    onClick={() => {
                                      if (editing && (file.concept === 'video' || file.concept === 'image')) {
                                        handleViewFile(file)
                                      }
                                    }}
                                    title={editing && (file.concept === 'video' || file.concept === 'image') ? 'Click para ver' : ''}
                                  >
                                    {file.fileName}
                                  </div>
                                )}
                                <div className="text-gray-500 text-[10px] mt-0.5">
                                  Usado {file.usesCount} {file.usesCount === 1 ? 'vez' : 'veces'} • {formatMB(file.sizeGB)} cada uno
                                </div>
                                {file.activities.length > 0 && (
                                  <div className="text-[10px] text-yellow-500 mt-0.5">
                                    {file.activities.length} {file.activities.length === 1 ? 'actividad' : 'actividades'}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-start gap-2">
                              <div className="text-right ml-2">
                                <div className="text-white font-semibold">
                                  {formatMB(file.totalUsageGB)}
                                </div>
                                <div className="text-[10px] text-gray-500">total</div>
                              </div>
                              {editing && !isEditingThisFile && (
                                <div className="flex gap-1">
                                  {(file.concept === 'video' || file.concept === 'image') && (
                                    <button
                                      onClick={() => handleViewFile(file)}
                                      className="p-1.5 text-[#FF7939] hover:text-[#FF8C42] hover:bg-[#FF7939]/10 rounded transition-colors"
                                      title="Ver archivo"
                                    >
                                      <Eye className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleEditFileName(file)}
                                    className="p-1.5 text-blue-500 hover:text-blue-400 hover:bg-blue-500/10 rounded transition-colors"
                                    title="Editar nombre"
                                  >
                                    <Edit className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteFile(file)}
                                    className="p-1.5 text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                                    title="Eliminar archivo"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                    
                    {getUsageView().length > 5 && (
                      <button
                        onClick={() => setExpanded(!expanded)}
                        className="w-full flex items-center justify-center gap-1 text-xs text-gray-400 hover:text-white transition-colors py-1"
                      >
                        {expanded ? (
                          <>
                            Ver menos <ChevronUp className="w-3 h-3" />
                          </>
                        ) : (
                          <>
                            Ver {getUsageView().length - 5} más <ChevronDown className="w-3 h-3" />
                          </>
                        )}
                      </button>
                    )}
                  </>
                ) : (
                  <div className="text-center py-4 text-gray-400 text-xs">
                    No hay archivos disponibles
                  </div>
                )}
              </>
            )}
          </div>
          )}

          {/* Modal para ver archivo */}
          {viewingFile && (
            <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setViewingFile(null)}>
              <div className="bg-[#1A1C1F] rounded-xl p-4 max-w-4xl w-full border border-[#2A2C2E] max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-semibold text-sm">{viewingFile.fileName}</h3>
                  <button
                    onClick={() => setViewingFile(null)}
                    className="p-1 text-gray-400 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
                  {viewingFile.concept === 'video' ? (
                    <UniversalVideoPlayer
                      videoUrl={null}
                      bunnyVideoId={viewingFile.fileId}
                      autoPlay={false}
                      controls={true}
                      muted={false}
                      className="w-full h-full"
                      onError={(error) => {
                        console.error('Error cargando video:', error)
                      }}
                    />
                  ) : viewingFile.concept === 'image' ? (
                    <img
                      src={viewingFile.url || `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/product-media/coaches/${user?.id}/images/${viewingFile.fileName}`}
                      alt={viewingFile.fileName}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        console.error('Error cargando imagen:', viewingFile.url || viewingFile.fileName)
                        // Intentar URL alternativa si falla
                        if (!viewingFile.url) {
                          e.currentTarget.src = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/product-media/coaches/${user?.id}/images/${viewingFile.fileName}`
                        } else {
                          e.currentTarget.src = '/placeholder.svg'
                        }
                      }}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
                      <FileText className="w-16 h-16" />
                      <p className="ml-4">Vista previa de PDF no disponible</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Modal de advertencia al eliminar */}
          {showDeleteWarning && fileToDelete && (
            <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
              <div className="bg-[#1A1C1F] rounded-xl p-4 max-w-md w-full border border-[#2A2C2E]">
                <div className="flex items-start gap-3 mb-4">
                  <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="text-white font-semibold text-sm mb-2">Advertencia</h3>
                    <p className="text-gray-300 text-xs mb-2">
                      Este archivo está siendo usado en {fileToDelete.activities.length} {fileToDelete.activities.length === 1 ? 'actividad' : 'actividades'}:
                    </p>
                    <ul className="text-gray-400 text-xs space-y-1 mb-3">
                      {fileToDelete.activities.map((act) => (
                        <li key={act.id}>• {act.name}</li>
                      ))}
                    </ul>
                    <p className="text-red-400 text-xs font-medium">
                      Al eliminar este archivo, se perderá de estas actividades también.
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setShowDeleteWarning(false)
                      setFileToDelete(null)
                    }}
                    className="flex-1 py-2 px-4 bg-gray-700 hover:bg-gray-600 text-white text-xs font-medium rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={confirmDelete}
                    className="flex-1 py-2 px-4 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-lg transition-colors"
                  >
                    Eliminar de todos modos
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      ) : null}
    </div>
  )
}
