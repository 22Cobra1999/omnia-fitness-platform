"use client"

import { BookingPage } from "@/components/client/booking-page"
import { useUser } from "@supabase/auth-helpers-react"
import { useParams } from "next/navigation"
import { Loader2 } from "lucide-react"

export default function BookingPageRoute() {
  const user = useUser()
  const params = useParams()

  const coachId = params.coachId as string
  const activityId = Number.parseInt(params.activityId as string)

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  // Aquí podrías cargar los datos del coach y la actividad desde la API
  const mockCoachData = {
    name: "Dr. María González",
    avatar: "/placeholder.svg?height=64&width=64",
    rating: 4.8,
    location: "Madrid, España",
    specialties: ["Nutrición", "Pérdida de peso", "Entrenamiento funcional"],
    experience: "5+ años de experiencia",
  }

  const mockActivityData = {
    title: "Consulta Nutricional Personalizada",
    description: "Evaluación completa de tus hábitos alimenticios y plan personalizado",
    duration: 30,
    price: 45,
  }

  return (
    <BookingPage
      coachId={coachId}
      clientId={user.id}
      activityId={activityId}
      coachData={mockCoachData}
      activityData={mockActivityData}
    />
  )
}
