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
import { motion, AnimatePresence } from 'framer-motion'

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
  libraryId?: string // Bunny Library ID
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
  const { user, loading: authLoading } = useAuth()
  const [storageData, setStorageData] = useState<StorageUsageData | null>(null)
  const [storageFiles, setStorageFiles] = useState<StorageFile[]>([])
  const [calculatedTotal, setCalculatedTotal] = useState(0)
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
    if (authLoading || !user) return

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
  }, [planProp, authLoading, user])

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
    if (storageFiles.length > 0) {
      const total = storageFiles.reduce((acc, f) => acc + (f.sizeGB || 0), 0)
      setCalculatedTotal(total)
    }
  }, [storageFiles])

  useEffect(() => {
    if (authLoading || !user) return
    loadStorageUsage()
  }, [authLoading, user])

  const formatMB = (gb: number) => {
    const mb = gb * 1024
    if (mb < 1) return `${(mb * 1024).toFixed(0)} KB`
    return `${mb.toFixed(1)} MB`
  }

  const formatGB = (gb: number) => {
    if (gb < 0.001) return '0 GB'
    return `${gb.toFixed(2)} GB`
  }

  const handleDeleteFile = (file: StorageFile) => {
    setFileToDelete(file)
    setShowDeleteWarning(true)
  }

  const deleteFile = async (file: StorageFile) => {
    try {
      let endpoint = ''
      let body: any = {}

      if (file.concept === 'video') {
        endpoint = '/api/bunny/delete-video'
        body = { videoId: file.fileId }
      } else if (file.concept === 'image' || file.concept === 'pdf') {
        endpoint = '/api/storage/delete-file'
        body = {
          fileName: file.fileName,
          concept: file.concept,
          activityIds: file.activities.map(a => a.id)
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
        setStorageFiles((prev) => prev.filter((f) => f.fileId !== file.fileId))
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
        // Update local state for all files that share the same ID (e.g. video used in multiple activities)
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

  const getActivityView = () => {
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
      .map(([id, data]: [number, { name: string, files: StorageFile[], totalGB: number }]) => ({ id, ...data }))
      .sort((a, b) => b.totalGB - a.totalGB)
  }

  const getUsageView = () => {
    const filteredFiles = storageFiles.filter((file: StorageFile) => conceptFilter === 'all' || file.concept === conceptFilter)
    return filteredFiles
      .map((file: StorageFile) => ({
        ...file,
        totalUsageGB: file.sizeGB * file.usesCount
      }))
      .sort((a: any, b: any) => b.totalUsageGB - a.totalUsageGB)
  }

  const usedGB = calculatedTotal || storageData?.total || 0
  const videoGB = storageData?.breakdown.video || 0
  const imageGB = storageData?.breakdown.image || 0
  const pdfGB = storageData?.breakdown.pdf || 0

  const videoPercent = storageLimitGB > 0 ? (videoGB / storageLimitGB) * 100 : 0
  const imagePercent = storageLimitGB > 0 ? (imageGB / storageLimitGB) * 100 : 0
  const pdfPercent = storageLimitGB > 0 ? (pdfGB / storageLimitGB) * 100 : 0

  return (
    <div className="bg-black p-4 text-white">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-medium text-white/40">Almacenamiento</h3>
        <button
          onClick={loadStorageUsage}
          disabled={loading}
          className="text-white/20 hover:text-white transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error ? (
        <div className="text-red-500 text-[10px] text-center py-2">{error}</div>
      ) : loading && !storageData ? (
        <div className="flex justify-center items-center py-6">
          <RefreshCw className="w-4 h-4 animate-spin text-[#FF7939]" />
        </div>
      ) : storageData ? (
        <>
          <div className="h-[2px] w-full bg-white/5 rounded-full overflow-hidden mb-4 flex">
            {videoPercent > 0 && <div className="bg-[#FF6B35] h-full" style={{ width: `${videoPercent}%` }} />}
            {imagePercent > 0 && <div className="bg-[#FF9966] h-full" style={{ width: `${imagePercent}%` }} />}
            {pdfPercent > 0 && <div className="bg-[#FFCCAA] h-full" style={{ width: `${pdfPercent}%` }} />}
          </div>

          <div className="flex justify-between items-end mb-8">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-light leading-none tracking-tighter">{formatGB(usedGB).split(' ')[0]}</span>
              <span className="text-[10px] text-white/30 font-medium">GB / {storageLimitGB}GB</span>
            </div>
            <button
              onClick={() => { setCollapsed(!collapsed); if (collapsed) setViewMode('usage'); }}
              className="text-[10px] font-medium text-white/40 hover:text-[#FF7939] transition-colors"
            >
              {collapsed ? 'Ver detalles' : 'Cerrar'}
            </button>
          </div>

          {!collapsed && (
            <div className="space-y-6">
              <div className="flex gap-4 border-b border-white/5 pb-2">
                <button onClick={() => setViewMode('usage')} className={`text-[10px] font-semibold ${viewMode === 'usage' ? 'text-white' : 'text-white/20'}`}>Archivos</button>
                <button onClick={() => setViewMode('activity')} className={`text-[10px] font-semibold ${viewMode === 'activity' ? 'text-white' : 'text-white/20'}`}>Actividades</button>
              </div>

              <div className="flex gap-1.5">
                {['video', 'image', 'pdf', 'all'].map((f) => (
                  <button
                    key={f}
                    onClick={() => setConceptFilter(f as any)}
                    className={`px-3 py-1 rounded-full text-[9px] transition-all ${conceptFilter === f ? 'bg-white text-black' : 'text-white/30 hover:text-white'}`}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>

              <AnimatePresence mode="popLayout">
                {loadingFiles ? (
                  <div className="flex justify-center py-8"><RefreshCw className="w-4 h-4 animate-spin text-[#FF7939]" /></div>
                ) : viewMode === 'activity' ? (
                  getActivityView().slice(0, expanded ? undefined : 6).map(activity => (
                    <motion.div key={activity.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-4">
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-white/80 text-[10px] font-medium uppercase tracking-tight">{activity.name}</span>
                        <span className="text-white/20 text-[9px]">{formatMB(activity.totalGB)}</span>
                      </div>
                      <div className="flex gap-2 overflow-x-auto hide-scrollbar">
                        {activity.files.map((f, i) => (
                          <span key={i} className="text-white/30 text-[9px] whitespace-nowrap">
                            {f.fileName}{i < activity.files.length - 1 ? ' •' : ''}
                          </span>
                        ))}
                      </div>
                    </motion.div>
                  ))
                ) : (
                  getUsageView().slice(0, expanded ? undefined : 20).map(file => (
                    <motion.div key={file.fileId} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-2.5 border-b border-white/[0.03] last:border-0 group">
                      <div className="flex justify-between items-start">
                        <div className="flex gap-2.5 min-w-0 flex-1">
                          <div className="mt-0.5 opacity-30">
                            {file.concept === 'video' ? <Film className="w-3.5 h-3.5" /> : file.concept === 'image' ? <ImageIcon className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
                          </div>

                          <div className="min-w-0 flex-1">
                            {editingFileName === file.fileId ? (
                              <div className="flex items-center gap-2">
                                <input
                                  autoFocus
                                  className="bg-transparent border-b border-[#FF7939]/50 py-0 text-white text-[11px] w-full focus:outline-none"
                                  value={newFileName}
                                  onChange={e => setNewFileName(e.target.value)}
                                  onKeyDown={e => {
                                    if (e.key === 'Enter') handleSaveFileName(file);
                                    if (e.key === 'Escape') setEditingFileName(null);
                                  }}
                                />
                                <button onClick={() => handleSaveFileName(file)} className="text-green-500/80"><FileCheck className="w-3.5 h-3.5" /></button>
                                <button onClick={() => setEditingFileName(null)} className="text-white/20"><X className="w-3.5 h-3.5" /></button>
                              </div>
                            ) : (
                              <>
                                <div className="bg-white/5 px-2 py-0.5 rounded-lg inline-block max-w-full">
                                  <span className="text-white/90 text-[11px] font-medium block truncate hover:text-[#FF7939] cursor-pointer transition-colors" onClick={() => (file.concept === 'video' || file.concept === 'image') && handleViewFile(file)}>{file.fileName}</span>
                                </div>
                                <div className="flex gap-1.5 mt-1.5 overflow-x-auto hide-scrollbar">
                                  {file.activities.map((act, i) => (
                                    <span key={i} className="bg-[#FF7939]/10 text-[#FF7939]/60 text-[8px] font-bold uppercase tracking-tight whitespace-nowrap px-2 py-0.5 rounded-md border border-[#FF7939]/20">{act.name}</span>
                                  ))}
                                </div>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 ml-3">
                          <span className="text-[#FF7939]/70 text-[10px] font-bold uppercase tracking-tighter bg-[#FF7939]/5 px-1.5 py-0.5 rounded-md">{formatMB(file.sizeGB).split(' ')[0]}mb</span>
                          <div className="flex gap-2">
                            <button onClick={() => handleViewFile(file)} className="text-[#FF7939]/60 hover:text-[#FF7939] transition-colors bg-[#FF7939]/10 p-1.5 rounded-lg border border-[#FF7939]/20">
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => handleEditFileName(file)} className="text-white/40 hover:text-white transition-colors bg-white/5 p-1.5 rounded-lg border border-white/10">
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => handleDeleteFile(file)} className="text-red-500/50 hover:text-red-500 transition-colors bg-red-500/10 p-1.5 rounded-lg border border-red-500/20">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          )}

          <AnimatePresence>
            {viewingFile && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-4" onClick={() => setViewingFile(null)}>
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  className="relative w-full max-w-3xl bg-[#050505] rounded-3xl border border-white/10 shadow-2xl overflow-hidden flex flex-col"
                  onClick={e => e.stopPropagation()}
                >
                  <div className="flex justify-between items-center px-6 py-4 bg-gradient-to-b from-black/80 to-transparent absolute top-0 left-0 right-0 z-10">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#FF7939]" />
                      <h4 className="text-white text-xs font-semibold truncate pr-4 opacity-90 tracking-tight">{viewingFile.fileName}</h4>
                    </div>
                    <button className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all" onClick={() => setViewingFile(null)}>
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="w-full aspect-video bg-black flex items-center justify-center relative">
                    {viewingFile.concept === 'video' ? (
                      <UniversalVideoPlayer
                        libraryId={viewingFile.libraryId}
                        videoUrl={viewingFile.url}
                        bunnyVideoId={viewingFile.fileId}
                        controls={true}
                        autoPlay={true}
                        className="w-full h-full"
                      />
                    ) : (
                      <img
                        src={viewingFile.url || `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/product-media/coaches/${user?.id}/images/${viewingFile.fileName}`}
                        className="w-full h-full object-contain"
                      />
                    )}
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showDeleteWarning && fileToDelete && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[110] flex items-center justify-center p-6" onClick={() => { setShowDeleteWarning(false); setFileToDelete(null); }}>
                <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-[#111] border border-gray-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl" onClick={e => e.stopPropagation()}>
                  <div className="bg-red-500/10 w-12 h-12 rounded-2xl flex items-center justify-center mb-4"><Trash2 className="w-6 h-6 text-red-500" /></div>
                  <h3 className="text-white text-lg font-bold mb-2">¿Eliminar archivo?</h3>
                  <p className="text-gray-400 text-xs mb-6">{fileToDelete.activities.length > 0 ? `Este archivo se eliminará de ${fileToDelete.activities.length} actividades.` : 'Esta acción eliminará el archivo de forma permanente.'}</p>
                  <div className="flex gap-3">
                    <button className="flex-1 py-3 text-white text-xs font-bold border border-gray-800 rounded-2xl" onClick={() => { setShowDeleteWarning(false); setFileToDelete(null); }}>Cancelar</button>
                    <button className="flex-1 py-3 bg-red-600 text-white text-xs font-bold rounded-2xl" onClick={confirmDelete}>Eliminar</button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      ) : null}
    </div>
  )
}
