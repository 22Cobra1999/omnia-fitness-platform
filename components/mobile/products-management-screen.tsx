"use client"

import { useState, useEffect, useCallback, useMemo, memo, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Plus, TrendingUp, Users, DollarSign, Package, Filter, ArrowUpDown, ArrowUp, ArrowDown, ChevronDown, Edit, Trash2, X, Coffee, Clock, Pencil } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import CreateProductModal from '@/components/shared/products/create-product-modal-refactored'
import ActivityCard from '@/components/shared/activities/ActivityCard'
import ClientProductModal from '@/components/client/activities/client-product-modal'
import { API_ENDPOINTS } from '@/lib/config/api-config'
import { useUser } from '@/contexts/user-context'

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
  const { user } = useUser()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isProductModalOpen, setIsProductModalOpen] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState<'todos' | 'fitness' | 'nutrition' | 'consultation' | 'workshop' | 'document' | 'program'>('todos')
  const [sortField, setSortField] = useState<SortField>('title')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [showTypeDropdown, setShowTypeDropdown] = useState(false)
  
  // Estado para consultas
  const [consultations, setConsultations] = useState({
    cafe: { active: false, price: 0 },
    meet30: { active: false, price: 0 },
    meet60: { active: false, price: 0 }
  })
  const [isEditingPrices, setIsEditingPrices] = useState(false)
  
  // Estado para modal de confirmación de eliminación
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false)
  const [productToDelete, setProductToDelete] = useState<Product | null>(null)
  
  // Estado para modal de eliminación exitosa
  const [deleteSuccessOpen, setDeleteSuccessOpen] = useState(false)
  const [deletedProductName, setDeletedProductName] = useState<string>('')
  
  // Estado para evitar doble ejecución
  const [isDeleting, setIsDeleting] = useState(false)

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
      const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 segundos timeout
      
      const response = await fetch(API_ENDPOINTS.PRODUCTS, {
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        }
      })
      
      clearTimeout(timeoutId)
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
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.error('Timeout al obtener productos')
      } else {
        console.error('Error al obtener productos:', error)
      }
    } finally {
      setLoading(false)
    }
  }, []) // Sin dependencias para evitar loops

  // Cargar consultas del coach desde Supabase - Memoizado
  // NOTA: API eliminada - usando valores por defecto
  const fetchConsultations = useCallback(async () => {
    // API eliminada - usar valores por defecto
    const defaultConsultations = {
      cafe: { active: false, price: 0 },
      meet30: { active: false, price: 0 },
      meet60: { active: false, price: 0 }
    }
    setConsultations(defaultConsultations)
  }, [])

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

  // Guardar consultas del coach en Supabase
  // NOTA: API eliminada - función deshabilitada
  const saveConsultations = async () => {
    // API eliminada - no se puede guardar
    console.warn('⚠️ API de consultas eliminada - no se puede guardar')
  }

  // Usar refs para mantener referencias estables a las funciones
  const fetchProductsRef = useRef(fetchProducts)
  const fetchConsultationsRef = useRef(fetchConsultations)
  const fetchStatsRef = useRef(fetchStats)
  
  // Actualizar refs cuando las funciones cambian
  useEffect(() => {
    fetchProductsRef.current = fetchProducts
    fetchConsultationsRef.current = fetchConsultations
    fetchStatsRef.current = fetchStats
  }, [fetchProducts, fetchConsultations, fetchStats])
  
  useEffect(() => {
    // Cargar datos de forma secuencial para evitar sobrecarga
    const loadData = async () => {
      try {
        // Esperar un poco para que la autenticación se complete
        await new Promise(resolve => setTimeout(resolve, 1000))
        await fetchProductsRef.current()
        await fetchConsultationsRef.current()
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

  // Funciones para manejar consultas
  // NOTA: API eliminada - solo actualiza estado local
  const toggleConsultation = async (type: 'cafe' | 'meet30' | 'meet60') => {
    const newConsultations = {
      ...consultations,
      [type]: {
        ...consultations[type],
        active: !consultations[type].active
      }
    }
    setConsultations(newConsultations)
    // API eliminada - solo actualiza estado local, no se guarda en BD
  }

  const updateConsultationPrice = async (type: 'cafe' | 'meet30' | 'meet60', price: number) => {
    const newConsultations = {
      ...consultations,
      [type]: {
        ...consultations[type],
        price: price
      }
    }
    setConsultations(newConsultations)
    // API eliminada - solo actualiza estado local, no se guarda en BD
  }

  const handleCloseModal = useCallback(async () => {
    setIsModalOpen(false)
    const editingProductId = editingProduct?.id
    
    // Recargar productos para obtener los datos actualizados
    await fetchProducts()
    
    setEditingProduct(null)
    
    // Disparar evento de actualización después de un pequeño delay para que los productos se hayan recargado
    if (editingProductId) {
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
  }, [fetchProducts, editingProduct, selectedProduct, products])

  const handlePreviewProduct = useCallback((product: Product) => {
    setSelectedProduct(product)
    setIsProductModalOpen(true)
  }, [])

  // Función para convertir Product a Activity para ActivityCard - Memoizada
  const convertProductToActivity = useCallback((product: Product) => {
    
    // Usar la misma lógica de imágenes que ActivityCard
    const getValidImageUrl = () => {
      // Intentar diferentes fuentes de imagen como en ActivityCard
      const imageUrl = product.image_url || 
                      product.media?.image_url || 
                      product.activity_media?.[0]?.image_url
      
      if (imageUrl && !imageUrl.includes('via.placeholder.com')) {
        return imageUrl
      }
      
      // Usar placeholder por defecto como en ActivityCard
      return '/placeholder.svg?height=200&width=200&query=activity'
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
      is_paused: product.is_paused || false
    }
  }, [])

  const handleEditProduct = useCallback(async (product: Product) => {
    // Por ahora, usar los datos básicos del producto
    // TODO: Implementar llamada al endpoint GET cuando se resuelva el problema de autenticación
    setEditingProduct(product)
    setIsModalOpen(true)
  }, [])

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
    consultation: {
      count: products.filter(p => p.type === 'consultation').length,
      avgPrice: products.filter(p => p.type === 'consultation').length > 0 
        ? products.filter(p => p.type === 'consultation').reduce((sum, p) => sum + p.price, 0) / products.filter(p => p.type === 'consultation').length 
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
      case 'consultation': return 'bg-blue-500'
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
      case 'consultation': return 'Consulta'
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
        {/* Header de productos */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-white mb-1">Mis Productos</h2>
            <p className="text-gray-400 text-sm">Gestiona tus productos y servicios</p>
          </div>
          <Button
            className="bg-[#FF7939] hover:bg-[#E66829] text-white px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-[#FF7939]/25 transition-all duration-200"
            onClick={handleOpenModal}
          >
            <Plus className="h-5 w-5 mr-2" />
            Crear
          </Button>
        </div>

        {/* Estadísticas - Diseño minimalista */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center justify-between w-full space-x-2">
            <div className="flex items-center space-x-1 flex-1">
              <DollarSign className="h-4 w-4 text-[#FF7939] flex-shrink-0" />
              <span className="text-gray-400 text-xs">Ingresos:</span>
              <span className="text-white font-semibold text-sm">${totalRevenue.toFixed(0)}</span>
            </div>
            <div className="flex items-center space-x-1 flex-1">
              <Package className="h-4 w-4 text-[#FF7939] flex-shrink-0" />
              <span className="text-gray-400 text-xs">Productos:</span>
              <span className="text-white font-semibold text-sm">{totalProducts}</span>
            </div>
            <div className="flex items-center space-x-1 flex-1">
              <Users className="h-4 w-4 text-[#FF7939] flex-shrink-0" />
              <span className="text-gray-400 text-xs">Rating:</span>
              <span className="text-white font-semibold text-sm">{avgRating.toFixed(1)}</span>
            </div>
          </div>
        </div>

        {/* Consultas Disponibles */}
        <div className="bg-[#0F0F0F] rounded-2xl border border-[#1A1A1A] p-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold text-base">Consultas Disponibles</h3>
            <button
              onClick={() => setIsEditingPrices(!isEditingPrices)}
              className={`p-2 rounded-lg transition-colors duration-200 ${
                isEditingPrices 
                  ? 'bg-[#FF7939] text-white' 
                  : 'bg-gray-700/50 text-gray-400 hover:text-white hover:bg-gray-600/50'
              }`}
            >
              <Pencil className="h-4 w-4" />
            </button>
          </div>
          <div className="flex space-x-3">
            {/* Café */}
            <div className={`rounded-lg p-3 flex-1 flex flex-col items-center text-center transition-all duration-200 ${
              consultations.cafe.active ? 'bg-[#FF7939]/10 border border-[#FF7939]/30' : 'bg-gray-800/20 border border-gray-700/30'
            }`}>
              <div className="flex items-center justify-between w-full mb-2">
                <Coffee className={`w-5 h-5 ${consultations.cafe.active ? 'text-[#FF7939]' : 'text-gray-500'}`} />
                <button
                  onClick={() => toggleConsultation('cafe')}
                  className={`w-8 h-4 rounded-full transition-colors duration-200 ${
                    consultations.cafe.active ? 'bg-[#FF7939]' : 'bg-gray-600'
                  }`}
                >
                  <div className={`w-3 h-3 bg-white rounded-full transition-transform duration-200 ${
                    consultations.cafe.active ? 'translate-x-4' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>
              <p className="text-white font-medium text-sm mb-1">Café</p>
              <p className="text-gray-400 text-xs mb-2">Consulta informal</p>
              {!consultations.cafe.active && isEditingPrices ? (
                <input
                  type="number"
                  value={consultations.cafe.price}
                  onChange={(e) => updateConsultationPrice('cafe', parseInt(e.target.value) || 0)}
                  className="w-full text-center bg-transparent border border-[#FF7939]/30 rounded px-2 py-1 text-[#FF7939] font-bold text-lg focus:outline-none focus:border-[#FF7939]"
                  placeholder="0"
                />
              ) : (
                <span className={`font-bold text-lg ${consultations.cafe.active ? 'text-[#FF7939]' : 'text-gray-500'}`}>
                  ${consultations.cafe.price}
                </span>
              )}
            </div>

            {/* Meet 30 min */}
            <div className={`rounded-lg p-3 flex-1 flex flex-col items-center text-center transition-all duration-200 ${
              consultations.meet30.active ? 'bg-[#FF7939]/10 border border-[#FF7939]/30' : 'bg-gray-800/20 border border-gray-700/30'
            }`}>
              <div className="flex items-center justify-between w-full mb-2">
                <Clock className={`w-5 h-5 ${consultations.meet30.active ? 'text-[#FF7939]' : 'text-gray-500'}`} />
                <button
                  onClick={() => toggleConsultation('meet30')}
                  className={`w-8 h-4 rounded-full transition-colors duration-200 ${
                    consultations.meet30.active ? 'bg-[#FF7939]' : 'bg-gray-600'
                  }`}
                >
                  <div className={`w-3 h-3 bg-white rounded-full transition-transform duration-200 ${
                    consultations.meet30.active ? 'translate-x-4' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>
              <p className="text-white font-medium text-sm mb-1">Meet 30 min</p>
              <p className="text-gray-400 text-xs mb-2">Consulta de 30 minutos</p>
              {!consultations.meet30.active && isEditingPrices ? (
                <input
                  type="number"
                  value={consultations.meet30.price}
                  onChange={(e) => updateConsultationPrice('meet30', parseInt(e.target.value) || 0)}
                  className="w-full text-center bg-transparent border border-[#FF7939]/30 rounded px-2 py-1 text-[#FF7939] font-bold text-lg focus:outline-none focus:border-[#FF7939]"
                  placeholder="0"
                />
              ) : (
                <span className={`font-bold text-lg ${consultations.meet30.active ? 'text-[#FF7939]' : 'text-gray-500'}`}>
                  ${consultations.meet30.price}
                </span>
              )}
            </div>

            {/* Meet 1 hora */}
            <div className={`rounded-lg p-3 flex-1 flex flex-col items-center text-center transition-all duration-200 ${
              consultations.meet60.active ? 'bg-[#FF7939]/10 border border-[#FF7939]/30' : 'bg-gray-800/20 border border-gray-700/30'
            }`}>
              <div className="flex items-center justify-between w-full mb-2">
                <Users className={`w-5 h-5 ${consultations.meet60.active ? 'text-[#FF7939]' : 'text-gray-500'}`} />
                <button
                  onClick={() => toggleConsultation('meet60')}
                  className={`w-8 h-4 rounded-full transition-colors duration-200 ${
                    consultations.meet60.active ? 'bg-[#FF7939]' : 'bg-gray-600'
                  }`}
                >
                  <div className={`w-3 h-3 bg-white rounded-full transition-transform duration-200 ${
                    consultations.meet60.active ? 'translate-x-4' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>
              <p className="text-white font-medium text-sm mb-1">Meet 1 hora</p>
              <p className="text-gray-400 text-xs mb-2">Consulta completa de 1 hora</p>
              {!consultations.meet60.active && isEditingPrices ? (
                <input
                  type="number"
                  value={consultations.meet60.price}
                  onChange={(e) => updateConsultationPrice('meet60', parseInt(e.target.value) || 0)}
                  className="w-full text-center bg-transparent border border-[#FF7939]/30 rounded px-2 py-1 text-[#FF7939] font-bold text-lg focus:outline-none focus:border-[#FF7939]"
                  placeholder="0"
                />
              ) : (
                <span className={`font-bold text-lg ${consultations.meet60.active ? 'text-[#FF7939]' : 'text-gray-500'}`}>
                  ${consultations.meet60.price}
                </span>
              )}
            </div>
          </div>
        </div>


        {/* Tabla de productos con filtros integrados */}
        <div className="bg-[#0F0F0F] rounded-2xl border border-[#1A1A1A] overflow-hidden">
          {/* Header de tabla con filtros */}
          <div className="p-4 border-b border-[#1A1A1A]">
                          <div className="flex flex-col space-y-3">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-white">Productos</h3>
                
                {/* Dropdown de categoría */}
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
                    <div className="absolute right-0 top-full mt-2 bg-[#0F0F0F] border border-[#1A1A1A] rounded-xl shadow-lg z-10 min-w-[150px]">
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
                        <button
                          onClick={() => { setTypeFilter('consultation'); setShowTypeDropdown(false); }}
                          className="w-full text-left px-3 py-2 rounded-lg hover:bg-[#1A1A1A] text-gray-400 hover:text-white transition-colors text-sm"
                        >
                          Consultas
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
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
                    <div className="flex -space-x-4" style={{ minWidth: "min-content" }}>
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
      </div>

      {/* Modal placeholder */}
      {isModalOpen && (
        <CreateProductModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          editingProduct={editingProduct}
        />
      )}

      {/* Product Modal - Usando el mismo modal que el cliente */}
      {selectedProduct && (
        <ClientProductModal
          isOpen={isProductModalOpen}
          onClose={async () => {
            // Refrescar el producto desde la API antes de cerrar
            try {
              console.log('🔄 Refrescando producto al cerrar modal:', selectedProduct.id)
              const response = await fetch(API_ENDPOINTS.PRODUCTS)
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
          }}
          product={{
            ...convertProductToActivity(selectedProduct),
            isOwnProduct: true
          }}
          navigationContext={null}
          showEditButton={true}
          onEdit={(product) => {
            // console.log('🔍 Editando producto:', product)
            setEditingProduct(selectedProduct)
            setIsProductModalOpen(false)
            setIsModalOpen(true)
          }}
          onDelete={handleDeleteProduct}
        />
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
    </div>
  )
}
