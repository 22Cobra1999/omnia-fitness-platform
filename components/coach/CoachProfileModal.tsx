"use client"

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { X, Star, MapPin, Calendar, Award, Package, TrendingUp, MessageCircle, Coffee, Zap, MessageSquare, Target, GraduationCap } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import ActivityCard from '@/components/shared/activities/ActivityCard'
import ClientProductModal from '@/components/client/activities/client-product-modal'
import { PurchaseActivityModal } from '@/components/shared/activities/purchase-activity-modal'
import { createClient } from '@/lib/supabase/supabase-client'
import { toast } from '@/components/ui/use-toast'

interface CoachProfileModalProps {
  isOpen: boolean
  onClose: () => void
  coach: {
    id: string
    name: string
    avatar_url?: string
    bio?: string
    location?: string
    experience_years?: number
    specialization?: string
    certifications?: string[]
    rating?: number
    total_sessions?: number
    total_products?: number
  }
  navigationContext?: {
    fromSearch?: boolean
  }
  preloadedActivities?: any[] // Actividades ya cargadas desde search para evitar recarga
  onActivityClick?: (activity: any) => void
}

export default function CoachProfileModal({ 
  isOpen, 
  onClose, 
  coach,
  navigationContext,
  preloadedActivities,
  onActivityClick
}: CoachProfileModalProps) {
  const [coachProducts, setCoachProducts] = useState<any[]>([])
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [isProductModalOpen, setIsProductModalOpen] = useState(false)
  const [isCafeViewOpen, setIsCafeViewOpen] = useState(false)
  const [coachConsultations, setCoachConsultations] = useState<{
    express: { active: boolean; price: number; time: number; name: string }
    puntual: { active: boolean; price: number; time: number; name: string }
    profunda: { active: boolean; price: number; time: number; name: string }
  }>({
    express: { active: false, price: 0, time: 15, name: 'Express' },
    puntual: { active: false, price: 0, time: 30, name: 'Consulta puntual' },
    profunda: { active: false, price: 0, time: 60, name: 'Sesión profunda' }
  })
  const [isProcessingPurchase, setIsProcessingPurchase] = useState<string | null>(null)
  const [selectedConsultationActivity, setSelectedConsultationActivity] = useState<any>(null)
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false)
  const [totalSales, setTotalSales] = useState<number | null>(null)
  const [coachCertifications, setCoachCertifications] = useState<string[]>([])

  // Cargar productos del coach cuando se abre el modal
  useEffect(() => {
    if (isOpen && coach?.id) {
      loadCoachProducts()
      loadCoachConsultations()
      loadCoachSales()
      loadCoachCertifications()
    }
  }, [isOpen, coach?.id, preloadedActivities])

  const loadCoachProducts = async () => {
    if (!coach?.id) return
    
    // Optimización: Si hay actividades pre-cargadas, filtrar las del coach en lugar de hacer otra llamada
    if (preloadedActivities && preloadedActivities.length > 0) {
      const coachProductsFromCache = preloadedActivities.filter(
        (activity: any) => activity.coach_id === coach.id
      )
      
      if (coachProductsFromCache.length > 0) {
        console.log(`✅ [CoachProfileModal] Usando ${coachProductsFromCache.length} actividades del cache para coach ${coach.id}`)
        setCoachProducts(coachProductsFromCache)
        setLoadingProducts(false)
        return
      }
    }
    
    // Si no hay actividades pre-cargadas o no se encontraron del coach, hacer la llamada
    setLoadingProducts(true)
    try {
      console.log(`📡 [CoachProfileModal] Cargando productos del coach ${coach.id} desde API`)
      // Usar la misma API que el search para obtener productos
      const response = await fetch(`/api/activities/search?coachId=${coach.id}`)
      if (!response.ok) {
        throw new Error('Failed to fetch coach products')
      }
      
      const products = await response.json()
      setCoachProducts(products || [])
    } catch (error) {
      console.error('Error cargando productos del coach:', error)
      setCoachProducts([])
    } finally {
      setLoadingProducts(false)
    }
  }

  const loadCoachConsultations = async () => {
    if (!coach?.id) return

    try {
      // Cargar consultas del coach directamente desde Supabase (público, solo lectura)
      const supabase = createClient()
      const { data: coachData, error } = await supabase
        .from('coaches')
        .select('cafe, cafe_enabled, meet_30, meet_30_enabled, meet_1, meet_1_enabled')
        .eq('id', coach.id)
        .single()

      if (error) {
        console.warn('⚠️ Error cargando consultas del coach:', error.message)
        return
      }

      if (coachData) {
        setCoachConsultations({
          express: {
            active: coachData.cafe_enabled || false,
            price: coachData.cafe || 0,
            time: 15,
            name: 'Express'
          },
          puntual: {
            active: coachData.meet_30_enabled || false,
            price: coachData.meet_30 || 0,
            time: 30,
            name: 'Consulta puntual'
          },
          profunda: {
            active: coachData.meet_1_enabled || false,
            price: coachData.meet_1 || 0,
            time: 60,
            name: 'Sesión profunda'
          }
        })
      }
    } catch (error) {
      console.error('Error cargando consultas del coach:', error)
    }
  }

  const loadCoachSales = async () => {
    if (!coach?.id) return

    try {
      const supabase = createClient()
      
      // Primero obtener las actividades del coach
      const { data: activities, error: activitiesError } = await supabase
        .from('activities')
        .select('id')
        .eq('coach_id', coach.id)

      if (activitiesError) {
        console.error('Error obteniendo actividades del coach:', activitiesError)
        setTotalSales(0)
        return
      }

      if (activities && activities.length > 0) {
        const activityIds = activities.map((a: { id: number }) => a.id)
        
        // Contar enrollments (ventas) del coach
        const { count, error: enrollmentsError } = await supabase
          .from('activity_enrollments')
          .select('*', { count: 'exact', head: true })
          .in('activity_id', activityIds)

        if (enrollmentsError) {
          console.error('Error contando ventas del coach:', enrollmentsError)
          setTotalSales(0)
        } else {
          setTotalSales(count || 0)
        }
      } else {
        setTotalSales(0)
      }
    } catch (error) {
      console.error('Error cargando ventas del coach:', error)
      setTotalSales(0)
    }
  }

  const loadCoachCertifications = async () => {
    if (!coach?.id) return

    try {
      const supabase = createClient()
      const { data: coachData, error } = await supabase
        .from('coaches')
        .select('certifications')
        .eq('id', coach.id)
        .single()

      if (error) {
        console.warn('⚠️ Error cargando certificados del coach:', error.message)
        setCoachCertifications([])
        return
      }

      if (coachData && coachData.certifications) {
        // certifications es un array de strings (text[])
        const certs = Array.isArray(coachData.certifications) 
          ? coachData.certifications 
          : []
        const filteredCerts = certs.filter(Boolean)
        console.log('📜 Certificados cargados:', filteredCerts)
        setCoachCertifications(filteredCerts)
      } else {
        console.log('📜 No hay certificados para este coach')
        setCoachCertifications([])
      }
    } catch (error) {
      console.error('Error cargando certificados del coach:', error)
      setCoachCertifications([])
    }
  }

  const handleClose = () => {
    onClose()
  }

  const handleProductClick = (product: any) => {
    // Si hay onActivityClick (desde search), usarlo para mantener consistencia
    if (onActivityClick) {
      onActivityClick(product)
    } else {
      // Si no, abrir el modal directamente
      setSelectedProduct(product)
      setIsProductModalOpen(true)
    }
  }

  const handleCloseProductModal = () => {
    setIsProductModalOpen(false)
    setSelectedProduct(null)
  }

  const handlePurchaseConsultation = async (type: 'express' | 'puntual' | 'profunda') => {
    const consultation = coachConsultations[type]
    if (!consultation.active || consultation.price <= 0) {
      toast({
        title: "Error",
        description: "Esta consulta no está disponible",
        variant: "destructive"
      })
      return
    }

    setIsProcessingPurchase(type)

    try {
      // Crear una actividad de tipo "consultation" o "meet" dinámicamente
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        toast({
          title: "Error",
          description: "Debes iniciar sesión para comprar",
          variant: "destructive"
        })
        setIsProcessingPurchase(null)
        return
      }

      // Crear la actividad de consulta
      const consultationTitle = type === 'express' 
        ? 'Consulta Express - 15 min'
        : type === 'puntual'
        ? 'Consulta Puntual - 30 min'
        : 'Sesión Profunda - 60 min'

      const { data: consultationActivity, error: createError } = await supabase
        .from('activities')
        .insert({
          coach_id: coach.id,
          title: consultationTitle,
          description: `Consulta con ${coach.name}`,
          type: 'consultation',
          price: consultation.price,
          categoria: 'consultation',
          modality: 'online',
          is_public: false,
          is_active: true,
          workshop_mode: type === 'express' ? 'express' : type === 'puntual' ? 'puntual' : 'profunda'
        })
        .select()
        .single()

      if (createError || !consultationActivity) {
        console.error('Error creando actividad de consulta:', createError)
        toast({
          title: "Error",
          description: "No se pudo crear la consulta. Intenta nuevamente.",
          variant: "destructive"
        })
        setIsProcessingPurchase(null)
        return
      }

      // Abrir el modal de compra con la actividad creada
      setSelectedConsultationActivity({
        ...consultationActivity,
        coach: {
          id: coach.id,
          full_name: coach.name
        }
      })
      setIsPurchaseModalOpen(true)
      setIsProcessingPurchase(null)
    } catch (error: any) {
      console.error('Error en la compra de consulta:', error)
      toast({
        title: "Error",
        description: error.message || "Ocurrió un error al procesar la compra",
        variant: "destructive"
      })
      setIsProcessingPurchase(null)
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="coach-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 z-40 flex items-center justify-center p-4"
          onClick={handleClose}
        >
        <motion.div
          key="coach-modal-content"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative bg-[#1A1A1A] rounded-2xl w-full max-w-2xl border border-[#2A2A2A] max-h-[90vh] overflow-y-auto overscroll-contain"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Botón de cerrar */}
          <div className="absolute top-4 right-4 z-[100]">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="bg-black/50 hover:bg-black/70 text-white hover:text-white backdrop-blur-sm"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Header del Coach */}
          <div className="relative p-6 pb-4">
            {/* Imagen de fondo difuminada */}
            {coach.avatar_url && (
              <div className="absolute inset-0 rounded-t-2xl overflow-hidden">
                <Image 
                  src={coach.avatar_url} 
                  alt={coach.name} 
                  fill
                  className="object-cover blur-sm scale-110" 
                />
                <div className="absolute inset-0 bg-black/60" />
              </div>
            )}

            {/* Contenido del header */}
            <div className="relative z-10 text-center">
              {/* Avatar */}
              <div className="flex justify-center mb-4">
                <div className="w-24 h-24 bg-gradient-to-br from-[#FF6A00] to-[#FF8C42] rounded-full flex items-center justify-center overflow-hidden">
                  {coach.avatar_url ? (
                    <img 
                      src={coach.avatar_url} 
                      alt="Foto de perfil" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-3xl text-white font-bold">{coach.name[0]}</span>
                  )}
                </div>
              </div>

              {/* Nombre */}
              <h1 className="text-2xl font-bold text-white mb-2">
                {coach.name}
              </h1>

              {/* Rating, Ventas y Ubicación en la misma línea */}
              <div className="flex items-center justify-center gap-4 mb-4 flex-wrap">
                {coach.rating && coach.rating > 0 ? (
                  <div className="flex items-center text-[#FF7939]">
                    <Star className="w-5 h-5 fill-current mr-1" />
                    <span className="text-lg font-semibold">{coach.rating.toFixed(1)}</span>
                  </div>
                ) : (
                  <div className="flex items-center text-gray-400">
                    <Star className="w-5 h-5 mr-1" />
                    <span>Sin reseñas</span>
                  </div>
                )}
                
                {/* Ventas totales */}
                <div className="flex items-center text-gray-300">
                  <span className="text-sm">
                    {totalSales !== null ? `${totalSales} ventas` : 'Cargando...'}
                  </span>
                </div>
                
                {/* Ubicación */}
                {coach.location && (
                  <div className="flex items-center text-gray-300">
                    <MapPin className="w-4 h-4 text-[#FF7939] mr-1" />
                    <span className="text-sm">{coach.location}</span>
                  </div>
                )}
              </div>

              {/* Bio */}
              {coach.bio && (
                <div className="text-center mb-4">
                  <p className="text-gray-300 text-sm leading-relaxed">
                    {coach.bio}
                  </p>
                </div>
              )}

              {/* Especialización */}
              {coach.specialization && (
                <div className="text-center mb-4">
                  <span className="text-[#FF7939] bg-[#FF7939]/10 px-3 py-1 rounded-full text-sm font-medium border border-[#FF7939]/20">
                    {coach.specialization}
                  </span>
                </div>
              )}

              {/* Certificados */}
              {coachCertifications && coachCertifications.length > 0 && (
                <div className="text-center mb-4">
                  <div className="flex items-center justify-center gap-2 flex-wrap">
                    <GraduationCap className="w-4 h-4 text-[#FF7939]" />
                    {coachCertifications.map((cert, index) => {
                      // Extraer solo el nombre del archivo sin la extensión y la ruta
                      const certName = cert.split('/').pop()?.replace(/\.(pdf|PDF)$/, '') || cert
                      return (
                        <span 
                          key={index}
                          className="text-[#FF7939] bg-[#FF7939]/10 px-3 py-1 rounded-full text-sm font-medium border border-[#FF7939]/20"
                        >
                          {certName}
                        </span>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Productos del Coach */}
          <div className="px-6 pt-6 pb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white flex items-center">
                <Package className="w-5 h-5 mr-2 text-[#FF7939]" />
                Productos ({coachProducts.length})
              </h2>
              
              {/* Icono de Café en la misma fila */}
              <button
                onClick={() => setIsCafeViewOpen((prev) => !prev)}
                className="relative w-10 h-10 rounded-full flex items-center justify-center bg-transparent border-2 transition-all duration-200 hover:bg-[#1A1A1A]/50"
                style={{
                  borderColor:
                    coachConsultations.express.active ||
                    coachConsultations.puntual.active ||
                    coachConsultations.profunda.active
                      ? '#FF7939'
                      : '#4B5563',
                }}
              >
                <Coffee
                  className="h-5 w-5 transition-colors duration-200"
                  style={{
                    color:
                      coachConsultations.express.active ||
                      coachConsultations.puntual.active ||
                      coachConsultations.profunda.active
                        ? '#FF7939'
                        : '#9CA3AF',
                  }}
                />
              </button>
            </div>

            {/* Vista de Consultas (Meet con el coach) inline, debajo del header */}
            {isCafeViewOpen && (
              <div className="mb-4">
                {/* Header: Símbolo de café y "Meet con el coach" en la misma línea, centrados */}
                <div className="flex items-center justify-center gap-2 mb-3 relative">
                  <Coffee className="w-5 h-5 text-[#FF7939]" />
                  <h3 className="text-white font-semibold text-sm">
                    Meet con el coach
                  </h3>
                  <button
                    onClick={() => setIsCafeViewOpen(false)}
                    className="absolute top-0 right-0 text-gray-400 hover:text-white transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Grid horizontal de consultas (una al lado de la otra) */}
                <div className="grid grid-cols-3 gap-3">
                  {/* Express - 15 min */}
                  {coachConsultations.express.active && (
                    <button
                      onClick={() => handlePurchaseConsultation('express')}
                      disabled={isProcessingPurchase === 'express'}
                      className="flex flex-col items-center justify-center p-3 rounded-lg border border-[#2A2A2A] bg-[#1A1A1A] hover:border-[#FF7939] hover:bg-[#1A1A1A]/80 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {/* Icono */}
                      <Zap className="w-5 h-5 text-[#FF7939] mb-1.5" strokeWidth={2} fill="none" />
                      {/* Nombre */}
                      <h4 className="text-white font-semibold text-xs text-center mb-0.5">
                        {coachConsultations.express.name}
                      </h4>
                      {/* Minutos */}
                      <p className="text-gray-400 text-xs mb-1">
                        {coachConsultations.express.time} min
                      </p>
                      {/* Precio */}
                      <div className="flex items-center gap-1">
                        <span className="text-gray-400 text-xs">$</span>
                        <span className="text-[#FF7939] font-bold text-sm">
                          {coachConsultations.express.price}
                        </span>
                      </div>
                      {isProcessingPurchase === 'express' && (
                        <div className="mt-1">
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-[#FF7939]"></div>
                        </div>
                      )}
                    </button>
                  )}

                  {/* Puntual - 30 min */}
                  {coachConsultations.puntual.active && (
                    <button
                      onClick={() => handlePurchaseConsultation('puntual')}
                      disabled={isProcessingPurchase === 'puntual'}
                      className="flex flex-col items-center justify-center p-3 rounded-lg border border-[#2A2A2A] bg-[#1A1A1A] hover:border-[#FF7939] hover:bg-[#1A1A1A]/80 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {/* Icono */}
                      <MessageSquare
                        className="w-5 h-5 text-[#FF7939] mb-1.5"
                        strokeWidth={2}
                        fill="none"
                      />
                      {/* Nombre */}
                      <h4 className="text-white font-semibold text-xs text-center mb-0.5">
                        {coachConsultations.puntual.name}
                      </h4>
                      {/* Minutos */}
                      <p className="text-gray-400 text-xs mb-1">
                        {coachConsultations.puntual.time} min
                      </p>
                      {/* Precio */}
                      <div className="flex items-center gap-1">
                        <span className="text-gray-400 text-xs">$</span>
                        <span className="text-[#FF7939] font-bold text-sm">
                          {coachConsultations.puntual.price}
                        </span>
                      </div>
                      {isProcessingPurchase === 'puntual' && (
                        <div className="mt-1">
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-[#FF7939]"></div>
                        </div>
                      )}
                    </button>
                  )}

                  {/* Profunda - 60 min */}
                  {coachConsultations.profunda.active && (
                    <button
                      onClick={() => handlePurchaseConsultation('profunda')}
                      disabled={isProcessingPurchase === 'profunda'}
                      className="flex flex-col items-center justify-center p-3 rounded-lg border border-[#2A2A2A] bg-[#1A1A1A] hover:border-[#FF7939] hover:bg-[#1A1A1A]/80 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {/* Icono */}
                      <Target className="w-5 h-5 text-[#FF7939] mb-1.5" strokeWidth={2} fill="none" />
                      {/* Nombre */}
                      <h4 className="text-white font-semibold text-xs text-center mb-0.5">
                        {coachConsultations.profunda.name}
                      </h4>
                      {/* Minutos */}
                      <p className="text-gray-400 text-xs mb-1">
                        {coachConsultations.profunda.time} min
                      </p>
                      {/* Precio */}
                      <div className="flex items-center gap-1">
                        <span className="text-gray-400 text-xs">$</span>
                        <span className="text-[#FF7939] font-bold text-sm">
                          {coachConsultations.profunda.price}
                        </span>
                      </div>
                      {isProcessingPurchase === 'profunda' && (
                        <div className="mt-1">
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-[#FF7939]"></div>
                        </div>
                      )}
                    </button>
                  )}
                </div>

                {/* Mensaje si no hay consultas activas */}
                {!coachConsultations.express.active &&
                  !coachConsultations.puntual.active &&
                  !coachConsultations.profunda.active && (
                    <div className="text-center py-3">
                      <p className="text-gray-400 text-xs">
                        Este coach aún no tiene consultas disponibles
                      </p>
                    </div>
                  )}
              </div>
            )}

            {loadingProducts ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF7939]"></div>
              </div>
            ) : coachProducts.length > 0 ? (
              <div className="overflow-x-auto">
                <div className="flex gap-4" style={{ minWidth: "min-content" }}>
                  {coachProducts.map((product, index) => (
                    <ActivityCard
                      key={product.id || `product-${index}`}
                      activity={product}
                      onClick={() => handleProductClick(product)}
                      size="small"
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Package className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">Este coach aún no tiene productos disponibles</p>
              </div>
            )}
          </div>
        </motion.div>
        </motion.div>
      )}

      {/* Modal del producto */}
      {selectedProduct && (
        <ClientProductModal
          key={`product-modal-${selectedProduct.id || 'unknown'}`}
          isOpen={isProductModalOpen}
          onClose={handleCloseProductModal}
          product={selectedProduct}
          navigationContext={{ fromCoachProfile: true, coachId: coach.id }}
        />
      )}

      {/* Modal de compra de consulta */}
      {selectedConsultationActivity && (
        <PurchaseActivityModal
          isOpen={isPurchaseModalOpen}
          onClose={() => {
            setIsPurchaseModalOpen(false)
            setSelectedConsultationActivity(null)
            setIsProcessingPurchase(null)
          }}
          activity={selectedConsultationActivity}
          onPurchaseComplete={(enrollment) => {
            setIsPurchaseModalOpen(false)
            setSelectedConsultationActivity(null)
            setIsProcessingPurchase(null)
            toast({
              title: "Compra exitosa",
              description: "Tu consulta ha sido reservada correctamente",
            })
          }}
        />
      )}
    </AnimatePresence>
  )
}
