"use client"

import { useCallback, useEffect, useState } from 'react'
import { useSmartDataLoader } from './use-smart-data-loader'

interface ActivityFilters {
  type?: string | null
  difficulty?: string | null
  coachId?: string | null
  searchTerm?: string | null
}

interface OptimizedActivity {
  id: number
  title: string
  description: string
  type: string
  difficulty: string
  price: number
  coach_id: string
  created_at: string
  rating: number
  total_reviews: number
  coach_name: string
  coach_avatar?: string
  media?: {
    id: number
    media_type: string
    media_url: string
    is_primary: boolean
  } | null
}

/**
 * Hook optimizado para cargar actividades con caché inteligente
 * - Usa la API optimizada que es 5-10x más rápida
 * - Implementa caché con TTL de 10 minutos
 * - Precarga datos relacionados
 * - Maneja errores con retry automático
 */
export function useOptimizedActivities(filters: ActivityFilters = {}) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [activities, setActivities] = useState<OptimizedActivity[]>([])
  const [lastUpdated, setLastUpdated] = useState<number>(0)

  // Función para obtener actividades desde la API optimizada
  const fetchActivities = useCallback(async (): Promise<OptimizedActivity[]> => {
    const params = new URLSearchParams()
    
    if (filters.searchTerm) params.set('term', filters.searchTerm)
    if (filters.type) params.set('type', filters.type)
    if (filters.difficulty) params.set('difficulty', filters.difficulty)
    if (filters.coachId) params.set('coachId', filters.coachId)

    console.log(`🔄 [ACTIVITIES] Fetching with filters:`, Object.fromEntries(params))

    const response = await fetch(`/api/activities/search-optimized?${params}`, {
      headers: {
        'Cache-Control': 'max-age=300', // 5 minutos de caché HTTP
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    console.log(`✅ [ACTIVITIES] Loaded ${data.length} activities`)
    return data
  }, [filters])

  // Usar el smart data loader con configuración optimizada
  const {
    data,
    isLoading: cacheLoading,
    error: cacheError,
    fetchData,
    invalidate,
    cacheStrategy
  } = useSmartDataLoader(
    `activities_${JSON.stringify(filters)}`,
    fetchActivities,
    {
      preloadRelated: true,
      preloadDelay: 1000, // Precargar después de 1 segundo
      retryAttempts: 3,
      retryDelay: 1000
    }
  )

  // Sincronizar estado local con el caché
  useEffect(() => {
    if (data) {
      setActivities(data)
      setLastUpdated(Date.now())
      setError(null)
    }
    setIsLoading(cacheLoading)
    if (cacheError) {
      setError(cacheError)
    }
  }, [data, cacheLoading, cacheError])

  // Función para refrescar datos
  const refresh = useCallback(async () => {
    console.log(`🔄 [ACTIVITIES] Manual refresh triggered`)
    try {
      setIsLoading(true)
      setError(null)
      await fetchData(true) // Force refresh
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Refresh failed')
      setError(error)
      console.error(`❌ [ACTIVITIES] Refresh error:`, error.message)
    } finally {
      setIsLoading(false)
    }
  }, [fetchData])

  // Función para limpiar caché
  const clearCache = useCallback(() => {
    console.log(`🗑️ [ACTIVITIES] Clearing cache`)
    invalidate()
    setActivities([])
    setLastUpdated(0)
  }, [invalidate])

  // Función para obtener actividad por ID
  const getActivityById = useCallback((id: number): OptimizedActivity | undefined => {
    return activities.find(activity => activity.id === id)
  }, [activities])

  // Función para filtrar actividades localmente (para filtros rápidos)
  const filterActivities = useCallback((localFilters: Partial<ActivityFilters>): OptimizedActivity[] => {
    return activities.filter(activity => {
      if (localFilters.type && activity.type !== localFilters.type) return false
      if (localFilters.difficulty && activity.difficulty !== localFilters.difficulty) return false
      if (localFilters.coachId && activity.coach_id !== localFilters.coachId) return false
      if (localFilters.searchTerm) {
        const term = localFilters.searchTerm.toLowerCase()
        return activity.title.toLowerCase().includes(term) || 
               activity.description.toLowerCase().includes(term)
      }
      return true
    })
  }, [activities])

  return {
    // Datos
    activities,
    isLoading,
    error,
    lastUpdated,
    
    // Funciones
    refresh,
    clearCache,
    getActivityById,
    filterActivities,
    
    // Metadatos
    count: activities.length,
    cacheStrategy,
    
    // Estado del caché
    hasData: activities.length > 0,
    isStale: lastUpdated > 0 && (Date.now() - lastUpdated) > 10 * 60 * 1000 // 10 minutos
  }
}

/**
 * Hook simplificado para obtener una sola actividad
 */
export function useOptimizedActivity(activityId: number) {
  const { activities, isLoading, error, getActivityById } = useOptimizedActivities()
  
  const activity = getActivityById(activityId)
  
  return {
    activity,
    isLoading,
    error,
    found: !!activity
  }
}

/**
 * Hook para obtener actividades de un coach específico
 */
export function useOptimizedCoachActivities(coachId: string) {
  return useOptimizedActivities({ coachId })
}

/**
 * Hook para búsqueda de actividades con término
 */
export function useOptimizedActivitySearch(searchTerm: string) {
  return useOptimizedActivities({ searchTerm })
}




























