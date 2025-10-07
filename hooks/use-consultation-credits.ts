"use client"

import { useState, useEffect } from "react"
import type { ConsultationCredit } from "@/types/consultation"
import { toast } from "@/components/ui/use-toast"

export function useConsultationCredits(activityId?: number) {
  const [credits, setCredits] = useState<ConsultationCredit[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCredits = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (activityId) {
        params.append("activity_id", activityId.toString())
      }

      const response = await fetch(`/api/consultation-credits?${params}`)

      if (!response.ok) {
        throw new Error("Error al cargar créditos de consulta")
      }

      const data = await response.json()
      setCredits(data)
    } catch (error) {
      console.error("Error fetching consultation credits:", error)
      setError(error instanceof Error ? error.message : "Error desconocido")
    } finally {
      setIsLoading(false)
    }
  }

  const useCredit = async (creditId: number) => {
    try {
      const response = await fetch(`/api/consultation-credits/${creditId}/use`, {
        method: "POST",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al usar crédito")
      }

      const updatedCredit = await response.json()

      // Actualizar el estado local
      setCredits((prev) => prev.map((credit) => (credit.id === creditId ? updatedCredit : credit)))

      toast({
        title: "Crédito usado",
        description: "Se ha usado una sesión de consulta",
      })

      return updatedCredit
    } catch (error) {
      console.error("Error using credit:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al usar crédito",
        variant: "destructive",
      })
      throw error
    }
  }

  const bookConsultation = async (bookingData: any) => {
    try {
      const response = await fetch("/api/consultations/book", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bookingData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al programar consulta")
      }

      const result = await response.json()

      // Refrescar créditos después de programar
      await fetchCredits()

      toast({
        title: "Consulta programada",
        description: result.message || "La consulta se ha programado exitosamente",
      })

      return result
    } catch (error) {
      console.error("Error booking consultation:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al programar consulta",
        variant: "destructive",
      })
      throw error
    }
  }

  useEffect(() => {
    fetchCredits()
  }, [activityId])

  return {
    credits,
    isLoading,
    error,
    refetch: fetchCredits,
    useCredit,
    bookConsultation,
  }
}
