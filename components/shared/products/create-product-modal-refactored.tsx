"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, ChevronDown, Plus, X, Upload, Calendar, Clock, Users, FileText, Eye, Edit, Check, Video } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { ProductPreviewCard } from '@/components/shared/products/product-preview-card'
import ActivityCard from '@/components/shared/activities/ActivityCard'
import { WorkshopScheduleManager } from '@/components/shared/calendar/workshop-schedule-manager'
import { VideoSelectionModal } from '@/components/shared/ui/video-selection-modal'
import { MediaSelectionModal } from '@/components/shared/ui/media-selection-modal'
import { WorkshopSimpleScheduler } from '@/components/shared/calendar/workshop-simple-scheduler'
import { CSVManagerEnhanced } from '@/components/shared/csv/csv-manager-enhanced'
import CalendarScheduleManager from '@/components/shared/calendar/calendar-schedule-manager'
import { ModalHeader } from "@/components/product-form-sections/modal-header"
import { GeneralInfoSection } from "@/components/product-form-sections/general-info-section"
import { SpecificDetailsSection } from "@/components/product-form-sections/specific-details-section"
import { GeneralInfoSectionMinimal } from "@/components/product-form-sections/general-info-section-minimal"
import { SpecificDetailsSectionMinimal } from "@/components/product-form-sections/specific-details-section-minimal"
import { ProgressiveForm } from "@/components/product-form-sections/progressive-form"
import { WeeklyExercisePlanner } from "../activities/weekly-exercise-planner"
import { useCSVManagement } from '@/hooks/shared/use-csv-management'
import { useAuth } from '@/contexts/auth-context'

interface CreateProductModalProps {
  isOpen: boolean
  onClose: () => void
  editingProduct?: any
}

