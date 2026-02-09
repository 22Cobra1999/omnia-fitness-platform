"use client"

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import Papa from 'papaparse'
import { validateSimpleCSVHeaders, SimpleExerciseData } from '@/lib/data/csv-parser'
import { Button } from '@/components/ui/button'
import { Upload, Download, Trash2, CheckCircle, AlertCircle, Plus, Eye, X, Clock, Flame, Video, PowerOff, Power, ChevronLeft, ChevronRight, Settings2 } from 'lucide-react'
import { MediaSelectionModal } from '@/components/shared/ui/media-selection-modal'
import { normalizeActivityMap } from '@/lib/utils/exercise-activity-map'
import { UniversalVideoPlayer } from '@/components/shared/video/universal-video-player'
import { motion } from 'framer-motion'
import { ConditionalRulesPanel, ConditionalRule } from '@/components/shared/products/conditional-rules-panel'
import { CsvUploadArea, CsvManualForm, CsvLimitBar, CsvTable } from './components'
import { useCsvPagination } from './hooks/useCsvPagination'
import { useRowSelection } from './hooks/useRowSelection'
import { ManualFormState } from './types'
import { useCsvDataFetching } from './hooks/useCsvDataFetching'
import { useCsvFileProcessor } from './hooks/useCsvFileProcessor'
import { useCsvActions } from './hooks/useCsvActions'
import { generateCsvTemplate } from './utils/csv-template-generator'
import {
  normalizeExerciseType,
  extractBunnyVideoIdFromUrl,
  getNumberValue,
  getStringValue,
  getValue,
  normalizeCatalogText,
  normalizeIntensityValue,
  normalizeBodyParts,
  normalizeEquipment,
  getRowIdentifier,
  getExerciseName,
  normalizeName
} from './utils/csv-helpers'
import {
  exerciseTypeOptions,
  allowedExerciseTypes
} from './constants'


interface CSVManagerEnhancedProps {
  activityId: number
  coachId: string
  onSuccess?: () => void
  onRemoveCSV?: () => void
  onDownloadCSV?: () => void
  csvFileName?: string
  // Props para persistir estado desde el padre
  csvData?: any[]
  setCsvData?: (data: any[]) => void
  selectedRows?: Set<number>
  setSelectedRows?: (rows: Set<number>) => void
  productCategory?: 'fitness' | 'nutricion'
  onItemsStatusChange?: (items: any[], action: 'disable' | 'reactivate' | 'remove') => void
  onVideoCleared?: (index: number, exercise: any, meta?: { bunnyVideoId?: string; bunnyLibraryId?: number | string; videoUrl?: string }) => void
  planLimits?: {
    planType?: string
    activitiesLimit?: number
  } | null
  renderAfterTable?: React.ReactNode
  // Nueva prop para guardar archivos de video inmediatamente
  onVideoFileSelected?: (exercise: any, index: number, videoFile: File) => void
}


interface ExerciseData extends SimpleExerciseData {
  [key: string]: any
  id?: number
  isExisting?: boolean
  video_url?: string
  created_at?: string
  is_active?: boolean
}

