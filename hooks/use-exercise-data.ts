"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { createClient } from '@/lib/supabase-browser'

// Tipos de datos
export type ExerciseData = {
  id: number
  nombre_actividad: string
  descripción: string
  duracion: number
  calorias_consumidas: number
  tipo_ejercicio: string
  repeticiones: string
  intervalos_secs: string
  descanso: string
  peso: string
  nivel_intensidad: string
  equipo_necesario: string
  video: string
  nota_cliente: string
  completed: boolean
  series?: any[]
}

type CachedExerciseData = {
  data: ExerciseData | null
  timestamp: number
  lastUpdate: number
}

// Configuración de caché
const CACHE_EXPIRATION = 10 * 60 * 1000 // 10 minutos
const UPDATE_INTERVAL = 60 * 1000 // 1 minuto para actualizaciones automáticas

export function useExerciseData(exerciseId: number) {
  const [data, setData] = useState<ExerciseData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<number>(0)
  
  // Refs para controlar actualizaciones
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const isInitializedRef = useRef(false)

  // Función para obtener datos del ejercicio
  const fetchExerciseData = useCallback(async (): Promise<ExerciseData | null> => {
    try {
      // console.log(`🔄 Fetching exercise data for ID: ${exerciseId}`)
      
      const supabase = createClient()
      const { data: exerciseData, error: exerciseError } = await supabase
        .from("ejercicios_detalles")
        .select("*")
        .eq("id", exerciseId)
        .single()

      if (exerciseError) {
        console.error("❌ Error fetching exercise:", exerciseError)
        throw new Error("Error al cargar el ejercicio")
      }

      if (!exerciseData) {
        throw new Error("Ejercicio no encontrado")
      }

      // console.log(`✅ Exercise data fetched successfully for ID: ${exerciseId}`)
      
      // Procesar los datos del ejercicio - NUEVO ESQUEMA
      const processedExercise: ExerciseData = {
        id: exerciseData.id,
        nombre_actividad: exerciseData.nombre_ejercicio,
        descripción: exerciseData.descripcion,
        duracion: exerciseData.duracion_min || 0,
        calorias_consumidas: 0, // No disponible en el nuevo esquema
        tipo_ejercicio: exerciseData.tipo || "Fuerza",
        repeticiones: "10", // Valor por defecto
        intervalos_secs: "3", // Valor por defecto
        descanso: "60", // Valor por defecto
        peso: "0", // Valor por defecto
        nivel_intensidad: "Moderado", // Valor por defecto
        equipo_necesario: "Ninguno", // Valor por defecto
        video: exerciseData.video_url || "",
        nota_cliente: "",
        completed: false, // Se maneja en ejecuciones_ejercicio
        series: []
      }
      
      return processedExercise
    } catch (error) {
      console.error(`❌ Error fetching exercise data for ID ${exerciseId}:`, error)
      throw error
    }
  }, [exerciseId])

  // Función para cargar datos (con caché)
  const loadData = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true)
      setError(null)

      // Verificar caché local
      const cacheKey = `exercise_${exerciseId}`
      let cachedData: CachedExerciseData | null = null
      
      if (!forceRefresh) {
        try {
          const cachedString = sessionStorage.getItem(cacheKey)
          if (cachedString) {
            cachedData = JSON.parse(cachedString)
            
            // Verificar si la caché es válida
            if (cachedData && (Date.now() - cachedData.timestamp) < CACHE_EXPIRATION) {
              console.log(`📦 Using cached data for exercise ${exerciseId}`)
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

      // Obtener datos frescos
      const freshData = await fetchExerciseData()
      
      if (freshData) {
        // Guardar en caché
        const cacheData: CachedExerciseData = {
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
      console.error(`❌ Error loading exercise data for ID ${exerciseId}:`, error)
      setError(error instanceof Error ? error.message : "Error desconocido")
      
      // Intentar usar caché expirada como fallback
      if (!forceRefresh) {
        try {
          const cacheKey = `exercise_${exerciseId}`
          const cachedString = sessionStorage.getItem(cacheKey)
          if (cachedString) {
            const cachedData: CachedExerciseData = JSON.parse(cachedString)
            if (cachedData.data) {
              // console.log(`🔄 Using expired cache as fallback for exercise ${exerciseId}`)
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
  }, [exerciseId, fetchExerciseData])

  // Función para refrescar datos manualmente
  const refreshData = useCallback(async () => {
    // console.log(`🔄 Manual refresh requested for exercise ${exerciseId}`)
    await loadData(true)
  }, [loadData])

  // Función para marcar como completado - NUEVO ESQUEMA
  const markAsCompleted = useCallback(async (completed: boolean) => {
    try {
      // console.log(`🔄 Marking exercise ${exerciseId} as ${completed ? 'completed' : 'incomplete'}`)
      
      // En el nuevo esquema, el estado de completado se maneja en ejecuciones_ejercicio
      // Esta función ahora es solo para actualizar el estado local
      // La lógica real de completado debe manejarse a través de la API de ejecuciones_ejercicio
      
      // Actualizar estado local
      if (data) {
        setData({
          ...data,
          completed: completed
        })
      }

      // console.log(`✅ Exercise ${exerciseId} marked as ${completed ? 'completed' : 'incomplete'} (local state only)`)
    } catch (error) {
      console.error(`❌ Error marking exercise ${exerciseId} as completed:`, error)
      throw error
    }
  }, [exerciseId, data])

  // Configurar actualizaciones automáticas
  useEffect(() => {
    if (!isInitializedRef.current) {
      // console.log(`🚀 Initializing exercise data hook for ID: ${exerciseId}`)
      isInitializedRef.current = true
      loadData()
    }

    // Configurar actualizaciones automáticas solo si hay datos
    if (data && !updateIntervalRef.current) {
      updateIntervalRef.current = setInterval(() => {
        // console.log(`⏰ Auto-updating exercise data for ID: ${exerciseId}`)
        loadData()
      }, UPDATE_INTERVAL)
    }

    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current)
        updateIntervalRef.current = null
      }
    }
  }, [exerciseId, data, loadData])

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
    markAsCompleted,
    isStale: data ? (Date.now() - lastUpdate) > CACHE_EXPIRATION : false,
  }
}

