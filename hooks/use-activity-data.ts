"use client"

import { useState, useEffect, useCallback, useRef } from "react"

// Tipos de datos
export type ActivityData = {
  id: number
  title: string
  description: string
  type: string
  difficulty: string
  price: number
  image_url?: string
  video_url?: string
  fitness_details?: any[]
}

type CachedActivityData = {
  data: ActivityData | null
  timestamp: number
  lastUpdate: number
}

// Configuración de caché
const CACHE_EXPIRATION = 5 * 60 * 1000 // 5 minutos
const UPDATE_INTERVAL = 30 * 1000 // 30 segundos para actualizaciones automáticas

export function useActivityData(activityId: number) {
  const [data, setData] = useState<ActivityData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<number>(0)
  
  // Refs para controlar actualizaciones
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const isInitializedRef = useRef(false)

  // Función para obtener datos de la API
  const fetchActivityData = useCallback(async (): Promise<ActivityData | null> => {
    try {
      // console.log(`🔄 Fetching activity data for ID: ${activityId}`)
      
      const response = await fetch(`/api/activity-details/${activityId}`, {
        method: "GET",
        headers: {
          "Cache-Control": "max-age=300", // Cache por 5 minutos
        },
        signal: AbortSignal.timeout(10000), // 10 segundos de timeout
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const activityData = await response.json()
      // console.log(`✅ Activity data fetched successfully for ID: ${activityId}`)
      
      return activityData
    } catch (error) {
      console.error(`❌ Error fetching activity data for ID ${activityId}:`, error)
      throw error
    }
  }, [activityId])

  // Función para cargar datos (con caché)
  const loadData = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true)
      setError(null)

      // Verificar caché local
      const cacheKey = `activity_${activityId}`
      let cachedData: CachedActivityData | null = null
      
      if (!forceRefresh) {
        try {
          const cachedString = sessionStorage.getItem(cacheKey)
          if (cachedString) {
            cachedData = JSON.parse(cachedString)
            
            // Verificar si la caché es válida
            if (cachedData && (Date.now() - cachedData.timestamp) < CACHE_EXPIRATION) {
              console.log(`📦 Using cached data for activity ${activityId}`)
              setData(cachedData.data)
              setLastUpdate(cachedData.lastUpdate)
              setLoading(false)
              return
            }
          }
        } catch (e) {
          console.warn("Failed to read from cache:", e)
        }
      }

      // Obtener datos frescos de la API
      const freshData = await fetchActivityData()
      
      if (freshData) {
        // Guardar en caché
        const cacheData: CachedActivityData = {
          data: freshData,
          timestamp: Date.now(),
          lastUpdate: Date.now(),
        }
        
        try {
          sessionStorage.setItem(cacheKey, JSON.stringify(cacheData))
        } catch (e) {
          console.warn("Failed to save to cache:", e)
        }

        setData(freshData)
        setLastUpdate(Date.now())
      }
    } catch (error) {
      console.error(`❌ Error loading activity data for ID ${activityId}:`, error)
      setError(error instanceof Error ? error.message : "Error desconocido")
      
      // Intentar usar caché expirada como fallback
      if (!forceRefresh) {
        try {
          const cacheKey = `activity_${activityId}`
          const cachedString = sessionStorage.getItem(cacheKey)
          if (cachedString) {
            const cachedData: CachedActivityData = JSON.parse(cachedString)
            if (cachedData.data) {
              // console.log(`🔄 Using expired cache as fallback for activity ${activityId}`)
              setData(cachedData.data)
              setLastUpdate(cachedData.lastUpdate)
              return
            }
          }
        } catch (e) {
          console.warn("Failed to use expired cache:", e)
        }
      }
    } finally {
      setLoading(false)
    }
  }, [activityId, fetchActivityData])

  // Función para refrescar datos manualmente
  const refreshData = useCallback(async () => {
    // console.log(`🔄 Manual refresh requested for activity ${activityId}`)
    await loadData(true)
  }, [loadData])

  // Configurar actualizaciones automáticas
  useEffect(() => {
    if (!isInitializedRef.current) {
      // console.log(`🚀 Initializing activity data hook for ID: ${activityId}`)
      isInitializedRef.current = true
      loadData()
    }

    // Configurar actualizaciones automáticas solo si hay datos
    if (data && !updateIntervalRef.current) {
      updateIntervalRef.current = setInterval(() => {
        // console.log(`⏰ Auto-updating activity data for ID: ${activityId}`)
        loadData()
      }, UPDATE_INTERVAL)
    }

    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current)
        updateIntervalRef.current = null
      }
    }
  }, [activityId, data, loadData])

  // Limpiar al desmontar
  useEffect(() => {
    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current)
      }
      isInitializedRef.current = false
    }
  }, [])

  return {
    data,
    loading,
    error,
    lastUpdate,
    refreshData,
    isStale: data ? (Date.now() - lastUpdate) > CACHE_EXPIRATION : false,
  }
}

