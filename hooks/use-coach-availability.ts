"use client"

import { useState, useEffect } from "react"
import type { CoachAvailability, CoachAvailabilityException } from "@/types/availability"
import { toast } from "@/components/ui/use-toast"

export function useCoachAvailability(coachId: string) {
  const [availability, setAvailability] = useState<CoachAvailability[]>([])
  const [exceptions, setExceptions] = useState<CoachAvailabilityException[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAvailability = async () => {
    if (!coachId) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/coach/availability?coach_id=${coachId}`)

      if (!response.ok) {
        throw new Error("Error al cargar la disponibilidad")
      }

      const data = await response.json()
      setAvailability(data)
    } catch (err) {
      console.error("Error fetching coach availability:", err)
      setError(err instanceof Error ? err.message : "Error desconocido")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchExceptions = async (startDate?: string, endDate?: string) => {
    if (!coachId) return

    try {
      let url = `/api/coach/availability/exceptions?coach_id=${coachId}`

      if (startDate && endDate) {
        url += `&start_date=${startDate}&end_date=${endDate}`
      }

      const response = await fetch(url)

      if (!response.ok) {
        throw new Error("Error al cargar las excepciones")
      }

      const data = await response.json()
      setExceptions(data)
    } catch (err) {
      console.error("Error fetching coach exceptions:", err)
      // No actualizamos el estado de error aquí para no interferir con la carga principal
    }
  }

  const addAvailability = async (newAvailability: Partial<CoachAvailability>) => {
    try {
      const response = await fetch("/api/coach/availability", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          coach_id: coachId,
          ...newAvailability,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error al añadir disponibilidad")
      }

      setAvailability((prev) => [...prev, data])
      toast({
        title: "Disponibilidad añadida",
        description: "Se ha añadido el horario de disponibilidad",
      })

      return data
    } catch (err) {
      console.error("Error adding availability:", err)
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Error al añadir disponibilidad",
        variant: "destructive",
      })
      throw err
    }
  }

  const updateAvailability = async (id: number, updates: Partial<CoachAvailability>) => {
    try {
      const response = await fetch(`/api/coach/availability?id=${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error al actualizar disponibilidad")
      }

      setAvailability((prev) => prev.map((item) => (item.id === id ? { ...item, ...data } : item)))

      toast({
        title: "Disponibilidad actualizada",
        description: "Se ha actualizado el horario de disponibilidad",
      })

      return data
    } catch (err) {
      console.error("Error updating availability:", err)
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Error al actualizar disponibilidad",
        variant: "destructive",
      })
      throw err
    }
  }

  const deleteAvailability = async (id: number) => {
    try {
      const response = await fetch(`/api/coach/availability?id=${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Error al eliminar disponibilidad")
      }

      setAvailability((prev) => prev.filter((item) => item.id !== id))

      toast({
        title: "Disponibilidad eliminada",
        description: "Se ha eliminado el horario de disponibilidad",
      })

      return true
    } catch (err) {
      console.error("Error deleting availability:", err)
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Error al eliminar disponibilidad",
        variant: "destructive",
      })
      throw err
    }
  }

  const addException = async (newException: Partial<CoachAvailabilityException>) => {
    try {
      const response = await fetch("/api/coach/availability/exceptions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          coach_id: coachId,
          ...newException,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error al añadir excepción")
      }

      setExceptions((prev) => [...prev, data])

      toast({
        title: "Excepción añadida",
        description: "Se ha añadido la excepción de disponibilidad",
      })

      return data
    } catch (err) {
      console.error("Error adding exception:", err)
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Error al añadir excepción",
        variant: "destructive",
      })
      throw err
    }
  }

  const deleteException = async (id: number) => {
    try {
      const response = await fetch(`/api/coach/availability/exceptions?id=${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Error al eliminar excepción")
      }

      setExceptions((prev) => prev.filter((item) => item.id !== id))

      toast({
        title: "Excepción eliminada",
        description: "Se ha eliminado la excepción de disponibilidad",
      })

      return true
    } catch (err) {
      console.error("Error deleting exception:", err)
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Error al eliminar excepción",
        variant: "destructive",
      })
      throw err
    }
  }

  // Cargar disponibilidad al montar el componente
  useEffect(() => {
    if (coachId) {
      fetchAvailability()
      fetchExceptions()
    }
  }, [coachId])

  return {
    availability,
    exceptions,
    isLoading,
    error,
    fetchAvailability,
    fetchExceptions,
    addAvailability,
    updateAvailability,
    deleteAvailability,
    addException,
    deleteException,
  }
}
