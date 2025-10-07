import { useState, useEffect, useCallback } from "react"
import { createClient } from '@/lib/supabase-browser'

export interface FitnessSeries {
  id: string
  orden: number
  peso?: number
  repeticiones?: number
  series?: number
  descanso_segundos?: number
  created_at: string
}

export interface FitnessExerciseDetail {
  id: string
  activity_id: number
  semana: number
  dia: number // Cambiado de "día" a "dia" para el nuevo esquema
  ejercicio_id: number // Referencia a ejercicios_detalles
  bloque: number
  orden: number
  created_at: string
  updated_at: string
  // Datos del ejercicio relacionado
  ejercicio?: {
    id: number
    nombre_ejercicio: string
    descripcion: string
    tipo: string
    duracion_min?: number
    video_url?: string
  }
}

export function useFitnessExerciseDetails(activityId?: string, semana?: number, dia?: number) {
  const [details, setDetails] = useState<FitnessExerciseDetail[]>([])
  const [loading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const fetchDetails = useCallback(async () => {
    if (!activityId) return

    try {
      setIsLoading(true)
      setError(null)

      // Usar el nuevo esquema modular: organizacion_ejercicios
      const supabase = createClient()
      
      let query = supabase
        .from("organizacion_ejercicios")
        .select(`
          *,
          ejercicio:ejercicios_detalles!inner(*)
        `)
        .eq("activity_id", activityId)

      if (semana) {
        query = query.eq("semana", semana)
      }

      if (dia) {
        query = query.eq("dia", dia)
      }

      const { data, error } = await query.order("semana", { ascending: true }).order("dia", { ascending: true })

      if (error) {
        throw new Error(error.message)
      }

      setDetails(data || [])
    } catch (err) {
      console.error("Error fetching fitness exercises:", err)
      setError(err instanceof Error ? err.message : "Error desconocido")
    } finally {
      setIsLoading(false)
    }
  }, [activityId, semana, dia])

  const createDetail = useCallback(async (detailData: Omit<FitnessExerciseDetail, "id" | "created_at" | "updated_at">) => {
    try {
      const response = await fetch("/api/fitness-exercise-details", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(detailData),
      })

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      const newDetail = await response.json()
      setDetails(prev => [...prev, newDetail])
      return newDetail
    } catch (err) {
      console.error("Error creating fitness exercise detail:", err)
      throw err
    }
  }, [])

  const updateDetail = useCallback(async (id: string, updateData: Partial<FitnessExerciseDetail>) => {
    try {
      const response = await fetch("/api/fitness-exercise-details", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, ...updateData }),
      })

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      const updatedDetail = await response.json()
      setDetails(prev => prev.map(detail => 
        detail.id === id ? updatedDetail : detail
      ))
      return updatedDetail
    } catch (err) {
      console.error("Error updating fitness exercise detail:", err)
      throw err
    }
  }, [])

  const deleteDetail = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/fitness-exercise-details?id=${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      setDetails(prev => prev.filter(detail => detail.id !== id))
    } catch (err) {
      console.error("Error deleting fitness exercise detail:", err)
      throw err
    }
  }, [])

  const getDetailByExercise = useCallback((exerciseId: string) => {
    return details.find(detail => detail.id === exerciseId)
  }, [details])

  const getDetailsForDay = useCallback((semana: number, dia: number) => {
    return details.filter(detail => detail.semana === semana && detail.dia === dia)
  }, [details])

  useEffect(() => {
    fetchDetails()
  }, [fetchDetails])

  return {
    details,
    loading,
    error,
    fetchDetails,
    createDetail,
    updateDetail,
    deleteDetail,
    getDetailByExercise,
    getDetailsForDay,
  }
}




