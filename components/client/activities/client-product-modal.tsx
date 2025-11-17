"use client"

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { X, Clock, Calendar, Users, Globe, MapPin, Star, ShoppingCart, Edit, ChevronRight, Trash2, Zap, UtensilsCrossed, Flame } from 'lucide-react'
import { toast } from 'sonner'
import { Switch } from '@/components/ui/switch'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { getSupabaseClient } from '@/lib/supabase/supabase-client'
import { UniversalVideoPlayer } from '@/components/shared/video/universal-video-player'
// Hook removed - functionality to be reimplemented if needed
// import { useProductStats } from '@/hooks/coach/use-product-stats'
import { PaymentMethodsModal } from '@/components/shared/payments/payment-methods-modal'
import { useAuth } from '@/contexts/auth-context'
import { getPlanLimit, type PlanType } from '@/lib/utils/plan-limits'

interface ClientProductModalProps {
  isOpen: boolean
  onClose: () => void
  product: any & {
    isOwnProduct?: boolean
  }
  navigationContext?: {
    fromCoachProfile?: boolean
    coachId?: string
    onReturnToCoach?: () => void
  }
  onEdit?: (product: any) => void
  showEditButton?: boolean
  onDelete?: (product: any) => void
  onCoachClick?: (coachId: string) => void // Nueva prop para manejar click en coach
}

