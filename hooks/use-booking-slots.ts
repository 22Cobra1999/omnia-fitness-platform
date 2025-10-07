"use client"

import { useState } from "react"
import type { AvailabilitySlot, BookingFormData } from "@/types/availability"
import { toast } from "@/components/ui/use-toast"

export function useBookingSlots(coachId: string) {
  const [availableSlots, setAvailableSlots] = useState<AvailabilitySlot[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isBooking, setIsBooking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAvailableSlots = async (startDate: string, endDate?: string, consultationType = "videocall") => {
    if (!coachId) return

    setIsLoading(true)
    setError(null)

    try {
      let url = `/api/booking/available-slots?coach_id=${coachId}&start_date=${startDate}&consultation_type=${consultationType}`

      if (endDate) {
        url += `&end_date=${endDate}`
      }

      const response = await fetch(url)

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Error al cargar horarios disponibles")
      }

      const data = await response.json()
      setAvailableSlots(data)
      return data
    } catch (err) {
      console.error("Error fetching available slots:", err)
      setError(err instanceof Error ? err.message : "Error desconocido")
      return []
    } finally {
      setIsLoading(false)
    }
  }

  const bookSlot = async (bookingData: BookingFormData) => {
    setIsBooking(true)
    setError(null)

    try {
      const response = await fetch("/api/booking", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bookingData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error al programar la consulta")
      }

      // Actualizar los slots disponibles eliminando el que se acaba de reservar
      setAvailableSlots((prev) =>
        prev.filter(
          (slot) =>
            !(
              slot.date === bookingData.date &&
              slot.start_time === bookingData.start_time &&
              slot.end_time === bookingData.end_time
            ),
        ),
      )

      toast({
        title: "Consulta programada",
        description: data.message || "Se ha programado tu consulta exitosamente",
      })

      return data
    } catch (err) {
      console.error("Error booking slot:", err)
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Error al programar la consulta",
        variant: "destructive",
      })
      throw err
    } finally {
      setIsBooking(false)
    }
  }

  return {
    availableSlots,
    isLoading,
    isBooking,
    error,
    fetchAvailableSlots,
    bookSlot,
  }
}
