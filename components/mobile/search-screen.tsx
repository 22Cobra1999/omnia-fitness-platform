
"use client"

import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import {
  Star,
  Loader2,
  ShoppingCart,
  ChevronRight,
  User,
  X,
  Search,
  Filter,
  ChevronDown,
} from "lucide-react"
import Image from "next/image"
import { trackComponent, trackAPI } from '@/lib/logging/usage-tracker'
// import { useCachedCoaches, type Coach } from "@/hooks/use-cached-coaches"

// Definir tipo Coach localmente
type Coach = {
  id: string
  name: string
  email: string
  avatar_url?: string
  bio?: string
  specialties?: string[]
  rating?: number
  total_clients?: number
  total_earnings?: number
  total_products?: number
  total_sessions?: number
  experience_years?: number
  certifications?: string[]
}
import { extractVimeoId } from "@/utils/vimeo-utils"
import { VimeoPlayer } from '@/components/shared/video/vimeo-player'
import { useToast } from '@/hooks/shared/use-toast'
import Link from "next/link"
import { PurchaseActivityModal } from '@/components/shared/activities/purchase-activity-modal'
import ClientProductModal from '@/components/client/activities/client-product-modal'
import CoachProfileCard from '@/components/coach/clients/CoachProfileCard'
import ActivityCard from '@/components/shared/activities/ActivityCard'
import ProductPreviewModal from '@/components/shared/products/product-preview-modal'
import CoachProfileModal from "@/components/coach/CoachProfileModal"
import { NoCoachesFallback, NoActivitiesFallback, NetworkErrorFallback, LoadingFallback } from '@/components/shared/misc/fallback-states'
import { CoachCardSkeleton, ActivityCardSkeleton } from '@/components/shared/ui/global-loading'
// import { useSmartCoachCache } from '@/hooks/coach/use-smart-coach-cache'
import type { Activity } from "@/types/activity" // Import updated Activity type

// Define account data type
type Account = {
  id: string
  name: string
  avatar: string
  verified: boolean
  online: boolean
}

// Datos de fallback para actividades (array vacío)
const FALLBACK_ACTIVITIES: Activity[] = []

interface SearchScreenProps {
  onTabChange?: (tab: string) => void;
}