export default function ClientProductModal({ 
  isOpen, 
  onClose, 
  product,
  navigationContext,
  onEdit,
  showEditButton = false,
  onDelete,
  onCoachClick
}: ClientProductModalProps) {
  const { user } = useAuth()
  const [isExpanded, setIsExpanded] = useState(false)
  // Solo reproducir automáticamente para clientes, no para coaches
  const [isVideoRevealed, setIsVideoRevealed] = useState(false)
  const [comments, setComments] = useState<any[]>([])
  const [loadingComments, setLoadingComments] = useState(false)
  const [isAlreadyPurchased, setIsAlreadyPurchased] = useState(false)
  const [isProcessingPurchase, setIsProcessingPurchase] = useState(false)
  const [purchaseCompleted, setPurchaseCompleted] = useState(false)
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [showRepurchaseConfirm, setShowRepurchaseConfirm] = useState(false)
  const [repurchaseMessage, setRepurchaseMessage] = useState('')
  const [isPaused, setIsPaused] = useState(() => {
    // Para talleres, usar taller_activo; para otros productos, usar is_paused
    const initialPaused = product?.type === 'workshop'
      ? (product as any).taller_activo === false
      : (product?.is_paused ?? false)
    console.log('🔍 Estado inicial isPaused:', { 
      initialPaused, 
      product_is_paused: product?.is_paused,
      taller_activo: (product as any)?.taller_activo,
      type: product?.type
    })
    return initialPaused
  })
  const [isTogglingPause, setIsTogglingPause] = useState(false)
  const dragRef = useRef<HTMLDivElement>(null)
  
  // Para talleres: obtener el estado 'activo' desde taller_detalles
  const isWorkshopInactive = product?.type === 'workshop' && (product as any).taller_activo === false
  
  // Sincronizar estado con el producto cuando cambia (solo al abrir el modal)
  useEffect(() => {
    if (isOpen && product) {
      // Para talleres, usar taller_activo; para otros productos, usar is_paused
      const productPausedState = product.type === 'workshop' 
        ? (product as any).taller_activo === false 
        : (product.is_paused ?? false)
      
      console.log('🔍 ClientProductModal - Sincronizando estado inicial:', {
        id: product.id,
        type: product.type,
        is_paused: product.is_paused,
        taller_activo: (product as any).taller_activo,
        productPausedState,
        current_isPaused: isPaused
      })
      // Solo actualizar si el estado es diferente para evitar loops
      if (isPaused !== productPausedState) {
        setIsPaused(productPausedState)
      }
    }
  }, [isOpen, product]) // Incluir product para detectar cambios en taller_activo
  
  // Función para pausar/despausar producto
  const handleTogglePause = async (checked: boolean) => {
    if (!showEditButton || !product?.id) return
    
    const newPausedState = !checked
    const wasPaused = isPaused // Guardar el estado anterior antes de cambiarlo
    setIsTogglingPause(true)
    
    console.log('🔄 Iniciando toggle de pausa:', {
      productId: product.id,
      checked,
      newPausedState,
      wasPaused,
      currentIsPaused: isPaused
    })
    
    try {
      const response = await fetch(`/api/products/${product.id}/pause`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_paused: newPausedState })
      })
      
      const result = await response.json()
      
      console.log('📥 Respuesta del servidor:', {
        success: result.success,
        product_is_paused: result.product?.is_paused,
        message: result.message
      })
      
      if (result.success) {
        // Usar el estado del backend en lugar del estado calculado
        // El backend puede haber pausado automáticamente el producto si excedía límites
        const backendPausedState = result.product?.is_paused ?? newPausedState
        // Se activó (wasPaused = true, newPausedState = false) pero quedó pausado (backendPausedState = true)
        const wasAutoPaused = wasPaused && !newPausedState && backendPausedState
        const pauseReasons = result.pause_reasons || []
        const pauseDetails = result.pause_details || {}
        
        console.log('✅ Estado actualizado en backend:', {
          backendPausedState,
          result_product_is_paused: result.product?.is_paused,
          newPausedState,
          wasPaused,
          wasAutoPaused,
          pauseReasons,
          pauseDetails,
          changed: backendPausedState !== wasPaused
        })
        
        // Actualizar estado local inmediatamente con el estado FINAL del backend
        setIsPaused(backendPausedState)
        
        // Actualizar el objeto product para que refleje el cambio
        if (product) {
          product.is_paused = backendPausedState
        }
        
        // Disparar evento para actualizar la lista de productos sin recargar
        window.dispatchEvent(new CustomEvent('productUpdated', { 
          detail: { productId: product.id } 
        }))
        
        // Disparar evento específico para actualizar el estado de pausa en la lista
        window.dispatchEvent(new CustomEvent('productPauseChanged', { 
          detail: { 
            productId: product.id, 
            is_paused: backendPausedState 
          } 
        }))
        
        // Mostrar mensaje apropiado según el estado final
        if (wasAutoPaused) {
          const description = pauseReasons.length > 0 
            ? pauseReasons.join('. ') 
            : (result.message || 'El producto excede los límites de tu plan')
          toast.warning('Producto pausado automáticamente', {
            description
          })
        } else {
          toast.success(backendPausedState ? 'Producto pausado' : 'Producto activado', {
            description: backendPausedState 
              ? 'El producto está pausado y no se puede comprar' 
              : 'El producto ahora está disponible para compra'
          })
        }
        
        console.log('✅ Estado sincronizado correctamente sin recargar página:', {
          finalState: backendPausedState,
          message: result.message
        })
      } else {
        console.error('❌ Error en la respuesta del servidor:', result.error)
        toast.error('Error', {
          description: result.error || 'No se pudo cambiar el estado del producto'
        })
        // Revertir el estado del switch si falla - usar el estado original
        setIsPaused(wasPaused)
      }
    } catch (error) {
      console.error('❌ Error pausando producto:', error)
      toast.error('Error de conexión', {
        description: 'No se pudo conectar con el servidor'
      })
      // Revertir el estado del switch si falla
      setIsPaused(wasPaused)
    } finally {
      setIsTogglingPause(false)
    }
  }
  
  // Hook removed - using default values
  // const { stats: productStats, loading: statsLoading, product: productData, refresh: refreshStats } = useProductStats(product.id)
  const productStats = { totalSessions: 0, uniqueExercises: 0 }
  const statsLoading = false
  const productData = null
  const refreshStats = () => {}
  const [weeksFromPlanning, setWeeksFromPlanning] = useState<number | null>(null)
  const [planningStatsLoading, setPlanningStatsLoading] = useState(false)
  
  // Estado para límites del plan
  const [planLimits, setPlanLimits] = useState<{
    activitiesLimit: number
    weeksLimit: number
    stockLimit: number
  } | null>(null)
  
  // Función para cargar límites del plan
  // NOTA: API plan-limits eliminada - ahora obtenemos el plan y usamos límites locales
  const loadPlanLimits = useCallback(() => {
    // Intentar obtener coach_id de diferentes fuentes
    const coachId = product?.coach_id || product?.coach?.id || navigationContext?.coachId || user?.id
    
    if (showEditButton && coachId) {
      console.log('🔍 Obteniendo límites del plan para coach:', coachId)
      
      // Obtener el plan del coach desde la API
      fetch(`/api/coach/plan`)
        .then(res => {
          if (!res.ok) {
            // Si la API no está disponible, usar plan 'free' por defecto
            if (res.status === 404) {
              console.warn('⚠️ API de plan no disponible - usando plan free por defecto')
              return { success: false, plan: { plan_type: 'free' } }
            }
            return res.json().catch(() => ({ success: false, plan: { plan_type: 'free' } }))
          }
          return res.json()
        })
        .then(data => {
          // Obtener el tipo de plan (por defecto 'free')
          const planType: PlanType = (data.success && data.plan?.plan_type) || 'free'
          
          // Usar los límites locales según el plan
          const limits = {
            activitiesLimit: getPlanLimit(planType, 'activitiesPerProduct'),
            weeksLimit: getPlanLimit(planType, 'weeksPerProduct'),
            stockLimit: getPlanLimit(planType, 'stockPerProduct')
          }
          
          console.log('✅ Límites establecidos para plan', planType, ':', limits)
          setPlanLimits(limits)
        })
        .catch(err => {
          console.error('❌ Error obteniendo límites del plan:', err)
          // En caso de error, usar límites del plan 'free' por defecto
          const limits = {
            activitiesLimit: getPlanLimit('free', 'activitiesPerProduct'),
            weeksLimit: getPlanLimit('free', 'weeksPerProduct'),
            stockLimit: getPlanLimit('free', 'stockPerProduct')
          }
          setPlanLimits(limits)
        })
    } else {
      const coachId = product?.coach_id || product?.coach?.id || navigationContext?.coachId
      console.log('ℹ️ No se cargan límites - showEditButton:', showEditButton, 'coach_id:', coachId, 'product:', { coach_id: product?.coach_id, coach: product?.coach })
    }
  }, [showEditButton, product?.coach_id, product?.coach?.id, navigationContext?.coachId, user?.id])
  
  // Obtener límites del plan al abrir el modal
  useEffect(() => {
    if (isOpen) {
      loadPlanLimits()
    }
  }, [isOpen, loadPlanLimits])
  
  // Listener para actualizar cuando se edita el producto
  useEffect(() => {
    const handleProductUpdate = (event: CustomEvent) => {
      const updatedProductId = event.detail?.productId
      if (updatedProductId && String(updatedProductId) === String(product.id)) {
        console.log('🔄 Producto actualizado en modal, refrescando datos...')
        // Refrescar estadísticas
        refreshStats()
        // Recargar límites del plan
        loadPlanLimits()
      }
    }

    window.addEventListener('productUpdated', handleProductUpdate as EventListener)
    return () => {
      window.removeEventListener('productUpdated', handleProductUpdate as EventListener)
    }
  }, [product.id, refreshStats, loadPlanLimits])
  
  // Obtener datos del producto del hook
  const productCapacity = productData?.capacity || product.capacity
  const productModality = productData?.modality || product.modality
  const totalSessions = productStats?.totalSessions || product.totalSessions || 0
  const exercisesCount = productStats?.uniqueExercises || product.exercisesCount || 0
  const programDuration = (() => {
    if (product.program_info?.program_duration) {
      const parsed = parseInt(String(product.program_info.program_duration), 10)
      return isNaN(parsed) ? 0 : parsed
    }
    if ((product as any).program_duration) {
      const parsed = parseInt(String((product as any).program_duration), 10)
      return isNaN(parsed) ? 0 : parsed
    }
    return 0
  })()
  const weeksCount = weeksFromPlanning ?? product.weeks ?? productStats?.totalWeeks ?? programDuration ?? 0
  
  // Verificar qué valores exceden límites
  const exceedsActivities = planLimits ? exercisesCount > planLimits.activitiesLimit : false
  const exceedsWeeks = planLimits ? weeksCount > planLimits.weeksLimit : false
  const exceedsStock = planLimits && productCapacity ? parseInt(productCapacity.toString()) > planLimits.stockLimit : false
  
  // Debug: Log de valores para verificar excesos
  useEffect(() => {
    if (planLimits && isOpen) {
      console.log('🔍 Verificación de excesos:', {
        exercisesCount,
        activitiesLimit: planLimits.activitiesLimit,
        exceedsActivities,
        weeksCount,
        weeksLimit: planLimits.weeksLimit,
        exceedsWeeks,
        productCapacity,
        stockLimit: planLimits.stockLimit,
        exceedsStock,
        pause_reasons: product.pause_reasons
      })
    }
  }, [planLimits, exercisesCount, weeksCount, productCapacity, exceedsActivities, exceedsWeeks, exceedsStock, isOpen, product.pause_reasons])

  useEffect(() => {
    if (!isOpen || !product?.id || product.type !== 'program') {
      return
    }
    setPlanningStatsLoading(true)
    fetch(`/api/get-product-planning?actividad_id=${product.id}`)
      .then(async res => {
        if (!res.ok) {
          const errorPayload = await res.json().catch(() => ({}))
          throw new Error(errorPayload?.error || `Error ${res.status}`)
        }
        return res.json()
      })
      .then(data => {
        if (data?.success && data.data) {
          const semanas = Number(data.data.semanas || 0)
          const periods = Number(data.data.periods || 1)
          const totalWeeks = semanas * (periods || 1)
          console.log('🔢 Semanas desde planificación:', { semanas, periods, totalWeeks })
          setWeeksFromPlanning(totalWeeks)
        } else {
          setWeeksFromPlanning(null)
        }
      })
      .catch(error => {
        console.error('❌ Error obteniendo planificación para stats:', error)
        setWeeksFromPlanning(null)
      })
      .finally(() => {
        setPlanningStatsLoading(false)
      })
  }, [isOpen, product?.id, product?.type])

  // Función para obtener fuegos de dificultad con colores específicos
  const getDifficultyFires = (difficulty?: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'beginner':
        return <Flame className="w-4 h-4 text-orange-300" />
      case 'intermediate':
        return (
          <div className="flex gap-1">
            <Flame className="w-4 h-4 text-[#FF7939]" />
            <Flame className="w-4 h-4 text-[#FF7939]" />
          </div>
        )
      case 'advanced':
        return (
          <div className="flex gap-1">
            <Flame className="w-4 h-4 text-red-500" />
            <Flame className="w-4 h-4 text-red-500" />
            <Flame className="w-4 h-4 text-red-500" />
          </div>
        )
      default:
        return <Flame className="w-4 h-4 text-orange-300" />
    }
  }

  const getDietTypeDisplay = (dietType?: string) => {
    if (!dietType) return null
    
    // Convertir valores técnicos a texto amigable
    const getFriendlyDietName = (diet: string) => {
      switch (diet.toLowerCase()) {
        case 'baja_carbohidratos':
          return 'Baja en carbohidratos'
        case 'keto':
          return 'Keto'
        case 'paleo':
          return 'Paleo'
        case 'vegana':
          return 'Vegana'
        case 'vegetariana':
          return 'Vegetariana'
        case 'mediterranea':
          return 'Mediterránea'
        case 'balanceada':
          return 'Balanceada'
        default:
          return diet
      }
    }
    
    return (
      <div className="flex items-center gap-1 text-[#FF7939]">
        <UtensilsCrossed className="w-4 h-4" />
        <span className="text-sm font-medium">{getFriendlyDietName(dietType)}</span>
      </div>
    )
  }
  
  // Cargar comentarios cuando se abre el modal
  useEffect(() => {
    if (isOpen && product?.id) {
      loadComments()
      // Verificar si ya está comprada desde la base de datos
      checkPurchaseStatus()
      setIsVideoRevealed(false)
    }
  }, [isOpen, product?.id])

  // Estado para el status de compra detallado
  const [purchaseStatus, setPurchaseStatus] = useState<{
    hasNeverPurchased: boolean
    hasActivePurchase: boolean
    hasCompletedPurchase: boolean
    hasCancelledPurchase: boolean
    message: string
    buttonText: string
  } | null>(null)

  // Función para verificar el estado real de compra usando el nuevo endpoint
  const checkPurchaseStatus = async () => {
    try {
      const response = await fetch(`/api/activities/${product.id}/purchase-status`)
      const result = await response.json()
      
      if (response.ok && result.success) {
        setPurchaseStatus(result.data)
        // Mantener compatibilidad con el estado anterior
        setIsAlreadyPurchased(!result.data.hasNeverPurchased)
      } else if (response.status === 401) {
        // Usuario no autenticado - usar estado por defecto
        console.log('Usuario no autenticado, usando estado por defecto')
        setPurchaseStatus({
          hasNeverPurchased: true,
          hasActivePurchase: false,
          hasCompletedPurchase: false,
          hasCancelledPurchase: false,
          message: 'Primera compra',
          buttonText: 'Comprar'
        })
        setIsAlreadyPurchased(false)
      } else {
        console.error('Error checking purchase status:', result.error)
        // Fallback a localStorage si hay error
        const purchasedActivities = JSON.parse(localStorage.getItem('purchasedActivities') || '[]')
        setIsAlreadyPurchased(purchasedActivities.includes(product.id))
      }
    } catch (error) {
      console.error('Error checking purchase status:', error)
      // Fallback a localStorage si hay error
      const purchasedActivities = JSON.parse(localStorage.getItem('purchasedActivities') || '[]')
      setIsAlreadyPurchased(purchasedActivities.includes(product.id))
    }
  }

  // Debug: Ver qué datos están llegando
  // console.log('🔍 ClientProductModal - Datos del producto:', product)
  // console.log('🔍 Coach avg_rating:', product.coach_avg_rating)
  // console.log('🔍 Coach data:', product.coach)

  // Función para cargar comentarios desde activity_surveys
  const loadComments = async () => {
    if (!product.id) return
    
    setLoadingComments(true)
    try {
      const supabase = getSupabaseClient()
      
      // Primero, vamos a ver qué columnas están disponibles en activity_surveys
      const { data: surveys, error: surveysError } = await supabase
        .from('activity_surveys')
        .select('*')
        .eq('activity_id', product.id)
        .not('comments', 'is', null)
        .order('created_at', { ascending: false })
        .limit(10)

      if (surveysError) {
        console.error('Error loading surveys:', surveysError)
        return
      }

      if (!surveys || surveys.length === 0) {
        setComments([])
        return
      }

      // console.log('🔍 Surveys encontrados:', surveys)
      // console.log('🔍 Columnas disponibles en el primer survey:', Object.keys(surveys[0] || {}))
      // console.log('🔍 Primer survey completo:', surveys[0])

      // Intentar obtener información del usuario si existe una columna de usuario
      let commentsWithProfiles = []
      
      // Verificar si hay alguna columna que contenga información del usuario
      const firstSurvey = surveys[0]
      const possibleUserColumns = ['user_id', 'user', 'client_id', 'client', 'participant_id', 'participant']
      const userColumn = possibleUserColumns.find(col => firstSurvey && firstSurvey[col])
      
      // Usar directamente la columna difficulty_rating
      const ratingColumn = 'difficulty_rating'
      
      // console.log(`🔍 Columna de usuario encontrada: ${userColumn || 'ninguna'}`)
      // console.log(`🔍 Usando columna de calificación: ${ratingColumn}`)
      // console.log(`🔍 Valor de calificación en primer survey:`, firstSurvey?.[ratingColumn])
      
      if (userColumn && firstSurvey[userColumn]) {
        // console.log(`🔍 Encontrada columna de usuario: ${userColumn}`)
        
        // Obtener los IDs de usuario únicos
        const userIds = [...new Set(surveys.map((s: any) => s[userColumn]).filter(Boolean))]
        
        // Obtener los perfiles de usuario
        const { data: profiles, error: profilesError } = await supabase
          .from('user_profiles')
          .select('id, full_name, avatar_url')
          .in('id', userIds)

        if (profilesError) {
          console.error('Error loading profiles:', profilesError)
        }

        // Combinar los datos
        commentsWithProfiles = surveys.map((survey: any) => ({
          ...survey,
          user_profiles: profiles?.find((p: any) => p.id === survey[userColumn]) || {
            full_name: 'Usuario Anónimo',
            avatar_url: null
          }
        }))
      } else {
        // console.log('🔍 No se encontró columna de usuario, usando datos por defecto')
        // Si no hay columna de usuario, usar datos por defecto
        commentsWithProfiles = surveys.map((survey: any) => ({
          ...survey,
          user_profiles: {
            full_name: 'Usuario Anónimo',
            avatar_url: null
          }
        }))
      }

      setComments(commentsWithProfiles)
    } catch (error) {
      console.error('Error loading comments:', error)
    } finally {
      setLoadingComments(false)
    }
  }



  const getValidImageUrl = useCallback(() => {
    const imageUrl = product.activity_media?.[0]?.image_url || product.image?.url
    
    // Si es una URL de placeholder, usar una imagen real
    if (imageUrl && imageUrl.includes('via.placeholder.com')) {
      return `https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop&crop=center&timestamp=${Date.now()}`
    }
    
    return imageUrl
  }, [product.activity_media, product.image])

  
      // Debug logs
      // console.log('🔍 ClientProductModal - Datos del producto:', {
      //   id: product.id,
      //   title: product.title,
      //   exercisesCount: product.exercisesCount,
      //   totalSessions: product.totalSessions,
      //   csvDataLength: product.csvData?.length,
      //   coach_name: product.coach_name,
      //   coach: product.coach,
      //   coach_specialization: product.coach_specialization,
      //   coach_experience_years: product.coach_experience_years,
      //   coach_rating: product.coach_rating,
      //   activity_media: product.activity_media
      // });

  // Determinar modalidad - memoizado
  const modality = useMemo(() => product.modality || 'online', [product.modality])
  const modalityText = useMemo(() => 
    modality === 'online' ? 'Online' : 'Presencial', 
    [modality]
  )
  const modalityIcon = useMemo(() => 
    modality === 'online' ? Globe : MapPin, 
    [modality]
  )

  // Determinar rating - memoizado
  const hasRating = useMemo(() => 
    product.program_rating && product.program_rating > 0, 
    [product.program_rating]
  )
  const rating = useMemo(() => 
    hasRating ? Number(product.program_rating).toFixed(1) : '-', 
    [hasRating, product.program_rating]
  )
  const totalReviews = useMemo(() => 
    product.total_program_reviews || 0, 
    [product.total_program_reviews]
  )

  // Determinar si es nuevo - memoizado
  const isNew = useMemo(() => 
    !hasRating && totalReviews === 0, 
    [hasRating, totalReviews]
  )

  // Purchase handler - abrir modal de métodos de pago - memoizado
  const handlePurchase = useCallback(async () => {
    console.log('Comprar producto:', product.id)
    
    // Permitir múltiples compras - mostrar modal de confirmación si tiene compras previas
    if (purchaseStatus?.hasActivePurchase || purchaseStatus?.hasCompletedPurchase || purchaseStatus?.hasCancelledPurchase) {
      const message = purchaseStatus?.hasActivePurchase 
        ? `Esta actividad sigue activa entre tus compras. ¿Quieres comprarla nuevamente?`
        : purchaseStatus?.hasCompletedPurchase
        ? `Ya completaste esta actividad. ¿Quieres repetirla?`
        : `Cancelaste esta actividad anteriormente. ¿Quieres comprarla de nuevo?`
      
      setRepurchaseMessage(message)
      setShowRepurchaseConfirm(true)
      return
    }
    
    // Abrir modal de métodos de pago
    setIsPaymentModalOpen(true)
  }, [product.id, product.title, purchaseStatus])

  // Confirmar recompra
  const handleConfirmRepurchase = useCallback(() => {
    setShowRepurchaseConfirm(false)
    setIsPaymentModalOpen(true)
  }, [])

  // Cancelar recompra
  const handleCancelRepurchase = useCallback(() => {
    setShowRepurchaseConfirm(false)
  }, [])

  // Función para ejecutar la compra directamente - memoizada
  const executePurchase = useCallback(async (paymentMethod: string = 'credit_card') => {
    setIsProcessingPurchase(true)
    try {
      // Hacer la llamada real a la API de compra
      const response = await fetch('/api/enrollments/direct', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          activityId: product.id,
          paymentMethod: paymentMethod,
          notes: 'Compra directa desde la aplicación web'
        }),
      })

      const result = await response.json()
      
      if (response.ok && result.success) {
        // Marcar como comprada en localStorage
        const purchasedActivities = JSON.parse(localStorage.getItem('purchasedActivities') || '[]')
        if (!purchasedActivities.includes(product.id)) {
          purchasedActivities.push(product.id)
          localStorage.setItem('purchasedActivities', JSON.stringify(purchasedActivities))
        }
        
        // Marcar como compra completada
        setPurchaseCompleted(true)
        
        // Actualizar estado de compra
        await checkPurchaseStatus()
        
        // NO cerrar el modal - mostrar botón "Ir a la actividad"
      } else {
        // Mostrar error
        alert(`Error en la compra: ${result.error || 'Error desconocido'}`)
        console.error('Error en la compra:', result)
      }
    } catch (error) {
      console.error('Error al procesar la compra:', error)
      alert('Error al procesar la compra. Por favor, inténtalo de nuevo.')
    } finally {
      setIsProcessingPurchase(false)
    }
  }, [product.id, checkPurchaseStatus])

  // Función para manejar la selección del método de pago
  const handlePaymentMethodSelect = useCallback(async (paymentMethod: string) => {
    console.log('Método de pago seleccionado:', paymentMethod)
    setIsPaymentModalOpen(false)
    
    // Ejecutar la compra real con el método seleccionado
    await executePurchase(paymentMethod)
  }, [executePurchase])

  // Función para ir a la actividad - memoizada
  const handleGoToActivity = useCallback(() => {
    // En la app móvil, simplemente cerrar el modal y mostrar mensaje
    // La navegación se maneja por el stack de la app
    console.log('Navegando a la actividad:', product?.id)
    alert('¡Compra exitosa! Ve a "Mis Programas" para acceder a tu actividad.')
    onClose()
  }, [product?.id, onClose])

  // Función para manejar el cierre con navegación contextual - memoizada
  const handleClose = useCallback(() => {
    // Si venimos del perfil del coach, regresar ahí
    if (navigationContext?.fromCoachProfile && navigationContext?.onReturnToCoach) {
      // console.log('🔄 Regresando al perfil del coach desde modal de actividad')
      navigationContext.onReturnToCoach()
    } else {
      // Cierre normal
      onClose()
    }
  }, [navigationContext, onClose])

  // Función para manejar el click en el perfil del coach - memoizada
  const handleCoachClick = useCallback(() => {
    // Solo permitir click si NO venimos del perfil del coach
    if (!navigationContext?.fromCoachProfile && product?.coach_id) {
      console.log('🎯 Navegando al perfil del coach desde modal de actividad')
      
      // Cerrar el modal actual
      onClose()
      
      // Llamar a la función del componente padre para abrir el modal del coach
      if (onCoachClick) {
        onCoachClick(product.coach_id)
      } else {
        console.warn('⚠️ onCoachClick no está definido - no se puede abrir el perfil del coach')
      }
    } else {
      console.log('🚫 Click en coach deshabilitado - viene del perfil del coach')
    }
  }, [navigationContext, product?.coach_id, onClose, onCoachClick])

  // Mostrar video bajo demanda
  const handleVideoClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setIsVideoRevealed(true)
  }, [])

  // Early return después de todos los hooks
  if (!isOpen || !product) {
    return null
  }

  const renderUpgradeButton = () => (
    <Button
      onClick={() => {
        // Cerrar el modal
        onClose()
        // Navegar a la sección de planes en el perfil
        if (typeof window !== 'undefined') {
          setTimeout(() => {
            // Disparar evento personalizado para cambiar de tab al perfil
            const event = new CustomEvent('navigateToTab', { detail: { tab: 'profile', section: 'plans' } })
            window.dispatchEvent(event)
          }, 300)
        }
      }}
      className="w-full bg-gradient-to-r from-[#FF7939] to-orange-600 hover:from-[#FF7939]/90 hover:to-orange-600/90 text-white font-semibold py-2 px-4 rounded-lg transition-all flex items-center justify-center"
    >
      <Zap className="h-4 w-4 mr-2" />
      Upgrade de Plan
    </Button>
  )

  return (
    <>
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 z-40 flex items-center justify-center p-4 pt-20"
          onClick={handleClose}
        >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-[#1A1A1A] rounded-2xl w-full max-w-4xl border border-[#2A2A2A] max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Content */}
          <div className="px-0 pb-6">
            {/* Product Image/Video */}
            <div className="relative w-full h-64 rounded-none overflow-hidden mb-6">
              {/* Botón Pausar Ventas - Esquina inferior izquierda */}
              {showEditButton && (
                <div className="absolute bottom-4 left-4 z-10 flex items-center gap-2 bg-black/70 backdrop-blur-sm px-3 py-2 rounded-lg">
                  <span className="text-white text-sm font-medium">
                    {isPaused 
                      ? (product.type === 'workshop' && isWorkshopInactive)
                        ? 'Taller finalizado'
                        : (exceedsActivities || exceedsWeeks || (product.pause_reasons && product.pause_reasons.length > 0))
                        ? 'Ventas pausadas - Exceso de límites'
                        : 'Ventas pausadas'
                      : 'Ventas activas'}
                  </span>
                  <Switch
                    checked={!isPaused}
                    onCheckedChange={(checked) => {
                      console.log('🔄 Switch cambiado:', { 
                        checked, 
                        currentIsPaused: isPaused, 
                        willBePaused: !checked,
                        isWorkshop: product.type === 'workshop',
                        isWorkshopInactive
                      })
                      handleTogglePause(checked)
                    }}
                    disabled={isTogglingPause || (product.type === 'workshop' && isWorkshopInactive && !isPaused)}
                    className="data-[state=checked]:bg-[#FF7939]"
                  />
                  {isTogglingPause && (
                    <Clock className="h-4 w-4 text-white animate-spin" />
                  )}
                </div>
              )}
              
              {/* Action Buttons Overlay - Esquina derecha */}
              <div className="absolute top-4 right-4 z-50 flex gap-2 pointer-events-auto">
                {showEditButton && onEdit && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      onEdit(product)
                    }}
                    className="bg-black/50 hover:bg-black/70 text-white hover:text-white pointer-events-auto"
                    title="Editar producto"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                )}
                {showEditButton && onDelete && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      onDelete(product)
                    }}
                    className="bg-black/50 hover:bg-black/70 text-red-400 hover:text-red-300 pointer-events-auto"
                    title="Eliminar producto"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleClose()
                  }}
                  className="bg-black/50 hover:bg-black/70 text-white hover:text-white pointer-events-auto z-50"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            {product.activity_media?.[0]?.video_url ? (
              <div className="relative w-full h-full pointer-events-auto" style={{ zIndex: 1 }}>
                {isVideoRevealed ? (
                  <UniversalVideoPlayer
                    videoUrl={product.activity_media[0].video_url}
                    bunnyVideoId={product.activity_media[0].bunny_video_id}
                    thumbnailUrl={getValidImageUrl()}
                    autoPlay
                    muted={false}
                    controls
                    loop={false}
                    className="w-full h-full object-cover"
                    onError={() => {
                      console.warn('Error cargando video')
                    }}
                  />
                ) : (
                  <>
                    <Image
                      src={getValidImageUrl() || '/placeholder.svg?height=256&width=400&query=fitness'}
                      alt={product.title || 'Imagen del producto'}
                      fill
                      className="object-cover"
                    />
                    <button
                      onClick={handleVideoClick}
                      className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm transition hover:bg-black/50"
                      title="Reproducir video"
                    >
                      <div className="flex items-center justify-center rounded-full bg-[#FF7939] text-white p-4 shadow-lg shadow-[#FF7939]/40">
                        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    </button>
                  </>
                )}
              </div>
            ) : (
              <Image
                src={getValidImageUrl() || '/placeholder.svg?height=256&width=400&query=fitness'}
                alt={product.title || 'Imagen del producto'}
                fill
                className="object-cover"
              />
            )}
              
              {/* Overlay Badges */}
              <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
                <div></div>
                <div className="flex flex-col items-end gap-2">
                  {isNew && (
                    <div className="bg-green-500/90 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-full">
                      NUEVO
                    </div>
                  )}
                  {isPaused && (exceedsActivities || exceedsWeeks) && (
                    <div className="bg-gray-700/90 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1.5 rounded-full">
                      Ventas pausadas
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Product Info */}
            <div className="px-6 space-y-6">
              {/* Title and Coach */}
              <div>
                <h3 className="text-2xl font-bold text-white mb-3">{product.title}</h3>
                
                {/* Coach Profile Card - Clickeable solo si NO viene del perfil del coach */}
                <div 
                  className={`flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 ${
                    !navigationContext?.fromCoachProfile 
                      ? 'hover:bg-gray-800/50 cursor-pointer' 
                      : 'cursor-default opacity-75'
                  }`}
                  onClick={handleCoachClick}
                >
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-[#FF7939]/50">
                      <Image
                        src={product.coach_avatar_url || '/placeholder.svg?height=40&width=40&query=coach'}
                        alt="Coach"
                        width={40}
                        height={40}
                        className="object-cover"
                        style={{ width: 'auto', height: 'auto' }}
                      />
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-900"></div>
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-semibold">{product.coach_name || product.coach?.name || 'Coach'}</p>
                    {product.coach_experience_years && (
                      <p className="text-gray-400 text-sm">{product.coach_experience_years} años de experiencia</p>
                    )}
                  </div>
                  {/* Coach Rating */}
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span className="text-white font-medium">
                      {product.coach_avg_rating ? product.coach_avg_rating.toFixed(1) : 'N/A'}
                    </span>
                  </div>
                  
                  {/* Indicador visual de que es clickeable */}
                  {!navigationContext?.fromCoachProfile && (
                    <div className="ml-2">
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    </div>
                  )}
                </div>
                
                {/* Mensaje informativo cuando viene del perfil del coach */}
                {navigationContext?.fromCoachProfile && (
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    💡 Cierra esta actividad para volver al perfil del coach
                  </p>
                )}
              </div>

              {/* Description with expand/collapse */}
              <div>
                <h3 className="text-lg font-semibold mb-2 text-white">Descripción</h3>
                <div className="text-gray-300 leading-relaxed">
                  {isDescriptionExpanded ? (
                    <p>{product.description}</p>
                  ) : (
                    <div>
                      <p 
                        className="overflow-hidden"
                        style={{
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          lineHeight: '1.5em',
                          height: '4.5em'
                        }}
                      >
                        {product.description}
                      </p>
                      {product.description && product.description.length > 150 && (
                        <button
                          onClick={() => setIsDescriptionExpanded(true)}
                          className="text-[#FF7939] hover:text-[#FF6B00] text-sm mt-2"
                        >
                          ...ver más
                        </button>
                      )}
                    </div>
                  )}
                  {isDescriptionExpanded && (
                    <button
                      onClick={() => setIsDescriptionExpanded(false)}
                      className="text-[#FF7939] hover:text-[#FF6B00] text-sm mt-2"
                    >
                      ...ver menos
                    </button>
                  )}
                </div>
              </div>

              {/* Statistics with words - 2x2 grid */}
              <div className="grid grid-cols-2 gap-4 items-start w-full">
                {/* Fila 1 */}
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-[#FF7939]" />
                  <span className="text-gray-300">Sesiones: {statsLoading ? '...' : totalSessions}</span>
                </div>
                
                <div className={`flex items-center gap-2 ${exceedsActivities ? 'border-2 border-red-500 rounded-lg' : ''}`}>
                  {product.categoria === 'nutricion' || product.categoria === 'nutrition' ? (
                    <UtensilsCrossed className={`h-5 w-5 ${exceedsActivities ? 'text-red-500' : 'text-[#FF7939]'}`} />
                  ) : (
                    <Zap className={`h-5 w-5 ${exceedsActivities ? 'text-red-500' : 'text-[#FF7939]'}`} />
                  )}
                  <span className={exceedsActivities ? 'text-red-500 font-bold' : 'text-gray-300'}>
                    {product.categoria === 'nutricion' || product.categoria === 'nutrition' ? 'Platos' : 'Ejercicios'}: {statsLoading ? '...' : planLimits?.activitiesLimit ? `${exercisesCount}/${planLimits.activitiesLimit}` : exercisesCount}
                  </span>
                </div>
                
                {/* Fila 2 */}
                {productCapacity && (
                  <div className={`flex items-center gap-2 ${exceedsStock ? 'border-2 border-red-500 rounded-lg' : ''}`}>
                    <Users className={`h-5 w-5 ${exceedsStock ? 'text-red-500' : 'text-[#FF7939]'}`} />
                    <span className={exceedsStock ? 'text-red-500 font-bold' : 'text-gray-300'}>
                      Cupos: {parseInt(productCapacity.toString()) >= 999 ? 'Ilimitados' : productCapacity}
                    </span>
                  </div>
                )}
                
                <div className={`flex items-center gap-2 ${exceedsWeeks ? 'border-2 border-red-500 rounded-lg' : ''}`}>
                  <Clock className={`h-5 w-5 ${exceedsWeeks ? 'text-red-500' : 'text-[#FF7939]'}`} />
                  <span className={exceedsWeeks ? 'text-red-500 font-bold' : 'text-gray-300'}>
                    Semanas: {planningStatsLoading ? '...' : planLimits?.weeksLimit ? `${weeksCount}/${planLimits.weeksLimit}` : (weeksCount || 'N/A')}
                  </span>
                </div>
                
                {/* Fila 3 - Dificultad y Modalidad (con lugar si es presencial) */}
                <div className="flex items-center gap-2">
                  {/* Para productos de nutrición, mostrar tipo de dieta en lugar de dificultad */}
                  {(product.categoria === 'nutricion' || product.categoria === 'nutrition' || productData?.categoria === 'nutricion' || productData?.categoria === 'nutrition') ? (
                    getDietTypeDisplay(productData?.dieta || product.dieta)
                  ) : (
                    <>
                      {getDifficultyFires(product.difficulty)}
                      <span className="text-gray-300">
                        {product.difficulty === 'beginner' ? 'Principiante' :
                         product.difficulty === 'intermediate' ? 'Intermedio' :
                         product.difficulty === 'advanced' ? 'Avanzado' : 'Intermedio'}
                      </span>
                    </>
                  )}
                </div>
                
                {/* Modalidad después (celda ocupa ambas columnas) */}
                <div className="col-span-2 col-start-1 flex items-center gap-2 w-full min-w-0">
                  {(() => {
                    const locationName = productData?.location_name || product.location_name
                    const locationUrl = productData?.location_url || product.location_url
                    if (productModality === 'presencial') {
                      return (
                        <div className="overflow-x-auto whitespace-nowrap -mx-1 px-1 w-full min-w-0">
                          <div className="inline-flex items-center gap-2 min-w-max">
                            <MapPin className="h-5 w-5 text-red-500 flex-shrink-0" />
                            {locationName || locationUrl ? (
                              <button
                                onClick={() => {
                                  if (locationUrl) {
                                    let mapsUrl = locationUrl
                                    if (!locationUrl.startsWith('http://') && !locationUrl.startsWith('https://')) {
                                      mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locationUrl)}`
                                    }
                                    window.open(mapsUrl, '_blank')
                                  }
                                }}
                                className="inline-flex items-center text-red-500 underline hover:text-red-400 whitespace-nowrap"
                                title={locationUrl ? 'Abrir en Google Maps' : 'Ubicación'}
                              >
                                {locationName || locationUrl || 'Ver ubicación'}
                              </button>
                            ) : (
                              <span className="text-gray-300">Presencial</span>
                            )}
                          </div>
                        </div>
                      )
                    }
                    if (productModality === 'hibrido') {
                      return (
                        <>
                          <Globe className="h-5 w-5 text-yellow-500" />
                          <span className="text-gray-300">Híbrido</span>
                        </>
                      )
                    }
                    return (
                      <>
                        <Globe className="h-5 w-5 text-white" />
                        <span className="text-gray-300">Online</span>
                      </>
                    )
                  })()}
                </div>
                
                {/* Botón Upgrade de Plan - Solo si hay excesos, debajo de todas las variables */}
                {(exceedsActivities || exceedsWeeks || exceedsStock) && (
                  <div className="col-span-2 mt-2">
                    {renderUpgradeButton()}
                  </div>
                )}
              </div>


              {/* Objetivos Section - Horizontal scrollable */}
              {product.objetivos && Array.isArray(product.objetivos) && product.objetivos.length > 0 && (
                <div className="border-t border-gray-800 pt-4">
                  <h4 className="text-white font-semibold mb-3">Objetivos</h4>
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {product.objetivos.map((objetivo: string, index: number) => (
                      <span 
                        key={index}
                        className="bg-[#FF7939]/20 text-[#FF7939] text-sm px-3 py-1.5 rounded-full font-medium border border-[#FF7939]/30 whitespace-nowrap flex-shrink-0"
                      >
                        {objetivo}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Location for presencial activities - Mostrar si hay ubicación */}
              {/* Ya no mostramos sección de Ubicación aparte si la modalidad presencial ya mostró el lugar arriba */}
              {(productModality === 'presencial' || productModality === 'Presencial') && false && (
                <>
                  {(() => {
                    const locationName = productData?.location_name || product.location_name
                    const locationUrl = productData?.location_url || product.location_url
                    const hasLocation = locationName || locationUrl
                    
                    if (!hasLocation) return null
                    
                    return (
                      <div className="border-t border-gray-800 pt-4">
                        <h4 className="text-white font-semibold mb-3">Ubicación</h4>
                        <button
                          onClick={() => {
                            if (locationUrl) {
                              // Si es una dirección (no un link), convertirla a link de Google Maps
                              let mapsUrl = locationUrl
                              if (!locationUrl.startsWith('http://') && !locationUrl.startsWith('https://')) {
                                // Es una dirección, convertirla a link de Google Maps
                                mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locationUrl)}`
                              }
                              window.open(mapsUrl, '_blank')
                            }
                          }}
                          className="flex items-center space-x-2 text-red-500 hover:text-red-400 transition-colors cursor-pointer"
                          title={locationUrl ? "Haz clic para ver en Google Maps" : "Ubicación"}
                          disabled={!locationUrl}
                        >
                          <MapPin className="h-4 w-4 text-red-500 flex-shrink-0" />
                          <span className="underline">
                            {locationName || locationUrl || 'Ver ubicación'}
                          </span>
                        </button>
                      </div>
                    )
                  })()}
                </>
              )}

              {/* Comments Section */}
              <div className="border-t border-gray-800 pt-4">
                <h4 className="text-white font-semibold mb-3">Comentarios</h4>
                {loadingComments ? (
                  <div className="text-gray-400 text-sm">
                    <p>Cargando comentarios...</p>
                  </div>
                ) : comments.length > 0 ? (
                  <div className="space-y-4">
                    {comments.map((comment) => (
                      <div key={comment.id} className="bg-gray-800/50 rounded-lg p-3">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-700">
                            <Image
                              src={comment.user_profiles?.avatar_url || '/placeholder.svg?height=32&width=32&query=user'}
                              alt={comment.user_profiles?.full_name || 'Usuario'}
                              width={32}
                              height={32}
                              className="object-cover"
                            />
                          </div>
                          <div className="flex-1">
                            <p className="text-white text-sm font-medium">
                              {comment.user_profiles?.full_name || 'Usuario Anónimo'}
                            </p>
                            <div className="flex items-center space-x-1">
                              {/* Mostrar calificación si existe */}
                              {(() => {
                                // Usar directamente la columna difficulty_rating
                                const ratingValue = comment.difficulty_rating
                                
                                if (ratingValue && ratingValue > 0) {
                                  return (
                                    <div className="flex items-center space-x-1 mr-2">
                                      {[...Array(5)].map((_, i) => (
                                        <Star
                                          key={i}
                                          className={`h-3 w-3 ${
                                            i < Math.floor(ratingValue || 0)
                                              ? "fill-yellow-400 text-yellow-400"
                                              : "text-gray-600"
                                          }`}
                                        />
                                      ))}
                                    </div>
                                  )
                                }
                                return null
                              })()}
                              <span className="text-gray-400 text-xs">
                                {new Date(comment.created_at).toLocaleDateString('es-ES')}
                              </span>
                            </div>
                          </div>
                        </div>
                        <p className="text-gray-300 text-sm leading-relaxed">
                          {comment.comments}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm">No hay comentarios aún</p>
                )}
                
                {/* Product Rating */}
                {product.program_rating && product.program_rating > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-700">
                    <div className="flex items-center space-x-2">
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <span className="text-gray-300">Rating del producto: {product.program_rating.toFixed(1)}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Spacer para el botón fijo */}
              <div className="h-20"></div>
            </div>
          </div>
        </motion.div>
      </motion.div>
      )}

    </AnimatePresence>

             {/* Floating Buy Button - Solo mostrar si no es el coach del producto y el modal de pagos no está abierto */}
             {isOpen && !product.isOwnProduct && !isPaymentModalOpen && (
      <>
        {purchaseCompleted && (
          // Botón después de compra exitosa
          <div className="fixed bottom-24 right-4 z-[9999] bg-green-600/20 border border-green-500/30 rounded-full px-4 py-2 mb-3">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-green-400 text-xs font-medium">
                ¡Compra exitosa!
              </span>
            </div>
          </div>
        )}
        
        {/* Botón flotante de compra con precio integrado - Movido más arriba para no tapar el menú */}
        <button
          onClick={purchaseCompleted ? handleGoToActivity : handlePurchase}
          disabled={isProcessingPurchase}
          className="fixed bottom-20 right-4 z-[9999] bg-[#FF7939] hover:bg-[#FF6B00] text-white rounded-full px-4 py-3 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110 disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          {purchaseCompleted ? (
            <>
              <Calendar className="h-5 w-5" />
              <span className="text-sm font-medium">Ir a Actividad</span>
            </>
          ) : isProcessingPurchase ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm font-medium">Procesando...</span>
            </>
          ) : (
            <>
              <ShoppingCart className="h-5 w-5" />
              <span className="text-sm font-bold">${product.price}.00</span>
            </>
          )}
        </button>
      </>
    )}

    {/* Modal de Métodos de Pago */}
    <PaymentMethodsModal
      isOpen={isPaymentModalOpen}
      onClose={() => setIsPaymentModalOpen(false)}
      onPaymentMethodSelect={handlePaymentMethodSelect}
      productPrice={product.price || 0}
      productTitle={product.title || 'Producto'}
    />

    {/* Modal de Confirmación de Recompra */}
    <AnimatePresence>
      {showRepurchaseConfirm && (
        <div 
          className="fixed inset-0 z-[10000] flex items-center justify-center p-4"
          style={{
            background: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)'
          }}
          onClick={handleCancelRepurchase}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="max-w-sm w-full rounded-2xl overflow-hidden"
            style={{
              background: 'rgba(15, 16, 18, 0.95)',
              backdropFilter: 'blur(20px) saturate(180%)',
              WebkitBackdropFilter: 'blur(20px) saturate(180%)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Contenido */}
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#FF7939]/20 mb-4">
                  <ShoppingCart className="w-6 h-6 text-[#FF7939]" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Actividad ya comprada
                </h3>
                <p className="text-sm text-gray-300 leading-relaxed">
                  {repurchaseMessage}
                </p>
              </div>

              {/* Botones */}
              <div className="flex gap-3">
                <button
                  onClick={handleCancelRepurchase}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors border border-white/10"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmRepurchase}
                  className="flex-1 px-4 py-2.5 text-sm font-medium bg-[#FF7939]/20 hover:bg-[#FF7939]/30 text-[#FF7939] rounded-lg transition-colors border border-[#FF7939]/30"
                >
                  Comprar de nuevo
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  </>
  )
}
