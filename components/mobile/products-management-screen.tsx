"use client"

import { useState, useEffect, useCallback, useMemo, memo, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Plus, TrendingUp, Users, DollarSign, Package, Filter, ArrowUpDown, ArrowUp, ArrowDown, ChevronDown, Edit, Trash2, X, Coffee, MessageCircle, Video, Calendar, Clock, Flame, Zap, MessageSquare, Target } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import CreateProductModal from '@/components/shared/products/create-product-modal-refactored'
import ActivityCard from '@/components/shared/activities/ActivityCard'
import ClientProductModal from '@/components/client/activities/client-product-modal'
import { API_ENDPOINTS } from '@/lib/config/api-config'
import { useAuth } from '@/contexts/auth-context'
import { StorageUsageWidget } from '@/components/coach/storage-usage-widget'
import { CSVManagerEnhanced } from '@/components/shared/csv/csv-manager-enhanced'
import { createClient } from '@/lib/supabase/supabase-client'

type Product = {
  id: number
  title: string
  description: string
  type: string
  difficulty: string
  price: number
  coach_id: string
  is_public: boolean
  created_at: string
  updated_at: string
  categoria?: string
  program_rating?: number
  total_program_reviews?: number
  activity_media?: Array<{ image_url?: string; video_url?: string }>
  image_url?: string
  media?: { image_url?: string }
  sessions_per_client?: number
  is_paused?: boolean
}

type SortField = 'title' | 'type' | 'price' | 'created_at'
type SortDirection = 'asc' | 'desc'

// Componente memoizado para las cards de productos
const ProductCard = memo(({ 
  product, 
  onEdit, 
  onPreview, 
  onDelete, 
  convertProductToActivity 
}: {
  product: Product
  onEdit: (product: Product) => void
  onPreview: (product: Product) => void
  onDelete: (product: Product) => void
  convertProductToActivity: (product: Product) => any
}) => {
  return (
    <div className="flex-shrink-0 w-48">
      <ActivityCard
        activity={convertProductToActivity(product)}
        size="small"
        onClick={() => onPreview(product)}
        onEdit={() => onEdit(product)}
        onDelete={() => onDelete(product)}
      />
    </div>
  )
})

ProductCard.displayName = 'ProductCard'

interface ProductsManagementScreenProps {
  onTabChange?: (tab: string) => void
}

