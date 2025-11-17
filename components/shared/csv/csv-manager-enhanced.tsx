"use client"

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import Papa from 'papaparse'
import { validateSimpleCSVHeaders, SimpleExerciseData } from '@/lib/data/csv-parser'
import { Button } from '@/components/ui/button'
import { Upload, Download, Trash2, CheckCircle, AlertCircle, Plus, Eye, X, Clock, Flame, Video, PowerOff, Power, ChevronLeft, ChevronRight } from 'lucide-react'
import { VideoSelectionModal, VideoSelectionResult } from '@/components/shared/ui/video-selection-modal'
import { normalizeActivityMap } from '@/lib/utils/exercise-activity-map'

const normalizeCatalogText = (value: string) => (
  value
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
)

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
  const videoInputRef = useRef<HTMLInputElement | null>(null)
  const [showVideoModal, setShowVideoModal] = useState(false)
  const [existingCatalog, setExistingCatalog] = useState<any[]>([])
  const [selectedExisting, setSelectedExisting] = useState('')
  const [planLimits, setPlanLimits] = useState<{ planType?: string, activitiesLimit?: number } | null>(planLimitsProp)
  const updateErrorState = useCallback((message: string | null, rows: string[] = []) => {
    setError(message)
    setInvalidRows(rows)
  }, [])
  const getCurrentExerciseTotal = useCallback(() => {
    if (parentCsvData && parentCsvData.length > 0) return parentCsvData.length
    if (csvData.length > 0) return csvData.length
    return existingData.length
  }, [parentCsvData, csvData, existingData])

  const evaluateAvailableSlots = useCallback((requested: number) => {
    const limit = planLimits?.activitiesLimit
    if (!limit) {
      return { allowed: requested, blocked: 0 }
    }
    const currentTotal = getCurrentExerciseTotal()
    const available = limit - currentTotal
    if (available <= 0) {
      return { allowed: 0, blocked: requested }
    }
    const allowed = Math.min(requested, available)
    const blocked = Math.max(requested - allowed, 0)
    return { allowed, blocked }
  }, [planLimits?.activitiesLimit, getCurrentExerciseTotal])

  const clearLimitWarningIfNeeded = useCallback(() => {
    if (limitWarning) {
      setLimitWarning(null)
    }
  }, [limitWarning])

  const [uploadedFiles, setUploadedFiles] = useState<Array<{ name: string, timestamp: number }>>([])
  const [mode, setMode] = useState<'manual' | 'csv' | 'existentes'>('existentes')
  const [editingExerciseIndex, setEditingExerciseIndex] = useState<number | null>(null)
  const [manualForm, setManualForm] = useState({
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
    proteinas: '',
    carbohidratos: '',
    grasas: '',
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
  const [bodyParts, setBodyParts] = useState<string[]>([])
  const [bodyPartInput, setBodyPartInput] = useState('')
  const [seriePeso, setSeriePeso] = useState('')
  const [serieReps, setSerieReps] = useState('')
  const [serieSeries, setSerieSeries] = useState('')
  const [seriesList, setSeriesList] = useState<Array<{peso:number, repeticiones:number, series:number}>>([])
  const [equipoList, setEquipoList] = useState<string[]>([])
  const [equipoInput, setEquipoInput] = useState('')
  const topScrollRef = useRef<HTMLDivElement | null>(null)
  const bottomScrollRef = useRef<HTMLDivElement | null>(null)
  const topScrollbarInnerRef = useRef<HTMLDivElement | null>(null)
  const exerciseTypeOptions = [
    { value: 'fuerza', label: 'Fuerza' },
    { value: 'cardio', label: 'Cardio' },
    { value: 'hiit', label: 'HIIT' },
    { value: 'movilidad', label: 'Movilidad' },
    { value: 'flexibilidad', label: 'Flexibilidad' },
    { value: 'equilibrio', label: 'Equilibrio' },
    { value: 'funcional', label: 'Funcional' }
  ]
  const allowedExerciseTypes = exerciseTypeOptions.map(option => option.value)
  const intensityLevels = ['Bajo','Medio','Alto']
  const bodyPartsOptions = [
    'Pecho',
    'Espalda',
    'Hombros',
    'Brazos',
    'Antebrazos',
    'Core',
    'Glúteos',
    'Piernas',
    'Cuádriceps',
    'Isquiotibiales',
    'Pantorrillas',
    'Caderas',
    'Cuerpo Completo'
  ]
  const bodyPartSynonyms = useMemo<Record<string, string[]>>(() => ({
    Pecho: ['pecho', 'pechos', 'chest', 'pectorales', 'pectoral'],
    Espalda: ['espalda', 'espaldas', 'back', 'dorsal', 'dorsales', 'lats'],
    Hombros: ['hombro', 'hombros', 'shoulder', 'shoulders', 'deltoides', 'deltoids'],
    Brazos: ['brazo', 'brazos', 'arms', 'arm', 'bíceps', 'biceps', 'tríceps', 'triceps', 'upper arm'],
    Antebrazos: ['antebrazo', 'antebrazos', 'forearm', 'forearms'],
    Core: ['core', 'abdomen', 'abdominales', 'abs', 'tronco', 'midsection'],
    Glúteos: ['gluteos', 'gluteo', 'glute', 'glutes', 'gluteus', 'trasero'],
    Piernas: ['piernas', 'pierna', 'legs', 'leg', 'tren inferior', 'lower body'],
    Cuádriceps: ['cuadricep', 'cuadriceps', 'quads', 'quad', 'recto femoral'],
    Isquiotibiales: ['isquiotibial', 'isquiotibiales', 'hamstring', 'hamstrings'],
    Pantorrillas: ['pantorrilla', 'pantorrillas', 'gemelos', 'calf', 'calves', 'gastrocnemio', 'soleo', 'soleus', 'gastrocnemius'],
    Caderas: ['cadera', 'caderas', 'hip', 'hips'],
    'Cuerpo Completo': ['cuerpo completo', 'full body', 'total body', 'todo el cuerpo']
  }), [])
  const equipmentOptions = ['Barra','Mancuernas','Banco','Rack','Bandas','Kettlebell','Máquinas','Mat de yoga','Chaleco','Escalera de agilidad']
  const NONE_VALUES = useMemo(() => new Set([
    'ninguno','ninguna','ningun','ninguno/a','ninguna/o','ningun@','ningunx',
    'none','sin','sin equipo','sin equipamiento','n/a','na','no aplica','ning'
  ].map(normalizeCatalogText)), [])
  
  const bodyPartsLookup = useMemo(() => {
    const map = new Map<string, string>()

    const addEntry = (rawValue: string, canonical: string) => {
      const normalized = normalizeCatalogText(rawValue)
      if (!normalized) return
      if (!map.has(normalized)) {
        map.set(normalized, canonical)
      }
    }

    bodyPartsOptions.forEach(part => {
      addEntry(part, part)

      const normalized = normalizeCatalogText(part)
      const singular = normalized.replace(/(es|s)$/,'')
      if (singular && singular !== normalized) {
        addEntry(singular, part)
      }

      const synonyms = bodyPartSynonyms[part] || []
      synonyms.forEach(syn => {
        addEntry(syn, part)
        const synNormalized = normalizeCatalogText(syn)
        const synSingular = synNormalized.replace(/(es|s)$/,'')
        if (synSingular && synSingular !== synNormalized) {
          addEntry(synSingular, part)
        }
      })
    })

    return map
  }, [bodyPartsOptions, bodyPartSynonyms])

  const equipmentLookup = useMemo(() => {
    const map = new Map<string, string>()
    equipmentOptions.forEach(item => {
      map.set(normalizeCatalogText(item), item)
    })
    return map
  }, [equipmentOptions])

  const parseCatalogEntries = useCallback((raw: any): string[] => {
    if (!raw) return []
    if (Array.isArray(raw)) return raw.map(String)
    return raw
      .toString()
      .split(/;|,|\n/)
      .map((entry: string) => entry.trim())
      .filter(Boolean)
  }, [])

  const normalizeIntensityValue = useCallback((raw: any) => {
    const original = raw?.toString?.().trim() ?? ''
    if (!original) {
      return { value: '', issue: null }
    }
    const normalized = normalizeCatalogText(original)
    if (NONE_VALUES.has(normalized)) {
      return { value: '', issue: null }
    }

    const altoValues = ['alto','alta','high','intenso','intensa','intensidad alta']
    const medioValues = ['medio','media','moderado','moderada','medium','intermedio','intermedia']
    const bajoValues = ['bajo','baja','low','suave','leve']

    if (altoValues.includes(normalized)) return { value: 'Alto', issue: null }
    if (medioValues.includes(normalized)) return { value: 'Medio', issue: null }
    if (bajoValues.includes(normalized)) return { value: 'Bajo', issue: null }

    return { value: original, issue: `Intensidad no permitida: "${original}"` }
  }, [NONE_VALUES])

  const normalizeBodyParts = useCallback((raw: any) => {
    const entries = parseCatalogEntries(raw)
    const valid: string[] = []
    const invalid: string[] = []

    entries.forEach(entry => {
      const normalized = normalizeCatalogText(entry)
      if (!normalized || NONE_VALUES.has(normalized)) {
        return
      }
      let match = bodyPartsLookup.get(normalized)
      if (!match) {
        const singularCandidate = normalized.replace(/(es|s)$/,'')
        if (singularCandidate && singularCandidate !== normalized) {
          match = bodyPartsLookup.get(singularCandidate)
        }
      }
      if (match) {
        if (!valid.includes(match)) {
          valid.push(match)
        }
      } else {
        invalid.push(entry)
      }
    })

    return { valid, invalid }
  }, [parseCatalogEntries, NONE_VALUES, bodyPartsLookup])

  const normalizeEquipment = useCallback((raw: any) => {
    const entries = parseCatalogEntries(raw)
    const valid: string[] = []
    const invalid: string[] = []

    entries.forEach(entry => {
      const normalized = normalizeCatalogText(entry)
      if (!normalized || NONE_VALUES.has(normalized)) {
        return
      }
      const match = equipmentLookup.get(normalized)
      if (match) {
        if (!valid.includes(match)) {
          valid.push(match)
        }
      } else {
        invalid.push(entry)
      }
    })

    return { valid, invalid }
  }, [parseCatalogEntries, NONE_VALUES, equipmentLookup])
  const mealTypes = ['Desayuno', 'Almuerzo', 'Cena', 'Snack', 'Colación']
  const nutritionCategories = ['Proteína', 'Carbohidrato', 'Grasa', 'Fibra', 'Vitaminas', 'Minerales']
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 15

  // Cargar datos existentes al montar el componente
  useEffect(() => {
    if (activityId && activityId > 0) {
      loadExistingData()
    } else {
      setExistingData([])
    }
    // Cargar borrador desde sessionStorage
    try {
      const saved = sessionStorage.getItem(`activities_draft_${activityId}`)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed)) setCsvData(parsed)
      }
    } catch {}
  }, [activityId])

  // Persistir borrador al cambiar
  useEffect(() => {
    try {
      sessionStorage.setItem(`activities_draft_${activityId}`,(JSON.stringify(csvData)))
    } catch {}
  }, [csvData, activityId])

  useEffect(() => {
    setPlanLimits(planLimitsProp)
  }, [planLimitsProp])

  // Cargar límites del plan si no vinieron desde el padre
  useEffect(() => {
    if (planLimitsProp) return
    const loadPlanLimits = async () => {
      try {
        const response = await fetch('/api/coach/plan-limits')
        if (!response.ok) {
          console.warn('⚠️ No se pudieron cargar los límites del plan (status', response.status, ')')
          return
        }
        const result = await response.json()
        if (result.success) {
          setPlanLimits({
            planType: result.planType,
            activitiesLimit: result.limits.activitiesPerProduct
          })
        }
      } catch (error) {
        console.error('Error cargando límites del plan:', error)
      }
    }
    loadPlanLimits()
  }, [planLimitsProp])

  useEffect(() => {
    if (!parentCsvData) {
      setCsvData([])
      setExistingData([])
      console.log('🔄 CSVManagerEnhanced - Estado sincronizado desde padre (csvData vaciado)')
      if (typeof window !== 'undefined') {
        ;(window as any).__CSV_MANAGER_PARENT__ = []
      }
      return
    }

    setCsvData(parentCsvData as any)
    if (typeof window !== 'undefined') {
      ;(window as any).__CSV_MANAGER_PARENT__ = parentCsvData
    }

    console.log(
      '🧾 CSVManagerEnhanced - parentCsvData recibido',
      (parentCsvData as any[])
        ?.slice(0, 3)
        .map((row, idx) => ({
          idx,
          id: row?.id,
          nombre:
            row?.['Nombre de la Actividad'] ??
            row?.nombre_ejercicio ??
            row?.Nombre ??
            row?.name ??
            null,
          video_file_name: row?.video_file_name,
          video_url: row?.video_url?.slice?.(0, 60)
        })) ?? []
    )

    const idsInParent = new Set(
      parentCsvData
        .map((row: any) => row?.id)
        .filter((id: any) => id !== undefined && id !== null)
        .map((id: any) => String(id))
    )

    setExistingData(prev => {
      if (idsInParent.size === 0) {
        return []
      }
      return prev.filter(item => {
        const id = (item as any)?.id
        if (id === undefined || id === null) {
          return false
        }
        return idsInParent.has(String(id))
      })
    })

    console.log('🔄 CSVManagerEnhanced - Estado actual sincronizado desde padre (csvData)', parentCsvData.length)
  }, [parentCsvData])

  const loadExistingData = async () => {
    if (!activityId || activityId <= 0) {
      console.log('🚫 No cargando datos existentes - activityId inválido:', activityId)
      return
    }
    console.log('🔄 Cargando datos existentes para activityId:', activityId)
    setLoadingExisting(true)
    try {
      const endpoint = productCategory === 'nutricion' 
        ? `/api/activity-nutrition/${activityId}`
        : `/api/activity-exercises/${activityId}`
      const response = await fetch(endpoint)
      const result = await response.json()
      
      if (result.success) {
        console.log('✅ Datos existentes cargados:', result.data.length, 'ejercicios')
        // Datos cargados correctamente
        
        // Transformar datos existentes al formato esperado por la tabla
        let transformedExistingData = result.data.map((exercise: any) => {
          const activityAssignments = normalizeActivityMap(
            exercise.activity_assignments ?? exercise.activity_map ?? exercise.activity_id
          )
          const normalizedType = normalizeExerciseType(exercise.tipo || exercise['Tipo de Ejercicio'] || '')
          return {
          ...exercise,
          'Nombre de la Actividad': exercise.nombre_ejercicio || exercise['Nombre de la Actividad'] || exercise.nombre || '',
          'Descripción': exercise.descripcion || exercise['Descripción'] || '',
          'Duración (min)': exercise.duracion_min || exercise['Duración (min)'] || '',
          'Tipo de Ejercicio': normalizedType,
          'Nivel de Intensidad': exercise.intensidad || exercise['Nivel de Intensidad'] || '',
          'Equipo Necesario': exercise.equipo || exercise['Equipo Necesario'] || '',
          'Detalle de Series (peso-repeticiones-series)': exercise.detalle_series || exercise['Detalle de Series (peso-repeticiones-series)'] || '',
          'Partes del Cuerpo': exercise.body_parts || exercise['Partes del Cuerpo'] || '',
          'Calorías': exercise.calorias || exercise['Calorías'] || '',
          isExisting: true,
          is_active: exercise.is_active !== false,
          activo: exercise.is_active !== false,
          tipo_ejercicio: normalizedType,
          activity_assignments: activityAssignments,
          video_file_name: exercise.video_file_name || exercise['video_file_name'] || null
        }
        })
        
        console.log('🔄 Datos existentes transformados:', transformedExistingData.length, 'ejercicios')
        console.log('📝 Primer ejercicio transformado:', transformedExistingData[0])
        
        const planningActiveMap = new Map<number, boolean>()
        if (activityId > 0) {
          const activityKey = String(activityId)
          transformedExistingData = transformedExistingData.filter((item: any) => {
            const assignments = item?.activity_assignments || {}
            return assignments && typeof assignments === 'object' && activityKey in assignments
          })
        }

        if (planningActiveMap.size > 0) {
          transformedExistingData = transformedExistingData.map((item: any) => {
            const idRaw = item?.id
            const numericId = typeof idRaw === 'number' ? idRaw : (typeof idRaw === 'string' ? parseInt(idRaw, 10) : NaN)
            if (!Number.isNaN(numericId) && planningActiveMap.has(numericId)) {
              const active = planningActiveMap.get(numericId)!
              return {
                ...item,
                is_active: active,
                activo: active
              }
            }
            return item
          })
        }
        
        setExistingData(transformedExistingData)
        
        // Notificar al padre que se cargaron datos existentes
        // Solo sobrescribir si no hay datos persistentes con videos O datos del CSV
        if (parentSetCsvData) {
          console.log('📤 Notificando al padre sobre datos existentes:', transformedExistingData.length, 'ejercicios')
          
          // Verificar si hay datos persistentes con videos
          const hasPersistentVideos = parentCsvData && parentCsvData.some((row: any) => row.video_url)
          
          // Verificar si hay datos del CSV cargados (más de 1 fila indica CSV cargado)
          const hasCsvData = parentCsvData && parentCsvData.length > 1
          
          
          if (hasPersistentVideos || hasCsvData) {
            console.log('🎥 Manteniendo datos persistentes (videos o CSV), no sobrescribiendo')
            // No sobrescribir, mantener los datos persistentes
            // Pero sí agregar los existentes que no estén ya en el padre
            const latestExistingMap = new Map(
              transformedExistingData.map((item: any) => [String(item.id), item])
            )
            const updatedParent = (parentCsvData || []).map((item: any) => {
              const key = item && item.id !== undefined ? String(item.id) : null
              if (item && item.isExisting && key && latestExistingMap.has(key)) {
                  const latest = latestExistingMap.get(key) as any
                  return {
                    ...item,
                    is_active: latest.is_active,
                    activo: latest.activo,
                    video_url: latest.video_url ?? item.video_url ?? '',
                    bunny_video_id: latest.bunny_video_id ?? item.bunny_video_id ?? '',
                    bunny_library_id: latest.bunny_library_id ?? item.bunny_library_id ?? '',
                    video_thumbnail_url: latest.video_thumbnail_url ?? item.video_thumbnail_url ?? '',
                    video_file_name: latest.video_file_name ?? item.video_file_name ?? ''
                  }
              }
              return item
            })
            // Pero sí agregar los existentes que no estén ya en el padre
            const existingIds = new Set(
              updatedParent
                .filter((item: any) => item.isExisting && item.id !== undefined)
                .map((item: any) => String(item.id))
            )
            const newExistingData = transformedExistingData.filter((item: any) => !existingIds.has(String(item.id)))
            if (newExistingData.length > 0) {
              const combinedData = [...updatedParent, ...newExistingData]
              parentSetCsvData(combinedData)
              console.log('➕ Agregados', newExistingData.length, 'ejercicios existentes nuevos al padre')
          } else {
              parentSetCsvData(updatedParent)
            }
          } else {
            // Cargando datos existentes transformados
            parentSetCsvData(transformedExistingData)
          }
        }
      } else {
        console.log('❌ Error cargando datos existentes:', result.error)
      }
    } catch (error) {
      console.error('❌ Error cargando datos existentes:', error)
    } finally {
      setLoadingExisting(false)
    }
  }

  const TEMPLATE_ERROR_MESSAGE = 'Archivo inválido. Descargá la plantilla de ejemplo.'

  type ParsedResult = {
    data: any[]
    meta: { fields?: string[] }
    errors?: Array<{ message?: string }>
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputElement = e.target
    const resetInput = () => {
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      inputElement.value = ''
    }

    const selectedFile = inputElement.files?.[0]
    if (!selectedFile) return

    console.log('📁 ARCHIVO SELECCIONADO:', {
      name: selectedFile.name,
      size: selectedFile.size,
      type: selectedFile.type,
      lastModified: new Date(selectedFile.lastModified).toISOString()
    })

    const extension = selectedFile.name.split('.').pop()?.toLowerCase() || ''
    const isCSV = extension === 'csv'
    const isExcel = extension === 'xlsx' || extension === 'xls'
    if (!isCSV && !isExcel) {
      console.log('❌ FORMATO NO SOPORTADO:', selectedFile.name)
      updateErrorState('Formato no soportado. Descargá la plantilla de ejemplo y sube un archivo .csv o .xlsx.')
      resetInput()
      return
    }

    setFile(selectedFile)
    updateErrorState(null)
    setResult(null)
    setLoading(true)

    const processParsedResults = (parsed: ParsedResult, source: 'csv' | 'excel') => {
      const errors = parsed.errors || []
      const rows = parsed.data || []
      const headers = parsed.meta?.fields || []

      console.log(`📊 ${source.toUpperCase()} procesado:`, {
        totalRows: rows.length,
        headers,
        errors: errors.length
      })

      if (errors.length > 0) {
        console.error('❌ Errores en el parsing:', errors)
        updateErrorState(TEMPLATE_ERROR_MESSAGE)
        resetInput()
        return
      }
      if (rows.length === 0) {
        console.log('❌ Archivo vacío')
        updateErrorState('El archivo está vacío')
        resetInput()
        return
      }

      if (!validateSimpleCSVHeaders(headers, productCategory)) {
        updateErrorState(TEMPLATE_ERROR_MESSAGE)
        resetInput()
        return
      }

      const fileTimestamp = Date.now()
      const validationMessages: string[] = []
      const parsedData = rows.map((item, index) => {
        const normalizedType = normalizeExerciseType(item['Tipo de Ejercicio'] || item.tipo_ejercicio || item.tipo || '')
        const { value: normalizedIntensity, issue: intensityIssue } = normalizeIntensityValue(item['Nivel de Intensidad'] || item.nivel_intensidad || item.intensidad || '')
        const { valid: normalizedBodyParts, invalid: invalidBodyParts } = normalizeBodyParts(item['Partes del Cuerpo'] || item.partes_cuerpo || item.body_parts || '')
        const { valid: normalizedEquipment, invalid: invalidEquipment } = normalizeEquipment(item['Equipo Necesario'] || item.equipo_necesario || item.equipo || '')

        const rowIssues: string[] = []
        if (intensityIssue) {
          rowIssues.push(intensityIssue)
        }
        if (invalidBodyParts.length > 0) {
          rowIssues.push(`Partes no permitidas: ${invalidBodyParts.join(', ')}`)
        }
        if (invalidEquipment.length > 0) {
          rowIssues.push(`Equipo no permitido: ${invalidEquipment.join(', ')}`)
        }

        if (rowIssues.length > 0) {
          validationMessages.push(`Fila ${index + 1}: ${rowIssues.join('; ')}`)
        }

        return {
          ...item,
          'Tipo de Ejercicio': normalizedType,
          tipo_ejercicio: normalizedType,
          'Nivel de Intensidad': normalizedIntensity,
          nivel_intensidad: normalizedIntensity,
          intensidad: normalizedIntensity,
          'Partes del Cuerpo': normalizedBodyParts.join('; '),
          partes_cuerpo: normalizedBodyParts.join('; '),
          body_parts: normalizedBodyParts.join('; '),
          'Equipo Necesario': normalizedEquipment.join('; '),
          equipo_necesario: normalizedEquipment.join('; '),
          isExisting: false,
          csvFileTimestamp: fileTimestamp,
          csvFileName: selectedFile.name,
          csvRowId: `${fileTimestamp}-${index}`,
          __validationErrors: rowIssues
        }
      })

      const { allowed, blocked } = evaluateAvailableSlots(parsedData.length)
      if (allowed === 0) {
        setLimitWarning(`Límite de ejercicios (${planLimits?.activitiesLimit}) alcanzado. No se agregaron filas del archivo "${selectedFile.name}".`)
        resetInput()
        return
      }
      if (blocked > 0) {
        setLimitWarning(`Se agregaron ${allowed} ejercicios de "${selectedFile.name}" pero ${blocked} exceden el límite (${planLimits?.activitiesLimit}) y no se cargaron.`)
      } else {
        clearLimitWarningIfNeeded()
      }

      const newData = parsedData.slice(0, allowed)

      const allCurrentData = [...existingData, ...csvData.filter(item => !item.isExisting)]
      const duplicateNamesInNewData: string[] = []
      const nameMap = new Map<string, number>()

      allCurrentData.forEach(item => {
        const name = getExerciseName(item)
        const normalized = normalizeName(name)
        if (normalized) {
          nameMap.set(normalized, (nameMap.get(normalized) || 0) + 1)
        }
      })

      newData.forEach(item => {
        const name = getExerciseName(item)
        const normalized = normalizeName(name)
        if (normalized) {
          const currentCount = nameMap.get(normalized) || 0
          if (currentCount >= 1 && !duplicateNamesInNewData.includes(name)) {
            duplicateNamesInNewData.push(name)
          }
          nameMap.set(normalized, currentCount + 1)
        }
      })

      const errorMessages: string[] = []
      const invalidEntryMessages: string[] = []

      if (duplicateNamesInNewData.length > 0) {
        const allDataForDuplicates = [...allCurrentData, ...newData]
        const duplicateIndices: number[] = []

        duplicateNamesInNewData.forEach(dupName => {
          allDataForDuplicates.forEach((item, idx) => {
            const itemName = getExerciseName(item)
            if (normalizeName(itemName) === normalizeName(dupName)) {
              duplicateIndices.push(idx + 1)
            }
          })
        })

        const sortedIndices = [...new Set(duplicateIndices)].sort((a, b) => a - b)
        const firstIndex = sortedIndices[0]
        const lastIndex = sortedIndices[sortedIndices.length - 1]
        const indicesText = sortedIndices.length === 2
          ? `${firstIndex}-${lastIndex}`
          : sortedIndices.length > 2
            ? `${firstIndex}-${lastIndex}`
            : `${firstIndex}`

        const duplicateMessage = `fila nro ${indicesText} mismo nombre`
        console.warn('Duplicados detectados:', duplicateMessage)
        errorMessages.push(duplicateMessage)
        invalidEntryMessages.push(`Fila ${indicesText}: nombre duplicado`)
      }

      if (validationMessages.length > 0) {
        const issuesSummary = validationMessages.length > 3
          ? `${validationMessages.slice(0, 3).join(' | ')} | ...`
          : validationMessages.join(' | ')
        errorMessages.push(`Validación: ${issuesSummary}`)
        invalidEntryMessages.push(...validationMessages)
      }

      if (errorMessages.length > 0) {
        updateErrorState(errorMessages.join(' | '), invalidEntryMessages)
      } else {
        updateErrorState(null)
      }

      setUploadedFiles(prev => [...prev, { name: selectedFile.name, timestamp: fileTimestamp }])

      setCsvData(prev => {
        const prevNonExisting = prev.filter(item => !item.isExisting)
        const combined = [...existingData, ...prevNonExisting, ...newData]
        console.log('📊 Total datos combinados:', combined.length, '(existing:', existingData.length, 'prev:', prev.length, 'prevNonExisting:', prevNonExisting.length, 'new:', newData.length, ')')
        return combined
      })

      if (parentSetCsvData) {
        const currentParentData = parentCsvData || []
        const existingInParent = currentParentData.filter((item: any) => item.isExisting)
        const nonExistingInParent = currentParentData.filter((item: any) => !item.isExisting)
        const newParentData = [...existingInParent, ...nonExistingInParent, ...newData]
        parentSetCsvData(newParentData)
        console.log('📊 Estado del padre actualizado con archivo:', newParentData.length, '(existing:', existingInParent.length, 'prevNonExisting:', nonExistingInParent.length, 'new:', newData.length, ')')
      }

      resetInput()
    }

    if (isCSV) {
      Papa.parse(selectedFile, {
        header: true,
        skipEmptyLines: true,
        complete: (results: any) => {
          setLoading(false)
          processParsedResults(results as ParsedResult, 'csv')
        },
        error: (error: any) => {
          setLoading(false)
          updateErrorState(`Error al leer el archivo: ${error.message}`)
          resetInput()
        }
      })
      return
    }

    try {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore - import dinámico disponible en runtime
      const XLSX = await import('xlsx')
      const arrayBuffer = await selectedFile.arrayBuffer()
      const workbook = XLSX.read(arrayBuffer, { type: 'array' })
      const sheet = workbook.Sheets['Plantilla'] || workbook.Sheets[workbook.SheetNames[0]]
      if (!sheet) {
        throw new Error('El archivo no contiene la hoja "Plantilla".')
      }
      const jsonData = XLSX.utils.sheet_to_json(sheet, { defval: '' })
      const fields = Object.keys(jsonData[0] || {})
      setLoading(false)
      processParsedResults({ data: jsonData, meta: { fields }, errors: [] }, 'excel')
    } catch (error: any) {
      console.error('❌ Error leyendo Excel:', error)
      setLoading(false)
      updateErrorState(error instanceof Error ? error.message : 'Error al leer el archivo Excel')
      resetInput()
    }
  }

  const handleProcess = async () => {
    if (!csvData.length) return
    if (!activityId || activityId <= 0) {
      updateErrorState('Primero guarda el programa para obtener un ID y poder guardar ejercicios.')
      return
    }

    setProcessing(true)
    updateErrorState(null)

        try {
          // console.log('🚀 Enviando datos al servidor:', {
          //   csvData: csvData,
          //   activityId: activityId,
          //   coachId: coachId
          // })

      const response = await fetch('/api/process-csv-simple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          csvData,
          activityId,
          coachId
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error al procesar el CSV')
      }

      setResult(result)
      // console.log('✅ CSV procesado exitosamente:', result)
      
      // Recargar datos existentes
      await loadExistingData()
      
      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      console.error('❌ Error procesando CSV:', error)
      updateErrorState(error instanceof Error ? error.message : 'Error desconocido')
    } finally {
      setProcessing(false)
    }
  }

  const handleReset = async () => {
    console.log('🗑️ ELIMINANDO CSV - Estado actual:', {
      csvDataLength: csvData.length,
      parentCsvDataLength: parentCsvData?.length || 0,
      existingDataLength: existingData.length
    })
    
    // Obtener todas las filas que NO son existentes (vienen de CSV)
    const allCurrentData = [...csvData, ...(parentCsvData || [])]
    const csvOnlyData = allCurrentData.filter(item => !item.isExisting)
    const csvOnlyDataWithIds = csvOnlyData.filter(item => item.id)
    const idsToDelete = csvOnlyDataWithIds.map(item => item.id).filter((id): id is number => id !== undefined)
    
    console.log('🗑️ Filas a eliminar:', {
      totalCsvRows: csvOnlyData.length,
      csvRowsWithIds: csvOnlyDataWithIds.length,
      idsToDelete: idsToDelete
    })
    
    // Eliminar de la BD solo las que tienen ID
    if (idsToDelete.length > 0 && activityId > 0) {
      console.log('🗑️ Eliminando filas del CSV de la base de datos:', idsToDelete.length, 'filas')
      try {
        const response = await fetch('/api/delete-exercise-items', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ids: idsToDelete,
            activityId: activityId
          })
        })
        
        if (!response.ok) {
          const errorData = await response.json()
          console.error('❌ Error eliminando filas de la BD:', errorData.error)
          updateErrorState(`Error al eliminar filas de la base de datos: ${errorData.error}`)
        } else {
          console.log('✅ Filas eliminadas de la base de datos exitosamente')
        }
      } catch (error) {
        console.error('❌ Error al llamar API de eliminación:', error)
        updateErrorState('Error al eliminar filas de la base de datos')
      }
    }
    
    // Limpiar archivo y archivos subidos
    setFile(null)
    setUploadedFiles([])
    updateErrorState(null)
    setResult(null)
    setSelectedRows(new Set())
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    
    // IMPORTANTE: Mantener solo las filas existentes, eliminar todas las del CSV
    const onlyExistingData = existingData.filter(item => item.isExisting)
    setCsvData(onlyExistingData)
    console.log('🗑️ Estado local limpiado, manteniendo solo existentes:', onlyExistingData.length, 'filas')
    
    // Limpiar datos del padre, manteniendo solo existentes
    if (parentSetCsvData) {
      const parentOnlyExisting = (parentCsvData || []).filter((item: any) => item.isExisting)
      parentSetCsvData(parentOnlyExisting)
      console.log('🗑️ Datos del padre limpiados, manteniendo solo existentes:', parentOnlyExisting.length, 'filas')
    }
    
    // Limpiar selección en el padre
    if (parentSetSelectedRows) {
      parentSetSelectedRows(new Set())
    }
    
    // Llamar callback del padre si existe
    if (onRemoveCSV) {
      onRemoveCSV()
    }
    setLimitWarning(null)
  }

  const handleDownloadTemplate = async () => {
    if (productCategory === 'nutricion') {
      const nutritionTemplate = `Nombre,Descripción,Calorías,Proteínas (g),Carbohidratos (g),Grasas (g),video_url
Ensalada Keto,Mezcla de lechuga aguacate queso y aceite de oliva,350,15,5,30,
Pollo a la Plancha,Pechuga de pollo marinada con especias cocida a la plancha,280,45,2,12,
Batido de Proteína,Batido con proteína en polvo plátano y leche,320,30,25,8,`

      const blob = new Blob([nutritionTemplate], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'plantilla-nutricion.csv'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      return
    }

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - import dinámico disponible en runtime
    const XLSX = await import('xlsx')
    const workbook = XLSX.utils.book_new()

    const plantillaHeaders = [
      'Nombre de la Actividad',
      'Descripción',
      'Duración (min)',
      'Tipo de Ejercicio',
      'Nivel de Intensidad',
      'Equipo Necesario',
      'Detalle de Series (peso-repeticiones-series)',
      'Partes del Cuerpo',
      'Calorías'
    ]

    const plantillaData = [
      {
        'Nombre de la Actividad': 'Press con mancuernas',
        'Descripción': 'Press de pecho utilizando mancuernas en banco plano.',
        'Duración (min)': 12,
        'Tipo de Ejercicio': 'Fuerza',
        'Nivel de Intensidad': 'Medio',
        'Equipo Necesario': 'Banco; Mancuernas',
        'Detalle de Series (peso-repeticiones-series)': '(12-10-3); (10-12-2)',
        'Partes del Cuerpo': 'Pecho; Hombros; Brazos',
        'Calorías': 70
      },
      {
        'Nombre de la Actividad': 'Burpees',
        'Descripción': 'Movimiento HIIT de cuerpo completo.',
        'Duración (min)': 8,
        'Tipo de Ejercicio': 'HIIT',
        'Nivel de Intensidad': 'Alto',
        'Equipo Necesario': '',
        'Detalle de Series (peso-repeticiones-series)': '(0-12-3); (0-10-3)',
        'Partes del Cuerpo': 'Cuerpo Completo; Core; Piernas',
        'Calorías': 90
      },
      {
        'Nombre de la Actividad': 'Remo con banda',
        'Descripción': 'Trabaja la espalda con bandas de resistencia y mancuernas ligeras.',
        'Duración (min)': 12,
        'Tipo de Ejercicio': 'Fuerza',
        'Nivel de Intensidad': 'Medio',
        'Equipo Necesario': 'Bandas; Mancuernas',
        'Detalle de Series (peso-repeticiones-series)': '(12-12-3); (10-15-2)',
        'Partes del Cuerpo': 'Espalda; Brazos; Core',
        'Calorías': 65
      },
      {
        'Nombre de la Actividad': 'Yoga restaurativo',
        'Descripción': 'Secuencia suave para movilidad y respiración.',
        'Duración (min)': 20,
        'Tipo de Ejercicio': 'Movilidad',
        'Nivel de Intensidad': 'Bajo',
        'Equipo Necesario': 'Mat de yoga',
        'Detalle de Series (peso-repeticiones-series)': '(0-60-1)',
        'Partes del Cuerpo': 'Caderas; Core; Espalda',
        'Calorías': 35
      },
      {
        'Nombre de la Actividad': 'Saltos con chaleco',
        'Descripción': 'Saltos pliométricos utilizando chaleco lastrado.',
        'Duración (min)': 6,
        'Tipo de Ejercicio': 'Funcional',
        'Nivel de Intensidad': 'Medio',
        'Equipo Necesario': 'Chaleco',
        'Detalle de Series (peso-repeticiones-series)': '(5-15-3); (5-12-2)',
        'Partes del Cuerpo': 'Piernas; Core; Cuerpo Completo',
        'Calorías': 60
      }
    ]

    const plantillaSheet = XLSX.utils.json_to_sheet(plantillaData, { header: plantillaHeaders })
    XLSX.utils.book_append_sheet(workbook, plantillaSheet, 'Plantilla')

    const opcionesDict = {
      'Tipo de Ejercicio': ['Fuerza', 'Cardio', 'HIIT', 'Movilidad', 'Flexibilidad', 'Equilibrio', 'Funcional'],
      'Nivel de Intensidad': ['Bajo', 'Medio', 'Alto'],
      'Equipo Necesario': ['', 'Bandas', 'Banco', 'Barra', 'Chaleco', 'Kettlebell', 'Mancuernas', 'Máquinas', 'Mat de yoga', 'Rack'],
      'Partes del Cuerpo': ['Pecho', 'Espalda', 'Hombros', 'Brazos', 'Antebrazos', 'Core', 'Glúteos', 'Piernas', 'Cuádriceps', 'Isquiotibiales', 'Pantorrillas', 'Caderas', 'Cuerpo Completo']
    }

    const opcionesHeaders = Object.keys(opcionesDict)
    const maxOptions = Math.max(...opcionesHeaders.map(header => opcionesDict[header as keyof typeof opcionesDict].length))
    const opcionesRows = Array.from({ length: maxOptions }, (_, index) => {
      const row: Record<string, string> = {}
      opcionesHeaders.forEach(header => {
        row[header] = opcionesDict[header as keyof typeof opcionesDict][index] || ''
      })
      return row
    })

    const opcionesSheet = XLSX.utils.json_to_sheet(opcionesRows, { header: opcionesHeaders })
    XLSX.utils.book_append_sheet(workbook, opcionesSheet, 'Opciones')

    const estructuraData = [
      {
        Columna: 'Nombre de la Actividad',
        'Formato / Tipo': 'Texto (max 100 caracteres)',
        'Permite múltiples valores': 'No',
        'Cómo indicar varias opciones': '-',
        Validación: 'Obligatoria. No puede repetirse con otro registro existente para evitar duplicados.'
      },
      {
        Columna: 'Descripción',
        'Formato / Tipo': 'Texto libre (max 255 caracteres)',
        'Permite múltiples valores': 'No',
        'Cómo indicar varias opciones': '-',
        Validación: 'Opcional. El sistema la acepta vacía.'
      },
      {
        Columna: 'Duración (min)',
        'Formato / Tipo': 'Número entero positivo',
        'Permite múltiples valores': 'No',
        'Cómo indicar varias opciones': '-',
        Validación: 'Obligatoria. Debe ser >= 1. Valores no numéricos se rechazan.'
      },
      {
        Columna: 'Tipo de Ejercicio',
        'Formato / Tipo': 'Texto (catálogo)',
        'Permite múltiples valores': 'No',
        'Cómo indicar varias opciones': '-',
        Validación: 'Obligatoria. Debe coincidir con alguna opción listada en la hoja "Opciones".'
      },
      {
        Columna: 'Nivel de Intensidad',
        'Formato / Tipo': 'Texto (catálogo)',
        'Permite múltiples valores': 'No',
        'Cómo indicar varias opciones': '-',
        Validación: 'Obligatoria. Debe coincidir con la hoja "Opciones". Valores fuera de catálogo se marcan como error.'
      },
      {
        Columna: 'Equipo Necesario',
        'Formato / Tipo': 'Texto (catálogo)',
        'Permite múltiples valores': 'Sí',
        'Cómo indicar varias opciones': "Separar cada equipo con '; ' (ej. 'Bandas; Mancuernas'). Dejar vacío si no aplica.",
        Validación: 'Opcional. Cada palabra debe estar en la hoja "Opciones". Si existe uno inválido, la fila se marca con error pero se mantiene para revisión.'
      },
      {
        Columna: 'Detalle de Series (peso-repeticiones-series)',
        'Formato / Tipo': 'Texto estructurado',
        'Permite múltiples valores': 'Sí',
        'Cómo indicar varias opciones': "Cada bloque entre paréntesis en formato (peso-reps-series) y separados por '; '.",
        Validación: 'Opcional. El sistema muestra advertencia si el formato no respeta los paréntesis.'
      },
      {
        Columna: 'Partes del Cuerpo',
        'Formato / Tipo': 'Texto (catálogo)',
        'Permite múltiples valores': 'Sí',
        'Cómo indicar varias opciones': "Separar con '; ' (ej. 'Core; Espalda').",
        Validación: 'Obligatoria. Cada valor debe estar en la hoja "Opciones". Valores fuera de catálogo generan error y no se cargan.'
      },
      {
        Columna: 'Calorías',
        'Formato / Tipo': 'Número entero (aprox.)',
        'Permite múltiples valores': 'No',
        'Cómo indicar varias opciones': '-',
        Validación: 'Opcional. Si se completa, debe ser un número >= 0.'
      }
    ]

    const estructuraSheet = XLSX.utils.json_to_sheet(estructuraData)
    XLSX.utils.book_append_sheet(workbook, estructuraSheet, 'Estructura')

    const guiaData = [
      {
        Paso: 1,
        Indicaciones: 'Descargá este archivo de ejemplo. La hoja "Plantilla" trae 5 ejercicios de referencia para que veas el formato esperado.'
      },
      {
        Paso: 2,
        Indicaciones: 'Completá tus ejercicios sobre la hoja "Plantilla". Usá las hojas "Opciones" y "Estructura" para validar qué valores son válidos y cómo separarlos.'
      },
      {
        Paso: 3,
        Indicaciones: 'No cambies el nombre de las hojas ni de las columnas. Al subir el Excel, la plataforma sólo leerá la hoja "Plantilla", convertirá los datos y descartará las otras hojas.'
      },
      {
        Paso: 4,
        Indicaciones: 'Si una columna tiene valores fuera del catálogo o datos inválidos, esa fila se marcará con error y no se importará hasta que la corrijas.'
      }
    ]

    const guiaSheet = XLSX.utils.json_to_sheet(guiaData)
    XLSX.utils.book_append_sheet(workbook, guiaSheet, 'Guía')

    const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'plantilla-fitness ejemplo.xlsx'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  const handleRowSelection = (index: number) => {
    const newSelected = new Set(selectedRows)
    if (newSelected.has(index)) {
      newSelected.delete(index)
    } else {
      newSelected.add(index)
    }
    
    console.log('🔄 Selección actualizada:', newSelected.size, 'filas seleccionadas')
    
    // Actualizar estado local
    setSelectedRows(newSelected)
    
    // Sincronizar con el padre si está disponible
    if (parentSetSelectedRows) {
      parentSetSelectedRows(newSelected)
      console.log('📤 Selección sincronizada con padre')
    }
  }

  // Función para editar ejercicio individual
  const handleEditExercise = (exercise: ExerciseData, index: number) => {
    console.log('✏️ Editando ejercicio:', exercise, 'índice:', index)
    
    // Cambiar al modo manual para editar
    setMode('manual')
    
    // Cargar datos del ejercicio en el formulario manual
    const exerciseData = {
      nombre: exercise['Nombre de la Actividad'] || exercise.nombre_ejercicio || exercise.nombre || '',
      descripcion: exercise['Descripción'] || exercise.descripcion || exercise.Descripción || '',
      duracion_min: exercise['Duración (min)'] || exercise.duracion_min || exercise.Duración || '',
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
    
    // Actualizar el formulario manual con los datos del ejercicio
    setManualForm(prev => ({ ...prev, ...exerciseData }))
    
    // Parsear partes del cuerpo si están en formato string
    if (exerciseData.partes_cuerpo) {
      const bodyPartsArray = exerciseData.partes_cuerpo
        .toString()
        .split(/;|,/)
        .filter(Boolean)
        .map((p: string) => p.trim())
      setBodyParts(bodyPartsArray)
    }
    
    // Parsear equipo necesario si están en formato string
    if (exerciseData.equipo_necesario) {
      const equipoArray = exerciseData.equipo_necesario
        .toString()
        .split(/;|,/)
        .filter(Boolean)
        .map((e: string) => e.trim())
      setEquipoList(equipoArray)
    }
    
    // Parsear series si están en formato string
    if (exerciseData.detalle_series) {
      try {
        const seriesString = exerciseData.detalle_series.toString()
        const seriesMatches = seriesString.match(/\(([^)]+)\)/g)
        if (seriesMatches) {
          const parsedSeries = seriesMatches.map((series: string) => {
            const content = series.replace(/[()]/g, '')
            const parts = content.split('-')
            return {
              peso: parts[0] || '',
              repeticiones: parts[1] || '',
              series: parts[2] || ''
            }
          })
          setSeriesList(parsedSeries)
        }
      } catch (error) {
        console.error('Error parseando series:', error)
      }
    }
    
    // Guardar el índice del ejercicio que se está editando
    setEditingExerciseIndex(index)
    
    console.log('✅ Datos cargados en formulario manual:', exerciseData)
  }

  // Función para cancelar edición
  const cancelEdit = () => {
    console.log('❌ Cancelando edición')
    setEditingExerciseIndex(null)
    setMode('manual')
    
    // Limpiar formulario
    setManualForm({
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
      proteinas: '',
      carbohidratos: '',
      grasas: '',
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
    setBodyParts([])
    setBodyPartInput('')
    setEquipoList([])
    setEquipoInput('')
    setSeriesList([])
    setSeriePeso('')
    setSerieReps('')
    setSerieSeries('')
  }

  const handleRemoveVideoFromManualForm = () => {
    if (!manualForm.video_url && !manualForm.video_file_name) return

    setManualForm((prev) => ({
      ...prev,
      video_url: '',
      video_file_name: '',
      video_source: '',
      bunny_video_id: '',
      bunny_library_id: '',
      video_thumbnail_url: ''
    }))

    if (editingExerciseIndex !== null) {
      const existingRow = allData[editingExerciseIndex]
      onVideoCleared?.(editingExerciseIndex, existingRow, {
        bunnyVideoId: existingRow?.bunny_video_id,
        bunnyLibraryId: existingRow?.bunny_library_id,
        videoUrl: existingRow?.video_url
      })

      const applyClear = (row: any) => {
        if (!row || typeof row !== 'object') return row
        return {
          ...row,
          video_url: '',
          video_file_name: '',
          video_source: '',
          bunny_video_id: '',
          bunny_library_id: '',
          video_thumbnail_url: ''
        }
      }

      setCsvData((prev) =>
        prev.map((row, idx) => (idx === editingExerciseIndex ? applyClear(row) : row))
      )
      if (parentSetCsvData) {
        parentSetCsvData((parentCsvData || []).map((row: any, idx: number) => (idx === editingExerciseIndex ? applyClear(row) : row)))
      }
      setExistingData((prev) =>
        prev.map((row) => {
          if (!row || typeof row !== 'object') return row
          if (row.id && existingRow?.id && Number(row.id) === Number(existingRow.id)) {
            return applyClear(row)
          }
          if (row.tempRowId && existingRow?.tempRowId && row.tempRowId === existingRow.tempRowId) {
            return applyClear(row)
          }
          return row
        })
      )
    }
  }

  const handleDeleteSelected = () => {
    if (selectedRows.size === 0) return
    
    console.log('🔌 Desactivando filas seleccionadas (marcar is_active=false):', selectedRows.size, 'filas')
    
    // Trabajar sobre la fuente de verdad actual
    const currentData = allData
    
    const selectedIndices = Array.from(selectedRows)
    const selectedKeys = new Set<string>()
    selectedIndices.forEach(index => {
      const row = currentData[index]
      const key = getRowIdentifier(row, index)
      if (key) selectedKeys.add(key)
    })
    
    const markInactive = (row: any, index?: number) => {
      const key = getRowIdentifier(row, index)
      if (!key || !selectedKeys.has(key)) return row
      return { ...row, is_active: false, activo: false }
    }
    
    // Filas afectadas para notificar al padre (si tienen id, luego se persistirá)
    const rowsToDisable = Array.from(selectedRows).map(index => currentData[index])
    const idsToDisable = rowsToDisable
      .filter(item => (item as any).id && (item as any).isExisting)
      .map(item => (item as any).id)
    
    console.log('📝 IDs marcados para desactivación (se persistirá al guardar):', idsToDisable)
    
    // Actualizar estado local diferenciando existentes vs nuevos
    setCsvData(prev => prev.map((row, idx) => markInactive(row, idx)) as any)
    setExistingData(prev => prev.map((row, idx) => markInactive(row, idx)) as any)
    
    // Notificar al padre para registrar elementos desactivados
    if (onItemsStatusChange && rowsToDisable.length > 0) {
      onItemsStatusChange(rowsToDisable as any[], 'disable')
      console.log('📤 Notificando al padre sobre elementos desactivados:', rowsToDisable.length, 'elementos')
    }
    
    // Sincronizar con el padre si provee setter
    if (parentSetCsvData) {
      const currentParent = parentCsvData || []
      const updatedParent = currentParent.map((row: any, idx: number) => markInactive(row, idx))
      parentSetCsvData(updatedParent)
      console.log('🔌 Estado del padre actualizado con is_active=false')
    }
    
    // Limpiar selección local y en el padre
    setSelectedRows(new Set())
    if (parentSetSelectedRows) {
      parentSetSelectedRows(new Set())
    }
    
    console.log('✅ Desactivación local completada (A → D en UI; persistirá al guardar)')
  }

  const handleRemoveSelected = async () => {
    if (selectedRows.size === 0) {
      updateErrorState('Selecciona al menos una fila para eliminar')
      return
    }
    
    console.log('🗑️ Eliminando filas seleccionadas:', selectedRows.size, 'filas')
    
    // Obtener los índices y filas seleccionadas de allData
    const selectedIndices = Array.from(selectedRows)
    const selectedItems = selectedIndices.map(index => allData[index])
    const rowsWithIds = selectedItems.filter(item => item.id)
    const idsToDelete = rowsWithIds.map(item => item.id).filter((id): id is number => id !== undefined)
    
    // Crear un Set de identificadores únicos para las filas a eliminar
    const itemsToRemove = new Set<string>()
    selectedIndices.forEach((index, arrayIdx) => {
      const item = selectedItems[arrayIdx]
      if (!item) return
      const identifier = getRowIdentifier(item, index)
      if (identifier) {
        itemsToRemove.add(identifier)
      }
    })
    
    // Eliminar de la BD si tienen ID
    if (idsToDelete.length > 0 && activityId > 0) {
      try {
        const response = await fetch('/api/delete-exercise-items', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ids: idsToDelete,
            activityId: activityId
          })
        })
        
        if (!response.ok) {
          const errorData = await response.json()
          console.error('❌ Error eliminando filas de la BD:', errorData.error)
          updateErrorState(`Error al eliminar filas: ${errorData.error}`)
          return
        } else {
          console.log('✅ Filas eliminadas de la base de datos exitosamente')
        }
      } catch (error) {
        console.error('❌ Error al llamar API de eliminación:', error)
        updateErrorState('Error al eliminar filas de la base de datos')
        return
      }
    }
    
    // Función helper para verificar si un item debe ser eliminado
    const shouldRemoveItem = (item: any, index?: number): boolean => {
      const identifier = getRowIdentifier(item, index)
      if (!identifier) return false
      return itemsToRemove.has(identifier)
    }
    
    // Eliminar filas del estado local
    setCsvData(prev => prev.filter((item, idx) => !shouldRemoveItem(item, idx)))
    setExistingData(prev => prev.filter((item, idx) => !shouldRemoveItem(item, idx)))
    
    // Eliminar filas del estado del padre
    if (parentSetCsvData) {
      const currentParentData = parentCsvData || []
      const filteredParent = currentParentData.filter((item: any, idx: number) => !shouldRemoveItem(item, idx))
      parentSetCsvData(filteredParent)
      console.log('🗑️ Filas eliminadas del padre:', currentParentData.length - filteredParent.length, 'de', currentParentData.length)
    }
    
    // Limpiar selección
    setSelectedRows(new Set())
    if (parentSetSelectedRows) {
      parentSetSelectedRows(new Set())
    }
    
    console.log('✅ Eliminación completada')
    setLimitWarning(null)
  }

  const handleReactivateSelected = () => {
    if (selectedRows.size === 0) return
    
    console.log('✅ Reactivando filas seleccionadas (marcar is_active=true):', selectedRows.size, 'filas')
    
    // Trabajar sobre la fuente de verdad actual
    const currentData = allData
    
    const selectedIndices = Array.from(selectedRows)
    const selectedKeys = new Set<string>()
    selectedIndices.forEach(index => {
      const row = currentData[index]
      const key = getRowIdentifier(row, index)
      if (key) selectedKeys.add(key)
    })
    
    const markActive = (row: any, index?: number) => {
      const key = getRowIdentifier(row, index)
      if (!key || !selectedKeys.has(key)) return row
      return { ...row, is_active: true, activo: true }
    }
    
    // Filas afectadas para notificar al padre (si tienen id, luego se persistirá)
    const rowsToReactivateRaw = Array.from(selectedRows).map(index => currentData[index])
    
    let detachedCount = 0
    const ignoredKeys = new Set<string>()
    const rowsToReactivate = rowsToReactivateRaw.filter((item: any, idx: number) => {
      if (!item || !item.isExisting || !item.id) return false
      if (!activityId || activityId <= 0) return true

      const activityMap = item.activity_assignments || item.activity_map || item.activity_id
      if (!activityMap || typeof activityMap !== 'object') {
        detachedCount += 1
        const key = getRowIdentifier(item, selectedIndices[idx])
        if (key) ignoredKeys.add(key)
        return false
      }

      const key = String(activityId)
      if (!(key in activityMap)) {
        detachedCount += 1
        const identifier = getRowIdentifier(item, selectedIndices[idx])
        if (identifier) ignoredKeys.add(identifier)
        return false
      }

      return true
    })
    
    if (detachedCount > 0) {
      updateErrorState(`Se ignoraron ${detachedCount} ejercicio(s) porque ya no pertenecen a esta actividad.`)
      console.warn('⚠️ handleReactivateSelected - Ejercicios ignorados por no pertenecer a la actividad actual:', {
        detachedCount,
        activityId,
        ignored: rowsToReactivateRaw.filter((item: any) => {
          if (!item || !item.isExisting || !item.id) return false
          const activityMap = item.activity_assignments || item.activity_map || item.activity_id
          if (!activityMap || typeof activityMap !== 'object') return true
          const key = String(activityId)
          return !(key in activityMap)
        }).map((item: any) => item?.id)
      })
    }
    
    if (rowsToReactivate.length === 0) {
      setSelectedRows(new Set())
      if (parentSetSelectedRows) {
        parentSetSelectedRows(new Set())
      }
      return
    }
    
    const idsToReactivate = rowsToReactivate
      .filter(item => (item as any).id && (item as any).isExisting)
      .map(item => (item as any).id)
    
    console.log('📝 IDs marcados para reactivación (se persistirá al guardar):', idsToReactivate)
    
    // Actualizar estado local
    setCsvData(prev => prev.map((row, idx) => markActive(row, idx)) as any)
    setExistingData(prev => prev.map((row, idx) => markActive(row, idx)) as any)
    
    // Notificar al padre para registrar elementos reactivados
    if (onItemsStatusChange && rowsToReactivate.length > 0) {
      onItemsStatusChange(rowsToReactivate as any[], 'reactivate')
      console.log('📤 Notificando al padre sobre elementos reactivados:', rowsToReactivate.length, 'elementos')
    }
    
    // Sincronizar con el padre si provee setter
    if (parentSetCsvData) {
      const currentParent = parentCsvData || []
      const updatedParent = currentParent.map((row: any, idx: number) => markActive(row, idx))
      parentSetCsvData(updatedParent)
      console.log('✅ Estado del padre actualizado con is_active=true')
    }
    
    // Limpiar selección local y en el padre
    setSelectedRows(new Set())
    if (parentSetSelectedRows) {
      parentSetSelectedRows(new Set())
    }
    
    console.log('✅ Reactivación local completada (D → A en UI; persistirá al guardar)')
  }

  const handleAssignVideo = () => {
    if (selectedRows.size === 0) {
      updateErrorState('Selecciona al menos una fila para asignar video')
      return
    }
    setShowVideoModal(true)
  }

  const addManualExercise = () => {
    // Validaciones mínimas
    if (!manualForm.nombre.trim()) {
      updateErrorState(`Completa al menos el campo "${productCategory === 'nutricion' ? 'Nombre del Plato' : 'Nombre de la Actividad'}"`)
      return
    }
    updateErrorState(null)
    
    let item: any
    
    if (productCategory === 'nutricion') {
      // Campos específicos para nutrición
      item = {
        'Día': 'Lunes', // Por defecto, se puede cambiar después
        'Comida': 'Desayuno', // Por defecto
        'Nombre': manualForm.nombre,
        'Receta': manualForm.descripcion, // La receta va en descripción
        'Calorías': manualForm.calorias,
        'Proteínas (g)': manualForm.proteinas,
        'Carbohidratos (g)': manualForm.carbohidratos,
        'Grasas (g)': manualForm.grasas,
        'Ingredientes': manualForm.ingredientes,
        'Porciones': manualForm.porciones,
        'Minutos': manualForm.minutos,
        'video_url': manualForm.video_url || '',
        'video_file_name': manualForm.video_file_name || '',
        'video_source': manualForm.video_source || '',
        'bunny_video_id': manualForm.bunny_video_id || '',
        'bunny_library_id': manualForm.bunny_library_id || '',
        'video_thumbnail_url': manualForm.video_thumbnail_url || '',
        isExisting: false
      }
    } else {
      // Campos para fitness
      const detalleSeriesStr = seriesList.length
        ? seriesList.map(s => `(${s.peso}-${s.repeticiones}-${s.series})`).join(';')
        : manualForm.detalle_series
      const partesCuerpoStr = bodyParts.length
        ? bodyParts.join(';')
        : manualForm.partes_cuerpo
      const equipoNecesarioStr = equipoList.length
        ? equipoList.join(', ')
        : manualForm.equipo_necesario
      
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
    const existingTempId = editingRow?.tempRowId
    const existingCsvRowId = editingRow?.csvRowId

    const generatedTempId = `manual-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
    item = {
      ...item,
      tempRowId: existingTempId || item.tempRowId || generatedTempId,
      csvRowId: existingCsvRowId || item.csvRowId
    }
    
    if (editingExerciseIndex !== null) {
      // Modo edición: actualizar ejercicio existente
      console.log('✏️ Actualizando ejercicio manual en índice:', editingExerciseIndex)
      setCsvData(prev => prev.map((row, idx) => idx === editingExerciseIndex ? { ...row, ...item } : row))
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
    
      setCsvData(prev => {
        const newData = [...prev, item]
      console.log('➕ Ejercicio manual agregado:', newData.length, 'filas totales')
        return newData
      })
      
      // Actualizar estado del padre si está disponible
      if (parentSetCsvData) {
        const newParentData = [...(parentCsvData || []), item]
        console.log('📤 Actualizando estado del padre con fila manual:', newParentData.length, 'filas')
        parentSetCsvData(newParentData)
      }
  }

  // Función para normalizar nombres (quitar tildes, mayúsculas, espacios extra)
  const normalizeExerciseType = (rawType: string): string => {
    const base = (rawType || '')
      .toString()
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')

    if (!base) return allowedExerciseTypes[0]

    if (allowedExerciseTypes.includes(base)) return base

    if (base.includes('strength') || base.includes('fuerz')) return 'fuerza'
    if (base.includes('cardio') || base.includes('resistencia')) return 'cardio'
    if (base.includes('hiit') || base.includes('interval')) return 'hiit'
    if (base.includes('movil') || base.includes('mobility')) return 'movilidad'
    if (base.includes('flex') || base.includes('stretch')) return 'flexibilidad'
    if (base.includes('equilibr') || base.includes('balance')) return 'equilibrio'
    if (base.includes('funcion') || base.includes('functional')) return 'funcional'

    return allowedExerciseTypes[0]
  }

  const getExerciseTypeLabel = (value: string): string => {
    const normalized = normalizeExerciseType(value)
    const option = exerciseTypeOptions.find(opt => opt.value === normalized)
    return option ? option.label : (value || '').toString()
  }

  const getVideoDisplayName = (fileName?: string, url?: string): string => {
    if (fileName && fileName.trim()) return fileName.trim()
    if (!url) return ''

    try {
      const parsed = new URL(url)
      const pathSegments = parsed.pathname.split('/').filter(Boolean)

      if (pathSegments.length > 0) {
        const lastSegment = decodeURIComponent(pathSegments[pathSegments.length - 1])
        if (lastSegment && lastSegment !== 'playlist.m3u8') {
          return lastSegment
        }
      }

      return parsed.hostname
    } catch {
      const fallback = url.split('/').pop()
      return fallback || url
    }
  }

  const normalizeName = (name: string): string => {
    if (!name) return ''
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Quitar tildes
      .replace(/\s+/g, ' ') // Normalizar espacios
      .trim()
  }

  // Función para obtener nombre del ejercicio/plato
  const getExerciseName = (item: any): string => {
    if (!item) return ''
    return item['Nombre de la Actividad']
      || item.nombre_ejercicio
      || item.Nombre
      || item.nombre
      || item.nombre_actividad
      || item.name
      || item.nombre_plato
      || ''
  }

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

  const getRowIdentifier = (item: any, index?: number): string => {
    if (!item) return ''
    if (item.id) return `id_${item.id}`
    if (item.csvRowId) return `csvRow_${item.csvRowId}`
    if (item.tempRowId) return `temp_${item.tempRowId}`
    if (item.csvFileTimestamp) {
      const suffix = item.csvRowId || index !== undefined ? `${item.csvFileTimestamp}_${index ?? 0}` : `${item.csvFileTimestamp}`
      return `csv_${suffix}`
    }
    const name = normalizeName(getExerciseName(item))
    const desc = (item['Descripción'] || item.descripcion || '').toString().toLowerCase().trim()
    const duration = (item['Duración (min)'] || item.duracion_min || '').toString().trim().toLowerCase()
    const calories = (item['Calorías'] || item.calorias || '').toString().trim().toLowerCase()
    return `row_${name}_${desc}_${duration}_${calories}`
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

  useEffect(() => {
    if (mode !== 'existentes') {
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
  }, [mode, productCategory])

  // Combinar datos existentes y nuevos para mostrar
  // IMPORTANTE: Preservar existingData siempre, luego agregar csv y parent
  // Evitar duplicar filas que están tanto en csvData como en parentCsvData
  const allData = (() => {
    const existing = existingData || []
    const csv = csvData || []
    const parent = parentCsvData || []

    const existingActiveMap = new Map<number, boolean>()
    existing.forEach((item) => {
      const idRaw = item?.id
      const numericId = typeof idRaw === 'number' ? idRaw : (typeof idRaw === 'string' ? parseInt(idRaw, 10) : NaN)
      if (!Number.isNaN(numericId)) {
        const isActive = item?.is_active !== false && item?.activo !== false
        existingActiveMap.set(numericId, isActive)
      }
    })

    const combined: any[] = []
    const seenRowKeys = new Set<string>()
    const seenRowKeyIndex = new Map<string, number>()
    const seenIds = new Map<number, number>()

    const registerItem = (item: any, idx: number) => {
      if (!item) return
      const normalizedItem = withNormalizedExerciseType(item)
      const rowKey = getRowIdentifier(normalizedItem, idx)
      const idRaw = normalizedItem?.id
      const numericId = typeof idRaw === 'number' ? idRaw : (typeof idRaw === 'string' ? parseInt(idRaw, 10) : NaN)

      const resolveReplacement = (existingIndex: number) => {
        const currentItem = combined[existingIndex]
        const currentActive = currentItem?.is_active !== false && currentItem?.activo !== false
        const nextActive = normalizedItem?.is_active !== false && normalizedItem?.activo !== false
        const currentIsExisting = currentItem?.isExisting ?? false
        const nextIsExisting = normalizedItem?.isExisting ?? false
      const currentHasFileName =
        typeof currentItem?.video_file_name === 'string' && currentItem.video_file_name.trim() !== ''
      const nextHasFileName =
        typeof normalizedItem?.video_file_name === 'string' && normalizedItem.video_file_name.trim() !== ''

        if (!currentActive && nextActive) {
          combined[existingIndex] = normalizedItem
          return true
        }
        if (currentActive === nextActive && !currentIsExisting && nextIsExisting) {
          combined[existingIndex] = normalizedItem
          return true
        }
        if (currentActive === nextActive && currentIsExisting === nextIsExisting) {
          if (nextHasFileName && (!currentHasFileName || normalizedItem.video_file_name !== currentItem.video_file_name)) {
            combined[existingIndex] = normalizedItem
            return true
          }
          const currentHasVideo = !!currentItem?.video_url
          const nextHasVideo = !!normalizedItem?.video_url
          if (!currentHasVideo && nextHasVideo) {
            combined[existingIndex] = normalizedItem
            return true
          }
        }
        return false
      }

      if (!Number.isNaN(numericId)) {
        if (seenIds.has(numericId)) {
          const existingIndex = seenIds.get(numericId)!
          resolveReplacement(existingIndex)
          if (rowKey) {
            seenRowKeys.add(rowKey)
            seenRowKeyIndex.set(rowKey, existingIndex)
          }
          return
        }
      }

      if (rowKey && seenRowKeys.has(rowKey)) {
        const existingIndex = seenRowKeyIndex.get(rowKey)
        if (existingIndex !== undefined) {
          resolveReplacement(existingIndex)
        }
        return
      }

      const pushIndex = combined.push(normalizedItem) - 1
      if (!Number.isNaN(numericId)) {
        seenIds.set(numericId, pushIndex)
      }
      if (rowKey) {
        seenRowKeys.add(rowKey)
        seenRowKeyIndex.set(rowKey, pushIndex)
      }
    }

    existing.forEach((item, idx) => registerItem(item, idx))
    csv.forEach((item, idx) => registerItem(item, idx + existing.length))
    parent.forEach((item: any, idx: number) => registerItem(item, idx + existing.length + csv.length))

    const normalizedCombined = combined.map((item) => {
      const idRaw = item?.id
      const numericId = typeof idRaw === 'number' ? idRaw : (typeof idRaw === 'string' ? parseInt(idRaw, 10) : NaN)
      if (!Number.isNaN(numericId) && existingActiveMap.has(numericId)) {
        const isActive = existingActiveMap.get(numericId)!
        return {
          ...item,
          is_active: isActive,
          activo: isActive
        }
      }
      return item
    })

    return normalizedCombined
  })()
  
  // Detectar duplicados por nombre normalizado
  const currentCatalogNames = (() => {
    const names = new Set<string>()
    allData.forEach(item => {
      const normalized = normalizeName(getExerciseName(item))
      if (normalized) names.add(normalized)
    })
    return names
  })()

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
  console.log('🔍 CSVManagerEnhanced - Estado actual:', {
    csvDataLength: csvData.length,
    parentCsvDataLength: parentCsvData?.length || 0,
    existingDataLength: existingData.length,
    allDataLength: allData.length,
    selectedRowsSize: selectedRows.size,
    duplicatesCount: duplicateNames.length
  })
  const totalExercises = allData.length
  // Contar ejercicios nuevos vs existentes en allData
  const newExercises = allData.filter(item => !item.isExisting).length
  const existingCount = allData.filter(item => item.isExisting).length
  const activitiesLimitValue = typeof planLimits?.activitiesLimit === 'number' ? planLimits.activitiesLimit : null
  const exceedsActivitiesLimit = activitiesLimitValue !== null ? allData.length > activitiesLimitValue : false
  // Datos de la tabla procesados
  return (
    <div className="text-white p-4 w-full max-w-none pb-24">
      {/* Selector de modo */}
      <div className="mb-4">
        <div className="inline-flex items-center bg-zinc-900/80 border border-zinc-800 rounded-xl p-1 shadow-inner">
          {([
            { key: 'manual', label: productCategory === 'nutricion' ? 'Crear platos manualmente' : 'Crear ejercicios manualmente' },
            { key: 'csv', label: 'Subir Archivo' },
            { key: 'existentes', label: 'Agregar existentes' }
          ] as const).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setMode(tab.key)}
              className={`px-4 py-2 text-xs rounded-lg transition-all ${
                mode === tab.key
                  ? 'bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-md'
                  : 'text-zinc-300 hover:text-white hover:bg-zinc-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Bloque CSV */}
      {mode === 'csv' && (
        <div className="mb-4">
          <div className="flex gap-2">
            {/* Botón Descargar Plantilla */}
            <button
              onClick={handleDownloadTemplate}
              className="bg-black border border-[#FF7939]/30 rounded-lg px-3 py-2 flex items-center gap-2 hover:border-[#FF7939]/50 transition-colors flex-shrink-0"
            >
              <Download className="h-4 w-4 text-[#FF7939]" />
              <span className="text-[#FF7939] text-xs font-medium">Descargar Plantilla</span>
            </button>
            
            {/* Botón Subir Archivo */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-black border border-[#FF7939]/30 rounded-lg px-3 py-2 flex items-center gap-2 hover:border-[#FF7939]/50 transition-colors flex-shrink-0"
            >
              <Upload className="h-4 w-4 text-[#FF7939]" />
              <span className="text-[#FF7939] text-xs font-medium">Subir Archivo</span>
            </button>
            
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        </div>
      )}

    {/* Modal selección/subida de video del coach */}
    <VideoSelectionModal
      isOpen={showVideoModal}
      onClose={() => setShowVideoModal(false)}
      onVideoSelected={(selection: VideoSelectionResult | null) => {
        if (!selection) {
          setShowVideoModal(false)
          return
        }

        const { videoUrl, videoFile, fileName } = selection
        const resolvedName =
          (fileName && fileName.trim()) ||
          (videoFile?.name ?? '').trim() ||
          ''

        console.log('🎥 Video seleccionado:', {
          videoUrl,
          resolvedName,
          selectedRowsCount: selectedRows.size,
          selectedRows: Array.from(selectedRows),
          hasParentData: !!parentCsvData,
          hasParentSetter: !!parentSetCsvData,
          videoFileName: videoFile?.name,
          hasVideoFile: !!videoFile
        })
        
        // Si hay un archivo de video, guardarlo inmediatamente para evitar que expire el blob
        if (videoFile) {
          const selectedIndices = Array.from(selectedRows)
          const currentData = csvData.length > 0 ? csvData : (parentCsvData || [])
          
          selectedIndices.forEach((idx) => {
            const exercise = currentData[idx]
            if (exercise && onVideoFileSelected) {
              // Convertir blob URL a File si es necesario
              if (videoUrl.startsWith('blob:')) {
                // El archivo ya está disponible, solo guardarlo
                onVideoFileSelected(exercise, idx, videoFile)
                console.log(`💾 Guardando archivo de video inmediatamente para ejercicio ${idx}:`, videoFile.name)
              } else {
                // Es un video existente, no hay archivo que guardar
                console.log(`ℹ️ Video existente seleccionado para ejercicio ${idx}, no se guarda archivo`)
              }
            }
          })
        }
        
        const applyUpdate = (rows: any[]) =>
          rows.map((row, idx) => {
            if (!selectedRows.has(idx)) return row
            return {
              ...row,
              video_url: videoUrl,
              video_file_name: resolvedName || row.video_file_name || ''
            }
          })

        setCsvData(prev => applyUpdate(prev))
        
        if (parentCsvData && parentSetCsvData) {
          parentSetCsvData(applyUpdate(parentCsvData))
        } else {
          console.log('⚠️ No se pudo actualizar estado del padre - faltan props')
        }
        
        setShowVideoModal(false)
      }}
      selectedRowsCount={selectedRows.size}
    />

      {/* Bloque Manual */}
      {mode === 'manual' && (
        <div className="mb-4 space-y-5">
          
          {/* Nombre y descripción */}
          <div className="space-y-3">
            <input 
              className="bg-zinc-900/60 px-3 py-2 rounded text-sm w-full" 
              placeholder={productCategory === 'nutricion' ? "Nombre del Plato" : "Nombre de la Actividad"} 
              value={manualForm.nombre || ''} 
              onChange={(e)=>setManualForm({...manualForm, nombre:e.target.value})} 
            />
            <textarea 
              className="bg-zinc-900/60 px-3 py-2 rounded text-sm w-full" 
              rows={2} 
              placeholder={productCategory === 'nutricion' ? "Receta" : "Descripción"} 
              value={manualForm.descripcion || ''} 
              onChange={(e)=>setManualForm({...manualForm, descripcion:e.target.value})} 
            />
          </div>
          {productCategory === 'nutricion' ? (
            /* Campos específicos para nutrición */
            <>
              {/* Calorías */}
              <div className="grid grid-cols-1 gap-3">
                <div className="relative">
                  <div className="absolute left-2 top-2 text-zinc-400"><Flame className="h-4 w-4" /></div>
                  <input className="bg-zinc-900/60 pl-8 pr-3 py-2 rounded text-sm w-full" placeholder="Calorías" value={manualForm.calorias || ''} onChange={(e)=>setManualForm({...manualForm, calorias:e.target.value})} />
                </div>
              </div>
              {/* Macronutrientes */}
              <div className="grid grid-cols-3 gap-3">
                <input className="bg-zinc-900/60 px-3 py-2 rounded text-sm w-full" placeholder="Proteínas (g)" value={manualForm.proteinas || ''} onChange={(e)=>setManualForm({...manualForm, proteinas:e.target.value})} />
                <input className="bg-zinc-900/60 px-3 py-2 rounded text-sm w-full" placeholder="Carbohidratos (g)" value={manualForm.carbohidratos || ''} onChange={(e)=>setManualForm({...manualForm, carbohidratos:e.target.value})} />
                <input className="bg-zinc-900/60 px-3 py-2 rounded text-sm w-full" placeholder="Grasas (g)" value={manualForm.grasas || ''} onChange={(e)=>setManualForm({...manualForm, grasas:e.target.value})} />
              </div>
              {/* Ingredientes, Porciones y Minutos */}
              <div className="grid grid-cols-1 gap-3">
                <textarea className="bg-zinc-900/60 px-3 py-2 rounded text-sm w-full" placeholder="Ingredientes (ej: açaí: 200g, granola: 50g)" value={manualForm.ingredientes || ''} onChange={(e)=>setManualForm({...manualForm, ingredientes:e.target.value})} rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input className="bg-zinc-900/60 px-3 py-2 rounded text-sm w-full" placeholder="Porciones" value={manualForm.porciones || ''} onChange={(e)=>setManualForm({...manualForm, porciones:e.target.value})} />
                <input className="bg-zinc-900/60 px-3 py-2 rounded text-sm w-full" placeholder="Minutos de preparación" value={manualForm.minutos || ''} onChange={(e)=>setManualForm({...manualForm, minutos:e.target.value})} />
              </div>
            </>
          ) : (
            /* Campos para fitness */
            <>
              {/* Duración y Calorías con iconos */}
              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <div className="absolute left-2 top-2 text-zinc-400"><Clock className="h-4 w-4" /></div>
                  <input className="bg-zinc-900/60 pl-8 pr-3 py-2 rounded text-sm w-full" placeholder="Duración (min)" value={manualForm.duracion_min || ''} onChange={(e)=>setManualForm({...manualForm, duracion_min:e.target.value})} />
                </div>
                <div className="relative">
                  <div className="absolute left-2 top-2 text-zinc-400"><Flame className="h-4 w-4" /></div>
                  <input className="bg-zinc-900/60 pl-8 pr-3 py-2 rounded text-sm w-full" placeholder="Calorías" value={manualForm.calorias || ''} onChange={(e)=>setManualForm({...manualForm, calorias:e.target.value})} />
                </div>
              </div>
            </>
          )}
          {/* Campos específicos de fitness - solo mostrar si no es nutrición */}
          {productCategory !== 'nutricion' && (
            <>
              {/* Tipo y Nivel */}
              <div className="grid grid-cols-2 gap-3">
                <select className="bg-zinc-900/60 px-3 py-2 rounded text-sm" value={manualForm.tipo_ejercicio || ''} onChange={(e)=>setManualForm({...manualForm, tipo_ejercicio: normalizeExerciseType(e.target.value)})}>
                  <option value="">Tipo de Ejercicio</option>
                  {exerciseTypeOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <select className="bg-zinc-900/60 px-3 py-2 rounded text-sm" value={manualForm.nivel_intensidad || ''} onChange={(e)=>setManualForm({...manualForm, nivel_intensidad:e.target.value})}>
                  <option value="">Nivel de Intensidad</option>
                  {intensityLevels.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            </>
          )}
          {/* Equipo y Partes del Cuerpo con + - solo para fitness */}
          {productCategory !== 'nutricion' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <div className="flex gap-2">
                <select className="bg-zinc-900/60 px-3 py-2 rounded text-sm flex-1" value={equipoInput} onChange={(e)=>setEquipoInput(e.target.value)}>
                  <option value="">Equipo Necesario</option>
                  {equipmentOptions.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
                <Button onClick={()=>{ if(equipoInput.trim()){ setEquipoList([...equipoList, equipoInput.trim()]); setEquipoInput('') } }} className="bg-orange-600 hover:bg-orange-700 text-white border-0 h-8 px-3 text-xs">+
                </Button>
              </div>
              {equipoList.length>0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {equipoList.map((eq,idx)=> (
                    <span key={idx} className="inline-flex items-center gap-1 bg-zinc-800 text-white px-2 py-0.5 rounded-full text-xs">
                      {eq}
                      <button onClick={()=>setEquipoList(equipoList.filter((_,i)=>i!==idx))} className="ml-1 text-zinc-300 hover:text-white">×</button>
                    </span>
                  ))}
                </div>
              )}
            </div>
            {/* Partes del Cuerpo con chips */}
            <div>
              <div className="flex gap-2">
                <select className="bg-zinc-900/60 px-3 py-2 rounded text-sm flex-1" value={bodyPartInput} onChange={(e)=>setBodyPartInput(e.target.value)}>
                  <option value="">Partes del Cuerpo</option>
                  {bodyPartsOptions.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
                <Button onClick={()=>{ if(bodyPartInput.trim()){ setBodyParts([...bodyParts, bodyPartInput.trim()]); setBodyPartInput('') } }} className="bg-orange-600 hover:bg-orange-700 text-white border-0 h-8 px-3 text-xs">
                  +
                </Button>
              </div>
              {bodyParts.length>0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {bodyParts.map((bp,idx)=> (
                    <span key={idx} className="inline-flex items-center gap-1 bg-orange-600/20 text-orange-300 px-2 py-0.5 rounded-full text-xs">
                      {bp}
                      <button onClick={()=>setBodyParts(bodyParts.filter((_,i)=>i!==idx))} className="ml-1 text-orange-300 hover:text-white">×</button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
          )}
          {/* Campo URL eliminado; selección por modal */}
          {/* Constructor de series - solo para fitness */}
          {productCategory !== 'nutricion' && (
            <div className="space-y-2 max-w-md">
            <div className="grid grid-cols-[80px_80px_80px_auto] gap-2 items-center">
              <input
                type="number"
                inputMode="numeric"
                className="bg-zinc-900/60 px-2 py-2 rounded text-sm text-center w-full"
                placeholder="Peso"
                value={seriePeso}
                onChange={(e)=>setSeriePeso(e.target.value)}
              />
              <input
                type="number"
                inputMode="numeric"
                className="bg-zinc-900/60 px-2 py-2 rounded text-sm text-center w-full"
                placeholder="Reps"
                value={serieReps}
                onChange={(e)=>setSerieReps(e.target.value)}
              />
              <input
                type="number"
                inputMode="numeric"
                className="bg-zinc-900/60 px-2 py-2 rounded text-sm text-center w-full"
                placeholder="Series"
                value={serieSeries}
                onChange={(e)=>setSerieSeries(e.target.value)}
              />
              <Button onClick={()=>{
                const p = parseFloat(seriePeso); const r = parseInt(serieReps); const s = parseInt(serieSeries);
                if(!isNaN(p) && !isNaN(r) && !isNaN(s)){
                  setSeriesList([...seriesList, {peso:p, repeticiones:r, series:s}])
                  setSeriePeso(''); setSerieReps(''); setSerieSeries('')
                }
              }} className="bg-orange-600 hover:bg-orange-700 text-white border-0 h-8 px-3 text-xs w-full">+
              </Button>
            </div>
            {seriesList.length>0 && (
              <div className="flex flex-wrap gap-2">
                {seriesList.map((sr,idx)=> (
                  <span key={idx} className="inline-flex items-center gap-1 bg-zinc-800 text-white px-2 py-0.5 rounded-full text-xs">
                    {sr.peso}-{sr.repeticiones}-{sr.series}
                    <button onClick={()=>setSeriesList(seriesList.filter((_,i)=>i!==idx))} className="ml-1 text-zinc-300 hover:text-white">×</button>
                  </span>
                ))}
              </div>
            )}
            <p className="text-[11px] text-zinc-400">Se genera como: (peso-reps-series); …</p>
          </div>
          )}
          {(manualForm.video_url || manualForm.video_file_name) && (
            <div className="max-w-md">
              <p className="text-xs text-zinc-400 mb-2">Video asignado</p>
              <div className="flex items-center justify-between rounded-xl border border-orange-500/40 bg-orange-500/10 px-3 py-2">
                <div className="flex items-center gap-2 text-xs text-orange-200 max-w-[220px]">
                  <Video className="h-4 w-4 text-orange-400" />
                  <span className="truncate">{getVideoDisplayName(manualForm.video_file_name, manualForm.video_url)}</span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveVideoFromManualForm}
                  className="text-orange-200 hover:text-white hover:bg-orange-500/20 px-2 py-1"
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Eliminar
                </Button>
              </div>
            </div>
          )}
          <div className="flex justify-end gap-3">
            <Button onClick={addManualExercise} className="bg-transparent text-orange-500 hover:text-orange-400 border-0 h-8 px-2 text-xs">
              {editingExerciseIndex !== null ? (
                <>
                  <Eye className="h-3 w-3 mr-1" /> {productCategory === 'nutricion' ? 'Actualizar plato' : 'Actualizar ejercicio'}
                </>
              ) : (
                <>
                  <Plus className="h-3 w-3 mr-1" /> {productCategory === 'nutricion' ? 'Agregar plato' : 'Agregar a la tabla'}
                </>
              )}
            </Button>
            
            {/* Botón Cancelar - Solo visible cuando se está editando */}
            {editingExerciseIndex !== null && (
              <button
                onClick={cancelEdit}
                className="text-orange-500 hover:text-orange-400 text-xs h-8 px-2 border-0 bg-transparent"
                title="Cancelar edición"
              >
                Cancelar
              </button>
            )}
          </div>
        </div>
      )}

      {/* Bloque Existentes */}
      {mode === 'existentes' && (
        <div className="mb-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
            <div className="md:col-span-2">
              <select
                className="bg-zinc-900/60 px-3 py-2 rounded text-sm w-full"
                value={selectedExisting}
                onChange={(e)=>setSelectedExisting(e.target.value)}
              >
                <option value="">{productCategory === 'nutricion' ? 'Selecciona un plato existente' : 'Selecciona un ejercicio existente'}</option>
                {filteredCatalog.map((ex, idx) => (
                  <option key={`${ex.name}-${idx}`} value={idx.toString()}>{ex.name}</option>
                ))}
              </select>
              {filteredCatalog.length === 0 && (
                <p className="mt-2 text-xs text-zinc-400">
                  Ya agregaste todos los {productCategory === 'nutricion' ? 'platos disponibles' : 'ejercicios disponibles'} para este programa.
                </p>
              )}
            </div>
            <div>
              <Button
                onClick={() => {
                  if (selectedExisting === '') return
                  const selectedIndex = parseInt(selectedExisting, 10)
                  if (Number.isNaN(selectedIndex) || selectedIndex < 0) return
                  const ex = filteredCatalog[selectedIndex]
                  if (!ex) return
                  const { allowed } = evaluateAvailableSlots(1)
                  if (allowed === 0) {
                    setLimitWarning(`Límite de ejercicios (${planLimits?.activitiesLimit}) alcanzado. No puedes agregar más ejercicios del catálogo.`)
                    return
                  }
                  clearLimitWarningIfNeeded()
                  let item: any
                  if (productCategory === 'nutricion') {
                    item = {
                      'Día': 'Lunes',
                      'Comida': 'Desayuno',
                      'Nombre': ex.name,
                      'Receta': ex.receta || ex.descripcion || '',
                      'Calorías': ex.calorias || '',
                      'Proteínas (g)': ex.proteinas || '',
                      'Carbohidratos (g)': ex.carbohidratos || '',
                      'Grasas (g)': ex.grasas || '',
                      'Ingredientes': ex.ingredientes || '',
                      'Porciones': ex.porciones || '',
                      'Minutos': ex.minutos || '',
                      video_url: ex.video_url || '',
                      video_file_name: ex.video_file_name || '',
                      isExisting: false,
                      tempRowId: `catalog-${ex.id ?? 'new'}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
                    }
                  } else {
                    const normalizedType = normalizeExerciseType(ex.tipo_ejercicio || '')
                    item = {
                      'Nombre de la Actividad': ex.name,
                      'Descripción': ex.descripcion || '',
                      'Duración (min)': ex.duracion_min || '',
                      'Tipo de Ejercicio': normalizedType,
                      'Nivel de Intensidad': ex.nivel_intensidad || '',
                      'Equipo Necesario': ex.equipo_necesario || '',
                      'Detalle de Series (peso-repeticiones-series)': ex.detalle_series || '',
                      'Partes del Cuerpo': ex.partes_cuerpo || '',
                      'Calorías': ex.calorias || '',
                      isExisting: false,
                      tipo_ejercicio: normalizedType,
                      video_url: ex.video_url || '',
                      video_file_name: ex.video_file_name || '',
                      tempRowId: `catalog-${ex.id ?? 'new'}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
                    }
                  }
                  setCsvData(prev => {
                    const newData = [...prev, item]
                    console.log('➕ Ejercicio existente agregado:', newData.length, 'filas totales')
                    return newData
                  })
                  
                  // Actualizar estado del padre si está disponible
                  if (parentSetCsvData) {
                    const newParentData = [...(parentCsvData || []), item]
                    console.log('📤 Actualizando estado del padre con ejercicio existente:', newParentData.length, 'filas')
                    parentSetCsvData(newParentData)
                  }
                  
                  setSelectedExisting('')
                }}
                className="bg-transparent text-orange-500 hover:text-orange-400 border-0 h-8 px-2 text-xs w-full text-left"
                disabled={filteredCatalog.length === 0}
              >
                {editingExerciseIndex !== null ? (
                  <>
                    <Eye className="h-3 w-3 mr-1 inline" /> Actualizar ejercicio
                  </>
                ) : (
                  <>
                    <Plus className="h-3 w-3 mr-1 inline" /> Agregar a la tabla
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Archivos CSV recién subidos - Solo mostrar los nuevos */}
      {uploadedFiles.length > 0 && (
        <div className="mb-4">
          <div className="overflow-x-auto">
            <div className="flex gap-2 pb-2">
              {uploadedFiles.map((uploadedFile, idx) => (
                <div
                  key={idx}
                  className="bg-black border border-[#FF7939]/30 rounded-full px-3 py-1.5 flex items-center gap-2 flex-shrink-0"
                >
                  <span className="text-[#FF7939] text-[10px] font-medium whitespace-nowrap">
                    {uploadedFile.name}
                  </span>
                  <button
                    onClick={async () => {
                      const fileToRemove = uploadedFiles[idx]
                      const timestampToRemove = fileToRemove.timestamp
                      console.log('🗑️ Eliminando archivo CSV:', fileToRemove.name, 'timestamp:', timestampToRemove)
                      
                      // Obtener todas las filas de este archivo antes de eliminarlas
                      // Buscar en ambos estados: local y padre
                      const allCurrentData = [...csvData, ...(parentCsvData || [])]
                      
                      console.log('🔍 Buscando filas con timestamp:', timestampToRemove)
                      console.log('🔍 Total datos a revisar:', allCurrentData.length)
                      console.log('🔍 Timestamps encontrados en datos:', allCurrentData.map(item => ({ 
                        name: getExerciseName(item), 
                        timestamp: item.csvFileTimestamp,
                        matches: item.csvFileTimestamp === timestampToRemove
                      })))
                      
                      const rowsFromThisFile = allCurrentData.filter(item => 
                        item.csvFileTimestamp === timestampToRemove
                      )
                      const rowsWithIds = rowsFromThisFile.filter(item => item.id)
                      const idsToDelete = rowsWithIds.map(item => item.id).filter((id): id is number => id !== undefined)
                      
                      console.log('🗑️ Filas del archivo a eliminar:', {
                        totalRows: rowsFromThisFile.length,
                        rowsWithIds: rowsWithIds.length,
                        idsToDelete: idsToDelete,
                        rowsDetails: rowsFromThisFile.map(r => ({ name: getExerciseName(r), id: r.id, timestamp: r.csvFileTimestamp }))
                      })
                      
                      // Eliminar de la BD si tienen ID
                      if (idsToDelete.length > 0 && activityId > 0) {
                        try {
                          const response = await fetch('/api/delete-exercise-items', {
                            method: 'DELETE',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              ids: idsToDelete,
                              activityId: activityId
                            })
                          })
                          
                          if (!response.ok) {
                            const errorData = await response.json()
                            console.error('❌ Error eliminando filas de la BD:', errorData.error)
                          } else {
                            console.log('✅ Filas eliminadas de la base de datos exitosamente')
                          }
                        } catch (error) {
                          console.error('❌ Error al llamar API de eliminación:', error)
                        }
                      }
                      
                      // Filtrar filas del estado local
                      setCsvData(prev => {
                        const filtered = prev.filter(item => 
                          !item.csvFileTimestamp || item.csvFileTimestamp !== timestampToRemove
                        )
                        console.log('🗑️ Filas eliminadas del estado local:', prev.length - filtered.length, 'de', prev.length)
                        return filtered
                      })
                      
                      // Filtrar filas del estado del padre
                      if (parentSetCsvData) {
                        const currentParentData = parentCsvData || []
                        const filteredParent = currentParentData.filter((item: any) => 
                          !item.csvFileTimestamp || item.csvFileTimestamp !== timestampToRemove
                        )
                        parentSetCsvData(filteredParent)
                        console.log('🗑️ Filas eliminadas del padre:', currentParentData.length - filteredParent.length, 'de', currentParentData.length)
                      }
                      
                      // Eliminar archivo de la lista
                      setUploadedFiles(prev => prev.filter((_, i) => i !== idx))
                      
                      // Limpiar error si se eliminaron todas las filas del CSV
                      // Verificar si quedan filas con csvFileTimestamp
                      const remainingCsvRows = [...csvData, ...(parentCsvData || [])].filter(item => 
                        item.csvFileTimestamp && item.csvFileTimestamp !== timestampToRemove
                      )
                      if (remainingCsvRows.length === 0) {
            updateErrorState(null)
                        console.log('✅ Error limpiado - no quedan filas de CSV')
                      }
                    }}
                    className="text-gray-400 hover:text-red-400 transition-colors"
                    title="Eliminar archivo y sus filas"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Contador de ejercicios con barra segmentada - Sin fondo, minimalista */}
      {allData.length > 0 && (
        <div className="mb-4 w-full">
          {/* Título y límite en una línea */}
          <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-gray-300">Resumen de Ejercicios</h4>
            <div className={`text-xs ${exceedsActivitiesLimit ? 'text-red-400 font-semibold' : 'text-gray-400'}`}>
              {activitiesLimitValue !== null
                ? `${allData.length}/${activitiesLimitValue}${planLimits?.planType ? ` (Plan ${planLimits.planType})` : ''}`
                : `${allData.length} ejercicios`}
              </div>
            </div>
            
          {/* Barra segmentada con espacio libre */}
          <div className={`flex rounded-xl overflow-hidden h-6 mb-2 w-full ${exceedsActivitiesLimit ? 'ring-1 ring-red-500/60' : ''}`}>
              {/* Ejercicios nuevos */}
              {newExercises > 0 && (
                <div 
                className="bg-[#FF7939] flex items-center justify-center text-white text-xs font-medium min-w-[24px]"
                style={{ width: activitiesLimitValue && activitiesLimitValue > 0 ? `${Math.min((newExercises / activitiesLimitValue) * 100, 100)}%` : `${allData.length > 0 ? (newExercises / Math.max(allData.length, 1)) * 100 : 0}%` }}
                  title={`${newExercises} ejercicios nuevos`}
                >
                  {newExercises}
                </div>
              )}
              
              {/* Ejercicios existentes */}
              {existingCount > 0 && (
                <div 
                className="bg-[#FF8C42] flex items-center justify-center text-white text-xs font-medium min-w-[24px]"
                style={{ width: activitiesLimitValue && activitiesLimitValue > 0 ? `${Math.min((existingCount / activitiesLimitValue) * 100, 100)}%` : `${allData.length > 0 ? (existingCount / Math.max(allData.length, 1)) * 100 : 0}%` }}
                  title={`${existingCount} ejercicios existentes`}
                >
                  {existingCount}
                </div>
              )}
            
            {/* Espacio libre (solo si hay límite) */}
            {activitiesLimitValue !== null && allData.length < activitiesLimitValue && (
              <div 
                className="bg-gray-700/50 flex items-center justify-center text-gray-400 text-xs font-medium"
                style={{ width: `${((activitiesLimitValue - allData.length) / activitiesLimitValue) * 100}%` }}
                title={`${activitiesLimitValue - allData.length} espacios libres`}
              >
                {activitiesLimitValue - allData.length > 0 && (activitiesLimitValue - allData.length)}
                </div>
              )}
              
              {/* Si no hay ejercicios, mostrar barra vacía */}
              {allData.length === 0 && (
                <div className="w-full bg-gray-700 flex items-center justify-center text-gray-400 text-xs">
                  Sin ejercicios
                </div>
              )}
            </div>
            
          {/* Leyendas - Compactas */}
            <div className="flex gap-4 text-xs text-gray-400">
              <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded bg-[#FF7939]"></div>
                <span>Nuevos: {newExercises}</span>
              </div>
              <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded bg-[#FF8C42]"></div>
                <span>Existentes: {existingCount}</span>
              </div>
            {activitiesLimitValue !== null && allData.length < activitiesLimitValue && (
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded bg-gray-700/50"></div>
                <span>Libres: {activitiesLimitValue - allData.length}</span>
              </div>
            )}
            </div>
          </div>
      )}

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

      {/* Loading States */}
      {loading && (
        <div className="text-center py-8">
          <div className="inline-flex items-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500 mr-3"></div>
            <span className="text-gray-300">Parseando CSV...</span>
          </div>
        </div>
      )}

      {loadingExisting && (
        <div className="text-center py-4">
          <div className="inline-flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500 mr-2"></div>
            <span className="text-gray-400 text-sm">Cargando ejercicios existentes...</span>
          </div>
        </div>
      )}

      {/* Error State - Solo texto rojo, sin icono */}
      {error && (
        <div className="mb-4">
          <p className="text-red-500 text-sm">{error}</p>
          {invalidRows.length > 0 && (
            <div className="mt-2 text-xs text-gray-400 space-y-1">
              <p className="italic">*Filas con errores no serán cargadas:</p>
              <ul className="space-y-1 list-disc pl-4 marker:text-gray-500">
                {invalidRows.map((issue, idx) => (
                  <li key={idx} className="text-gray-400">{issue}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Success State */}
      {result && (
        <div className="bg-green-900/20 border border-green-500/50 rounded-lg p-4 mb-6">
          <div className="flex">
            <CheckCircle className="h-5 w-5 text-green-400 mr-3 flex-shrink-0" />
            <div>
              <h3 className="text-green-400 font-medium">¡Éxito!</h3>
              <p className="text-green-300 text-sm mt-1">{result.message}</p>
              {result.results && result.results.length > 0 && (
                <div className="mt-3">
                  <p className="text-green-300 text-sm font-medium">Ejercicios creados:</p>
                  <ul className="text-green-300 text-xs mt-1 space-y-1">
                    {result.results.map((r: any, i: number) => (
                      <li key={i} className="flex items-center">
                        <div className="w-1 h-1 bg-green-400 rounded-full mr-2"></div>
                        Fila {r.row}: {r.exercise} (ID: {r.ejercicio_id})
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons - Siempre visibles cuando hay datos */}
      {(csvData.length > 0 || (parentCsvData && parentCsvData.length > 0)) && (
        <div className="flex items-center justify-end gap-4 mb-4">
          {/* Botón Agregar Video */}
          <button
            onClick={() => {
              if (selectedRows.size === 0) {
                updateErrorState('Selecciona al menos una fila para agregar video')
                return
              }
              setShowVideoModal(true)
            }}
            disabled={selectedRows.size === 0}
            className={`transition-colors ${
              selectedRows.size === 0 
                ? 'text-gray-400 cursor-not-allowed' 
                : 'text-[#FF7939] hover:text-[#FF6B35]'
            }`}
            title="Agregar video a filas seleccionadas"
          >
            <Video className="h-5 w-5" />
          </button>
          
          {/* Botón Eliminar Filas */}
          <button
            onClick={handleRemoveSelected}
            disabled={selectedRows.size === 0}
            className={`transition-colors ${
              selectedRows.size === 0 
                ? 'text-gray-400 cursor-not-allowed' 
                : 'text-red-400 hover:text-red-300'
            }`}
            title="Eliminar filas seleccionadas permanentemente"
          >
            <Trash2 className="h-5 w-5" />
          </button>
          
          {/* Botón Desactivar/Reactivar Filas - Dinámico */}
          {(() => {
            // Determinar si los elementos seleccionados están desactivados
            const selectedItems = Array.from(selectedRows).map(index => allData[index])
            const allInactive = selectedItems.length > 0 && selectedItems.every(item => item.is_active === false)
            const allActive = selectedItems.length > 0 && selectedItems.every(item => item.is_active !== false)
            const hasMixed = selectedItems.length > 0 && !allInactive && !allActive
            
            // Si todos están desactivados, mostrar botón de reactivar
            if (allInactive) {
              return (
                <button
                  onClick={handleReactivateSelected}
                  disabled={selectedRows.size === 0}
                  className={`transition-colors ${
                    selectedRows.size === 0 
                      ? 'text-gray-400 cursor-not-allowed' 
                      : 'text-green-400 hover:text-green-300'
                  }`}
                  title="Reactivar filas seleccionadas (se mostrarán a nuevos clientes)"
                >
                  <Power className="h-5 w-5" />
                </button>
              )
            }
            
            // Si todos están activos o hay mezcla, mostrar botón de desactivar
            return (
              <button
                onClick={handleDeleteSelected}
                disabled={selectedRows.size === 0}
                className={`transition-colors ${
                  selectedRows.size === 0 
                    ? 'text-gray-400 cursor-not-allowed' 
                    : 'text-[#FF7939] hover:text-[#FF6B35]'
                }`}
                title={hasMixed 
                  ? "Desactivar filas seleccionadas (algunas ya están desactivadas)"
                  : "Desactivar filas seleccionadas (no se mostrarán a nuevos clientes)"
                }
              >
                <PowerOff className="h-5 w-5" />
              </button>
            )
          })()}
        </div>
      )}

      {/* Input oculto para video */}
      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (!file) return
          setCsvData(prev => prev.map((row, idx) => (
            selectedRows.has(idx) ? { ...row, video_file_name: file.name } : row
          )))
          e.currentTarget.value = ''
        }}
      />

      {/* Data Table - Forzar renderizado si hay datos persistentes */}
      {(allData.length > 0 || csvData.length > 0) && (
        <div className="w-full">
          <div ref={topScrollRef} className="overflow-x-auto w-full mb-2">
            <div ref={topScrollbarInnerRef} className="h-2" />
          </div>
          <div ref={bottomScrollRef} className="overflow-x-auto w-full">
            {/* Renderizando tabla */}
            <table className="w-full min-w-full">
              <thead>
                <tr>
                  {/* Header para numerador de fila */}
                  <th className="px-2 py-3 text-left text-xs font-medium text-white border-b border-gray-600 w-8"></th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-white border-b border-gray-600 w-16">
                    <button
                      onClick={() => {
                        const allIndices = paginatedData.map((_, index) => startIndex + index)
                        const allSelected = allIndices.every(index => selectedRows.has(index))
                        
                        if (allSelected) {
                          // Si todos están seleccionados, deseleccionar todos de esta página
                          const newSelected = new Set(selectedRows)
                          allIndices.forEach(idx => newSelected.delete(idx))
                          setSelectedRows(newSelected)
                        } else {
                          // Si no todos están seleccionados, seleccionar todos de esta página
                          const newSelected = new Set(selectedRows)
                          allIndices.forEach(idx => newSelected.add(idx))
                          setSelectedRows(newSelected)
                        }
                      }}
                      className="p-1 hover:bg-gray-700/50 rounded transition-colors mx-auto"
                      title="Seleccionar/deseleccionar todos de esta página"
                    >
                      <Flame 
                        className={`h-4 w-4 transition-colors ${
                          (() => {
                            const allIndices = paginatedData.map((_, index) => startIndex + index)
                            const allSelected = allIndices.length > 0 && allIndices.every(index => selectedRows.has(index))
                            return allSelected ? 'text-[#FF7939]' : 'text-white'
                          })()
                        }`} 
                      />
                    </button>
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-white border-b border-gray-600 w-12">
                    Editar
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-white border-b border-gray-600">Estado</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-white border-b border-gray-600 w-48">
                    {productCategory === 'nutricion' ? 'Plato' : 'Ejercicio'}
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-white border-b border-gray-600 w-48">
                    {productCategory === 'nutricion' ? 'Receta' : 'Descripción'}
                  </th>
                  {productCategory === 'nutricion' ? (
                    <>
                      <th className="px-3 py-3 text-left text-xs font-medium text-white border-b border-gray-600 w-20">Calorías</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-white border-b border-gray-600 w-24">Proteínas</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-white border-b border-gray-600 w-24">Carbohidratos</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-white border-b border-gray-600 w-20">Grasas</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-white border-b border-gray-600 w-32">Ingredientes</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-white border-b border-gray-600 w-20">Porciones</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-white border-b border-gray-600 w-20">Minutos</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-white border-b border-gray-600 w-32">Video</th>
                    </>
                  ) : (
                    <>
                      <th className="px-3 py-3 text-left text-xs font-medium text-white border-b border-gray-600 w-20">Duración</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-white border-b border-gray-600 w-24">Tipo</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-white border-b border-gray-600 w-32">Equipo</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-white border-b border-gray-600 w-32">P-R-S</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-white border-b border-gray-600 w-32">Partes</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-white border-b border-gray-600 w-20">Calorías</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-white border-b border-gray-600 w-24">Intensidad</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-white border-b border-gray-600 w-32">Video</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((item, pageIndex) => {
                  const actualIndex = startIndex + pageIndex
                  const exerciseName = getExerciseName(item)
                  const isDuplicate = duplicateNames.includes(exerciseName)
                  const validationErrors = Array.isArray((item as any).__validationErrors)
                    ? ((item as any).__validationErrors as string[]).filter(Boolean)
                    : []
                  const hasIntensityIssue = validationErrors.some(error => error.toLowerCase().includes('intensidad'))
                  const hasBodyPartsIssue = validationErrors.some(error => error.toLowerCase().includes('partes'))
                  const hasEquipmentIssue = validationErrors.some(error => error.toLowerCase().includes('equipo'))
                  
                  return (
                  <tr key={actualIndex} className="border-b border-gray-700 hover:bg-zinc-900/40">
                    {/* Numerador de fila - Pequeño, naranja, sin frame */}
                    <td className="px-2 py-3 text-center w-8">
                      <span className="text-[#FF7939] text-[10px] font-medium">{actualIndex + 1}</span>
                    </td>
                    
                    {/* Columna de Selección (Llama) - Segunda columna */}
                    <td className="px-3 py-3 text-center">
                      <button
                        onClick={() => handleRowSelection(actualIndex)}
                        className="p-1 hover:bg-gray-700/50 rounded transition-colors"
                        title={selectedRows.has(actualIndex) ? 'Deseleccionar' : 'Seleccionar'}
                      >
                        <Flame 
                          className={`h-4 w-4 transition-colors ${
                            selectedRows.has(actualIndex) 
                              ? 'text-[#FF7939]' 
                              : 'text-white'
                          }`} 
                        />
                      </button>
                    </td>
                    
                    {/* Columna Editar - Segunda columna */}
                    <td className="px-2 py-3 text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditExercise(item, actualIndex)}
                        className="text-blue-400 hover:bg-blue-400/10 p-1 h-5 w-5"
                        title="Editar ejercicio"
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                    </td>
                    
                    {/* Columna Estado */}
                    <td className="px-3 py-3">
                      <div className="flex gap-1 items-center">
                        {/* Estado Existente/Nuevo */}
                        <span className={`text-[10px] font-light w-4 h-4 flex items-center justify-center rounded-full border ${
                          item.isExisting 
                            ? 'text-white border-white' 
                            : 'text-[#FF7939] border-[#FF7939]'
                        }`}>
                          {item.isExisting ? 'E' : 'N'}
                        </span>
                        {/* Estado Activo/Inactivo */}
                        <span className={`text-[10px] font-light w-4 h-4 flex items-center justify-center rounded-full border ${
                          item.is_active !== false 
                            ? 'text-[#FF7939] border-[#FF7939]' 
                            : 'text-gray-400 border-gray-600'
                        }`}>
                          {item.is_active !== false ? 'A' : 'D'}
                        </span>
                        {validationErrors.length > 0 && (
                          <span
                            className="text-[10px] font-light w-4 h-4 flex items-center justify-center rounded-full border border-red-500 text-red-400"
                            title={validationErrors.join('\n')}
                          >
                            !
                          </span>
                        )}
                      </div>
                    </td>
                    {/* Columna Ejercicio/Plato */}
                    <td className="px-3 py-3 text-xs font-medium whitespace-pre-wrap break-words">
                      <span className={isDuplicate ? 'text-red-400' : 'text-white'}>
                        {productCategory === 'nutricion' 
                          ? (item['Nombre'] || item.nombre || '-')
                          : getExerciseName(item) || '-'
                        }
                      </span>
                    </td>
                    
                    {/* Columna Descripción/Receta */}
                    <td className="px-3 py-3 text-xs text-white whitespace-pre-wrap break-words">
                      {productCategory === 'nutricion' 
                        ? (item['Receta'] || item.receta || item['Descripción'] || item.descripcion || item.Descripción || '-')
                        : (item['Descripción'] || item.descripcion || item.Descripción || '-')
                      }
                    </td>
                    
                    {productCategory === 'nutricion' ? (
                      <>
                        {/* Columna Calorías */}
                        <td className="px-3 py-3 text-xs text-white">
                          {item['Calorías'] || item.calorias || '-'}
                        </td>
                        
                        {/* Columna Proteínas */}
                        <td className="px-3 py-3 text-xs text-white">
                          {item['Proteínas (g)'] || item.proteinas || '-'}g
                        </td>
                        
                        {/* Columna Carbohidratos */}
                        <td className="px-3 py-3 text-xs text-white">
                          {item['Carbohidratos (g)'] || item.carbohidratos || '-'}g
                        </td>
                        
                        {/* Columna Grasas */}
                        <td className="px-3 py-3 text-xs text-white">
                          {item['Grasas (g)'] || item.grasas || '-'}g
                        </td>
                        
                        {/* Columna Ingredientes */}
                        <td className="px-3 py-3 text-xs text-white whitespace-pre-wrap break-words">
                          {item['Ingredientes'] || item.ingredientes || '-'}
                        </td>
                        
                        {/* Columna Porciones */}
                        <td className="px-3 py-3 text-xs text-white">
                          {item['Porciones'] || item.porciones || '-'}
                        </td>
                        
                        {/* Columna Minutos */}
                        <td className="px-3 py-3 text-xs text-white">
                          {item['Minutos'] || item.minutos || '-'} min
                        </td>
                      </>
                    ) : (
                      <>
                        {/* Columna Duración */}
                        <td className="px-3 py-3 text-xs text-white">
                          {item['Duración (min)'] || item.duracion_min || item.Duración || '-'} min
                        </td>
                        
                        {/* Columna Tipo - Con tag de color */}
                        <td className="px-3 py-3 text-xs whitespace-pre-wrap break-words">
                          {(() => {
                            const exerciseType = item['Tipo de Ejercicio'] || item.tipo_ejercicio || item.type || ''
                            const normalizedType = normalizeExerciseType(exerciseType)
                            const colorClass = getExerciseTypeColor(normalizedType)
                            return (
                              <span className={`${colorClass} text-black text-[10px] px-1.5 py-0.5 rounded-full font-medium border border-black/10 whitespace-nowrap inline-block`}>
                                {getExerciseTypeLabel(normalizedType)}
                              </span>
                            )
                          })()}
                        </td>
                        
                        {/* Columna Equipo */}
                        <td className={`px-3 py-3 text-xs whitespace-pre-wrap break-words ${hasEquipmentIssue ? 'text-red-400' : 'text-white'}`}>
                          {item['Equipo Necesario'] || item.equipo_necesario || '-'}
                        </td>
                        
                        {/* Columna P-R-S */}
                        <td className="px-3 py-3 text-xs text-white whitespace-pre break-normal">
                         {(() => {
                           const candidates = [
                             item['Detalle de Series (peso-repeticiones-series)'],
                             item['Detalle de Series'],
                             item['P-R-S'],
                             item.detalle_series
                           ]
                           
                            const first = candidates.find(v => !!v)
                            if (typeof first === 'string') {
                              const parts = first
                                .toString()
                                .split(/;|\n/)
                                .map(s => s.trim())
                                .filter(Boolean)
                                .map(s => (s.endsWith(';') ? s : `${s};`))
                              return parts.join('\n') || '-'
                            }
                            if (Array.isArray(first)) {
                              return first
                                .map((s: any) => `(${s.peso}-${s.repeticiones}-${s.series});`)
                                .join('\n') || '-'
                            }
                            if (Array.isArray(item.detalle_series)) {
                              return item.detalle_series
                                .map((s: any) => `(${s.peso}-${s.repeticiones}-${s.series});`)
                                .join('\n') || '-'
                            }
                            return '-'
                          })()}
                        </td>
                        
                        {/* Columna Partes */}
                        <td className={`px-3 py-3 text-xs whitespace-pre-wrap break-words ${hasBodyPartsIssue ? 'text-red-400' : 'text-white'}`}>
                          {(item['Partes del Cuerpo'] || item.body_parts || '')
                            .toString()
                            .split(/;|,/)
                            .filter(Boolean)
                            .map((p: string) => p.trim())
                            .join('\n') || '-'}
                        </td>
                        
                        {/* Columna Calorías */}
                        <td className="px-3 py-3 text-xs text-white">
                          {item.Calorías || item.calorias || '-'}
                        </td>
                        
                        {/* Columna Intensidad */}
                        <td className="px-3 py-3 text-xs text-white">
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              hasIntensityIssue
                                ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                                : (item['Nivel de Intensidad'] || item.intensidad || '').toLowerCase().includes('alto') || 
                                  (item['Nivel de Intensidad'] || item.intensidad || '').toLowerCase().includes('high') 
                                  ? 'bg-red-100 text-red-800'
                                  : (item['Nivel de Intensidad'] || item.intensidad || '').toLowerCase().includes('medio') || 
                                    (item['Nivel de Intensidad'] || item.intensidad || '').toLowerCase().includes('medium') ||
                                    (item['Nivel de Intensidad'] || item.intensidad || '').toLowerCase().includes('moderada')
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : (item['Nivel de Intensidad'] || item.intensidad || '').toLowerCase().includes('bajo') || 
                                    (item['Nivel de Intensidad'] || item.intensidad || '').toLowerCase().includes('low')
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {item['Nivel de Intensidad'] || item.intensidad || '-'}
                          </span>
                        </td>
                      </>
                    )}
                    
                    {/* Columna Video */}
                    <td className="px-3 py-3 text-xs text-white whitespace-pre-wrap break-words">
                      {(() => {
                        const url = (item as any).video_url || (item as any).video || ''
                        const fileName = (item as any).video_file_name
                        if (!url && !fileName) return '-'
                        const display = getVideoDisplayName(fileName, url)
                        if (!display) return '-'
                        return display.length > 24 ? display.slice(0, 24) + '…' : display
                      })()}
                    </td>
                    
                    
                  </tr>
                  )
                })}
              </tbody>
            </table>
            
            {/* Contenido personalizado después de la tabla (ej: botón continuar) */}
            {renderAfterTable && (
              <div className="flex justify-end mt-3 mb-2">
                {renderAfterTable}
              </div>
            )}
            
            {/* Paginación - Mostrar si hay más de 15 filas */}
            {allData.length > itemsPerPage && (
              <div className="flex items-center justify-center gap-2 mt-4 pb-4">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className={`${
                    currentPage === 1
                      ? 'text-gray-500 cursor-not-allowed opacity-50'
                      : 'text-[#FF7939] hover:text-[#FF6B35] cursor-pointer'
                  } transition-colors`}
                  title="Página anterior"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                
                <div className="flex gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-1 rounded text-sm ${
                        currentPage === pageNum
                          ? 'bg-[#FF7939] text-white'
                          : 'bg-gray-700 text-white hover:bg-gray-600'
                      }`}
                    >
                      {pageNum}
                    </button>
                  ))}
                </div>
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className={`${
                    currentPage === totalPages
                      ? 'text-gray-500 cursor-not-allowed opacity-50'
                      : 'text-[#FF7939] hover:text-[#FF6B35] cursor-pointer'
                  } transition-colors`}
                  title="Página siguiente"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            )}
          </div>
          <div className="overflow-x-auto w-full mt-2">
            <div className="h-1 rounded-full bg-zinc-800/70"></div>
          </div>
        </div>
      )}

      
    </div>
  )
}
