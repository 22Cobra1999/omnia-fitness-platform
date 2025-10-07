"use client"

import { useMemo } from "react"

interface ProgramDetail {
  id: string
  semana: number
  día: number
  completed: boolean
  completed_at: string | null
  client_id: string
  nombre_actividad?: string
  descripción?: string
  duración?: number
  calorias_consumidas?: number
  tipo_ejercicio?: string
  repeticiones?: string
  intervalos?: string
  descanso?: string
  peso?: string
  nivel_intensidad?: string
  equipo_necesario?: string
  comida?: string
  nombre?: string
  receta?: string
  calorías?: number
  proteínas?: number
  carbohidratos?: number
  peso_comida?: number
  video_url?: string
  vimeo_id?: string
}

export function useProgramStats(
  programDetails: ProgramDetail[],
  userId: string | undefined,
  expirationDate: string | null,
) {
  const totalActivities = useMemo(() => {
    return programDetails.length
  }, [programDetails])

  const completedActivities = useMemo(() => {
    if (!userId) return 0
    return programDetails.filter((detail) => detail.completed && detail.client_id === userId).length
  }, [programDetails, userId])

  const progressPercentage = useMemo(() => {
    if (totalActivities === 0) return 0
    return Math.round((completedActivities / totalActivities) * 100)
  }, [completedActivities, totalActivities])

  const isProgramCompleted = useMemo(() => {
    return totalActivities > 0 && completedActivities === totalActivities
  }, [completedActivities, totalActivities])

  const isProgramExpired = useMemo(() => {
    if (!expirationDate) return false
    const today = new Date()
    today.setHours(0, 0, 0, 0) // Normalize to start of day
    const expiry = new Date(expirationDate)
    expiry.setHours(23, 59, 59, 999) // Normalize to end of day
    return today > expiry
  }, [expirationDate])

  const isProgramFinished = useMemo(() => {
    // A program is considered "finished" if:
    // 1. There are no activities defined for it (totalActivities === 0).
    // 2. All activities have been completed (isProgramCompleted is true).
    // 3. The program's expiration date has passed (isProgramExpired is true).
    return totalActivities === 0 || isProgramCompleted || isProgramExpired
  }, [totalActivities, isProgramCompleted, isProgramExpired])

  return {
    totalActivities,
    completedActivities,
    progressPercentage,
    isProgramCompleted,
    isProgramExpired,
    isProgramFinished,
  }
}