type ProductType = 'workshop' | 'program' | 'document'
type ProgramSubType = 'fitness' | 'nutrition'

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
  
  // Estado para confirmación de cierre
  const [showCloseConfirmation, setShowCloseConfirmation] = useState(false)
  
  // Estado para validación y errores
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [fieldErrors, setFieldErrors] = useState<{[key: string]: boolean}>({})
  
  // Hook para gestión del CSV (solo para funciones auxiliares)
  const csvManagement = useCSVManagement(productCategory)
  
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
    onClose()
  }

  // Función para cancelar cierre
  const cancelClose = () => {
    setShowCloseConfirmation(false)
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
    is_public: false
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

  // Wrapper para setSpecificForm con logs
  const setSpecificFormWithLogs = (newForm: any) => {
    console.log('📝 CREATE-PRODUCT-MODAL: Actualizando specificForm:', newForm)
    
    // Log específico para intensidad (level)
    if (newForm.level !== undefined && newForm.level !== specificForm.level) {
      console.log('🔄 MODAL - Intensidad (level) actualizada:', { anterior: specificForm.level, nuevo: newForm.level })
    }
    
    setSpecificForm(newForm)
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

  // Funciones para manejar selección de videos
  const handleRowSelection = (rowIndex: number) => {
    csvManagement.handleRowSelection(rowIndex)
  }

  const handleVideoSelection = (videoUrl: string, videoFile?: File) => {
    // Actualizar las filas seleccionadas con el video
    const newCsvData = [...csvManagement.csvData]
    
    // Agregar columna de video si no existe
    if (newCsvData[0] && !newCsvData[0].includes('video_url')) {
      newCsvData[0].push('video_url')
      // Agregar columna vacía para todas las filas existentes
      for (let i = 1; i < newCsvData.length; i++) {
        newCsvData[i].push('')
      }
    }

    // Asignar video a las filas seleccionadas
    csvManagement.selectedRows.forEach(rowIndex => {
      if (newCsvData[rowIndex]) {
        const videoColumnIndex = newCsvData[rowIndex].length - 1
        newCsvData[rowIndex][videoColumnIndex] = videoUrl
      }
    })

    csvManagement.setCsvData(newCsvData)
    csvManagement.setSelectedRows(new Set()) // Limpiar selección
    setIsVideoModalOpen(false)
  }

  const openVideoModal = () => {
    if (csvManagement.selectedRows.size === 0) {
      alert('Selecciona al menos una fila para asignar video')
      return
    }
    setIsVideoModalOpen(true)
  }

  // Funciones para manejar selección de media de portada
  const openMediaModal = (type: 'image' | 'video') => {
    setMediaModalType(type)
    setIsMediaModalOpen(true)
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
            return
          }
        } catch (uploadError) {
          console.error('❌ Error en upload de imagen:', uploadError)
          alert('Error al subir la imagen')
          return
        }
      }
      
      // Subir video pendiente si existe
      let uploadedVideoData = null
      if (pendingVideoFile) {
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
            return
          }
        } catch (uploadError) {
          console.error('❌ Error en upload de video:', uploadError)
          alert('Error al subir el video')
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
        if (generalForm.capacity === 'ilimitada') return 999
        if (generalForm.capacity === 'stock' && generalForm.stockQuantity) {
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
        // ✅ CONSTRUIR WORKSHOP_TYPE CON OBJETIVOS Y TIPO DE DIETA
        workshop_type: (() => {
          const workshopTypeData: any = {}
          
          // Agregar objetivos si existen
          if (generalForm.objetivos && generalForm.objetivos.length > 0) {
            workshopTypeData.objetivos = generalForm.objetivos.join(';')
          }
          
          // Agregar tipo de dieta solo para nutrición
          if (productCategory === 'nutricion' && generalForm.dietType) {
            workshopTypeData.dieta = generalForm.dietType
          }
          
          return Object.keys(workshopTypeData).length > 0 ? JSON.stringify(workshopTypeData) : null
        })()
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
        if (persistentCsvData && persistentCsvData.length > 0 && selectedType === 'program') {
          console.log('💾 Guardando platos/ejercicios en la base de datos:', persistentCsvData.length, 'items')
          
          try {
            const endpoint = productCategory === 'nutricion' 
              ? '/api/activity-nutrition/bulk'
              : '/api/activities/exercises/bulk'
            
            const plates = persistentCsvData.map((item: any) => {
              if (productCategory === 'nutricion') {
                return {
                  nombre: item['Nombre'] || item.nombre || '',
                  descripcion: item['Descripción'] || item.Descripción || item.descripcion || item.receta || '',
                  calorias: item['Calorías'] || item.Calorías || item.calorias || '0',
                  proteinas: item['Proteínas (g)'] || item['Proteínas'] || item.proteinas || '0',
                  carbohidratos: item['Carbohidratos (g)'] || item.Carbohidratos || item.carbohidratos || '0',
                  grasas: item['Grasas (g)'] || item.Grasas || item.grasas || '0',
                  video_url: item.video_url || ''
                }
              } else {
                return {
                  nombre: item['Nombre de la Actividad'] || item.nombre || '',
                  descripcion: item['Descripción'] || item.Descripción || item.descripcion || '',
                  duracion_min: item['Duración (min)'] || item.duracion_min || '0',
                  tipo_ejercicio: item['Tipo de Ejercicio'] || item.tipo_ejercicio || '',
                  intensidad: item['Nivel de Intensidad'] || item.intensidad || 'Moderado',
                  equipo_necesario: item['Equipo Necesario'] || item.equipo_necesario || '',
                  detalle_series: item['Detalle de Series (peso-repeticiones-series)'] || item.detalle_series || '',
                  body_parts: item['Partes del Cuerpo'] || item.body_parts || '',
                  calorias: item['Calorías'] || item.Calorías || item.calorias || '0',
                  video_url: item.video_url || ''
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
              console.log('✅ Platos/ejercicios guardados exitosamente:', bulkResult.insertedCount || plates.length)
            } else {
              console.error('❌ Error guardando platos/ejercicios:', bulkResult.error)
            }
          } catch (bulkError) {
            console.error('❌ Error en llamada bulk de platos/ejercicios:', bulkError)
          }
        }

        // ✅ GUARDAR PLANIFICACIÓN SEMANAL si existe
        if (persistentCalendarSchedule && Object.keys(persistentCalendarSchedule).length > 0 && selectedType === 'program') {
          console.log('📅 Guardando planificación semanal:', Object.keys(persistentCalendarSchedule).length, 'semanas')
          
          try {
            const planningResponse = await fetch('/api/save-weekly-planning', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                activityId: result.product?.id,
                weeklySchedule: persistentCalendarSchedule,
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
          const exerciseVideos = persistentCsvData
            .filter((exercise: any) => exercise.video_url && exercise.id)
            .map((exercise: any) => {
              // Si el video del ejercicio es el mismo que el video de portada que acabamos de subir
              // (detectado por URL temporal blob:), usar la URL de Bunny.net subida
              let videoUrl = exercise.video_url
              
              if (uploadedVideoData && exercise.video_url.startsWith('blob:')) {
                // Es el mismo archivo que se subió como portada, reutilizar URL
                videoUrl = uploadedVideoData.streamUrl
                console.log(`🔄 Reutilizando video de portada para ejercicio ${exercise.id}`)
              }
              
              return {
                exerciseId: exercise.id,
                videoUrl: videoUrl
              }
            })
          
          if (exerciseVideos.length > 0) {
            console.log('🎥 Guardando videos de ejercicios:', exerciseVideos)
            try {
              const videoResponse = await fetch('/api/save-exercise-videos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  activityId: result.product?.id,
                  exerciseVideos
                })
              })
              
              const videoResult = await videoResponse.json()
              if (videoResult.success) {
                console.log('✅ Videos de ejercicios guardados:', videoResult.message)
              } else {
                console.error('❌ Error guardando videos:', videoResult.error)
              }
            } catch (videoError) {
              console.error('❌ Error en llamada a guardar videos:', videoError)
            }
          }
        }
        
        onClose()
        // ✅ Recargar SIEMPRE para refrescar la lista de productos
        window.location.reload()
      } else {
        console.error('❌ ERROR AL PUBLICAR PRODUCTO:', result.error)
      }
    } catch (error) {
      console.error('Error al publicar producto:', error)
      alert('Error al publicar el producto')
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
        if (editingProduct.capacity >= 999) {
          capacityType = 'ilimitada'
          console.log('✅ Capacity detectado como ilimitada (>= 999)')
        } else {
          capacityType = 'stock'
          stockQuantity = editingProduct.capacity.toString()
          console.log('✅ Capacity detectado como stock:', stockQuantity)
        }
      } else {
        capacityType = 'consultar'
        console.log('✅ Capacity detectado como consultar (null/undefined)')
      }
      

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
        stockQuantity: stockQuantity
      })

      // Cargar datos específicos
      setSpecificForm({
        duration: editingProduct.duration || '',
        capacity: editingProduct.capacity?.toString() || '',
        workshopType: editingProduct.workshopType || '',
        startDate: editingProduct.startDate || '',
        endDate: editingProduct.endDate || '',
        level: editingProduct.level || '',
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
  const downloadCSV = () => {
    // Descargar plantilla según el tipo de programa
    const templateFileName = productCategory === 'nutricion' 
      ? 'nutrition-program-template.csv' 
      : 'fitness-program-template.csv'
    
    const a = document.createElement('a')
    a.href = `/templates/${templateFileName}`
    a.download = templateFileName
    a.click()
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

  const onDownloadTemplate = (type: 'fitness' | 'nutrition') => {
    let headers: string[] = []
    let exampleRows: string[][] = []
    
    if (type === 'fitness') {
      headers = [
        'Semana', 'Día', 'Nombre de la Actividad', 'Descripción', 
        'Duración (min)', 'Tipo de Ejercicio', 'Nivel de Intensidad', 
        'Equipo Necesario', '1RM', 'Detalle de Series (peso-repeticiones-series)', 'Partes del Cuerpo', 'Calorías', 'video_url'
      ]
      
      exampleRows = [
        ['1', 'Lunes', 'Press de Banca', 'Ejercicio principal para pecho', '45', 'Fuerza', 'Alto', 'Barra, Banco', '100', '(80-8-4);(85-6-3);(90-4-2)', 'Pecho;Hombros;Tríceps', '350', ''],
        ['2', 'Lunes', 'Sentadillas', 'Ejercicio fundamental para piernas', '60', 'Fuerza', 'Alto', 'Barra, Rack', '120', '(100-6-4);(110-5-3);(120-3-2)', 'Piernas;Glúteos', '420', ''],
        ['3', 'Lunes', 'Remo con Barra', 'Ejercicio para espalda', '50', 'Fuerza', 'Medio', 'Barra, Discos', '90', '(70-8-4);(75-6-3);(80-5-2)', 'Espalda;Bíceps', '280', ''],
        ['4', 'Lunes', 'Press Militar', 'Ejercicio para hombros', '40', 'Fuerza', 'Medio', 'Barra, Rack', '80', '(60-6-4);(65-5-3);(70-4-2)', 'Hombros;Tríceps', '200', '']
      ]
    } else {
      headers = [
        'Día', 'Comida', 'Descripción', 'Horario', 'Calorías', 
        'Proteínas (g)', 'Carbohidratos (g)', 'Grasas (g)', 'Fibra (g)', 'Partes del Cuerpo', 'video_url'
      ]
      
      exampleRows = [
        ['Lunes', 'Desayuno', 'Avena con frutas y proteína', '08:00', '450', '25', '60', '12', '8', 'Sistema digestivo', ''],
        ['Lunes', 'Almuerzo', 'Pollo con arroz y vegetales', '13:00', '550', '35', '45', '15', '6', 'Sistema muscular', ''],
        ['Lunes', 'Cena', 'Salmón con quinoa y espinacas', '19:00', '480', '30', '40', '18', '7', 'Sistema cardiovascular', ''],
        ['Martes', 'Desayuno', 'Smoothie de proteína y frutas', '08:30', '380', '28', '45', '10', '5', 'Sistema digestivo', '']
      ]
    }
    
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
        <div className="absolute top-4 right-6 z-10">
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
                className="space-y-6"
              >
                <ProgressiveForm
                  onOpenMediaModal={openMediaModal}
                  onMediaSelected={handleMediaSelection}
                  hasLocalVideo={hasLocalVideo}
                  videoFileName={videoFile?.name}
                  onClearVideo={() => { setVideoFile(null); setHasLocalVideo(false) }}
                  generalForm={generalForm}
                  setGeneralForm={setGeneralFormWithLogs}
                  specificForm={specificForm}
                  setSpecificForm={setSpecificFormWithLogs}
                  initialSchedule={persistentCalendarSchedule}
                  onScheduleChange={setPersistentCalendarSchedule}
                  onNextStep={handleNext}
                  currentModalStep={currentStep}
                  selectedType={selectedType || undefined}
                  validationErrors={validationErrors}
                  fieldErrors={fieldErrors}
                  onClearFieldError={clearFieldError}
                  productCategory={productCategory}
                />
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
                <div className="text-center mb-6">
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {productCategory === 'nutricion' ? 'Platos del Programa' : 'Ejercicios del Producto'}
                  </h3>
                  <p className="text-gray-400 text-sm">
                    {productCategory === 'nutricion' 
                      ? 'Gestiona los platos y comidas de tu programa nutricional'
                      : selectedType === 'program' 
                        ? 'Gestiona los ejercicios de tu programa de entrenamiento'
                        : 'Gestiona los ejercicios de tu producto'
                    }
                  </p>
                </div>

                {/* CSV Manager - Para todos los tipos de productos */}
                {(() => {
                  console.log('🔍 CSVManagerEnhanced - activityId:', editingProduct?.id, 'coachId:', user?.id)
                  return null
                })()}
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
                  />

                {/* Botón de continuar */}
                <div className="flex justify-end">
                  <button
                    onClick={() => setCurrentStep('weeklyPlan')}
                    className="w-12 h-12 bg-[#FF7939] hover:bg-[#FF6B35] rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105"
                  >
                    <ChevronRight className="h-5 w-5 text-white" />
                  </button>
                </div>
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
                  exercises={(() => {
                    // Convertir persistentCsvData a ejercicios para el planificador
                    
                    // Usar csvManagement.csvData si persistentCsvData está vacío
                    const dataToUse = (persistentCsvData && persistentCsvData.length > 0) ? persistentCsvData : csvManagement.csvData
                    
                    if (!dataToUse || dataToUse.length === 0) {
                      console.log('⚠️ No hay datos CSV para el planificador semanal')
                      return []
                    }
                    
                    const exercises = dataToUse.map((row, index) => {
                      
                      // Si row es un array de strings, usar índices numéricos
                      if (Array.isArray(row)) {
                        const exercise = {
                          id: `exercise-${index}`,
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
                          series: row[10] || ''
                        }
                        return exercise
                      }
                      // Si row es un objeto, usar propiedades
                      const exercise = {
                        id: `exercise-${index}`,
                        name: row['Nombre de la Actividad'] || row[0] || `Ejercicio ${index + 1}`,
                        description: row['Descripción'] || row[1] || '',
                        duration: parseInt(row['Duración (min)'] || row[2]) || 30,
                        type: row['Tipo de Ejercicio'] || row[3] || 'General',
                        intensity: row['Nivel de Intensidad'] || row[4] || 'Media',
                        equipment: row['Equipo Necesario'] || row[5] || 'Ninguno',
                        bodyParts: row['Partes del Cuerpo'] || row[6] || '',
                        calories: parseInt(row['Calorías'] || row[7]) || 0,
                        peso: row['Peso'] || row['1RM'] || row[8] || '',
                        reps: row['Repeticiones'] || row[9] || '',
                        series: row['Series'] || row['Detalle de Series (peso-repeticiones-series)'] || row[10] || ''
                      }
                      return exercise
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
                    console.log('🔄 PERÍODOS CAMBIADOS EN FRONTEND:', periods)
                    setPeriods(periods)
                  }}
                  initialSchedule={persistentCalendarSchedule}
                  activityId={editingProduct?.id}
                  isEditing={!!editingProduct}
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
                          program_info: {
                            program_duration: parseInt(specificForm.duration) || 8
                          },
                          consultation_info: null,
                          tags: null,
                          exercisesCount: persistentCsvData.length,
                          totalSessions: persistentCalendarSchedule.length || 1,
                          modality: generalForm.modality || 'online',
                          capacity: (() => {
                            if (generalForm.capacity === 'ilimitada') return 999
                            if (generalForm.capacity === 'stock' && generalForm.stockQuantity) {
                              const stockNum = parseInt(generalForm.stockQuantity)
                              return isNaN(stockNum) ? null : stockNum
                            }
                            return null // No mostrar cupos si no se especificó stock
                          })(),
                          workshop_type: undefined,
                          sessions_per_client: undefined,
                          program_rating: 0,
                          total_program_reviews: 0,
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
                      className="bg-[#FF7939] hover:bg-[#FF6B35] text-black font-bold px-8 py-3 rounded-lg text-lg transition-all duration-200"
                    >
                      {editingProduct ? 'Actualizar Producto' : 'Publicar Producto'}
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