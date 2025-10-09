"use client"

import { useAuth } from "@/contexts/auth-context"
import { Loader2 } from "lucide-react"

export default function AvailabilityPage() {
  const { user } = useAuth()

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Disponibilidad del Coach</h1>
        <p className="text-gray-600">Funcionalidad en desarrollo</p>
      </div>
    </div>
  )
}