export default function ProductsManagementScreen({ onTabChange }: ProductsManagementScreenProps = {}) {
  const { user } = useAuth()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [activeSubTab, setActiveSubTab] = useState<'fitness' | 'nutrition'>('fitness')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isProductModalOpen, setIsProductModalOpen] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState<'todos' | 'fitness' | 'nutrition' | 'workshop' | 'document' | 'program'>('todos')
  const [sortField, setSortField] = useState<SortField>('title')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [showTypeDropdown, setShowTypeDropdown] = useState(false)
  
  // Estado para tabs principales
  const [activeMainTab, setActiveMainTab] = useState<'products' | 'exercises' | 'storage'>('products')
  
  // Estado para las 3 consultas
  const [consultations, setConsultations] = useState({
    express: { active: false, price: 0, time: 15, name: 'Express', icon: 1 },
    puntual: { active: false, price: 0, time: 30, name: 'Consulta puntual', icon: 2 },
    profunda: { active: false, price: 0, time: 60, name: 'Sesión profunda', icon: 3 }
  })
  const [editingPrice, setEditingPrice] = useState<string | null>(null)
  const [isCafeModalOpen, setIsCafeModalOpen] = useState(false)
  const [isTogglingConsultation, setIsTogglingConsultation] = useState<string | null>(null)
  const [consultationSales, setConsultationSales] = useState<{
    express: any[]
    puntual: any[]
    profunda: any[]
  }>({
    express: [],
    puntual: [],
    profunda: []
  })
  const [pendingConsultations, setPendingConsultations] = useState<any[]>([])
  const [consultationError, setConsultationError] = useState<string | null>(null)
  // Mantener estado anterior para compatibilidad
  const [cafeConsultation, setCafeConsultation] = useState({ active: false, price: 0 })
  const [isEditingCafePrice, setIsEditingCafePrice] = useState(false)
  const [isTogglingCafe, setIsTogglingCafe] = useState(false)
  const [cafeSalesCount, setCafeSalesCount] = useState(0)
  const [cafeSales, setCafeSales] = useState<any[]>([])
  const [isMeetModalOpen, setIsMeetModalOpen] = useState(false)
  const [selectedSaleForMeet, setSelectedSaleForMeet] = useState<any>(null)
  const [meetSchedule, setMeetSchedule] = useState({
    date: '',
    time1: '',
    time2: '',
    meetingName: ''
  })
  const [coachPhone, setCoachPhone] = useState('') // Teléfono del coach
  const [isWorkshopRestartModalOpen, setIsWorkshopRestartModalOpen] = useState(false)
  const [workshopToRestart, setWorkshopToRestart] = useState<Product | null>(null)
  const [showDateChangeNotice, setShowDateChangeNotice] = useState(false)
  const [shouldOpenWorkshopSchedule, setShouldOpenWorkshopSchedule] = useState(false)
  const [shouldShowDateChangeNoticeAfterStep5, setShouldShowDateChangeNoticeAfterStep5] = useState(false)
  // Talleres para los que el coach ya completó la encuesta en esta sesión (clave: activity_id)
  const [completedCoachSurveys, setCompletedCoachSurveys] = useState<Record<number, boolean>>({})
  
  // Estados para modal de encuesta en el detalle
  const [showSurveyModalInDetail, setShowSurveyModalInDetail] = useState(false)
  const [surveyModalProduct, setSurveyModalProduct] = useState<Product | null>(null)
  const [surveyModalBlocking, setSurveyModalBlocking] = useState(false) // true = bloqueante (al editar), false = cerrable (al abrir detalle)
  const [workshopRating, setWorkshopRating] = useState(0)
  const [workshopFeedback, setWorkshopFeedback] = useState('')
  const [isSubmittingSurvey, setIsSubmittingSurvey] = useState(false)
  const [surveySubmitted, setSurveySubmitted] = useState(false)
  
  // Estado para modal de confirmación de eliminación
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false)
  const [productToDelete, setProductToDelete] = useState<Product | null>(null)
  
  // Estado para modal de eliminación exitosa
  const [deleteSuccessOpen, setDeleteSuccessOpen] = useState(false)
  const [deletedProductName, setDeletedProductName] = useState<string>('')
  
  // Estado para evitar doble ejecución
  const [isDeleting, setIsDeleting] = useState(false)
  
  // Estado para guardar si el modal de detalle estaba abierto antes de editar
  const [wasPreviewOpenBeforeEdit, setWasPreviewOpenBeforeEdit] = useState(false)

  // Estado para estadísticas
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalRevenue: 0,
    avgRating: 0,
    totalReviews: 0,
    totalEnrollments: 0,
    totalSales: 0
  })

  // Cargar productos desde Supabase - Memoizado
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true)
      
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 60000) // 60 segundos timeout (aumentado para APIs lentas)
      
      const response = await fetch(API_ENDPOINTS.PRODUCTS, {
        signal: controller.signal,
        credentials: 'include', // ✅ Incluir cookies en la petición
        headers: {
          'Content-Type': 'application/json',
        }
      })
      
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status} ${response.statusText}`)
      }
      
      const result = await response.json()
      
      if (result.success) {
        setProducts(result.products || [])
        
        // Actualizar el producto seleccionado si existe (usando el estado actual)
        setSelectedProduct(prev => {
          if (prev) {
            const updatedProduct = result.products?.find((p: Product) => p.id === prev.id)
            return updatedProduct || prev
          }
          return prev
        })
      } else {
        console.error('Error cargando productos:', result.error)
        toast.error('Error al cargar productos: ' + (result.error || 'Error desconocido'))
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.error('Timeout al obtener productos')
        toast.error('La solicitud tardó demasiado tiempo. Por favor, intenta nuevamente.')
      } else if (error.message) {
        console.error('Error al obtener productos:', error)
        toast.error('Error al cargar productos: ' + error.message)
      } else {
        console.error('Error al obtener productos:', error)
        toast.error('Error desconocido al cargar productos')
      }
    } finally {
      setLoading(false)
    }
  }, []) // Sin dependencias para evitar loops

  // Cargar las 3 consultas del coach desde Supabase
  const fetchCafeConsultation = useCallback(async () => {
    if (!user?.id) {
      setConsultations({
        express: { active: false, price: 0, time: 15, name: 'Express', icon: 1 },
        puntual: { active: false, price: 0, time: 30, name: 'Consulta puntual', icon: 2 },
        profunda: { active: false, price: 0, time: 60, name: 'Sesión profunda', icon: 3 }
      })
      return
    }

    try {
      const supabase = createClient()
      const { data: coach, error } = await supabase
        .from('coaches')
        .select('cafe, cafe_enabled, meet_30, meet_30_enabled, meet_1, meet_1_enabled')
        .eq('id', user.id)
        .single()

      if (error) {
        // Si hay error (probablemente columnas no existen), usar valores por defecto
        console.warn('⚠️ Error cargando consultas (columnas pueden no existir):', error.message)
        setConsultations({
          express: { active: false, price: 0, time: 15, name: 'Express', icon: 1 },
          puntual: { active: false, price: 0, time: 30, name: 'Consulta puntual', icon: 2 },
          profunda: { active: false, price: 0, time: 60, name: 'Sesión profunda', icon: 3 }
        })
        setCafeConsultation({ active: false, price: 0 })
        return
      }

      if (coach) {
        setConsultations({
          express: {
            active: coach.cafe_enabled || false,
            price: coach.cafe || 0,
            time: 15,
            name: 'Express',
            icon: 1
          },
          puntual: {
            active: coach.meet_30_enabled || false,
            price: coach.meet_30 || 0,
            time: 30,
            name: 'Consulta puntual',
            icon: 2
          },
          profunda: {
            active: coach.meet_1_enabled || false,
            price: coach.meet_1 || 0,
            time: 60,
            name: 'Sesión profunda',
            icon: 3
          }
        })
        // Mantener compatibilidad con estado anterior
        setCafeConsultation({
          active: coach.cafe_enabled || false,
          price: coach.cafe || 0
        })
      }
    } catch (error) {
      console.error('Error cargando consultas:', error)
      // En caso de error, establecer valores por defecto
      setConsultations({
        express: { active: false, price: 0, time: 15, name: 'Express', icon: 1 },
        puntual: { active: false, price: 0, time: 30, name: 'Consulta puntual', icon: 2 },
        profunda: { active: false, price: 0, time: 60, name: 'Sesión profunda', icon: 3 }
      })
      setCafeConsultation({ active: false, price: 0 })
    }
  }, [user?.id])

  // Cargar/derivar estadísticas del coach a partir de los productos obtenidos
  const fetchStats = useCallback(async () => {
    // Derivar desde la lista de productos ya cargada
    setStats(prev => {
      const totalProducts = products.length
      const ratings = products
        .map((p: any) => (typeof p.program_rating === 'number' ? p.program_rating : null))
        .filter((v: number | null): v is number => v !== null)
      const totalReviews = products
        .map((p: any) => (typeof p.total_program_reviews === 'number' ? p.total_program_reviews : 0))
        .reduce((a, b) => a + b, 0)
      const avgRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0
      // Ingresos/ventas reales requieren endpoints; dejar 0 hasta conectar API
      return {
        totalProducts,
        totalRevenue: 0,
        avgRating,
        totalReviews,
        totalEnrollments: prev.totalEnrollments || 0,
        totalSales: prev.totalSales || 0
      }
    })
  }, [products])

  // Guardar consulta de café del coach en Supabase
  // NOTA: API eliminada - función deshabilitada
  const saveCafeConsultation = async () => {
    // API eliminada - no se puede guardar
    console.warn('⚠️ API de consultas eliminada - no se puede guardar')
  }

  // Usar refs para mantener referencias estables a las funciones
  const fetchProductsRef = useRef(fetchProducts)
  const fetchCafeConsultationRef = useRef(fetchCafeConsultation)
  const fetchStatsRef = useRef(fetchStats)
  
  // Actualizar refs cuando las funciones cambian
  useEffect(() => {
    fetchProductsRef.current = fetchProducts
    fetchCafeConsultationRef.current = fetchCafeConsultation
    fetchStatsRef.current = fetchStats
  }, [fetchProducts, fetchCafeConsultation, fetchStats])
  
  useEffect(() => {
    // Cargar datos de forma secuencial para evitar sobrecarga
    const loadData = async () => {
      try {
        // Esperar un poco para que la autenticación se complete
        await new Promise(resolve => setTimeout(resolve, 1000))
        await fetchProductsRef.current()
        await fetchCafeConsultationRef.current()
        await fetchStatsRef.current()
      } catch (error) {
        console.error('Error cargando datos iniciales:', error)
      }
    }
    
    loadData()
    
    // Escuchar eventos de producto creado
    const handleProductCreated = (event: CustomEvent) => {
      console.log('📦 Evento productCreated recibido')
      fetchProductsRef.current() // Recargar productos
    }
    
    // Escuchar eventos de producto actualizado (solo cuando realmente se necesita)
    const handleProductUpdated = (event: CustomEvent) => {
      const { productId } = event.detail
      console.log('🔄 Evento productUpdated recibido para producto:', productId)
      // Solo recargar si no es un cambio de pausa (eso se maneja con productPauseChanged)
      // No recargamos aquí para evitar loops, solo actualizamos estadísticas
    }
    
    // Escuchar eventos de cambio de pausa (más rápido, solo actualiza el estado)
    const handleProductPauseChanged = (event: CustomEvent) => {
      const { productId, is_paused } = event.detail
      console.log('🔄 Actualizando estado de pausa del producto:', { productId, is_paused })
      
      // Actualizar el producto en la lista sin recargar todo
      setProducts(prevProducts => 
        prevProducts.map(p => 
          p.id === productId ? { ...p, is_paused } : p
        )
      )
      
      // Actualizar el producto seleccionado si es el mismo (usando función de actualización)
      setSelectedProduct(prev => {
        if (prev && prev.id === productId) {
          return { ...prev, is_paused }
        }
        return prev
      })
    }
    
    window.addEventListener('productCreated', handleProductCreated as EventListener)
    window.addEventListener('productUpdated', handleProductUpdated as EventListener)
    window.addEventListener('productPauseChanged', handleProductPauseChanged as EventListener)
    
    return () => {
      window.removeEventListener('productCreated', handleProductCreated as EventListener)
      window.removeEventListener('productUpdated', handleProductUpdated as EventListener)
      window.removeEventListener('productPauseChanged', handleProductPauseChanged as EventListener)
    }
  }, []) // Solo se ejecuta una vez al montar el componente

  const handleOpenModal = useCallback(() => {
    setEditingProduct(null) // Limpiar cualquier producto en edición
    setIsModalOpen(true)
  }, [])

  // Funciones para manejar las 3 consultas
  const toggleConsultation = async (type: 'express' | 'puntual' | 'profunda') => {
    if (isTogglingConsultation) return
    
    setIsTogglingConsultation(type)
    setConsultationError(null)
    
    const currentState = consultations[type].active
    const newState = !currentState

    // Validar: no se puede activar si el precio es 0
    if (newState && consultations[type].price === 0) {
      setConsultationError('Configura un precio mayor a 0 para activar la consulta')
      setIsTogglingConsultation(null)
      return
    }

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      let updateField = ''
      let enabledField = ''
      if (type === 'express') {
        updateField = 'cafe'
        enabledField = 'cafe_enabled'
      } else if (type === 'puntual') {
        updateField = 'meet_30'
        enabledField = 'meet_30_enabled'
      } else {
        updateField = 'meet_1'
        enabledField = 'meet_1_enabled'
      }

      const { error } = await supabase
        .from('coaches')
        .update({ [enabledField]: newState })
        .eq('id', user.id)

      if (!error) {
        setConsultations(prev => ({
          ...prev,
          [type]: { ...prev[type], active: newState }
        }))
        // Limpiar error al desactivar
        if (!newState) {
          setConsultationError(null)
        }
        toast.success(newState ? `${consultations[type].name} activada` : `${consultations[type].name} desactivada`)
      }
    } catch (error) {
      console.error('Error actualizando consulta:', error)
      toast.error('Error al actualizar')
    } finally {
      setIsTogglingConsultation(null)
    }
  }

  const updateConsultationPrice = async (type: 'express' | 'puntual' | 'profunda', price: number) => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      let updateField = ''
      if (type === 'express') {
        updateField = 'cafe'
      } else if (type === 'puntual') {
        updateField = 'meet_30'
      } else {
        updateField = 'meet_1'
      }

      const { error } = await supabase
        .from('coaches')
        .update({ [updateField]: price })
        .eq('id', user.id)

      if (!error) {
        setConsultations(prev => ({
          ...prev,
          [type]: { ...prev[type], price }
        }))
        toast.success('Precio actualizado')
      }
    } catch (error) {
      console.error('Error actualizando precio:', error)
      toast.error('Error al actualizar precio')
    }
  }

  // Mantener función anterior para compatibilidad
  const toggleCafeConsultation = async () => {
    if (isTogglingCafe) return // Evitar múltiples clics
    
    console.log('🔄 toggleCafeConsultation llamado', { userId: user?.id, currentState: cafeConsultation.active })
    
    if (!user?.id) {
      console.error('❌ No hay usuario autenticado')
      alert('No estás autenticado. Por favor, inicia sesión.')
      return
    }

    setIsTogglingCafe(true)
    const newActiveState = !cafeConsultation.active
    console.log('🔄 Nuevo estado:', newActiveState)
    
    // Optimistic update
    setCafeConsultation(prev => ({
      ...prev,
      active: newActiveState
    }))

    try {
      console.log('📡 Enviando request a /api/coach/cafe', { enabled: newActiveState })
      const response = await fetch('/api/coach/cafe', {
        method: 'PUT',
        credentials: 'include', // ✅ Incluir cookies en la petición
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          enabled: newActiveState
        })
      })

      console.log('📡 Respuesta recibida:', { ok: response.ok, status: response.status })

      if (!response.ok) {
        const error = await response.json()
        console.error('❌ Error actualizando café:', error)
        // Revertir cambio si falla
        setCafeConsultation(prev => ({
          ...prev,
          active: !newActiveState
        }))
        alert(`Error al actualizar el estado del café: ${error.error || 'Error desconocido'}`)
      } else {
        const result = await response.json()
        console.log('✅ Café actualizado exitosamente:', result)
        // Actualizar con los datos del servidor para estar seguros
        if (result.success && result.cafe) {
          setCafeConsultation({
            active: result.cafe.enabled || false,
            price: result.cafe.price || cafeConsultation.price
          })
        }
      }
    } catch (error) {
      console.error('❌ Error en catch:', error)
      // Revertir cambio si falla
      setCafeConsultation(prev => ({
        ...prev,
        active: !newActiveState
      }))
      alert(`Error al actualizar el estado del café: ${error instanceof Error ? error.message : 'Error desconocido'}`)
    } finally {
      setIsTogglingCafe(false)
    }
  }

  const updateCafeConsultationPrice = async (price: number) => {
    if (!user?.id) return

    // Optimistic update
    setCafeConsultation(prev => ({
      ...prev,
        price: price
    }))

    try {
      const response = await fetch('/api/coach/cafe', {
        method: 'PUT',
        credentials: 'include', // ✅ Incluir cookies en la petición
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          price: price
        })
      })

      if (!response.ok) {
        // Revertir cambio si falla
        const error = await response.json()
        console.error('Error actualizando precio del café:', error)
        alert('Error al actualizar el precio del café')
      }
    } catch (error) {
      console.error('Error actualizando precio del café:', error)
      alert('Error al actualizar el precio del café')
    }
  }

  const handleEditCafe = () => {
    // Abrir modal de edición para el café
    // Por ahora solo permitimos editar el precio desde la card
  }

  // Función para renderizar cada sección de consulta
  const renderConsultationSection = (type: 'express' | 'puntual' | 'profunda') => {
    const consultation = consultations[type]
    const sales = consultationSales[type]
    const isEditing = editingPrice === type
    const isToggling = isTogglingConsultation === type
    const totalSales = sales.length
    const totalIncome = sales.reduce((sum, sale) => sum + (sale.price || consultation.price), 0)

    return (
      <div key={type} className="py-3 border-b border-gray-700/30 last:border-b-0">
        {/* Header con icono, nombre y toggle */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2.5">
            {/* Icono silueta naranja */}
            {type === 'express' ? (
              <Zap className="w-5 h-5 text-[#FF7939]" strokeWidth={2} fill="none" />
            ) : type === 'puntual' ? (
              <MessageSquare className="w-5 h-5 text-[#FF7939]" strokeWidth={2} fill="none" />
            ) : (
              <Target className="w-5 h-5 text-[#FF7939]" strokeWidth={2} fill="none" />
            )}
            {/* Nombre y tiempo */}
            <div>
              <h4 className="text-white font-semibold text-sm leading-tight">{consultation.name}</h4>
              <p className="text-gray-400 text-xs">{consultation.time} min</p>
            </div>
          </div>
          
          {/* Toggle de activación */}
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              toggleConsultation(type)
            }}
            type="button"
            role="switch"
            aria-checked={consultation.active}
            disabled={isToggling}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-300 flex-shrink-0 ${
              consultation.active ? 'bg-[#FF7939]' : 'bg-gray-600'
            } ${isToggling ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ease-in-out ${
                consultation.active ? 'translate-x-4' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>

        {/* Precio, Ventas e Ingresos */}
        <div className="flex items-center justify-between mb-2 text-xs">
          <div className="flex items-center gap-4">
            <span className="text-gray-400">Ventas: <span className="text-white font-semibold">{totalSales}</span></span>
            <span className="text-gray-400">Ingresos: <span className="text-[#FF7939] font-semibold">${totalIncome}</span></span>
          </div>
          <div className="flex items-center gap-2">
            {isEditing ? (
              <div className="flex items-center gap-1">
                <span className="text-gray-400 text-base">$</span>
                <input
                  type="number"
                  value={consultation.price}
                  onChange={(e) => {
                    const newPrice = parseInt(e.target.value) || 0
                    setConsultations(prev => ({
                      ...prev,
                      [type]: { ...prev[type], price: newPrice }
                    }))
                  }}
                  className="bg-transparent border-none text-[#FF7939] font-bold text-lg focus:outline-none w-20 text-right"
                  placeholder="0"
                  min="0"
                  autoFocus
                  onBlur={() => {
                    updateConsultationPrice(type, consultation.price)
                    setEditingPrice(null)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      updateConsultationPrice(type, consultation.price)
                      setEditingPrice(null)
                    }
                  }}
                />
              </div>
            ) : (
              <>
                <div className="flex items-center gap-1">
                  <span className="text-gray-400 text-base">$</span>
                  <span className="text-[#FF7939] font-bold text-lg">{consultation.price}</span>
                </div>
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    if (consultation.active) {
                      setConsultationError('Desactiva la consulta para editar el precio')
                      // Limpiar el error después de 5 segundos
                      setTimeout(() => {
                        setConsultationError(null)
                      }, 5000)
                    } else {
                      setEditingPrice(type)
                      setConsultationError(null)
                    }
                  }}
                  className={`text-gray-400 hover:text-[#FF7939] transition-colors ${consultation.active ? 'cursor-not-allowed opacity-50' : ''}`}
                  title={consultation.active ? "Desactiva la consulta para editar el precio" : "Editar precio"}
                >
                  <Edit className="w-3 h-3" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Lista de ventas */}
        {totalSales > 0 && (
          <div className="mt-2 pt-2 border-t border-gray-700/30 max-h-24 overflow-y-auto">
            <div className="space-y-1.5">
              {sales.map((sale, index) => (
                <div key={index} className="flex items-center justify-between text-xs">
                  <div>
                    <p className="text-white">{sale.userName || 'Cliente'}</p>
                    <p className="text-gray-400">{consultation.name}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleWhatsAppClick(sale)}
                      className="p-1 hover:bg-green-500/10 rounded transition-colors"
                      title="WhatsApp"
                    >
                      <MessageCircle className="w-3 h-3 text-green-500" />
                    </button>
                    <button
                      onClick={() => handleMeetClick(sale)}
                      className="p-1 hover:bg-blue-500/10 rounded transition-colors"
                      title="Meet"
                    >
                      <Video className="w-3 h-3 text-blue-500" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  // Función para manejar clic en WhatsApp
  const handleWhatsAppClick = (sale: any) => {
    if (coachPhone) {
      const message = `Hola! Te contacto desde Omnia. ¿Podemos coordinar la consulta de café?`
      const whatsappUrl = `https://wa.me/${coachPhone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`
      window.open(whatsappUrl, '_blank')
    } else {
      alert('No se encontró el número de teléfono del coach')
    }
  }

  // Función para manejar clic en Meet
  const handleMeetClick = (sale: any) => {
    setSelectedSaleForMeet(sale)
    setIsMeetModalOpen(true)
    setMeetSchedule({
      date: '',
      time1: '',
      time2: '',
      meetingName: `Consulta de Café con ${sale.userName || 'Cliente'}`
    })
  }

  // Función para enviar Meet
  const handleSendMeet = () => {
    if (!meetSchedule.date || !meetSchedule.time1 || !meetSchedule.time2) {
      alert('Por favor completa todos los campos')
      return
    }
    // Aquí se enviaría la información al cliente
    console.log('Enviando Meet:', {
      sale: selectedSaleForMeet,
      schedule: meetSchedule
    })
    // Por ahora solo cerramos el modal
    setIsMeetModalOpen(false)
    setSelectedSaleForMeet(null)
    setMeetSchedule({ date: '', time1: '', time2: '', meetingName: '' })
  }

  // Cargar teléfono del coach y ventas de café
  useEffect(() => {
    const loadCafeData = async () => {
      if (!user?.id || !isCafeModalOpen) return
      
      try {
        // Cargar teléfono del coach desde el endpoint combinado
        const coachResponse = await fetch(`/api/profile/combined`)
        if (coachResponse.ok) {
          const combinedData = await coachResponse.json()
          // El endpoint devuelve { profile: { phone, ... } }
          if (combinedData?.profile?.phone) {
            setCoachPhone(combinedData.profile.phone)
          }
        }

        // Cargar consultas pendientes
        const supabase = createClient()
        const { data: pendingEvents, error } = await supabase
          .from('calendar_events')
          .select(`
            id,
            title,
            start_time,
            end_time,
            consultation_type,
            status,
            client_id
          `)
          .eq('coach_id', user.id)
          .eq('event_type', 'consultation')
          .eq('status', 'scheduled')
          .gte('start_time', new Date().toISOString())
          .order('start_time', { ascending: true })

        if (!error && pendingEvents && pendingEvents.length > 0) {
          // Obtener nombres de clientes
          const clientIds = [...new Set(pendingEvents.map((e: any) => e.client_id).filter(Boolean))]
          const { data: profiles } = await supabase
            .from('user_profiles')
            .select('id, full_name, email')
            .in('id', clientIds)

          const profilesMap = new Map((profiles || []).map((p: any) => [p.id, p]))

          const formatted = pendingEvents.map((event: any) => {
            // Determinar tipo de consulta basado en la duración
            const duration = new Date(event.end_time).getTime() - new Date(event.start_time).getTime()
            const minutes = duration / (1000 * 60)
            let consultationType = 'Express'
            if (minutes <= 15) consultationType = 'Express'
            else if (minutes <= 30) consultationType = 'Consulta puntual'
            else consultationType = 'Sesión profunda'

            const profile = event.client_id ? profilesMap.get(event.client_id) : null

            return {
              id: event.id,
              clientName: (profile as any)?.full_name || (profile as any)?.email || 'Cliente',
              date: event.start_time,
              consultationType,
              duration: minutes
            }
          })
          setPendingConsultations(formatted)
        } else {
          setPendingConsultations([])
        }
      } catch (error) {
        console.error('Error cargando datos del café:', error)
      }
    }

    loadCafeData()
  }, [user?.id, isCafeModalOpen])

  const handleCloseModal = useCallback(async (saved: boolean = false) => {
    const editingProductId = editingProduct?.id
    const wasEditingWorkshop = editingProduct?.type === 'workshop'
    
    setIsModalOpen(false)
    
    // Solo recargar productos si se guardaron cambios
    if (saved) {
      await fetchProducts()
    }
    
    setEditingProduct(null)
    setShouldOpenWorkshopSchedule(false)
    setShouldShowDateChangeNoticeAfterStep5(false)
    setShowDateChangeNotice(false)
    
    // Si el modal de detalle estaba abierto antes de editar, reabrirlo
    if (wasPreviewOpenBeforeEdit && selectedProduct) {
      setIsProductModalOpen(true)
      setWasPreviewOpenBeforeEdit(false)
      
      // Si se guardaron cambios, actualizar el producto seleccionado
      if (saved) {
        setTimeout(() => {
          const updatedProduct = products.find(p => p.id === editingProductId)
          if (updatedProduct) {
            setSelectedProduct(updatedProduct)
          }
        }, 100)
      }
      return // No continuar con el resto de la lógica si volvemos al detalle
    }
    
    // IMPORTANTE: Si cerró sin guardar cambios, la encuesta ya completada NO debe aparecer de nuevo
    // El estado de completedCoachSurveys se mantiene para evitar que aparezca la encuesta en la misma sesión
    // La verificación en el backend también previene que aparezca (encuesta guardada con workshop_version)
    
    // Disparar evento de actualización después de un pequeño delay para que los productos se hayan recargado
    if (editingProductId && saved) {
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('productUpdated', { 
          detail: { productId: editingProductId } 
        }))
        
        // Actualizar el producto seleccionado si coincide con el editado
        if (selectedProduct && selectedProduct.id === editingProductId) {
          // Buscar el producto actualizado en la lista (products ya debería estar actualizado)
          setTimeout(() => {
            const updatedProduct = products.find(p => p.id === editingProductId)
            if (updatedProduct) {
              setSelectedProduct(updatedProduct)
            }
          }, 100)
        }
      }, 200)
    }
  }, [fetchProducts, editingProduct, selectedProduct, wasPreviewOpenBeforeEdit, products, products])

  // Mostrar el aviso después de 1 segundo cuando se abre el paso 5
  useEffect(() => {
    if (isModalOpen && shouldOpenWorkshopSchedule && shouldShowDateChangeNoticeAfterStep5 && editingProduct) {
      const timer = setTimeout(() => {
        setShowDateChangeNotice(true)
      }, 1000) // Esperar 1 segundo después de abrir el paso 5

      return () => {
        clearTimeout(timer)
      }
    }
  }, [isModalOpen, shouldOpenWorkshopSchedule, shouldShowDateChangeNoticeAfterStep5, editingProduct])

  const handlePreviewProduct = useCallback(async (product: Product) => {
    // Verificar si es un taller finalizado
    const isWorkshopFinished = product.type === 'workshop' && 
      ((product as any).is_finished === true || (product as any).taller_activo === false)
    
    console.log('🔍 handlePreviewProduct:', {
      productId: product.id,
      isWorkshopFinished,
      is_finished: (product as any).is_finished,
      taller_activo: (product as any).taller_activo,
      hasCachedSurvey: completedCoachSurveys[product.id]
    })
    
    if (isWorkshopFinished) {
      // Si ya sabemos que la encuesta fue completada en esta sesión, no volver a mostrarla
      if (completedCoachSurveys[product.id]) {
        console.log('✅ Encuesta ya completada (caché), abriendo detalle sin encuesta')
        setSelectedProduct(product)
        setIsProductModalOpen(true)
        // Asegurar que el modal de encuesta esté cerrado
        setShowSurveyModalInDetail(false)
        setSurveyModalProduct(null)
        return
      }

      // Verificar si ya tiene encuesta completada
      try {
        console.log('🔍 Verificando encuesta en backend para producto:', product.id)
        const response = await fetch(`/api/activities/${product.id}/check-coach-survey`)
        const result = await response.json()
        
        console.log('📥 Respuesta de check-coach-survey:', result)
        
        if (!result.success) {
          console.error('❌ Error en respuesta de check-coach-survey:', result.error)
          // En caso de error, mostrar el detalle sin encuesta
          setSelectedProduct(product)
          setIsProductModalOpen(true)
          setShowSurveyModalInDetail(false)
          setSurveyModalProduct(null)
          return
        }
        
        if (!result.hasSurvey) {
          console.log('⚠️ No tiene encuesta, mostrando encuesta cerrable')
          // No tiene encuesta, mostrar el detalle PERO con el modal de encuesta (cerrable)
          setSelectedProduct(product)
          setIsProductModalOpen(true)
          setSurveyModalProduct(product)
          setSurveyModalBlocking(false) // Cerrable
          setShowSurveyModalInDetail(true)
          setSurveySubmitted(false)
          setWorkshopRating(0)
          setWorkshopFeedback('')
          return
        }

        // Si el backend confirma que tiene encuesta, guardar en caché local y NO mostrar encuesta
        console.log('✅ Encuesta ya completada (backend), guardando en caché y abriendo detalle sin encuesta')
        setCompletedCoachSurveys((prev) => ({
          ...prev,
          [product.id]: true
        }))
        // Asegurar que el modal de encuesta esté cerrado
        setShowSurveyModalInDetail(false)
        setSurveyModalProduct(null)
      } catch (error) {
        console.error('❌ Error verificando encuesta:', error)
        // En caso de error, mostrar el detalle sin encuesta
        setSelectedProduct(product)
        setIsProductModalOpen(true)
        setShowSurveyModalInDetail(false)
        setSurveyModalProduct(null)
      }
    }
    
    // Preview normal o taller con encuesta ya completada
    console.log('📖 Abriendo detalle del producto (preview normal)')
    setSelectedProduct(product)
    setIsProductModalOpen(true)
    // Asegurar que el modal de encuesta esté cerrado si no es un taller finalizado
    if (!isWorkshopFinished) {
      setShowSurveyModalInDetail(false)
      setSurveyModalProduct(null)
    }
  }, [completedCoachSurveys])

  // Función para convertir Product a Activity para ActivityCard - Memoizada
  const convertProductToActivity = useCallback((product: Product) => {
    
    // Usar la misma lógica de imágenes que ActivityCard
    const getValidImageUrl = () => {
      // Intentar diferentes fuentes de imagen como en ActivityCard
      const imageUrl = product.image_url || 
                      product.media?.image_url || 
                      product.activity_media?.[0]?.image_url
      
      if (imageUrl && !imageUrl.includes('via.placeholder.com') && !imageUrl.includes('placeholder.svg') && imageUrl.trim() !== '') {
        return imageUrl
      }
      
      // Si no hay imagen real, devolver null para mostrar logo de Omnia
      return null
    }

    return {
      id: product.id.toString(),
      title: product.title,
      description: product.description,
      price: product.price,
      type: product.type,
      difficulty: product.difficulty,
      coach_name: "Franco Pomati coach", // Nombre real del coach desde la base de datos
      coach_rating: null, // Sin rating inicial
      coach_avatar_url: "/placeholder.svg?height=24&width=24&query=coach",
      // Usar la misma estructura de imágenes que ActivityCard
      media: {
        image_url: getValidImageUrl()
      },
      activity_media: [{
        image_url: getValidImageUrl(),
        video_url: (() => {
          const videoUrl = product.activity_media?.[0]?.video_url || 
                          product.media?.video_url || 
                          product.video_url || 
                          null
          return videoUrl
        })()
      }],
      image_url: getValidImageUrl(), // También como campo directo
      program_info: {
        program_duration: product.type === 'program' ? '8' : undefined,
        duration: product.type === 'workshop' ? '60' : undefined
      },
      consultation_info: null,
      exercisesCount: (product as any).exercisesCount || 0, // ✅ Usar valor del producto desde la API
      totalSessions: (product as any).totalSessions || 0, // ✅ Usar valor del producto desde la API
      capacity: product.capacity || null,
      // Para talleres: estado 'activo' desde taller_detalles
      taller_activo: (product as any).taller_activo, // ✅ Agregar capacity para mostrar en ActivityCard
      modality: product.modality || 'online',
      included_meet_credits: (product as any).included_meet_credits,
      // ✅ Campos de ubicación para modalidad presencial
      location_name: (product as any).location_name || null,
      location_url: (product as any).location_url || null,
      workshop_type: product.type === 'workshop' ? 'Individual' : undefined,
      sessions_per_client: product.sessions_per_client,
      // Campos de rating usando los datos reales del producto
      program_rating: product.program_rating || 0,
      total_program_reviews: product.total_program_reviews || 0,
      // Campos adicionales requeridos por Activity
      coach_id: product.coach_id || user?.id || '', // Usar user.id como fallback
      is_public: product.is_public,
      categoria: product.categoria || 'fitness', // ✅ Agregar categoria con valor por defecto
      created_at: product.created_at,
      updated_at: product.updated_at,
      tags: [],
      video_url: null,
      vimeo_id: null,
      pdf_url: null,
      rich_description: null,
      duration_minutes: null,
      calories_info: null,
      program_duration_weeks_months: null,
      includes_videocall: null,
      includes_message: null,
      videocall_duration: null,
      available_days: null,
      available_hours: null,
      expiration_date: null,
      is_popular: false,
      total_coach_reviews: 0,
      // ✅ AGREGAR OBJETIVOS desde el producto
      objetivos: product.objetivos || [],
      // ✅ AGREGAR is_paused desde el producto
      is_paused: product.is_paused || false,
      // ✅ AGREGAR workshop_mode y participants_per_class desde el producto
      workshop_mode: (product as any).workshop_mode || (product.type === 'workshop' ? 'grupal' : undefined),
      participants_per_class: (product as any).participants_per_class || null
    }
  }, [])

  const handleEditProduct = useCallback(async (product: Product) => {
    // Guardar si el modal de detalle estaba abierto antes de abrir el modal de edición
    if (isProductModalOpen && selectedProduct?.id === product.id) {
      setWasPreviewOpenBeforeEdit(true)
    } else {
      setWasPreviewOpenBeforeEdit(false)
    }
    
    // Verificar si es un taller finalizado
    // Puede estar finalizado si: is_finished === true O taller_activo === false
    const isWorkshopFinished = product.type === 'workshop' && 
      ((product as any).is_finished === true || (product as any).taller_activo === false)
    
    if (isWorkshopFinished) {
      // Si ya sabemos que la encuesta fue completada en esta sesión, permitir editar directamente
      if (completedCoachSurveys[product.id]) {
        // Ya tiene encuesta para esta versión, permitir editar directamente
        setEditingProduct(product)
        setIsModalOpen(true)
        setShouldOpenWorkshopSchedule(false)
        setShouldShowDateChangeNoticeAfterStep5(false)
        return
      }

      // Verificar si ya tiene encuesta completada para la versión actual
      try {
        const response = await fetch(`/api/activities/${product.id}/check-coach-survey`)
        const result = await response.json()
        
        if (result.hasSurvey) {
          // Ya tiene encuesta para esta versión, permitir editar directamente
          // Guardar en caché local para no depender solo del backend
          setCompletedCoachSurveys((prev) => ({
            ...prev,
            [product.id]: true
          }))
          // Permitir editar directamente sin mostrar encuesta
          setEditingProduct(product)
          setIsModalOpen(true)
          setShouldOpenWorkshopSchedule(false)
          setShouldShowDateChangeNoticeAfterStep5(false)
        } else {
          // No tiene encuesta, mostrar modal de encuesta BLOQUEANTE (no se puede cerrar hasta completarla)
          setSurveyModalProduct(product)
          setSurveyModalBlocking(true) // Bloqueante
          setShowSurveyModalInDetail(true)
          setSurveySubmitted(false)
          setWorkshopRating(0)
          setWorkshopFeedback('')
        }
      } catch (error) {
        console.error('Error verificando encuesta:', error)
        // Por defecto, mostrar modal de encuesta bloqueante
        setSurveyModalProduct(product)
        setSurveyModalBlocking(true)
        setShowSurveyModalInDetail(true)
        setSurveySubmitted(false)
      }
    } else {
      // Edición normal (taller no finalizado o no es taller)
      setEditingProduct(product)
      setIsModalOpen(true)
      setShouldOpenWorkshopSchedule(false)
      setShouldShowDateChangeNoticeAfterStep5(false)
    }
  }, [completedCoachSurveys])

  const handleDeleteProduct = useCallback(async (product: Product) => {
    setProductToDelete(product)
    setDeleteConfirmationOpen(true)
  }, [])

  // Función para confirmar eliminación
  const confirmDelete = useCallback(async () => {
    console.log('🗑️ CONFIRM DELETE: Iniciando eliminación...')
    console.log('🗑️ CONFIRM DELETE: productToDelete:', productToDelete)
    console.log('🗑️ CONFIRM DELETE: isDeleting:', isDeleting)
    
    if (!productToDelete) {
      console.log('❌ CONFIRM DELETE: No hay producto para eliminar')
      return
    }

    if (isDeleting) {
      console.log('⚠️ CONFIRM DELETE: Ya se está procesando una eliminación')
      return
    }

    // CERRAR MODAL INMEDIATAMENTE - SIN AWAIT
    console.log('🚪 CONFIRM DELETE: Cerrando modal inmediatamente')
    setDeleteConfirmationOpen(false)
    setProductToDelete(null)
    setIsDeleting(true)
    
    // Guardar datos del producto antes de eliminarlo
    const productToDeleteData = { ...productToDelete }
    
    // Eliminar del estado INMEDIATAMENTE para que desaparezca de la UI
    setProducts(prevProducts => {
      console.log('📝 CONFIRM DELETE: Eliminando producto inmediatamente del estado')
      console.log('📝 CONFIRM DELETE: Productos antes del filtro:', prevProducts.length)
      console.log('📝 CONFIRM DELETE: ID a eliminar:', productToDeleteData.id)
      
      const newProducts = prevProducts.filter(p => String(p.id) !== String(productToDeleteData.id))
      
      console.log('📝 CONFIRM DELETE: Productos después del filtro:', newProducts.length)
      return newProducts
    })

    // Ejecutar eliminación en segundo plano
    setTimeout(async () => {
      try {
        console.log('🌐 CONFIRM DELETE: Enviando request a API...')
        const response = await fetch(`/api/delete-activity-final?id=${productToDeleteData.id}`, {
          method: 'DELETE',
        })

        console.log('📡 CONFIRM DELETE: Respuesta recibida:', {
          ok: response.ok,
          status: response.status,
          statusText: response.statusText
        })

        if (response.ok) {
          console.log('✅ CONFIRM DELETE: Eliminación exitosa en backend')
          
          // Guardar nombre del producto eliminado para el modal de éxito
          setDeletedProductName(productToDeleteData.title)
          
          // Mostrar modal de éxito
          setDeleteSuccessOpen(true)
          
          console.log('🎉 CONFIRM DELETE: Modal de éxito mostrado')
        } else {
          const result = await response.json()
          console.log('❌ CONFIRM DELETE: Error en respuesta:', result)
          
          // Si hay error, revertir la eliminación del estado
          setProducts(prevProducts => {
            console.log('🔄 CONFIRM DELETE: Revirtiendo eliminación del estado')
            return [...prevProducts, productToDeleteData]
          })
          
          // TODO: Mostrar toast de error
          // toast({ title: `Error al eliminar: ${result.error}`, variant: "destructive" })
        }
      } catch (error) {
        console.error('❌ CONFIRM DELETE: Error eliminando producto:', error)
        
        // Si hay error, revertir la eliminación del estado
        setProducts(prevProducts => {
          console.log('🔄 CONFIRM DELETE: Revirtiendo eliminación del estado por error')
          return [...prevProducts, productToDeleteData]
        })
        
        // TODO: Mostrar toast de error
        // toast({ title: "Error al eliminar el producto", variant: "destructive" })
      } finally {
        // Marcar que terminamos de eliminar
        setIsDeleting(false)
      }
    }, 100) // Pequeño delay para asegurar que el modal se cierre
  }, [productToDelete, isDeleting])

  // Función para cancelar eliminación
  const cancelDelete = useCallback(() => {
    console.log('❌ CANCEL DELETE: Cancelando eliminación')
    setDeleteConfirmationOpen(false)
    setProductToDelete(null)
    setIsDeleting(false)
  }, [])

  // Función para cerrar modal de éxito
  const closeDeleteSuccess = useCallback(() => {
    setDeleteSuccessOpen(false)
    setDeletedProductName('')
    setIsDeleting(false)
    localStorage.setItem('activeTab', 'products-management')
    fetchProducts()
  }, [fetchProducts])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="h-3 w-3" />
    return sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
  }

  // Memoizar productos filtrados
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      if (typeFilter !== 'todos' && product.type !== typeFilter) return false
      return true
    })
  }, [products, typeFilter])

  // Memoizar productos ordenados
  const sortedProducts = useMemo(() => {
    return [...filteredProducts].sort((a, b) => {
      const aValue = a[sortField]
      const bValue = b[sortField]
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue)
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue
      }
      
      return 0
    })
  }, [filteredProducts, sortField, sortDirection])

  // Estadísticas reales desde la API
  const totalRevenue = stats.totalRevenue
  const totalProducts = stats.totalProducts
  const avgRating = stats.avgRating

  // Estadísticas por tipo
  const typeStats = {
    fitness: {
      count: products.filter(p => p.type === 'fitness').length,
      avgPrice: products.filter(p => p.type === 'fitness').length > 0 
        ? products.filter(p => p.type === 'fitness').reduce((sum, p) => sum + p.price, 0) / products.filter(p => p.type === 'fitness').length 
        : 0
    },
    nutrition: {
      count: products.filter(p => p.type === 'nutrition').length,
      avgPrice: products.filter(p => p.type === 'nutrition').length > 0 
        ? products.filter(p => p.type === 'nutrition').reduce((sum, p) => sum + p.price, 0) / products.filter(p => p.type === 'nutrition').length 
        : 0
    },
    workshop: {
      count: products.filter(p => p.type === 'workshop').length,
      avgPrice: products.filter(p => p.type === 'workshop').length > 0 
        ? products.filter(p => p.type === 'workshop').reduce((sum, p) => sum + p.price, 0) / products.filter(p => p.type === 'workshop').length 
        : 0
    },
    document: {
      count: products.filter(p => p.type === 'document').length,
      avgPrice: products.filter(p => p.type === 'document').length > 0 
        ? products.filter(p => p.type === 'document').reduce((sum, p) => sum + p.price, 0) / products.filter(p => p.type === 'document').length 
        : 0
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'fitness': return 'bg-orange-500'
      case 'nutrition': return 'bg-green-500'
      case 'workshop': return 'bg-purple-500'
      case 'document': return 'bg-violet-500'
      case 'program': return 'bg-indigo-500'
      default: return 'bg-gray-500'
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'fitness': return 'Fitness'
      case 'nutrition': return 'Nutrición'
      case 'workshop': return 'Taller'
      case 'document': return 'Documento'
      case 'program': return 'Programa'
      default: return type
    }
  }

  const getCategoryColor = (categoria: string) => {
    // Para la categoría, solo mostramos Fitness o Nutrición
    switch (categoria) {
      case 'fitness':
        return 'bg-orange-500'
      case 'nutrition':
        return 'bg-green-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getCategoryLabel = (categoria: string) => {
    // Para la categoría, solo mostramos Fitness o Nutrición
    switch (categoria) {
      case 'fitness':
        return 'Fitness'
      case 'nutrition':
        return 'Nutrición'
      default:
        return 'Otro'
    }
  }

    return (
      <div className="min-h-screen bg-[#0A0A0A] p-4">

      {/* Contenido principal */}
      <div>
        {/* Header con tabs */}
          <div className="mt-8 mb-10">
            {/* Tabs principales - Estilo sutil, menú centrado y botón Crear a la derecha */}
            <div className="flex items-center justify-between mb-4 relative">
              {/* Menú centrado absolutamente */}
              <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center gap-6">
            <button
              onClick={() => setActiveMainTab('products')}
                  className={`text-sm transition-all ${
                activeMainTab === 'products'
                      ? 'text-[#FF7939] font-medium'
                      : 'text-gray-500 hover:text-gray-400'
              }`}
            >
                  Productos
            </button>
            <button
              onClick={() => setActiveMainTab('exercises')}
                  className={`text-sm transition-all ${
                activeMainTab === 'exercises'
                      ? 'text-[#FF7939] font-medium'
                      : 'text-gray-500 hover:text-gray-400'
              }`}
            >
                  Ejercicios/Platos
            </button>
            <button
              onClick={() => setActiveMainTab('storage')}
                  className={`text-sm transition-all ${
                activeMainTab === 'storage'
                      ? 'text-[#FF7939] font-medium'
                      : 'text-gray-500 hover:text-gray-400'
              }`}
            >
              Almacenamiento
            </button>
              </div>
          </div>
        </div>

        {/* Contenido según tab activo */}
        {activeMainTab === 'products' && (
          <div className="bg-[#0F0F0F] rounded-2xl border border-[#1A1A1A] overflow-hidden">
            {/* Header de tabla con filtros */}
            <div className="p-4 border-b border-[#1A1A1A]">
              <div className="flex flex-col space-y-3">
                <div className="flex items-center justify-between relative">
                  {/* Dropdown de categoría a la izquierda */}
                  <div className="relative">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowTypeDropdown(!showTypeDropdown)}
                      className="border-[#1A1A1A] text-gray-400 hover:text-white rounded-full px-3 py-1 text-xs"
                    >
                      {typeFilter === 'todos' ? 'Todos' : typeFilter}
                      <ChevronDown className="h-3 w-3 ml-1" />
                    </Button>
                    
                    {showTypeDropdown && (
                      <div className="absolute left-0 top-full mt-2 bg-[#0F0F0F] border border-[#1A1A1A] rounded-xl shadow-lg z-10 min-w-[150px]">
                        <div className="p-2">
                          <button
                            onClick={() => { setTypeFilter('todos'); setShowTypeDropdown(false); }}
                            className="w-full text-left px-3 py-2 rounded-lg hover:bg-[#1A1A1A] text-gray-400 hover:text-white transition-colors text-sm"
                          >
                            Todos
                          </button>
                          <button
                            onClick={() => { setTypeFilter('fitness'); setShowTypeDropdown(false); }}
                            className="w-full text-left px-3 py-2 rounded-lg hover:bg-[#1A1A1A] text-gray-400 hover:text-white transition-colors text-sm"
                          >
                            Fitness
                          </button>
                          <button
                            onClick={() => { setTypeFilter('nutrition'); setShowTypeDropdown(false); }}
                            className="w-full text-left px-3 py-2 rounded-lg hover:bg-[#1A1A1A] text-gray-400 hover:text-white transition-colors text-sm"
                          >
                            Nutrición
                          </button>
                          <button
                            onClick={() => { setTypeFilter('program'); setShowTypeDropdown(false); }}
                            className="w-full text-left px-3 py-2 rounded-lg hover:bg-[#1A1A1A] text-gray-400 hover:text-white transition-colors text-sm"
                          >
                            Programa
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Icono de Café centrado y Botón Crear */}
                  <div className="absolute left-1/2 transform -translate-x-1/2">
                    <button
                      onClick={() => setIsCafeModalOpen((prev) => !prev)}
                      className="relative w-10 h-10 rounded-full flex items-center justify-center bg-transparent border-2 transition-all duration-200 hover:bg-[#0A0A0A]/50"
                      style={{
                        borderColor:
                          consultations.express.active ||
                          consultations.puntual.active ||
                          consultations.profunda.active
                            ? '#FF7939'
                            : '#4B5563',
                      }}
                    >
                      <Coffee
                        className="h-5 w-5 transition-colors duration-200"
                        style={{
                          color:
                            consultations.express.active ||
                            consultations.puntual.active ||
                            consultations.profunda.active
                              ? '#FF7939'
                              : '#9CA3AF',
                        }}
                      />
                      {(consultationSales.express.length +
                        consultationSales.puntual.length +
                        consultationSales.profunda.length) > 0 && (
                        <span className="absolute -top-1 -right-1 bg-[#FF7939] text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                          {consultationSales.express.length +
                            consultationSales.puntual.length +
                            consultationSales.profunda.length >
                          9
                            ? '9+'
                            : consultationSales.express.length +
                              consultationSales.puntual.length +
                              consultationSales.profunda.length}
                        </span>
                      )}
                    </button>
                  </div>
                  
                  {/* Botón Crear a la derecha */}
                  <div className="ml-auto">
                    <Button
                      className="bg-[#FF7939] hover:bg-[#E66829] text-white px-2.5 py-1 rounded-lg font-bold text-xs shadow-md hover:shadow-[#FF7939]/25 transition-all duración-200"
                      onClick={handleOpenModal}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Crear
                    </Button>
                  </div>
                </div>

                {/* Vista de Consultas (Meet con el coach) inline, debajo del header */}
                {isCafeModalOpen && (
                  <div className="mt-4 rounded-2xl border border-[#1A1A1A] bg-[#050505] p-4 space-y-4">
                    {/* Header inline de consultas */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Coffee className="w-5 h-5 text-[#FF7939]" />
                        <h3 className="text-white font-semibold text-sm">
                          Consultas / Meets con el coach
                        </h3>
                      </div>
                      <button
                        onClick={() => {
                          setIsCafeModalOpen(false)
                          setConsultationError(null)
                        }}
                        className="text-gray-400 hover:text-white transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Mensaje de error */}
                    {consultationError && (
                      <div className="mb-2 px-3 py-2 bg-[#FF7939]/10 border border-[#FF7939]/30 rounded-lg">
                        <p className="text-[#FF7939] text-xs text-center font-medium">
                          {consultationError}
                        </p>
                      </div>
                    )}

                    {/* Secciones de consultas (las 3 opciones configurables) */}
                    <div className="space-y-2">
                      {renderConsultationSection('express')}
                      {renderConsultationSection('puntual')}
                      {renderConsultationSection('profunda')}
                    </div>

                    {/* Consultas pendientes (si hay) */}
                    {pendingConsultations.length > 0 && (
                      <div className="pt-4 border-t border-gray-700/30">
                        <h4 className="text-white font-semibold text-xs mb-3">
                          Consultas pendientes
                        </h4>
                        <div className="space-y-2">
                          {pendingConsultations.map((consultation) => {
                            const date = new Date(consultation.date)
                            const formattedDate = date.toLocaleDateString('es-ES', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                            })
                            const formattedTime = date.toLocaleTimeString('es-ES', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })

                            return (
                              <div
                                key={consultation.id}
                                className="flex items-center justify-between py-2 border-b border-gray-700/20 last:border-b-0"
                              >
                                <div className="flex-1">
                                  <p className="text-white font-medium text-xs">
                                    {consultation.clientName}
                                  </p>
                                  <p className="text-gray-400 text-[11px] mt-0.5">
                                    {formattedDate} - {formattedTime}
                                  </p>
                                  <p className="text-gray-500 text-[11px] mt-0.5">
                                    {consultation.consultationType}
                                  </p>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            {/* Lista de productos */}
            <div className="space-y-2">
              {/* Productos - Formato de cards horizontales */}
              {loading ? (
                <div className="p-6 text-center">
                  <div className="text-gray-400 text-sm">Cargando productos...</div>
                </div>
              ) : sortedProducts.length === 0 ? (
                <div className="p-6 text-center">
                  <div className="text-gray-400 text-sm">No hay productos creados aún</div>
                </div>
              ) : (
                <div className="overflow-x-auto pb-2">
                  <div className="flex -space-x-4" style={{ minWidth: 'min-content' }}>
                    {/* Productos */}
                    {sortedProducts.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        onEdit={handleEditProduct}
                        onPreview={handlePreviewProduct}
                        onDelete={handleDeleteProduct}
                        convertProductToActivity={convertProductToActivity}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeMainTab === 'exercises' && (
          <>
            {/* Sub-tabs: Fitness / Nutrición - Centrados y más separados */}
            <div className="flex items-center justify-center gap-8 mb-6">
              <button
                onClick={() => setActiveSubTab('fitness')}
                className={`text-base transition-all px-4 py-2 ${
                  activeSubTab === 'fitness'
                    ? 'text-[#FF7939] font-medium'
                    : 'text-gray-500 hover:text-gray-400'
                }`}
              >
                Fitness
              </button>
              <button
                onClick={() => setActiveSubTab('nutrition')}
                className={`text-base transition-all px-4 py-2 ${
                  activeSubTab === 'nutrition'
                    ? 'text-[#FF7939] font-medium'
                    : 'text-gray-500 hover:text-gray-400'
                }`}
              >
                Nutrición
              </button>
            </div>
            <div key={activeSubTab}>
              <CSVManagerEnhanced
                activityId={0}
                coachId={user?.id || ""}
                productCategory={activeSubTab === 'fitness' ? 'fitness' : 'nutricion'}
                onSuccess={() => {
                  console.log('Ejercicios/platos actualizados exitosamente')
                }}
              />
            </div>
          </>
        )}

        {activeMainTab === 'storage' && (
            <StorageUsageWidget />
        )}
      </div>

      {/* Modal placeholder */}
      {isModalOpen && (
        <CreateProductModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          editingProduct={editingProduct}
          initialStep={shouldOpenWorkshopSchedule ? 'workshopSchedule' : undefined}
          showDateChangeNotice={shouldShowDateChangeNoticeAfterStep5}
        />
      )}

      {/* Modal de confirmación para reiniciar taller - SOLO si ya tiene encuesta */}
      {isWorkshopRestartModalOpen && workshopToRestart && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setIsWorkshopRestartModalOpen(false)}>
          <div className="bg-[#0A0A0A] rounded-2xl p-6 max-w-md w-full border border-[#1A1A1A] shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-col items-center text-center">
              <h3 className="text-white font-semibold text-lg mb-4">Reiniciar taller con nuevas fechas</h3>
              <p className="text-gray-400 text-sm mb-6">
                Este taller ha finalizado. ¿Quieres reiniciarlo y agregar nuevas fechas?
              </p>
              <div className="flex gap-3 w-full">
                <Button
                  onClick={() => {
                    setIsWorkshopRestartModalOpen(false)
                    // Abrir el detalle de la actividad para poder editarla normalmente
                    const workshop = workshopToRestart
                    setWorkshopToRestart(null)
                    setSelectedProduct(workshop)
                    setIsProductModalOpen(true)
                  }}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={() => {
                    setIsWorkshopRestartModalOpen(false)
                    // Abrir el modal de edición directamente en el paso 5
                    const workshop = workshopToRestart
                    setEditingProduct(workshop)
                    setShouldOpenWorkshopSchedule(true)
                    setShouldShowDateChangeNoticeAfterStep5(true)
                    setIsModalOpen(true)
                    setWorkshopToRestart(null)
                  }}
                  className="flex-1 bg-[#FF7939] hover:bg-[#E66829] text-white py-2 rounded-lg"
                >
                  Ir
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* Product Modal - Usando el mismo modal que el cliente */}
      {selectedProduct && (
        <ClientProductModal
          isOpen={isProductModalOpen}
          onClose={async () => {
            // Cerrar también el modal de encuesta si está abierto
            setShowSurveyModalInDetail(false)
            setSurveyModalProduct(null)
            
            // Refrescar el producto desde la API antes de cerrar
            try {
              console.log('🔄 Refrescando producto al cerrar modal:', selectedProduct.id)
              const response = await fetch(API_ENDPOINTS.PRODUCTS, {
                credentials: 'include' // ✅ Incluir cookies en la petición
              })
              if (response.ok) {
                const result = await response.json()
                if (result.success && result.products && result.products.length > 0) {
                  // Buscar el producto actualizado en la lista
                  const refreshedProduct = result.products.find((p: Product) => p.id === selectedProduct.id)
                  if (refreshedProduct) {
                    console.log('✅ Producto refrescado:', {
                      id: refreshedProduct.id,
                      is_paused: refreshedProduct.is_paused,
                      old_is_paused: selectedProduct.is_paused
                    })
                    
                    // Actualizar el producto en la lista
                    setProducts(prevProducts => 
                      prevProducts.map(p => 
                        p.id === refreshedProduct.id ? refreshedProduct : p
                      )
                    )
                  }
                }
              }
            } catch (error) {
              console.error('❌ Error refrescando producto:', error)
            }
            
            setIsProductModalOpen(false)
            setSelectedProduct(null)
            // Cerrar también el modal de encuesta si está abierto
            setShowSurveyModalInDetail(false)
            setSurveyModalProduct(null)
          }}
          product={{
            ...convertProductToActivity(selectedProduct),
            isOwnProduct: true
          }}
          navigationContext={null}
          showEditButton={true}
          onEdit={async () => {
            // Desde el detalle, especialmente desde el aviso "Agregar nuevas fechas"
            // Si es un taller finalizado con encuesta, abrir directamente en paso 5
            if (selectedProduct) {
              const isWorkshopFinished = selectedProduct.type === 'workshop' && 
                ((selectedProduct as any).is_finished === true || (selectedProduct as any).taller_activo === false)
              
              if (isWorkshopFinished) {
                // Verificar si tiene encuesta (primero en caché, luego en backend)
                const hasSurveyInCache = completedCoachSurveys[selectedProduct.id]
                
                if (hasSurveyInCache) {
                  // Ya tiene encuesta en caché, abrir directamente en paso 5 con aviso de cambio de fechas
                  setEditingProduct(selectedProduct)
                  setShouldOpenWorkshopSchedule(true)
                  setShouldShowDateChangeNoticeAfterStep5(true)
                  setIsProductModalOpen(false)
                  setIsModalOpen(true)
                  return
                }
                
                // Si no está en caché, verificar en backend
                try {
                  const response = await fetch(`/api/activities/${selectedProduct.id}/check-coach-survey`)
                  const result = await response.json()
                  
                  if (result.hasSurvey) {
                    // Guardar en caché
                    setCompletedCoachSurveys((prev) => ({
                      ...prev,
                      [selectedProduct.id]: true
                    }))
                    // Abrir directamente en paso 5 con aviso de cambio de fechas
                    setEditingProduct(selectedProduct)
                    setShouldOpenWorkshopSchedule(true)
                    setShouldShowDateChangeNoticeAfterStep5(true)
                    setIsProductModalOpen(false)
                    setIsModalOpen(true)
                    return
                  }
                } catch (error) {
                  console.error('Error verificando encuesta:', error)
                }
              }
              
              // Para otros casos o si no tiene encuesta, usar la lógica normal de edición
              handleEditProduct(selectedProduct)
              setIsProductModalOpen(false)
            }
          }}
          onDelete={handleDeleteProduct}
        />
      )}

      {/* Modal de encuesta del taller finalizado - Puede ser cerrable (al abrir detalle) o bloqueante (al editar) */}
      {showSurveyModalInDetail && surveyModalProduct && (
        <div 
          className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4"
          onClick={() => {
            // Solo permitir cerrar si NO es bloqueante
            if (!surveyModalBlocking) {
              setShowSurveyModalInDetail(false)
              setSurveyModalProduct(null)
            }
          }}
        >
          <div 
            className="bg-[#0A0A0A] rounded-2xl p-6 max-w-lg w-full border border-[#1A1A1A] shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col space-y-4">
              {/* Header con botón de cerrar solo si no es bloqueante */}
              <div className="flex items-center justify-between">
                <h3 className="text-white font-semibold text-lg">Taller finalizado</h3>
                {!surveyModalBlocking && (
                  <button
                    onClick={() => {
                      setShowSurveyModalInDetail(false)
                      setSurveyModalProduct(null)
                    }}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>
              
              {!surveySubmitted ? (
                <>
                  <p className="text-gray-400 text-sm mb-4">
                    {surveyModalBlocking 
                      ? "Para poder editar este taller, primero debes completar la encuesta."
                      : "Este taller ha finalizado. Te recomendamos completar la encuesta para poder editarlo."}
                  </p>
                  
                  {/* Encuesta del coach */}
                  <div className="space-y-4 pt-4 border-t border-gray-800">
                    <div>
                      <label className="text-white text-sm font-medium mb-2 block">
                        ¿Cómo estuvo el taller? (Puntuación)
                      </label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setWorkshopRating(star)}
                            className={`w-10 h-10 rounded-lg transition-all ${
                              star <= workshopRating
                                ? 'bg-[#FF7939] text-white'
                                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                            }`}
                          >
                            {star}
                          </button>
                        ))}
                      </div>
                      {workshopRating > 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                          {workshopRating === 1 && 'Muy malo'}
                          {workshopRating === 2 && 'Malo'}
                          {workshopRating === 3 && 'Regular'}
                          {workshopRating === 4 && 'Bueno'}
                          {workshopRating === 5 && 'Excelente'}
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <label className="text-white text-sm font-medium mb-2 block">
                        Comentarios sobre el taller
                      </label>
                      <Textarea
                        value={workshopFeedback}
                        onChange={(e) => setWorkshopFeedback(e.target.value)}
                        placeholder="Comparte tus comentarios sobre cómo estuvo el taller..."
                        className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-[#FF7939] resize-none"
                        rows={4}
                      />
                    </div>
                  </div>
                  
                  <div className="flex gap-3 pt-2">
                    <Button
                      onClick={async () => {
                        if (!surveyModalProduct?.id) return
                        
                        setIsSubmittingSurvey(true)
                        try {
                          const response = await fetch(`/api/activities/${surveyModalProduct.id}/finish-workshop`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              is_finished: true,
                              coach_rating: workshopRating || null,
                              coach_feedback: workshopFeedback.trim() || null
                            })
                          })
                          
                          const result = await response.json()
                          
                          console.log('📤 Respuesta de finish-workshop:', result)
                          
                          if (result.success) {
                            console.log('✅ Encuesta guardada exitosamente, versión:', result.version)
                            toast.success('Encuesta enviada exitosamente')
                            setSurveySubmitted(true)
                            // Marcar encuesta como completada localmente para este taller
                            // Esto es CRÍTICO: una vez completada, NO debe aparecer de nuevo para esta versión
                            if (surveyModalProduct?.id) {
                              setCompletedCoachSurveys((prev) => ({
                                ...prev,
                                [surveyModalProduct.id]: true
                              }))
                              console.log('✅ Encuesta marcada como completada localmente para taller:', surveyModalProduct.id, 'versión:', result.version)
                            }
                            // Recargar productos para actualizar el estado
                            await fetchProducts()
                          } else {
                            console.error('❌ Error al enviar encuesta:', result.error)
                            toast.error(result.error || 'Error al enviar la encuesta')
                          }
                        } catch (error) {
                          console.error('Error enviando encuesta:', error)
                          toast.error('Error al enviar la encuesta')
                        } finally {
                          setIsSubmittingSurvey(false)
                        }
                      }}
                      disabled={isSubmittingSurvey || workshopRating === 0}
                      className="flex-1 bg-[#FF7939] hover:bg-[#E66829] text-white py-2 rounded-lg disabled:opacity-50"
                    >
                      {isSubmittingSurvey ? 'Enviando...' : 'Enviar encuesta'}
                    </Button>
                    {!surveyModalBlocking && (
                      <Button
                        onClick={() => {
                          setShowSurveyModalInDetail(false)
                          setSurveyModalProduct(null)
                        }}
                        className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg"
                      >
                        Cerrar
                      </Button>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Flame className="w-8 h-8 text-green-400" />
                    </div>
                    <h3 className="text-white font-semibold text-lg mb-2">Encuesta enviada</h3>
                    <p className="text-gray-400 text-sm mb-6">
                      Tu encuesta ha sido guardada exitosamente. ¿Deseas reiniciar el taller con nuevas fechas?
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      onClick={() => {
                        const product = surveyModalProduct
                        // Cerrar el modal de encuesta completamente
                        setShowSurveyModalInDetail(false)
                        setSurveyModalProduct(null)
                        setSurveySubmitted(false)
                        setWorkshopRating(0)
                        setWorkshopFeedback('')
                        // Si estaba bloqueante (desde editar), ahora puede editar normalmente
                        // Pero solo si realmente quiere editar, no forzar el modal de reiniciar
                        // El coach puede cerrar y luego editar cuando quiera
                      }}
                      className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg"
                    >
                      {surveyModalBlocking ? 'Continuar' : 'No, cerrar'}
                    </Button>
                    <Button
                      onClick={async () => {
                        const product = surveyModalProduct
                        console.log('🔄 Clic en "Agregar nuevas fechas" para producto:', product?.id)
                        
                        if (!product) return
                        
                        // Cerrar primero el modal de encuesta completamente
                        console.log('🔒 Cerrando modal de encuesta antes de abrir modal de edición')
                        setShowSurveyModalInDetail(false)
                        setSurveyModalProduct(null)
                        setSurveySubmitted(false)
                        setWorkshopRating(0)
                        setWorkshopFeedback('')
                        
                        // Usar un pequeño delay para asegurar que el modal de encuesta se cierre primero
                        await new Promise(resolve => setTimeout(resolve, 150))
                        console.log('✅ Modal de encuesta cerrado, procediendo a abrir modal de edición')
                        
                        // Abrir modal de edición en paso 5
                        // Primero refrescar el producto para asegurar que tiene la encuesta actualizada
                        try {
                          const response = await fetch(API_ENDPOINTS.PRODUCTS, {
                            credentials: 'include' // ✅ Incluir cookies en la petición
                          })
                          if (response.ok) {
                            const result = await response.json()
                            if (result.success && result.products) {
                              const refreshedProduct = result.products.find((p: Product) => p.id === product.id)
                              if (refreshedProduct) {
                                // Usar el producto refrescado que ya tiene la encuesta
                                console.log('✅ Producto refrescado, abriendo modal en paso 5')
                                // Establecer estados primero
                                setEditingProduct(refreshedProduct)
                                setShouldOpenWorkshopSchedule(true)
                                setShouldShowDateChangeNoticeAfterStep5(true)
                                // Abrir modal después de un pequeño delay para asegurar que el modal de encuesta se cerró
                                setTimeout(() => {
                                  console.log('🚀 Abriendo CreateProductModal con initialStep=workshopSchedule')
                                  setIsModalOpen(true)
                                }, 100)
                                return
                              }
                            }
                          }
                        } catch (error) {
                          console.error('❌ Error refrescando producto:', error)
                        }
                        // Fallback: usar el producto original
                        console.log('⚠️ Usando producto original (fallback), abriendo modal en paso 5')
                        setEditingProduct(product)
                        setShouldOpenWorkshopSchedule(true)
                        setShouldShowDateChangeNoticeAfterStep5(true)
                        // Abrir modal después de un pequeño delay
                        setTimeout(() => {
                          console.log('🚀 Abriendo CreateProductModal con initialStep=workshopSchedule (fallback)')
                          setIsModalOpen(true)
                        }, 100)
                      }}
                      className="flex-1 bg-[#FF7939] hover:bg-[#E66829] text-white py-2 rounded-lg"
                    >
                      Agregar nuevas fechas
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación de eliminación */}
      {deleteConfirmationOpen && productToDelete && !isDeleting && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-black rounded-2xl p-8 max-w-md w-full border-0 shadow-2xl">
            <div className="flex flex-col items-center text-center">
              {/* Icono de advertencia */}
              <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mb-6">
                <Trash2 className="w-8 h-8 text-white" />
              </div>
              
              {/* Título */}
              <h3 className="text-2xl font-bold text-white mb-2">
                ¿Eliminar actividad?
              </h3>
              
              {/* Mensaje */}
              <p className="text-gray-300 mb-6 text-lg">
                Estás a punto de eliminar <span className="text-orange-500 font-semibold">"{productToDelete.title}"</span>
              </p>
              
              <p className="text-gray-400 mb-8 text-sm">
                Esta acción no se puede deshacer. Se eliminarán todos los datos relacionados.
              </p>
              
              {/* Botones */}
              <div className="flex gap-4 w-full">
                <Button
                  onClick={cancelDelete}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-xl font-semibold text-lg transition-colors duration-200"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={confirmDelete}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl font-semibold text-lg transition-colors duration-200"
                >
                  Eliminar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de eliminación exitosa */}
      {deleteSuccessOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-black rounded-2xl p-8 max-w-md w-full border-0 shadow-2xl">
            <div className="flex flex-col items-center text-center">
              {/* Icono de éxito */}
              <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              
              {/* Título */}
              <h3 className="text-2xl font-bold text-white mb-2">
                ¡Eliminado exitosamente!
              </h3>
              
              {/* Mensaje */}
              <p className="text-gray-300 mb-8 text-lg">
                La actividad <span className="text-orange-500 font-semibold">"{deletedProductName}"</span> ha sido eliminada correctamente.
              </p>
              
              {/* Botón de cerrar */}
              <Button
                onClick={closeDeleteSuccess}
                className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-xl font-semibold text-lg transition-colors duration-200"
              >
                Entendido
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Consultas eliminado: ahora la vista de consultas se muestra inline bajo el header de productos */}

      {/* Modal de Meet */}
      {isMeetModalOpen && selectedSaleForMeet && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setIsMeetModalOpen(false)}>
          <div className="bg-[#0A0A0A] rounded-2xl p-5 max-w-md w-full border border-[#1A1A1A] shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-semibold text-base">Programar Meet</h3>
                <button
                  onClick={() => setIsMeetModalOpen(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Fecha */}
                <div>
                  <label className="text-gray-400 text-xs mb-2 block">Seleccionar fecha</label>
                  <input
                    type="date"
                    value={meetSchedule.date}
                    onChange={(e) => setMeetSchedule({...meetSchedule, date: e.target.value})}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full bg-[#1A1A1A] border border-[#1A1A1A] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#FF7939]"
                  />
                </div>

                {/* Horario 1 */}
                <div>
                  <label className="text-gray-400 text-xs mb-2 block">Horario 1</label>
                  <input
                    type="time"
                    value={meetSchedule.time1}
                    onChange={(e) => setMeetSchedule({...meetSchedule, time1: e.target.value})}
                    className="w-full bg-[#1A1A1A] border border-[#1A1A1A] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#FF7939]"
                  />
                </div>

                {/* Horario 2 */}
                <div>
                  <label className="text-gray-400 text-xs mb-2 block">Horario 2</label>
                  <input
                    type="time"
                    value={meetSchedule.time2}
                    onChange={(e) => setMeetSchedule({...meetSchedule, time2: e.target.value})}
                    className="w-full bg-[#1A1A1A] border border-[#1A1A1A] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#FF7939]"
                  />
                </div>

                {/* Nombre de la meet */}
                <div>
                  <label className="text-gray-400 text-xs mb-2 block">Nombre de la reunión</label>
                  <input
                    type="text"
                    value={meetSchedule.meetingName}
                    onChange={(e) => setMeetSchedule({...meetSchedule, meetingName: e.target.value})}
                    placeholder="Ej: Consulta de Café con [Nombre]"
                    className="w-full bg-[#1A1A1A] border border-[#1A1A1A] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#FF7939]"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  onClick={() => setIsMeetModalOpen(false)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg text-sm"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSendMeet}
                  className="flex-1 bg-[#FF7939] hover:bg-[#E66829] text-white py-2 rounded-lg text-sm"
                >
                  Enviar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
