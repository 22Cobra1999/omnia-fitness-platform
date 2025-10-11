
"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import {
  Star,
  Loader2,
  ShoppingCart,
  ChevronRight,
  User,
  X,
} from "lucide-react"
import Image from "next/image"
import { trackComponent, trackAPI } from "@/lib/usage-tracker"
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
}
import { extractVimeoId } from "@/utils/vimeo-utils"
import { VimeoPlayer } from "@/components/vimeo-player"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { PurchaseActivityModal } from "@/components/purchase-activity-modal"
import ClientProductModal from "@/components/client-product-modal"
import CoachCard from "@/components/CoachCard"
import ActivityCard from "@/components/ActivityCard"
import ProductPreviewModal from "@/components/product-preview-modal"
// import CoachProfileModal from "@/components/CoachProfileModal"
import { NoCoachesFallback, NoActivitiesFallback, NetworkErrorFallback, LoadingFallback } from "@/components/fallback-states"
import { CoachCardSkeleton, ActivityCardSkeleton } from "@/components/global-loading"
// import { useSmartCoachCache } from "@/hooks/use-smart-coach-cache"
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

export function SearchScreen() {
  // Rastrear uso del componente
  useEffect(() => {
    trackComponent('SearchScreen')
  }, [])

  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null)
  const [activities, setActivities] = useState<Activity[]>([])
  const [isLoadingActivities, setIsLoadingActivities] = useState(false)
  const [activitiesError, setActivitiesError] = useState<Error | null>(null)
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
      setDisplayedCoaches(coaches)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'))
    } finally {
      setIsLoading(false)
    }
  }

  // Función para cargar actividades
  const loadActivities = async () => {
    try {
      setIsLoadingActivities(true)
      setActivitiesError(null)
      trackAPI('/api/activities/search', 'GET')
      const response = await fetch('/api/activities/search')
      if (!response.ok) throw new Error('Failed to fetch activities')
      const activities = await response.json()
      setActivities(activities)
    } catch (err) {
      setActivitiesError(err instanceof Error ? err : new Error('Unknown error'))
    } finally {
      setIsLoadingActivities(false)
    }
  }
  
  // Hook para cache inteligente de coaches - reemplazado con funciones vacías
  const { preloadCoach, cacheCoach, getCacheStats } = {
    preloadCoach: () => {},
    cacheCoach: () => {},
    getCacheStats: () => ({})
  }

  // Cargar datos al montar el componente
  useEffect(() => {
    loadCoaches()
    loadActivities()
  }, [])
  
  

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

  // Función para manejar reintento
  const handleRetry = () => {
    loadCoaches()
    loadActivities()
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


  // Usar directamente displayedCoaches ya que eliminamos los filtros
  // Memoizar filteredCoaches para evitar re-renders innecesarios
  const filteredCoaches = useMemo(() => {
    return displayedCoaches || []
  }, [displayedCoaches])


  const handleActivityClick = (activity: Activity, fromCoachProfile = false, coachId?: string) => {
    // usage.onClick(activity.id, { fromCoachProfile, coachId }) // Removido - variable no definida
    
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
  const handleModalClose = () => {
    
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
  }

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



  // Función para buscar actividades
  const handleSearch = async () => {
    if (!baseScreen.searchTerm.trim()) return

    setIsSearching(true)
    try {
      const response = await fetch(`/api/activities/search?term=${encodeURIComponent(baseScreen.searchTerm)}`)

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`)
      }

      const data = await response.json()
      setActivities(data)
    } catch (error) {
      console.error("Error al buscar actividades:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar las actividades",
        variant: "destructive",
      })
    } finally {
      setIsSearching(false)
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
          <Link href="/coaches" className="text-[#FF7939] flex items-center">
            <span>Ver más</span>
            <ChevronRight size={20} className="ml-1" />
          </Link>
        </div>

        {/* Filters */}
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
        {!isLoading && error && !isOnline && (
          <NetworkErrorFallback onRetry={handleRetry} />
        )}

        {!isLoading && error && isOnline && (
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

        {/* Coach cards - Horizontal design like the reference image */}
        {!isLoading && !error && filteredCoaches.length > 0 && (
          <div className="overflow-x-auto">
            <div className="flex gap-1" style={{ minWidth: "min-content" }}>
            {filteredCoaches.map((coach) => {
              return (
                <CoachCard 
                key={coach.id}
                  coach={coach} 
                  size="horizontal"
                  onClick={(selectedCoach) => {
                    // Agregar coach a la pila de navegación (desde search)
                    setNavigationStack(prev => [...prev, {
                      type: 'coach',
                      data: selectedCoach,
                      context: { fromSearch: true }
                    }])
                    
                    // Pre-cargar el coach para navegación futura
                    preloadCoach(selectedCoach.id, selectedCoach)
                    
                    setSelectedCoachForProfile(selectedCoach)
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
        <div className="mb-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-md font-medium flex items-center">
              <ShoppingCart className="h-5 w-5 mr-2 text-[#FF7939]" />
              Actividades
            </h2>
            <Link href="/activities" className="text-[#FF7939] flex items-center">
              <span>Ver más</span>
              <ChevronRight size={20} className="ml-1" />
            </Link>
          </div>

          {isLoadingActivities || !activities ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 text-[#FF7939] animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="flex gap-4" style={{ minWidth: "min-content" }}>
                {(activities || []).map((activity) => (
                  <ActivityCard 
                    key={activity.id}
                    activity={activity} 
                    size="small"
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
            hasSelectedActivity: !!selectedActivity,
            isPreviewModalOpen,
            activityTitle: selectedActivity?.title,
            coachModalOpen: isCoachProfileModalOpen,
            navigationContext: navigationContext
          })}
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
            handleModalClose()
          }}
          onActivityClick={handleActivityClick}
          preloadedActivities={activities} // Pasar actividades ya cargadas
        />
      )}

    </div>
  )
}
