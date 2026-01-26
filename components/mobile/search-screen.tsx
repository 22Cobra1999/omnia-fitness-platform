
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
  ArrowLeft,
  ChefHat,
  Dumbbell,
  Zap, // Using Zap instead of Yoga if not found, or Activity
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
  specialization?: string
  location?: string
  full_name?: string
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
  const [selectedProgramType, setSelectedProgramType] = useState<string>("all")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [selectedFitnessType, setSelectedFitnessType] = useState<string>("all")
  const [isSearching, setIsSearching] = useState(false)
  const [expandedSection, setExpandedSection] = useState<'coaches' | 'activities' | null>(null)

  // Nuevos estados para el flujo de búsqueda refinado
  const [searchStage, setSearchStage] = useState<'initial' | 'expanded' | 'categorySelected'>('initial')
  const [selectedObjectives, setSelectedObjectives] = useState<string[]>([])
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)

  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null)

  // Listener para resetear al origen cuando se presiona el tab activo
  useEffect(() => {
    const handleResetToOrigin = (event: CustomEvent) => {
      const { tab } = event.detail
      if (tab === 'search') {
        setSearchTerm("")
        setSelectedProgramType("all")
        setSelectedCategory("all")
        setSelectedFitnessType("all")
        setShowFilters(false)
        setSelectedActivity(null)
        setSelectedCoachForProfile(null)
        setShowAllActivities(false)
        setShowAllCoaches(false)
        setExpandedSection(null)
        setSearchStage('initial')
        setSelectedObjectives([])
        setSearchSuggestions([])
        setShowSuggestions(false)
        setPurchaseModalOpen(false)
        setIsPreviewModalOpen(false)

        setTimeout(() => {
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }, 100)
      }
    }

    window.addEventListener('reset-tab-to-origin', handleResetToOrigin as EventListener)
    return () => {
      window.removeEventListener('reset-tab-to-origin', handleResetToOrigin as EventListener)
    }
  }, [])

  const [allActivities, setAllActivities] = useState<Activity[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [isLoadingActivities, setIsLoadingActivities] = useState(false)
  const [activitiesError, setActivitiesError] = useState<Error | null>(null)
  const activitiesCacheRef = useRef<{ data: Activity[]; timestamp: number } | null>(null)
  const CACHE_DURATION = 5 * 60 * 1000

  const [allCoaches, setAllCoaches] = useState<Coach[]>([])
  const [displayedCoaches, setDisplayedCoaches] = useState<Coach[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const { toast } = useToast()
  const router = useRouter()
  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false)
  const [selectedPurchaseActivity, setSelectedPurchaseActivity] = useState<Activity | null>(null)
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false)
  const [isCoachProfileModalOpen, setIsCoachProfileModalOpen] = useState(false)
  const [selectedCoachForProfile, setSelectedCoachForProfile] = useState<Coach | null>(null)
  const [navigationContext, setNavigationContext] = useState<{
    coachId?: string
    onReturnToCoach?: () => void
    fromCoachProfile?: boolean
  } | undefined>(undefined)

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
        specialization: coach.specialization || coach.specialty,
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
    preloadCoach: (id: string, coach: any) => { },
    cacheCoach: (id: string, coach: any, activities: any[]) => { },
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

  // Sugerencias de búsqueda predefinidas
  const SUGGESTIONS_MAP: Record<string, string[]> = {
    fitness: ["fuerza", "futbol", "aerobico", "funcional", "crossfit", "yoga", "pilates", "running", "masa muscular"],
    nutricion: ["mediterranea", "mejorar fisico", "keto", "paleo", "vegano", "vegetariano", "proteinas", "deficit calorico"],
    all: ["fuerza", "nutricion", "fitness", "yoga", "futbol", "masa muscular"]
  }

  // Manejar cambio en término de búsqueda y generar sugerencias
  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    if (value.length >= 1) {
      const currentCat = selectedCategory === 'all' ? 'all' : selectedCategory
      const relevantSuggestions = SUGGESTIONS_MAP[currentCat] || SUGGESTIONS_MAP.all
      const filtered = relevantSuggestions.filter(s =>
        s.toLowerCase().includes(value.toLowerCase())
      )
      setSearchSuggestions(filtered)
      setShowSuggestions(filtered.length > 0)
    } else {
      setSearchSuggestions([])
      setShowSuggestions(false)
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    setSearchTerm(suggestion)
    setShowSuggestions(false)
  }

  // Objetivos comunes
  const COMMON_OBJECTIVES = [
    "pérdida de peso", "masa muscular", "resistencia", "flexibilidad", "salud mental", "bienestar", "rendimiento"
  ]

  // Function to render specialty icon
  const renderSpecialtyIcon = (specialty: string) => {
    switch (specialty) {
      case "nutrition":
        return <ChefHat className="h-6 w-6 text-white" />
      case "gym":
        return <Dumbbell className="h-6 w-6 text-white" />
      case "fitness":
      default:
        return <Zap className="h-6 w-6 text-white" />
    }
  }


  // Estados para datos originales (sin filtrar) - eliminados duplicados

  // Función para filtrar coaches localmente
  const filterCoaches = (coaches: Coach[]) => {
    return coaches.filter(coach => {
      // Filtro por objetivo (nuevo)
      if (selectedObjectives.length > 0) {
        const coachSpecialties = (coach.specialization || "").toLowerCase()
        const coachBio = (coach.bio || "").toLowerCase()
        const hasMatch = selectedObjectives.some(obj =>
          coachSpecialties.includes(obj.toLowerCase()) ||
          coachBio.includes(obj.toLowerCase())
        )
        if (!hasMatch) return false
      }

      // Deep search in objectives (nuevo)
      if (searchTerm.trim()) {
        const searchLower = searchTerm.toLowerCase()
        const coachSpecialties = (coach.specialization || "").toLowerCase()
        const coachBio = (coach.bio || "").toLowerCase()
        const matchesText = coach.name?.toLowerCase().includes(searchLower) ||
          coachSpecialties.includes(searchLower) ||
          coachBio.includes(searchLower)
        if (!matchesText) return false
      }

      // Filtro por categoría
      if (selectedCategory !== "all") {
        if (selectedCategory === "fitness") {
          const isFitness = coach.specialization?.toLowerCase().includes("fitness") ||
            coach.specialization?.toLowerCase().includes("gym") ||
            coach.specialization?.toLowerCase().includes("deporte") || false
          if (!isFitness) return false
        } else if (selectedCategory === "nutricion") {
          if (!coach.specialization?.toLowerCase().includes("nutricion")) return false
        } else if (selectedCategory === "general") {
          const isFitness = coach.specialization?.toLowerCase().includes("fitness") || false
          const isNutricion = coach.specialization?.toLowerCase().includes("nutricion") || false
          if (isFitness || isNutricion) return false
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
      // Filtro por objetivo (corregido)
      if (selectedObjectives.length > 0) {
        const activityObjectives = (activity as any).objetivos || []
        const hasMatch = selectedObjectives.some(obj =>
          activityObjectives.some((aObj: any) => aObj.toLowerCase().includes(obj.toLowerCase()))
        )
        if (!hasMatch) return false
      }

      // Deep search in objectives (nuevo)
      if (searchTerm.trim()) {
        const searchLower = searchTerm.toLowerCase()
        const title = activity.title?.toLowerCase() || ''
        const coach = activity.coach_name?.toLowerCase() || ''
        const objectives = (activity as any).objetivos || []
        const matchesText = title.includes(searchLower) ||
          coach.includes(searchLower) ||
          objectives.some((obj: string) => obj.toLowerCase().includes(searchLower))
        if (!matchesText) return false
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
  }, [allCoaches, searchTerm, selectedCategory, selectedFitnessType, selectedObjectives, expandedSection])

  const filteredActivities = useMemo(() => {
    if (expandedSection !== 'activities') {
      return activities || []
    }
    return filterActivities(allActivities)
  }, [allActivities, searchTerm, selectedProgramType, selectedCategory, selectedFitnessType, selectedObjectives, expandedSection])

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
      setNavigationContext(undefined)
    }

    setIsPreviewModalOpen(true)
  }

  // Función para regresar al perfil del coach
  const handleReturnToCoach = () => {
    setIsPreviewModalOpen(false)
    setSelectedActivity(null)
    setNavigationContext(undefined)

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
      setNavigationContext(undefined)
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
        setNavigationContext(undefined)
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
        setNavigationContext(undefined)
      }
    }
  }, [navigationStack])

  // Función para manejar el click en el coach desde una actividad
  const handleCoachClickFromActivity = async (coachId: string) => {

    try {
      // Buscar el coach en la lista de displayedCoaches
      const coach = displayedCoaches?.find(c => c.id === coachId)

      if (coach) {
        setNavigationStack(prev => {
          const newTypedStack: Array<{ type: 'activity' | 'coach'; data: any; context?: any }> = [...prev, {
            type: 'coach' as const,
            data: coach,
            context: { fromActivity: true, activityId: selectedActivity?.id }
          }]
          return newTypedStack
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
              const newTypedStack: Array<{ type: 'activity' | 'coach'; data: any; context?: any }> = [...prev, {
                type: 'coach' as const,
                data: foundCoach,
                context: { fromActivity: true, activityId: selectedActivity?.id }
              }]
              return newTypedStack
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
      coach_experience_years: activity.coach_experience_years || 0,
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
        {/* Header integrado cuando está expandido */}
        {expandedSection && (
          <div className="space-y-4 mb-6">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setExpandedSection(null)
                  setShowAllCoaches(false)
                  setShowAllActivities(false)
                }}
                className="flex items-center justify-center w-10 h-10 rounded-full bg-white/5 border border-white/10 text-[#FF7939] hover:bg-white/10 transition-all"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>

              <div className="flex flex-1 items-center gap-2 overflow-hidden">
                <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-1">
                  {[
                    { id: 'fitness', label: 'Fitness', icon: <Dumbbell className="w-3 h-3" /> },
                    { id: 'nutricion', label: 'Nutrición', icon: <ChefHat className="w-3 h-3" /> },
                    ...(expandedSection === 'coaches' ? [{ id: 'general', label: 'General', icon: <Zap className="w-3 h-3" /> }] : [])
                  ].map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setSelectedCategory(prev => prev === cat.id ? 'all' : cat.id)
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all ${selectedCategory === cat.id
                        ? 'bg-[#FF7939] border-[#FF7939] text-white shadow-[0_0_10px_rgba(255,121,57,0.2)]'
                        : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'
                        }`}
                    >
                      {cat.icon}
                      <span className="text-[11px] font-bold whitespace-nowrap">{cat.label}</span>
                    </button>
                  ))}
                </div>

                <div className="relative flex-1 min-w-[120px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        setShowSuggestions(false)
                      }
                    }}
                    placeholder="Buscar..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-[#FF7939]/50 transition-all"
                    onFocus={() => setShowSuggestions(searchSuggestions.length > 0)}
                  />
                  {showSuggestions && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-[#1A1A1A] border border-white/10 rounded-xl overflow-hidden z-50 shadow-2xl">
                      {searchSuggestions.map((suggestion, i) => (
                        <button
                          key={i}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="w-full text-left px-4 py-2 hover:bg-white/10 text-xs text-white/80 transition-colors border-b border-white/5 last:border-0"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Objetivos en una sola fila con scroll horizontal */}
            <div className="space-y-2">
              <div className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] pl-1">Filtrar por Objetivos</div>
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 px-0.5">
                {COMMON_OBJECTIVES.map(obj => (
                  <button
                    key={obj}
                    onClick={() => {
                      setSelectedObjectives(prev =>
                        prev.includes(obj) ? prev.filter(o => o !== obj) : [...prev, obj]
                      )
                    }}
                    className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${selectedObjectives.includes(obj)
                      ? 'bg-[#FF7939]/20 border-[#FF7939] text-[#FF7939]'
                      : 'bg-white/5 border-white/5 text-white/30 hover:bg-white/10'
                      }`}
                  >
                    {obj}
                  </button>
                ))}
              </div>
            </div>

            {/* Contador, Search Tag y Borrar Filtros */}
            <div className="flex items-center gap-3 pl-1 overflow-x-auto no-scrollbar">
              <div className="text-xs text-white/40 whitespace-nowrap">
                Encontramos <span className="text-[#FF7939] font-black">
                  {expandedSection === 'coaches' ? filteredCoaches.length : filteredActivities.length}
                </span> resultados
              </div>

              {/* Tag de término de búsqueda borrable */}
              {searchTerm && (
                <div className="flex items-center gap-2 bg-[#FF7939]/10 border border-[#FF7939]/20 px-3 py-1 rounded-full flex-shrink-0">
                  <span className="text-[11px] font-bold text-[#FF7939]">{searchTerm}</span>
                  <button
                    onClick={() => setSearchTerm("")}
                    className="p-0.5 hover:bg-[#FF7939]/20 rounded-full text-[#FF7939] transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}

              {(searchTerm || selectedCategory !== 'all' || selectedObjectives.length > 0) && (
                <button
                  onClick={() => {
                    setSearchTerm("")
                    setSelectedCategory("all")
                    setSelectedObjectives([])
                    setSelectedFitnessType("all")
                    setSelectedProgramType("all")
                  }}
                  className="text-[11px] text-[#FF7939] hover:underline font-black uppercase tracking-wider flex-shrink-0"
                >
                  Borrar todo
                </button>
              )}
            </div>
          </div>
        )}

        {(expandedSection === null || expandedSection === 'coaches') && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-md font-medium flex items-center">
                <User className="h-5 w-5 mr-2 text-[#FF7939]" />
                Coaches
              </h2>
            </div>

            {/* Barra de búsqueda y filtros para coaches eliminada para evitar duplicidad con la barra superior de flujo */}

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

            {/* Coach cards - Restaurado scroll horizontal */}
            {!isLoading && !error && filteredCoaches.length > 0 && (
              <div className="overflow-x-auto no-scrollbar">
                <div className="flex gap-4 pb-4 px-1" style={{ minWidth: "min-content" }}>
                  {filteredCoaches.map((coach) => {
                    return (
                      <CoachProfileCard
                        key={coach.id}
                        coach={coach}
                        size="small"
                        onClick={() => {
                          console.log("🖱️ [SearchScreen] Clicked coach card:", coach.id, {
                            name: coach.name,
                            avatar: coach.avatar_url,
                            location: coach.location
                          });
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
        )}

        {(expandedSection === null || expandedSection === 'activities') && (
          <div className="px-4 pt-4">
            {/* Sección de Rutinas Destacadas */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-md font-medium flex items-center">
                  <ShoppingCart className="h-5 w-5 mr-2 text-[#FF7939]" />
                  Actividades
                </h2>
              </div>

              {/* Barra de búsqueda y filtros para actividades eliminada para evitar duplicidad */}

              {isLoadingActivities || !activities ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 text-[#FF7939] animate-spin" />
                </div>
              ) : (
                <div className="overflow-x-auto no-scrollbar">
                  <div className="flex gap-4 pb-4 px-1" style={{ minWidth: "min-content" }}>
                    {(activities || []).map((activity) => (
                      <ActivityCard
                        key={activity.id}
                        activity={activity}
                        size="small"
                        onClick={handleActivityClick}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}


        {/* Activity Preview Modal */}
        {selectedActivity && (
          <>
            <ClientProductModal
              product={selectedActivity}
              isOpen={isPreviewModalOpen}
              onClose={handleModalClose}
              navigationContext={navigationContext}
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
              setIsCoachProfileModalOpen(false)
              setSelectedCoachForProfile(null)
            }}
            onActivityClick={handleActivityClick}
            preloadedActivities={allActivities} // Pasar todas las actividades ya cargadas (sin filtrar)
          />
        )}
      </div>
    </div>
  )
}
