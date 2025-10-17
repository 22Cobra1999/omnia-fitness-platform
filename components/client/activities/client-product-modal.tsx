"use client"

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { X, Clock, Calendar, Users, Globe, MapPin, Star, ShoppingCart, Edit, ChevronRight, Trash2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { getSupabaseClient } from '@/lib/supabase/supabase-client'
import { UniversalVideoPlayer } from '@/components/shared/video/universal-video-player'

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
  const [isExpanded, setIsExpanded] = useState(false)
  const [isVideoPlaying, setIsVideoPlaying] = useState(true)
  const [isVideoMuted, setIsVideoMuted] = useState(true)
  const [comments, setComments] = useState<any[]>([])
  const [loadingComments, setLoadingComments] = useState(false)
  const [isAlreadyPurchased, setIsAlreadyPurchased] = useState(false)
  const [isProcessingPurchase, setIsProcessingPurchase] = useState(false)
  const [purchaseCompleted, setPurchaseCompleted] = useState(false)
  const dragRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  
  // Cargar comentarios cuando se abre el modal
  useEffect(() => {
    if (isOpen && product?.id) {
      loadComments()
      
      // Verificar si ya está comprada desde la base de datos
      checkPurchaseStatus()
    }
  }, [isOpen, product?.id])

  // Auto-reproducir video cuando se abre el modal
  useEffect(() => {
    if (isOpen && product?.activity_media?.[0]?.video_url) {
      // Intentar reproducir después de un pequeño delay
      setTimeout(() => {
        if (videoRef.current) {
          // Verificar si el video tiene fuentes válidas
          if (videoRef.current.readyState >= 1) {
            videoRef.current.play().then(() => {
              setIsVideoPlaying(true)
            }).catch((error) => {
              console.warn('No se pudo reproducir el video automáticamente:', error.message)
              // No es un error crítico, solo un warning
            })
          } else {
            console.warn('Video no está listo para reproducir')
          }
        }
      }, 500)
    }
  }, [isOpen, product?.activity_media])

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

  // Calcular cantidad de ejercicios y sesiones - memoizados
  const exercisesCount = useMemo(() => 
    product.exercisesCount || product.csvData?.length || 0, 
    [product.exercisesCount, product.csvData]
  )
  const totalSessions = useMemo(() => 
    product.totalSessions || 0, 
    [product.totalSessions]
  )
  
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

  // Real purchase handler - compra directa sin modal de pago - memoizado
  const handlePurchase = useCallback(async () => {
    console.log('Comprar producto:', product.id)
    
    // Verificar estado de compra
    if (purchaseStatus?.hasActivePurchase) {
      alert(`Ya tienes esta actividad activa: "${product.title}". Ve a "Mis Programas" para acceder.`)
      return
    }
    
    if (purchaseStatus?.hasCompletedPurchase) {
      const confirmRepurchase = confirm(`Ya completaste esta actividad: "${product.title}". ¿Quieres repetirla?`)
      if (!confirmRepurchase) {
        return
      }
    }
    
    if (purchaseStatus?.hasCancelledPurchase) {
      const confirmRepurchase = confirm(`Cancelaste esta actividad anteriormente: "${product.title}". ¿Quieres comprarla de nuevo?`)
      if (!confirmRepurchase) {
        return
      }
    }
    
    // Comprar directamente
    await executePurchase()
  }, [product.id, product.title, purchaseStatus])

  // Función para ejecutar la compra directamente - memoizada
  const executePurchase = useCallback(async () => {
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
          paymentMethod: 'credit_card',
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


  // Función para ir a la actividad - memoizada
  const handleGoToActivity = useCallback(() => {
    // Navegar directamente a la actividad específica
    if (product?.id) {
      window.location.href = `/activities/${product.id}`
    } else {
      console.error('No se pudo obtener el ID de la actividad')
    }
  }, [product?.id])

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

  // Video handlers - memoizados
  const handleVideoClick = useCallback(() => {
    if (videoRef.current) {
      if (isVideoPlaying) {
        videoRef.current.pause()
        setIsVideoPlaying(false)
      } else {
        videoRef.current.play().then(() => {
          setIsVideoPlaying(true)
        }).catch((error) => {
          console.error('Error al reproducir:', error)
        })
      }
    }
  }, [isVideoPlaying])

  // Handler para activar/desactivar audio
  const handleAudioToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation() // Evitar que se pause el video
    if (videoRef.current) {
      videoRef.current.muted = !isVideoMuted
      setIsVideoMuted(!isVideoMuted)
    }
  }, [isVideoMuted])

  // Early return después de todos los hooks
  if (!isOpen || !product) {
    return null
  }

  return (
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
              {/* Action Buttons Overlay */}
              <div className="absolute top-4 right-4 z-10 flex gap-2">
                {showEditButton && onEdit && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(product)}
                    className="bg-black/50 hover:bg-black/70 text-white hover:text-white"
                    title="Editar producto"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                )}
                {showEditButton && onDelete && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(product)}
                    className="bg-black/50 hover:bg-black/70 text-red-400 hover:text-red-300"
                    title="Eliminar producto"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClose}
                  className="bg-black/50 hover:bg-black/70 text-white hover:text-white"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              {product.activity_media?.[0]?.video_url ? (
                <div className="relative w-full h-full">
                  <UniversalVideoPlayer
                    videoUrl={product.activity_media[0].video_url}
                    bunnyVideoId={product.activity_media[0].bunny_video_id}
                    thumbnailUrl={getValidImageUrl()}
                    autoPlay={true}
                    muted={true}
                    controls={false}
                    loop={false}
                    className="w-full h-full object-cover"
                    onError={() => {
                      console.warn('Error cargando video')
                    }}
                  />
                  
                  {/* Botón de audio estilo Instagram */}
                  <button
                    onClick={handleAudioToggle}
                    className="absolute bottom-4 right-4 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full transition-all duration-200 backdrop-blur-sm"
                    title={isVideoMuted ? 'Activar audio' : 'Silenciar audio'}
                  >
                    {isVideoMuted ? (
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                        <path d="M14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                        <line x1="2" y1="2" x2="22" y2="22" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                      </svg>
                    )}
                  </button>
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
                <div className="bg-[#FF7939]/90 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-full">
                  {(() => {
                    switch(product.type) {
                      case 'program': return 'PROGRAMA'
                      case 'workshop': return 'TALLER'
                      case 'document': return 'DOCUMENTO'
                      default: return product.type?.toUpperCase() || 'PRODUCTO'
                    }
                  })()}
                </div>
                {isNew && (
                  <div className="bg-green-500/90 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-full">
                    NUEVO
                  </div>
                )}
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

              {/* Description */}
              <div>
                <p className="text-gray-300 leading-relaxed">{product.description}</p>
              </div>

              {/* Simple Stats - Conditional based on activity type */}
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-400">
                {(() => {
                  // Para talleres (workshops), usar las columnas específicas
                  if (product.type === 'workshop') {
                    return (
                      <>
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4" />
                          <span>{product.sessions_per_client || 0} sesiones</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Users className="h-4 w-4" />
                          <span>{product.workshop_type || 'Tipo N/A'}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {React.createElement(modalityIcon, { className: "h-4 w-4" })}
                          <span>{product.modality || 'Online'}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Star className="h-4 w-4" />
                          <span>{rating}</span>
                        </div>
                      </>
                    )
                  } else {
                    // Para programas, usar las columnas existentes
                    return (
                      <>
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4" />
                          <span>{totalSessions} sesiones</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Users className="h-4 w-4" />
                          <span>{exercisesCount} {product.categoria === 'nutricion' ? 'platos' : 'ejercicios'}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {React.createElement(modalityIcon, { className: "h-4 w-4" })}
                          <span>{modalityText}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Star className="h-4 w-4" />
                          <span>{rating}</span>
                        </div>
                      </>
                    )
                  }
                })()}
              </div>

              {/* Additional Info */}
              {product.program_info && (
                <div className="flex items-center justify-between text-sm text-gray-400">
                  {product.program_info.duration && (
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4" />
                      <span>{product.program_info.duration} min/sesión</span>
                    </div>
                  )}
                  {product.program_info.program_duration && (
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>{product.program_info.program_duration} {product.program_info.program_duration === 1 ? 'semana' : 'semanas'}</span>
                    </div>
                  )}
                </div>
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
              </div>

              {/* Smart Buy Button - Solo mostrar si no es el coach del producto */}
              {!product.isOwnProduct && (
                <div className="mt-6">
                  {purchaseCompleted ? (
                    // Botón después de compra exitosa
                    <div className="space-y-3">
                      <div className="bg-green-600/20 border border-green-500/30 rounded-xl px-4 py-3">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-green-400 text-sm font-medium">
                            ¡Compra exitosa! Te has inscrito correctamente.
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={handleGoToActivity}
                        className="w-full rounded-xl px-6 py-4 flex items-center justify-center space-x-3 transition-all duration-200 hover:scale-105 bg-[#FF7939] hover:bg-[#FF6B00]"
                      >
                        <Calendar className="h-5 w-5 text-white" />
                        <span className="text-white font-bold text-lg">Ir a la Actividad</span>
                      </button>
                    </div>
                  ) : (
                    // Botón de compra normal
                    <button
                      onClick={handlePurchase}
                      disabled={isProcessingPurchase}
                      className="w-full rounded-xl px-6 py-4 flex items-center justify-between transition-all duration-200 hover:scale-105 bg-[#FF7939] hover:bg-[#FF6B00] disabled:bg-gray-600 disabled:cursor-not-allowed"
                    >
                      <div className="flex items-center space-x-3">
                        <ShoppingCart className="h-5 w-5 text-white" />
                        <span className="text-white font-bold text-lg">${product.price}.00</span>
                      </div>
                      <div className="flex flex-col items-end">
                        {isProcessingPurchase ? (
                          <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-white text-sm font-medium">Procesando...</span>
                          </div>
                        ) : (
                          <span className="text-white text-sm font-medium">
                            {purchaseStatus?.buttonText || (isAlreadyPurchased ? 'Comprar de nuevo' : 'Comprar')}
                          </span>
                        )}
                        {purchaseStatus?.message && (
                          <span className="text-white/70 text-xs">
                            {purchaseStatus.message}
                          </span>
                        )}
                      </div>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
      )}
    </AnimatePresence>
  )
}
