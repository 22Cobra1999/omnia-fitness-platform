import { useState, useEffect, useRef, useCallback } from 'react'
import { throttledLog } from '@/lib/log-throttler'

interface CachedCoachData {
  coach: any
  activities: any[]
  lastAccessed: number
  preloadExpiry: number
  isPreloading: boolean
}

interface SmartCoachCacheOptions {
  preloadTimeout?: number // Tiempo en ms para mantener pre-cargado (default: 3 minutos)
  maxCacheSize?: number // Máximo número de coaches en cache (default: 5)
}

export function useSmartCoachCache(options: SmartCoachCacheOptions = {}) {
  const {
    preloadTimeout = 3 * 60 * 1000, // 3 minutos
    maxCacheSize = 5
  } = options

  const [coachCache, setCoachCache] = useState<Map<string, CachedCoachData>>(new Map())
  const preloadTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map())

  // Función para limpiar timeout (declarada primero)
  const clearPreloadTimeout = useCallback((coachId: string) => {
    const timeout = preloadTimeouts.current.get(coachId)
    if (timeout) {
      clearTimeout(timeout)
      preloadTimeouts.current.delete(coachId)
    }
  }, [])

  // Función para remover coach del cache (declarada segundo)
  const removeCoachFromCache = useCallback((coachId: string) => {
    throttledLog.log(`coach-cache-remove-${coachId}`, `🗑️ [COACH-CACHE] Removiendo coach ${coachId} del cache`)
    setCoachCache(prev => {
      const newCache = new Map(prev)
      newCache.delete(coachId)
      return newCache
    })
    clearPreloadTimeout(coachId)
  }, [clearPreloadTimeout])

  // Función para agregar coach al cache (declarada tercero)
  const cacheCoach = useCallback((coachId: string, coach: any, activities: any[] = []) => {
    throttledLog.log(`coach-cache-store-${coachId}`, `💾 [COACH-CACHE] Cacheando coach ${coachId}`, {
      coachName: coach.name || coach.full_name,
      activitiesCount: activities.length,
      preloadTimeout: preloadTimeout / 1000 + 's'
    })

    setCoachCache(prev => {
      const newCache = new Map(prev)
      
      // Si ya existe, actualizar
      if (newCache.has(coachId)) {
        const existing = newCache.get(coachId)!
        newCache.set(coachId, {
          ...existing,
          coach,
          activities,
          lastAccessed: Date.now(),
          preloadExpiry: Date.now() + preloadTimeout
        })
      } else {
        // Si no existe, agregar nuevo
        newCache.set(coachId, {
          coach,
          activities,
          lastAccessed: Date.now(),
          preloadExpiry: Date.now() + preloadTimeout,
          isPreloading: false
        })

        // Limpiar cache si excede el tamaño máximo
        if (newCache.size > maxCacheSize) {
          const oldestKey = Array.from(newCache.entries())
            .sort(([,a], [,b]) => a.lastAccessed - b.lastAccessed)[0][0]
          newCache.delete(oldestKey)
          throttledLog.log('coach-cache-evict', `🗑️ [COACH-CACHE] Removiendo coach más antiguo: ${oldestKey}`)
        }
      }

      return newCache
    })

    // Configurar timeout para limpiar cache
    clearPreloadTimeout(coachId)
    const timeout = setTimeout(() => {
      removeCoachFromCache(coachId)
    }, preloadTimeout)
    preloadTimeouts.current.set(coachId, timeout)
  }, [preloadTimeout, maxCacheSize, removeCoachFromCache, clearPreloadTimeout])

  // Función para obtener coach del cache
  const getCachedCoach = (coachId: string): CachedCoachData | null => {
    const cached = coachCache.get(coachId)
    
    if (cached && cached.preloadExpiry > Date.now()) {
      console.log(`⚡ [COACH-CACHE] Cache HIT para coach ${coachId}`, {
        coachName: cached.coach.name || cached.coach.full_name,
        activitiesCount: cached.activities.length,
        timeLeft: Math.round((cached.preloadExpiry - Date.now()) / 1000) + 's'
      })
      
      // Actualizar último acceso
      setCoachCache(prev => {
        const newCache = new Map(prev)
        if (newCache.has(coachId)) {
          const existing = newCache.get(coachId)!
          newCache.set(coachId, {
            ...existing,
            lastAccessed: Date.now()
          })
        }
        return newCache
      })
      
      return cached
    }
    
    if (cached) {
      console.log(`⏰ [COACH-CACHE] Cache EXPIRED para coach ${coachId}`)
    } else {
      console.log(`❌ [COACH-CACHE] Cache MISS para coach ${coachId}`)
    }
    
    return null
  }


  // Función para pre-cargar coach (cuando se detecta navegación)
  const preloadCoach = async (coachId: string, coach: any) => {
    console.log(`🚀 [COACH-CACHE] Pre-cargando coach ${coachId}`, {
      coachName: coach.name || coach.full_name
    })

    try {
      // Marcar como pre-cargando
      setCoachCache(prev => {
        const newCache = new Map(prev)
        if (newCache.has(coachId)) {
          const existing = newCache.get(coachId)!
          newCache.set(coachId, {
            ...existing,
            isPreloading: true
          })
        }
        return newCache
      })

      // Cargar actividades del coach
      const response = await fetch(`/api/activities/search?coachId=${coachId}`)
      if (response.ok) {
        const activities = await response.json()
        
        // Cachear con actividades
        cacheCoach(coachId, coach, activities)
        
        console.log(`✅ [COACH-CACHE] Pre-carga completada para coach ${coachId}`, {
          activitiesCount: activities.length
        })
      } else {
        console.error(`❌ [COACH-CACHE] Error pre-cargando actividades para coach ${coachId}`)
        cacheCoach(coachId, coach, []) // Cachear sin actividades
      }
    } catch (error) {
      console.error(`❌ [COACH-CACHE] Error en pre-carga para coach ${coachId}:`, error)
      cacheCoach(coachId, coach, []) // Cachear sin actividades
    }
  }

  // Función para obtener estadísticas del cache
  const getCacheStats = () => {
    const stats = {
      totalCoaches: coachCache.size,
      activePreloads: Array.from(coachCache.values()).filter(c => c.isPreloading).length,
      expiredCoaches: Array.from(coachCache.values()).filter(c => c.preloadExpiry <= Date.now()).length,
      coaches: Array.from(coachCache.entries()).map(([id, data]) => ({
        id,
        name: data.coach.name || data.coach.full_name,
        activitiesCount: data.activities.length,
        timeLeft: Math.round((data.preloadExpiry - Date.now()) / 1000),
        isExpired: data.preloadExpiry <= Date.now()
      }))
    }
    
    console.log(`📊 [COACH-CACHE] Estadísticas:`, stats)
    return stats
  }

  // Limpiar timeouts al desmontar
  useEffect(() => {
    return () => {
      preloadTimeouts.current.forEach(timeout => clearTimeout(timeout))
    }
  }, [])

  return {
    cacheCoach,
    getCachedCoach,
    removeCoachFromCache,
    preloadCoach,
    getCacheStats,
    isCached: (coachId: string) => coachCache.has(coachId) && coachCache.get(coachId)!.preloadExpiry > Date.now()
  }
}
