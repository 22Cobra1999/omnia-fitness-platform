"use client"

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { ChevronLeft, ChevronRight, ChevronDown, Plus, X, Upload, Calendar, Clock, Users, FileText, Eye, Edit, Check, Video, Play, Image as ImageIcon, Globe, MapPin, Trash2, Target, DollarSign, Eye as EyeIcon, EyeOff, Pencil, Flame, Lock, Unlock, Coins, MonitorSmartphone, Loader2, RotateCcw, RefreshCw, ExternalLink } from "lucide-react"
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

const FITNESS_OBJECTIVE_OPTIONS = [
  'Pérdida de peso',
  'Ganancia muscular',
  'Resistencia',
  'Flexibilidad',
  'Rehabilitación',
  'Bienestar general',
  'Movilidad',
  'Mindfulness',
  'Fuerza',
  'Velocidad',
  'Coordinación',
  'Equilibrio',
  'Potencia'
]

// Opciones específicas de nutrición: más alineadas a tipos de dieta / enfoque alimentario
const NUTRITION_OBJECTIVE_OPTIONS = [
  'Déficit calórico',
  'Mantenimiento',
  'Superávit calórico',
  'Baja en carbohidratos',
  'Keto',
  'Paleo',
  'Vegana',
  'Vegetariana',
  'Mediterránea',
  'Balanceada',
  'Mejorar hábitos',
  'Salud digestiva',
  'Rendimiento deportivo'
]

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
  const [selectedType, setSelectedType] = useState<ProductType | null>(null)
  const [selectedProgramType, setSelectedProgramType] = useState<ProgramSubType | null>(null)
  const [productCategory, setProductCategory] = useState<'fitness' | 'nutricion'>('fitness')
  const [currentStep, setCurrentStep] = useState<'type' | 'programType' | 'general' | 'specific' | 'workshopMaterial' | 'workshopSchedule' | 'weeklyPlan' | 'preview'>(initialStep || 'type')
  const [showDateChangeNoticeLocal, setShowDateChangeNoticeLocal] = useState(showDateChangeNotice)
  
  // Estado para selección de videos
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false)
  const [isVideoPreviewActive, setIsVideoPreviewActive] = useState(false)
  const [csvDataWithVideos, setCsvDataWithVideos] = useState<string[][]>([])

  // Estado para selección de media de portada
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false)
  const [mediaModalType, setMediaModalType] = useState<'image' | 'video'>('image')

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
  
  // Estado persistente del calendario (debe ser objeto, no array)
  const [persistentCalendarSchedule, setPersistentCalendarSchedule] = useState<any>({})
  
  // Flag para saber si la planificación se limpió explícitamente por un cambio fuerte de contenido (eliminar + reemplazar platos/ejercicios)
  // Cuando es true, no debemos volver a cargar la planificación vieja desde el backend en esta sesión de edición
  const [planningClearedByContentChange, setPlanningClearedByContentChange] = useState(false)
  
  // Estado para los períodos del planificador semanal
  const [periods, setPeriods] = useState(1)
  
  // Estado para las estadísticas del paso 5
  const [weeklyStats, setWeeklyStats] = useState({
    semanas: 1,
    sesiones: 0,
    ejerciciosTotales: 0,
    ejerciciosUnicos: 0
  })

  // 🔍 Logs para entender carga de platos/ejercicios existentes en el PASO 4/5
  useEffect(() => {
    // Paso 4 (activities) removido - ahora se gestiona en tab "Mis Ejercicios/Platos"
    // Este useEffect ya no es necesario pero lo mantenemos comentado por si acaso
    if (false && currentStep === 'activities') {
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
    is_public: false,
    objetivos: [] as string[],
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

  // Estado de carga para el botón de publicar/actualizar
  const [isPublishing, setIsPublishing] = useState(false)
  const [publishProgress, setPublishProgress] = useState('')

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
        meta: { videoId?: string; thumbnailUrl?: string; libraryId?: number; fileName?: string } | null
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
        let meta: { videoId?: string; thumbnailUrl?: string; libraryId?: number; fileName?: string } | null =
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
          prev.map((exercise, idx) => {
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

  const handleMediaSelection = (mediaUrl: string, mediaType: 'image' | 'video', mediaFile?: File) => {
    console.log('🎯 CREATE-PRODUCT-MODAL: Media seleccionada:', { 
      mediaUrl, 
      mediaType, 
      isNewFile: !!mediaFile,
      isTemporaryUrl: mediaUrl.startsWith('blob:'),
      mediaFile: mediaFile ? {
        name: mediaFile.name,
        size: mediaFile.size,
        type: mediaFile.type
      } : null
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
      let finalImageUrl = generalForm.image?.url || null
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
            body: formData
          })
          
          if (uploadResponse.ok) {
            const uploadResult = await uploadResponse.json()
            if (uploadResult.success) {
              finalVideoUrl = uploadResult.streamUrl
              uploadedVideoData = {
                streamUrl: uploadResult.streamUrl,
                videoId: uploadResult.videoId,
                thumbnailUrl: uploadResult.thumbnailUrl,
                fileName: pendingVideoFile.name
              }
              console.log('✅ Video subido exitosamente a Bunny.net:', finalVideoUrl)
              console.log('📹 Video ID:', uploadResult.videoId)
            }
          } else {
            console.error('❌ Error subiendo video a Bunny.net')
            alert('Error al subir el video')
            setIsPublishing(false)
            setPublishProgress('')
            return
          }
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
          meta: { videoId?: string; thumbnailUrl?: string; libraryId?: number; fileName?: string } | null
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
            if (cached.meta?.videoId && cached.meta?.url) {
              await assignVideoToExercise(numericId, {
                url: cached.meta.url,
                videoId: cached.meta.videoId,
                thumbnailUrl: cached.meta.thumbnailUrl,
                libraryId: cached.meta.libraryId,
                fileName: cached.meta.fileName ?? fileToUpload.name
              })
            }

            uploadResults.push({
              key,
              index,
              uploaded: true,
              videoUrl: cached.url,
              meta: cached.meta || {
                url: cached.url,
                videoId: cached.meta?.videoId,
                thumbnailUrl: cached.meta?.thumbnailUrl,
                libraryId: cached.meta?.libraryId,
                fileName: cached.meta?.fileName ?? fileToUpload.name
              }
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
            prev.map((exercise, index) => {
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
              meta: { videoId?: string; thumbnailUrl?: string; libraryId?: number; fileName?: string } | null
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
                let meta: { videoId?: string; thumbnailUrl?: string; libraryId?: number; fileName?: string } | null =
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
                          meta
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
                          blobUrlCache.set(exercise.video_url, { url: finalVideoUrl!, meta })
                        }

                        signatureCandidates.forEach((signature) => {
                          if (signature) {
                            completedUploads.set(signature, { url: finalVideoUrl!, meta })
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
                    prev.map((exercise, index) => {
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
      
      const { success, data: tallerDetalles } = await response.json()
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
        
        // Extraer todas las fechas existentes para verificar si ya pasaron
        const allExistingDates: string[] = []
        
        // Procesar cada tema de taller
        tallerDetalles.forEach((tema: any) => {
          console.log('🎯 Procesando tema:', tema.nombre)
          
          // Procesar horarios originales
          if (tema.originales?.fechas_horarios && Array.isArray(tema.originales.fechas_horarios)) {
            tema.originales.fechas_horarios.forEach((horario: any) => {
              if (horario.fecha) {
                allExistingDates.push(horario.fecha)
              }
              sessions.push({
                title: tema.nombre,
                description: tema.descripcion || '',
                date: horario.fecha,
                startTime: horario.hora_inicio,
                endTime: horario.hora_fin,
                duration: 2, // Duración calculada por diferencia de horas
                isPrimary: true
              })
            })
          }
        })
        
        console.log('✅ Sesiones procesadas desde taller_detalles:', sessions)
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
      let generalPdfUrl = null
      if (editingProduct) {
        generalPdfUrl = editingProduct.activity_media?.find((m: any) => m.pdf_url)?.pdf_url || 
                        editingProduct.media?.pdf_url
        
        if (generalPdfUrl) {
          setWorkshopMaterial(prev => ({
            ...prev,
            pdfType: 'general',
            pdfUrl: generalPdfUrl,
            pdfFile: null // No tenemos el archivo, solo la URL
          }))
          return // Si hay PDF general, no cargar por tema
        }
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
          
          const newState = {
            ...prev,
            pdfType: 'by-topic', // Forzar a 'by-topic' si hay PDFs por tema
            topicPdfs: mergedPdfs
          }
          console.log('📦 Nuevo estado de workshopMaterial:', {
            pdfType: newState.pdfType,
            topicPdfsKeys: Object.keys(newState.topicPdfs),
            topicPdfsDetails: Object.entries(newState.topicPdfs).map(([key, value]) => ({
              tema: key,
              fileName: value.fileName,
              hasUrl: !!value.url,
              hasFile: !!value.file
            }))
          })
          return newState
        })
        console.log('✅ PDFs por tema cargados en estado:', Object.keys(topicPdfs))
      } else {
        console.log('ℹ️ No se encontraron PDFs por tema en taller_detalles')
      }
    } catch (error) {
      console.error('❌ Error cargando PDFs del taller:', error)
    }
  }

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
      } else {
        // Si no hay categoría, usar fitness por defecto
        setProductCategory('fitness')
        console.log('⚠️ No se encontró categoría, usando fitness por defecto')
      }
      
      // Cargar datos generales
      
      // Usar la imagen disponible (prioridad: activity_media > media > image_url)
      const imageUrl = editingProduct.activity_media?.[0]?.image_url ||
                      editingProduct.media?.image_url || 
                      editingProduct.image_url
      
      
      // Determinar el tipo de capacidad basándose en el valor actual
      let capacityType = 'ilimitada'
      let stockQuantity = ''
      
