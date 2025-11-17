"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
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
  File as FileIcon
} from 'lucide-react'

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

export function StorageUsageWidget({ plan: planProp }: StorageUsageWidgetProps = {}) {
  const [storageData, setStorageData] = useState<StorageUsageData | null>(null)
  const [storageFiles, setStorageFiles] = useState<StorageFile[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingFiles, setLoadingFiles] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)
  const [collapsed, setCollapsed] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>('activity')
  const [currentPlan, setCurrentPlan] = useState<PlanType | null>(null)
  
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
    
    try {
      const usageResponse = await fetch('/api/coach/storage-usage')
      
      if (!usageResponse.ok) {
        throw new Error(`HTTP error! status: ${usageResponse.status}`)
      }
      
      const usageResult = await usageResponse.json()
      
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
        const filesRes = await fetch('/api/coach/storage-files')
        if (filesRes.ok) {
          const filesJson = await filesRes.json()
          if (filesJson.success && Array.isArray(filesJson.files)) {
            setStorageFiles(filesJson.files as StorageFile[])
          } else {
            setStorageFiles([])
          }
        } else {
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

  // Agrupar por actividad
  const getActivityView = () => {
    const activityMap = new Map<number, { name: string, files: StorageFile[], totalGB: number }>()
    
    storageFiles.forEach(file => {
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
    return storageFiles
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
  
  const videoPercent = storageLimitGB > 0 ? (videoGB / storageLimitGB) * 100 : 0
  const imagePercent = storageLimitGB > 0 ? (imageGB / storageLimitGB) * 100 : 0
  const availablePercent = storageLimitGB > 0 ? (remainingGB / storageLimitGB) * 100 : 100

  return (
    <div className="bg-[#1A1C1F] rounded-2xl p-4">
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
          {/* Leyendas arriba de la barra (solo cuando expandido) */}
          {!collapsed && (
          <div className="flex items-center justify-between mb-2">
            {storageData.breakdown.video > 0 && (
              <div className="flex items-center gap-1">
                <Video className="w-4 h-4 text-[#FF7939]" />
                <span className="text-xs text-gray-300">Video</span>
              </div>
            )}
            {storageData.breakdown.image > 0 && (
              <div className="flex items-center gap-1">
                <Image className="w-4 h-4 text-[#FF8C42]" />
                <span className="text-xs text-gray-300">Imagen</span>
              </div>
            )}
            {storageData.breakdown.pdf > 0 && (
              <div className="flex items-center gap-1">
                <FileIcon className="w-4 h-4 text-white" />
                <span className="text-xs text-gray-300">PDF</span>
              </div>
            )}
          </div>
          )}

          {/* Barra con Videos, Fotos y Disponible */}
          <div className="relative h-14 rounded-xl overflow-hidden border-2 border-gray-700 bg-gray-900/50 shadow-inner mb-4">
            <div className="flex h-full items-center">
              {/* Videos - Naranja */}
              {videoPercent > 0 && (
                <div 
                  className="bg-[#FF7939] flex items-center justify-center gap-2 text-white text-xs font-bold h-full transition-all"
                  style={{ width: `${videoPercent}%`, minWidth: videoPercent > 2 ? '50px' : '0px' }}
                >
                  <Video className="w-4 h-4" />
                  {videoPercent > 10 && (
                    <span className="whitespace-nowrap">{formatMB(videoGB)}</span>
                  )}
                </div>
              )}
              
              {/* Fotos - Negro */}
              {imagePercent > 0 && (
                <div 
                  className="bg-black flex items-center justify-center gap-2 text-white text-xs font-bold h-full transition-all"
                  style={{ width: `${imagePercent}%`, minWidth: imagePercent > 2 ? '50px' : '0px' }}
                >
                  <Image className="w-4 h-4" />
                  {imagePercent > 10 && (
                    <span className="whitespace-nowrap">{formatMB(imageGB)}</span>
                  )}
                </div>
              )}
              
              {/* Disponible - Blanco */}
              {availablePercent > 0 && (
                <div 
                  className="bg-white flex items-center justify-center gap-2 text-[#1A1C1F] text-xs font-bold h-full transition-all"
                  style={{ width: `${availablePercent}%`, minWidth: availablePercent > 2 ? '50px' : '0px' }}
                >
                  <FileIcon className="w-4 h-4" />
                  {availablePercent > 10 && (
                    <span className="whitespace-nowrap">{formatGB(remainingGB)}</span>
                  )}
                </div>
              )}
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

          {/* Botón expandir/colapsar */}
          <div className="mb-2">
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="w-full flex items-center justify-center gap-1 text-xs text-gray-400 hover:text-white transition-colors py-1"
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
            {/* Vista por Actividad */}
            {viewMode === 'activity' && (
              <>
                {loadingFiles ? (
                  <div className="flex justify-center items-center py-4">
                    <RefreshCw className="w-5 h-5 animate-spin text-[#FF7939]" />
                  </div>
                ) : storageFiles.length > 0 ? (
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
                ) : storageFiles.length > 0 ? (
                  <>
                    {getUsageView().slice(0, expanded ? getUsageView().length : 5).map((file, idx) => {
                      const getIcon = () => {
                        if (file.concept === 'video') return <Film className="h-4 w-4 text-[#FF7939]" />
                        if (file.concept === 'image') return <ImageIcon className="h-4 w-4 text-[#FF8C42]" />
                        return <FileText className="h-4 w-4 text-[#FF9F5A]" />
                      }

                      return (
                        <div key={`usage-${file.fileId}-${idx}`} className="text-xs pb-2 border-b border-gray-800 last:border-0">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-2 flex-1 min-w-0">
                              {getIcon()}
                              <div className="flex-1 min-w-0">
                                <div className="text-white font-medium truncate">{file.fileName}</div>
                                <div className="text-gray-500 text-[10px] mt-0.5">
                                  Usado {file.usesCount} {file.usesCount === 1 ? 'vez' : 'veces'} • {formatMB(file.sizeGB)} cada uno
                                </div>
                              </div>
                            </div>
                            <div className="text-right ml-2">
                              <div className="text-white font-semibold">
                                {formatMB(file.totalUsageGB)}
                              </div>
                              <div className="text-[10px] text-gray-500">total</div>
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
        </>
      ) : null}
    </div>
  )
}
