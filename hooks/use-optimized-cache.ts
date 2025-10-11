"use client"

import { useCallback, useRef, useState, useEffect } from 'react'

interface CacheConfig {
  ttl: number // Time to live en milisegundos
  maxAge: number // Máxima edad antes de recargar en background
  persistKey?: string // Clave para persistir en localStorage
  backgroundRefresh?: boolean // Si debe refrescar en background
}

interface CacheEntry<T> {
  data: T
  timestamp: number
  lastAccess: number
  accessCount: number
}

class OptimizedCacheManager {
  private cache = new Map<string, CacheEntry<any>>()
  private backgroundRefreshPromises = new Map<string, Promise<any>>()

  async get<T>(
    key: string, 
    fetchFunction: () => Promise<T>, 
    config: CacheConfig
  ): Promise<T> {
    const { ttl, maxAge, persistKey, backgroundRefresh = true } = config
    const now = Date.now()
    
    // Intentar cargar desde caché persistente
    if (persistKey) {
      try {
        const persisted = localStorage.getItem(persistKey)
        if (persisted) {
          const parsed = JSON.parse(persisted) as CacheEntry<T>
          if (now - parsed.timestamp < ttl) {
            // Actualizar acceso
            parsed.lastAccess = now
            parsed.accessCount++
            this.cache.set(key, parsed)
            console.log(`📦 [CACHE] Loaded from persistent cache: ${key}`)
            return parsed.data
          }
        }
      } catch (error) {
        console.warn(`Failed to load from persistent cache: ${key}`, error)
      }
    }

    // Verificar caché en memoria
    const cached = this.cache.get(key)
    if (cached && now - cached.timestamp < ttl) {
      cached.lastAccess = now
      cached.accessCount++
      
      // Refrescar en background si está cerca de expirar
      if (backgroundRefresh && now - cached.timestamp > maxAge) {
        this.backgroundRefresh(key, fetchFunction, config)
      }
      
      console.log(`⚡ [CACHE] Hit: ${key} (${cached.accessCount} accesses)`)
      return cached.data
    }

    // Cache miss - cargar datos frescos
    console.log(`🔄 [CACHE] Miss: ${key} - fetching fresh data`)
    return this.fetchAndCache(key, fetchFunction, config)
  }

  private async fetchAndCache<T>(
    key: string, 
    fetchFunction: () => Promise<T>, 
    config: CacheConfig
  ): Promise<T> {
    const { persistKey } = config
    const now = Date.now()
    
    try {
      const data = await fetchFunction()
      
      const entry: CacheEntry<T> = {
        data,
        timestamp: now,
        lastAccess: now,
        accessCount: 1
      }
      
      // Guardar en caché en memoria
      this.cache.set(key, entry)
      
      // Persistir si se especifica
      if (persistKey) {
        try {
          localStorage.setItem(persistKey, JSON.stringify(entry))
        } catch (error) {
          console.warn(`Failed to persist cache: ${key}`, error)
        }
      }
      
      console.log(`✅ [CACHE] Stored: ${key}`)
      return data
    } catch (error) {
      console.error(`❌ [CACHE] Error fetching: ${key}`, error)
      throw error
    }
  }

  private backgroundRefresh<T>(
    key: string, 
    fetchFunction: () => Promise<T>, 
    config: CacheConfig
  ): void {
    if (this.backgroundRefreshPromises.has(key)) {
      return // Ya hay un refresh en progreso
    }

    console.log(`🔄 [CACHE] Background refresh: ${key}`)
    
    const refreshPromise = this.fetchAndCache(key, fetchFunction, config)
      .finally(() => {
        this.backgroundRefreshPromises.delete(key)
      })
    
    this.backgroundRefreshPromises.set(key, refreshPromise)
  }

  invalidate(key: string): void {
    this.cache.delete(key)
    // También limpiar de localStorage si existe
    const keys = Object.keys(localStorage)
    keys.forEach(k => {
      if (k.startsWith(key)) {
        localStorage.removeItem(k)
      }
    })
    console.log(`🗑️ [CACHE] Invalidated: ${key}`)
  }

  clear(): void {
    this.cache.clear()
    console.log(`🧹 [CACHE] Cleared all`)
  }

  getStats() {
    const entries = Array.from(this.cache.entries())
    return {
      totalEntries: entries.length,
      totalAccesses: entries.reduce((sum, [, entry]) => sum + entry.accessCount, 0),
      avgAccessTime: entries.reduce((sum, [, entry]) => sum + (Date.now() - entry.timestamp), 0) / entries.length,
      entries: entries.map(([key, entry]) => ({
        key,
        age: Date.now() - entry.timestamp,
        accesses: entry.accessCount,
        lastAccess: Date.now() - entry.lastAccess
      }))
    }
  }
}

// Instancia global del cache manager
const globalCacheManager = new OptimizedCacheManager()

/**
 * Hook optimizado para gestión de caché inteligente
 * - TTL configurable
 * - Refresco en background
 * - Persistencia en localStorage
 * - Estadísticas de uso
 */
export function useOptimizedCache<T>(
  key: string,
  fetchFunction: () => Promise<T>,
  config: CacheConfig = {
    ttl: 5 * 60 * 1000, // 5 minutos por defecto
    maxAge: 3 * 60 * 1000, // 3 minutos para refresh en background
    backgroundRefresh: true
  }
) {
  const [data, setData] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [lastUpdated, setLastUpdated] = useState<number>(0)

  const fetchData = useCallback(async (force = false) => {
    if (force) {
      globalCacheManager.invalidate(key)
    }

    try {
      setIsLoading(true)
      setError(null)

      const result = await globalCacheManager.get(key, fetchFunction, {
        ...config,
        persistKey: config.persistKey || `cache_${key}`
      })

      setData(result)
      setLastUpdated(Date.now())
      return result
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Unknown error")
      setError(error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [key, fetchFunction, config])

  const invalidate = useCallback(() => {
    globalCacheManager.invalidate(key)
    setData(null)
    setLastUpdated(0)
  }, [key])

  // Cargar datos al montar el componente
  useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    data,
    isLoading,
    error,
    lastUpdated,
    fetchData,
    invalidate,
    stats: globalCacheManager.getStats()
  }
}

/**
 * Hook para datos que se cargan una vez y se mantienen en memoria
 * Ideal para datos que raramente cambian (coaches, configuraciones, etc.)
 */
export function usePersistentCache<T>(
  key: string,
  fetchFunction: () => Promise<T>,
  ttl: number = 10 * 60 * 1000 // 10 minutos por defecto
) {
  return useOptimizedCache(key, fetchFunction, {
    ttl,
    maxAge: ttl * 0.7, // Refrescar cuando esté al 70% de expiración
    persistKey: `persistent_${key}`,
    backgroundRefresh: true
  })
}

/**
 * Hook para datos que cambian frecuentemente pero queremos caché corto
 * Ideal para actividades, métricas, etc.
 */
export function useShortTermCache<T>(
  key: string,
  fetchFunction: () => Promise<T>,
  ttl: number = 2 * 60 * 1000 // 2 minutos por defecto
) {
  return useOptimizedCache(key, fetchFunction, {
    ttl,
    maxAge: ttl * 0.5, // Refrescar cuando esté al 50% de expiración
    backgroundRefresh: true
  })
}

export { globalCacheManager }



































