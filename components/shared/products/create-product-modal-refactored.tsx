"use client"

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { ChevronLeft, ChevronRight, ChevronDown, Plus, X, Upload, Calendar, Clock, Users, FileText, Eye, Edit, Check, Video, Play, Image as ImageIcon, Globe, MapPin, Trash2, Target, DollarSign, Eye as EyeIcon, EyeOff, Pencil, Flame, Lock, Unlock, Coins, MonitorSmartphone, Loader2, RotateCcw, RefreshCw, ExternalLink, UtensilsCrossed, Zap, FileUp, Trash } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { ProductPreviewCard } from '@/components/shared/products/product-preview-card'
import ActivityCard from '@/components/shared/activities/ActivityCard'
import { WorkshopScheduleManager } from '@/components/shared/calendar/workshop-schedule-manager'
import { VideoSelectionModal, VideoSelectionResult } from '@/components/shared/ui/video-selection-modal'
import { MediaSelectionModal } from '@/components/shared/ui/media-selection-modal'
import { WorkshopSimpleScheduler } from '@/components/shared/calendar/workshop-simple-scheduler'
import { CSVManagerEnhanced } from '@/components/shared/csv/csv-manager-enhanced'
import CalendarScheduleManager from '@/components/shared/calendar/calendar-schedule-manager'
import { getPlanLimit, type PlanType } from '@/lib/utils/plan-limits'
import { toast } from 'sonner'
// Components removed - functionality to be reimplemented if needed
// import { ModalHeader } from "@/components/product-form-sections/modal-header"
// import { GeneralInfoSection } from "@/components/product-form-sections/general-info-section"
// import { SpecificDetailsSection } from "@/components/product-form-sections/specific-details-section"
// import { GeneralInfoSectionMinimal } from "@/components/product-form-sections/general-info-section-minimal"
// import { SpecificDetailsSectionMinimal } from "@/components/product-form-sections/specific-details-section-minimal"
// import { ProgressiveForm } from "@/components/product-form-sections/progressive-form"
import { WeeklyExercisePlanner } from "../activities/weekly-exercise-planner"
// import { useCSVManagement } from '@/hooks/shared/use-csv-management'
import { useAuth } from '@/contexts/auth-context'

interface CreateProductModalProps {
  isOpen: boolean
  onClose: (saved?: boolean) => void
  editingProduct?: any
  initialStep?: 'type' | 'programType' | 'general' | 'specific' | 'workshopMaterial' | 'workshopSchedule' | 'weeklyPlan' | 'preview'
  showDateChangeNotice?: boolean
}

type ProductType = 'workshop' | 'program' | 'document'
type ProgramSubType = 'fitness' | 'nutrition'

const FITNESS_OBJECTIVE_GROUPS = {
  Entrenamiento: [
    'Fuerza',
    'Pérdida de peso',
    'Ganancia muscular',
    'Resistencia',
    'Potencia',
    'Velocidad',
    'Movilidad',
    'Flexibilidad',
    'Coordinación',
    'Equilibrio'
  ],
  Deporte: [
    'Fútbol',
    'Running',
    'Tenis',
    'Básquet',
    'Natación',
    'Ciclismo',
    'Yoga'
  ]
} as const

const NUTRITION_OBJECTIVE_GROUPS = {
  Objetivo: [
    'Pérdida de peso',
    'Ganancia muscular',
    'Mejorar hábitos',
    'Rendimiento deportivo'
  ],
  Dieta: [
    'Balanceada',
    'Mediterránea',
    'Baja en carbohidratos',
    'Keto',
    'Paleo',
    'Vegana',
    'Vegetariana'
  ],
  Enfoque: ['Salud digestiva']
} as const

const FITNESS_RESTRICTION_GROUPS = {
  Lesión: ['Rodilla', 'Hombro', 'Espalda', 'Tobillo', 'Muñeca'],
  Condición: ['Hipertensión', 'Embarazo']
} as const

const NUTRITION_RESTRICTION_GROUPS = {
  Alergia: ['Gluten', 'Lactosa', 'Maní', 'Frutos secos', 'Huevos', 'Mariscos'],
  Preferencia: ['Vegana', 'Vegetariana']
} as const

const splitSemicolonList = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return Array.from(
      new Set(
        value
          .map((v) => String(v ?? '').trim())
          .filter((v) => v.length > 0)
      )
    )
  }

  if (typeof value === 'string') {
    return Array.from(
      new Set(
        value
          .split(';')
          .map((v) => v.trim())
          .filter((v) => v.length > 0)
      )
    )
  }

  return []
}

const groupsToSelectItems = (groups: Record<string, readonly string[]>) => {
  return Object.entries(groups).map(([label, options]) => ({
    label,
    options: Array.from(options)
  }))
}

const INTENSITY_CHOICES = [
  { value: 'beginner', label: 'Principiante', flames: 1 },
  { value: 'intermediate', label: 'Intermedio', flames: 2 },
  { value: 'advanced', label: 'Avanzado', flames: 3 }
] as const

const MODALITY_CHOICES = [
  { value: 'online', label: 'Online', tone: 'text-[#FF7939]', icon: Globe },
  { value: 'presencial', label: 'Presencial', tone: 'text-[#FF9354]', icon: MapPin },
  { value: 'híbrido', label: 'Híbrido', tone: 'text-[#FFB26A]', icon: MonitorSmartphone }
] as const

const PLAN_COMMISSIONS: Record<PlanType, number> = {
  free: 0.05,
  basico: 0.05,
  black: 0.04,
  premium: 0.03
}

const PLAN_LABELS: Record<PlanType, string> = {
  free: 'Free',
  basico: 'Básico',
  black: 'Black',
  premium: 'Premium'
}