export function CSVManagerEnhanced({
  activityId,
  coachId,
  onSuccess,
  onRemoveCSV,
  onDownloadCSV,
  csvFileName,
  csvData: parentCsvData,
  setCsvData: parentSetCsvData,
  selectedRows: parentSelectedRows,
  setSelectedRows: parentSetSelectedRows,
  productCategory = 'fitness',
  onItemsStatusChange,
  onVideoCleared,
  planLimits: planLimitsProp = null,
  renderAfterTable,
  onVideoFileSelected
}: CSVManagerEnhancedProps) {
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
  const videoInputRef = useRef<HTMLInputElement>(null)
  const [showVideoModal, setShowVideoModal] = useState(false)
  const [showMediaSourceModal, setShowMediaSourceModal] = useState(false)
  const videoFileInputRef = useRef<HTMLInputElement>(null)
  const [existingCatalog, setExistingCatalog] = useState<any[]>([])
  const [selectedExisting, setSelectedExisting] = useState('')
  const [planLimits, setPlanLimits] = useState<{ activitiesLimit: number } | null>(
    planLimitsProp
      ? { activitiesLimit: planLimitsProp.activitiesLimit || 100 }
      : null
  )
  // Estado para almacenar el uso de cada ejercicio/plato (solo en modo genérico)
  const [exerciseUsage, setExerciseUsage] = useState<Record<number, { activities: Array<{ id: number; name: string }> }>>({})
  // Mapa de actividades del coach (id -> name) para mostrar nombres en lugar de IDs
  const [activityNamesMap, setActivityNamesMap] = useState<Record<number, string>>({})
  // Mapa de imágenes de portada de actividades (id -> image_url)
  const [activityImagesMap, setActivityImagesMap] = useState<Record<number, string | null>>({})
  const [bunnyVideoTitles, setBunnyVideoTitles] = useState<Record<string, string>>({})

  // Estado para Reglas Condicionales
  const [showRulesPanel, setShowRulesPanel] = useState(false)
  const [rulesCount, setRulesCount] = useState(0)
  const updateErrorState = useCallback((message: string | null, rows: string[] = []) => {
    setError(message)
    setInvalidRows(rows)
  }, [])

  const [uploadedFiles, setUploadedFiles] = useState<Array<{ name: string, timestamp: number }>>([])
  const [mode, setMode] = useState<'manual' | 'csv' | 'existentes'>('existentes')
  const [editingExerciseIndex, setEditingExerciseIndex] = useState<number | null>(null)

  const { loadExistingData } = useCsvDataFetching({
    activityId,
    coachId,
    productCategory,
    parentCsvData,
    parentSetCsvData,
    setLoadingExisting,
    setCsvData,
    setExistingData,
    setExerciseUsage,
    setActivityNamesMap,
    setActivityImagesMap,
    setRulesCount,
    updateErrorState
  })

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
  const [showAssignedVideoPreview, setShowAssignedVideoPreview] = useState(false)
  const [bodyParts, setBodyParts] = useState<string[]>([])
  const [bodyPartInput, setBodyPartInput] = useState('')
  const [seriePeso, setSeriePeso] = useState('')
  const [serieReps, setSerieReps] = useState('')
  const [serieSeries, setSerieSeries] = useState('')
  const [seriesList, setSeriesList] = useState<Array<{ peso: any, repeticiones: any, series: any }>>([])
  const [equipoList, setEquipoList] = useState<string[]>([])
  const [equipoInput, setEquipoInput] = useState('')
  const [recipeSteps, setRecipeSteps] = useState<string[]>([])
  const [recipeStepInput, setRecipeStepInput] = useState('')

  const fileInputRef = useRef<HTMLInputElement>(null)
  const justDeletedRef = useRef<boolean>(false)
  const hasUserInteractedRef = useRef<boolean>(false)
  const isLoadingDataRef = useRef<boolean>(false)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 15

  const TEMPLATE_ERROR_MESSAGE = 'Archivo inválido. Descargá la plantilla de ejemplo.'

  // Combine all items (existing, CSV, parent) into a single list
  const allData = useMemo(() => {
    const existing = existingData || []
    const csv = csvData || []
    const parent = parentCsvData || []

    const existingActiveMap = new Map<number, boolean>()
    existing.forEach((item) => {
      const id = item?.id
      if (typeof id === 'number') {
        existingActiveMap.set(id, item?.is_active !== false && item?.activo !== false)
      }
    })

    const combined: any[] = []
    const seenRowKeys = new Set<string>()

    const registerItem = (item: any, idx: number) => {
      if (!item) return
      const rowKey = getRowIdentifier(item, idx)
      if (rowKey && seenRowKeys.has(rowKey)) return
      if (rowKey) seenRowKeys.add(rowKey)
      combined.push(item)
    }

    existing.forEach((item, idx) => registerItem(item, idx))
    csv.forEach((item, idx) => registerItem(item, idx + existing.length))
    parent.forEach((item: any, idx: number) => registerItem(item, idx + existing.length + csv.length))

    return combined.map((item) => {
      if (typeof item?.id === 'number' && existingActiveMap.has(item.id)) {
        const isActive = existingActiveMap.get(item.id)!
        return { ...item, is_active: isActive, activo: isActive }
      }
      return item
    })
  }, [existingData, csvData, parentCsvData])

  const { handleFileChange, evaluateAvailableSlots, clearLimitWarningIfNeeded } = useCsvFileProcessor({
    productCategory,
    coachId,
    activityId,
    existingData,
    csvData,
    planLimits,
    setFile,
    setLoading,
    updateErrorState,
    setResult,
    setLimitWarning,
    setUploadedFiles,
    setCsvData,
    parentSetCsvData,
    parentCsvData,
    fileInputRef,
    TEMPLATE_ERROR_MESSAGE
  })

  const {
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
  } = useCsvActions({
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
  })

  // Recargar datos cuando cambia productCategory (modo genérico)
  useEffect(() => {
    if (!coachId || coachId === '') return
    if (activityId === 0) {
      if (isLoadingDataRef.current) return
      isLoadingDataRef.current = true
      setCsvData([])
      setExistingData([])
      setExerciseUsage({})
      try {
        sessionStorage.removeItem(`activities_draft_${activityId}`)
        sessionStorage.removeItem(`activities_draft_${activityId}_interacted`)
      } catch (error) {
        console.warn('⚠️ No se pudo limpiar sessionStorage:', error)
      }
      loadExistingData().finally(() => {
        isLoadingDataRef.current = false
      })
    }
  }, [productCategory, activityId, coachId, loadExistingData])

  // Cargar datos existentes al montar el componente
  useEffect(() => {
    if (activityId === 0) return
    if (justDeletedRef.current) {
      justDeletedRef.current = false
      hasUserInteractedRef.current = true
      return
    }
    if (parentCsvData === undefined) {
      if (isLoadingDataRef.current) return
      isLoadingDataRef.current = true
      try {
        sessionStorage.removeItem(`activities_draft_${activityId}`)
        sessionStorage.removeItem(`activities_draft_${activityId}_interacted`)
      } catch (error) {
        console.warn('⚠️ No se pudo limpiar sessionStorage:', error)
      }
      hasUserInteractedRef.current = false
      if (activityId && activityId > 0) {
        loadExistingData().finally(() => {
          isLoadingDataRef.current = false
        })
      } else {
        isLoadingDataRef.current = false
      }
      return
    }

    const hasInteracted = activityId !== 0 ? sessionStorage.getItem(`activities_draft_${activityId}_interacted`) === 'true' : false

    if (parentCsvData && parentCsvData.length > 0) {
      hasUserInteractedRef.current = true
      return
    }

    if (parentCsvData.length === 0) {
      if (hasInteracted || hasUserInteractedRef.current) {
        hasUserInteractedRef.current = true
        setExistingData([])
        setCsvData([])
        return
      }
    }

    if (activityId !== 0) {
      try {
        const saved = sessionStorage.getItem(`activities_draft_${activityId}`)
        if (saved !== null) {
          const parsed = JSON.parse(saved)
          if (Array.isArray(parsed)) {
            hasUserInteractedRef.current = true
            setCsvData(parsed)
            if (parentSetCsvData) parentSetCsvData(parsed)
            setExistingData([])
            return
          }
        }
      } catch (error) {
        console.error('❌ Error cargando desde sessionStorage:', error)
      }
    }

    if (activityId === 0) {
      if (parentCsvData.length === 0 && !hasInteracted && !hasUserInteractedRef.current && !isLoadingDataRef.current) {
        loadExistingData()
      }
    } else if (activityId && activityId > 0) {
      if (parentCsvData.length === 0 && !hasInteracted && !hasUserInteractedRef.current && !isLoadingDataRef.current) {
        loadExistingData()
      }
      else if (parentCsvData.length > 0 && !hasInteracted && !hasUserInteractedRef.current && !isLoadingDataRef.current) {
        loadExistingData()
      }
    }
  }, [activityId, parentCsvData, loadExistingData, parentSetCsvData])

  // Persistir borrador al cambiar
  useEffect(() => {
    try {
      sessionStorage.setItem(`activities_draft_${activityId}`, JSON.stringify(csvData))
      sessionStorage.setItem(`activities_draft_${activityId}_interacted`, 'true')
      hasUserInteractedRef.current = true
    } catch (error) {
      console.error('❌ Error guardando en sessionStorage:', error)
    }
  }, [csvData, activityId])

  useEffect(() => {
    if (planLimitsProp) {
      setPlanLimits({ activitiesLimit: planLimitsProp.activitiesLimit || 100 })
    }
  }, [planLimitsProp])

  // Cargar límites del plan si no vinieron desde el padre
  useEffect(() => {
    if (planLimitsProp || !coachId || coachId === '') return
    const loadPlanLimits = async () => {
      try {
        const response = await fetch('/api/coach/plan-limits')
        if (response.ok) {
          const result = await response.json()
          if (result.success) {
            setPlanLimits({
              activitiesLimit: result.limits.activitiesPerProduct
            })
          }
        }
      } catch (error) {
        console.error('Error cargando límites del plan:', error)
      }
    }
    loadPlanLimits()
  }, [planLimitsProp, coachId])

  useEffect(() => {
    if (justDeletedRef.current) return
    try {
      const saved = sessionStorage.getItem(`activities_draft_${activityId}`)
      if (saved !== null) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed)) {
          if (JSON.stringify(csvData) !== JSON.stringify(parsed)) {
            setCsvData(parsed)
            if (parentSetCsvData) parentSetCsvData(parsed)
            return
          }
        }
      }
    } catch (error) {
      console.error('❌ Error verificando sessionStorage en sincronización:', error)
    }

    if (parentCsvData === undefined) return

    if (parentCsvData && parentCsvData.length === 0) {
      if (!loadingExisting && existingData.length === 0 && csvData.length === 0) {
        setCsvData([])
        setExistingData([])
      }
      return
    }

    setCsvData(parentCsvData as any)

    const idsInParent = new Set(
      parentCsvData
        .map((row: any) => row?.id)
        .filter((id: any) => id !== undefined && id !== null)
        .map((id: any) => String(id))
    )

    setExistingData(prev => {
      if (prev.length === 0 && parentCsvData.length > 0) {
        const existingItems = parentCsvData.filter((row: any) => row?.isExisting === true)
        if (existingItems.length > 0) return existingItems
      }
      if (idsInParent.size === 0 && parentCsvData.length === 0) return []
      if (idsInParent.size < prev.length) {
        return prev.filter(item => {
          const id = (item as any)?.id
          return id !== undefined && id !== null && idsInParent.has(String(id))
        })
      }
      return prev
    })
  }, [parentCsvData, activityId, loadingExisting])

  const handleAssignVideo = () => setShowMediaSourceModal(true)
  const handleDownloadTemplate = () => generateCsvTemplate({ productCategory: productCategory as any })

  // handleRemoveSelected moved to hook

  // handleReactivateSelected moved to hook

  // Redundant video/manual and exercise handlers removed

  // Función para normalizar nombres (quitar tildes, mayúsculas, espacios extra)
  const getVideoDisplayName = (
    fileName?: string,
    url?: string,
    bunnyVideoId?: string | null
  ): string => {
    const extractBunnyGuidFromUrl = (raw?: string): string | null => {
      if (!raw || typeof raw !== 'string') return null
      try {
        const guidMatch = raw.match(/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i)
        return guidMatch?.[1] || null
      } catch {
        return null
      }
    }

    const bunnyIdRaw = typeof bunnyVideoId === 'string' ? bunnyVideoId.trim() : ''
    const bunnyIdFromUrl = extractBunnyGuidFromUrl(url)
    const bunnyId = bunnyIdRaw || bunnyIdFromUrl || ''

    if (bunnyId && bunnyVideoTitles[bunnyId]) {
      return bunnyVideoTitles[bunnyId]
    }

    const cleanedFileName = typeof fileName === 'string' ? fileName.trim() : ''
    const looksSynthetic =
      cleanedFileName.startsWith('video-') ||
      /^\d{10,}_.+/.test(cleanedFileName) ||
      cleanedFileName.startsWith('manual-')

    if (cleanedFileName && !looksSynthetic) return cleanedFileName
    if (!url) return ''

    try {
      const urlParts = url.split('/')
      const lastPart = urlParts[urlParts.length - 1]
      if (lastPart) {
        const clean = lastPart.split('?')[0]
        return clean || 'Video'
      }
    } catch {
      // ignore
    }

    return 'Video'
  }

  // Cargar títulos Bunny desde el mismo endpoint que usa Almacenamiento
  useEffect(() => {
    const loadBunnyTitles = async () => {
      try {
        const res = await fetch('/api/coach/storage-files', { credentials: 'include' })
        const data = await res.json()
        if (!res.ok || !data?.success) return

        const next: Record<string, string> = {}
        const files = Array.isArray(data.files) ? data.files : []
        for (const f of files) {
          if (!f || f.concept !== 'video') continue
          if (typeof f.fileId !== 'string' || typeof f.fileName !== 'string') continue
          next[f.fileId] = f.fileName
        }
        setBunnyVideoTitles(next)
      } catch {
        // ignore
      }
    }

    loadBunnyTitles()
  }, [])

  const withNormalizedExerciseType = (item: any) => {
    if (!item) return item
    const normalizedType = normalizeExerciseType(item['Tipo de Ejercicio'] || item.tipo_ejercicio || item.tipo || '')
    if (item['Tipo de Ejercicio'] === normalizedType && item.tipo_ejercicio === normalizedType) {
      return item
    }
    return {
      ...item,
      'Tipo de Ejercicio': normalizedType,
      tipo_ejercicio: normalizedType
    }
  }

  // Función para obtener color según tipo de ejercicio - Misma paleta que en paso 5
  const getExerciseTypeColor = (type: string): string => {
    const normalized = normalizeExerciseType(type)
    const colors: { [key: string]: string } = {
      fuerza: 'bg-orange-200',
      cardio: 'bg-orange-300',
      hiit: 'bg-orange-400',
      movilidad: 'bg-rose-300',
      flexibilidad: 'bg-pink-300',
      equilibrio: 'bg-pink-200',
      funcional: 'bg-rose-200',
      general: 'bg-orange-300'
    }
    return colors[normalized] || colors.general
  }

  const getExerciseTypeLabel = (type: string): string => {
    const normalized = normalizeExerciseType(type)
    const labels: { [key: string]: string } = {
      fuerza: 'Fuerza',
      cardio: 'Cardio',
      hiit: 'HIIT',
      movilidad: 'Movilidad',
      flexibilidad: 'Flexibilidad',
      equilibrio: 'Equilibrio',
      funcional: 'Funcional',
      general: 'General'
    }
    return labels[normalized] || (type || '').toString()
  }

  // Función para obtener color según tipo de comida en nutrición
  // Usamos la misma paleta naranja/rosa que en fitness.
  const getNutritionTypeColor = (rawType: string): string => {
    const type = (rawType || '').toString().toLowerCase().trim()
    if (type.includes('desayuno')) return 'bg-orange-200'
    if (type.includes('snack') || type.includes('colación') || type.includes('colacion')) return 'bg-orange-300'
    if (type.includes('almuerzo')) return 'bg-orange-400'
    if (type.includes('cena')) return 'bg-rose-300'
    // Por defecto, un naranja intermedio
    return 'bg-orange-300'
  }

  useEffect(() => {
    if (mode !== 'existentes' || !coachId || coachId === '') {
      if (selectedExisting !== '') {
        setSelectedExisting('')
      }
      return
    }

    const loadCatalog = async () => {
      try {
        const response = await fetch(`/api/existing-exercises?category=${productCategory}`)
        const json = await response.json()

        if (!response.ok || json?.success === false) {
          console.error('❌ Error cargando catálogo de existentes:', json?.error || response.statusText)
          setExistingCatalog([])
          return
        }

        const catalogItems = (json?.exercises || [])
          .map((item: any) => {
            if (productCategory === 'nutricion') {
              return {
                ...item,
                name: item?.name || item?.nombre || item?.nombre_plato || '',
                descripcion: item?.descripcion ?? item?.receta ?? '',
                receta: item?.receta ?? '',
                calorias: item?.calorias ?? '',
                proteinas: item?.proteinas ?? '',
                carbohidratos: item?.carbohidratos ?? '',
                grasas: item?.grasas ?? '',
                ingredientes: item?.ingredientes ?? '',
                porciones: item?.porciones ?? '',
                minutos: item?.minutos ?? '',
                video_url: item?.video_url ?? ''
              }
            }

            const detalleSeries = (() => {
              const raw = item?.detalle_series
              if (!raw) return ''
              if (typeof raw === 'string') return raw
              if (Array.isArray(raw)) {
                return raw
                  .map((serie: any) => `(${serie?.peso ?? ''}-${serie?.repeticiones ?? ''}-${serie?.series ?? ''})`)
                  .join(';')
              }
              if (typeof raw === 'object') {
                try {
                  const seriesArray = Array.isArray((raw as any).series) ? (raw as any).series : Object.values(raw as any)
                  return Array.isArray(seriesArray)
                    ? seriesArray
                      .map((serie: any) => `(${serie?.peso ?? ''}-${serie?.repeticiones ?? ''}-${serie?.series ?? ''})`)
                      .join(';')
                    : ''
                } catch {
                  return ''
                }
              }
              return ''
            })()

            const normalizedType = normalizeExerciseType(item?.tipo_ejercicio || item?.tipo || '')

            return {
              ...item,
              name: item?.name || item?.nombre_ejercicio || '',
              descripcion: item?.descripcion ?? '',
              duracion_min: item?.duracion_min ?? '',
              tipo_ejercicio: normalizedType,
              nivel_intensidad: item?.nivel_intensidad ?? item?.intensidad ?? '',
              equipo_necesario: item?.equipo_necesario ?? item?.equipo ?? '',
              detalle_series: detalleSeries,
              partes_cuerpo: item?.partes_cuerpo ?? item?.body_parts ?? '',
              calorias: item?.calorias ?? '',
              video_url: item?.video_url ?? ''
            }
          })
          .filter((item: any) => !!normalizeName(item?.name))

        setExistingCatalog(catalogItems)
      } catch (error) {
        console.error('❌ Error cargando catálogo de existentes:', error)
        setExistingCatalog([])
      }
    }

    loadCatalog()
  }, [mode, productCategory, coachId])

  // Combinar datos existentes y nuevos para mostrar
  // IMPORTANTE: Preservar existingData siempre, luego agregar csv y parent
  // Evitar duplicar filas que están tanto en csvData como en parentCsvData
  // Detectar duplicados por nombre normalizado
  const currentCatalogNames = useMemo(() => {
    const names = new Set<string>()
    allData.forEach(item => {
      const normalized = normalizeName(getExerciseName(item))
      if (normalized) names.add(normalized)
    })
    return names
  }, [allData])

  const filteredCatalog = existingCatalog.filter(item => {
    const normalized = normalizeName(item?.name)
    if (!normalized) return false
    return !currentCatalogNames.has(normalized)
  })

  useEffect(() => {
    if (selectedExisting === '') return
    const index = parseInt(selectedExisting, 10)
    if (
      filteredCatalog.length === 0 ||
      Number.isNaN(index) ||
      index < 0 ||
      index >= filteredCatalog.length
    ) {
      setSelectedExisting('')
    }
  }, [filteredCatalog, selectedExisting])

  const duplicateNames = (() => {
    const nameMap = new Map<string, { original: string, indices: number[] }>()

    allData.forEach((item, index) => {
      const name = getExerciseName(item)
      const normalized = normalizeName(name)

      if (normalized) {
        if (!nameMap.has(normalized)) {
          nameMap.set(normalized, { original: name, indices: [] })
        }
        nameMap.get(normalized)!.indices.push(index)
      }
    })

    // Filtrar solo los que tienen más de una ocurrencia
    const duplicates: string[] = []
    nameMap.forEach((value, normalized) => {
      if (value.indices.length > 1) {
        duplicates.push(value.original)
      }
    })

    return duplicates
  })()

  // Paginación
  const totalPages = Math.ceil(allData.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedData = allData.slice(startIndex, endIndex)

  // Resetear página cuando cambian los datos
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages)
    }
  }, [allData.length, totalPages])

  // Debug: Log de datos actuales
  // console.log('🔍 CSVManagerEnhanced - Estado actual:', {
  //   csvDataLength: csvData.length,
  //   parentCsvDataLength: parentCsvData?.length || 0,
  //   existingDataLength: existingData.length,
  //   allDataLength: allData.length,
  //   selectedRowsSize: selectedRows.size,
  //   duplicatesCount: duplicateNames.length
  // })
  const totalExercises = allData.length
  // Contar ejercicios nuevos vs existentes en allData
  const newExercises = allData.filter(item => !item.isExisting).length
  const existingCount = allData.filter(item => item.isExisting).length
  const activitiesLimitValue = typeof planLimits?.activitiesLimit === 'number' ? planLimits.activitiesLimit : null
  const exceedsActivitiesLimit = activitiesLimitValue !== null ? allData.length > activitiesLimitValue : false

  return (
    <div className="text-white p-4 w-full max-w-none pb-24">
      {/* Selector de modo */}
      <div className="mb-6 flex justify-center">
        <div className="inline-flex items-center bg-zinc-900/80 border border-zinc-800 rounded-xl p-1 shadow-inner gap-2">
          {([
            { key: 'manual', label: productCategory === 'nutricion' ? 'Crear platos manualmente' : 'Crear ejercicios manualmente' },
            { key: 'csv', label: 'Subir Archivo' }
          ] as const).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setMode(tab.key)}
              className={`px-6 py-2.5 text-sm rounded-lg transition-all ${mode === tab.key
                ? 'bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-md'
                : 'text-zinc-300 hover:text-white hover:bg-zinc-800'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <MediaSelectionModal
        isOpen={showMediaSourceModal}
        onClose={() => setShowMediaSourceModal(false)}
        onMediaSelected={handleVideoSelection}
        mediaType="video"
      />

      {mode === 'csv' && (
        <CsvUploadArea
          onFileSelect={handleFileChange}
          onManualEntrySelect={() => setMode('manual')}
          onDownloadTemplate={handleDownloadTemplate}
          productCategory={productCategory as any}
          mode={mode}
        />
      )}

      {(mode === 'manual' || editingExerciseIndex !== null) && (
        <CsvManualForm
          productCategory={productCategory}
          formState={manualForm as ManualFormState}
          onChange={(field, value) => setManualForm((prev: any) => ({ ...prev, [field]: value }))}
          onSubmit={editingExerciseIndex !== null ? (() => { addManualExercise() }) : addManualExercise}
          onCancel={cancelEdit}
          isEditing={editingExerciseIndex !== null}
          onVideoSelect={handleAssignVideo}
          onRemoveVideo={handleRemoveVideoFromManualForm}
          showAssignedVideoPreview={showAssignedVideoPreview}
        />
      )}

      {uploadedFiles.length > 0 && (
        <div className="mb-4">
          <div className="flex gap-2 pb-2 overflow-x-auto">
            {uploadedFiles.map((uploadedFile, idx) => (
              <div key={idx} className="bg-black border border-[#FF7939]/30 rounded-full px-3 py-1.5 flex items-center gap-2 flex-shrink-0">
                <span className="text-[#FF7939] text-[10px] font-medium whitespace-nowrap">{uploadedFile.name}</span>
                <button onClick={async () => {
                  const timestampToRemove = uploadedFile.timestamp
                  const allCurrentData = [...csvData, ...(parentCsvData || [])]
                  const rowsFromThisFile = allCurrentData.filter(item => item.csvFileTimestamp === timestampToRemove)
                  const rowsWithIds = rowsFromThisFile.filter(item => item.id)
                  const idsToDelete = rowsWithIds.map(item => item.id).filter((id): id is number => id !== undefined)

                  if (idsToDelete.length > 0 && activityId > 0) {
                    const endpoint = productCategory === 'nutricion' ? '/api/delete-nutrition-items' : '/api/delete-exercise-items'
                    await fetch(endpoint, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids: idsToDelete, activityId: activityId }) })
                  }

                  setCsvData(prev => prev.filter(item => !item.csvFileTimestamp || item.csvFileTimestamp !== timestampToRemove))
                  if (parentSetCsvData) parentSetCsvData((parentCsvData || []).filter((item: any) => !item.csvFileTimestamp || item.csvFileTimestamp !== timestampToRemove))
                  setUploadedFiles(prev => prev.filter((_, i) => i !== idx))
                  if ([...csvData, ...(parentCsvData || [])].filter(item => item.csvFileTimestamp && item.csvFileTimestamp !== timestampToRemove).length === 0) updateErrorState(null)
                }} className="text-gray-400 hover:text-red-400"><X className="h-3 w-3" /></button>
              </div>
            ))}
          </div>
        </div>
      )}

      <CsvLimitBar
        allDataLength={allData.length}
        newExercisesCount={newExercises}
        existingCount={existingCount}
        planLimits={planLimits}
        productCategory={productCategory}
      />

      {limitWarning && (
        <div className="mb-4 rounded border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-300">
          {limitWarning}
        </div>
      )}

      {!limitWarning && exceedsActivitiesLimit && activitiesLimitValue !== null && (
        <p className="mb-4 text-xs text-red-400">
          Has superado el límite de ejercicios de tu plan ({activitiesLimitValue}). Quita ejercicios para continuar.
        </p>
      )}

      {loading && <div className="text-center py-8"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500 mr-3 inline-block"></div>Parseando CSV...</div>}
      {loadingExisting && <div className="text-center py-4"><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500 mr-2 inline-block"></div>Cargando datos...</div>}

      {error && (
        <div className="mb-4">
          <p className="text-red-500 text-sm">{error}</p>
          {invalidRows.length > 0 && (
            <div className="mt-2 text-xs text-gray-400 space-y-1">
              <ul className="list-disc pl-4">{invalidRows.map((issue, idx) => <li key={idx}>{issue}</li>)}</ul>
            </div>
          )}
        </div>
      )}

      {result && <div className="text-green-500 mb-6 bg-green-900/20 border border-green-500/50 rounded-lg p-4 flex items-center gap-2"><CheckCircle className="h-5 w-5" /> {result.message}</div>}

      {(csvData.length > 0 || (parentCsvData && parentCsvData.length > 0)) && (
        <div className="flex items-center justify-end gap-4 mb-4">
          <button onClick={() => setShowRulesPanel(true)} className="flex items-center gap-2 text-[#FF7939]">
            <Settings2 className="h-5 w-5" /> Condicionar
            {rulesCount > 0 && <span className="bg-[#FF7939] text-white text-[8px] px-1 rounded-full w-4 h-4 flex items-center justify-center">{rulesCount}</span>}
          </button>

          <button onClick={() => { if (selectedRows.size > 0) setShowMediaSourceModal(true) }} disabled={selectedRows.size === 0} className="text-[#FF7939] disabled:text-gray-500 hover:text-[#FF6B35]">
            <Video className="h-5 w-5" />
          </button>

          <button onClick={handleDeleteSelected} disabled={selectedRows.size === 0} className="text-red-400 disabled:text-gray-500 hover:text-red-300">
            <Trash2 className="h-5 w-5" />
          </button>

          {(() => {
            const selectedItems = Array.from(selectedRows).map(index => allData[index])
            const allInactive = selectedItems.length > 0 && selectedItems.every(item => item.is_active === false)
            if (allInactive) {
              return <button onClick={handleReactivateSelected} disabled={selectedRows.size === 0} className="text-green-400 disabled:text-gray-500 hover:text-green-300"><Power className="h-5 w-5" /></button>
            }
            return <button onClick={handleDeleteSelected} disabled={selectedRows.size === 0} className="text-[#FF7939] disabled:text-gray-500 hover:text-[#FF6B35]"><PowerOff className="h-5 w-5" /></button>
          })()}
        </div>
      )}

      <input ref={videoInputRef} type="file" accept="video/*" className="hidden" onChange={(e) => {
        const file = e.target.files?.[0]
        if (!file) return
        setCsvData(prev => prev.map((row, idx) => selectedRows.has(idx) ? { ...row, video_file_name: file.name } : row))
        e.currentTarget.value = ''
      }} />

      <CsvTable
        data={paginatedData as any[]}
        startIndex={startIndex}
        selectedRows={selectedRows}
        toggleRow={(idx) => {
          const newSet = new Set(selectedRows)
          if (newSet.has(idx)) newSet.delete(idx)
          else newSet.add(idx)
          setSelectedRows(newSet)
          if (parentSetSelectedRows) parentSetSelectedRows(newSet)
        }}
        toggleSelectAll={() => {
          const allIndices = paginatedData.map((_, index) => startIndex + index)
          const allSelected = allIndices.every(index => selectedRows.has(index))
          const newSelected = new Set(selectedRows)
          if (allSelected) allIndices.forEach(idx => newSelected.delete(idx))
          else allIndices.forEach(idx => newSelected.add(idx))
          setSelectedRows(newSelected)
          if (parentSetSelectedRows) parentSetSelectedRows(newSelected)
        }}
        isAllSelected={(() => {
          const allIndices = paginatedData.map((_, index) => startIndex + index)
          return allIndices.length > 0 && allIndices.every(index => selectedRows.has(index))
        })()}
        onEdit={(item, idx) => handleEditExercise(item as any, idx)}
        productCategory={productCategory as any}
        activityId={activityId}
        planLimits={planLimits}
        exerciseUsage={exerciseUsage}
        activityNamesMap={activityNamesMap}
        activityImagesMap={activityImagesMap}
        duplicateNames={duplicateNames}
        loadingExisting={loadingExisting}
      />

      {allData.length > itemsPerPage && (
        <div className="flex items-center justify-center gap-2 mt-4 pb-4">
          <button onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1} className="text-[#FF7939] disabled:text-gray-500 hover:text-[#FF6B35]"><ChevronLeft className="h-5 w-5" /></button>
          <span className="text-gray-400 text-sm">Página {currentPage} de {totalPages}</span>
          <button onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages} className="text-[#FF7939] disabled:text-gray-500 hover:text-[#FF6B35]"><ChevronRight className="h-5 w-5" /></button>
        </div>
      )}

      {renderAfterTable && <div className="flex justify-end mt-3 mb-2">{renderAfterTable}</div>}

      <ConditionalRulesPanel
        isOpen={showRulesPanel}
        onClose={() => setShowRulesPanel(false)}
        productCategory={productCategory as any}
        availableItems={allData}
        productId={activityId > 0 ? activityId : undefined}
        coachId={coachId}
        onSaveRules={(rules: ConditionalRule[]) => {
          setRulesCount(rules.length)
          if (activityId > 0) sessionStorage.setItem(`conditional_rules_${activityId}`, JSON.stringify(rules))
        }}
        initialRules={(() => {
          if (activityId > 0) {
            try { return JSON.parse(sessionStorage.getItem(`conditional_rules_${activityId}`) || '[]') } catch { return [] }
          }
          return []
        })()}
      />
    </div>
  )
}
