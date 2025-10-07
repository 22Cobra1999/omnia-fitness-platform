"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { createClient } from '@/lib/supabase-browser'
import { toast } from "@/components/ui/use-toast"

interface ActivityEnrollButtonProps {
  activityId: number
  userId: string
  price: number
  className?: string
}

export function ActivityEnrollButton({ activityId, userId, price, className }: ActivityEnrollButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleEnroll = async () => {
    if (!userId) {
      toast({
        title: "Inicia sesión",
        description: "Debes iniciar sesión para inscribirte en esta actividad.",
        variant: "destructive",
      })
      router.push("/auth/login")
      return
    }

    setIsLoading(true)

    try {
      // Verificar si ya está inscrito
      const { data: existingEnrollment } = await supabase
        .from("activity_enrollments")
        .select("enrollment_id")
        .eq("activity_id", activityId)
        .eq("user_id", userId)
        .single()

      if (existingEnrollment) {
        toast({
          title: "Ya estás inscrito",
          description: "Ya estás inscrito en esta actividad.",
        })
        setIsLoading(false)
        return
      }

      // Crear la inscripción
      const { error } = await supabase.from("activity_enrollments").insert([
        {
          activity_id: activityId,
          user_id: userId,
          amount_paid: price,
          payment_method: "credit_card", // Simulado
          status: "Active",
        },
      ])

      if (error) throw error

      toast({
        title: "¡Inscripción exitosa!",
        description: "Te has inscrito correctamente en esta actividad.",
      })

      // Refrescar la página para mostrar el cambio
      router.refresh()
    } catch (error) {
      console.error("Error al inscribirse:", error)
      toast({
        title: "Error",
        description: "No se pudo completar la inscripción. Inténtalo de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button onClick={handleEnroll} disabled={isLoading} className={className}>
      {isLoading ? "Procesando..." : "Inscribirse"}
    </Button>
  )
}
