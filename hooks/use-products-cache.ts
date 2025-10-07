"use client"

import { useState, useEffect, useRef } from "react"
import { createClient } from '@/lib/supabase-browser'
import { useToast } from "@/components/ui/use-toast"

// Tipo para las actividades/productos
export interface Activity {
  id: number
  title: string
  description: string
  type: string
  difficulty: string
  duration: number | null
  price: number
  image_url: string | null
  video_url: string | null
  is_public: boolean
  created_at: string
  coach_id: string
  availability_type?: string
}

// Estructura del caché
interface CacheData {
  activities: Activity[]
  timestamp: number
  userId: string
}

// Caché global para compartir entre instancias del hook
let globalCache: CacheData | null = null

// Tiempo de expiración del caché en milisegundos (10 minutos)
const CACHE_EXPIRATION = 10 * 60 * 1000

// Tiempo máximo de carga antes de mostrar datos de fallback (10 segundos)
const LOADING_TIMEOUT = 10000

export function useProductsCache() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()
  const supabase = createClient()

  // Referencia para el timeout de carga
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  // Referencia para controlar si el componente está montado
  const isMountedRef = useRef(true)
  // Referencia para controlar si hay una carga en progreso
  const isLoadingRef = useRef(false)

  // Datos de fallback para mostrar mientras se cargan los datos reales
  const FALLBACK_ACTIVITIES: Activity[] = [
    {
      id: 1,
      title: "HIIT Intenso",
      description: "Entrenamiento de alta intensidad para quemar calorías y mejorar la resistencia cardiovascular",
      price: 19.99,
      type: "program",
      difficulty: "intermediate",
      duration: 45,
      image_url: "/placeholder-1qe7z.png",
      is_public: true,
      created_at: new Date().toISOString(),
      coach_id: "fallback1",
      availability_type: "immediate_purchase",
    },
    {
      id: 2,
      title: "Travel - sin elementos",
      description: "Rutina para hacer en cualquier lugar sin necesidad de equipamiento",
      price: 12.99,
      type: "course",
      difficulty: "beginner",
      duration: 30,
      image_url: "/placeholder-akuc0.png",
      is_public: true,
      created_at: new Date().toISOString(),
      coach_id: "fallback1",
      availability_type: "immediate_purchase",
    },
  ]

  // Función para verificar si el caché es válido
  const isCacheValid = async () => {
    if (!globalCache) return false

    // Verificar si el caché ha expirado
    const now = Date.now()
    if (now - globalCache.timestamp > CACHE_EXPIRATION) return false

    // Verificar si el usuario actual es el mismo que el del caché
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      return user?.id === globalCache.userId
    } catch (error) {
      console.error("Error verificando usuario:", error)
      return false
    }
  }

  // Función para cargar datos desde la API
  const fetchActivities = async (force = false) => {
    // Si ya hay una carga en progreso, no iniciar otra
    if (isLoadingRef.current) {
      console.log("Ya hay una carga en progreso, ignorando solicitud")
      return activities
    }

    try {
      setLoading(true)
      setError(null)
      isLoadingRef.current = true

      // Configurar un timeout para mostrar datos de fallback si la carga tarda demasiado
      loadingTimeoutRef.current = setTimeout(() => {
        if (isMountedRef.current && loading) {
          console.log("Timeout de carga alcanzado, mostrando datos de fallback")
          setActivities(FALLBACK_ACTIVITIES)
          setLoading(false)
          toast({
            title: "Tiempo de espera agotado",
            description: "Mostrando datos temporales mientras se completa la carga",
            variant: "destructive",
          })
        }
      }, LOADING_TIMEOUT)

      // Verificar si podemos usar el caché
      if (!force && (await isCacheValid())) {
        console.log("Usando datos en caché")
        clearTimeout(loadingTimeoutRef.current)
        if (isMountedRef.current) {
          setActivities(globalCache!.activities)
          setLastUpdated(new Date(globalCache!.timestamp))
          setLoading(false)
        }
        isLoadingRef.current = false
        return globalCache!.activities
      }

      // Obtener el usuario actual
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError) {
        console.error("Error de autenticación:", userError)
        clearTimeout(loadingTimeoutRef.current)
        if (isMountedRef.current) {
          setError("Error de autenticación")
          toast({
            title: "Error de autenticación",
            description: "Por favor inicia sesión para ver tus productos",
            variant: "destructive",
          })
          setActivities(FALLBACK_ACTIVITIES)
          setLoading(false)
        }
        isLoadingRef.current = false
        return FALLBACK_ACTIVITIES
      }

      if (!user) {
        console.log("No hay usuario autenticado")
        clearTimeout(loadingTimeoutRef.current)
        if (isMountedRef.current) {
          setError("No autenticado")
          toast({
            title: "No autenticado",
            description: "Debes iniciar sesión para ver tus productos",
          })
          setActivities(FALLBACK_ACTIVITIES)
          setLoading(false)
        }
        isLoadingRef.current = false
        return FALLBACK_ACTIVITIES
      }

      console.log("Cargando productos para usuario:", user.id)

      // Obtener las actividades del coach
      const { data, error } = await supabase
        .from("activities") // Corrected table name
        .select("*")
        .eq("coach_id", user.id)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching activities:", error)
        clearTimeout(loadingTimeoutRef.current)
        if (isMountedRef.current) {
          setError(error.message)
          toast({
            title: "Error",
            description: "No se pudieron cargar los productos. Usando datos temporales.",
            variant: "destructive",
          })
          setActivities(FALLBACK_ACTIVITIES)
          setLoading(false)
        }
        isLoadingRef.current = false
        return FALLBACK_ACTIVITIES
      }

      console.log("Actividades cargadas:", data?.length || 0)

      const result = data && data.length > 0 ? data : FALLBACK_ACTIVITIES

      // Actualizar el caché global
      globalCache = {
        activities: result,
        timestamp: Date.now(),
        userId: user.id,
      }

      // Actualizar el estado
      clearTimeout(loadingTimeoutRef.current)
      if (isMountedRef.current) {
        setActivities(result)
        setLastUpdated(new Date())
        setLoading(false)
      }
      isLoadingRef.current = false
      return result
    } catch (error) {
      console.error("Error inesperado:", error)
      clearTimeout(loadingTimeoutRef.current)
      if (isMountedRef.current) {
        setError(error instanceof Error ? error.message : "Error desconocido")
        toast({
          title: "Error",
          description: "Ocurrió un error inesperado. Usando datos temporales.",
          variant: "destructive",
        })
        setActivities(FALLBACK_ACTIVITIES)
        setLoading(false)
      }
      isLoadingRef.current = false
      return FALLBACK_ACTIVITIES
    }
  }

  // Función para actualizar un producto en el caché
  const updateProductInCache = (updatedProduct: Activity) => {
    if (!globalCache) return

    const updatedActivities = globalCache.activities.map((activity) =>
      activity.id === updatedProduct.id ? updatedProduct : activity,
    )

    globalCache = {
      ...globalCache,
      activities: updatedActivities,
      timestamp: Date.now(),
    }

    setActivities(updatedActivities)
    setLastUpdated(new Date())
  }

  // Función para añadir un producto al caché
  const addProductToCache = (newProduct: Activity) => {
    if (!globalCache) {
      fetchActivities(true) // Forzar recarga si no hay caché
      return
    }

    const updatedActivities = [newProduct, ...globalCache.activities]

    globalCache = {
      ...globalCache,
      activities: updatedActivities,
      timestamp: Date.now(),
    }

    setActivities(updatedActivities)
    setLastUpdated(new Date())
  }

  // Función para eliminar un producto del caché
  const removeProductFromCache = (productId: number) => {
    if (!globalCache) return

    const updatedActivities = globalCache.activities.filter((activity) => activity.id !== productId)

    globalCache = {
      ...globalCache,
      activities: updatedActivities,
      timestamp: Date.now(),
    }

    setActivities(updatedActivities)
    setLastUpdated(new Date())
  }

  // Efecto para cargar datos al montar el componente
  useEffect(() => {
    isMountedRef.current = true

    // Solo cargar si no hay datos en el caché o si el caché ha expirado
    const checkCacheAndLoad = async () => {
      if (await isCacheValid()) {
        console.log("Usando caché existente al montar")
        setActivities(globalCache!.activities)
        setLastUpdated(new Date(globalCache!.timestamp))
        setLoading(false)
      } else {
        fetchActivities()
      }
    }

    checkCacheAndLoad()

    // Limpiar al desmontar
    return () => {
      isMountedRef.current = false
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current)
      }
    }
  }, [])

  return {
    activities,
    loading,
    error,
    lastUpdated,
    refreshActivities: (force = false) => fetchActivities(force),
    updateProductInCache,
    addProductToCache,
    removeProductFromCache,
    isCacheExpired: async () => !(await isCacheValid()),
  }
}
