"use client"

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { X, Star, MapPin, Calendar as CalendarIcon, Award, Package, TrendingUp, MessageCircle, Coffee, Zap, MessageSquare, Target, GraduationCap, ChevronUp, ChevronDown, Clock, User } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import ActivityCard from '@/components/shared/activities/ActivityCard'
import ClientProductModal from '@/components/client/activities/client-product-modal'
import { PurchaseActivityModal } from '@/components/shared/activities/purchase-activity-modal'
import { createClient } from '@/lib/supabase/supabase-client'
import { toast } from '@/components/ui/use-toast'
import { CoachPersonalInfoSection } from '@/components/shared/coach/coach-personal-info-section'

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
  console.log("🔍 [CoachProfileModal] Rendered with props:", {
    coachName: coach?.name,
    coachId: coach?.id,
    hasAvatar: !!coach?.avatar_url,
    avatarUrl: coach?.avatar_url,
    location: coach?.location,
    preloadedActivitiesCount: preloadedActivities?.length
  });

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
  const [isStatsOpen, setIsStatsOpen] = useState(false)

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
    if (typeof coach.total_sessions === 'number') {
      setTotalSales(coach.total_sessions)
      return
    }

    if (!coach?.id) return
    // ... fallback fetch logic ... (keep existing fetch as fallback only if prop missing)
    try {
      const supabase = createClient()
      const { data: activities } = await supabase.from('activities').select('id').eq('coach_id', coach.id)
      if (activities?.length) {
        const { count } = await supabase.from('activity_enrollments').select('*', { count: 'exact', head: true }).in('activity_id', activities.map((a: { id: number }) => a.id))
        setTotalSales(count || 0)
      } else {
        setTotalSales(0)
      }
    } catch (e) {
      console.error('Error loading sales', e)
      setTotalSales(0)
    }
  }

  const loadCoachCertifications = async () => {
    // Si ya tenemos certificaciones en el objeto coach, usarlas
    if (coach.certifications && coach.certifications.length > 0) {
      setCoachCertifications(coach.certifications)
      return
    }

    if (!coach?.id) return

    try {
      const supabase = createClient()
      const { data: certs, error } = await supabase
        .from('coach_certifications')
        .select('id, name, issuer, year')
        .eq('coach_id', coach.id)
        .order('created_at', { ascending: false })

      if (error) {
        setCoachCertifications([])
        return
      }

      const normalized = (certs || []).map((c: any) => {
        const issuer = c.issuer ? ` - ${c.issuer}` : ''
        const year = c.year ? ` (${c.year})` : ''
        return `${c.name || 'Certificación'}${issuer}${year}`
      })
      setCoachCertifications(normalized)
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
          is_active: true
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

      // Redirigir a Calendar para seleccionar horario (modo meet pago)
      try {
        const ctx = {
          coachId: coach.id,
          activityId: String(consultationActivity.id),
          source: 'coach_profile_consultation',
          purchase: {
            kind: 'consultation',
            durationMinutes: Number(consultation.time) || 30,
            price: Number(consultation.price) || 0,
            label:
              type === 'express'
                ? 'Meet 15 min'
                : type === 'puntual'
                  ? 'Meet 30 min'
                  : 'Meet 60 min'
          }
        }
        localStorage.setItem('scheduleMeetContext', JSON.stringify(ctx))
        sessionStorage.setItem('scheduleMeetIntent', '1')
        window.dispatchEvent(new CustomEvent('omnia-force-tab-change', { detail: { tab: 'calendar' } }))
        window.dispatchEvent(new CustomEvent('omnia-refresh-schedule-meet'))
      } catch (e) {
        console.error('Error redirigiendo a calendario:', e)
      }

      // Cerrar modal de coach (opcional) y limpiar loading
      setIsCafeViewOpen(false)
      setIsProcessingPurchase(null)
      onClose()
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
          className="fixed inset-0 bg-black/80 z-40 flex items-start justify-center p-4 pt-16"
          onClick={handleClose}
        >
          <motion.div
            key="coach-modal-content"
            initial={{ scale: 0.9, opacity: 0, y: -20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: -20 }}
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
            <div className="relative">
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
              <div className="relative z-10">
                {/* Información personal del coach usando componente compartido */}
                <CoachPersonalInfoSection
                  coach={{
                    name: coach.name,
                    full_name: coach.name,
                    avatar_url: coach.avatar_url,
                    location: coach.location,
                    bio: coach.bio,
                    specialization: coach.specialization,
                    certifications: coach.certifications,
                    certifications_count: coach.certifications?.length,
                    rating: coach.rating,
                    total_sales: totalSales
                  }}
                  variant="modal"
                  showStreak={true}
                  streakCount={6}
                  leftAction={
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        e.preventDefault()
                        console.log('💬 [CoachProfileModal] CLICK DETECTADO: Botón Mensaje')

                        // Guardar intención de chat
                        const chatIntent = {
                          coachId: coach.id,
                          coachName: coach.name,
                          coachAvatar: coach.avatar_url
                        }
                        localStorage.setItem('startChatWithCoach', JSON.stringify(chatIntent))
                        console.log('💬 [CoachProfileModal] Intención guardada, despachando evento...')

                        // Disparar evento para cambiar de tab
                        window.dispatchEvent(new CustomEvent('navigateToTab', {
                          detail: { tab: 'messages' }
                        }))

                        onClose()
                      }}
                      className="relative z-50 cursor-pointer pointer-events-auto w-12 h-12 rounded-full flex items-center justify-center bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 transition-all hover:scale-105 active:scale-95 shadow-lg group"
                    >
                      <MessageCircle className="w-6 h-6 group-hover:text-[#FF7939] transition-colors" />
                    </button>
                  }
                  rightAction={
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        e.preventDefault()
                        console.log('📅 [CoachProfileModal] CLICK DETECTADO: Botón Calendario')

                        // Guardar contexto para agendar meet
                        const meetContext = {
                          coachId: coach.id,
                          source: 'profile_button'
                        }
                        localStorage.setItem('scheduleMeetContext', JSON.stringify(meetContext))
                        sessionStorage.setItem('scheduleMeetIntent', '1')
                        console.log('📅 [CoachProfileModal] Contexto guardado, despachando evento...')

                        // Disparar evento para cambiar de tab
                        window.dispatchEvent(new CustomEvent('navigateToTab', {
                          detail: { tab: 'calendar' }
                        }))

                        onClose()
                      }}
                      className="relative z-50 cursor-pointer pointer-events-auto w-12 h-12 rounded-full flex items-center justify-center bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 transition-all hover:scale-105 active:scale-95 shadow-lg group"
                    >
                      <CalendarIcon className="w-6 h-6 group-hover:text-[#FF7939] transition-colors" />
                    </button>
                  }
                />

                {/* Statistics Section (Collapsible) */}
                <div className="px-6 mb-6">
                  <button
                    onClick={() => setIsStatsOpen(!isStatsOpen)}
                    className="w-full flex items-center justify-between py-2 px-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-[#FF7939]" />
                      <span className="text-xs font-bold text-white/80 uppercase tracking-wide">Estadísticas</span>
                    </div>
                    {isStatsOpen ? (
                      <ChevronUp className="h-4 w-4 text-white/40" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-white/40" />
                    )}
                  </button>

                  <AnimatePresence>
                    {isStatsOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="grid grid-cols-3 gap-2 pt-2">
                          <div className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-black/40 border border-white/5">
                            <Clock className="h-3.5 w-3.5 text-[#FF7939] mb-1.5" />
                            <span className="text-xs font-bold text-white">1hr</span>
                            <span className="text-[9px] text-zinc-500 uppercase tracking-wider text-center">Resp.</span>
                          </div>
                          <div className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-black/40 border border-white/5">
                            <User className="h-3.5 w-3.5 text-[#FF7939] mb-1.5" />
                            <span className="text-xs font-bold text-white">98%</span>
                            <span className="text-[9px] text-zinc-500 uppercase tracking-wider text-center">Retención</span>
                          </div>
                          <div className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-black/40 border border-white/5">
                            <Star className="h-3.5 w-3.5 text-[#FF7939] mb-1.5" />
                            <span className="text-xs font-bold text-white">4.9/5</span>
                            <span className="text-[9px] text-zinc-500 uppercase tracking-wider text-center">Satisfac.</span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {coachCertifications && coachCertifications.length > 0 && (
                  <div className="text-center mb-8 px-4 pb-4">
                    <div className="flex items-center justify-center gap-2 flex-wrap">
                      <GraduationCap className="w-4 h-4 text-[#FF7939]" />
                      {coachCertifications.map((cert, index) => {
                        // Extraer solo el nombre del archivo sin la extensión y la ruta
                        const certName = cert.split('/').pop()?.replace(/\.(pdf|PDF)$/, '') || cert
                        return (
                          <span
                            key={index}
                            className="text-white/70 bg-white/5 backdrop-blur-md px-3 py-1 rounded-full text-xs font-medium border border-white/10"
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
            <div className="px-6 pt-2 pb-16">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white flex items-center">
                  <Package className="w-5 h-5 mr-2 text-[#FF7939]" />
                  Productos ({coachProducts.length})
                </h2>

                {/* Icono de Café en la misma fila */}
                <button
                  onClick={() => setIsCafeViewOpen((prev) => !prev)}
                  className={
                    'relative w-10 h-10 rounded-full flex items-center justify-center border transition-all duration-200 ' +
                    'backdrop-blur-md bg-white/5 hover:bg-white/10 ' +
                    'shadow-[0_8px_30px_rgba(0,0,0,0.35)]'
                  }
                  style={{
                    borderColor:
                      coachConsultations.express.active ||
                        coachConsultations.puntual.active ||
                        coachConsultations.profunda.active
                        ? 'rgba(255,121,57,0.65)'
                        : 'rgba(255,255,255,0.14)',
                  }}
                >
                  <Coffee
                    className={
                      'h-5 w-5 transition-all duration-200 ' +
                      (isCafeViewOpen ? 'opacity-40' : 'opacity-100')
                    }
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
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <Coffee className="w-5 h-5 text-[#FF7939]" />
                    <h3 className="text-white font-semibold text-sm">
                      Meet con el coach
                    </h3>
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
                        <Target className="w-5 h-5 text-[#FF7939] mb-1.5" strokeWidth={2} fill="none" />
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
                        <GraduationCap className="w-5 h-5 text-[#FF7939] mb-1.5" strokeWidth={2} fill="none" />
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