export function SearchScreen({ onTabChange }: SearchScreenProps) {
  // Rastrear uso del componente
  useEffect(() => {
    trackComponent('SearchScreen')
  }, [])

  // Estado para controlar si mostrar más actividades y coaches
  const [showAllActivities, setShowAllActivities] = useState(false)
  const [showAllCoaches, setShowAllCoaches] = useState(false)

  // Estados para búsqueda y filtros
  const [searchTerm, setSearchTerm] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  const [selectedProgramType, setSelectedProgramType] = useState<string>("all") // "programa", "taller", "documento"
  const [selectedCategory, setSelectedCategory] = useState<string>("all") // "nutricion", "fitness"
  const [selectedFitnessType, setSelectedFitnessType] = useState<string>("all") // "fuerza", "aerobico", "deporte"
  const [isSearching, setIsSearching] = useState(false)
  const [expandedSection, setExpandedSection] = useState<'coaches' | 'activities' | null>(null)

  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null)
  const [activities, setActivities] = useState<Activity[]>([])
  const [isLoadingActivities, setIsLoadingActivities] = useState(false)
  const [activitiesError, setActivitiesError] = useState<Error | null>(null)
  // Cache de actividades para evitar recargas innecesarias
  const activitiesCacheRef = useRef<{ data: Activity[]; timestamp: number } | null>(null)
  const CACHE_DURATION = 5 * 60 * 1000 // 5 minutos
  const [displayedCoaches, setDisplayedCoaches] = useState<Coach[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  
  const { toast } = useToast()
  const router = useRouter()
  const [purchasedActivity, setPurchasedActivity] = useState<Activity | null>(null)
  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false)
  const [selectedPurchaseActivity, setSelectedPurchaseActivity] = useState<Activity | null>(null)
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false)
  const [isCoachProfileModalOpen, setIsCoachProfileModalOpen] = useState(false)
  const [selectedCoachForProfile, setSelectedCoachForProfile] = useState<Coach | null>(null)
  const [navigationContext, setNavigationContext] = useState<{
    fromCoachProfile?: boolean
    coachId?: string
  } | null>(null)
  
  // Pila de navegación para manejar el flujo correcto
  const [navigationStack, setNavigationStack] = useState<Array<{
    type: 'activity' | 'coach'
    data: any
    context?: any
  }>>([])

  // Función para cargar coaches
  const loadCoaches = async () => {
    try {
      setIsLoading(true)
      setError(null)
      trackAPI('/api/search-coaches', 'GET')
      const response = await fetch('/api/search-coaches')
      if (!response.ok) throw new Error('Failed to fetch coaches')
      const coaches = await response.json()
      // Mapear los datos de la API al formato esperado por el componente
      const mappedCoaches = coaches.map((coach: any) => ({
        ...coach,
        name: coach.full_name || coach.name,
        specialization: coach.specialty || coach.specialization,
        experience_years: coach.experienceYears || coach.experience_years,
        location: coach.location || "No especificada",
        bio: coach.bio || coach.description,
        rating: coach.rating || 0,
        total_sessions: coach.totalReviews || coach.total_sessions || 0,
        total_products: coach.activities || coach.total_products || 0,
        certifications: coach.certifications || []
      }))
      setAllCoaches(mappedCoaches)
      setDisplayedCoaches(mappedCoaches)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'))
    } finally {
      setIsLoading(false)
    }
  }

  // Función para cargar actividades con cache
  const loadActivities = useCallback(async (forceRefresh = false) => {
    // Verificar cache primero
    if (!forceRefresh && activitiesCacheRef.current) {
      const cacheAge = Date.now() - activitiesCacheRef.current.timestamp
      if (cacheAge < CACHE_DURATION) {
        console.log(`✅ [SearchScreen] Usando actividades del cache (${Math.round(cacheAge / 1000)}s de antigüedad)`)
        setAllActivities(activitiesCacheRef.current.data)
        setActivities(activitiesCacheRef.current.data)
        return
      }
    }
    
    try {
      setIsLoadingActivities(true)
      setActivitiesError(null)
      trackAPI('/api/activities/search', 'GET')
      const response = await fetch('/api/activities/search')
      if (!response.ok) throw new Error('Failed to fetch activities')
      const activities = await response.json()
      
      // Guardar en cache
      activitiesCacheRef.current = {
        data: activities,
        timestamp: Date.now()
      }
      
      setAllActivities(activities)
      setActivities(activities)
    } catch (err) {
      setActivitiesError(err instanceof Error ? err : new Error('Unknown error'))
      // Si hay error pero hay cache, usar cache como fallback
      if (activitiesCacheRef.current) {
        console.log('⚠️ [SearchScreen] Error cargando actividades, usando cache como fallback')
        setAllActivities(activitiesCacheRef.current.data)
        setActivities(activitiesCacheRef.current.data)
      }
    } finally {
      setIsLoadingActivities(false)
    }
  }, [CACHE_DURATION])
  
  // Hook para cache inteligente de coaches - reemplazado con funciones vacías
  const { preloadCoach, cacheCoach, getCacheStats } = {
    preloadCoach: () => {},
    cacheCoach: () => {},
    getCacheStats: () => ({})
  }

  // Cargar datos al montar el componente (solo si no hay cache)
  useEffect(() => {
    loadCoaches()
    loadActivities(false) // false = usar cache si está disponible
  }, [loadActivities])
  
  

  // Efecto para manejar errores de carga
  useEffect(() => {
    if (error) {
      console.error("Error al cargar coaches:", error)
      toast({
        title: "Error al cargar coaches",
        description: "Intentando usar datos en caché o fallback...",
        variant: "destructive",
      })
    }
  }, [error, toast])

  // Función para manejar reintento (fuerza recarga)
  const handleRetry = () => {
    loadCoaches()
    loadActivities(true) // true = forzar recarga, ignorar cache
  }

  // Efecto para cargar coaches solo al montar el componente
  useEffect(() => {
    // Solo cargar una vez al montar, no en cada cambio de displayedCoaches
    // Componente montado, cargando coaches...
  }, []) // Array vacío = solo al montar

  // Efecto para pre-cargar coaches cuando se cargan actividades
  useEffect(() => {
    if (activities && activities.length > 0 && displayedCoaches && displayedCoaches.length > 0) {
      
      // Pre-cargar cada coach con sus actividades filtradas
      displayedCoaches.forEach(coach => {
        const coachActivities = (activities || []).filter(activity => activity.coach_id === coach.id)
        if (coachActivities.length > 0) {
          cacheCoach(coach.id, coach, coachActivities)
        }
      })
    }
  }, [activities, displayedCoaches, cacheCoach])


  // Implementar caché de resultados (solo cuando hay coaches)
  useEffect(() => {
    if (displayedCoaches && displayedCoaches.length > 0) {
      // Guardar en sessionStorage para acceso rápido
      try {
        sessionStorage.setItem("cached_coaches", JSON.stringify(displayedCoaches))
        sessionStorage.setItem("coaches_cache_timestamp", Date.now().toString())
        // Coaches guardados en caché
      } catch (e) {
        console.error("Error al guardar en sessionStorage:", e)
      }
    }
  }, [displayedCoaches?.length]) // Solo cuando cambia la cantidad de coaches

  // Cargar datos en caché al iniciar (solo una vez)
  useEffect(() => {
    try {
      const cachedData = sessionStorage.getItem("cached_coaches")
      const cachedTimestamp = Number.parseInt(sessionStorage.getItem("coaches_cache_timestamp") || "0")

      // Usar caché solo si existe y tiene menos de 10 minutos
      if (cachedData && Date.now() - cachedTimestamp < 10 * 60 * 1000) {
        const parsedData = JSON.parse(cachedData)
        if (parsedData && parsedData.length > 0) {
          // Usando datos en caché mientras se carga
          // No llamar a refreshCoaches aquí para evitar bucles
        }
      }
    } catch (e) {
      console.error("Error al cargar caché inicial:", e)
    }
  }, []) // Array vacío = solo al montar

  // Cuenta del usuario actual
  const userAccount: Account = {
    id: "you",
    name: "You",
    avatar: "/placeholder.svg?height=60&width=60",
    verified: true,
    online: true,
  }

  // Efecto para mostrar toast de error si hay problemas
  useEffect(() => {
    if (error) {
      toast({
        title: "Error al cargar coaches",
        description: "Intentando usar datos en caché o fallback...",
        variant: "destructive",
      })
    }
  }, [error, toast])

  // Function to render specialty icon
  const renderSpecialtyIcon = (specialty: string) => {
    switch (specialty) {
      case "nutrition":
        return <ChefHat className="h-6 w-6 text-white" />
      case "gym":
        return <Dumbbell className="h-6 w-6 text-white" />
      case "fitness":
      default:
        return <Yoga className="h-6 w-6 text-white" />
    }
  }


  // Estados para datos originales (sin filtrar)
  const [allCoaches, setAllCoaches] = useState<Coach[]>([])
  const [allActivities, setAllActivities] = useState<Activity[]>([])

  // Función para filtrar coaches localmente
  const filterCoaches = (coaches: Coach[]) => {
    return coaches.filter(coach => {
      // Filtro por búsqueda de texto
      if (searchTerm.trim()) {
        const searchLower = searchTerm.toLowerCase()
        const matchesName = coach.name?.toLowerCase().includes(searchLower) || false
        const matchesSpecialization = coach.specialization?.toLowerCase().includes(searchLower) || false
        if (!matchesName && !matchesSpecialization) return false
      }

      // Filtro por categoría
      if (selectedCategory !== "all") {
        if (selectedCategory === "fitness") {
          if (!coach.specialization?.toLowerCase().includes("fitness") && 
              !coach.specialization?.toLowerCase().includes("gym") &&
              !coach.specialization?.toLowerCase().includes("deporte")) {
            return false
          }
        } else if (selectedCategory === "nutricion") {
          if (!coach.specialization?.toLowerCase().includes("nutricion")) {
            return false
          }
        }
      }

      // Filtro por tipo de fitness
      if (selectedCategory === "fitness" && selectedFitnessType !== "all") {
        const fitnessLower = selectedFitnessType.toLowerCase()
        if (!coach.specialization?.toLowerCase().includes(fitnessLower)) {
          return false
        }
      }

      return true
    })
  }

  // Función para filtrar actividades localmente
  const filterActivities = (activities: Activity[]) => {
    return activities.filter(activity => {
      // Filtro por búsqueda de texto
      if (searchTerm.trim()) {
        const searchLower = searchTerm.toLowerCase()
        const matchesTitle = activity.title?.toLowerCase().includes(searchLower) || false
        const matchesCoach = activity.coach_name?.toLowerCase().includes(searchLower) || false
        if (!matchesTitle && !matchesCoach) return false
      }

      // Filtro por tipo de programa (program, workshop, document)
      if (selectedProgramType !== "all") {
        const activityType = activity.type?.toLowerCase() || ''
        if (selectedProgramType === "programa") {
          if (activityType !== 'program' && activityType !== 'programa') {
            return false
          }
        } else if (selectedProgramType === "taller") {
          if (activityType !== 'workshop' && activityType !== 'taller') {
            return false
          }
        } else if (selectedProgramType === "documento") {
          if (activityType !== 'document' && activityType !== 'documento') {
            return false
          }
        }
      }

      // Filtro por categoría (fitness o nutricion)
      if (selectedCategory !== "all") {
        const activityType = activity.type?.toLowerCase() || ''
        if (selectedCategory === "fitness") {
          if (activityType !== "fitness") {
            return false
          }
        } else if (selectedCategory === "nutricion") {
          if (activityType !== "nutricion" && activityType !== "nutrition") {
            return false
          }
        }
      }

      // Filtro por tipo de fitness (fuerza, aerobico, deporte, funcional)
      if (selectedCategory === "fitness" && selectedFitnessType !== "all") {
        const title = activity.title?.toLowerCase() || ''
        const description = activity.description?.toLowerCase() || ''
        const fitnessLower = selectedFitnessType.toLowerCase()
        
        // Buscar el tipo de fitness en el título o descripción
        if (!title.includes(fitnessLower) && !description.includes(fitnessLower)) {
          return false
        }
      }

      return true
    })
  }

  // Aplicar filtros localmente
  const filteredCoaches = useMemo(() => {
    if (expandedSection !== 'coaches') {
      return displayedCoaches || []
    }
    return filterCoaches(allCoaches)
  }, [allCoaches, searchTerm, selectedCategory, selectedFitnessType, expandedSection])

  const filteredActivities = useMemo(() => {
    if (expandedSection !== 'activities') {
      return activities || []
    }
    return filterActivities(allActivities)
  }, [allActivities, searchTerm, selectedProgramType, selectedCategory, selectedFitnessType, expandedSection])

  // Efecto para aplicar filtros cuando cambian los valores
  useEffect(() => {
    if (expandedSection === 'coaches') {
      setDisplayedCoaches(filteredCoaches)
    } else if (expandedSection === 'activities') {
      setActivities(filteredActivities)
    }
  }, [filteredCoaches, filteredActivities, expandedSection])


  const handleActivityClick = (activity: Activity, fromCoachProfile = false, coachId?: string) => {
    // usage.onClick(activity.id, { fromCoachProfile, coachId }) // Removido - variable no definida
    
    // Debug: Verificar qué datos tiene la actividad
    console.log('🔍 SearchScreen - handleActivityClick:', {
      id: activity.id,
      title: activity.title,
      objetivos: activity.objetivos,
      workshop_type: activity.workshop_type,
      categoria: activity.categoria
    })
    
    // Agregar a la pila de navegación
    setNavigationStack(prev => {
      let newStack = [...prev]
      
      // Si viene del perfil del coach, asegurar que el coach esté en la pila
      if (fromCoachProfile && coachId && selectedCoachForProfile) {
        // Verificar si el coach ya está en la pila
        const coachAlreadyInStack = newStack.some(item => 
          item.type === 'coach' && item.data?.id === coachId
        )
        
        if (!coachAlreadyInStack) {
          // Agregar el coach a la pila antes de la actividad
          newStack.push({
            type: 'coach',
            data: selectedCoachForProfile,
            context: null
          })
        }
      }
      
      // Agregar la actividad
      newStack.push({
        type: 'activity',
        data: activity,
        context: fromCoachProfile ? { fromCoachProfile: true, coachId } : null
      })
      
      console.log('🔍 SearchScreen: Navegando a actividad', {
        activityId: activity.id,
        activityTitle: activity.title,
        fromCoachProfile,
        newStackLength: newStack.length,
        stack: newStack.map(item => ({ type: item.type, id: item.data?.id || item.data?.title }))
      })
      return newStack
    })
    
    setSelectedActivity(activity)
    
    // Configurar contexto de navegación
    if (fromCoachProfile && coachId) {
      setNavigationContext({
        fromCoachProfile: true,
        coachId: coachId
      })
      // Cerrar temporalmente el modal del coach para mostrar el modal de actividad
      setIsCoachProfileModalOpen(false)
    } else {
      setNavigationContext(null)
    }
    
    setIsPreviewModalOpen(true)
  }

  // Función para regresar al perfil del coach
  const handleReturnToCoach = () => {
    setIsPreviewModalOpen(false)
    setSelectedActivity(null)
    setNavigationContext(null)
    
    // Reabrir el modal del perfil del coach
    if (selectedCoachForProfile) {
      setIsCoachProfileModalOpen(true)
    }
  }

  // Función para manejar el cierre de modales con pila de navegación
  const handleModalClose = useCallback(() => {
    // Cerrar inmediatamente sin esperar operaciones
    if (navigationStack.length === 0) {
      // Si no hay nada en la pila, cerrar todo y volver al search
      setIsPreviewModalOpen(false)
      setIsCoachProfileModalOpen(false)
      setSelectedActivity(null)
      setSelectedCoachForProfile(null)
      setNavigationContext(null)
      setNavigationStack([])
      return
    }
    
    // Obtener el último elemento de la pila
    const lastItem = navigationStack[navigationStack.length - 1]
    
    // Remover el último elemento de la pila
    const newStack = navigationStack.slice(0, -1)
    setNavigationStack(newStack)
    
    if (lastItem.type === 'activity') {
      // Si cerramos una actividad, verificar si hay un coach anterior
      const previousItem = newStack.length > 0 ? newStack[newStack.length - 1] : null
      
      if (previousItem && previousItem.type === 'coach') {
        // Volver al coach anterior
        setSelectedCoachForProfile(previousItem.data)
        setIsCoachProfileModalOpen(true)
        setIsPreviewModalOpen(false)
        setSelectedActivity(null)
      } else {
        // No hay coach anterior, volver al search
        setIsPreviewModalOpen(false)
        setIsCoachProfileModalOpen(false)
        setSelectedActivity(null)
        setSelectedCoachForProfile(null)
        setNavigationContext(null)
      }
    } else if (lastItem.type === 'coach') {
      // Si cerramos un coach, verificar si hay una actividad anterior
      const previousItem = newStack.length > 0 ? newStack[newStack.length - 1] : null
      
      if (previousItem && previousItem.type === 'activity') {
        // Volver a la actividad anterior
        setSelectedActivity(previousItem.data)
        setNavigationContext(previousItem.context)
        setIsPreviewModalOpen(true)
        setIsCoachProfileModalOpen(false)
        setSelectedCoachForProfile(null)
      } else {
        // No hay actividad anterior, volver al search
        setIsPreviewModalOpen(false)
        setIsCoachProfileModalOpen(false)
        setSelectedActivity(null)
        setSelectedCoachForProfile(null)
        setNavigationContext(null)
      }
    }
  }, [navigationStack])

  // Función para manejar el click en el coach desde una actividad
  const handleCoachClickFromActivity = async (coachId: string) => {
    
    try {
      // Buscar el coach en la lista de displayedCoaches
      const coach = displayedCoaches?.find(c => c.id === coachId)
      
      if (coach) {
        // Agregar coach a la pila de navegación
        setNavigationStack(prev => {
          const newStack = [...prev, {
            type: 'coach',
            data: coach,
            context: { fromActivity: true, activityId: selectedActivity?.id }
          }]
          
          console.log('👨‍💼 SearchScreen: Navegando a coach', {
            coachId: coach.id,
            coachName: coach.name || coach.full_name,
            fromActivity: true,
            newStackLength: newStack.length,
            stack: newStack.map(item => ({ type: item.type, id: item.data?.id || item.data?.title }))
          })
          return newStack
        })
        
        // Pre-cargar el coach para navegación futura
        preloadCoach(coach.id, coach)
        
        // Establecer el coach seleccionado y abrir su modal
        setSelectedCoachForProfile(coach)
        setIsCoachProfileModalOpen(true)
      } else {
        console.error("❌ Coach no encontrado en displayedCoaches:", coachId)
        // Fallback: intentar cargar el coach desde la API
        const response = await fetch(`/api/search-coaches`)
        if (response.ok) {
          const allCoaches = await response.json()
          const foundCoach = allCoaches.find((c: any) => c.id === coachId)
          if (foundCoach) {
            // Agregar coach a la pila de navegación
            setNavigationStack(prev => {
              const newStack = [...prev, {
                type: 'coach',
                data: foundCoach,
                context: { fromActivity: true, activityId: selectedActivity?.id }
              }]
              
              console.log('👨‍💼 SearchScreen: Navegando a coach encontrado', {
                coachId: foundCoach.id,
                coachName: foundCoach.name || foundCoach.full_name,
                fromActivity: true,
                newStackLength: newStack.length,
                stack: newStack.map(item => ({ type: item.type, id: item.data?.id || item.data?.title }))
              })
              return newStack
            })
            
            // Pre-cargar el coach para navegación futura
            preloadCoach(foundCoach.id, foundCoach)
            
            setSelectedCoachForProfile(foundCoach)
            setIsCoachProfileModalOpen(true)
          } else {
            console.error("❌ Coach no encontrado ni en displayedCoaches ni en API")
          }
        }
      }
    } catch (error) {
      console.error("❌ Error al cargar el perfil del coach:", error)
    }
  }

  // Convertir Activity a formato compatible con ProductPreviewModal
  const convertActivityToProduct = (activity: Activity) => {
    return {
      id: activity.id,
      title: activity.title,
      exercisesCount: activity.exercisesCount,
      totalSessions: activity.totalSessions,
      full_name: activity.full_name,
      specialization: activity.specialization,
      coach_name: activity.coach_name,
      coach_experience_years: activity.coach_experience_years,
      coach_avg_rating: activity.coach_rating,
      media: activity.media
    }
  }




  // Función optimizada para comprar actividad
  const handlePurchaseActivity2 = async (activityId: number) => {
    // Encontrar la actividad en la lista
    const activity = (activities || []).find((a) => a.id === activityId)
    if (activity) {
      openPurchaseModal(activity)
    } else {
      toast({
        title: "Error",
        description: "No se pudo encontrar la actividad",
        variant: "destructive",
      })
    }
  }

  const openPurchaseModal = (activity: Activity) => {
    console.log("Abriendo modal de compra para:", activity)
    setSelectedPurchaseActivity(activity)
    setPurchaseModalOpen(true)
  }

  const handlePurchaseComplete = (enrollment: any) => {
    console.log("Compra completada:", enrollment)

    // Cerrar el modal
    setPurchaseModalOpen(false)
    setSelectedPurchaseActivity(null)

    // Mostrar toast de éxito
    toast({
      title: "¡Compra exitosa!",
      description: `Has adquirido "${selectedPurchaseActivity?.title}" correctamente.`,
    })
  }

  // Las actividades se cargan automáticamente con useCachedActivities

  return (
    <div className="flex flex-col h-full bg-[#121212] text-white overflow-y-auto pb-4">

      {/* Main content */}
      <div className="px-4 pt-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-md font-medium flex items-center">
            <User className="h-5 w-5 mr-2 text-[#FF7939]" />
            Coaches
            </h2>
          <button 
            onClick={() => {
              const newExpanded = expandedSection === 'coaches' ? null : 'coaches'
              setExpandedSection(newExpanded)
              setShowAllCoaches(newExpanded === 'coaches')
              if (newExpanded !== 'coaches') {
                // Limpiar filtros cuando se colapsa
                setSearchTerm("")
                setSelectedCategory("all")
                setSelectedFitnessType("all")
                setShowFilters(false)
              }
            }}
            className="text-[#FF7939] flex items-center hover:text-[#FF6B00] transition-colors"
          >
            <span>{expandedSection === 'coaches' ? 'Ver menos' : 'Ver más'}</span>
            <ChevronRight 
              size={20} 
              className={`ml-1 transition-transform ${expandedSection === 'coaches' ? 'rotate-90' : ''}`} 
            />
          </button>
        </div>

        {/* Barra de búsqueda y filtros para coaches */}
        {expandedSection === 'coaches' && (
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar coaches por nombre o especialización..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-12 py-3 bg-[#2A2A2A] border border-[#3A3A3A] rounded-lg text-white placeholder:text-gray-400 focus:outline-none focus:border-[#FF7939] focus:ring-1 focus:ring-[#FF7939]"
              />
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-[#FF7939] transition-colors"
              >
                <Filter className="h-4 w-4" />
              </button>
            </div>

            {/* Filtros */}
            {showFilters && (
              <div className="mt-4 bg-[#1E1E1E] rounded-lg p-4 space-y-4">
                {/* Filtro de categoría */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Especialización
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {[
                      { value: "all", label: "Todos" },
                      { value: "nutricion", label: "Nutrición" },
                      { value: "fitness", label: "Fitness" }
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setSelectedCategory(option.value)
                          if (option.value !== "fitness") {
                            setSelectedFitnessType("all")
                          }
                        }}
                        className={`px-3 py-1 rounded-full text-sm transition-colors ${
                          selectedCategory === option.value
                            ? "bg-[#FF7939] text-white"
                            : "bg-[#3A3A3A] text-gray-300 hover:bg-[#4A4A4A]"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Filtro de tipo de fitness (solo si fitness está seleccionado) */}
                {selectedCategory === "fitness" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Tipo de fitness
                    </label>
                    <div className="flex gap-2 flex-wrap">
                      {[
                        { value: "all", label: "Todos" },
                        { value: "fuerza", label: "Fuerza" },
                        { value: "aerobico", label: "Aeróbico" },
                        { value: "deporte", label: "Deporte" },
                        { value: "funcional", label: "Funcional" }
                      ].map((option) => (
                        <button
                          key={option.value}
                          onClick={() => setSelectedFitnessType(option.value)}
                          className={`px-3 py-1 rounded-full text-sm transition-colors ${
                            selectedFitnessType === option.value
                              ? "bg-[#FF7939] text-white"
                              : "bg-[#3A3A3A] text-gray-300 hover:bg-[#4A4A4A]"
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Botón para limpiar filtros */}
                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      setSearchTerm("")
                      setSelectedCategory("all")
                      setSelectedFitnessType("all")
                    }}
                    className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    Limpiar filtros
                  </button>
                </div>
              </div>
            )}

            {/* Indicador de filtros activos */}
            {(searchTerm.trim() || selectedCategory !== "all" || selectedFitnessType !== "all") && (
              <div className="mt-2 flex items-center gap-2 text-xs text-[#FF7939]">
                <Filter className="h-3 w-3" />
                <span>Filtros activos:</span>
                {searchTerm.trim() && <span className="bg-[#FF7939]/20 px-2 py-1 rounded">"{searchTerm}"</span>}
                {selectedCategory !== "all" && <span className="bg-[#FF7939]/20 px-2 py-1 rounded">{selectedCategory}</span>}
                {selectedCategory === "fitness" && selectedFitnessType !== "all" && <span className="bg-[#FF7939]/20 px-2 py-1 rounded">{selectedFitnessType}</span>}
              </div>
            )}
          </div>
        )}

        {/* Loading state - Optimizado */}
        {isLoading && !filteredCoaches.length && (
          <div className="flex flex-col items-center justify-center py-10">
            <Loader2 className="h-8 w-8 text-[#FF7939] animate-spin mb-2" />
            <p className="text-gray-400 animate-pulse">Cargando coaches...</p>
          </div>
        )}


        {/* Empty state */}
        {/* Estados de carga y error */}
        {isLoading && (
          <div className="overflow-x-auto">
            <div className="flex gap-1" style={{ minWidth: "min-content" }}>
              {Array.from({ length: 3 }).map((_, index) => (
                <CoachCardSkeleton key={index} />
              ))}
            </div>
          </div>
        )}

        {/* Estado de error */}
        {!isLoading && error && (
          <div className="text-center py-10">
            <p className="text-red-400 mb-4">Error al cargar coaches</p>
            <button 
              onClick={handleRetry}
              className="bg-[#FF7939] hover:bg-[#FF6B00] text-white px-4 py-2 rounded-lg transition-colors"
            >
              Intentar de nuevo
            </button>
          </div>
        )}

        {/* Estado vacío */}
        {!isLoading && !error && filteredCoaches.length === 0 && (
          <NoCoachesFallback onRetry={handleRetry} />
        )}

        {/* Coach cards - Vista expandible */}
        {!isLoading && !error && filteredCoaches.length > 0 && (
          <div className={showAllCoaches ? "grid grid-cols-2 gap-4" : "overflow-x-auto"}>
            <div className={showAllCoaches ? "contents" : "flex gap-4"} style={!showAllCoaches ? { minWidth: "min-content" } : undefined}>
                     {filteredCoaches.map((coach) => {
                       return (
                         <CoachProfileCard 
                         key={coach.id}
                           coach={coach} 
                           size={showAllCoaches ? "medium" : "small"}
                           onClick={() => {
                             // Agregar coach a la pila de navegación (desde search)
                             setNavigationStack(prev => [...prev, {
                               type: 'coach',
                               data: coach,
                               context: { fromSearch: true }
                             }])
                             
                             // Pre-cargar el coach para navegación futura
                             preloadCoach(coach.id, coach)
                             
                             setSelectedCoachForProfile(coach)
                             setIsCoachProfileModalOpen(true)
                           }}
                         />
                       )
                     })}
            </div>
          </div>
        )}
      </div>

      <div className="px-4 pt-4">
        {/* Sección de Rutinas Destacadas */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-md font-medium flex items-center">
              <ShoppingCart className="h-5 w-5 mr-2 text-[#FF7939]" />
              Actividades
            </h2>
            <button 
              onClick={() => {
                const newExpanded = expandedSection === 'activities' ? null : 'activities'
                setExpandedSection(newExpanded)
                setShowAllActivities(newExpanded === 'activities')
                if (newExpanded !== 'activities') {
                  // Limpiar filtros cuando se colapsa
                  setSearchTerm("")
                  setSelectedProgramType("all")
                  setSelectedCategory("all")
                  setSelectedFitnessType("all")
                  setShowFilters(false)
                }
              }}
              className="text-[#FF7939] flex items-center hover:text-[#FF6B00] transition-colors"
            >
              <span>{expandedSection === 'activities' ? 'Ver menos' : 'Ver más'}</span>
              <ChevronRight 
                size={20} 
                className={`ml-1 transition-transform ${expandedSection === 'activities' ? 'rotate-90' : ''}`} 
              />
            </button>
          </div>

          {/* Barra de búsqueda y filtros para actividades */}
          {expandedSection === 'activities' && (
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar actividades por nombre o coach..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 bg-[#2A2A2A] border border-[#3A3A3A] rounded-lg text-white placeholder:text-gray-400 focus:outline-none focus:border-[#FF7939] focus:ring-1 focus:ring-[#FF7939]"
                />
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-[#FF7939] transition-colors"
                >
                  <Filter className="h-4 w-4" />
                </button>
              </div>

              {/* Filtros */}
              {showFilters && (
                <div className="mt-4 bg-[#1E1E1E] rounded-lg p-4 space-y-4">
                  {/* Filtro de tipo de programa */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Tipo de programa
                    </label>
                    <div className="flex gap-2 flex-wrap">
                      {[
                        { value: "all", label: "Todos" },
                        { value: "programa", label: "Programa" },
                        { value: "taller", label: "Taller" },
                        { value: "documento", label: "Documento" }
                      ].map((option) => (
                        <button
                          key={option.value}
                          onClick={() => setSelectedProgramType(option.value)}
                          className={`px-3 py-1 rounded-full text-sm transition-colors ${
                            selectedProgramType === option.value
                              ? "bg-[#FF7939] text-white"
                              : "bg-[#3A3A3A] text-gray-300 hover:bg-[#4A4A4A]"
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Filtro de categoría */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Categoría
                    </label>
                    <div className="flex gap-2 flex-wrap">
                      {[
                        { value: "all", label: "Todos" },
                        { value: "nutricion", label: "Nutrición" },
                        { value: "fitness", label: "Fitness" }
                      ].map((option) => (
                        <button
                          key={option.value}
                          onClick={() => {
                            setSelectedCategory(option.value)
                            if (option.value !== "fitness") {
                              setSelectedFitnessType("all")
                            }
                          }}
                          className={`px-3 py-1 rounded-full text-sm transition-colors ${
                            selectedCategory === option.value
                              ? "bg-[#FF7939] text-white"
                              : "bg-[#3A3A3A] text-gray-300 hover:bg-[#4A4A4A]"
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Filtro de tipo de fitness (solo si fitness está seleccionado) */}
                  {selectedCategory === "fitness" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Tipo de fitness
                      </label>
                      <div className="flex gap-2 flex-wrap">
                        {[
                          { value: "all", label: "Todos" },
                          { value: "fuerza", label: "Fuerza" },
                          { value: "aerobico", label: "Aeróbico" },
                          { value: "deporte", label: "Deporte" },
                          { value: "funcional", label: "Funcional" }
                        ].map((option) => (
                          <button
                            key={option.value}
                            onClick={() => setSelectedFitnessType(option.value)}
                            className={`px-3 py-1 rounded-full text-sm transition-colors ${
                              selectedFitnessType === option.value
                                ? "bg-[#FF7939] text-white"
                                : "bg-[#3A3A3A] text-gray-300 hover:bg-[#4A4A4A]"
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Botón para limpiar filtros */}
                  <div className="flex justify-end">
                    <button
                      onClick={() => {
                        setSearchTerm("")
                        setSelectedProgramType("all")
                        setSelectedCategory("all")
                        setSelectedFitnessType("all")
                      }}
                      className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                    >
                      Limpiar filtros
                    </button>
                  </div>
                </div>
              )}

              {/* Indicador de filtros activos */}
              {(searchTerm.trim() || selectedProgramType !== "all" || selectedCategory !== "all" || selectedFitnessType !== "all") && (
                <div className="mt-2 flex items-center gap-2 text-xs text-[#FF7939]">
                  <Filter className="h-3 w-3" />
                  <span>Filtros activos:</span>
                  {searchTerm.trim() && <span className="bg-[#FF7939]/20 px-2 py-1 rounded">"{searchTerm}"</span>}
                  {selectedProgramType !== "all" && <span className="bg-[#FF7939]/20 px-2 py-1 rounded">{selectedProgramType}</span>}
                  {selectedCategory !== "all" && <span className="bg-[#FF7939]/20 px-2 py-1 rounded">{selectedCategory}</span>}
                  {selectedCategory === "fitness" && selectedFitnessType !== "all" && <span className="bg-[#FF7939]/20 px-2 py-1 rounded">{selectedFitnessType}</span>}
                </div>
              )}
            </div>
          )}

          {isLoadingActivities || !activities ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 text-[#FF7939] animate-spin" />
            </div>
          ) : (
            <div className={showAllActivities ? "grid grid-cols-2 gap-4" : "overflow-x-auto"}>
              <div className={showAllActivities ? "contents" : "flex gap-4"} style={{ minWidth: "min-content" }}>
                {(activities || []).map((activity) => (
                  <ActivityCard 
                    key={activity.id}
                    activity={activity} 
                    size={showAllActivities ? "medium" : "small"}
                    onClick={(selectedActivity) => {
                      handleActivityClick(selectedActivity)
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>


      {/* Activity Preview Modal */}
      {selectedActivity && (
        <>
          <ClientProductModal
            product={selectedActivity}
            isOpen={isPreviewModalOpen}
            onClose={handleModalClose}
            navigationContext={navigationContext}
            onTabChange={onTabChange}
            onCoachClick={(coachId) => {
              const coach = displayedCoaches?.find(c => c.id === coachId)
              if (coach) {
                setSelectedCoachForProfile(coach)
                setIsCoachProfileModalOpen(true)
              }
            }}
          />
        </>
      )}

      {/* Coach Profile Modal */}
      {selectedCoachForProfile && (
        <CoachProfileModal
          coach={selectedCoachForProfile}
          isOpen={isCoachProfileModalOpen}
          onClose={() => {
            handleModalClose()
          }}
          onActivityClick={handleActivityClick}
          preloadedActivities={allActivities} // Pasar todas las actividades ya cargadas (sin filtrar)
        />
      )}

    </div>
  )
}