export default function CreateProductModal({ isOpen, onClose, editingProduct, initialStep, showDateChangeNotice = false }: CreateProductModalProps) {
  // Si estamos editando, determinar el tipo desde el producto
  const getInitialType = (): ProductType | null => {
    if (editingProduct) {
      if (editingProduct.type === 'program' || editingProduct.type === 'fitness') return 'program'
      if (editingProduct.type === 'workshop') return 'workshop'
      if (editingProduct.type === 'document') return 'document'
    }
    return null
  }

  const [selectedType, setSelectedType] = useState<ProductType | null>(getInitialType())
  const [selectedProgramType, setSelectedProgramType] = useState<ProgramSubType | null>(null)
  const [productCategory, setProductCategory] = useState<'fitness' | 'nutricion'>('fitness')

  useEffect(() => {
    if (selectedType === 'document' && generalForm.modality !== 'online') {
      setGeneralFormWithLogs({
        ...generalForm,
        modality: 'online'
      })
    }
  }, [selectedType])

  useEffect(() => {
    if (selectedType !== 'program') return
    if (selectedProgramType) return

    const inferred: ProgramSubType = productCategory === 'nutricion' ? 'nutrition' : 'fitness'
    setSelectedProgramType(inferred)
  }, [selectedType, selectedProgramType, productCategory])
  
  // Si estamos editando y hay initialStep, usarlo; si no, ir a 'general' para edición
  const getInitialStep = (): 'type' | 'programType' | 'general' | 'specific' | 'workshopMaterial' | 'workshopSchedule' | 'weeklyPlan' | 'preview' => {
    if (initialStep) return initialStep
    if (editingProduct) return 'general'
    return 'type'
  }
  
  const [currentStep, setCurrentStep] = useState<'type' | 'programType' | 'general' | 'specific' | 'workshopMaterial' | 'workshopSchedule' | 'weeklyPlan' | 'preview'>(getInitialStep())
  const [showDateChangeNoticeLocal, setShowDateChangeNoticeLocal] = useState(showDateChangeNotice)
  
  // Estado para selección de videos
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false)
  const [isVideoPreviewActive, setIsVideoPreviewActive] = useState(false)
  const [csvDataWithVideos, setCsvDataWithVideos] = useState<string[][]>([])

  // Estado para selección de media de portada
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false)
  const [mediaModalType, setMediaModalType] = useState<'image' | 'video'>('image')

  // Estado para selección de PDFs (Material del taller)
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false)
  const [pdfModalContext, setPdfModalContext] = useState<{ scope: 'general' } | { scope: 'topic'; topicTitle: string } | null>(null)

  // Estado para lista inline de media (imagen / video) en el paso 3
  type InlineMediaType = 'image' | 'video'
  interface InlineMediaItem {
    id: string
    filename: string
    url: string
    mediaType: InlineMediaType
    size?: number
    mimeType?: string
  }

  const [inlineMediaType, setInlineMediaType] = useState<InlineMediaType | null>(null)
  const [inlineMediaItems, setInlineMediaItems] = useState<InlineMediaItem[]>([])
  const [inlineMediaLoading, setInlineMediaLoading] = useState(false)
  const [inlineMediaError, setInlineMediaError] = useState<string | null>(null)
  const [inlineSelectedId, setInlineSelectedId] = useState<string | null>(null)
  const inlineFileInputRef = useRef<HTMLInputElement | null>(null)
  
  // Ref para cachear la planificación cargada desde la base de datos
  const cachedPlanningFromDBRef = useRef<any>(null)

  const truncateInlineFileName = (name: string, maxLength = 50) => {
    if (!name) return ''
    return name.length > maxLength ? name.slice(0, maxLength - 3) + '...' : name
  }

  // Bloquear scroll del contenido detrás cuando el modal está abierto
  useEffect(() => {
    if (typeof document === 'undefined') return

    if (isOpen) {
      const previousOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = previousOverflow
      }
    }
  }, [isOpen])

  const handleInlineUploadChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const mediaType: InlineMediaType = inlineMediaType || 'video'
    setInlineMediaLoading(true)
    setInlineMediaError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('mediaType', mediaType)
      formData.append('category', 'product')

      const response = await fetch('/api/upload-organized', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al subir el archivo')
      }

      const newItem: InlineMediaItem = {
        id: `inline-${Date.now()}`,
        filename: data.fileName || file.name,
        url: data.url,
        mediaType,
        size: file.size,
        mimeType: file.type
      }

      setInlineMediaItems((prev) => [newItem, ...prev])
      setInlineSelectedId(newItem.id)

      if (mediaType === 'image') {
        setGeneralFormWithLogs({
          ...generalForm,
          image: { url: data.url }
        })
        setIsVideoPreviewActive(false)
      } else {
        setGeneralFormWithLogs({
          ...generalForm,
          videoUrl: data.url
        })
        setIsVideoPreviewActive(true)
      }
    } catch (error: any) {
      console.error('❌ Error subiendo archivo inline:', error)
      setInlineMediaError(error.message || 'Error al subir el archivo')
    } finally {
      setInlineMediaLoading(false)
      if (inlineFileInputRef.current) {
        inlineFileInputRef.current.value = ''
      }
    }
  }

  // Estado persistente del CSV que se mantiene durante toda la sesión
  // Usar undefined inicialmente para que CSVManagerEnhanced detecte primera carga
  const [persistentCsvData, setPersistentCsvData] = useState<any[] | undefined>(undefined)
  const [persistentSelectedRows, setPersistentSelectedRows] = useState<Set<number>>(new Set())
  const [persistentCsvFileName, setPersistentCsvFileName] = useState<string>('')
  const [persistentCsvLoadedFromFile, setPersistentCsvLoadedFromFile] = useState(false)

  const [coachCatalogExercises, setCoachCatalogExercises] = useState<any[]>([])
  const [coachCatalogLoading, setCoachCatalogLoading] = useState(false)
  const [coachCatalogError, setCoachCatalogError] = useState<string | null>(null)
  
  // Estado persistente del calendario (debe ser objeto, no array)
  const [persistentCalendarSchedule, setPersistentCalendarSchedule] = useState<any>({})
  
  // Flag para saber si la planificación se limpió explícitamente por un cambio fuerte de contenido (eliminar + reemplazar platos/ejercicios)
  // Cuando es true, no debemos volver a cargar la planificación vieja desde el backend en esta sesión de edición
  const [planningClearedByContentChange, setPlanningClearedByContentChange] = useState(false)
  
  // Estado para los períodos del planificador semanal
  const [periods, setPeriods] = useState(1)

  useEffect(() => {
    if (!isOpen) return
    if (selectedType !== 'program') return
    if (!editingProduct?.id) return
    if (planningClearedByContentChange) return

    if (cachedPlanningFromDBRef.current) {
      const cached = cachedPlanningFromDBRef.current
      if (cached?.weeklySchedule) {
        setPersistentCalendarSchedule(cached.weeklySchedule)
      }
      if (typeof cached?.periods === 'number' && cached.periods > 0) {
        setPeriods(cached.periods)
      }
      return
    }

    let cancelled = false

    const loadPlanningFromDB = async () => {
      try {
        const response = await fetch(`/api/get-product-planning?actividad_id=${editingProduct.id}`)
        const json = await response.json().catch(() => null)

        if (cancelled) return

        if (!response.ok || !json?.success) {
          cachedPlanningFromDBRef.current = { weeklySchedule: {}, periods: 1 }
          return
        }

        const weeklySchedule = json?.data?.weeklySchedule || {}
        const loadedPeriods = json?.data?.periods || 1

        cachedPlanningFromDBRef.current = { weeklySchedule, periods: loadedPeriods }
        setPersistentCalendarSchedule(weeklySchedule)
        if (typeof loadedPeriods === 'number' && loadedPeriods > 0) {
          setPeriods(loadedPeriods)
        }
      } catch {
        if (cancelled) return
        cachedPlanningFromDBRef.current = { weeklySchedule: {}, periods: 1 }
      }
    }

    loadPlanningFromDB()

    return () => {
      cancelled = true
    }
  }, [isOpen, selectedType, editingProduct?.id, planningClearedByContentChange])
  
  // Estado para las estadísticas del paso 5
  const [weeklyStats, setWeeklyStats] = useState({
    semanas: 1,
    sesiones: 0,
    ejerciciosTotales: 0,
    ejerciciosUnicos: 0
  })

  const derivedPreviewStats = useMemo(() => {
    const safeNumber = (v: any) => {
      const n = typeof v === 'number' ? v : parseInt(String(v ?? ''), 10)
      return Number.isFinite(n) ? n : 0
    }

    const result = {
      sesiones: safeNumber(weeklyStats.sesiones),
      ejerciciosTotales: safeNumber(weeklyStats.ejerciciosTotales),
      ejerciciosUnicos: safeNumber(weeklyStats.ejerciciosUnicos)
    }

    const hasNonZero = result.sesiones > 0 || result.ejerciciosTotales > 0 || result.ejerciciosUnicos > 0
    if (hasNonZero) return result

    const schedule = persistentCalendarSchedule
    if (!schedule || typeof schedule !== 'object') return result

    const uniqueIds = new Set<string>()
    let totalEntries = 0

    const visitValue = (value: any) => {
      if (value === undefined || value === null) return
      if (Array.isArray(value)) {
        value.forEach(visitValue)
        return
      }
      if (typeof value === 'object') {
        // Casos típicos: { exerciseId }, { id }, { ejercicio_id }, { exercise_id }, { itemId }
        const candidate =
          (value as any).exerciseId ??
          (value as any).exercise_id ??
          (value as any).ejercicio_id ??
          (value as any).id ??
          (value as any).itemId

        if (candidate !== undefined && candidate !== null) {
          uniqueIds.add(String(candidate))
          totalEntries += 1
          return
        }

        Object.values(value).forEach(visitValue)
        return
      }

      // Primitive (string/number)
      uniqueIds.add(String(value))
      totalEntries += 1
    }

    Object.values(schedule).forEach(visitValue)

    const derived = {
      sesiones: result.sesiones,
      ejerciciosTotales: totalEntries,
      ejerciciosUnicos: uniqueIds.size
    }

    return derived
  }, [weeklyStats.sesiones, weeklyStats.ejerciciosTotales, weeklyStats.ejerciciosUnicos, persistentCalendarSchedule])

  // 🔍 Logs para entender carga de platos/ejercicios existentes en el PASO 4/5
  useEffect(() => {
    // Paso 4 (activities) removido - ahora se gestiona en tab "Mis Ejercicios/Platos"
    // Este useEffect ya no es necesario pero lo mantenemos comentado por si acaso
    if (false) {
      console.log('🔎 [PASO 4/5] Entrando a sección de actividades/platos', {
        activityIdForCsv: editingProduct?.id || 0,
        hasEditingProduct: !!editingProduct,
        persistentCsvDataLength: persistentCsvData?.length || 0,
        productCategory
      })
    }
  }, [currentStep, editingProduct, persistentCsvData, productCategory])

  // Cargar media inline (imagen / video) reutilizando los mismos endpoints que el modal
  const loadInlineMedia = async (type: InlineMediaType) => {
    // Si ya estamos mostrando este tipo y ya hay items cargados, no recargar
    if (type === inlineMediaType && inlineMediaItems.length > 0) {
      console.log('📦 InlineMedia: reutilizando lista ya cargada', {
        type,
        items: inlineMediaItems.length
      })
      return
    }

    try {
      setInlineMediaLoading(true)
      setInlineMediaError(null)
      setInlineMediaType(type)

      if (type === 'image') {
        const response = await fetch('/api/coach/storage-files')
        const data = await response.json()

        if (!response.ok || !data.success || !Array.isArray(data.files)) {
          throw new Error(data.error || 'Error al cargar imágenes')
        }

        const imageFiles = data.files.filter((file: any) => file.concept === 'image') || []

        const items: InlineMediaItem[] = imageFiles.map((file: any) => ({
          id: file.fileId || `image-${file.fileName}`,
          filename: file.fileName || '',
          url: file.url || '',
          mediaType: 'image',
          size: file.sizeBytes || undefined,
          mimeType: 'image/' + (file.fileName?.split('.').pop()?.toLowerCase() || 'jpeg')
        }))

        setInlineMediaItems(items)
      } else {
        const response = await fetch('/api/coach-media?all=true')
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Error al cargar videos')
        }

        const filteredMedia = data.media?.filter((item: any) => {
          const hasVideoUrl = item.video_url && item.video_url.trim() !== ''
          const hasBunnyId = item.bunny_video_id && item.bunny_video_id.trim() !== ''
          return hasVideoUrl || hasBunnyId
        }) || []

        const items: InlineMediaItem[] = filteredMedia.map((item: any) => ({
          id: item.id || item.bunny_video_id || `video-${item.filename}`,
          filename: item.filename || 'Video',
          url: item.video_url || '',
          mediaType: 'video'
        }))

        setInlineMediaItems(items)
      }
    } catch (error: any) {
      console.error('❌ Error cargando media inline:', error)
      setInlineMediaError(error.message || 'Error al cargar archivos')
    } finally {
      setInlineMediaLoading(false)
    }
  }
  
  // Estado para controlar si se puede deshacer en el paso 5
  const [canUndoWeeklyPlan, setCanUndoWeeklyPlan] = useState(false)
  
  // Callback memoizado para onUndoAvailable para evitar loops infinitos
  const handleUndoAvailable = useCallback((canUndo: boolean) => {
    setCanUndoWeeklyPlan(canUndo)
  }, [])
  
  // Callback memoizado para onUndo para evitar loops infinitos
  const handleUndo = useCallback(() => {
    // Llamar a la función de undo del WeeklyExercisePlanner
    if (typeof window !== 'undefined' && (window as any).weeklyPlannerUndo) {
      (window as any).weeklyPlannerUndo()
    }
  }, [])
  
  // Estado para taller - Material opcional (Paso 5)
  const [workshopMaterial, setWorkshopMaterial] = useState({
    pdfType: 'none' as 'none' | 'general' | 'by-topic', // Tipo de PDF: ninguno, general, o por tema
    pdfFile: null as File | null,
    pdfUrl: null as string | null,
    topicPdfs: {} as Record<string, { file: File | null, url: string | null, fileName: string | null }> // PDFs por tema
  })
  
  // Estado para selección de temas en la tabla
  const [selectedTopics, setSelectedTopics] = useState<Set<string>>(new Set())
  
  // Estado para taller - Fechas y horarios (Paso 4)
  const [workshopSchedule, setWorkshopSchedule] = useState<Array<{
    title?: string
    description?: string
    date: string
    startTime: string
    endTime: string
    duration: number
    isPrimary?: boolean
  }>>([])
  
  // Estado para confirmación de finalización del taller
  const [showWorkshopFinishedConfirm, setShowWorkshopFinishedConfirm] = useState(false)
  const [workshopFinishedConfirmed, setWorkshopFinishedConfirmed] = useState(false)
  const [existingWorkshopDates, setExistingWorkshopDates] = useState<string[]>([])
  // Estado para encuesta de finalización del taller
  const [workshopRating, setWorkshopRating] = useState<number>(0)
  const [workshopFeedback, setWorkshopFeedback] = useState<string>('')
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false)
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false)
  const [showAddNewDatesPrompt, setShowAddNewDatesPrompt] = useState(false)
  const [workshopIsFinished, setWorkshopIsFinished] = useState(false)
  
  // Estado para confirmación de cierre y acciones pendientes
  const [showCloseConfirmation, setShowCloseConfirmation] = useState(false)
  const [pendingAction, setPendingAction] = useState<'close' | 'tab' | null>(null)
  const [pendingTab, setPendingTab] = useState<string | null>(null)
  
  // Estado para confirmación de eliminación de PDF por tema
  const [showDeletePdfConfirm, setShowDeletePdfConfirm] = useState(false)
  const [pdfToDelete, setPdfToDelete] = useState<string | null>(null)
  const [pdfToDeleteType, setPdfToDeleteType] = useState<'topic' | 'general' | null>(null)
  
  // Estado para validación y errores
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [fieldErrors, setFieldErrors] = useState<{[key: string]: boolean}>({})
  
  // Hook para gestión del CSV (solo para funciones auxiliares) - removed, using local state instead
  // const csvManagement = useCSVManagement(productCategory)
  const csvManagement = { 
    handleFileUpload: () => {}, 
    handleFileSelect: () => {}, 
    handleRowSelection: () => {},
    csvData: persistentCsvData || [], 
    selectedRows: persistentSelectedRows || new Set() 
  }

  function getExerciseVideoKey(exercise: any, index: number): string {
    if (!exercise) return `row-${index}`
    if (typeof exercise === 'object') {
      if (exercise.tempRowId) return `tempRow-${exercise.tempRowId}`
      if (exercise.csvRowId) return `csvRow-${exercise.csvRowId}`
      if (exercise.tempId) return `tempId-${exercise.tempId}`
      if (exercise.id !== undefined && exercise.id !== null) return `id-${exercise.id}`
    }
    return `row-${index}`
  }

  const getVideoKeyCandidates = (exercise: any, index: number): string[] => {
    const keys = new Set<string>()
    const baseKey = getExerciseVideoKey(exercise, index)
    if (baseKey) keys.add(baseKey)

    const register = (value: any, prefix?: string) => {
      if (value === undefined || value === null) return
      const str = String(value)
      if (!str) return
      keys.add(prefix ? `${prefix}${str}` : str)
    }

    if (exercise && typeof exercise === 'object') {
      register(exercise.id, 'id-')
      register(exercise.id, 'exercise-')
      register(exercise.id)
      register(exercise.tempId, 'tempId-')
      register(exercise.tempId)
      register(exercise.tempRowId, 'tempRow-')
      register(exercise.csvRowId, 'csvRow-')
    }

    return Array.from(keys).filter(Boolean)
  }

  const getStoredExerciseVideoFile = (exercise: any, index: number): File | undefined => {
    const candidates = getVideoKeyCandidates(exercise, index)

    for (const key of candidates) {
      if (!key) continue
      const file = exerciseVideoFiles[key]
      if (file) return file
    }
    return undefined
  }
  
  // Contexto de autenticación
  const { user } = useAuth()

  // Log de usuario que abrió el modal (para debug de caché / carga de platos)
  useEffect(() => {
    console.log('👤 [CreateProductModal] Usuario autenticado en modal de producto:', {
      userId: user?.id,
      email: user?.email
    })
  }, [user?.id, user?.email])

  // Función para verificar si hay cambios sin guardar
  const hasUnsavedChanges = () => {
    // Verificar si estamos en paso 3 o superior
    const stepIndex = ['type', 'programType', 'general', 'specific', 'weeklyPlan', 'preview'].indexOf(currentStep)
    console.log(`🔍 Verificando cambios sin guardar - Paso actual: ${currentStep} (índice: ${stepIndex})`)
    
    if (stepIndex < 2) {
      console.log(`❌ Paso ${stepIndex + 1} - No hay cambios importantes`)
      return false // Pasos 1 y 2 no tienen cambios importantes
    }
    
    // Verificar si hay datos en el formulario general
    const hasGeneralData = generalForm.name || generalForm.description || generalForm.image || generalForm.videoUrl
    console.log(`📝 Datos generales:`, {
      name: generalForm.name,
      description: generalForm.description,
      hasImage: !!generalForm.image,
      hasVideo: !!generalForm.videoUrl,
      hasGeneralData
    })
    
    // Verificar si hay datos específicos
    const hasSpecificData = specificForm.duration || specificForm.capacity || 
                           (specificForm as any).weeklyExercises || Object.keys((specificForm as any).weeklyExercises || {}).length > 0
    console.log(`📋 Datos específicos:`, {
      duration: specificForm.duration,
      capacity: specificForm.capacity,
      hasWeeklyExercises: !!(specificForm as any).weeklyExercises,
      weeklyExercisesKeys: Object.keys((specificForm as any).weeklyExercises || {}).length,
      hasSpecificData
    })
    
    // Verificar si hay datos de CSV
    const hasCsvData = persistentCsvData && persistentCsvData.length > 0
    console.log(`📊 Datos CSV:`, {
      csvLength: persistentCsvData?.length || 0,
      hasCsvData
    })
    
    // Verificar si hay datos de calendario
    const hasCalendarData = persistentCalendarSchedule && Object.keys(persistentCalendarSchedule).length > 0
    console.log(`📅 Datos calendario:`, {
      calendarLength: persistentCalendarSchedule ? Object.keys(persistentCalendarSchedule).length : 0,
      hasCalendarData
    })
    
    const hasChanges = hasGeneralData || hasSpecificData || hasCsvData || hasCalendarData
    console.log(`🎯 ¿Hay cambios sin guardar? ${hasChanges}`)
    
    return hasChanges
  }

  // Función de prueba para forzar el modal
  const testModal = () => {
    console.log(`🧪 Forzando modal de confirmación`)
    setShowCloseConfirmation(true)
  }

  // Función para manejar el cierre del modal
  const handleClose = () => {
    console.log(`🚪 Intentando cerrar modal - Paso: ${currentStep}`)
    console.log(`🚪 Estado showCloseConfirmation: ${showCloseConfirmation}`)
    const hasChanges = hasUnsavedChanges()
    console.log(`🚪 ¿Mostrar confirmación? ${hasChanges}`)
    
    if (hasChanges) {
      console.log(`⚠️ Mostrando modal de confirmación`)
      setPendingAction('close')
      setPendingTab(null)
      setShowCloseConfirmation(true)
      console.log(`⚠️ Estado showCloseConfirmation después de set: ${showCloseConfirmation}`)
    } else {
      console.log(`✅ Cerrando sin confirmación - Limpiando estado local`)
      // Limpiar estado local incluso si no hay cambios para evitar que persista entre sesiones
      clearPersistentState()
      onClose(false) // false = no se guardaron cambios
    }
  }

  // Función para eliminar producto
  const handleDeleteProduct = async (product: any) => {
    if (confirm(`¿Estás seguro de que quieres eliminar "${product.title}"?\n\nEsta acción no se puede deshacer y eliminará todos los ejercicios y datos relacionados.`)) {
      try {
        const response = await fetch(`/api/delete-product-simple?id=${product.id}`, {
          method: 'DELETE',
        })

        if (response.ok) {
          alert('Producto eliminado exitosamente')
          onClose(false) // Cerrar el modal después de eliminar (false = no se guardaron cambios, solo se eliminó)
        } else {
          const result = await response.json()
          alert(`Error al eliminar: ${result.error}`)
        }
      } catch (error) {
        console.error('Error eliminando producto:', error)
        alert('Error al eliminar el producto')
      }
    }
  }

  // Función para confirmar cierre
  const confirmClose = () => {
    clearPersistentState()
    setShowCloseConfirmation(false)

    if (pendingAction === 'tab' && pendingTab) {
      onClose(false) // false = no se guardaron cambios
      window.dispatchEvent(new CustomEvent('omnia-force-tab-change', {
        detail: { tab: pendingTab }
      }))
    } else {
      onClose(false) // false = no se guardaron cambios
    }

    setPendingAction(null)
    setPendingTab(null)
  }

  // Función para cancelar cierre
  const cancelClose = () => {
    setShowCloseConfirmation(false)
    setPendingAction(null)
    setPendingTab(null)
  }

  // Función para limpiar estado persistente del CSV y calendario
  const clearPersistentState = () => {
    console.log('🧹 Limpiando estado persistente del CSV y calendario')
    setPersistentCsvData(undefined) // undefined para forzar carga desde backend en próxima apertura
    setPersistentSelectedRows(new Set())
    setPersistentCsvFileName('')
    setPersistentCsvLoadedFromFile(false)
    setPersistentCalendarSchedule({})
    setPlanningClearedByContentChange(false)
    // ✅ Limpiar cache de planificación
    cachedPlanningFromDBRef.current = null
    // ✅ Limpiar también archivos pendientes
    setPendingImageFile(null)
    setPendingVideoFile(null)
    setExerciseVideoFiles({})
    setVideosPendingDeletion([])
    console.log('🧹 Archivos pendientes limpiados al cerrar modal')

    // 🧹 Limpiar también borradores en sessionStorage para evitar que
    // eliminaciones "provisorias" persistan después de cerrar sin guardar.
    if (typeof window !== 'undefined' && typeof sessionStorage !== 'undefined') {
      try {
        // Para productos en edición: usar su id real de actividad
        const activityId = editingProduct?.id
        if (activityId) {
          const draftKey = `activities_draft_${activityId}`
          const draftInteractedKey = `activities_draft_${activityId}_interacted`
          console.log('🧹 Eliminando borradores de sesión para actividad:', {
            activityId,
            draftKey,
            draftInteractedKey
          })
          sessionStorage.removeItem(draftKey)
          sessionStorage.removeItem(draftInteractedKey)
        }

        // También limpiar el posible borrador genérico con id 0 (caso programas nuevos)
        const draftKeyZero = 'activities_draft_0'
        const draftInteractedKeyZero = 'activities_draft_0_interacted'
        sessionStorage.removeItem(draftKeyZero)
        sessionStorage.removeItem(draftInteractedKeyZero)
      } catch (error) {
        console.warn('⚠️ No se pudieron limpiar borradores de sesión:', error)
      }
    }
  }

  // Función para obtener el número del paso actual
  const getStepNumber = (step: string) => {
    if (selectedType === 'workshop') {
      const workshopStepMap: { [key: string]: number } = {
        'type': 1,
        'programType': 2,
        'general': 3,
        'workshopSchedule': 4,
        'workshopMaterial': 5,
        'preview': 6
      }
      return workshopStepMap[step] || 1
    } else {
      const programStepMap: { [key: string]: number } = {
        'type': 1,
        'programType': 2,
        'general': 3,
        'weeklyPlan': 4,
        'preview': 5
      }
      return programStepMap[step] || 1
    }
  }

  // Función para navegar a un paso específico
  const goToStep = (stepNumber: number) => {
    let stepMap: { [key: number]: string }
    
    if (selectedType === 'workshop') {
      stepMap = {
        1: 'type',
        2: 'programType', 
        3: 'general',
        4: 'workshopSchedule',
        5: 'workshopMaterial',
        6: 'preview'
      }
    } else {
      stepMap = {
        1: 'type',
        2: 'programType', 
        3: 'general',
        4: 'weeklyPlan',
        5: 'preview'
      }
    }
    
    const targetStep = stepMap[stepNumber]
    if (targetStep) {
      // Validar que se puede navegar a ese paso
      const currentStepNumber = getStepNumber(currentStep)
      if (stepNumber <= currentStepNumber || stepNumber === currentStepNumber + 1) {
        setCurrentStep(targetStep as any)
      }
    }
  }

  // Estado persistente del modal

  // Estados del formulario
  const [generalForm, setGeneralForm] = useState({
    name: '',
    description: '',
    price: '',
    image: null as File | { url: string } | null,
    videoUrl: '',
    modality: 'online',
    included_meet_credits: 0 as number,
    is_public: false,
    objetivos: [] as string[],
    restricciones: [] as string[],
    capacity: 'ilimitada' as string,
    stockQuantity: '0' as string,
    dietType: '' as string,
    dias_acceso: 30 as number,
    location_name: '' as string,
    location_url: '' as string,
    workshop_mode: 'grupal' as 'individual' | 'grupal',
    participants_per_class: undefined as number | undefined
  })

  // Wrapper para setGeneralForm
  const setGeneralFormWithLogs = (newForm: any) => {
    console.log('📝 CREATE-PRODUCT-MODAL: Actualizando generalForm:', newForm)
    
    // Logs específicos para variables del paso 3
    if (newForm.modality !== undefined && newForm.modality !== generalForm.modality) {
      console.log('🔄 MODAL - Modalidad actualizada:', { anterior: generalForm.modality, nuevo: newForm.modality })
    }
    if (newForm.is_public !== undefined && newForm.is_public !== generalForm.is_public) {
      console.log('🔄 MODAL - VIP actualizado:', { anterior: generalForm.is_public, nuevo: newForm.is_public })
    }
    if (newForm.capacity !== undefined && newForm.capacity !== generalForm.capacity) {
      console.log('🔄 MODAL - Capacidad actualizada:', { anterior: generalForm.capacity, nuevo: newForm.capacity })
    }
    if (newForm.stockQuantity !== undefined && newForm.stockQuantity !== generalForm.stockQuantity) {
      console.log('🔄 MODAL - Stock Quantity actualizado:', { anterior: generalForm.stockQuantity, nuevo: newForm.stockQuantity })
    }
    
    setGeneralForm(newForm)
  }

  const [objetivosToAdd, setObjetivosToAdd] = useState('')
  const [restriccionesToAdd, setRestriccionesToAdd] = useState('')

  const objectiveOptions = useMemo(() => {
    return productCategory === 'nutricion'
      ? groupsToSelectItems(NUTRITION_OBJECTIVE_GROUPS)
      : groupsToSelectItems(FITNESS_OBJECTIVE_GROUPS)
  }, [productCategory])

  const restrictionOptions = useMemo(() => {
    return productCategory === 'nutricion'
      ? groupsToSelectItems(NUTRITION_RESTRICTION_GROUPS)
      : groupsToSelectItems(FITNESS_RESTRICTION_GROUPS)
  }, [productCategory])

  const addObjetivo = (value: string) => {
    const v = String(value || '').trim()
    if (!v) return
    setGeneralFormWithLogs({
      ...generalForm,
      objetivos: Array.from(new Set([...(generalForm.objetivos || []), v]))
    })
  }

  const removeObjetivo = (value: string) => {
    const next = (generalForm.objetivos || []).filter((x) => x !== value)
    setGeneralFormWithLogs({
      ...generalForm,
      objetivos: next
    })
  }

  const addRestriccion = (value: string) => {
    const v = String(value || '').trim()
    if (!v) return
    setGeneralFormWithLogs({
      ...generalForm,
      restricciones: Array.from(new Set([...(generalForm.restricciones || []), v]))
    })
  }

  const removeRestriccion = (value: string) => {
    const next = (generalForm.restricciones || []).filter((x) => x !== value)
    setGeneralFormWithLogs({
      ...generalForm,
      restricciones: next
    })
  }

  useEffect(() => {
    if (currentStep !== 'general') return

    if (selectedType === 'document') {
      setInlineMediaType('image')
      return
    }

    if (generalForm.videoUrl && generalForm.videoUrl.trim() !== '') {
      setInlineMediaType('video')
      return
    }

    if (generalForm.image && typeof generalForm.image === 'object' && 'url' in generalForm.image && (generalForm.image as any).url) {
      setInlineMediaType('image')
      return
    }
  }, [currentStep, selectedType, generalForm.videoUrl, generalForm.image])

  // Estado de carga para el botón de publicar/actualizar
  const [isPublishing, setIsPublishing] = useState(false)
  const [publishProgress, setPublishProgress] = useState('')

  useEffect(() => {
    if (currentStep !== 'weeklyPlan') return
    if (selectedType !== 'program') return

    let cancelled = false

    const loadCatalog = async () => {
      try {
        setCoachCatalogLoading(true)
        setCoachCatalogError(null)

        const category = productCategory === 'nutricion' ? 'nutricion' : 'fitness'
        const activeParam = productCategory === 'nutricion' ? '' : '&active=true'
        const response = await fetch(`/api/coach/exercises?category=${category}${activeParam}`)
        const json = await response.json().catch(() => null)

        if (cancelled) return

        if (!response.ok || !json?.success || !Array.isArray(json?.data)) {
          const fallbackMsg = json?.error || json?.details || `HTTP ${response.status}`
          throw new Error(fallbackMsg)
        }

        setCoachCatalogExercises(json.data)
      } catch (err: any) {
        if (cancelled) return
        setCoachCatalogExercises([])
        setCoachCatalogError(err?.message || 'No se pudieron cargar los ejercicios del coach')
      } finally {
        if (!cancelled) setCoachCatalogLoading(false)
      }
    }

    loadCatalog()
    return () => {
      cancelled = true
    }
  }, [currentStep, selectedType, productCategory])

  const [specificForm, setSpecificForm] = useState({
    duration: '',
    capacity: '',
    workshopType: '',
    startDate: '',
    endDate: '',
    level: '',
    availabilityType: '',
    stockQuantity: '',
    sessionsPerClient: '',
    activities: null,
    documentType: '',
    document: null,
    pages: ''
  })

  const [coachPlan, setCoachPlan] = useState<{ planType: PlanType; stockLimit: number } | null>(null)

  // Wrapper para setSpecificForm con logs
  const setSpecificFormWithLogs = (newForm: any) => {
    console.log('📝 CREATE-PRODUCT-MODAL: Actualizando specificForm:', newForm)
    
    // Log específico para intensidad (level)
    if (newForm.level !== undefined && newForm.level !== specificForm.level) {
      console.log('🔄 MODAL - Intensidad (level) actualizada:', { anterior: specificForm.level, nuevo: newForm.level })
    }
    
    setSpecificForm(newForm)
  }

  useEffect(() => {
    const loadCoachPlan = async () => {
      try {
        const response = await fetch('/api/coach/plan')
        if (!response.ok) {
          throw new Error(`Status ${response.status}`)
        }
        const result = await response.json()
        const planType = (result?.plan?.plan_type || 'free') as PlanType
        const stockLimit = getPlanLimit(planType, 'stockPerProduct')
        setCoachPlan({ planType, stockLimit })
        console.log('📊 Límites de plan cargados:', { planType, stockLimit })
      } catch (error) {
        console.warn('⚠️ No se pudo obtener el plan del coach. Usando free por defecto.', error)
        setCoachPlan({ planType: 'free', stockLimit: getPlanLimit('free', 'stockPerProduct') })
      }
    }

    loadCoachPlan()
  }, [])

  const planType = useMemo(() => coachPlan?.planType ?? 'free', [coachPlan?.planType])
  const stockLimitFromPlan = coachPlan?.stockLimit ?? getPlanLimit('free', 'stockPerProduct')

  const canUseUnlimited = useMemo(() => {
    if (selectedType === 'workshop') return false
    if (selectedType === 'document') {
      return planType === 'black' || planType === 'premium'
    }
    return planType === 'premium'
  }, [planType, selectedType])

  const capacityOptions = useMemo<Array<'ilimitada' | 'limitada'>>(() => {
    if (selectedType === 'workshop') return ['limitada']
    if (canUseUnlimited) return ['ilimitada', 'limitada']
    return ['limitada']
  }, [selectedType, canUseUnlimited])

  useEffect(() => {
    setGeneralForm(prev => {
      if (capacityOptions.includes(prev.capacity as 'ilimitada' | 'limitada')) {
        return prev
      }
      const fallback = capacityOptions.includes('limitada') ? 'limitada' : capacityOptions[0] || 'limitada'
      console.log('⚙️ Ajustando capacidad según restricciones:', { anterior: prev.capacity, nuevo: fallback })
      return {
        ...prev,
        capacity: fallback,
        stockQuantity: fallback === 'limitada' ? (prev.stockQuantity || '0') : ''
      }
    })
  }, [capacityOptions])

  const limitedStockMax = selectedType === 'workshop' ? 100 : stockLimitFromPlan
  const isLimitedStock = generalForm.capacity === 'limitada'
  const parsedStockValue = isLimitedStock ? parseInt(generalForm.stockQuantity || '', 10) : null
  const stockAmount = isLimitedStock && parsedStockValue !== null && !Number.isNaN(parsedStockValue) ? parsedStockValue : null
  const parsedPriceValue = generalForm.price ? parseFloat(generalForm.price) : NaN
  const priceAmount = !Number.isNaN(parsedPriceValue) ? parsedPriceValue : null
  const commissionPercent = useMemo(() => PLAN_COMMISSIONS[planType] ?? PLAN_COMMISSIONS.free, [planType])
  const commissionPercentLabel = useMemo(() => `${Math.round(commissionPercent * 100)}%`, [commissionPercent])
  const potentialRevenue = stockAmount !== null && priceAmount !== null ? stockAmount * priceAmount : null
  const formattedNetRevenue = (() => {
    if (generalForm.capacity === 'ilimitada') return '∞'
    if (potentialRevenue === null || !Number.isFinite(potentialRevenue)) return '—'
    const netRevenue = potentialRevenue * (1 - commissionPercent)
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(netRevenue)
  })()

  const handleStockQuantityChange = (rawValue: string) => {
    if (!isLimitedStock) {
      return
    }

    const numericOnly = rawValue.replace(/\D/g, '')
    if (numericOnly === '') {
      setGeneralFormWithLogs({ ...generalForm, stockQuantity: '' })
      clearFieldError('stockQuantity')
      return
    }

    let parsed = parseInt(numericOnly, 10)
    if (Number.isNaN(parsed)) {
      setGeneralFormWithLogs({ ...generalForm, stockQuantity: '' })
      return
    }

    if (parsed > limitedStockMax) {
      parsed = limitedStockMax
      toast.info(`Tu plan permite un máximo de ${limitedStockMax} cupos.`)
    }

    setGeneralFormWithLogs({ ...generalForm, stockQuantity: parsed.toString() })
    clearFieldError('stockQuantity')
  }

  const handleToggleCapacity = () => {
    if (generalForm.capacity === 'limitada') {
      if (!canUseUnlimited) {
        toast.info('El modo ilimitado está disponible solo para el plan Premium.')
        return
      }
      setGeneralFormWithLogs({
        ...generalForm,
        capacity: 'ilimitada',
        stockQuantity: ''
      })
      clearFieldError('stockQuantity')
    } else {
      setGeneralFormWithLogs({
        ...generalForm,
        capacity: 'limitada',
        stockQuantity: generalForm.stockQuantity || '0'
      })
    }
  }

  const handlePriceChange = (rawValue: string) => {
    let value = rawValue.replace(/[^0-9.,]/g, '')
    value = value.replace(',', '.')

    const [integerPart, ...decimalParts] = value.split('.')
    let normalized = integerPart

    if (decimalParts.length > 0) {
      const decimals = decimalParts.join('').slice(0, 2)
      normalized += `.${decimals}`
    }

    setGeneralFormWithLogs({ ...generalForm, price: normalized })
    clearFieldError('price')
  }

  const handlePriceBlur = () => {
    if (!generalForm.price) return
    const normalized = generalForm.price.replace(',', '.')
    const parsed = parseFloat(normalized)
    if (Number.isNaN(parsed)) {
      setGeneralFormWithLogs({ ...generalForm, price: '' })
      return
    }
    setGeneralFormWithLogs({ ...generalForm, price: parsed.toFixed(2) })
  }

  // Estados adicionales
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [hasLocalVideo, setHasLocalVideo] = useState(false)
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [csvFileName, setCsvFileName] = useState<string>('')
  const [showCSVConfirmDialog, setShowCSVConfirmDialog] = useState(false)
  const [pendingCSVFile, setPendingCSVFile] = useState<File | null>(null)
  
  // ✅ NUEVO: Estados para archivos pendientes de subida
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null)
  const [pendingVideoFile, setPendingVideoFile] = useState<File | null>(null)
  const [exerciseVideoFiles, setExerciseVideoFiles] = useState<Record<string, File | undefined>>({})
  const [videosPendingDeletion, setVideosPendingDeletion] = useState<Array<{ exerciseId?: number | string; bunnyVideoId?: string; bunnyLibraryId?: number; videoUrl?: string }>>([])

  useEffect(() => {
    const handleBeforeTabChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ tab: string; shouldAbort: boolean }>
      if (!isOpen) return

      if (hasUnsavedChanges()) {
        customEvent.detail.shouldAbort = true
        setPendingAction('tab')
        setPendingTab(customEvent.detail.tab)
        setShowCloseConfirmation(true)
      }
    }

    window.addEventListener('omnia-before-tab-change', handleBeforeTabChange as EventListener)
    return () => {
      window.removeEventListener('omnia-before-tab-change', handleBeforeTabChange as EventListener)
    }
  }, [isOpen, currentStep, generalForm, specificForm, persistentCsvData, persistentCalendarSchedule])

  // Funciones para manejar selección de videos
  const handleRowSelection = (rowIndex: number) => {
    // csvManagement.handleRowSelection(rowIndex) - removed, using local state
    const newSelected = new Set(persistentSelectedRows)
    if (newSelected.has(rowIndex)) {
      newSelected.delete(rowIndex)
    } else {
      newSelected.add(rowIndex)
    }
    setPersistentSelectedRows(newSelected)
  }

  const uploadVideosForExistingRows = useCallback(
    async (
      entries: Array<{
        exercise: any
        index: number
        file: File
      }>
    ) => {
      if (!editingProduct?.id || entries.length === 0) return

      console.log('🚀 Subiendo videos inmediatamente para ejercicios existentes:', {
        count: entries.length,
        activityId: editingProduct.id,
        entries: entries.map((entry) => ({
          index: entry.index,
          exerciseId: entry.exercise?.id
        }))
      })

      const activityId = editingProduct.id
      const uploadResults: Array<{
        key: string
        index: number
        uploaded: boolean
        videoUrl?: string
        meta: { url?: string; videoId?: string; thumbnailUrl?: string; libraryId?: number; fileName?: string } | null
      }> = []

      for (const { exercise, index, file } of entries) {
        const rawId = exercise?.id
        const exerciseId =
          typeof rawId === 'number'
            ? rawId
            : typeof rawId === 'string' && /^\d+$/.test(rawId)
              ? parseInt(rawId, 10)
              : null

        if (!exerciseId) {
          uploadResults.push({
            key: getExerciseVideoKey(exercise, index),
            index,
            uploaded: false,
            videoUrl: exercise?.video_url,
            meta: null
          })
          continue
        }

        let finalVideoUrl: string | undefined
        let meta: { url?: string; videoId?: string; thumbnailUrl?: string; libraryId?: number; fileName?: string } | null =
          null
        let uploaded = false
        try {
          const formData = new FormData()
          formData.append('file', file, file.name)
          formData.append('title', file.name)
          formData.append('exerciseId', exerciseId.toString())
          formData.append('activityId', activityId.toString())

          const uploadResponse = await fetch('/api/bunny/upload-video', {
            method: 'POST',
            body: formData
          })
          const uploadJson = await uploadResponse.json()

          if (uploadResponse.ok && uploadJson.success) {
            finalVideoUrl = uploadJson.streamUrl
            meta = {
              url: uploadJson.streamUrl,
              videoId: uploadJson.videoId,
              thumbnailUrl: uploadJson.thumbnailUrl,
              libraryId: uploadJson.libraryId,
              fileName: uploadJson.fileName || file.name
            }
            uploaded = true
          } else {
            console.error(
              `❌ Error subiendo video a Bunny para ejercicio ${exerciseId}:`,
              uploadJson?.error || uploadResponse.statusText
            )
          }
        } catch (error) {
          console.error(`❌ Excepción subiendo video a Bunny para ejercicio ${exerciseId}:`, error)
        }

        uploadResults.push({
          key: getExerciseVideoKey(exercise, index),
          index,
          uploaded,
          videoUrl: uploaded ? finalVideoUrl : exercise?.video_url,
          meta
        })
      }

      if (uploadResults.some((result) => result.uploaded)) {
        setPersistentCsvData((prev) =>
          (prev ?? []).map((exercise, idx) => {
            const match = uploadResults.find((result) => result.index === idx && result.uploaded)
            if (!match || !exercise || typeof exercise !== 'object') {
              return exercise
            }
            const updatedExercise = { ...exercise }
            if (match.videoUrl) {
              updatedExercise.video_url = match.videoUrl
            }
            if (match.meta?.videoId) {
              updatedExercise.bunny_video_id = match.meta.videoId
            }
            if (match.meta?.libraryId !== undefined) {
              updatedExercise.bunny_library_id = match.meta.libraryId
            }
            if (match.meta?.thumbnailUrl) {
              updatedExercise.video_thumbnail_url = match.meta.thumbnailUrl
            }
            if (match.meta?.fileName) {
              updatedExercise.video_file_name = match.meta.fileName
            }
            return updatedExercise
          })
        )

        setExerciseVideoFiles((prev) => {
          const next = { ...prev }
          uploadResults
            .filter((result) => result.uploaded)
            .forEach((result) => {
              const entry = entries.find((candidate) => candidate.index === result.index)
              if (!entry) return
              const key = getExerciseVideoKey(entry.exercise, entry.index)
              if (key && next[key]) {
                delete next[key]
              }
            })
          return next
        })
      }
    },
    [editingProduct?.id, setPersistentCsvData, setExerciseVideoFiles]
  )

  const handleVideoSelection = (selection: VideoSelectionResult | null) => {
    if (!selection) {
      setIsVideoModalOpen(false)
      return
    }

    if (!persistentSelectedRows || persistentSelectedRows.size === 0) {
      setIsVideoModalOpen(false)
      return
    }

    if (!persistentCsvData || persistentCsvData.length === 0) {
      setIsVideoModalOpen(false)
      return
    }

    const selectedIndices = Array.from(persistentSelectedRows)
    const { videoUrl, videoFile, fileName, bunnyVideoId, bunnyLibraryId, thumbnailUrl } = selection

    if (!videoUrl || videoUrl.trim() === '') {
      console.warn('⚠️ handleVideoSelection: selección sin URL de video válida', selection)
      setIsVideoModalOpen(false)
      return
    }

    const deriveFileNameFromUrl = (url: string) => {
      try {
        const sanitized = url.split('?')[0]
        const parts = sanitized.split('/')
        const last = parts.pop()
        return last && last.includes('.') ? last : last || null
      } catch {
        return null
      }
    }

    const safeFileName =
      (fileName && fileName.trim()) ||
      (videoFile?.name ?? '').trim() ||
      deriveFileNameFromUrl(videoUrl) ||
      ''

    console.log('🎯 handleVideoSelection', {
      selectedIndices,
      selection,
      safeFileName
    })

    // Si hay un archivo de video, guardarlo inmediatamente en exerciseVideoFiles
    if (videoFile) {
      selectedIndices.forEach((idx) => {
        const exercise = persistentCsvData[idx]
        if (exercise) {
          const key = getExerciseVideoKey(exercise, idx)
          if (key) {
            setExerciseVideoFiles((prev) => ({
              ...prev,
              [key]: videoFile
            }))
            console.log(`💾 Guardando archivo de video inmediatamente para ejercicio ${idx} (key: ${key}):`, videoFile.name)
          }
        }
      })
    }

    const updatedCsvData = persistentCsvData.map((exercise, index) => {
      if (!selectedIndices.includes(index)) {
        return exercise
      }

      if (!exercise || typeof exercise !== 'object' || Array.isArray(exercise)) {
        console.warn('⚠️ No se pudo asignar video a la fila (estructura inesperada):', exercise)
        return exercise
      }

      const updatedExercise = { ...exercise }
      const originalVideoMeta = {
        video_url: exercise?.video_url,
        video_file_name: exercise?.video_file_name,
        bunny_video_id: exercise?.bunny_video_id,
        bunny_library_id: exercise?.bunny_library_id
      }

      updatedExercise.video_url = videoUrl

      if (videoFile) {
        console.log('🎥 Asignando video local a ejercicio', {
          index,
          ejercicio: exercise?.nombre_ejercicio || exercise?.Nombre || exercise?.id,
          fileName: videoFile.name,
          originalVideoMeta
        })
        updatedExercise.video_file_name = safeFileName
        updatedExercise.video_source = 'local'
        updatedExercise.bunny_video_id = ''
        updatedExercise.bunny_library_id = ''
        updatedExercise.video_thumbnail_url = ''
      } else {
        if (safeFileName) {
          updatedExercise.video_file_name = safeFileName
        } else {
          delete updatedExercise.video_file_name
        }
        updatedExercise.video_source = 'existing'
        if (bunnyVideoId !== undefined) {
          updatedExercise.bunny_video_id = bunnyVideoId ?? null
        }
        if (bunnyLibraryId !== undefined) {
          updatedExercise.bunny_library_id = bunnyLibraryId ?? null
        }
        if (thumbnailUrl !== undefined) {
          updatedExercise.video_thumbnail_url = thumbnailUrl ?? null
        }
      }

      console.log('🎞️ Resultado actualización video fila', {
        index,
        id: updatedExercise?.id,
        nombre:
          updatedExercise?.nombre_ejercicio ||
          updatedExercise?.Nombre ||
          updatedExercise?.['Nombre de la Actividad'],
        originalVideoMeta,
        updatedVideoMeta: {
          video_url: updatedExercise.video_url,
          video_file_name: updatedExercise.video_file_name,
          bunny_video_id: updatedExercise.bunny_video_id,
          bunny_library_id: updatedExercise.bunny_library_id
        }
      })

      return updatedExercise
    })

    setPersistentCsvData(updatedCsvData)
    if (typeof window !== 'undefined') {
      ;(window as any).__LAST_PERSISTENT_CSV__ = updatedCsvData
      console.log(
        '🗂️ Estado persistentCsvData tras asignar video',
        updatedCsvData.slice(0, 3).map((row, idx) => ({
          idx,
          id: row?.id,
          nombre: row?.nombre_ejercicio || row?.Nombre || row?.['Nombre de la Actividad'],
          video_file_name: row?.video_file_name,
          video_url: row?.video_url?.slice?.(0, 60)
        }))
      )
    }

    setExerciseVideoFiles((prev) => {
      const next = { ...prev }
      selectedIndices.forEach((index) => {
        const exercise = updatedCsvData[index]
        const candidates = getVideoKeyCandidates(exercise, index)
        candidates.forEach((key) => {
          if (!key) return
          if (videoFile) {
            next[key] = videoFile
          } else if (next[key]) {
            delete next[key]
          }
        })
      })
      return next
    })

    if (videoFile && editingProduct?.id) {
      const entriesForUpload = selectedIndices
        .map((index) => {
          const exercise = updatedCsvData[index]
          if (!exercise) return null
          const hasNumericId =
            typeof exercise.id === 'number' ||
            (typeof exercise.id === 'string' && /^\d+$/.test(exercise.id))
          if (!hasNumericId) return null
          return { exercise, index, file: videoFile }
        })
        .filter(Boolean) as Array<{ exercise: any; index: number; file: File }>

      if (entriesForUpload.length > 0) {
        void uploadVideosForExistingRows(entriesForUpload)
      }
    }

    setPersistentSelectedRows(new Set())
    setIsVideoModalOpen(false)
  }

  const handleClearExerciseVideo = useCallback((index: number, exercise: any, meta?: { bunnyVideoId?: string; bunnyLibraryId?: number | string; videoUrl?: string }) => {
    setExerciseVideoFiles((prev) => {
      const next = { ...prev }
      const candidates = getVideoKeyCandidates(exercise, index)
      candidates.forEach((key) => {
        if (key && next[key]) {
          delete next[key]
        }
      })
      return next
    })

    if (meta?.bunnyVideoId) {
      setVideosPendingDeletion((prev) => {
        if (prev.some((entry) => entry.bunnyVideoId === meta.bunnyVideoId)) {
          return prev
        }
        return [
          ...prev,
          {
            exerciseId: exercise?.id ?? exercise?.tempId ?? exercise?.tempRowId,
            bunnyVideoId: meta.bunnyVideoId,
            bunnyLibraryId: typeof meta.bunnyLibraryId === 'string' ? parseInt(meta.bunnyLibraryId, 10) : meta.bunnyLibraryId,
            videoUrl: meta.videoUrl
          }
        ]
      })
    }
  }, [getVideoKeyCandidates])

  const openVideoModal = () => {
    if (!persistentSelectedRows || persistentSelectedRows.size === 0) {
      alert('Selecciona al menos una fila para asignar video')
      return
    }
    setIsVideoModalOpen(true)
  }

  // Funciones para manejar selección de media de portada
  const openMediaModal = (type: 'image' | 'video') => {
    console.log('🔄 openMediaModal llamado con tipo:', type)
    // En el paso 3 usamos la lista inline en lugar de abrir un modal
    if (currentStep === 'general') {
      loadInlineMedia(type)
      return
    }
    console.log('🔄 Estado actual isMediaModalOpen:', isMediaModalOpen)
    setMediaModalType(type)
    setIsMediaModalOpen(true)
    console.log('🔄 Estado después de setIsMediaModalOpen(true):', true)
  }

  // Botón "+" para subir nuevo media desde carpetas locales
  const handleInlinePlusClick = () => {
    if (!inlineFileInputRef.current) return
    // Ajustar tipos aceptados según el tipo actual
    const mediaType: InlineMediaType = inlineMediaType || 'video'
    inlineFileInputRef.current.accept =
      mediaType === 'image' ? 'image/*' : 'video/mp4,video/webm,video/quicktime'
    inlineFileInputRef.current.click()
  }

  const handleMediaSelection = (mediaUrl: string, mediaType: 'image' | 'video' | 'pdf', mediaFile?: File) => {
    if (mediaType === 'pdf') {
      return
    }
    console.log('🎯 CREATE-PRODUCT-MODAL: Media seleccionada:', { 
      mediaUrl, 
      mediaType, 
      hasFile: !!mediaFile
    })
    
    if (mediaType === 'image') {
      setGeneralForm(prev => {
        const newForm = { ...prev, image: { url: mediaUrl } }
        return newForm
      })
      // ✅ Si es un archivo nuevo, guardarlo para subirlo después
      if (mediaFile) {
        setPendingImageFile(mediaFile)
        console.log('💾 CREATE-PRODUCT-MODAL: Imagen guardada en memoria (se subirá al actualizar)')
      } else {
        setPendingImageFile(null)
        console.log('🔗 CREATE-PRODUCT-MODAL: Usando imagen existente (ya en Storage)')
      }
    } else {
      console.log('🎬 CREATE-PRODUCT-MODAL: Guardando video en generalForm')
      setGeneralForm(prev => ({ ...prev, videoUrl: mediaUrl }))
      // ✅ Si es un archivo nuevo, guardarlo para subirlo después
      if (mediaFile) {
        setPendingVideoFile(mediaFile)
        console.log('💾 CREATE-PRODUCT-MODAL: Video guardado en memoria (se subirá al actualizar)')
      } else {
        setPendingVideoFile(null)
        console.log('🔗 CREATE-PRODUCT-MODAL: Usando video existente (ya en Storage)')
      }
      setVideoFile(mediaFile || null)
      setHasLocalVideo(true)
    }
    console.log('✅ CREATE-PRODUCT-MODAL: Media guardada correctamente en estado local')
    setIsMediaModalOpen(false)
  }

  const truncateLabel = (value: string, max = 20) => {
    const v = String(value || '')
    if (v.length <= max) return v
    return `${v.slice(0, max)}...`
  }

  const openPdfGallery = (context: { scope: 'general' } | { scope: 'topic'; topicTitle: string }) => {
    setPdfModalContext(context)
    setIsPdfModalOpen(true)
  }

  const handlePdfSelected = (mediaUrl: string, _mediaType: 'image' | 'video' | 'pdf', mediaFile?: File) => {
    if (!pdfModalContext) {
      setIsPdfModalOpen(false)
      return
    }

    if (pdfModalContext.scope === 'general') {
      setWorkshopMaterial(prev => ({
        ...prev,
        pdfFile: mediaFile || null,
        pdfUrl: mediaFile ? null : mediaUrl
      }))
    } else {
      const topicTitle = pdfModalContext.topicTitle
      setWorkshopMaterial(prev => ({
        ...prev,
        topicPdfs: {
          ...(prev.topicPdfs || {}),
          [topicTitle]: {
            file: mediaFile || null,
            url: mediaFile ? null : mediaUrl,
            fileName: mediaFile ? mediaFile.name : truncateLabel(String(mediaUrl || 'PDF'))
          }
        }
      }))
    }

    setIsPdfModalOpen(false)
    setPdfModalContext(null)
  }

  const clearFieldError = (fieldName: string) => {
    setFieldErrors(prev => ({ ...prev, [fieldName]: false }))
    if (validationErrors.length > 0) {
      setValidationErrors([])
    }
  }

  const handlePublishProduct = async () => {
    // Prevenir múltiples clicks
    if (isPublishing) {
      console.log('⚠️ Ya hay una publicación en proceso, ignorando click')
      return
    }

    setIsPublishing(true)
    setPublishProgress('Validando datos...')
    console.log('🚀 INICIANDO PUBLICACIÓN DE PRODUCTO')
    console.log('📋 Estado completo del formulario:', {
      generalForm: {
        name: generalForm.name,
        description: generalForm.description,
        price: generalForm.price,
        hasImage: !!generalForm.image,
        hasVideo: !!generalForm.videoUrl
      },
      specificForm: specificForm,
      csvData: persistentCsvData?.length || 0,
      schedule: persistentCalendarSchedule ? Object.keys(persistentCalendarSchedule).length : 0
    })
    
    try {
      // Validar datos requeridos
      const validationErrors: string[] = []
      
      if (!generalForm.name) validationErrors.push('Título es requerido')
      if (!generalForm.description) validationErrors.push('Descripción es requerida')
      if (!generalForm.price) validationErrors.push('Precio es requerido')
      
      console.log('🔍 Validación final antes de publicar:', {
        erroresEncontrados: validationErrors,
        puedePublicar: validationErrors.length === 0
      })
      
      if (validationErrors.length > 0) {
        console.log('❌ NO SE PUEDE PUBLICAR - Campos faltantes:', validationErrors)
        // Establecer errores visuales
        setValidationErrors(validationErrors)
        setFieldErrors({
          name: !generalForm.name,
          description: !generalForm.description,
          price: !generalForm.price
        })
        setCurrentStep('general') // Volver al paso de formulario general
        setIsPublishing(false)
        setPublishProgress('')
        return
      }
      
      console.log('✅ TODOS LOS CAMPOS COMPLETADOS - Procediendo con la publicación')
      // Limpiar errores si la validación es exitosa
      setValidationErrors([])
      setFieldErrors({})

      // ✅ SUBIR ARCHIVOS PENDIENTES ANTES DE CREAR/ACTUALIZAR EL PRODUCTO
      let finalImageUrl =
        generalForm.image && typeof generalForm.image === 'object' && 'url' in generalForm.image
          ? (generalForm.image as any).url
          : null
      let finalVideoUrl = generalForm.videoUrl || null
      
      // Subir imagen pendiente si existe
      if (pendingImageFile) {
        setPublishProgress('Subiendo imagen...')
        console.log('📤 Subiendo imagen pendiente antes de guardar producto:', pendingImageFile.name)
        try {
          const formData = new FormData()
          formData.append('file', pendingImageFile)
          formData.append('mediaType', 'image')
          formData.append('category', 'product')
          
          const uploadResponse = await fetch('/api/upload-organized', {
            method: 'POST',
            body: formData
          })
          
          if (uploadResponse.ok) {
            const uploadResult = await uploadResponse.json()
            if (uploadResult.success) {
              finalImageUrl = uploadResult.url
              console.log('✅ Imagen subida exitosamente:', finalImageUrl)
            }
          } else {
            console.error('❌ Error subiendo imagen')
            alert('Error al subir la imagen')
            setIsPublishing(false)
            setPublishProgress('')
            return
          }
        } catch (uploadError) {
          console.error('❌ Error en upload de imagen:', uploadError)
          alert('Error al subir la imagen')
          setIsPublishing(false)
          setPublishProgress('')
          return
        }
      }
      
      // Subir video pendiente si existe
      let uploadedVideoData = null
      if (pendingVideoFile) {
        setPublishProgress('Subiendo video...')
        console.log('📤 Subiendo video pendiente a Bunny.net:', pendingVideoFile.name)
        try {
          const formData = new FormData()
          formData.append('file', pendingVideoFile)
          formData.append('title', pendingVideoFile.name)
          
          const uploadResponse = await fetch('/api/bunny/upload-video', {
            method: 'POST',
            credentials: 'include',
            body: formData
          })

          let uploadResult: any = null
          try {
            uploadResult = await uploadResponse.json()
          } catch {
            uploadResult = null
          }

          if (!uploadResponse.ok || !uploadResult?.success) {
            const errorMsg =
              uploadResult?.error ||
              uploadResult?.message ||
              `Error al subir el video (HTTP ${uploadResponse.status})`

            console.error('❌ Error subiendo video a Bunny.net', {
              status: uploadResponse.status,
              uploadResult
            })
            alert(errorMsg)
            setIsPublishing(false)
            setPublishProgress('')
            return
          }

          finalVideoUrl = uploadResult.streamUrl
          uploadedVideoData = {
            streamUrl: uploadResult.streamUrl,
            videoId: uploadResult.videoId,
            thumbnailUrl: uploadResult.thumbnailUrl,
            fileName: pendingVideoFile.name
          }
          console.log('✅ Video subido exitosamente a Bunny.net:', finalVideoUrl)
          console.log('📹 Video ID:', uploadResult.videoId)
        } catch (uploadError) {
          console.error('❌ Error en upload de video:', uploadError)
          alert('Error al subir el video')
          setIsPublishing(false)
          setPublishProgress('')
          return
        }
      }

      // Subir PDFs del taller si existen
      let finalWorkshopMaterial = workshopMaterial
      if (selectedType === 'workshop' && workshopMaterial.pdfType !== 'none') {
        // Subir PDF general si existe
        if (workshopMaterial.pdfType === 'general' && workshopMaterial.pdfFile) {
          setPublishProgress('Subiendo PDF general...')
          try {
            const formData = new FormData()
            formData.append('file', workshopMaterial.pdfFile)
            formData.append('mediaType', 'pdf')
            formData.append('category', 'product')
            
            const uploadResponse = await fetch('/api/upload-organized', {
              method: 'POST',
              body: formData
            })
            
            if (uploadResponse.ok) {
              const uploadResult = await uploadResponse.json()
              if (uploadResult.success) {
                finalWorkshopMaterial = {
                  ...workshopMaterial,
                  pdfUrl: uploadResult.url
                }
                console.log('✅ PDF general subido exitosamente:', uploadResult.url)
              }
            } else {
              console.error('❌ Error subiendo PDF general')
              alert('Error al subir el PDF general')
              setIsPublishing(false)
              setPublishProgress('')
              return
            }
          } catch (uploadError) {
            console.error('❌ Error en upload de PDF general:', uploadError)
            alert('Error al subir el PDF general')
            setIsPublishing(false)
            setPublishProgress('')
            return
          }
        }
        
        // Subir PDFs por tema si existen
        if (workshopMaterial.pdfType === 'by-topic' && Object.keys(workshopMaterial.topicPdfs).length > 0) {
          setPublishProgress('Subiendo PDFs por tema...')
          const uploadedTopicPdfs: Record<string, { file: File | null, url: string | null, fileName: string | null }> = {}
          
          for (const [topicTitle, topicPdf] of Object.entries(workshopMaterial.topicPdfs)) {
            // Solo subir PDFs nuevos (que tienen file pero no url)
            // Si ya tiene URL, significa que ya está subido o viene de la BD
            if (topicPdf && topicPdf.file && !topicPdf.url) {
              try {
                const formData = new FormData()
                formData.append('file', topicPdf.file)
                formData.append('mediaType', 'pdf')
                formData.append('category', 'product')
                
                console.log(`📤 Subiendo PDF para tema "${topicTitle}":`, {
                  fileName: topicPdf.fileName,
                  fileSize: topicPdf.file.size,
                  fileType: topicPdf.file.type
                })
                
                const uploadResponse = await fetch('/api/upload-organized', {
                  method: 'POST',
                  body: formData
                })
                
                if (uploadResponse.ok) {
                  const uploadResult = await uploadResponse.json()
                  if (uploadResult.success) {
                    uploadedTopicPdfs[topicTitle] = {
                      file: null, // Ya no necesitamos el archivo después de subirlo
                      url: uploadResult.url,
                      fileName: topicPdf.fileName || uploadResult.fileName
                    }
                    console.log(`✅ PDF para tema "${topicTitle}" subido exitosamente:`, uploadResult.url)
                  } else {
                    const errorMsg = uploadResult.error || 'Error desconocido'
                    console.error(`❌ Error subiendo PDF para tema "${topicTitle}":`, errorMsg)
                    alert(`Error al subir el PDF para el tema "${topicTitle}": ${errorMsg}`)
                    setIsPublishing(false)
                    setPublishProgress('')
                    return
                  }
                } else {
                  const errorData = await uploadResponse.json().catch(() => ({ error: 'Error desconocido' }))
                  const errorMsg = errorData.error || `Error ${uploadResponse.status}`
                  console.error(`❌ Error subiendo PDF para tema "${topicTitle}":`, errorMsg, errorData)
                  alert(`Error al subir el PDF para el tema "${topicTitle}": ${errorMsg}`)
                  setIsPublishing(false)
                  setPublishProgress('')
                  return
                }
              } catch (uploadError: any) {
                console.error(`❌ Error en upload de PDF para tema "${topicTitle}":`, uploadError)
                alert(`Error al subir el PDF para el tema "${topicTitle}": ${uploadError.message || 'Error de conexión'}`)
                setIsPublishing(false)
                setPublishProgress('')
                return
              }
            } else if (topicPdf && topicPdf.url) {
              // Si ya tiene URL, solo copiar la información (ya está subido o viene de la BD)
              uploadedTopicPdfs[topicTitle] = {
                file: null,
                url: topicPdf.url,
                fileName: topicPdf.fileName
              }
              console.log(`✅ PDF para tema "${topicTitle}" ya tiene URL (no se necesita subir):`, topicPdf.url)
            }
          }
          
          finalWorkshopMaterial = {
            ...workshopMaterial,
            topicPdfs: uploadedTopicPdfs
          }
        }
      }

      // Calcular valores dinámicos
      // Contar días con ejercicios en el schedule
      let totalSessions = 1
      if (persistentCalendarSchedule && Object.keys(persistentCalendarSchedule).length > 0) {
        totalSessions = 0
        Object.values(persistentCalendarSchedule).forEach((week: any) => {
          if (week && typeof week === 'object') {
            Object.values(week).forEach((day: any) => {
              if (day) {
                const exercises = Array.isArray(day) ? day : (day.ejercicios || day.exercises || [])
                if (exercises && exercises.length > 0) {
                  totalSessions++
                }
              }
            })
          }
        })
        if (totalSessions === 0) totalSessions = 1
      }
      const totalExercises = persistentCsvData?.length || 0
      const capacity = (() => {
        // Priorizar specificForm.capacity si está definido (para edición)
        if (specificForm.capacity) {
          const capNum = parseInt(specificForm.capacity)
          console.log('📊 Capacity desde specificForm:', { specificFormCapacity: specificForm.capacity, capNum, isNaN: isNaN(capNum) })
          return isNaN(capNum) ? null : capNum
        }
        // Fallback a generalForm.capacity (para creación)
        if (generalForm.capacity === 'ilimitada') {
          console.log('📊 Capacity como ilimitada, retornando 500')
          return 500
        }
        if (generalForm.capacity === 'limitada' && generalForm.stockQuantity) {
          const stockNum = parseInt(generalForm.stockQuantity)
          console.log('📊 Capacity desde generalForm limitada:', { 
            generalFormCapacity: generalForm.capacity, 
            stockQuantity: generalForm.stockQuantity, 
            stockNum, 
            isNaN: isNaN(stockNum),
            result: isNaN(stockNum) ? null : stockNum
          })
          return isNaN(stockNum) ? null : stockNum
        }
        console.log('📊 Capacity retornando null (ninguna condición cumplida):', {
          generalFormCapacity: generalForm.capacity,
          stockQuantity: generalForm.stockQuantity,
          hasStockQuantity: !!generalForm.stockQuantity
        })
        return null
      })()

      console.log('📊 Capacity final calculado:', { capacity, capacityType: typeof capacity })

      // Verificar que el usuario esté autenticado
      if (!user) {
        console.error('❌ Usuario no autenticado')
        return
      }
      
      console.log('👤 Usuario autenticado:', {
        id: user.id,
        email: user.email
      })

      // Preparar datos del producto - VERSIÓN ULTRA SIMPLE
      const productData = {
        name: generalForm.name, // ✅ Corregido: name en lugar de title
        description: generalForm.description,
        price: parseFloat(generalForm.price),
        modality: selectedType || 'program', // ✅ Corregido: modality en lugar de type
        categoria: productCategory,
        level: specificForm.level || 'beginner', // ✅ Corregido: level en lugar de difficulty
        capacity: capacity, // ✅ capacity guarda el stock (no stockQuantity)
        type: generalForm.modality || 'online', // ✅ Corregido: type en lugar de modality
        included_meet_credits: selectedType === 'workshop' ? 0 : (generalForm.included_meet_credits || 0),
        is_public: generalForm.is_public !== false,
        // stockQuantity no existe - capacity es el campo que guarda el stock
        coach_id: user.id,
        // ✅ Usar las URLs finales (subidas o existentes)
        image_url: finalImageUrl,
        video_url: finalVideoUrl,
        // Enviar todos los ejercicios (existentes + nuevos del CSV)
        csvData: persistentCsvData || [],
        // Incluir planificación semanal
        weeklySchedule: persistentCalendarSchedule || null,
        periods: periods,
        editingProductId: editingProduct?.id,
        // ✅ INCLUIR DATOS DE TALLERES
        workshopSchedule: selectedType === 'workshop' ? workshopSchedule : null,
        workshopMaterial: selectedType === 'workshop' ? finalWorkshopMaterial : null,
        // ✅ ENVIAR OBJETIVOS COMO ARRAY (la API los guardará en workshop_type)
        objetivos: generalForm.objetivos && generalForm.objetivos.length > 0 ? generalForm.objetivos : [],
        restricciones: generalForm.restricciones && generalForm.restricciones.length > 0 ? generalForm.restricciones : [],
        // ✅ WORKSHOP_TYPE (objetivos se manejan por separado)
        workshop_type: null,
        // ✅ INCLUIR DATOS DE UBICACIÓN PARA MODALIDAD PRESENCIAL
        location_name: generalForm.location_name || null,
        location_url: generalForm.location_url || null,
        // ✅ INCLUIR MODO DE TALLER Y PARTICIPANTES POR CLASE
        workshop_mode: selectedType === 'workshop' ? (generalForm.workshop_mode || 'grupal') : undefined,
        participants_per_class: selectedType === 'workshop' && generalForm.workshop_mode === 'grupal' 
          ? generalForm.participants_per_class || null 
          : null
      }
      
      console.log('📦 Datos preparados para la API:', {
        name: productData.name,
        description: productData.description,
        price: productData.price,
        modality: productData.modality,
        level: productData.level,
        type: productData.type,
        categoria: productData.categoria,
        capacity: productData.capacity,
        capacityType: typeof productData.capacity,
        generalFormCapacity: generalForm.capacity,
        generalFormStockQuantity: generalForm.stockQuantity,
        coach_id: productData.coach_id,
        coach_id_type: typeof productData.coach_id,
        coach_id_length: productData.coach_id?.length,
        hasImage: !!productData.image_url,
        hasVideo: !!productData.video_url,
        image_url: productData.image_url,
        video_url: productData.video_url,
        csvDataLength: productData.csvData.length,
        periods: productData.periods,
        editingProductId: productData.editingProductId,
        isEditing: !!editingProduct,
        // ✅ DATOS DE TALLERES
        workshopScheduleLength: productData.workshopSchedule?.length || 0,
        workshopSchedule: productData.workshopSchedule,
        workshopMaterial: productData.workshopMaterial,
        isWorkshop: selectedType === 'workshop',
        // ✅ WORKSHOP_TYPE
        workshop_type: productData.workshop_type
      })
      
      // Log específico para talleres
      if (selectedType === 'workshop') {
        console.log('🎯 TALLER DETECTADO - Datos del workshop:')
        console.log('  📝 workshopSchedule:', JSON.stringify(productData.workshopSchedule, null, 2))
      }

      // Llamar a la API de creación o actualización
      const isEditing = !!editingProduct
      setPublishProgress(isEditing ? 'Actualizando producto...' : 'Creando producto...')
      console.log('📤 Enviando datos a la API:', {
        endpoint: '/api/products',
        method: isEditing ? 'PUT' : 'POST',
        isEditing,
        editingProductId: productData.editingProductId,
        dataSize: JSON.stringify(productData).length,
        hasImage: !!productData.image_url,
        hasVideo: !!productData.video_url,
        image_url: productData.image_url,
        video_url: productData.video_url
      })
      
      const response = await fetch('/api/products', {
        method: isEditing ? 'PUT' : 'POST', // ✅ PUT para edición, POST para creación
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData)
      })

      const result = await response.json()
      const activityIdForVideos =
        (result?.product?.id && typeof result.product.id === 'number'
          ? result.product.id
          : null) ?? (typeof editingProduct?.id === 'number' ? editingProduct.id : null)

      const uploadVideosForExistingExercisesOnFailure = async (activityId: number | null) => {
        if (
          !activityId ||
          !persistentCsvData ||
          persistentCsvData.length === 0 ||
          selectedType !== 'program'
        ) {
          return
        }

        const candidates = persistentCsvData
          .map((exercise: any, index: number) => ({
            exercise,
            index,
            file: getStoredExerciseVideoFile(exercise, index)
          }))
          .filter(({ exercise, file }) => {
            const rawId = exercise?.id
            const numericId =
              typeof rawId === 'number'
                ? rawId
                : typeof rawId === 'string' && /^\d+$/.test(rawId)
                  ? parseInt(rawId, 10)
                  : null
            if (!numericId) return false

            const hasVideoUrl =
              typeof exercise.video_url === 'string' && exercise.video_url.trim() !== ''
            const isBlob =
              hasVideoUrl && typeof exercise.video_url === 'string' && exercise.video_url.startsWith('blob:')

            return !!file || isBlob
          })

        if (candidates.length === 0) {
          return
        }

        const completedUploads = new Map<
          string,
          {
            url: string
            meta?: {
              url?: string
              videoId?: string
              thumbnailUrl?: string
              libraryId?: number
              fileName?: string
            }
          }
        >()

        const getFileSignature = (file?: File | null) =>
          file ? `file::${file.name || 'unnamed'}::${file.size}` : null

        const assignVideoToExercise = async (
          exerciseIdentifier: number,
          metadata: {
            url?: string
            videoId?: string
            thumbnailUrl?: string
            libraryId?: number
            fileName?: string
          }
        ) => {
          if (!metadata?.videoId || !metadata?.url) {
            return
          }

          try {
            const response = await fetch('/api/bunny/assign-video', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                exerciseId: exerciseIdentifier,
                activityId,
                videoId: metadata.videoId,
                streamUrl: metadata.url,
                thumbnailUrl: metadata.thumbnailUrl ?? null,
                libraryId: metadata.libraryId ?? null,
                fileName: metadata.fileName ?? null
              })
            })

            if (!response.ok) {
              console.error(
                `❌ Error asignando video existente al ejercicio ${exerciseIdentifier}:`,
                response.statusText
              )
            }
          } catch (assignError) {
            console.error(
              `❌ Excepción asignando video existente al ejercicio ${exerciseIdentifier}:`,
              assignError
            )
          }
        }

        const uploadResults: Array<{
          key: string
          index: number
          uploaded: boolean
          videoUrl?: string
          meta: { url?: string; videoId?: string; thumbnailUrl?: string; libraryId?: number; fileName?: string } | null
        }> = []

        for (const { exercise, index, file } of candidates) {
          const key = getExerciseVideoKey(exercise, index)
          const rawId = exercise?.id
          const numericId =
            typeof rawId === 'number'
              ? rawId
              : typeof rawId === 'string' && /^\d+$/.test(rawId)
                ? parseInt(rawId, 10)
                : null

          if (!numericId) {
            uploadResults.push({ key, index, uploaded: false, videoUrl: exercise?.video_url, meta: null })
            continue
          }

          let fileToUpload = file
          const videoUrlIsBlob =
            typeof exercise?.video_url === 'string' && exercise.video_url.startsWith('blob:')

          if (!fileToUpload && videoUrlIsBlob) {
            try {
              const blobResponse = await fetch(exercise.video_url)
              const blob = await blobResponse.blob()
              const fallbackName =
                typeof exercise.video_file_name === 'string' && exercise.video_file_name.trim() !== ''
                  ? exercise.video_file_name.trim()
                  : `exercise-${numericId}-${Date.now()}.mp4`
              fileToUpload = new File([blob], fallbackName, { type: blob.type || 'video/mp4' })
            } catch (blobError) {
              console.error(`❌ Error procesando blob para ejercicio ${exercise.id}:`, blobError)
            }
          }

          if (!fileToUpload) {
            uploadResults.push({ key, index, uploaded: false, videoUrl: exercise?.video_url, meta: null })
            continue
          }

          const signature = getFileSignature(fileToUpload)

          if (signature && completedUploads.has(signature)) {
            const cached = completedUploads.get(signature)!
            const cachedMeta = cached.meta as
              | {
                  url?: string
                  videoId?: string
                  thumbnailUrl?: string
                  libraryId?: number
                  fileName?: string
                }
              | undefined

            const cachedVideoId = cachedMeta?.videoId
            const cachedThumb = cachedMeta?.thumbnailUrl
            const cachedLibraryId = cachedMeta?.libraryId
            const cachedFileName = cachedMeta?.fileName

            if (cachedVideoId && cachedMeta?.url) {
              await assignVideoToExercise(numericId, {
                url: cachedMeta.url,
                videoId: cachedVideoId,
                thumbnailUrl: cachedThumb,
                libraryId: cachedLibraryId,
                fileName: cachedFileName ?? fileToUpload.name
              })
            }

            const fallbackMeta = {
              url: cached.url,
              videoId: cachedVideoId,
              thumbnailUrl: cachedThumb,
              libraryId: cachedLibraryId,
              fileName: cachedFileName ?? fileToUpload.name
            }

            uploadResults.push({
              key,
              index,
              uploaded: true,
              videoUrl: cached.url,
              meta: cachedMeta || fallbackMeta
            })
            continue
          }

          try {
            const formData = new FormData()
            formData.append('file', fileToUpload, fileToUpload.name)
            formData.append('title', fileToUpload.name)
            formData.append('exerciseId', numericId.toString())
            formData.append('activityId', activityId.toString())

            const uploadResponse = await fetch('/api/bunny/upload-video', {
              method: 'POST',
              body: formData
            })

            const uploadJson = await uploadResponse.json()

            if (uploadResponse.ok && uploadJson.success) {
              const meta = {
                url: uploadJson.streamUrl,
                videoId: uploadJson.videoId,
                thumbnailUrl: uploadJson.thumbnailUrl,
                libraryId: uploadJson.libraryId,
                fileName: uploadJson.fileName || fileToUpload.name
              }

              if (signature) {
                completedUploads.set(signature, { url: uploadJson.streamUrl, meta })
              }

              uploadResults.push({
                key,
                index,
                uploaded: true,
                videoUrl: uploadJson.streamUrl,
                meta
              })
            } else {
              console.error('❌ Error subiendo video a Bunny:', uploadJson?.error)
              uploadResults.push({ key, index, uploaded: false, videoUrl: exercise?.video_url, meta: null })
            }
          } catch (uploadError) {
            console.error('❌ Excepción subiendo video a Bunny:', uploadError)
            uploadResults.push({ key, index, uploaded: false, videoUrl: exercise?.video_url, meta: null })
          }
        }

        if (uploadResults.length > 0) {
          setPersistentCsvData((prev) =>
            (prev ?? []).map((exercise, index) => {
              if (!exercise || typeof exercise !== 'object' || Array.isArray(exercise)) {
                return exercise
              }
              const match = uploadResults.find(
                (result) => result.key === getExerciseVideoKey(exercise, index)
              )
              if (!match) {
                return exercise
              }

              const updatedExercise = { ...exercise }
              if (match.videoUrl && typeof match.videoUrl === 'string') {
                updatedExercise.video_url = match.videoUrl
              }
              if (match.meta?.videoId) {
                updatedExercise.bunny_video_id = match.meta.videoId
              }
              if (match.meta?.libraryId !== undefined) {
                updatedExercise.bunny_library_id = match.meta.libraryId
              }
              if (match.meta?.thumbnailUrl) {
                updatedExercise.video_thumbnail_url = match.meta.thumbnailUrl
              }
              if (match.meta?.fileName) {
                updatedExercise.video_file_name = match.meta.fileName
              }
              return updatedExercise
            })
          )

          setExerciseVideoFiles((prev) => {
            const next = { ...prev }
            uploadResults.forEach((result) => {
              if (result.uploaded && result.key && next[result.key]) {
                delete next[result.key]
              }
            })
            return next
          })
        }
      }
      
      console.log('📥 Respuesta de la API:', {
        success: result.success,
        hasError: !!result.error,
        productId: result.product?.id
      })

      if (result.success) {
        console.log(isEditing ? '✅ PRODUCTO ACTUALIZADO EXITOSAMENTE' : '✅ PRODUCTO PUBLICADO EXITOSAMENTE')
        console.log('🎉 ID del producto:', result.product?.id)
        
        // ✅ Limpiar archivos pendientes después de publicar
        setPendingImageFile(null)
        setPendingVideoFile(null)
        console.log('🧹 Archivos pendientes limpiados')
        
        // ✅ GUARDAR EJERCICIOS/PLATOS si hay datos CSV
        let idMapping: Record<string, number> = {} // Declarar fuera para que esté disponible más adelante
        let resolveMappedIdForEntry = (entry: any) => entry?.id
        
        if (persistentCsvData && persistentCsvData.length > 0 && selectedType === 'program') {
          setPublishProgress('Guardando ejercicios...')
          console.log('💾 Guardando platos/ejercicios en la base de datos:', persistentCsvData.length, 'items')
          
          try {
            const endpoint = productCategory === 'nutricion' 
              ? '/api/activity-nutrition/bulk'
              : '/api/activities/exercises/bulk'
            
            const normalizeName = (value: any) => {
              if (value === null || value === undefined) return ''
              return value.toString().trim().toLowerCase()
            }

            const plateMetaByTempId: Record<string, { normalizedName: string }> = {}
            const nameToTempIds: Record<string, string[]> = {}

            const registerTempKey = (
              key: string | number | null | undefined,
              normalizedName: string
            ) => {
              if (key === undefined || key === null) return
              const keyString = String(key)
              plateMetaByTempId[keyString] = { normalizedName }
              if (!normalizedName) return
              if (!nameToTempIds[normalizedName]) {
                nameToTempIds[normalizedName] = []
              }
              if (!nameToTempIds[normalizedName].includes(keyString)) {
                nameToTempIds[normalizedName].push(keyString)
              }
            }

            const plates = persistentCsvData.map((item: any, index: number) => {
              const rawId = item.id ?? item.tempId
              const numericId =
                typeof rawId === 'number'
                  ? rawId
                  : typeof rawId === 'string' && /^\d+$/.test(rawId)
                    ? parseInt(rawId, 10)
                    : null
              const generatedTempId = `exercise-${index + 1}`
              const tempId =
                typeof rawId === 'string' && !/^\d+$/.test(rawId)
                  ? rawId
                  : item.tempId ?? (numericId !== null ? `exercise-${numericId}` : generatedTempId)
              const tempIdString = String(tempId)
              const isExistingRecord =
                item.isExisting === true ||
                (item.isExisting === undefined && typeof rawId === 'number')
              const resolvedId = isExistingRecord
                ? (typeof rawId === 'number'
                    ? rawId
                    : typeof rawId === 'string' && /^\d+$/.test(rawId)
                      ? parseInt(rawId, 10)
                      : rawId)
                : tempIdString

              const normalizedPlateName = normalizeName(
                item['Nombre de la Actividad'] ||
                  item['Nombre'] ||
                  item.nombre ||
                  item.name ||
                  ''
              )

              registerTempKey(tempIdString, normalizedPlateName)
              if (item.tempId) {
                registerTempKey(String(item.tempId), normalizedPlateName)
              }
              if (!isExistingRecord && tempIdString.startsWith('exercise-')) {
                registerTempKey(tempIdString.replace(/^exercise-/, ''), normalizedPlateName)
              }
              if (isExistingRecord) {
                if (typeof resolvedId === 'number') {
                  registerTempKey(resolvedId, normalizedPlateName)
                  registerTempKey(`exercise-${resolvedId}`, normalizedPlateName)
                } else if (
                  typeof resolvedId === 'string' &&
                  /^\d+$/.test(resolvedId)
                ) {
                  registerTempKey(resolvedId, normalizedPlateName)
                  registerTempKey(`exercise-${resolvedId}`, normalizedPlateName)
                }
              }

              if (productCategory === 'nutricion') {
                // Procesar ingredientes
                let ingredientes = null
                try {
                  if (item['Ingredientes'] || item.ingredientes) {
                    const ingredientesRaw = item['Ingredientes'] || item.ingredientes
                    
                    // ✅ Si ya es un array u objeto, usarlo directamente
                    if (Array.isArray(ingredientesRaw) || (typeof ingredientesRaw === 'object' && ingredientesRaw !== null)) {
                      ingredientes = ingredientesRaw
                    } 
                    // ✅ Si es string, intentar parsear como JSON primero
                    else if (typeof ingredientesRaw === 'string') {
                      // Verificar si parece JSON (empieza con [ o {)
                      const trimmed = ingredientesRaw.trim()
                      if ((trimmed.startsWith('[') && trimmed.endsWith(']')) || 
                          (trimmed.startsWith('{') && trimmed.endsWith('}'))) {
                        try {
                          ingredientes = JSON.parse(ingredientesRaw)
                        } catch (parseError) {
                          // Si falla el parse, usar el string tal cual
                          ingredientes = ingredientesRaw
                        }
                      } else {
                        // No es JSON, usar el string tal cual
                        ingredientes = ingredientesRaw
                      }
                    } else {
                      ingredientes = ingredientesRaw
                    }
                  }
                } catch (e) {
                  console.error('Error parseando ingredientes:', e)
                  // En caso de error, usar el valor original
                  ingredientes = item['Ingredientes'] || item.ingredientes || null
                }
                
                // Mapear nombre con múltiples variantes posibles
                const nombreValue = item['Nombre'] || 
                                   item['Nombre del Plato'] || 
                                   item.nombre || 
                                   item.nombre_plato || 
                                   item.title || 
                                   ''
                
                if (!nombreValue || nombreValue.trim() === '') {
                  console.warn('⚠️ BULK: Plato sin nombre en índice', index, 'item:', item)
                }
                
                return {
                  id: isExistingRecord ? resolvedId : tempIdString || `nutrition-${index}`,
                  tempId: tempIdString || `nutrition-${index}`,
                  isExisting: isExistingRecord,
                  is_active: item.is_active !== undefined ? item.is_active : true,
                  nombre: nombreValue,
                  tipo: item['Tipo'] || item.tipo || '',
                  receta: item['Receta'] || item['Descripción'] || item.Descripción || item.descripcion || item.receta || '',
                  descripcion: item['Receta'] || item['Descripción'] || item.Descripción || item.descripcion || item.receta || '',
                  calorias: item['Calorías'] || item.Calorías || item.calorias || '0',
                  proteinas: item['Proteínas (g)'] || item['Proteínas'] || item.proteinas || '0',
                  carbohidratos: item['Carbohidratos (g)'] || item.Carbohidratos || item.carbohidratos || '0',
                  grasas: item['Grasas (g)'] || item.Grasas || item.grasas || '0',
                  ingredientes: ingredientes,
                  porciones: item['Porciones'] || item.porciones || null,
                  minutos: item['Minutos'] || item.minutos || null,
                  video_url: item.video_url || '',
                  video_file_name: item.video_file_name || '',
                  bunny_video_id: item.bunny_video_id || '',
                  bunny_library_id: item.bunny_library_id || '',
                  video_thumbnail_url: item.video_thumbnail_url || ''
                }
              } else {
                return {
                  id: isExistingRecord ? resolvedId : tempIdString,
                  tempId: tempIdString,
                  isExisting: isExistingRecord,
                  is_active: item.is_active !== undefined ? item.is_active : true,
                  nombre: item['Nombre de la Actividad'] || item.nombre || '',
                  descripcion: item['Descripción'] || item.Descripción || item.descripcion || '',
                  duracion_min: item['Duración (min)'] || item.duracion_min || '0',
                  tipo_ejercicio: item['Tipo de Ejercicio'] || item.tipo_ejercicio || '',
                  intensidad: item['Nivel de Intensidad'] || item.intensidad || 'Moderado',
                  equipo_necesario: item['Equipo Necesario'] || item.equipo_necesario || '',
                  detalle_series: item['Detalle de Series (peso-repeticiones-series)'] || item.detalle_series || '',
                  body_parts: item['Partes del Cuerpo'] || item.body_parts || '',
                  calorias: item['Calorías'] || item.Calorías || item.calorias || '0',
                  video_url: item.video_url || '',
                  video_file_name: item.video_file_name || '',
                  bunny_video_id: item.bunny_video_id || '',
                  bunny_library_id: item.bunny_library_id || '',
                  video_thumbnail_url: item.video_thumbnail_url || ''
                }
              }
            })

            // Log de datos antes de enviar
            console.log('📤 BULK: Enviando datos al endpoint:', {
              endpoint,
              activityId: result.product?.id,
              totalPlates: plates.length,
              firstPlate: plates[0] ? {
                id: plates[0].id,
                tempId: plates[0].tempId,
                nombre: plates[0].nombre,
                isExisting: plates[0].isExisting
              } : null
            })

            const bulkResponse = await fetch(endpoint, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                activityId: result.product?.id,
                plates: plates, // o exercises, el nombre no importa en el backend
                exercises: plates
              })
            })

            if (!bulkResponse.ok) {
              const errorText = await bulkResponse.text()
              console.error('❌ BULK: Error en respuesta HTTP:', {
                status: bulkResponse.status,
                statusText: bulkResponse.statusText,
                error: errorText
              })
              alert(`❌ Error al guardar platos/ejercicios: ${bulkResponse.status} ${bulkResponse.statusText}`)
              setIsPublishing(false)
              setPublishProgress('')
              return
            }

            const bulkResult = await bulkResponse.json()
            
            console.log('📥 BULK: Respuesta recibida:', {
              success: bulkResult.success,
              count: bulkResult.count,
              failuresCount: bulkResult.failures?.length || 0,
              firstFailure: bulkResult.failures?.[0] || null
            })
            
            // ✅ Verificar si hay errores en la respuesta
            const successCount = bulkResult.count || 0
            const failureCount = bulkResult.failures?.length || 0
            const allFailed = successCount === 0 && failureCount === plates.length
            
            if (bulkResult.failures && bulkResult.failures.length > 0) {
              console.error('❌ ERRORES al guardar platos/ejercicios:', {
                total: plates.length,
                exitosos: successCount,
                fallidos: failureCount,
                allFailed: allFailed,
                failures: bulkResult.failures.map((f: any) => ({
                  tempId: f.tempId,
                  nombre: f.nombre,
                  motivo: f.motivo,
                  detalles: f.detalles,
                  rawId: f.rawId
                }))
              })
              
              // Mostrar errores al usuario con detalles completos
              const errorMessages = bulkResult.failures.map((f: any, idx: number) => 
                `${idx + 1}. ${f.nombre || f.tempId || 'Plato desconocido'}: ${f.detalles || f.motivo || 'Error desconocido'}`
              ).join('\n')
              
              if (allFailed) {
                alert(`❌ Error: No se pudo guardar ningún plato/ejercicio.\n\nErrores:\n${errorMessages}\n\nPor favor, revisa los datos e intenta nuevamente.`)
                setIsPublishing(false)
                setPublishProgress('')
                return
              } else {
                alert(`⚠️ Se encontraron errores al guardar algunos platos:\n\n${errorMessages}`)
              }
            }
            
            if (bulkResult.success && successCount > 0) {
              console.log('✅ Platos/ejercicios guardados exitosamente:', {
                count: successCount,
                total: plates.length,
                failures: failureCount,
                data: bulkResult.data
              })
              
              // Crear mapeo temporal de IDs temporales a IDs reales (para ambos: nutricion y fitness)
              if (bulkResult.data && Array.isArray(bulkResult.data)) {
                const mappedIds: Record<string, number> = {}

                bulkResult.data.forEach((entry: any, index: number) => {
                  const plate = plates[index] || {}
                  const tempCandidates: string[] = []

                  if (entry?.tempId) tempCandidates.push(entry.tempId)
                  if (plate?.tempId) tempCandidates.push(plate.tempId)
                  if (plate?.id !== undefined) {
                    const idString = String(plate.id)
                    tempCandidates.push(idString)
                    // ✅ Agregar soporte para IDs que empiezan con "nutrition-"
                    if (idString.startsWith('nutrition-')) {
                      tempCandidates.push(idString)
                    } else if (!idString.startsWith('exercise-')) {
                      tempCandidates.push(`exercise-${idString}`)
                      // ✅ También agregar variante "nutrition-" para compatibilidad
                      if (productCategory === 'nutricion') {
                        tempCandidates.push(`nutrition-${idString}`)
                      }
                    }
                  }

                  const realId = entry?.id
                  if (realId) {
                    tempCandidates
                      .filter(Boolean)
                      .forEach((temp) => {
                        const key = String(temp)
                        mappedIds[key] = realId
                        // ✅ Manejar IDs que empiezan con "nutrition-"
                        if (key.startsWith('nutrition-')) {
                          mappedIds[key] = realId
                          mappedIds[key.replace(/^nutrition-/, '')] = realId
                        }
                        if (key.startsWith('exercise-')) {
                          mappedIds[key.replace(/^exercise-/, '')] = realId
                        }
                        mappedIds[String(realId)] = realId
                        mappedIds[`exercise-${realId}`] = realId
                        // ✅ Agregar variante "nutrition-" para nutrición
                        if (productCategory === 'nutricion') {
                          mappedIds[`nutrition-${realId}`] = realId
                        }
                      })
                  }
                })

                Object.assign(idMapping, mappedIds)

                console.log('🔄 Mapeo de IDs temporal -> real:', idMapping)

                const plateTempKeys = Object.keys(plateMetaByTempId)
                const missingTempIds = plateTempKeys.filter((key) => idMapping[key] === undefined)

                if (missingTempIds.length > 0 && result.product?.id) {
                  console.warn('⚠️ IDs temporales sin mapear tras inserción inicial:', missingTempIds)
                  try {
                    // ✅ Usar el endpoint correcto según la categoría
                    const endpoint = productCategory === 'nutricion'
                      ? `/api/activity-nutrition/${result.product.id}?t=${Date.now()}`
                      : `/api/activity-exercises/${result.product.id}?t=${Date.now()}`
                    
                    const exercisesResponse = await fetch(endpoint)
                    if (exercisesResponse.ok) {
                      const exercisesResult = await exercisesResponse.json()
                      const exerciseList: any[] = Array.isArray(exercisesResult?.data)
                        ? exercisesResult.data
                        : Array.isArray(exercisesResult?.exercises)
                          ? exercisesResult.exercises
                          : []

                      console.log(`🔍 Obtenidos ${exerciseList.length} ejercicios/platos para completar mapeo`)

                      exerciseList.forEach((exercise: any, listIndex: number) => {
                        const normalized = normalizeName(
                          exercise?.nombre_ejercicio ||
                          exercise?.nombre ||
                          exercise?.nombre_plato ||
                          exercise?.name ||
                          ''
                        )
                        if (!normalized) return
                        const potentialTempIds = nameToTempIds[normalized] || []
                        
                        // ✅ También agregar IDs temporales basados en el índice si no hay nombre
                        if (potentialTempIds.length === 0) {
                          if (productCategory === 'nutricion') {
                            potentialTempIds.push(`nutrition-${listIndex}`)
                          } else {
                            potentialTempIds.push(`exercise-${listIndex}`)
                          }
                        }
                        
                        potentialTempIds.forEach((tempKey) => {
                          if (idMapping[tempKey] === undefined) {
                            idMapping[tempKey] = exercise.id
                            idMapping[String(exercise.id)] = exercise.id
                            idMapping[`exercise-${exercise.id}`] = exercise.id
                            if (productCategory === 'nutricion') {
                              idMapping[`nutrition-${exercise.id}`] = exercise.id
                            }
                            if (tempKey.startsWith('exercise-')) {
                              idMapping[tempKey.replace(/^exercise-/, '')] = exercise.id
                            }
                            if (tempKey.startsWith('nutrition-')) {
                              idMapping[tempKey.replace(/^nutrition-/, '')] = exercise.id
                            }
                            console.log(`🔁 Mapeo completado vía listado: ${tempKey} -> ${exercise.id}`)
                          }
                        })
                      })
                      
                      console.log('🔄 Mapeo actualizado después de obtener listado:', idMapping)
                    } else {
                      console.warn('⚠️ No se pudo obtener ejercicios para completar mapeo:', exercisesResponse.status)
                    }
                  } catch (fetchError) {
                    console.error('❌ Error obteniendo ejercicios para completar mapeo:', fetchError)
                  }
                }
                
                resolveMappedIdForEntry = (entry: any) => {
                  if (!entry) return entry
                  const potentialKeys: (string | number | undefined | null)[] = [
                    entry.id,
                    entry.tempId,
                    typeof entry.id === 'number' ? `exercise-${entry.id}` : null,
                    typeof entry.id === 'string' && entry.id.startsWith('exercise-')
                      ? entry.id.replace(/^exercise-/, '')
                      : null,
                    // ✅ Agregar soporte para IDs que empiezan con "nutrition-"
                    typeof entry.id === 'string' && entry.id.startsWith('nutrition-')
                      ? entry.id.replace(/^nutrition-/, '')
                      : null,
                    typeof entry.id === 'string' && entry.id.startsWith('nutrition-')
                      ? entry.id
                      : null
                  ]

                  for (const key of potentialKeys) {
                    if (key === undefined || key === null) continue
                    const mapped = idMapping[String(key)]
                    if (mapped !== undefined) {
                      console.log(`✅ ID mapeado: ${key} -> ${mapped}`)
                      return mapped
                    }
                  }

                  const normalizedEntryName = normalizeName(
                    entry.name ||
                      entry['Nombre de la Actividad'] ||
                      entry['Nombre'] ||
                      entry.nombre ||
                      ''
                  )

                  if (normalizedEntryName && nameToTempIds[normalizedEntryName]) {
                    for (const tempKey of nameToTempIds[normalizedEntryName]) {
                      const mapped = idMapping[tempKey]
                      if (mapped !== undefined) {
                        console.log(`✅ ID mapeado por nombre: ${tempKey} -> ${mapped}`)
                        return mapped
                      }
                    }
                  }

                  console.warn(`⚠️ ID no mapeado para entrada:`, { id: entry.id, tempId: entry.tempId, name: normalizedEntryName })
                  return entry.id
                }

                // Actualizar IDs en la planificación antes de guardarla
                if (persistentCalendarSchedule) {
                  const updatedSchedule = JSON.parse(JSON.stringify(persistentCalendarSchedule))
                  for (const weekKey in updatedSchedule) {
                    for (const dayKey in updatedSchedule[weekKey]) {
                      const dayData = updatedSchedule[weekKey][dayKey]
                      if (!dayData) continue

                      if (Array.isArray(dayData.ejercicios)) {
                        dayData.ejercicios = dayData.ejercicios.map((ex: any) => {
                          const resolvedId = resolveMappedIdForEntry(ex)
                          const finalId =
                            typeof resolvedId === 'string' && /^\d+$/.test(resolvedId)
                              ? parseInt(resolvedId, 10)
                              : resolvedId
                          return { ...ex, id: finalId }
                        })
                      }

                      if (Array.isArray(dayData.exercises)) {
                        dayData.exercises = dayData.exercises.map((ex: any) => {
                          const resolvedId = resolveMappedIdForEntry(ex)
                          const finalId =
                            typeof resolvedId === 'string' && /^\d+$/.test(resolvedId)
                              ? parseInt(resolvedId, 10)
                              : resolvedId
                          return { ...ex, id: finalId }
                        })
                      }
                    }
                  }
                  setPersistentCalendarSchedule(updatedSchedule)
                  console.log('✅ Planificación actualizada con IDs reales')
                }
              }
            } else {
              console.error('❌ Error guardando platos/ejercicios:', bulkResult.error)
            }
          } catch (bulkError) {
            console.error('❌ Error en llamada bulk de platos/ejercicios:', bulkError)
          }
        }

        // Pequeña pausa para asegurar que los platos se guardaron antes de crear la planificación
        await new Promise(resolve => setTimeout(resolve, 500))

        // ✅ GUARDAR PLANIFICACIÓN SEMANAL si existe
        if (persistentCalendarSchedule && Object.keys(persistentCalendarSchedule).length > 0 && selectedType === 'program') {
          console.log('📅 Guardando planificación semanal:', Object.keys(persistentCalendarSchedule).length, 'semanas')
          
          // Actualizar IDs temporales con IDs reales si tenemos el mapeo
          let scheduleToSave = persistentCalendarSchedule
          if (idMapping && Object.keys(idMapping).length > 0) {
            scheduleToSave = JSON.parse(JSON.stringify(persistentCalendarSchedule))
            let totalUpdated = 0
            for (const weekKey in scheduleToSave) {
              for (const dayKey in scheduleToSave[weekKey]) {
                const dayData = scheduleToSave[weekKey][dayKey]
                if (!dayData) continue

                // ✅ Función helper para actualizar ID de un ejercicio
                const updateExerciseId = (ex: any): any => {
                  if (!ex || !ex.id) return ex
                  
                  const resolvedId = resolveMappedIdForEntry(ex)
                  let finalId = resolvedId
                  
                  // ✅ Convertir string numérico a número
                  if (typeof resolvedId === 'string' && /^\d+$/.test(resolvedId)) {
                    finalId = parseInt(resolvedId, 10)
                  }
                  
                  // ✅ Si el ID cambió, actualizarlo
                  if (finalId !== ex.id && finalId !== undefined && finalId !== null) {
                    console.log(`🔧 Actualizando ID en planificación: ${ex.id} -> ${finalId}`, {
                      week: weekKey,
                      day: dayKey,
                      originalId: ex.id,
                      newId: finalId,
                      name: ex.name || ex.nombre || ex['Nombre de la Actividad']
                    })
                    totalUpdated++
                    return { ...ex, id: finalId }
                  }
                  
                  return ex
                }

                if (Array.isArray(dayData.ejercicios)) {
                  dayData.ejercicios = dayData.ejercicios.map(updateExerciseId)
                }

                if (Array.isArray(dayData.exercises)) {
                  dayData.exercises = dayData.exercises.map(updateExerciseId)
                }
                
                // ✅ También actualizar si los ejercicios están en un objeto con estructura diferente
                if (dayData.ejercicios && !Array.isArray(dayData.ejercicios) && typeof dayData.ejercicios === 'object') {
                  const ejerciciosObj = dayData.ejercicios as any
                  if (Array.isArray(ejerciciosObj.ejercicios)) {
                    ejerciciosObj.ejercicios = ejerciciosObj.ejercicios.map(updateExerciseId)
                  }
                }
              }
            }
            console.log(`✅ Planificación actualizada con IDs reales: ${totalUpdated} IDs actualizados`)
          }
          
          try {
            // Pre-chequeo: evitar llamada si excede el límite conocido (fallback 4 semanas para plan free)
            const uniqueWeeks = Object.keys(scheduleToSave || {}).length
            const totalWeeksToSave = (uniqueWeeks > 0 ? uniqueWeeks : 1) * (periods || 1)
            const fallbackWeeksLimit = 4
            if (totalWeeksToSave > fallbackWeeksLimit) {
              const msg = `El número de semanas (${totalWeeksToSave}) excede el límite de tu plan (free: ${fallbackWeeksLimit} semanas). Reduce el número de semanas o períodos.`
              console.error('❌ Evitando POST /api/save-weekly-planning por exceso de semanas:', { totalWeeksToSave, fallbackWeeksLimit })
              alert(msg)
              // Llevar al usuario al paso del planificador para corregir
              setCurrentStep('weeklyPlan' as any)
              setIsPublishing(false)
              setPublishProgress('')
              return
            }
            setPublishProgress('Guardando planificación semanal...')
            const planningResponse = await fetch('/api/save-weekly-planning', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                activityId: result.product?.id,
                weeklySchedule: scheduleToSave,
                periods: periods || 1
              })
            })

            const planningResult = await planningResponse.json()
            if (planningResult.success) {
              console.log('✅ Planificación semanal guardada exitosamente:', planningResult.weeksSaved, 'semanas')
            } else {
              console.error('❌ Error guardando planificación semanal:', planningResult.error)
            }
          } catch (planningError) {
            console.error('❌ Error en llamada de planificación semanal:', planningError)
          }
        }
        
        // Guardar videos de ejercicios si hay datos CSV con videos
        if (persistentCsvData && persistentCsvData.length > 0) {
          const exercisesWithPotentialVideos = persistentCsvData
            .map((exercise: any, index: number) => ({
              exercise,
              index,
              file: getStoredExerciseVideoFile(exercise, index)
            }))
            .filter(({ exercise, file }) => {
              if (!exercise || exercise.id === undefined || exercise.id === null) {
                return false
              }
              const hasVideoUrl =
                typeof exercise.video_url === 'string' && exercise.video_url.trim() !== ''
              return hasVideoUrl || !!file
            })

          if (exercisesWithPotentialVideos.length > 0) {
            const blobUrlCache = new Map<
              string,
              {
                url: string
                meta?: {
                  url?: string
                  videoId?: string
                  thumbnailUrl?: string
                  libraryId?: number
                  fileName?: string
                }
              }
            >()
            const completedUploads = new Map<
              string,
              {
                url: string
                meta?: {
                  url?: string
                  videoId?: string
                  thumbnailUrl?: string
                  libraryId?: number
                  fileName?: string
                }
              }
            >()

            const getFileSignature = (file?: File | null) =>
              file ? `file::${file.name || 'unnamed'}::${file.size}` : null

            const getNameSignature = (exercise: any) => {
              if (
                exercise &&
                typeof exercise === 'object' &&
                typeof exercise.video_file_name === 'string'
              ) {
                const normalized = exercise.video_file_name.trim().toLowerCase()
                if (normalized) {
                  return `name::${normalized}`
                }
              }
              return null
            }

            const activityIdForAssignment = result.product?.id

            const assignVideoToExercise = async (
              exerciseIdentifier: number,
              metadata: {
                url?: string
                videoId?: string
                thumbnailUrl?: string
                libraryId?: number
                fileName?: string
              }
            ) => {
              if (
                !activityIdForAssignment ||
                !metadata?.videoId ||
                !metadata?.url
              ) {
                return
              }

              try {
                const response = await fetch('/api/bunny/assign-video', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    exerciseId: exerciseIdentifier,
                    activityId: activityIdForAssignment,
                    videoId: metadata.videoId,
                    streamUrl: metadata.url,
                    thumbnailUrl: metadata.thumbnailUrl ?? null,
                    libraryId: metadata.libraryId ?? null,
                    fileName: metadata.fileName ?? null
                  })
                })

                if (!response.ok) {
                  console.error(
                    `❌ Error asignando video existente al ejercicio ${exerciseIdentifier}:`,
                    response.statusText
                  )
                  return
                }

                const assignResult = await response.json()
                if (!assignResult?.success) {
                  console.error(
                    `❌ Error asignando video existente al ejercicio ${exerciseIdentifier}:`,
                    assignResult?.error
                  )
                } else {
                  console.log(
                    `♻️ Video reutilizado asignado a ejercicio ${exerciseIdentifier}`
                  )
                }
              } catch (assignError) {
                console.error(
                  `❌ Excepción asignando video existente al ejercicio ${exerciseIdentifier}:`,
                  assignError
                )
              }
            }

            const uploadResults: Array<{
              key: string
              index: number
              uploaded: boolean
              videoUrl?: string
              meta: { url?: string; videoId?: string; thumbnailUrl?: string; libraryId?: number; fileName?: string } | null
            }> = []

            for (const { exercise, index, file } of exercisesWithPotentialVideos) {
              const uploadResult = await (async () => {
                const key = getExerciseVideoKey(exercise, index)

                const candidateKeys = new Set<string>()
                const registerCandidate = (value: any) => {
                  if (value === undefined || value === null) return
                  const str = String(value)
                  if (!str) return
                  candidateKeys.add(str)
                  if (!str.startsWith('exercise-')) {
                    candidateKeys.add(`exercise-${str}`)
                  }
                }

                registerCandidate(exercise?.id)
                registerCandidate(exercise?.tempId)
                registerCandidate(exercise?.tempRowId)
                registerCandidate(exercise?.csvRowId)

                let realExerciseId: number | null = null
                for (const candidate of candidateKeys) {
                  if (idMapping[candidate] !== undefined) {
                    realExerciseId = idMapping[candidate]
                    break
                  }
                }

                if (realExerciseId === null) {
                  const tryParse = (value: any) => {
                    if (value === undefined || value === null) return null
                    const parsed = parseInt(String(value).replace(/^exercise-/, ''), 10)
                    return Number.isNaN(parsed) ? null : parsed
                  }
                  realExerciseId =
                    tryParse(exercise?.id) ??
                    tryParse(exercise?.tempId) ??
                    tryParse(exercise?.tempRowId) ??
                    tryParse(exercise?.csvRowId)
                }

                if (!realExerciseId || !result.product?.id) {
                  console.warn('⚠️ No se pudo resolver ID real para video de ejercicio:', {
                    exerciseId: exercise?.id,
                    realExerciseId,
                    productId: result.product?.id
                  })
                  return { key, index, uploaded: false, videoUrl: exercise?.video_url, meta: null }
                }

                let finalVideoUrl: string | undefined = exercise?.video_url
                let uploaded = false
                let meta: { url?: string; videoId?: string; thumbnailUrl?: string; libraryId?: number; fileName?: string } | null =
                  null

                const videoUrlIsBlob =
                  typeof exercise?.video_url === 'string' && exercise.video_url.startsWith('blob:')
                // PRIORIZAR: Intentar usar archivo guardado de exerciseVideoFiles primero
                let fileToUpload = file || getStoredExerciseVideoFile(exercise, index)

                // Solo intentar fetch del blob si no hay archivo guardado
                if (!fileToUpload && videoUrlIsBlob) {
                  try {
                    const blobResponse = await fetch(exercise.video_url)
                    if (!blobResponse.ok) {
                      console.warn(`⚠️ Blob no disponible para ejercicio ${exercise.id}, saltando video (${blobResponse.status})`)
                      return { key, index, uploaded: false, videoUrl: exercise?.video_url, meta: null }
                    }
                    const blob = await blobResponse.blob()
                    const fallbackName =
                      typeof exercise.video_file_name === 'string' && exercise.video_file_name.trim() !== ''
                        ? exercise.video_file_name.trim()
                        : `exercise-${realExerciseId}-${Date.now()}.mp4`
                    fileToUpload = new File([blob], fallbackName, { type: blob.type || 'video/mp4' })
                  } catch (blobError) {
                    console.warn(`⚠️ Error procesando blob para ejercicio ${exercise.id}, continuando sin video:`, blobError)
                    // No fallar todo el proceso si un blob falla, solo continuar sin ese video
                    return { key, index, uploaded: false, videoUrl: exercise?.video_url, meta: null }
                  }
                }

                const signatureCandidates = new Set<string>()
                const fileSignature = getFileSignature(fileToUpload)
                if (fileSignature) signatureCandidates.add(fileSignature)

                const nameSignature = getNameSignature(exercise)
                if (nameSignature) signatureCandidates.add(nameSignature)

                if (typeof exercise?.video_url === 'string') {
                  signatureCandidates.add(`url::${exercise.video_url}`)
                }
                if (videoUrlIsBlob && typeof exercise?.video_url === 'string') {
                  signatureCandidates.add(`blob::${exercise.video_url}`)
                }

                if (videoUrlIsBlob && blobUrlCache.has(exercise.video_url)) {
                  const cached = blobUrlCache.get(exercise.video_url)!
                  finalVideoUrl = cached.url
                  meta = cached.meta || null
                  uploaded = true

                  if (meta?.url === undefined && finalVideoUrl) {
                    meta = { ...(meta || {}), url: finalVideoUrl }
                  }

                  if (meta?.videoId && finalVideoUrl) {
                    await assignVideoToExercise(realExerciseId, {
                      url: finalVideoUrl,
                      videoId: meta.videoId,
                      thumbnailUrl: meta.thumbnailUrl,
                      libraryId: meta.libraryId,
                      fileName: meta.fileName
                    })
                  }

                  console.log(`♻️ Reutilizando video ya subido para ejercicio ${realExerciseId}`)
                } else if (fileToUpload) {
                  let reused = false
                  for (const signature of signatureCandidates) {
                    if (!signature) continue
                    if (completedUploads.has(signature)) {
                      const cached = completedUploads.get(signature)!
                      finalVideoUrl = cached.url
                      meta = cached.meta || null
                      uploaded = true
                      reused = true

                      if (meta?.url === undefined && finalVideoUrl) {
                        meta = { ...(meta || {}), url: finalVideoUrl }
                      }

                      if (videoUrlIsBlob && !blobUrlCache.has(exercise.video_url)) {
                        blobUrlCache.set(exercise.video_url, {
                          url: finalVideoUrl!,
                          meta: meta || undefined
                        })
                      }

                      if (meta?.videoId && finalVideoUrl) {
                        await assignVideoToExercise(realExerciseId, {
                          url: finalVideoUrl,
                          videoId: meta.videoId,
                          thumbnailUrl: meta.thumbnailUrl,
                          libraryId: meta.libraryId,
                          fileName: meta.fileName ?? fileToUpload.name
                        })
                      }

                      console.log(`♻️ Reutilizando video previamente subido para ejercicio ${realExerciseId}`)
                      break
                    }
                    }

                  if (!reused) {
                    try {
                      const formData = new FormData()
                      formData.append('file', fileToUpload, fileToUpload.name)
                      formData.append('title', fileToUpload.name)
                      formData.append('exerciseId', realExerciseId.toString())
                      formData.append('activityId', result.product.id.toString())

                      const uploadResponse = await fetch('/api/bunny/upload-video', {
                        method: 'POST',
                        body: formData
                      })

                      const uploadResult = await uploadResponse.json()

                      if (uploadResponse.ok && uploadResult.success) {
                        finalVideoUrl = uploadResult.streamUrl
                        uploaded = true
                        meta = {
                          url: uploadResult.streamUrl,
                          videoId: uploadResult.videoId,
                          thumbnailUrl: uploadResult.thumbnailUrl,
                          libraryId: uploadResult.libraryId,
                          fileName: uploadResult.fileName || fileToUpload.name
                        }

                        if (videoUrlIsBlob) {
                          blobUrlCache.set(exercise.video_url, { url: finalVideoUrl!, meta: meta || undefined })
                        }

                        signatureCandidates.forEach((signature) => {
                          if (signature) {
                            completedUploads.set(signature, { url: finalVideoUrl!, meta: meta || undefined })
                          }
                        })

                        console.log(`✅ Video subido a Bunny para ejercicio ${realExerciseId}`)
                      } else {
                        console.error(
                          `❌ Error subiendo video a Bunny para ejercicio ${realExerciseId}:`,
                          uploadResult.error || uploadResponse.statusText
                        )
                      }
                    } catch (uploadError) {
                      console.error(`❌ Error en upload para ejercicio ${realExerciseId}:`, uploadError)
                    }
                  }
                }

                return { key, index, uploaded, videoUrl: finalVideoUrl, meta }
              })()

              uploadResults.push(uploadResult)
            }

            if (uploadResults.length > 0) {
                  setPersistentCsvData((prev) =>
                    (prev ?? []).map((exercise, index) => {
                      if (!exercise || typeof exercise !== 'object' || Array.isArray(exercise)) {
                        return exercise
                      }
                      const match = uploadResults.find(
                        (result) => result.key === getExerciseVideoKey(exercise, index)
                      )
                      if (!match) {
                        return exercise
                      }

                      const updatedExercise = { ...exercise }
                      if (match.videoUrl && typeof match.videoUrl === 'string') {
                        updatedExercise.video_url = match.videoUrl
                      }
                      if (match.meta?.videoId) {
                        updatedExercise.bunny_video_id = match.meta.videoId
                      }
                      if (match.meta?.libraryId !== undefined) {
                        updatedExercise.bunny_library_id = match.meta.libraryId
                      }
                      if (match.meta?.thumbnailUrl) {
                        updatedExercise.video_thumbnail_url = match.meta.thumbnailUrl
                      }
                      if (match.meta?.fileName) {
                        updatedExercise.video_file_name = match.meta.fileName
                      }
                      return updatedExercise
                    })
                  )

              setExerciseVideoFiles((prev) => {
                const next = { ...prev }
                uploadResults.forEach((result) => {
                  if (result.uploaded && result.key && next[result.key]) {
                    delete next[result.key]
                  }
                })
                return next
              })
            }

            setPublishProgress('Procesando videos...')
            console.log('✅ Videos procesados y guardados en Bunny')
          }
        }
        
        if (videosPendingDeletion.length > 0) {
          try {
            const videosStillUsed = new Set<string>()
            ;(persistentCsvData || []).forEach((exercise: any) => {
              const currentId = exercise?.bunny_video_id
              if (currentId) {
                videosStillUsed.add(String(currentId))
              }
            })

            const deletionsToAttempt = videosPendingDeletion.filter((entry) => {
              if (!entry.bunnyVideoId) return false
              return !videosStillUsed.has(String(entry.bunnyVideoId))
            })

            const successfulDeletes = new Set<string>()

            for (const entry of deletionsToAttempt) {
              try {
                const response = await fetch('/api/bunny/delete-video', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    videoId: entry.bunnyVideoId,
                    exerciseId: entry.exerciseId ? Number(entry.exerciseId) : undefined,
                    activityId: result.product?.id
                  })
                })

                if (response.ok) {
                  const deleteResult = await response.json()
                  if (deleteResult.success) {
                    successfulDeletes.add(String(entry.bunnyVideoId))
                    console.log('🗑️ Video eliminado en Bunny:', entry.bunnyVideoId)
                  } else if (deleteResult.skipped) {
                    console.log('ℹ️ Video no eliminado (aún en uso):', entry.bunnyVideoId)
                  } else {
                    console.warn('⚠️ No se pudo eliminar video en Bunny:', entry.bunnyVideoId, deleteResult.error)
                  }
                } else {
                  console.error('❌ Error HTTP eliminando video en Bunny:', entry.bunnyVideoId, response.status)
                }
              } catch (deleteError) {
                console.error('❌ Excepción eliminando video en Bunny:', entry.bunnyVideoId, deleteError)
              }
            }

            const remainingPending = videosPendingDeletion.filter((entry) => {
              if (!entry.bunnyVideoId) return false
              const idString = String(entry.bunnyVideoId)
              if (videosStillUsed.has(idString)) return true
              return !successfulDeletes.has(idString)
            })

            setVideosPendingDeletion(remainingPending)
          } catch (cleanupError) {
            console.error('⚠️ Error gestionando eliminación de videos:', cleanupError)
          }
        }
        
        onClose(true) // true = se guardaron cambios exitosamente
        // ✅ NO recargar la página para poder ver los logs
        // Disparar evento para actualizar estadísticas del producto
        if (result.product?.id) {
          console.log('🔄 Disparando evento productUpdated para producto:', result.product.id)
          window.dispatchEvent(new CustomEvent('productUpdated', { 
            detail: { productId: result.product.id } 
          }))
        }
        
        // window.location.reload()
      } else {
        console.error('❌ ERROR AL PUBLICAR PRODUCTO:', result.error)
        if (isEditing && activityIdForVideos) {
          try {
            await uploadVideosForExistingExercisesOnFailure(activityIdForVideos)
          } catch (videoError) {
            console.error('❌ Error procesando videos tras fallo de publicación:', videoError)
          }
        }
        setValidationErrors((prev) => [
          ...prev,
          result?.error || 'Error desconocido al actualizar el producto'
        ])
        setIsPublishing(false)
        setPublishProgress('')
        return
      }
    } catch (error) {
      console.error('Error al publicar producto:', error)
      alert('Error al publicar el producto')
      setIsPublishing(false)
      setPublishProgress('')
    } finally {
      // Asegurar que el estado se limpia al final
      setIsPublishing(false)
      setPublishProgress('')
    }
  }

  // ✅ Función para cargar datos de talleres desde el backend
  const loadWorkshopData = async (activityId: number) => {
    try {
      console.log('📡 Cargando datos de taller desde el backend para activityId:', activityId)
      
      // Cargar datos desde la tabla taller_detalles
      const response = await fetch(`/api/taller-detalles?actividad_id=${activityId}`)
      if (!response.ok) {
        throw new Error('Error al cargar datos del taller')
      }
      
      const { success, data: tallerDetalles, calendarEvents } = await response.json()
      console.log('📊 Datos del taller cargados desde taller_detalles:', tallerDetalles)
      
      if (success && Array.isArray(tallerDetalles)) {
        // Convertir a formato esperado por el componente
        const sessions: Array<{
          title?: string
          description?: string
          date: string
          startTime: string
          endTime: string
          duration: number
          isPrimary?: boolean
        }> = []

        const calculateDuration = (startTime?: string, endTime?: string) => {
          try {
            if (!startTime || !endTime) return 0
            const [startHour, startMin] = String(startTime).split(':').map((n) => parseInt(n, 10))
            const [endHour, endMin] = String(endTime).split(':').map((n) => parseInt(n, 10))
            if (
              !Number.isFinite(startHour) ||
              !Number.isFinite(startMin) ||
              !Number.isFinite(endHour) ||
              !Number.isFinite(endMin)
            ) {
              return 0
            }
            const startMinutes = startHour * 60 + startMin
            const endMinutes = endHour * 60 + endMin
            const diffMinutes = endMinutes - startMinutes
            if (!Number.isFinite(diffMinutes) || diffMinutes <= 0) return 0
            return Math.round((diffMinutes / 60) * 10) / 10
          } catch {
            return 0
          }
        }
        
        // Extraer todas las fechas existentes para verificar si ya pasaron
        const allExistingDates: string[] = []
        
        // Procesar cada tema de taller
        tallerDetalles.forEach((tema: any) => {
          console.log('🎯 Procesando tema:', tema.nombre)

          // Procesar horarios originales (puede venir como JSON string desde la BD)
          let originales = tema.originales
          try {
            if (typeof originales === 'string') {
              const trimmed = originales.trim()
              if (trimmed) {
                originales = JSON.parse(trimmed)
              }
            }
          } catch (e) {
            console.warn('⚠️ No se pudo parsear tema.originales, se ignora:', {
              tema: tema?.nombre,
              originalesRaw: typeof tema?.originales === 'string' ? tema.originales.slice(0, 80) : tema?.originales,
              error: e
            })
            originales = null
          }

          // Normalizar múltiples formatos históricos
          // - { fechas_horarios: [...] }
          // - { fechas_horarios: "{...}" } (string)
          // - [ {fecha,hora_inicio,hora_fin,...}, ... ]
          // - { originales: { fechas_horarios: [...] } }
          let fechasHorarios: any[] | null = null
          try {
            if (Array.isArray(originales)) {
              fechasHorarios = originales
            } else if (originales?.fechas_horarios) {
              let fh = originales.fechas_horarios
              if (typeof fh === 'string') {
                const trimmed = fh.trim()
                if (trimmed) {
                  fh = JSON.parse(trimmed)
                }
              }
              if (Array.isArray(fh)) fechasHorarios = fh
              else if (fh?.fechas_horarios && Array.isArray(fh.fechas_horarios)) fechasHorarios = fh.fechas_horarios
            } else if (originales?.originales?.fechas_horarios && Array.isArray(originales.originales.fechas_horarios)) {
              fechasHorarios = originales.originales.fechas_horarios
            }
          } catch (e) {
            console.warn('⚠️ No se pudo normalizar fechas_horarios:', { tema: tema?.nombre, error: e })
            fechasHorarios = null
          }

          if (!fechasHorarios) {
            console.log('⚠️ Tema sin fechas_horarios detectables:', {
              tema: tema?.nombre,
              originalesType: Array.isArray(originales) ? 'array' : typeof originales,
              originalesKeys: originales && typeof originales === 'object' ? Object.keys(originales) : null,
              originalesSample: (() => {
                try {
                  if (typeof originales === 'string') return originales.slice(0, 120)
                  return originales
                } catch {
                  return null
                }
              })()
            })
          }

          if (fechasHorarios && Array.isArray(fechasHorarios)) {
            fechasHorarios.forEach((horario: any) => {
              const fecha = horario?.fecha
              const horaInicio = horario?.hora_inicio
              const horaFin = horario?.hora_fin
              if (!fecha || !horaInicio || !horaFin) return

              allExistingDates.push(fecha)
              sessions.push({
                title: tema.nombre,
                description: tema.descripcion || '',
                date: fecha,
                startTime: horaInicio,
                endTime: horaFin,
                duration: calculateDuration(horaInicio, horaFin),
                isPrimary: true
              })
            })
          }
        })
        
        console.log('✅ Sesiones procesadas desde taller_detalles:', sessions)

        // Fallback: si taller_detalles no tiene horarios, usar calendar_events (workshop)
        if (sessions.length === 0 && Array.isArray(calendarEvents) && calendarEvents.length > 0) {
          const formatDateToLocalString = (date: Date): string => {
            const year = date.getFullYear()
            const month = String(date.getMonth() + 1).padStart(2, '0')
            const day = String(date.getDate()).padStart(2, '0')
            return `${year}-${month}-${day}`
          }

          const formatTimeHHMM = (date: Date): string => {
            const hh = String(date.getHours()).padStart(2, '0')
            const mm = String(date.getMinutes()).padStart(2, '0')
            return `${hh}:${mm}`
          }

          const fromCalendar: typeof sessions = []
          const extractedDates: string[] = []

          calendarEvents.forEach((ev: any) => {
            try {
              const start = ev?.start_time ? new Date(ev.start_time) : null
              const end = ev?.end_time ? new Date(ev.end_time) : null
              if (!start || !end || isNaN(start.getTime()) || isNaN(end.getTime())) return

              const titleRaw = String(ev?.title || '').trim()
              const topicTitle = titleRaw.replace(/^taller\s*:\s*/i, '').trim() || 'Sin título'
              const dateStr = formatDateToLocalString(start)
              const startTime = formatTimeHHMM(start)
              const endTime = formatTimeHHMM(end)

              extractedDates.push(dateStr)
              fromCalendar.push({
                title: topicTitle,
                description: '',
                date: dateStr,
                startTime,
                endTime,
                duration: calculateDuration(startTime, endTime),
                isPrimary: true
              })
            } catch {
              return
            }
          })

          if (fromCalendar.length > 0) {
            console.log('♻️ Fallback calendar_events → sessions:', {
              count: fromCalendar.length,
              sample: fromCalendar.slice(0, 3)
            })
            sessions.push(...fromCalendar)
            allExistingDates.push(...extractedDates)
          }
        }

        setWorkshopSchedule(sessions)
        setExistingWorkshopDates(allExistingDates)
        
        // Cargar PDFs existentes (general y por tema)
        await loadWorkshopPdfs(activityId, tallerDetalles)
        
        // Verificar si todas las fechas existentes ya pasaron (solo si se está editando un taller existente)
        // NO mostrar confirmación si se abre desde "Agregar nuevas fechas" (initialStep === 'workshopSchedule')
        console.log('🔍 loadWorkshopData - Verificando fechas:', { 
          allExistingDatesCount: allExistingDates.length, 
          editingProductId: editingProduct?.id, 
          initialStep,
          currentStep 
        })
        
        if (allExistingDates.length > 0 && editingProduct?.id && initialStep !== 'workshopSchedule' && currentStep !== 'workshopSchedule') {
          const now = new Date()
          now.setHours(0, 0, 0, 0)
          
          const allDatesPassed = allExistingDates.every((dateStr: string) => {
            const date = new Date(dateStr)
            date.setHours(0, 0, 0, 0)
            return date < now
          })
          
          if (allDatesPassed) {
            // Todas las fechas existentes ya pasaron, mostrar confirmación
            console.log('📅 Todas las fechas existentes del taller ya pasaron, solicitando confirmación')
            setShowWorkshopFinishedConfirm(true)
          }
        } else if (initialStep === 'workshopSchedule' || currentStep === 'workshopSchedule') {
          console.log('✅ Abriendo desde paso 4 (workshopSchedule), no mostrar confirmación de fechas pasadas', { initialStep, currentStep })
        }
      }
      
    } catch (error) {
      console.error('❌ Error cargando datos del taller:', error)
    }
  }

  // Cargar PDFs existentes del taller (general y por tema)
  const loadWorkshopPdfs = async (activityId: number, tallerDetalles: any[]) => {
    try {
      // Cargar PDF general desde editingProduct o activity_media
      let generalPdfUrl: string | null = null
      if (editingProduct) {
        generalPdfUrl = editingProduct.activity_media?.find((m: any) => m.pdf_url)?.pdf_url || 
                        editingProduct.media?.pdf_url
      }
      
      // Cargar PDFs por tema desde taller_detalles
      const topicPdfs: Record<string, { file: File | null, url: string | null, fileName: string | null }> = {}
      let hasTopicPdfs = false
      
      console.log('🔍 Buscando PDFs en taller_detalles:', tallerDetalles.map((t: any) => ({
        nombre: t.nombre,
        tienePdf: !!t.pdf_url,
        pdf_url: t.pdf_url ? t.pdf_url.substring(0, 50) + '...' : null,
        pdf_file_name: t.pdf_file_name
      })))
      
      tallerDetalles.forEach((tema: any) => {
        if (tema.pdf_url) {
          topicPdfs[tema.nombre] = {
            file: null, // No tenemos el archivo, solo la URL
            url: tema.pdf_url,
            fileName: tema.pdf_file_name || 'PDF adjunto'
          }
          hasTopicPdfs = true
          console.log(`✅ PDF encontrado para tema "${tema.nombre}":`, {
            fileName: tema.pdf_file_name || 'PDF adjunto',
            url: tema.pdf_url?.substring(0, 50) + '...'
          })
        } else {
          console.log(`ℹ️ Tema "${tema.nombre}" no tiene PDF (pdf_url: ${tema.pdf_url})`)
        }
      })
      
      if (hasTopicPdfs) {
        console.log('📦 Estableciendo pdfType a "by-topic" y cargando PDFs:', Object.keys(topicPdfs))
        console.log('📦 Detalles de PDFs cargados:', Object.entries(topicPdfs).map(([key, value]) => ({
          tema: key,
          fileName: value.fileName,
          url: value.url ? value.url.substring(0, 50) + '...' : null,
          hasFile: !!value.file,
          hasUrl: !!value.url
        })))
        setWorkshopMaterial(prev => {
          // Preservar PDFs que ya están cargados como archivos (no sobrescribirlos)
          const preservedPdfs: Record<string, { file: File | null, url: string | null, fileName: string | null }> = {}
          Object.entries(prev.topicPdfs).forEach(([key, value]) => {
            // Si hay un archivo cargado (no solo URL), preservarlo
            if (value.file) {
              preservedPdfs[key] = value
              console.log(`📦 Preservando PDF con archivo para tema "${key}"`)
            }
          })
          
          // Combinar: primero los preservados, luego los de la BD (solo si no hay archivo preservado)
          const mergedPdfs: Record<string, { file: File | null, url: string | null, fileName: string | null }> = {
            ...preservedPdfs
          }
          
          // Agregar PDFs de la BD solo si no hay uno preservado para ese tema
          Object.entries(topicPdfs).forEach(([key, value]) => {
            if (!preservedPdfs[key]) {
              mergedPdfs[key] = value
            }
          })

          const nextState: typeof prev = {
            ...prev,
            pdfType: 'by-topic', // Forzar a 'by-topic' si hay PDFs por tema
            topicPdfs: mergedPdfs
          }
          console.log('📦 Nuevo estado de workshopMaterial:', {
            pdfType: nextState.pdfType,
            topicPdfsKeys: Object.keys(nextState.topicPdfs),
            topicPdfsDetails: Object.entries(nextState.topicPdfs).map(([key, value]) => ({
              tema: key,
              fileName: value.fileName,
              hasUrl: !!value.url,
              hasFile: !!value.file
            }))
          })
          return nextState
        })
        console.log('✅ PDFs por tema cargados en estado:', Object.keys(topicPdfs))
      } else if (generalPdfUrl) {
        setWorkshopMaterial(prev => ({
          ...prev,
          pdfType: 'general',
          pdfUrl: generalPdfUrl,
          pdfFile: null
        }))
      } else {
        console.log('ℹ️ No se encontraron PDFs por tema en taller_detalles')
      }
    } catch (error) {
      console.error('❌ Error cargando PDFs del taller:', error)
    }
  }

  const lastWorkshopScheduleLoadedRef = useRef<number | null>(null)

  // Cargar Temas y Horarios cuando se entra al paso 4 (workshopSchedule) si estamos editando
  useEffect(() => {
    if (currentStep !== 'workshopSchedule') return
    if (!editingProduct?.id) return
    if (selectedType !== 'workshop') return

    if (lastWorkshopScheduleLoadedRef.current === editingProduct.id) return
    lastWorkshopScheduleLoadedRef.current = editingProduct.id

    loadWorkshopData(editingProduct.id)
  }, [currentStep, editingProduct?.id, selectedType])

  // Cargar PDFs cuando se entra al paso 5 (workshopMaterial) si estamos editando
  // IMPORTANTE: Siempre recargar cuando se entra al paso 5 para asegurar que los PDFs se muestren
  useEffect(() => {
    if (currentStep === 'workshopMaterial' && editingProduct?.id && selectedType === 'workshop') {
      console.log('🔄 [Paso 5] Cargando PDFs para taller:', editingProduct.id)
      const loadPdfsIfNeeded = async () => {
        try {
          const response = await fetch(`/api/taller-detalles?actividad_id=${editingProduct.id}`)
          if (response.ok) {
            const { success, data: tallerDetalles } = await response.json()
            console.log('📥 [Paso 5] Respuesta de taller_detalles:', { success, count: tallerDetalles?.length })
            if (success && Array.isArray(tallerDetalles)) {
              // Siempre recargar los PDFs, incluso si ya estaban cargados
              await loadWorkshopPdfs(editingProduct.id, tallerDetalles)
            }
          } else {
            console.error('❌ [Paso 5] Error en respuesta de taller_detalles:', response.status)
          }
        } catch (error) {
          console.error('❌ Error cargando PDFs en paso 5:', error)
        }
      }
      loadPdfsIfNeeded()
    }
  }, [currentStep, editingProduct?.id, selectedType])

  // Limpiar estado de confirmación cuando cambia el producto o se cierra el modal
  useEffect(() => {
    if (!isOpen || !editingProduct) {
      setShowWorkshopFinishedConfirm(false)
      setWorkshopFinishedConfirmed(false)
      setExistingWorkshopDates([])
    }
  }, [isOpen, editingProduct?.id])

  // Cargar datos del producto a editar
  useEffect(() => {
    if (editingProduct) {
      console.log('🔄 Cargando datos para edición:', editingProduct)
      
      // Limpiar confirmación previa al cargar nuevo producto
      setShowWorkshopFinishedConfirm(false)
      setWorkshopFinishedConfirmed(false)
      setExistingWorkshopDates([])
      setFeedbackSubmitted(false)
      setShowAddNewDatesPrompt(false)
      
      // Verificar si el taller está finalizado
      if (editingProduct.type === 'workshop' && ((editingProduct as any).is_finished || (editingProduct as any).taller_activo === false)) {
        setWorkshopIsFinished(true)
        // Limpiar estados de encuesta antes de verificar
        setShowWorkshopFinishedConfirm(false)
        setWorkshopFinishedConfirmed(false)
        setFeedbackSubmitted(false)
        setShowAddNewDatesPrompt(false)
        
        // Si estamos en el paso 4 (workshopSchedule), significa que ya pasamos por la encuesta
        // No mostrar el modal de encuesta en este caso
        if (initialStep === 'workshopSchedule') {
          console.log('✅ Abriendo desde paso 4 (workshopSchedule), no mostrar encuesta')
          setShowWorkshopFinishedConfirm(false)
          setFeedbackSubmitted(true)
          setShowAddNewDatesPrompt(false)
          // No hacer return, continuar con la carga normal
        } else {
          // Verificar si el coach ya completó la encuesta
          // El rating se guarda en activity_surveys, necesitamos verificar si existe
          const checkCoachSurvey = async () => {
            try {
              const response = await fetch(`/api/activities/${editingProduct.id}/check-coach-survey`)
              const result = await response.json()
              if (result.hasSurvey) {
                // Ya tiene encuesta, mostrar opción de reiniciar
                setFeedbackSubmitted(true)
                setShowAddNewDatesPrompt(true)
                setShowWorkshopFinishedConfirm(false)
              } else {
                // No tiene encuesta, mostrar encuesta primero
                setShowWorkshopFinishedConfirm(true)
                setWorkshopFinishedConfirmed(true) // Ir directo a la encuesta
              }
            } catch (error) {
              console.error('Error verificando encuesta del coach:', error)
              // Por defecto, mostrar encuesta si hay error
              setShowWorkshopFinishedConfirm(true)
              setWorkshopFinishedConfirmed(true)
            }
          }
          checkCoachSurvey()
        }
      } else {
        setWorkshopIsFinished(false)
        // Limpiar estados si no es taller finalizado
        setShowWorkshopFinishedConfirm(false)
        setWorkshopFinishedConfirmed(false)
        setFeedbackSubmitted(false)
        setShowAddNewDatesPrompt(false)
      }
      
      // ✅ LIMPIAR ESTADO LOCAL PRIMERO para evitar que datos de sesiones anteriores persistan
      console.log('🧹 Limpiando estado local antes de cargar datos del backend')
      
      // Limpiar sessionStorage PRIMERO (síncrono) antes de limpiar estado
      if (typeof window !== 'undefined' && editingProduct.id) {
        try {
          const draftKey = `activities_draft_${editingProduct.id}`
          const draftInteractedKey = `activities_draft_${editingProduct.id}_interacted`
          sessionStorage.removeItem(draftKey)
          sessionStorage.removeItem(draftInteractedKey)
          console.log('🧹 SessionStorage limpiado para producto (ANTES de limpiar estado):', editingProduct.id)
        } catch (error) {
          console.warn('⚠️ No se pudo limpiar sessionStorage:', error)
        }
      }
      
      // Ahora limpiar estado local - usar undefined para forzar carga desde backend
      // NO establecer a [] porque eso hace que CSVManagerEnhanced piense que ya hay datos (vacíos)
      // Mantener undefined hasta que los datos se carguen desde el backend
      setPersistentCsvData(undefined) // undefined hace que CSVManagerEnhanced cargue desde backend
      setPersistentSelectedRows(new Set())
      setPersistentCsvFileName('')
      setPersistentCsvLoadedFromFile(false)
      setPersistentCalendarSchedule({})
      setExerciseVideoFiles({})
      // ✅ Limpiar cache de planificación al cambiar de producto
      cachedPlanningFromDBRef.current = null
      
      // Determinar el tipo de producto
      let productType: ProductType = 'workshop'
      if (editingProduct.type === 'program' || editingProduct.type === 'fitness') {
        productType = 'program'
      } else if (editingProduct.type === 'document') {
        productType = 'document'
      }
      
      setSelectedType(productType)
      // Si hay initialStep, usarlo; si no, ir a 'general' para edición normal
      setCurrentStep(initialStep || 'general')
      
      // ✅ ESTABLECER CATEGORÍA DEL PRODUCTO (fitness o nutricion)
      if (editingProduct.categoria) {
        setProductCategory(editingProduct.categoria as 'fitness' | 'nutricion')
        console.log('✅ Categoría del producto establecida:', editingProduct.categoria)

        // Si es un programa, también inicializar el programType para habilitar navegación
        if (productType === 'program') {
          const inferredProgramType: ProgramSubType | null =
            editingProduct.categoria === 'fitness'
              ? 'fitness'
              : editingProduct.categoria === 'nutricion'
                ? 'nutrition'
                : null
          if (inferredProgramType) {
            setSelectedProgramType(inferredProgramType)
          }
        }
      } else {
        // Si no hay categoría, usar fitness por defecto
        setProductCategory('fitness')
        console.log('⚠️ No se encontró categoría, usando fitness por defecto')

        if (productType === 'program') {
          setSelectedProgramType('fitness')
        }
      }
      
      // Cargar datos generales
      
      // Usar la imagen disponible (prioridad: activity_media > media > image_url)
      const imageUrl = editingProduct.activity_media?.[0]?.image_url ||
                      editingProduct.media?.image_url || 
                      editingProduct.image_url
      
      
      // Determinar el tipo de capacidad basándose en el valor actual
      let capacityType = 'ilimitada'
      let stockQuantity = ''
      
      if (editingProduct.capacity) {
        const capacityNum = parseInt(editingProduct.capacity.toString())
        if (!isNaN(capacityNum)) {
          // Si capacity es un número, es limitada
          capacityType = 'limitada'
          stockQuantity = capacityNum.toString()
        } else if (editingProduct.capacity === 'ilimitada' || editingProduct.capacity === 500) {
          capacityType = 'ilimitada'
          stockQuantity = ''
        }
      }
      
      // Establecer datos generales del formulario
      const normalizeModality = (raw: any): 'online' | 'presencial' | 'híbrido' => {
        const value = String(raw || 'online').toLowerCase().trim()
        if (value === 'hibrido') return 'híbrido'
        if (value === 'híbrido') return 'híbrido'
        if (value === 'presencial') return 'presencial'
        return 'online'
      }

      setGeneralFormWithLogs({
        name: editingProduct.name,
        description: editingProduct.description,
        price: String(editingProduct.price || ''),
        image: imageUrl ? { url: imageUrl } : null,
        videoUrl: editingProduct.video_url || '',
        modality: normalizeModality((editingProduct as any).modality),
        included_meet_credits: editingProduct.modality === 'workshop'
          ? 0
          : parseInt(String((editingProduct as any).included_meet_credits ?? '0'), 10) || 0,
        is_public: editingProduct.is_public !== false,
        objetivos: splitSemicolonList((editingProduct as any).objetivos),
        restricciones: splitSemicolonList((editingProduct as any).restricciones),
        capacity: capacityType,
        stockQuantity: stockQuantity,
        location_name: (editingProduct as any).location_name || '',
        location_url: (editingProduct as any).location_url || '',
        workshop_mode: (editingProduct as any).workshop_mode || 'grupal',
        participants_per_class: (editingProduct as any).participants_per_class
      })
      
      // Establecer datos específicos del formulario
      setSpecificFormWithLogs({
        ...specificForm,
        duration: editingProduct.duration?.toString() || '',
        capacity: editingProduct.capacity?.toString() || '',
        level: (editingProduct.difficulty || editingProduct.level || ''),
        stockQuantity: stockQuantity
      })
    }
  }, [editingProduct, initialStep])

  // Si el modal no está abierto, no renderizar nada
  if (!isOpen) return null

  // Calcular el número total de pasos según el tipo
  const totalSteps = selectedType === 'workshop' ? 6 : 5
  const currentStepNumber = getStepNumber(currentStep)

  const stepTitle = useMemo(() => {
    const titleMap: Record<string, string> = {
      type: 'Tipo de producto',
      programType: 'Categoría y entrega',
      general: 'Información básica',
      specific: 'Detalles',
      workshopSchedule: 'Temas y horarios',
      workshopMaterial: 'Material del taller',
      weeklyPlan: 'Organización',
      preview: 'Vista previa'
    }
    return titleMap[currentStep] || (editingProduct ? 'Editar producto' : 'Crear producto')
  }, [currentStep, editingProduct])

  // Renderizar el modal completo
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black z-40 flex items-center justify-center px-4 pt-20 pb-16 sm:pt-16 sm:pb-16"
          onClick={(e) => {
            // Cerrar solo si se hace click en el overlay, no en el modal
            if (e.target === e.currentTarget) {
              onClose(false)
            }
          }}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-[#0B0B0B] rounded-2xl max-w-4xl w-full h-full overflow-hidden flex flex-col border border-white/10 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 z-50 bg-[#0b0b0b]/95 backdrop-blur-md h-14 sm:h-20 flex items-center justify-between px-4 sm:px-6 border-b border-white/10">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => onClose(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
                <h2 className="text-base sm:text-lg font-bold text-white truncate whitespace-nowrap">
                  {stepTitle}
                </h2>
              </div>
              
              {/* Indicador de pasos */}
              <div className="flex items-center gap-2">
                {Array.from({ length: totalSteps }).map((_, index) => {
                  const stepNum = index + 1
                  const isActive = stepNum === currentStepNumber
                  const isCompleted = stepNum < currentStepNumber
                  
                  return (
                    <div
                      key={stepNum}
                      className={`w-2 h-2 rounded-full transition-all ${
                        isActive
                          ? 'bg-[#FF7939] w-8'
                          : isCompleted
                          ? 'bg-[#FF7939]/50'
                          : 'bg-gray-600'
                      }`}
                    />
                  )
                })}
              </div>
            </div>

            {/* Contenido del modal - Scrollable */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              {/* Paso 1: Tipo de Producto */}
              {currentStep === 'type' && (
                <div className="space-y-4">
                  <h3 className="text-base font-semibold text-white mb-6">
                    ¿Qué tipo de producto querés crear?
                  </h3>
                  <div className="flex flex-col gap-3">
                    {/* PROGRAMA */}
                    <button
                      onClick={() => {
                        setSelectedType('program')
                        setCurrentStep('programType')
                      }}
                      className={`p-3 rounded-lg border transition-all text-left flex items-start gap-2 ${
                        selectedType === 'program'
                          ? 'border-[#FF7939] bg-black'
                          : 'border-white/10 bg-black hover:border-[#FF7939]/50'
                      }`}
                    >
                      <div className="flex-shrink-0 mt-0.5">
                        <div className="relative">
                          <FileText className="h-4 w-4 text-[#FF7939]" />
                          {selectedType === 'program' && (
                            <div className="absolute -left-1 top-0 flex flex-col gap-0.5">
                              <div className="w-1 h-1 rounded-full bg-[#FF7939]"></div>
                              <div className="w-1 h-1 rounded-full bg-[#FF7939]"></div>
                              <div className="w-1 h-1 rounded-full bg-[#FF7939]"></div>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-white mb-0.5 uppercase">
                          PROGRAMA
                        </h4>
                        <p className="text-xs text-gray-400 whitespace-normal">
                          Entrenamientos estructurados por semanas
                        </p>
                      </div>
                    </button>

                    {/* DOCUMENTO */}
                    <button
                      onClick={() => {
                        setSelectedType('document')
                        setCurrentStep('programType')
                      }}
                      className={`p-3 rounded-lg border transition-all text-left flex items-start gap-2 ${
                        selectedType === 'document'
                          ? 'border-[#FF7939] bg-black'
                          : 'border-white/10 bg-black hover:border-[#FF7939]/50'
                      }`}
                    >
                      <div className="flex-shrink-0 mt-0.5">
                        <FileText className="h-4 w-4 text-[#FF7939]" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-white mb-0.5 uppercase">
                          DOCUMENTO
                        </h4>
                        <p className="text-xs text-gray-400 whitespace-normal">
                          PDF, guías o manuales descargables
                        </p>
                      </div>
                    </button>

                    {/* TALLER */}
                    <button
                      onClick={() => {
                        setSelectedType('workshop')
                        setCurrentStep('general')
                      }}
                      className={`p-3 rounded-lg border transition-all text-left flex items-start gap-2 ${
                        selectedType === 'workshop'
                          ? 'border-[#FF7939] bg-black'
                          : 'border-white/10 bg-black hover:border-[#FF7939]/50'
                      }`}
                    >
                      <div className="flex-shrink-0 mt-0.5 relative">
                        <Users className="h-4 w-4 text-[#FF7939]" />
                        {selectedType === 'workshop' && (
                          <div className="absolute -top-1 -right-1 w-2 h-2 bg-[#FF7939] rounded-full"></div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-white mb-0.5 uppercase">
                          TALLER
                        </h4>
                        <p className="text-xs text-gray-400 whitespace-normal">
                          Sesión única 1:1 o grupal
                        </p>
                      </div>
                    </button>
                  </div>
                </div>
              )}

              <MediaSelectionModal
                isOpen={isMediaModalOpen}
                onClose={() => setIsMediaModalOpen(false)}
                onMediaSelected={handleMediaSelection}
                mediaType={mediaModalType}
              />

              <MediaSelectionModal
                isOpen={isPdfModalOpen}
                onClose={() => {
                  setIsPdfModalOpen(false)
                  setPdfModalContext(null)
                }}
                onMediaSelected={handlePdfSelected}
                mediaType={'pdf'}
              />

              {/* Paso 2: Categoría y entrega (programas y documentos) */}
              {currentStep === 'programType' && (selectedType === 'program' || selectedType === 'document') && (
                <div className="space-y-4">
                  {selectedType === 'program' && (
                    <>
                      <h3 className="text-base font-semibold text-white mb-6">
                        ¿En qué categoría se enfoca tu producto?
                      </h3>
                      <div className="grid grid-cols-2 gap-3">
                        {([
                          { type: 'fitness' as ProgramSubType, label: 'Fitness', icon: Zap },
                          { type: 'nutrition' as ProgramSubType, label: 'Nutrición', icon: UtensilsCrossed }
                        ]).map(({ type, label, icon: Icon }) => (
                          <button
                            key={type}
                            onClick={() => {
                              setSelectedProgramType(type)
                              setProductCategory(type === 'fitness' ? 'fitness' : 'nutricion')
                            }}
                            className={`p-3 rounded-lg border transition-all text-left ${
                              selectedProgramType === type
                                ? 'border-[#FF7939] bg-[#FF7939]/10'
                                : 'border-white/10 bg-black hover:border-[#FF7939]/50'
                            }`}
                          >
                            <Icon className="h-5 w-5 mb-1 text-[#FF7939]" />
                            <h4 className="text-sm font-semibold text-white">
                              {label}
                            </h4>
                          </button>
                        ))}
                      </div>
                    </>
                  )}

                  <div className="mt-6 space-y-5">
                    <div className="flex items-center justify-between rounded-lg border border-white/10 bg-black p-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {generalForm.is_public ? (
                            <Unlock className="h-4 w-4 text-[#FF7939]" />
                          ) : (
                            <Lock className="h-4 w-4 text-[#FF7939]" />
                          )}
                          <div className="text-sm font-semibold text-white">Visibilidad</div>
                        </div>
                        <div className="text-xs text-gray-400">
                          {generalForm.is_public
                            ? 'Visible en tu perfil y disponible para compra.'
                            : 'Privado: luego se comparte por link de invitación.'}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-xs ${generalForm.is_public ? 'text-white' : 'text-gray-400'}`}>
                          {generalForm.is_public ? 'Público' : 'Privado'}
                        </span>
                        <Switch
                          checked={generalForm.is_public}
                          onCheckedChange={(checked) => {
                            setGeneralFormWithLogs({
                              ...generalForm,
                              is_public: checked
                            })
                          }}
                        />
                      </div>
                    </div>

                    <div className="rounded-lg border border-white/10 bg-black p-4">
                      <div className="mb-3">
                        <div className="text-sm font-semibold text-white">Modalidad</div>
                        <div className="text-xs text-gray-400">Cómo lo recibe tu cliente.</div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        {MODALITY_CHOICES.map(({ value, label, icon: Icon, tone }) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() => {
                              setGeneralFormWithLogs({
                                ...generalForm,
                                modality: value
                              })
                            }}
                            className={`rounded-lg border px-3 py-3 text-left transition-all flex items-center gap-3 ${
                              generalForm.modality === value
                                ? 'border-[#FF7939] bg-[#FF7939]/10'
                                : 'border-white/10 hover:border-[#FF7939]/50'
                            }`}
                          >
                            <Icon className="h-4 w-4 text-[#FF7939]" />
                            <div className="flex-1">
                              <div className="text-sm font-semibold text-white">{label}</div>
                              <div className="text-xs text-gray-400">
                                {value === 'online'
                                  ? 'Acceso desde Omnia.'
                                  : value === 'presencial'
                                    ? 'Se realiza en persona.'
                                    : 'Online + presencial.'}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {(selectedType === 'program' || selectedType === 'document') && (
                      <div className="rounded-lg border border-white/10 bg-black p-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <div className="text-sm font-semibold text-white">Créditos de meet</div>
                            <div className="text-xs text-gray-400">Reuniones 1:1 incluidas por cliente.</div>
                          </div>
                          <Switch
                            checked={(generalForm.included_meet_credits || 0) > 0}
                            onCheckedChange={(checked) => {
                              setGeneralFormWithLogs({
                                ...generalForm,
                                included_meet_credits: checked ? Math.max(generalForm.included_meet_credits || 1, 1) : 0
                              })
                            }}
                          />
                        </div>

                        {(generalForm.included_meet_credits || 0) > 0 && (
                          <div className="mt-4">
                            <div className="text-xs text-gray-400 mb-1">Cantidad</div>
                            <input
                              inputMode="numeric"
                              value={String(generalForm.included_meet_credits || 0)}
                              onChange={(e) => {
                                const raw = e.target.value.replace(/\D/g, '')
                                const parsed = raw === '' ? 0 : Math.max(parseInt(raw, 10) || 0, 0)
                                setGeneralFormWithLogs({
                                  ...generalForm,
                                  included_meet_credits: parsed
                                })
                              }}
                              className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-[#FF7939]"
                              placeholder="0"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Paso 3: General (Información Básica) */}
              {currentStep === 'general' && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <div className="text-sm font-semibold text-white">Video y foto</div>
                    <div className="mx-auto w-full md:w-[60%]">
                      <div
                        className={`relative rounded-xl border border-white/10 bg-black overflow-hidden mx-auto ${
                          inlineMediaType === 'image'
                            ? 'w-[240px] max-w-full aspect-[5/6]'
                            : 'w-full aspect-video'
                        }`}
                      >
                      {inlineMediaType === 'image' && (generalForm.image && typeof generalForm.image === 'object' && 'url' in generalForm.image && generalForm.image.url) ? (
                        <img
                          src={(generalForm.image as any).url}
                          alt="Portada"
                          className="w-full h-full object-cover"
                        />
                      ) : inlineMediaType === 'video' && generalForm.videoUrl ? (
                        <video
                          src={generalForm.videoUrl}
                          className="w-full h-full object-cover"
                          controls
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-500 text-sm">
                          Agregá una foto o un video (16:9)
                        </div>
                      )}
                      </div>

                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => loadInlineMedia('image')}
                            className={`px-3 py-2 rounded-lg border text-xs font-semibold transition-all flex items-center gap-2 ${
                              inlineMediaType === 'image'
                                ? 'border-[#FF7939] bg-[#FF7939]/10 text-white'
                                : 'border-white/10 bg-black text-gray-300 hover:border-[#FF7939]/50'
                            }`}
                          >
                            <ImageIcon className="h-4 w-4 text-[#FF7939]" />
                            Foto
                          </button>
                          <button
                            type="button"
                            onClick={() => loadInlineMedia('video')}
                            className={`px-3 py-2 rounded-lg border text-xs font-semibold transition-all flex items-center gap-2 ${
                              inlineMediaType === 'video'
                                ? 'border-[#FF7939] bg-[#FF7939]/10 text-white'
                                : 'border-white/10 bg-black text-gray-300 hover:border-[#FF7939]/50'
                            }`}
                          >
                            <Video className="h-4 w-4 text-[#FF7939]" />
                            Video
                          </button>
                        </div>

                        <div className="flex items-center gap-2">
                          <input
                            ref={inlineFileInputRef}
                            type="file"
                            accept={inlineMediaType === 'image' ? 'image/*' : 'video/*'}
                            className="hidden"
                            onChange={handleInlineUploadChange}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setMediaModalType(inlineMediaType === 'video' ? 'video' : 'image')
                              setIsMediaModalOpen(true)
                            }}
                            className="px-3 py-2 rounded-lg border border-white/10 bg-black text-xs font-semibold text-gray-300 hover:border-[#FF7939]/50 transition-all flex items-center gap-2"
                            disabled={inlineMediaLoading}
                          >
                            {inlineMediaLoading ? (
                              <Loader2 className="h-4 w-4 animate-spin text-[#FF7939]" />
                            ) : (
                              <Upload className="h-4 w-4 text-[#FF7939]" />
                            )}
                            Subir
                          </button>
                        </div>
                      </div>
                    </div>

                    {inlineMediaError && (
                      <div className="text-xs text-red-400">{inlineMediaError}</div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs text-gray-400">Título</Label>
                      <Input
                        value={generalForm.name}
                        onChange={(e) => setGeneralFormWithLogs({ ...generalForm, name: e.target.value })}
                        placeholder="Ej: Plan de 4 semanas"
                        className="bg-black border-white/10 text-white placeholder:text-gray-600"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs text-gray-400">Descripción</Label>
                      <Textarea
                        value={generalForm.description}
                        onChange={(e) => setGeneralFormWithLogs({ ...generalForm, description: e.target.value })}
                        placeholder="Contá qué incluye y para quién es"
                        className="min-h-[120px] bg-black border-white/10 text-white placeholder:text-gray-600"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="text-sm font-semibold text-white">Intensidad</div>
                    <div className="grid grid-cols-3 gap-2">
                      {INTENSITY_CHOICES.map((choice) => (
                        <button
                          key={choice.value}
                          type="button"
                          onClick={() => setSpecificFormWithLogs({ ...specificForm, level: choice.value })}
                          className={`rounded-lg border px-2 py-2 sm:px-3 sm:py-3 text-left transition-all min-w-0 ${
                            specificForm.level === choice.value
                              ? 'border-[#FF7939] bg-[#FF7939]/10'
                              : 'border-white/10 bg-black hover:border-[#FF7939]/50'
                          }`}
                        >
                          <div className="flex flex-col gap-1">
                            <div className="text-xs sm:text-sm font-semibold text-white truncate">{choice.label}</div>
                            <div className="flex items-center gap-0.5">
                              {Array.from({ length: 3 }).map((_, idx) => (
                                <Flame
                                  key={idx}
                                  className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${idx < choice.flames ? 'text-[#FF7939]' : 'text-white/10'}`}
                                />
                              ))}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm font-semibold text-white">Objetivos</div>
                    <div className="flex items-center gap-2">
                      <Select
                        value={objetivosToAdd}
                        onValueChange={(v) => {
                          setObjetivosToAdd(v)
                          addObjetivo(v)
                          setObjetivosToAdd('')
                        }}
                      >
                        <SelectTrigger className="bg-black border-white/10 text-white">
                          <SelectValue placeholder="Seleccionar objetivo" />
                        </SelectTrigger>
                        <SelectContent className="bg-black border-white/10 text-white">
                          {objectiveOptions.map((group) => (
                            <React.Fragment key={group.label}>
                              <SelectGroup>
                                <SelectLabel className="text-white/70">{group.label}</SelectLabel>
                                {group.options.map((opt) => (
                                  <SelectItem key={`${group.label}-${opt}`} value={opt} className="text-white">
                                    {opt}
                                  </SelectItem>
                                ))}
                              </SelectGroup>
                            </React.Fragment>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {(generalForm.objetivos || []).map((obj) => (
                        <button
                          key={obj}
                          type="button"
                          onClick={() => removeObjetivo(obj)}
                          className="bg-[#FF7939]/20 text-[#FF7939] text-xs px-3 py-1.5 rounded-full font-medium border border-[#FF7939]/30 whitespace-nowrap flex-shrink-0"
                          title="Eliminar"
                        >
                          {obj}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm font-semibold text-white">Restricciones</div>
                    <div className="flex items-center gap-2">
                      <Select
                        value={restriccionesToAdd}
                        onValueChange={(v) => {
                          setRestriccionesToAdd(v)
                          addRestriccion(v)
                          setRestriccionesToAdd('')
                        }}
                      >
                        <SelectTrigger className="bg-black border-white/10 text-white">
                          <SelectValue placeholder="Seleccionar restricción" />
                        </SelectTrigger>
                        <SelectContent className="bg-black border-white/10 text-white">
                          {restrictionOptions.map((group) => (
                            <React.Fragment key={group.label}>
                              <SelectGroup>
                                <SelectLabel className="text-white/70">{group.label}</SelectLabel>
                                {group.options.map((opt) => (
                                  <SelectItem key={`${group.label}-${opt}`} value={opt} className="text-white">
                                    {opt}
                                  </SelectItem>
                                ))}
                              </SelectGroup>
                            </React.Fragment>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {(generalForm.restricciones || []).map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => removeRestriccion(r)}
                          className="bg-white/10 text-white/80 text-xs px-3 py-1.5 rounded-full font-medium border border-white/10 whitespace-nowrap flex-shrink-0"
                          title="Eliminar"
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm font-semibold text-white">Cupos × Precio − Comisión = Total</div>

                    <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                      <div className="grid grid-cols-12 gap-2 items-center text-sm">
                        <button
                          type="button"
                          onClick={handleToggleCapacity}
                          className={`col-span-3 sm:col-span-2 px-2 py-2 rounded-md border text-xs font-semibold transition-all ${
                            isLimitedStock
                              ? 'border-[#FF7939] bg-[#FF7939]/10 text-white'
                              : 'border-white/10 bg-black text-gray-300 hover:border-[#FF7939]/50'
                          }`}
                        >
                          {generalForm.capacity === 'ilimitada' ? '∞' : 'Cupos'}
                        </button>

                        <Input
                          value={generalForm.capacity === 'ilimitada' ? '∞' : generalForm.stockQuantity}
                          onChange={(e) => handleStockQuantityChange(e.target.value)}
                          inputMode="numeric"
                          placeholder="0"
                          disabled={generalForm.capacity === 'ilimitada'}
                          className="col-span-3 sm:col-span-2 h-10 bg-black border-white/10 text-white placeholder:text-gray-600 disabled:opacity-60"
                        />

                        <span className="col-span-1 text-gray-500 text-center">×</span>

                        <div className="col-span-5 sm:col-span-3 flex items-center h-10 rounded-md border border-white/10 bg-black px-3">
                          <span className="text-white/60 mr-2">$</span>
                          <input
                            value={generalForm.price}
                            onChange={(e) => handlePriceChange(e.target.value)}
                            onBlur={handlePriceBlur}
                            placeholder="0.00"
                            className="w-full bg-transparent outline-none text-white placeholder:text-gray-600"
                          />
                        </div>

                        <div className="col-span-12 flex items-center justify-center pt-2">
                          <span className="text-white/70 font-medium">
                            Cupos{' '}
                            {generalForm.capacity === 'ilimitada'
                              ? '∞'
                              : (generalForm.stockQuantity || '0')}
                            {' '}×{' '}
                            ${generalForm.price || '0'}
                          </span>
                        </div>

                        <div className="col-span-12 flex items-center justify-center gap-2 pt-2">
                          <span className="text-gray-500">−</span>
                          <span className="text-white font-semibold">{commissionPercentLabel}</span>
                          <span className="text-gray-500">=</span>
                          <span className="text-white font-bold text-lg">
                            {(() => {
                              if (formattedNetRevenue === '∞') return '∞'
                              if (potentialRevenue === null || priceAmount === null) return '—'
                              const netRevenue = potentialRevenue * (1 - commissionPercent)
                              const formatted = new Intl.NumberFormat('es-AR', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                              }).format(netRevenue)
                              return formatted
                            })()}
                          </span>
                          <span className="text-[#FF7939] font-bold text-lg">ARS</span>
                        </div>
                      </div>

                      <div className="mt-1 text-xs text-gray-500">
                        {potentialRevenue === null
                          ? 'Completá cupos y precio para ver el total.'
                          : `Bruto: ${new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'USD' }).format(potentialRevenue)}.`}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Otros pasos... */}
              {currentStep === 'weeklyPlan' && (
                <div className="space-y-6">
                  {coachCatalogError && (
                    <div className="text-xs text-red-400">{coachCatalogError}</div>
                  )}
                  <WeeklyExercisePlanner
                    activityId={editingProduct?.id}
                    exercises={(persistentCsvData && persistentCsvData.length > 0 ? persistentCsvData : coachCatalogExercises) || []}
                    productCategory={productCategory}
                    initialSchedule={persistentCalendarSchedule}
                    initialPeriods={periods}
                    onScheduleChange={setPersistentCalendarSchedule}
                    onPeriodsChange={setPeriods}
                    onStatsChange={(stats: any) => {
                      setWeeklyStats({
                        semanas: stats?.totalWeeks ?? 0,
                        sesiones: stats?.totalSessions ?? stats?.totalDays ?? 0,
                        ejerciciosTotales: stats?.totalExercisesReplicated ?? stats?.totalExercises ?? 0,
                        ejerciciosUnicos: stats?.uniqueExercises ?? 0
                      })
                    }}
                    planLimits={{
                      weeksLimit: getPlanLimit(planType, 'weeksPerProduct')
                    }}
                  />

                  {coachCatalogLoading && (
                    <div className="text-xs text-gray-500">Cargando ejercicios…</div>
                  )}
                </div>
              )}

              {currentStep === 'workshopSchedule' && (
                <div className="space-y-6">
                  <WorkshopSimpleScheduler
                    sessions={workshopSchedule}
                    onSessionsChange={setWorkshopSchedule}
                  />
                </div>
              )}

              {currentStep === 'workshopMaterial' && selectedType === 'workshop' && (
                <div className="space-y-4">
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setWorkshopMaterial(prev => ({
                            ...prev,
                            pdfType: 'none',
                            pdfFile: null,
                            pdfUrl: null,
                            topicPdfs: {}
                          }))
                        }
                        className={`rounded-lg border px-3 py-3 text-left transition-all ${
                          workshopMaterial.pdfType === 'none'
                            ? 'border-[#FF7939] bg-[#FF7939]/10'
                            : 'border-white/10 bg-white/5 hover:bg-white/10'
                        }`}
                      >
                        <div className="text-sm font-semibold text-white">Sin PDF</div>
                        <div className="text-xs text-gray-400">No agregar material.</div>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setWorkshopMaterial(prev => ({
                            ...prev,
                            pdfType: 'general',
                            topicPdfs: {}
                          }))
                        }
                        className={`rounded-lg border px-3 py-3 text-left transition-all ${
                          workshopMaterial.pdfType === 'general'
                            ? 'border-[#FF7939] bg-[#FF7939]/10'
                            : 'border-white/10 bg-white/5 hover:bg-white/10'
                        }`}
                      >
                        <div className="text-sm font-semibold text-white">Un PDF para todos</div>
                        <div className="text-xs text-gray-400">El mismo archivo en cada tema.</div>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setWorkshopMaterial(prev => ({
                            ...prev,
                            pdfType: 'by-topic',
                            pdfFile: null,
                            pdfUrl: null
                          }))
                        }
                        className={`rounded-lg border px-3 py-3 text-left transition-all ${
                          workshopMaterial.pdfType === 'by-topic'
                            ? 'border-[#FF7939] bg-[#FF7939]/10'
                            : 'border-white/10 bg-white/5 hover:bg-white/10'
                        }`}
                      >
                        <div className="text-sm font-semibold text-white">PDF por tema</div>
                        <div className="text-xs text-gray-400">Un archivo distinto para cada tema.</div>
                      </button>
                    </div>

                    {workshopMaterial.pdfType === 'general' && (
                      <div className="space-y-2">
                        <div className="text-sm font-semibold text-white">PDF general</div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openPdfGallery({ scope: 'general' })}
                            className="inline-flex items-center justify-center w-9 h-9 rounded-md border border-white/10 bg-white/10 hover:bg-white/15 transition-all"
                            title="Seleccionar PDF"
                          >
                            <FileUp className="w-4 h-4 text-[#FF7939]" />
                          </button>
                          {(workshopMaterial.pdfFile || workshopMaterial.pdfUrl) ? (
                            <button
                              type="button"
                              onClick={() =>
                                setWorkshopMaterial(prev => ({
                                  ...prev,
                                  pdfFile: null,
                                  pdfUrl: null
                                }))
                              }
                              className="inline-flex items-center justify-center w-9 h-9 rounded-md border border-white/10 bg-white/10 hover:bg-white/15 transition-all"
                              title="Quitar PDF"
                            >
                              <Trash className="w-4 h-4 text-red-400" />
                            </button>
                          ) : (
                            <div className="text-xs text-gray-500">Sin archivos seleccionados</div>
                          )}
                        </div>
                        {(workshopMaterial.pdfUrl || workshopMaterial.pdfFile) && (
                          <div className="text-xs text-gray-500">
                            {truncateLabel(workshopMaterial.pdfFile?.name || workshopMaterial.pdfUrl || '')}
                          </div>
                        )}
                      </div>
                    )}

                    {workshopMaterial.pdfType === 'by-topic' && (
                      <div className="space-y-3">
                        <div className="text-sm font-semibold text-white">PDFs por tema</div>
                        <div className="space-y-3">
                          {Array.from(
                            new Set(
                              (workshopSchedule || [])
                                .map((s: any) => String(s?.title || '').trim())
                                .filter(Boolean)
                            )
                          ).map((topicTitle) => {
                            const current = workshopMaterial.topicPdfs?.[topicTitle]
                            return (
                              <div
                                key={topicTitle}
                                className="py-2"
                              >
                                <div className="text-sm font-semibold text-white mb-2">{topicTitle}</div>
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => openPdfGallery({ scope: 'topic', topicTitle })}
                                    className="inline-flex items-center justify-center w-9 h-9 rounded-md border border-white/10 bg-white/10 hover:bg-white/15 transition-all"
                                    title="Seleccionar PDF"
                                  >
                                    <FileUp className="w-4 h-4 text-[#FF7939]" />
                                  </button>

                                  {(current?.file || current?.url) ? (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setWorkshopMaterial(prev => {
                                          const next = { ...(prev.topicPdfs || {}) }
                                          delete (next as any)[topicTitle]
                                          return {
                                            ...prev,
                                            topicPdfs: next
                                          }
                                        })
                                      }}
                                      className="inline-flex items-center justify-center w-9 h-9 rounded-md border border-white/10 bg-white/10 hover:bg-white/15 transition-all"
                                      title="Quitar PDF"
                                    >
                                      <Trash className="w-4 h-4 text-red-400" />
                                    </button>
                                  ) : (
                                    <div className="text-xs text-gray-500">Sin archivos seleccionados</div>
                                  )}
                                </div>

                                {(current?.url || current?.file) && (
                                  <div className="text-xs text-gray-500 mt-1">
                                    {truncateLabel(current?.file?.name || current?.url || '')}
                                  </div>
                                )}

                                <div className="mt-3 h-px w-full bg-white/10" />
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {currentStep === 'preview' && (
                <div className="space-y-6">
                  <div className="flex justify-center">
                    <div className="flex-shrink-0 w-48">
                      <ActivityCard
                        activity={{
                          ...(editingProduct ? (editingProduct as any) : {}),
                          // En creación: asegurar título/descripcion
                          title: generalForm.name || (editingProduct as any)?.title || (editingProduct as any)?.name || 'Sin título',
                          description: generalForm.description || (editingProduct as any)?.description || '',
                          categoria: productCategory === 'nutricion' ? 'nutricion' : 'fitness',
                          difficulty: specificForm.level || (editingProduct as any)?.difficulty || 'beginner',
                          ...(selectedType === 'workshop'
                            ? (() => {
                                const titles = new Set<string>()
                                const dates = new Set<string>()
                                ;(workshopSchedule || []).forEach((s: any) => {
                                  const t = String(s?.title || '').trim()
                                  if (t) titles.add(t)
                                  const d = String(s?.date || '').trim()
                                  if (d) dates.add(d)
                                })
                                const now = new Date()
                                now.setHours(0, 0, 0, 0)
                                const hasFuture = (workshopSchedule || []).some((s: any) => {
                                  const ds = String(s?.date || '').trim()
                                  if (!ds) return false
                                  const dd = new Date(ds)
                                  dd.setHours(0, 0, 0, 0)
                                  return dd >= now
                                })
                                return {
                                  type: 'workshop',
                                  cantidadTemas: titles.size,
                                  cantidadDias: dates.size,
                                  // Forzar estado activo en preview si hay fechas futuras
                                  taller_activo: hasFuture,
                                  is_finished: !hasFuture
                                }
                              })()
                            : {}),
                          // Mostrar objetivos seleccionados en el preview
                          objetivos: generalForm.objetivos || [],
                          ...(generalForm.image && typeof generalForm.image === 'object' && 'url' in generalForm.image
                            ? { image_url: (generalForm.image as any).url }
                            : {}),
                          // Reflejar siempre el precio actual del formulario
                          price: (() => {
                            const parsed = parseFloat(String(generalForm.price ?? '').replace(',', '.'))
                            return Number.isFinite(parsed) ? parsed : ((editingProduct as any)?.price ?? 0)
                          })(),
                          previewStats: {
                            sesiones: derivedPreviewStats.sesiones,
                            ejerciciosTotales: derivedPreviewStats.ejerciciosTotales,
                            ejerciciosUnicos: derivedPreviewStats.ejerciciosUnicos
                          }
                        }}
                        size="small"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer con botones de navegación */}
            <div className="sticky bottom-0 z-50 bg-[#0b0b0b]/95 backdrop-blur-md h-16 sm:h-20 flex items-center justify-between px-4 sm:px-6 pb-[calc(env(safe-area-inset-bottom)+12px)] border-t border-white/10">
              <Button
                variant="ghost"
                onClick={() => {
                  const prevStepNumber = currentStepNumber - 1
                  if (prevStepNumber >= 1) {
                    goToStep(prevStepNumber)
                  } else {
                    onClose(false)
                  }
                }}
                className="text-gray-400 hover:text-white"
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Atrás
              </Button>

              <div className="flex gap-3">
                {currentStep === 'preview' ? (
                  <Button
                    onClick={handlePublishProduct}
                    disabled={isPublishing}
                    className="bg-[#FF7939] hover:bg-[#E66829] text-white"
                  >
                    {isPublishing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Publicando...
                      </>
                    ) : (
                      <>
                        Publicar
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    onClick={() => {
                      const nextStepNumber = currentStepNumber + 1
                      if (nextStepNumber <= totalSteps) {
                        goToStep(nextStepNumber)
                      }
                    }}
                    disabled={!selectedType || (currentStep === 'programType' && selectedType === 'program' && !selectedProgramType)}
                    className="border border-white/10 bg-white/10 hover:bg-white/15 backdrop-blur-md text-white shadow-[0_8px_30px_rgba(0,0,0,0.35)]"
                  >
                    Siguiente
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
