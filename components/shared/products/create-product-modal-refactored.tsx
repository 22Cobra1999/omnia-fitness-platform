"use client"

import React, { useState, useEffect, useMemo, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { ChevronLeft, ChevronRight, ChevronDown, Plus, X, Upload, Calendar, Clock, Users, FileText, Eye, Edit, Check, Video, Image as ImageIcon, Globe, MapPin, Trash2, Target, DollarSign, Eye as EyeIcon, EyeOff, Pencil, Flame, Lock, Unlock, Coins, MonitorSmartphone, Loader2, RotateCcw } from "lucide-react"
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
  onClose: () => void
  editingProduct?: any
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
  'Mindfulness'
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

export default function CreateProductModal({ isOpen, onClose, editingProduct }: CreateProductModalProps) {
  const [selectedType, setSelectedType] = useState<ProductType | null>(null)
  const [selectedProgramType, setSelectedProgramType] = useState<ProgramSubType | null>(null)
  const [productCategory, setProductCategory] = useState<'fitness' | 'nutricion'>('fitness')
  const [currentStep, setCurrentStep] = useState<'type' | 'programType' | 'general' | 'specific' | 'workshopMaterial' | 'workshopSchedule' | 'activities' | 'weeklyPlan' | 'preview'>('type')
  
  // Estado para selección de videos
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false)
  const [csvDataWithVideos, setCsvDataWithVideos] = useState<string[][]>([])

  // Estado para selección de media de portada
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false)
  const [mediaModalType, setMediaModalType] = useState<'image' | 'video'>('image')

  // Estado persistente del CSV que se mantiene durante toda la sesión
  const [persistentCsvData, setPersistentCsvData] = useState<any[]>([])
  const [persistentSelectedRows, setPersistentSelectedRows] = useState<Set<number>>(new Set())
  const [persistentCsvFileName, setPersistentCsvFileName] = useState<string>('')
  const [persistentCsvLoadedFromFile, setPersistentCsvLoadedFromFile] = useState(false)
  
  // Estado persistente del calendario
  const [persistentCalendarSchedule, setPersistentCalendarSchedule] = useState<any[]>([])
  
  // Estado para los períodos del planificador semanal
  const [periods, setPeriods] = useState(1)
  
  // Estado para las estadísticas del paso 5
  const [weeklyStats, setWeeklyStats] = useState({
    semanas: 1,
    sesiones: 0,
    ejerciciosTotales: 0,
    ejerciciosUnicos: 0
  })
  
  // Estado para controlar si se puede deshacer en el paso 5
  const [canUndoWeeklyPlan, setCanUndoWeeklyPlan] = useState(false)
  
  // Estado para taller - Material opcional (Paso 4)
  const [workshopMaterial, setWorkshopMaterial] = useState({
    hasPdf: false,
    pdfFile: null as File | null,
    pdfUrl: null as string | null
  })
  
  // Estado para taller - Fechas y horarios (Paso 5)
  const [workshopSchedule, setWorkshopSchedule] = useState<Array<{
    title?: string
    description?: string
    date: string
    startTime: string
    endTime: string
    duration: number
    isPrimary?: boolean
  }>>([])
  
  // Estado para confirmación de cierre y acciones pendientes
  const [showCloseConfirmation, setShowCloseConfirmation] = useState(false)
  const [pendingAction, setPendingAction] = useState<'close' | 'tab' | null>(null)
  const [pendingTab, setPendingTab] = useState<string | null>(null)
  
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

  // Función para verificar si hay cambios sin guardar
  const hasUnsavedChanges = () => {
    // Verificar si estamos en paso 3 o superior
    const stepIndex = ['type', 'programType', 'general', 'specific', 'activities', 'weeklyPlan', 'preview'].indexOf(currentStep)
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
    const hasCsvData = persistentCsvData.length > 0
    console.log(`📊 Datos CSV:`, {
      csvLength: persistentCsvData.length,
      hasCsvData
    })
    
    // Verificar si hay datos de calendario
    const hasCalendarData = persistentCalendarSchedule.length > 0
    console.log(`📅 Datos calendario:`, {
      calendarLength: persistentCalendarSchedule.length,
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
      console.log(`✅ Cerrando sin confirmación`)
      onClose()
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
          onClose() // Cerrar el modal después de eliminar
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
      onClose()
      window.dispatchEvent(new CustomEvent('omnia-force-tab-change', {
        detail: { tab: pendingTab }
      }))
    } else {
      onClose()
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
    setPersistentCsvData([])
    setPersistentSelectedRows(new Set())
    setPersistentCsvFileName('')
    setPersistentCsvLoadedFromFile(false)
    setPersistentCalendarSchedule([])
    // ✅ Limpiar también archivos pendientes
    setPendingImageFile(null)
    setPendingVideoFile(null)
    setExerciseVideoFiles({})
    setVideosPendingDeletion([])
    console.log('🧹 Archivos pendientes limpiados al cerrar modal')
  }

  // Función para obtener el número del paso actual
  const getStepNumber = (step: string) => {
    if (selectedType === 'workshop') {
      const workshopStepMap: { [key: string]: number } = {
        'type': 1,
        'programType': 2,
        'general': 3,
        'workshopMaterial': 4,
        'workshopSchedule': 5,
        'preview': 6
      }
      return workshopStepMap[step] || 1
    } else {
      const programStepMap: { [key: string]: number } = {
        'type': 1,
        'programType': 2,
        'general': 3,
        'activities': 4,
        'weeklyPlan': 5,
        'preview': 6
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
        4: 'workshopMaterial',
        5: 'workshopSchedule',
        6: 'preview'
      }
    } else {
      stepMap = {
        1: 'type',
        2: 'programType', 
        3: 'general',
        4: 'activities',
        5: 'weeklyPlan',
        6: 'preview'
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
    location_url: '' as string
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
    console.log('🔄 Estado actual isMediaModalOpen:', isMediaModalOpen)
    setMediaModalType(type)
    setIsMediaModalOpen(true)
    console.log('🔄 Estado después de setIsMediaModalOpen(true):', true)
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
      csvData: persistentCsvData.length,
      schedule: persistentCalendarSchedule.length
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

      // Calcular valores dinámicos
      const totalSessions = persistentCalendarSchedule.length || 1
      const totalExercises = persistentCsvData.length || 0
      const capacity = (() => {
        // Priorizar specificForm.capacity si está definido (para edición)
        if (specificForm.capacity) {
          const capNum = parseInt(specificForm.capacity)
          return isNaN(capNum) ? null : capNum
        }
        // Fallback a generalForm.capacity (para creación)
        if (generalForm.capacity === 'ilimitada') return 500
        if (generalForm.capacity === 'limitada' && generalForm.stockQuantity) {
          const stockNum = parseInt(generalForm.stockQuantity)
          return isNaN(stockNum) ? null : stockNum
        }
        return null
      })()

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
        workshopMaterial: selectedType === 'workshop' ? workshopMaterial : null,
        // ✅ ENVIAR OBJETIVOS COMO ARRAY (la API los guardará en workshop_type)
        objetivos: generalForm.objetivos && generalForm.objetivos.length > 0 ? generalForm.objetivos : [],
        // ✅ CONSTRUIR WORKSHOP_TYPE CON TIPO DE DIETA (objetivos se manejan por separado)
        workshop_type: (() => {
          const workshopTypeData: any = {}
          
          // Agregar tipo de dieta solo para nutrición
          if (productCategory === 'nutricion' && generalForm.dietType) {
            workshopTypeData.dieta = generalForm.dietType
          }
          
          return Object.keys(workshopTypeData).length > 0 ? JSON.stringify(workshopTypeData) : null
        })(),
        // ✅ INCLUIR DATOS DE UBICACIÓN PARA MODALIDAD PRESENCIAL
        location_name: generalForm.location_name || null,
        location_url: generalForm.location_url || null
      }
      
      console.log('📦 Datos preparados para la API:', {
        name: productData.name,
        description: productData.description,
        price: productData.price,
        modality: productData.modality,
        level: productData.level,
        type: productData.type,
        categoria: productData.categoria,
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
                    ingredientes = typeof ingredientesRaw === 'string' 
                      ? JSON.parse(ingredientesRaw) 
                      : ingredientesRaw
                  }
                } catch (e) {
                  console.error('Error parseando ingredientes:', e)
                }
                
                return {
                  id: isExistingRecord ? resolvedId : tempIdString || `nutrition-${index + 1}`,
                  tempId: tempIdString || `nutrition-${index + 1}`,
                  isExisting: isExistingRecord,
                  is_active: item.is_active !== undefined ? item.is_active : true,
                  nombre: item['Nombre'] || item.nombre || '',
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

            const bulkResponse = await fetch(endpoint, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                activityId: result.product?.id,
                plates: plates, // o exercises, el nombre no importa en el backend
                exercises: plates
              })
            })

            const bulkResult = await bulkResponse.json()
            
            if (bulkResult.success) {
              console.log('✅ Platos/ejercicios guardados exitosamente:', bulkResult.count || plates.length)
              
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
                    if (!idString.startsWith('exercise-')) {
                      tempCandidates.push(`exercise-${idString}`)
                    }
                  }

                  const realId = entry?.id
                  if (realId) {
                    tempCandidates
                      .filter(Boolean)
                      .forEach((temp) => {
                        const key = String(temp)
                        mappedIds[key] = realId
                        if (key.startsWith('exercise-')) {
                          mappedIds[key.replace(/^exercise-/, '')] = realId
                        }
                        mappedIds[String(realId)] = realId
                        mappedIds[`exercise-${realId}`] = realId
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
                    const exercisesResponse = await fetch(`/api/activity-exercises/${result.product.id}?t=${Date.now()}`)
                    if (exercisesResponse.ok) {
                      const exercisesResult = await exercisesResponse.json()
                      const exerciseList: any[] = Array.isArray(exercisesResult?.data)
                        ? exercisesResult.data
                        : Array.isArray(exercisesResult?.exercises)
                          ? exercisesResult.exercises
                          : []

                      exerciseList.forEach((exercise: any) => {
                        const normalized = normalizeName(
                          exercise?.nombre_ejercicio ||
                          exercise?.nombre ||
                          exercise?.name ||
                          ''
                        )
                        if (!normalized) return
                        const potentialTempIds = nameToTempIds[normalized] || []
                        potentialTempIds.forEach((tempKey) => {
                          if (idMapping[tempKey] === undefined) {
                            idMapping[tempKey] = exercise.id
                            idMapping[String(exercise.id)] = exercise.id
                            idMapping[`exercise-${exercise.id}`] = exercise.id
                            if (tempKey.startsWith('exercise-')) {
                              idMapping[tempKey.replace(/^exercise-/, '')] = exercise.id
                            }
                            console.log(`🔁 Mapeo completado vía listado: ${tempKey} -> ${exercise.id}`)
                          }
                        })
                      })
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
                      : null
                  ]

                  for (const key of potentialKeys) {
                    if (key === undefined || key === null) continue
                    const mapped = idMapping[String(key)]
                    if (mapped !== undefined) {
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
                        return mapped
                      }
                    }
                  }

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
            for (const weekKey in scheduleToSave) {
              for (const dayKey in scheduleToSave[weekKey]) {
                const dayData = scheduleToSave[weekKey][dayKey]
                if (!dayData) continue

                if (Array.isArray(dayData.ejercicios)) {
                  dayData.ejercicios = dayData.ejercicios.map((ex: any) => {
                    const resolvedId = resolveMappedIdForEntry(ex)
                    const finalId =
                      typeof resolvedId === 'string' && /^\d+$/.test(resolvedId)
                        ? parseInt(resolvedId, 10)
                        : resolvedId
                    if (finalId !== ex.id) {
                      console.log(`🔧 Actualizando ID en planificación: ${ex.id} -> ${finalId}`)
                    }
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
                    if (finalId !== ex.id) {
                      console.log(`🔧 Actualizando ID en planificación (exercises): ${ex.id} -> ${finalId}`)
                    }
                    return { ...ex, id: finalId }
                  })
                }
              }
            }
            console.log('✅ Planificación actualizada con IDs reales antes de enviar')
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
        
        onClose()
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
        
        // Procesar cada tema de taller
        tallerDetalles.forEach((tema: any) => {
          console.log('🎯 Procesando tema:', tema.nombre)
          
          // Procesar horarios originales
          if (tema.originales?.fechas_horarios && Array.isArray(tema.originales.fechas_horarios)) {
            tema.originales.fechas_horarios.forEach((horario: any) => {
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
      }
      
    } catch (error) {
      console.error('❌ Error cargando datos del taller:', error)
    }
  }

  // Cargar datos del producto a editar
  useEffect(() => {
    if (editingProduct) {
      console.log('Cargando datos para edición:', editingProduct)
      
      // Determinar el tipo de producto
      let productType: ProductType = 'workshop'
      if (editingProduct.type === 'program' || editingProduct.type === 'fitness') {
        productType = 'program'
      } else if (editingProduct.type === 'document') {
        productType = 'document'
      }
      
      setSelectedType(productType)
      setCurrentStep('general')
      
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
      
      
      if (editingProduct.capacity) {
        if (editingProduct.capacity >= 500) {
          capacityType = 'ilimitada'
          console.log('✅ Capacity detectado como ilimitada (>= 500)')
        } else {
          capacityType = 'limitada' // Cambiar 'stock' a 'limitada' para que coincida con el Select
          stockQuantity = editingProduct.capacity.toString()
          console.log('✅ Capacity detectado como limitada:', stockQuantity)
        }
      } else {
        capacityType = 'ilimitada' // Cambiar 'consultar' a 'ilimitada' por defecto
        console.log('✅ Capacity no definido, usando ilimitada por defecto')
      }
      

      console.log('🎯 Cargando objetivos desde editingProduct:', editingProduct.objetivos)
      
      setGeneralForm({
        name: editingProduct.title || '',
        description: editingProduct.description || '',
        price: editingProduct.price?.toString() || '',
        image: imageUrl ? {
          name: 'imagen_existente.jpg', 
          url: imageUrl 
        } as any : null,
        videoUrl: editingProduct.media?.video_url || 
                 editingProduct.activity_media?.[0]?.video_url || '',
        modality: editingProduct.modality || 'online',
        is_public: editingProduct.is_public !== false,
        capacity: capacityType,
        stockQuantity: stockQuantity,
        objetivos: editingProduct.objetivos || [],
        dietType: editingProduct.dietType || '',
        dias_acceso: editingProduct.dias_acceso || 30,
        location_name: editingProduct.location_name || '',
        location_url: editingProduct.location_url || ''
      })
      
      console.log('✅ Objetivos cargados en generalForm:', editingProduct.objetivos || [])

      // Normalizar intensidad del producto para que coincida con las opciones del selector
      const rawLevel = editingProduct.level || editingProduct.difficulty || ''
      const normalizedLevel = (() => {
        if (!rawLevel) return ''
        const value = String(rawLevel).trim().toLowerCase()
        if (['beginner', 'principiante', 'inicio', 'bajo'].includes(value)) return 'beginner'
        if (['intermediate', 'intermedio', 'medio', 'moderado'].includes(value)) return 'intermediate'
        if (['advanced', 'avanzado', 'alto', 'intenso'].includes(value)) return 'advanced'
        if (['all', 'todos los niveles', 'todos', 'any'].includes(value)) return 'all'
        return value
      })()

      // Cargar datos específicos
      setSpecificForm({
        duration: editingProduct.duration || '',
        capacity: editingProduct.capacity?.toString() || '',
        workshopType: editingProduct.workshopType || '',
        startDate: editingProduct.startDate || '',
        endDate: editingProduct.endDate || '',
        level: normalizedLevel,
        availabilityType: editingProduct.availabilityType || '',
        stockQuantity: editingProduct.stockQuantity || '',
        sessionsPerClient: editingProduct.sessionsPerClient || '',
        activities: editingProduct.activities || null,
        documentType: editingProduct.documentType || '',
        document: editingProduct.document || null,
        pages: editingProduct.pages || ''
      })
      
      // Si es un programa, cargar datos del CSV
      if (productType === 'program' && editingProduct.csvData) {
        // // console.log('📊 Cargando datos CSV del programa:', editingProduct.csvData.length, 'filas')
        csvManagement.setCsvData(editingProduct.csvData)
        csvManagement.setCsvFileName(editingProduct.csvFileName || 'program.csv')
        csvManagement.setCsvLoadedFromFile(true)
      }
      
      // Cargar ejercicios existentes si es un programa
      if (productType === 'program' && editingProduct.id) {
        console.log('🔄 Cargando ejercicios existentes para producto:', editingProduct.id)
        // Los ejercicios se cargarán automáticamente en el CSVManagerEnhanced
      }

      // ✅ Cargar datos de talleres si es un workshop
      if (productType === 'workshop' && editingProduct.id) {
        console.log('🔄 Cargando datos de taller para producto:', editingProduct.id)
        loadWorkshopData(editingProduct.id)
      }
    }
  }, [editingProduct])

  // Escuchar cambios en generalForm.image para actualizar la imagen mostrada
  useEffect(() => {
    if (generalForm.image?.url) {
      console.log('🖼️ CREATE-PRODUCT-MODAL: Imagen actualizada en generalForm:', generalForm.image.url)
      // La imagen ya está actualizada en el estado, no necesitamos hacer nada más
      // El componente se re-renderizará automáticamente con la nueva imagen
    }
  }, [generalForm.image?.url])

  // Funciones de navegación
  const handleNext = () => {
    console.log('🔄 PASANDO AL SIGUIENTE PASO - Validando campos...')
    console.log('📍 Paso actual:', currentStep)
    console.log('📋 Estado del formulario general:', {
      name: generalForm.name,
      description: generalForm.description,
      price: generalForm.price,
      hasImage: !!generalForm.image,
      hasVideo: !!generalForm.videoUrl
    })
    
    if (currentStep === 'type') {
      console.log('✅ Paso 1 → 2: Selección de tipo completada')
      if (selectedType === 'program') {
        setCurrentStep('programType')
      } else {
        setCurrentStep('general')
      }
    } else if (currentStep === 'programType') {
      console.log('✅ Paso 2 → 3: Tipo de programa seleccionado')
      setCurrentStep('general')
    } else if (currentStep === 'general') {
      // Validar campos requeridos antes de avanzar
      const requiredFields = {
        name: generalForm.name?.trim(),
        description: generalForm.description?.trim(),
        price: generalForm.price?.trim()
      }
      
      const missingFields = Object.entries(requiredFields)
        .filter(([key, value]) => !value)
        .map(([key]) => key)
      
      console.log('🔍 Validación paso general:', {
        camposRequeridos: requiredFields,
        camposFaltantes: missingFields,
        puedeAvanzar: missingFields.length === 0
      })
      
      if (missingFields.length > 0) {
        console.log('❌ NO SE PUEDE AVANZAR - Campos faltantes:', missingFields)
        setValidationErrors(missingFields.map(field => `${field} es requerido`))
        setFieldErrors({
          name: !generalForm.name?.trim(),
          description: !generalForm.description?.trim(),
          price: !generalForm.price?.trim()
        })
        return
      }
      
      console.log('✅ Paso 3 → Siguiente: Todos los campos completados')
      // Para taller, ir a material PDF; para programa, ir a actividades
      if (selectedType === 'workshop') {
        setCurrentStep('workshopMaterial')
      } else {
        setCurrentStep('activities')
      }
    } else if (currentStep === 'specific') {
      console.log('✅ Paso 4 → 5: Saltando paso eliminado')
      // Para taller, ir a material opcional; para programa, ir a actividades
      if (selectedType === 'workshop') {
        setCurrentStep('workshopMaterial')
      } else {
        setCurrentStep('activities')
      }
    } else if (currentStep === 'workshopMaterial') {
      console.log('✅ Taller - Paso 4 → 5: Material completado')
      setCurrentStep('workshopSchedule')
    } else if (currentStep === 'workshopSchedule') {
      // Validar que hay al menos una sesión programada
      if (workshopSchedule.length === 0) {
        alert('Debes programar al menos una sesión del taller')
        return
      }
      // Validar que todas las sesiones tienen fecha
      const hasEmptyDates = workshopSchedule.some(session => !session.date)
      if (hasEmptyDates) {
        alert('Todas las sesiones deben tener una fecha asignada')
        return
      }
      console.log('✅ Taller - Paso 5 → 6: Horarios completados')
      setCurrentStep('preview')
    } else if (currentStep === 'activities') {
       console.log('✅ Programa - Paso 5 → 6: Actividades completadas')
       setCurrentStep('weeklyPlan')
     } else if (currentStep === 'weeklyPlan') {
       console.log('✅ Programa - Paso 6 → 7: Plan semanal completado')
       setCurrentStep('preview')
     }
  }

  const handleBack = () => {
    if (currentStep === 'programType') {
      setCurrentStep('type')
    } else if (currentStep === 'general') {
      if (selectedType === 'program') {
        setCurrentStep('programType')
      } else {
        setCurrentStep('type')
      }
     } else if (currentStep === 'workshopMaterial') {
       setCurrentStep('specific')
     } else if (currentStep === 'workshopSchedule') {
       setCurrentStep('workshopMaterial')
     } else if (currentStep === 'activities') {
       setCurrentStep('specific')
     } else if (currentStep === 'weeklyPlan') {
       setCurrentStep('activities')
     } else if (currentStep === 'preview') {
       // Para taller, volver a horarios; para programa, volver a plan semanal
       if (selectedType === 'workshop') {
         setCurrentStep('workshopSchedule')
       } else {
         setCurrentStep('weeklyPlan')
       }
     }
  }

  const handleProductTypeSelect = (type: ProductType) => {
    setSelectedType(type)
    if (type === 'program') {
      setCurrentStep('programType')
    } else {
      setCurrentStep('general')
    }
  }

  const handleProgramTypeSelect = (type: ProgramSubType) => {
    setSelectedProgramType(type)
    setProductCategory(type === 'fitness' ? 'fitness' : 'nutricion')
    setCurrentStep('general')
  }

  // Funciones para manejar el material del taller
  const handleWorkshopMaterialToggle = (hasPdf: boolean) => {
    setWorkshopMaterial(prev => ({
      ...prev,
      hasPdf,
      pdfFile: hasPdf ? prev.pdfFile : null,
      pdfUrl: hasPdf ? prev.pdfUrl : null
    }))
  }

  const handleWorkshopPdfUpload = (file: File) => {
    setWorkshopMaterial(prev => ({
      ...prev,
      pdfFile: file,
      pdfUrl: URL.createObjectURL(file)
    }))
  }

  // Funciones para manejar los horarios del taller
  const addWorkshopSession = () => {
    const newSession = {
      date: '',
      startTime: '10:00',
      endTime: '12:00',
      duration: 2
    }
    setWorkshopSchedule(prev => [...prev, newSession])
  }

  const removeWorkshopSession = (index: number) => {
    setWorkshopSchedule(prev => prev.filter((_, i) => i !== index))
  }

  const updateWorkshopSession = (index: number, field: string, value: string | number) => {
    setWorkshopSchedule(prev => prev.map((session, i) => 
      i === index ? { ...session, [field]: value } : session
    ))
  }

  // Funciones CSV
  const downloadFitnessTemplateWorkbook = async () => {
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

    const plantillaRows = [
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

    const opcionesDict = {
      'Tipo de Ejercicio': ['Fuerza', 'Cardio', 'HIIT', 'Movilidad', 'Flexibilidad', 'Equilibrio', 'Funcional'],
      'Nivel de Intensidad': ['Bajo', 'Medio', 'Alto'],
      'Equipo Necesario': ['', 'Bandas', 'Banco', 'Barra', 'Chaleco', 'Kettlebell', 'Mancuernas', 'Máquinas', 'Mat de yoga', 'Rack'],
      'Partes del Cuerpo': ['Pecho', 'Espalda', 'Hombros', 'Brazos', 'Antebrazos', 'Core', 'Glúteos', 'Piernas', 'Cuádriceps', 'Isquiotibiales', 'Pantorrillas', 'Caderas', 'Cuerpo Completo']
    }

    const estructuraRows = [
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

    const guiaRows = [
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

    const plantillaSheet = XLSX.utils.json_to_sheet(plantillaRows, { header: plantillaHeaders })
    XLSX.utils.book_append_sheet(workbook, plantillaSheet, 'Plantilla')

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

    const estructuraSheet = XLSX.utils.json_to_sheet(estructuraRows)
    XLSX.utils.book_append_sheet(workbook, estructuraSheet, 'Estructura')

    const guiaSheet = XLSX.utils.json_to_sheet(guiaRows)
    XLSX.utils.book_append_sheet(workbook, guiaSheet, 'Guía')

    const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'plantilla-fitness ejemplo.xlsx'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  const downloadCSV = async () => {
    if (productCategory === 'nutricion') {
      const templateFileName = 'nutrition-program-template.csv'
      const a = document.createElement('a')
      a.href = `/templates/${templateFileName}`
      a.download = templateFileName
      a.click()
      return
    }

    await downloadFitnessTemplateWorkbook()
  }

  const removeCSV = () => {
    setCsvFile(null)
    setCsvFileName('')
    csvManagement.setCsvData([])
    csvManagement.setCsvValidation(null)
    csvManagement.setCsvLoadedFromFile(false)
    setSpecificForm(prev => ({ ...prev, activities: null }))
  }

  const onCSVFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const text = e.target?.result as string
        const lines = text.split('\n').filter(line => line.trim())
        
        // Saltar la primera fila (header) y procesar desde la segunda
        const dataRows = lines.slice(1).map(line => {
          // Parsear CSV básico (manejar comillas)
          const cells = line.split(',').map(cell => cell.replace(/^"|"$/g, '').trim())
          return cells
        })
        
        // Obtener headers del template según el tipo
        let headers: string[] = []
        if (productCategory === 'fitness') {
          headers = [
            'Semana', 'Día', 'Nombre de la Actividad', 'Descripción', 
            'Duración (min)', 'Tipo de Ejercicio', 'Nivel de Intensidad', 
            'Equipo Necesario', '1RM', 'Detalle de Series (peso-repeticiones-series)', 'Partes del Cuerpo', 'Calorías', 'video_url'
          ]
        } else {
          headers = [
            'Día', 'Comida', 'Descripción', 'Horario', 'Calorías', 
            'Proteínas (g)', 'Carbohidratos (g)', 'Grasas (g)', 'Fibra (g)', 'Partes del Cuerpo', 'video_url'
          ]
        }
        
        // Combinar headers con datos
        const csvData = [headers, ...dataRows]
        csvManagement.setCsvData(csvData)
        csvManagement.setCsvFileName(file.name)
        csvManagement.setCsvLoadedFromFile(true)
        
        console.log('CSV procesado:', csvData.length, 'filas')
      }
      reader.readAsText(file)
    }
  }

  const onDownloadTemplate = async (type: 'fitness' | 'nutrition') => {
    if (type === 'fitness') {
      await downloadFitnessTemplateWorkbook()
      return
    }

    const headers = [
      'Día', 'Comida', 'Descripción', 'Horario', 'Calorías',
      'Proteínas (g)', 'Carbohidratos (g)', 'Grasas (g)', 'Fibra (g)', 'Partes del Cuerpo', 'video_url'
    ]

    const exampleRows = [
      ['Lunes', 'Desayuno', 'Avena con frutas y proteína', '08:00', '450', '25', '60', '12', '8', 'Sistema digestivo', ''],
      ['Lunes', 'Almuerzo', 'Pollo con arroz y vegetales', '13:00', '550', '35', '45', '15', '6', 'Sistema muscular', ''],
      ['Lunes', 'Cena', 'Salmón con quinoa y espinacas', '19:00', '480', '30', '40', '18', '7', 'Sistema cardiovascular', ''],
      ['Martes', 'Desayuno', 'Smoothie de proteína y frutas', '08:30', '380', '28', '45', '10', '5', 'Sistema digestivo', '']
    ]

    const csvContent = [headers, ...exampleRows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `template_${type}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        key="overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 z-40 flex items-start justify-center pt-0 backdrop-blur-sm"
        onClick={handleClose}
      >
        <motion.div
          key="modal"
          data-modal="create-product"
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="bg-[#0F0F0F] w-full rounded-t-3xl border border-[#1F1F1F] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
          style={{ 
            zIndex: 1, 
            position: 'fixed',
            top: '70px',
            left: 0,
            right: 0,
            bottom: 0,
            height: 'calc(100vh - 70px)'
          }}
        >
        {/* Menu de pasos - Siempre visible en la misma posición */}
        <div className="flex justify-start items-center py-2 pl-6 mt-2">
          {[
            { step: 1, key: 'type' },
            { step: 2, key: 'programType' },
            { step: 3, key: 'general' },
            { step: 4, key: selectedType === 'workshop' ? 'workshopMaterial' : 'activities' },
            { step: 5, key: selectedType === 'workshop' ? 'workshopSchedule' : 'weeklyPlan' },
            { step: 6, key: 'preview' }
          ].filter(({ key }) => {
            // Filtrar pasos según el tipo de producto
            if (selectedType === 'workshop') {
              return ['type', 'programType', 'general', 'workshopMaterial', 'workshopSchedule', 'preview'].includes(key)
            } else {
              return ['type', 'programType', 'general', 'activities', 'weeklyPlan', 'preview'].includes(key)
            }
          }).map(({ step, key }, index) => {
            const isActive = currentStep === key
            const isCompleted = getStepNumber(currentStep) > step
            
            return (
              <div key={step} className="flex items-center">
                <div 
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 cursor-pointer ${
                    isActive 
                      ? 'bg-[#FF7939] text-white' 
                      : isCompleted 
                        ? 'bg-[#FF7939] text-white hover:bg-[#FF6B35]' 
                        : getStepNumber(currentStep) >= step
                          ? 'bg-orange-200 text-orange-500 hover:bg-orange-300'
                          : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  }`}
                  onClick={() => goToStep(step)}
                >
                  {step}
                </div>
                {index < 5 && (
                  <div className="w-4 h-0.5 bg-gray-600 mx-1"></div>
                )}
              </div>
            )
          })}
        </div>

        {/* Botón de cerrar siempre visible */}
        <div className="absolute top-4 right-6 z-10 flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={testModal}
            className="text-white hover:bg-white/10 p-2 rounded-lg"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Header - Ocultado completamente */}

          {/* Content */}
          <div className="p-6">
            {/* Content */}
            <div className="space-y-6">
            {currentStep === 'type' && (
              <motion.div
                key="type"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4 mt-2"
              >
                <div className="text-center mb-4">
                  <h3 className="text-white font-bold text-xl mb-2">¿Qué tipo de producto quieres crear?</h3>
                  <p className="text-gray-400 text-sm">Selecciona el tipo que mejor se adapte a tu contenido</p>
                </div>

                <div className="space-y-3">
                  <div 
                    className="bg-gradient-to-br from-[#0A0A0A] to-[#1A1A1A] p-4 rounded-2xl border border-[#1A1A1A] cursor-pointer hover:border-orange-500/30 hover:bg-[#0F0F0F] transition-all duration-300 group"
                    onClick={() => handleProductTypeSelect('workshop')}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Users className="text-white text-2xl" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-white font-semibold text-lg mb-1">Taller</h3>
                        <p className="text-gray-400 text-sm">Sesiones interactivas en vivo con horarios específicos y bloques configurables</p>
                      </div>
                    </div>
                  </div>

                  <div 
                    className="bg-gradient-to-br from-[#0A0A0A] to-[#1A1A1A] p-4 rounded-2xl border border-[#1A1A1A] cursor-pointer hover:border-orange-400/30 hover:bg-[#0F0F0F] transition-all duration-300 group"
                    onClick={() => handleProductTypeSelect('program')}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Calendar className="text-white text-2xl" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-white font-semibold text-lg mb-1">Programa</h3>
                        <p className="text-gray-400 text-sm">Programas estructurados con seguimiento y métricas personalizadas</p>
                      </div>
                    </div>
                  </div>

                  <div 
                    className="bg-gradient-to-br from-[#0A0A0A] to-[#1A1A1A] p-4 rounded-2xl border border-[#1A1A1A] cursor-pointer hover:border-white/30 hover:bg-[#0F0F0F] transition-all duration-300 group"
                    onClick={() => handleProductTypeSelect('document')}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-white to-gray-200 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <FileText className="text-gray-800 text-2xl" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-white font-semibold text-lg mb-1">Documento</h3>
                        <p className="text-gray-400 text-sm">Contenido descargable y recursos educativos</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {currentStep === 'programType' && (
              <motion.div
                key="program-type"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4 mt-8"
              >
                <div className="text-center mb-4">
                  <h3 className="text-white font-bold text-xl mb-2">¿Qué tipo de programa quieres crear?</h3>
                  <p className="text-gray-400 text-sm">Selecciona el enfoque de tu programa</p>
                </div>

                <div className="space-y-3">
                  <div 
                    className="bg-gradient-to-br from-[#0A0A0A] to-[#1A1A1A] p-4 rounded-2xl border border-[#1A1A1A] cursor-pointer hover:border-orange-500/30 hover:bg-[#0F0F0F] transition-all duration-300 group"
                    onClick={() => handleProgramTypeSelect('fitness')}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-white font-semibold text-lg mb-1">Fitness</h3>
                        <p className="text-gray-400 text-sm">Programas de ejercicios y entrenamientos estructurados</p>
                      </div>
                    </div>
                  </div>

                  <div 
                    className="bg-gradient-to-br from-[#0A0A0A] to-[#1A1A1A] p-4 rounded-2xl border border-[#1A1A1A] cursor-pointer hover:border-orange-400/30 hover:bg-[#0F0F0F] transition-all duration-300 group"
                    onClick={() => handleProgramTypeSelect('nutrition')}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-white font-semibold text-lg mb-1">Nutrición</h3>
                        <p className="text-gray-400 text-sm">Programas de alimentación y dietas personalizadas</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {currentStep === 'general' && (
              <motion.div
                key="general"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col gap-8 pb-24"
              >
                <div className="space-y-6">
                  <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl">
                    {generalForm.image ? (
                      <>
                        <img
                          src={typeof generalForm.image === 'object' && 'url' in generalForm.image ? generalForm.image.url : URL.createObjectURL(generalForm.image as File)}
                          alt="Preview"
                          className="h-full w-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/0 to-transparent" />
                        <button
                          type="button"
                          onClick={() => openMediaModal('image')}
                          className="absolute bottom-4 right-4 inline-flex items-center gap-2 rounded-full bg-black/40 px-4 py-2 text-xs font-medium text-white backdrop-blur-sm transition hover:bg-black/55"
                        >
                          <Pencil className="h-4 w-4" />
                          Cambiar portada
                        </button>
                      </>
                    ) : generalForm.videoUrl ? (
                      <div className="flex h-full w-full flex-col items-center justify-center gap-4 text-white/70">
                        <Video className="h-12 w-12 text-[#FF7939]" />
                        <button
                          type="button"
                          onClick={() => openMediaModal('video')}
                          className="inline-flex items-center gap-2 rounded-full bg-black/40 px-4 py-2 text-xs font-medium text-white backdrop-blur-sm transition hover:bg-black/55"
                        >
                          <Pencil className="h-4 w-4" />
                          Cambiar video
                        </button>
                      </div>
                    ) : (
                      <div className="flex h-full w-full flex-col items-center justify-center gap-3 text-white/55">
                        <ImageIcon className="h-12 w-12" strokeWidth={1.2} />
                        <p className="text-sm">Añadí una portada o video</p>
                        <div className="flex gap-3 text-xs font-semibold text-white/75">
                          <button
                            type="button"
                            onClick={() => openMediaModal('image')}
                            className="underline-offset-4 hover:text-white hover:underline"
                          >
                            Subir imagen
                          </button>
                          <button
                            type="button"
                            onClick={() => openMediaModal('video')}
                            className="underline-offset-4 hover:text-white hover:underline"
                          >
                            Elegir video
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => openMediaModal('image')}
                      className={`group flex items-center justify-center gap-2 rounded-full px-4 py-3 text-xs font-medium text-white/65 transition hover:text-white ${
                        generalForm.image ? '!text-white' : ''
                      }`}
                    >
                      <ImageIcon className={`h-4 w-4 ${generalForm.image ? 'text-[#FF7939]' : 'text-white/40'} group-hover:text-[#FF7939]`} />
                      Imagen
                    </button>
                    <button
                      type="button"
                      onClick={() => openMediaModal('video')}
                      className={`group flex items-center justify-center gap-2 rounded-full px-4 py-3 text-xs font-medium text-white/65 transition hover:text-white ${
                        generalForm.videoUrl ? '!text-white' : ''
                      }`}
                    >
                      <Video className={`h-4 w-4 ${generalForm.videoUrl ? 'text-[#FF7939]' : 'text-white/40'} group-hover:text-[#FF7939]`} />
                      Video
                    </button>
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-3 md:col-span-2">
                      <Label htmlFor="name" className="text-sm font-medium text-white/75">
                        Título <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="name"
                        value={generalForm.name}
                        onChange={(e) => {
                          setGeneralFormWithLogs({ ...generalForm, name: e.target.value })
                          clearFieldError('name')
                        }}
                        placeholder="Ej: Plan funcional 8 semanas"
                        className="h-12 rounded-none border-0 border-b border-white/15 bg-transparent text-white placeholder:text-white/30 focus-visible:border-[#FF7939] focus-visible:ring-0"
                        maxLength={100}
                      />
                      {fieldErrors.name && <p className="text-sm text-red-500">El título es requerido</p>}
                    </div>

                    <div className="space-y-3 md:col-span-2">
                      <Label htmlFor="description" className="text-sm font-medium text-white/75">
                        Descripción <span className="text-red-500">*</span>
                      </Label>
                      <Textarea
                        id="description"
                        value={generalForm.description}
                        onChange={(e) => {
                          setGeneralFormWithLogs({ ...generalForm, description: e.target.value })
                          clearFieldError('description')
                        }}
                        placeholder="Contá beneficios, formato y a quién está dirigido..."
                        className="min-h-[140px] rounded-none border-0 border-b border-white/15 bg-transparent text-white placeholder:text-white/30 focus-visible:border-[#FF7939] focus-visible:ring-0"
                        maxLength={500}
                      />
                      <div className="flex justify-between text-xs text-white/35">
                        <span>{generalForm.description.length}/500 caracteres</span>
                        {generalForm.description.length < 50 && <span className="text-yellow-500/70">Mínimo 50 caracteres</span>}
                      </div>
                      {fieldErrors.description && (
                        <p className="text-sm text-red-500">La descripción es requerida (mínimo 50 caracteres)</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="flex items-center gap-2 text-sm font-medium text-white/75">
                      <Target className="h-4 w-4 text-[#FF7939]" />
                      Objetivos <span className="text-red-500">*</span>
                    </Label>
                    <div className="-mx-2 overflow-x-auto px-2">
                      <div className="flex gap-3 min-w-max">
                        {FITNESS_OBJECTIVE_OPTIONS.map((objetivo) => {
                          const isSelected = generalForm.objetivos.includes(objetivo)
                          return (
                            <button
                              key={objetivo}
                              type="button"
                              onClick={() => {
                                const newObjetivos = isSelected
                                  ? generalForm.objetivos.filter(o => o !== objetivo)
                                  : [...generalForm.objetivos, objetivo]
                                setGeneralFormWithLogs({ ...generalForm, objetivos: newObjetivos })
                              }}
                              className={`whitespace-nowrap border-b-2 px-0 py-2 text-sm transition ${
                                isSelected
                                  ? 'border-[#FF7939] text-white'
                                  : 'border-transparent text-white/55 hover:text-white'
                              }`}
                            >
                              {objetivo}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                    {generalForm.objetivos.length === 0 && <p className="text-sm text-yellow-500/70">Selecciona al menos un objetivo</p>}
                  </div>

                  <div className="grid gap-8 md:grid-cols-2">
                    <div className="space-y-3">
                      <p className="text-[11px] uppercase tracking-[0.3em] text-white/40">Intensidad</p>
                      <div className="flex flex-col gap-2">
                        {INTENSITY_CHOICES.map(({ value, label, flames }) => {
                          const active = specificForm.level === value
                          return (
                            <button
                              key={value}
                              type="button"
                              onClick={() => {
                                setSpecificFormWithLogs({ ...specificForm, level: value })
                                clearFieldError('level')
                              }}
                              className={`flex items-center justify-between border-b border-white/10 px-0 py-2 text-sm transition ${
                                active ? 'text-white' : 'text-white/60 hover:text-white'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className="flex gap-1">
                                  {Array.from({ length: flames }).map((_, idx) => (
                                    <Flame key={idx} className={`h-4 w-4 ${active ? 'text-[#FF7939]' : 'text-[#FF9354]/70'}`} />
                                  ))}
                                </div>
                                <span className="font-medium">{label}</span>
                              </div>
                              {active && <Check className="h-4 w-4 text-[#FF7939]" />}
                            </button>
                          )
                        })}
                      </div>
                      {fieldErrors.level && <p className="text-xs text-red-500">Requerido</p>}
                    </div>

                    <div className="space-y-3">
                      <p className="text-[11px] uppercase tracking-[0.3em] text-white/40">Modalidad</p>
                      <div className="flex flex-col gap-2">
                        {MODALITY_CHOICES.map(({ value, label, tone, icon: Icon }) => {
                          const active = generalForm.modality === value
                          return (
                            <button
                              key={value}
                              type="button"
                              onClick={() => setGeneralFormWithLogs({ ...generalForm, modality: value })}
                              className={`flex items-center justify-between border-b border-white/10 px-0 py-2 text-sm transition ${
                                active ? 'text-white' : 'text-white/60 hover:text-white'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <Icon className={`h-5 w-5 ${active ? tone : 'text-white/40'}`} />
                                <span className="font-medium">{label}</span>
                              </div>
                              {active && <Check className="h-4 w-4 text-[#FF7939]" />}
                            </button>
                          )
                        })}
                      </div>
                      
                      {/* Campos de ubicación cuando se selecciona presencial */}
                      {generalForm.modality === 'presencial' && (
                        <div className="mt-3 space-y-2 pt-3 border-t border-white/10">
                          <Input
                            type="text"
                            value={generalForm.location_name || ''}
                            onChange={(e) => setGeneralFormWithLogs({ ...generalForm, location_name: e.target.value })}
                            placeholder="Nombre del lugar"
                            className="h-8 bg-transparent border-0 border-b border-white/10 text-sm text-white placeholder:text-white/30 focus-visible:border-[#FF7939] focus-visible:ring-0 rounded-none"
                          />
                          <Input
                            type="text"
                            value={generalForm.location_url || ''}
                            onChange={(e) => setGeneralFormWithLogs({ ...generalForm, location_url: e.target.value })}
                            placeholder="Link o dirección de Maps"
                            className="h-8 bg-transparent border-0 border-b border-white/10 text-sm text-white placeholder:text-white/30 focus-visible:border-[#FF7939] focus-visible:ring-0 rounded-none"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                  <div className="flex items-center justify-center gap-4 text-sm text-white/80">
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-[#FF7939]" />
                      {generalForm.capacity === 'ilimitada' ? (
                        <button
                          type="button"
                          onClick={handleToggleCapacity}
                          className="h-8 min-w-[3.5rem] rounded-full border border-white/20 bg-transparent px-3 text-base font-semibold text-white transition hover:border-[#FF7939]/60 hover:text-white"
                          title="Cambiar a cupos limitados"
                        >
                          ∞
                        </button>
                      ) : (
                        <Input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={generalForm.stockQuantity}
                          onChange={(e) => handleStockQuantityChange(e.target.value)}
                          onFocus={(e) => e.target.select()}
                          className="h-8 w-20 rounded-none border-0 border-b border-white/20 bg-transparent text-center text-base font-semibold text-white focus-visible:border-[#FF7939] focus-visible:ring-0"
                          placeholder="0"
                        />
                      )}
                    </div>

                      <span className="text-white/60 text-base">×</span>

                      <div className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-[#FF7939]" />
                        <Input
                          type="text"
                          inputMode="decimal"
                          value={generalForm.price}
                          onChange={(e) => handlePriceChange(e.target.value)}
                          onBlur={handlePriceBlur}
                          placeholder="0.00"
                          className="h-8 w-24 rounded-none border-0 border-b border-white/20 bg-transparent text-center text-sm font-semibold text-white focus-visible:border-[#FF7939] focus-visible:ring-0"
                        />
                      </div>

                      <span className="text-white/60 text-base">−</span>

                      <div className="flex items-center gap-2">
                        <Coins className="h-5 w-5 text-[#FF7939]" />
                        <span className="text-sm font-semibold text-[#FF7939]">{commissionPercentLabel}</span>
                      </div>

                      <span className="text-white/60 text-base">=</span>
                    </div>
                    {fieldErrors.price && <p className="text-xs text-red-500">El precio es requerido</p>}

                    {generalForm.capacity === 'limitada' && canUseUnlimited && (
                      <button
                        type="button"
                        onClick={handleToggleCapacity}
                        className="text-xs font-medium text-[#FF7939] underline-offset-2 hover:underline"
                      >
                        Usar cupos ilimitados
                      </button>
                    )}

                    <div className="text-center text-xs text-white/50">
                      Ganancia posible:
                    </div>

                    <div className="text-center text-xl font-semibold text-white">
                      {formattedNetRevenue}
                    </div>
                  </div>

                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <button
                      type="button"
                      onClick={() => setGeneralFormWithLogs({ ...generalForm, is_public: !generalForm.is_public })}
                      className="inline-flex items-center gap-3 text-sm font-medium text-white/75 transition hover:text-white"
                    >
                      {generalForm.is_public ? <Unlock className="h-4 w-4 text-[#FF7939]" /> : <Lock className="h-4 w-4 text-[#FF7939]" />}
                      {generalForm.is_public ? 'Público' : 'Clientes con invitación'}
                    </button>

                <div className="sticky bottom-6 flex justify-end w-full md:w-auto md:static md:bottom-auto">
                      <button
                        type="button"
                        onClick={handleNext}
                    className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#FF7939] text-white transition hover:bg-[#FF6B00] hover:shadow-[0_18px_40px_-26px_rgba(255,121,57,1)]"
                      >
                        <ChevronRight className="h-6 w-6" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Paso 4: Material Opcional para Taller */}
            {currentStep === 'workshopMaterial' && (
              <motion.div
                key="workshopMaterial"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {/* Título del paso */}
                <div className="text-center mb-6">
                  <h3 className="text-xl font-semibold text-white mb-2">Material para Participantes</h3>
                  <p className="text-gray-400">Adjunta opcionalmente un archivo PDF para los asistentes</p>
                </div>

                <div className="bg-gray-800 rounded-lg p-6 space-y-6">
                  {/* Toggle para PDF */}
                  <div className="space-y-4">
                    <label className="text-white font-medium">¿Quieres adjuntar un PDF?</label>
                    <div className="flex gap-4">
                      <button
                        onClick={() => handleWorkshopMaterialToggle(true)}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          workshopMaterial.hasPdf 
                            ? 'bg-[#FF7939] text-white' 
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                      >
                        Sí
                      </button>
                      <button
                        onClick={() => handleWorkshopMaterialToggle(false)}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          !workshopMaterial.hasPdf 
                            ? 'bg-[#FF7939] text-white' 
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                      >
                        No
                      </button>
                    </div>
                  </div>

                  {/* Upload de PDF si se selecciona Sí */}
                  {workshopMaterial.hasPdf && (
                    <div className="space-y-4">
                      <label className="text-white font-medium">Subir archivo PDF</label>
                      <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center">
                        <input
                          type="file"
                          accept=".pdf"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) handleWorkshopPdfUpload(file)
                          }}
                          className="hidden"
                          id="workshop-pdf-upload"
                        />
                        <label
                          htmlFor="workshop-pdf-upload"
                          className="cursor-pointer flex flex-col items-center space-y-2"
                        >
                          <Upload className="w-8 h-8 text-gray-400" />
                          <span className="text-gray-300">Haz clic para subir PDF</span>
                          <span className="text-sm text-gray-500">o arrastra el archivo aquí</span>
                        </label>
                      </div>
                      
                      {workshopMaterial.pdfFile && (
                        <div className="bg-gray-700 rounded-lg p-3 flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <FileText className="w-5 h-5 text-[#FF7939]" />
                            <span className="text-white">{workshopMaterial.pdfFile.name}</span>
                          </div>
                          <button
                            onClick={() => handleWorkshopMaterialToggle(false)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Botón de continuar */}
                <div className="flex justify-end">
                  <button
                    onClick={handleNext}
                    className="w-12 h-12 bg-[#FF7939] hover:bg-[#FF6B35] rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105"
                  >
                    <ChevronRight className="h-5 w-5 text-white" />
                  </button>
                </div>
              </motion.div>
            )}

        {/* Paso 5: Horarios del Taller con Calendario */}
        {currentStep === 'workshopSchedule' && (
          <motion.div
            key="workshopSchedule"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            {/* Componente de calendario - Sin títulos */}
            <WorkshopSimpleScheduler 
              sessions={workshopSchedule}
              onSessionsChange={(newSessions) => {
                console.log('🔄 Actualizando workshopSchedule:', newSessions)
                console.log('🔢 Total de sesiones:', newSessions.length)
                setWorkshopSchedule(newSessions)
              }}
            />

            {/* Botón de continuar */}
            <div className="flex justify-end">
              <button
                onClick={handleNext}
                className="w-12 h-12 bg-[#FF7939] hover:bg-[#FF6B35] rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105"
              >
                <ChevronRight className="h-5 w-5 text-white" />
              </button>
            </div>
          </motion.div>
        )}

            {/* Paso de Actividades para Programas */}
            {currentStep === 'activities' && (
              <motion.div
                key="activities"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {/* Título del paso */}
                <div className="text-center mb-4">
                  <h3 className="text-xl font-semibold text-white">
                    {productCategory === 'nutricion' ? 'Platos del Programa' : 'Ejercicios del Producto'}
                  </h3>
                </div>

                {/* CSV Manager - Para todos los tipos de productos */}
                <CSVManagerEnhanced
                    activityId={editingProduct?.id || 0}
                    coachId={user?.id || "b16c4f8c-f47b-4df0-ad2b-13dcbd76263f"}
                    onSuccess={() => {
                      console.log('CSV procesado exitosamente en modal')
                    }}
                    onRemoveCSV={removeCSV}
                    onDownloadCSV={downloadCSV}
                    csvFileName={csvFileName}
                    csvData={persistentCsvData}
                    setCsvData={(newData) => {
                      console.log('📥 PASO 4 - Actualizando CSV data persistente:', {
                        newDataLength: newData.length,
                        newData: newData,
                        currentStep: currentStep
                      })
                      // Los datos ya vienen combinados del CSVManagerEnhanced (existentes + nuevos)
                      setPersistentCsvData(newData)
                      console.log('✅ PASO 4 - persistentCsvData actualizado:', newData.length, 'filas')
                    }}
                    selectedRows={persistentSelectedRows}
                    setSelectedRows={(newRows) => {
                      console.log('📥 Actualizando selected rows persistente:', newRows.size, 'filas')
                      setPersistentSelectedRows(newRows)
                    }}
                    productCategory={productCategory}
                    onVideoCleared={handleClearExerciseVideo}
                    onVideoFileSelected={(exercise, index, videoFile) => {
                      // Guardar archivo de video inmediatamente cuando se selecciona
                      const key = getExerciseVideoKey(exercise, index)
                      if (key) {
                        setExerciseVideoFiles((prev) => ({
                          ...prev,
                          [key]: videoFile
                        }))
                        console.log(`💾 CSVManagerEnhanced: Guardando archivo de video inmediatamente para ejercicio ${index} (key: ${key}):`, videoFile.name)
                      }
                    }}
                    renderAfterTable={
                      <button
                        onClick={() => setCurrentStep('weeklyPlan')}
                        className="w-12 h-12 bg-[#FF7939] hover:bg-[#FF6B35] rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105"
                      >
                        <ChevronRight className="h-5 w-5 text-white" />
                      </button>
                    }
                    onItemsStatusChange={async (items, action) => {
                      console.log(`🗂️ Cambio de estado recibido desde CSVManager (${action}):`, items.length, 'elementos')

                      if (!editingProduct?.id || items.length === 0) {
                        return
                      }

                      if (action === 'remove') {
                        // Eliminación definitiva ya fue gestionada por CSVManager (incluye llamada al API)
                        return
                      }

                      const itemsWithId = items.filter(item => item && item.id && typeof item.id === 'number')
                      if (itemsWithId.length === 0) {
                        return
                      }

                      const desiredActive = action === 'reactivate'
                      const notFoundIds: number[] = []

                      for (const item of itemsWithId) {
                        try {
                          const response = await fetch('/api/update-exercise-activo-flag', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              activityId: editingProduct.id,
                              exerciseId: item.id,
                              activo: desiredActive
                            })
                          })

                          if (!response.ok) {
                            if (response.status === 404) {
                              notFoundIds.push(item.id)
                              console.warn(`⚠️ Ejercicio ${item.id} ya no existe o no pertenece a la actividad; se retirará de la tabla.`)
                              continue
                            }

                            const errorText = await response.text()
                            console.error(`❌ Error HTTP actualizando flag activo (ejercicio ${item.id}):`, response.status, response.statusText, errorText)
                            continue
                          }

                          const result = await response.json()
                          if (result.success) {
                            console.log(`✅ Flag activo actualizado para ejercicio ${item.id}:`, desiredActive)
                          } else {
                            console.error(`❌ Respuesta sin éxito al actualizar flag activo (ejercicio ${item.id}):`, result.error)
                          }
                        } catch (error) {
                          console.error(`❌ Error llamando endpoint para ejercicio ${item.id}:`, error)
                        }
                      }

                      if (notFoundIds.length > 0) {
                        setPersistentCsvData(prev => {
                          if (!prev || prev.length === 0) return prev
                          return prev.filter(row => {
                            const rawId = row?.id
                            const numericId = typeof rawId === 'number'
                              ? rawId
                              : typeof rawId === 'string'
                                ? parseInt(rawId, 10)
                                : NaN
                            if (Number.isNaN(numericId)) {
                              return true
                            }
                            return !notFoundIds.includes(numericId)
                          })
                        })

                        setPersistentSelectedRows(prev => {
                          if (prev.size === 0) return prev
                          return new Set<number>()
                        })

                        console.log('🧹 Ejercicios removidos del estado local tras 404:', notFoundIds)
                      }
                    }}
                  />
              </motion.div>
            )}

            {/* Paso 5: Planificación Semanal */}
            {currentStep === 'weeklyPlan' && selectedType === 'program' && (
              <motion.div
                key="weeklyPlan"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <WeeklyExercisePlanner 
                  planLimits={{
                    planType,
                    weeksLimit: getPlanLimit(planType, 'weeksPerProduct'),
                    activitiesLimit: getPlanLimit(planType, 'activitiesPerProduct'),
                    stockLimit: stockLimitFromPlan
                  }}
                  onUndo={() => {
                    // Llamar a la función de undo del WeeklyExercisePlanner
                    if (typeof window !== 'undefined' && (window as any).weeklyPlannerUndo) {
                      (window as any).weeklyPlannerUndo()
                    }
                  }}
                  onUndoAvailable={(canUndo) => {
                    // Actualizar estado del botón de undo
                    setCanUndoWeeklyPlan(canUndo)
                  }}
                  exercises={(() => {
                    // Convertir persistentCsvData a ejercicios para el planificador
                    
                    // Usar persistentCsvData directamente
                    const dataToUse = persistentCsvData || []
                    
                    if (!dataToUse || dataToUse.length === 0) {
                      console.log('⚠️ No hay datos CSV para el planificador semanal')
                      return []
                    }
                    
                    const exercises = dataToUse.map((row, index) => {
                      // Detectar si es nutrición por la presencia de campos específicos
                      const isNutrition = row && typeof row === 'object' && (
                        'Nombre' in row || 
                        'Proteínas (g)' in row || 
                        'Carbohidratos (g)' in row || 
                        'Grasas (g)' in row
                      )
                      
                      // Si es nutrición, usar campos específicos de nutrición
                      if (isNutrition || productCategory === 'nutricion') {
                        
                        return {
                          id: row.id || `nutrition-${index}`,
                          name: row['Nombre'] || row['nombre'] || row.nombre || `Plato ${index + 1}`,
                          description: row['Descripción'] || row['Receta'] || row.descripcion || row.receta || '',
                          duration: 0, // Los platos no tienen duración
                          type: 'Nutrición', // Tipo específico para nutrición
                          intensity: 'N/A', // No aplica para nutrición
                          equipment: 'N/A', // No aplica para nutrición
                          bodyParts: '', // No aplica para nutrición
                          calories: parseInt(row['Calorías'] || row.calorias || '0') || 0,
                          proteinas: row.proteinas || parseInt(row['Proteínas (g)'] || '0') || 0,
                          carbohidratos: row.carbohidratos || parseInt(row['Carbohidratos (g)'] || '0') || 0,
                          grasas: row.grasas || parseInt(row['Grasas (g)'] || '0') || 0,
                          peso: '',
                          reps: '',
                          series: ''
                        }
                      }
                      
                      // Si row es un array de strings, usar índices numéricos
                      if (Array.isArray(row)) {
                        return {
                          id: row.id || `exercise-${index}`, // Usar ID real si existe
                          name: row[0] || `Ejercicio ${index + 1}`,
                          description: row[1] || '',
                          duration: parseInt(row[2]) || 30,
                          type: row[3] || 'General',
                          intensity: row[4] || 'Media',
                          equipment: row[5] || 'Ninguno',
                          bodyParts: row[6] || '',
                          calories: parseInt(row[7]) || 0,
                          peso: row[8] || '',
                          reps: row[9] || '',
                          series: row[10] || '',
                          is_active: (row as any).is_active !== undefined ? (row as any).is_active : true,
                          activo: (row as any).activo !== undefined ? (row as any).activo : true
                        }
                      }
                      
                      // Si row es un objeto de fitness, usar propiedades de fitness
                      return {
                        id: row.id || `exercise-${index}`, // Usar ID real si existe
                        name: row['Nombre de la Actividad'] || row.name || row[0] || `Ejercicio ${index + 1}`,
                        description: row['Descripción'] || row.description || row[1] || '',
                        duration: parseInt(row['Duración (min)'] || row.duration || row[2]) || 30,
                        type: row['Tipo de Ejercicio'] || row.type || row[3] || 'General',
                        intensity: row['Nivel de Intensidad'] || row.intensity || row[4] || 'Media',
                        equipment: row['Equipo Necesario'] || row.equipment || row[5] || 'Ninguno',
                        bodyParts: row['Partes del Cuerpo'] || row.bodyParts || row[6] || '',
                        calories: parseInt(row['Calorías'] || row.calories || row[7]) || 0,
                        peso: row['Peso'] || row.peso || row['1RM'] || row[8] || '',
                        reps: row['Repeticiones'] || row.reps || row[9] || '',
                        series: row['Series'] || row.series || row['Detalle de Series (peso-repeticiones-series)'] || row[10] || '',
                        is_active: row.is_active !== undefined ? row.is_active : (row.activo !== undefined ? row.activo : true),
                        activo: row.activo !== undefined ? row.activo : (row.is_active !== undefined ? row.is_active : true)
                      }
                    })
                    
                    return exercises
                  })()}
                  onScheduleChange={(schedule: any) => {
                    setPersistentCalendarSchedule(schedule)
                  }}
                  onStatsChange={(stats: any) => {
                    setWeeklyStats(stats)
                  }}
                  onPeriodsChange={(periods: number) => {
                    setPeriods(periods)
                  }}
                  initialSchedule={persistentCalendarSchedule}
                  activityId={editingProduct?.id}
                  isEditing={!!editingProduct}
                  productCategory={productCategory}
                />
                
                {/* Botón de continuar al paso 6 */}
                <div className="flex justify-end mt-6">
                  <button
                    onClick={() => setCurrentStep('preview')}
                    className="w-12 h-12 bg-[#FF7939] hover:bg-[#FF6B35] rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105"
                  >
                    <ChevronDown className="h-5 w-5 text-white" />
                  </button>
                </div>
              </motion.div>
            )}

            {currentStep === 'preview' && (
              <motion.div
                key="preview"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="bg-[#0A0A0A] rounded-2xl p-8 border border-[#1A1A1A]">
                  <div className="flex justify-center mb-8">
                    <div className="flex-shrink-0 w-48">
                      <ActivityCard
                        activity={{
                          id: 0,
                          title: generalForm.name || 'Nombre del producto',
                          description: generalForm.description || 'Descripción del producto',
                          type: selectedType || 'program',
                          price: parseFloat(generalForm.price) || 0,
                          difficulty: specificForm.level || 'beginner',
                          coach_id: 'preview',
                          is_public: generalForm.is_public || false,
                          created_at: new Date().toISOString(),
                          updated_at: new Date().toISOString(),
                          coach_name: 'Tu producto',
                          coach_rating: 0,
                          coach_avatar_url: '/placeholder.svg?height=24&width=24&query=coach',
                          media: {
                            image_url: generalForm.image instanceof File ? URL.createObjectURL(generalForm.image) : 
                                     (generalForm.image && typeof generalForm.image === 'object' && 'url' in generalForm.image) ? generalForm.image.url : null
                          },
                          image_url: generalForm.image instanceof File ? URL.createObjectURL(generalForm.image) : 
                                   (generalForm.image && typeof generalForm.image === 'object' && 'url' in generalForm.image) ? generalForm.image.url : null,
                          categoria: productCategory || 'fitness',
                          program_info: {
                            program_duration: parseInt(specificForm.duration) || 8
                          },
                          consultation_info: null,
                          tags: null,
                          exercisesCount: persistentCsvData.length,
                          totalSessions: persistentCalendarSchedule.length || 1,
                          modality: generalForm.modality || 'online',
                          // Debug: Log para verificar modalidad pasada a ActivityCard
                          // console.log('🏷️ Paso 6 - Modalidad pasada a ActivityCard:', generalForm.modality),
                          location_name: generalForm.location_name || null,
                          location_url: generalForm.location_url || null,
                          capacity: (() => {
                            if (generalForm.capacity === 'ilimitada') return 500
                            if (generalForm.capacity === 'limitada' && generalForm.stockQuantity) {
                              const stockNum = parseInt(generalForm.stockQuantity)
                              return isNaN(stockNum) ? null : stockNum
                            }
                            return null // No mostrar cupos si no se especificó stock
                          })(),
                          workshop_type: undefined,
                          sessions_per_client: undefined,
                          program_rating: 0,
                          total_program_reviews: 0,
                          // ✅ INCLUIR OBJETIVOS PARA MOSTRAR EN LA CARD
                          objetivos: generalForm.objetivos && generalForm.objetivos.length > 0 ? generalForm.objetivos : [],
                          // Valores del resumen del paso 5
                          previewStats: (() => {
                            return {
                              semanas: weeklyStats.totalWeeks || 1,
                              sesiones: weeklyStats.totalDays || 0,
                              ejerciciosTotales: weeklyStats.totalExercises || 0,
                              ejerciciosUnicos: weeklyStats.uniqueExercises || 0
                            }
                          })()
                        }}
                        size="small"
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-center">
                    <Button
                      onClick={handlePublishProduct}
                      disabled={isPublishing}
                      className="bg-[#FF7939] hover:bg-[#FF6B35] disabled:bg-[#FF7939]/50 disabled:cursor-not-allowed text-black font-bold px-8 py-3 rounded-lg text-lg transition-all duration-200 flex items-center gap-2 min-w-[200px] justify-center"
                    >
                      {isPublishing ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          <span>{publishProgress || (editingProduct ? 'Actualizando...' : 'Publicando...')}</span>
                        </>
                      ) : (
                        editingProduct ? 'Actualizar Producto' : 'Publicar Producto'
                      )}
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
            </div>
          </div>

        </motion.div>
      </motion.div>

      {/* Modals */}
      {isVideoModalOpen && (
        <VideoSelectionModal
          isOpen={isVideoModalOpen}
          onClose={() => setIsVideoModalOpen(false)}
          onVideoSelected={handleVideoSelection}
          selectedRowsCount={csvManagement.selectedRows.size}
        />
      )}

      {isMediaModalOpen && (
        <MediaSelectionModal
          isOpen={isMediaModalOpen}
          onClose={() => setIsMediaModalOpen(false)}
          onMediaSelected={handleMediaSelection}
          mediaType={mediaModalType}
        />
      )}

      {/* Modal de confirmación de cierre */}
      {showCloseConfirmation && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/90 z-40 flex items-center justify-center backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-black rounded-xl p-6 max-w-sm mx-4 shadow-2xl"
          >
            {/* Icono de advertencia */}
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 bg-[#FF7939] rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-black" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
            </div>

            {/* Título */}
            <h3 className="text-white text-lg font-bold text-center mb-2">
              ¿Perder los cambios?
            </h3>
            
            {/* Descripción */}
            <p className="text-gray-300 text-center mb-6 text-sm">
              Tienes cambios sin guardar. Si cierras ahora, perderás todo el progreso.
            </p>
            
            {/* Botones */}
            <div className="flex gap-3">
              <Button
                variant="ghost"
                onClick={cancelClose}
                className="flex-1 bg-transparent border border-white text-white hover:bg-white hover:text-black transition-all duration-200 py-2 rounded-lg text-sm font-medium"
              >
                Cancelar
              </Button>
              <Button
                onClick={confirmClose}
                className="flex-1 bg-[#FF7939] hover:bg-[#FF6B35] text-black font-bold py-2 rounded-lg text-sm transition-all duration-200"
              >
                Cerrar sin guardar
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}