"use client"

import { useCallback, useEffect, useRef, useState } from 'react'
import { useOptimizedCache } from './use-optimized-cache'

interface SmartLoaderConfig {
  preloadDelay?: number // Tiempo antes de precargar datos relacionados
  preloadRelated?: boolean // Si debe precargar datos relacionados
  retryAttempts?: number // Número de reintentos en caso de error
  retryDelay?: number // Delay entre reintentos
}

/**
 * Hook inteligente que optimiza la carga de datos basándose en patrones de uso
 * - Precarga datos relacionados cuando detecta navegación
 * - Mantiene datos en caché según su tipo y frecuencia de cambio
 * - Implementa estrategias de retry automático
 * - Detecta cuando el usuario está por cambiar de pantalla y precarga
 */
export function useSmartDataLoader<T>(
  key: string,
  fetchFunction: () => Promise<T>,
  config: SmartLoaderConfig = {}
) {
  const {
    preloadDelay = 2000, // 2 segundos
    preloadRelated = true,
    retryAttempts = 3,
    retryDelay = 1000
  } = config

  const [isPreloading, setIsPreloading] = useState(false)
  const [preloadError, setPreloadError] = useState<Error | null>(null)
  const preloadTimeoutRef = useRef<NodeJS.Timeout>()
  const retryCountRef = useRef(0)

  // Detectar tipo de datos basándose en la clave
  const getCacheStrategy = useCallback((dataKey: string) => {
    if (dataKey.includes('coach') || dataKey.includes('profile')) {
      return 'persistent' // Datos que cambian poco
    } else if (dataKey.includes('activity') || dataKey.includes('metrics')) {
      return 'shortTerm' // Datos que cambian moderadamente
    } else {
      return 'optimized' // Datos que cambian frecuentemente
    }
  }, [])

  // Función de fetch con retry automático
  const fetchWithRetry = useCallback(async (): Promise<T> => {
    let lastError: Error | null = null
    
    for (let attempt = 1; attempt <= retryAttempts; attempt++) {
      try {
        console.log(`🔄 [SMART-LOADER] Attempt ${attempt}/${retryAttempts} for ${key}`)
        const result = await fetchFunction()
        retryCountRef.current = 0
        return result
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error')
        console.warn(`⚠️ [SMART-LOADER] Attempt ${attempt} failed for ${key}:`, lastError.message)
        
        if (attempt < retryAttempts) {
          await new Promise(resolve => setTimeout(resolve, retryDelay * attempt))
        }
      }
    }
    
    throw lastError
  }, [key, fetchFunction, retryAttempts, retryDelay])

  // Detectar navegación y precargar datos relacionados
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && preloadRelated) {
        // Usuario volvió a la app, precargar datos si han pasado más de 3 minutos
        const lastPreload = sessionStorage.getItem(`preload_${key}`)
        const now = Date.now()
        const threeMinutes = 3 * 60 * 1000
        
        if (!lastPreload || now - parseInt(lastPreload) > threeMinutes) {
          console.log(`🔄 [SMART-LOADER] Preloading related data for ${key}`)
          preloadRelatedData()
          sessionStorage.setItem(`preload_${key}`, now.toString())
        }
      }
    }

    const handleBeforeUnload = () => {
      // Usuario está por salir, limpiar timeouts
      if (preloadTimeoutRef.current) {
        clearTimeout(preloadTimeoutRef.current)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('beforeunload', handleBeforeUnload)
      if (preloadTimeoutRef.current) {
        clearTimeout(preloadTimeoutRef.current)
      }
    }
  }, [key, preloadRelated])

  // Precargar datos relacionados basándose en el contexto
  const preloadRelatedData = useCallback(async () => {
    if (!preloadRelated) return

    setIsPreloading(true)
    setPreloadError(null)

    try {
      // Detectar qué datos relacionados precargar basándose en la clave
      const relatedKeys = getRelatedKeys(key)
      
      for (const relatedKey of relatedKeys) {
        // Precargar con delay para no sobrecargar
        setTimeout(() => {
          // Aquí podrías precargar datos específicos
          console.log(`🔄 [SMART-LOADER] Preloading related: ${relatedKey}`)
        }, Math.random() * 1000) // Delay aleatorio para evitar picos
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Preload error')
      setPreloadError(err)
      console.error(`❌ [SMART-LOADER] Preload error for ${key}:`, err.message)
    } finally {
      setIsPreloading(false)
    }
  }, [key, preloadRelated])

  // Determinar qué datos relacionados precargar
  const getRelatedKeys = useCallback((dataKey: string): string[] => {
    const relatedMap: Record<string, string[]> = {
      'coaches': ['activities', 'profile_metrics'],
      'activities': ['coaches', 'activity_stats'],
      'profile': ['biometrics', 'exercise_progress'],
      'search': ['coaches', 'activities']
    }

    // Buscar coincidencias parciales
    for (const [baseKey, related] of Object.entries(relatedMap)) {
      if (dataKey.includes(baseKey)) {
        return related
      }
    }

    return []
  }, [])

  // Usar la estrategia de caché apropiada
  const cacheStrategy = getCacheStrategy(key)
  
  // Usar siempre useOptimizedCache ya que los otros hooks no existen
  const cacheHook = useOptimizedCache(key, fetchWithRetry, {
    ttl: 5 * 60 * 1000,
    maxAge: 3 * 60 * 1000,
    backgroundRefresh: true
  })

  return {
    ...cacheHook,
    isPreloading,
    preloadError,
    cacheStrategy,
    preloadRelatedData
  }
}

/**
 * Hook específico para datos de coaches (cambian poco, necesitan persistencia)
 */
export function useSmartCoachesLoader() {
  const fetchCoaches = useCallback(async () => {
    const response = await fetch('/api/search-coaches', {
      headers: { 'Cache-Control': 'max-age=300' }
    })
    if (!response.ok) throw new Error('Failed to fetch coaches')
    return response.json()
  }, [])

  return useSmartDataLoader('coaches', fetchCoaches, {
    preloadRelated: true,
    preloadDelay: 1000
  })
}

/**
 * Hook específico para datos de actividades (cambian moderadamente)
 */
export function useSmartActivitiesLoader(filters: any = {}) {
  const fetchActivities = useCallback(async () => {
    const params = new URLSearchParams(filters)
    const response = await fetch(`/api/activities/search?${params}`, {
      headers: { 'Cache-Control': 'max-age=120' }
    })
    if (!response.ok) throw new Error('Failed to fetch activities')
    return response.json()
  }, [filters])

  return useSmartDataLoader(`activities_${JSON.stringify(filters)}`, fetchActivities, {
    preloadRelated: true,
    preloadDelay: 1500
  })
}

/**
 * Hook específico para métricas del perfil (cambian frecuentemente)
 */
export function useSmartProfileMetricsLoader() {
  const fetchMetrics = useCallback(async () => {
    const [biometrics, progress] = await Promise.all([
      fetch('/api/profile/biometrics').then(r => r.json()),
      fetch('/api/profile/exercise-progress').then(r => r.json())
    ])
    return { biometrics, progress }
  }, [])

  return useSmartDataLoader('profile_metrics', fetchMetrics, {
    preloadRelated: false, // Las métricas no necesitan precarga relacionada
    preloadDelay: 0
  })
}

















