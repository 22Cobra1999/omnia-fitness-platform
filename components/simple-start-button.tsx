"use client"

import { useState } from "react"
import { Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"

interface SimpleStartButtonProps {
  activityId: number
}

export function SimpleStartButton({ activityId }: SimpleStartButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const handleStart = async () => {
    setIsLoading(true)
    
    try {
      // Simular inicio de actividad
      toast({
        title: "¡Actividad iniciada!",
        description: "Tu programa ha comenzado. ¡Ve a la pestaña de actividades para ver tu progreso!",
        variant: "default",
      })
      
      // Redirigir a la pantalla de actividades
      router.push("/activities")
      
    } catch (error) {
      console.error("Error al iniciar actividad:", error)
      toast({
        title: "Error",
        description: "No se pudo iniciar la actividad. Intenta de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      onClick={handleStart}
      disabled={isLoading}
      className="flex items-center gap-2 bg-[#FF7939] hover:bg-[#E66829] text-white"
    >
      <Play className="h-4 w-4" />
      {isLoading ? "Iniciando..." : "Comenzar Actividad"}
    </Button>
  )
}







































