"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Calendar, User, Play, Clock } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import type { Enrollment } from "@/types/activity"

interface PurchasedActivityCardProps {
  enrollment: Enrollment
  nextActivity?: {
    title: string
    day: string
    week: number
  } | null
  realProgress?: number
  onActivityClick?: (activityId: string) => void
  onStartActivity?: (activityId: string, recommendedDay?: number) => void
}

export function PurchasedActivityCard({ enrollment, nextActivity, realProgress, onActivityClick, onStartActivity }: PurchasedActivityCardProps) {
  const { activity } = enrollment
  const [isNavigating, setIsNavigating] = useState(false)
  
  // Usar el progreso real calculado (enrollment.progress no existe en la base de datos)
  const progress = realProgress !== undefined ? realProgress : 0
  
  // Verificar si el programa ya ha comenzado
  const hasStarted = enrollment.start_date !== null;
  
  // Obtener el día de la semana actual
  const getCurrentDayOfWeek = () => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = domingo, 1 = lunes, etc.
    return dayOfWeek === 0 ? 7 : dayOfWeek; // Convertir domingo de 0 a 7
  };
  
  // Calcular cuándo comenzar el programa (día 1, semana 1, mes 1)
  const getProgramStartInfo = () => {
    const today = new Date();
    const currentDay = getCurrentDayOfWeek();
    const currentDate = today.getDate();
    const currentMonth = today.getMonth() + 1; // 0-indexed
    const currentYear = today.getFullYear();
    
    // Si es lunes, empezar hoy
    if (currentDay === 1) {
      return {
        canStartToday: true,
        startDate: today,
        message: "🔥 Empezar Hoy (Lunes)",
        subMessage: `Día 1, Semana 1, ${currentMonth}/${currentYear}`
      };
    }
    
    // Calcular próximo lunes
    const daysUntilMonday = (8 - currentDay) % 7;
    const nextMonday = new Date(today);
    nextMonday.setDate(today.getDate() + daysUntilMonday);
    
    const nextMondayMonth = nextMonday.getMonth() + 1;
    const nextMondayYear = nextMonday.getFullYear();
    
    return {
      canStartToday: false,
      startDate: nextMonday,
      message: `🔥 Empezar el Próximo Lunes (${daysUntilMonday} días)`,
      subMessage: `Día 1, Semana 1, ${nextMondayMonth}/${nextMondayYear}`
    };
  };
  
  const startInfo = getProgramStartInfo();
  
  // Función para manejar el inicio de la actividad
  const handleStartActivity = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (onStartActivity) {
      onStartActivity(activity.id.toString(), startInfo.startDate);
    }
  };

  // Función para manejar el click
  const handleCardClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (isNavigating) return
    
    setIsNavigating(true)
    
    try {
      if (onActivityClick) {
        // Usar callback si está disponible (para aplicación móvil)
        onActivityClick(activity.id.toString())
      } else {
        // Fallback a navegación externa (para web)
        const router = (await import("next/navigation")).useRouter()
        await router.push(`/activities/${activity.id}`)
      }
    } catch (error) {
      console.error("Error navigating to activity:", error)
    } finally {
      setIsNavigating(false)
    }
  }
  
  // Formatear fecha de compra
  const formatPurchaseDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  // Obtener tipo de actividad basado en la categoría
  const getActivityTypeDisplay = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'fitness':
        return 'Fitness'
      case 'nutrition':
        return 'Nutrición'
      case 'consultation':
        return 'Consulta'
      default:
        return category || 'Programa'
    }
  }

  return (
    <Card 
      className={`relative overflow-hidden rounded-xl shadow-lg bg-gray-900 text-white border-gray-800 cursor-pointer transition-all duration-300 hover:bg-gray-800/50 ${
        isNavigating ? 'opacity-75 scale-95' : 'hover:scale-105'
      }`}
      onClick={handleCardClick}
    >
      <div className="flex h-32">
        {/* Lado izquierdo - Coach */}
        <div className="flex flex-col items-center justify-center p-4 w-24 bg-gray-800/50">
          <div className="relative h-12 w-12 rounded-full overflow-hidden border-2 border-[#FF7939] mb-2">
            <Image
              src={activity.coach_avatar_url || "/placeholder.svg?height=48&width=48&query=coach"}
              alt={activity.coach_name || "Coach"}
              fill
              className="object-cover"
            />
          </div>
          <span className="text-xs font-semibold text-white text-center leading-tight">
            {activity.coach_name || "Coach"}
          </span>
        </div>

        {/* Lado derecho - Portada del ejercicio */}
        <div className="relative flex-1">
          {activity.media?.image_url ? (
            <Image
              src={activity.media.image_url}
              alt={activity.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#FF7939] to-[#E66829] flex items-center justify-center">
              <span className="text-2xl font-bold text-white">{activity.title.charAt(0)}</span>
            </div>
          )}
          
          {/* Overlay oscuro */}
          <div className="absolute inset-0 bg-black/50" />
          
          {/* Contenido sobre la imagen */}
          <div className="absolute inset-0 p-3 flex flex-col justify-between">
            {/* Badge de categoría en la esquina superior */}
            <div className="flex justify-end">
              <Badge className="bg-[#FF7939] text-white text-xs font-semibold px-2 py-1 rounded-full">
                {getActivityTypeDisplay(activity.category)}
              </Badge>
            </div>
            
            {/* Título y progreso en la parte inferior */}
            <div className="space-y-2">
              <h3 className="font-bold text-sm leading-tight line-clamp-2 text-white drop-shadow-lg">
                {activity.title}
              </h3>
              
              {/* Barra de progreso */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-gray-200">Progreso</span>
                  <span className="text-xs font-bold text-[#FF7939]">{progress}%</span>
                </div>
                <Progress value={progress} className="h-1.5 bg-gray-800/50" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Información adicional en la parte inferior */}
      <div className="p-3 bg-gray-800/30">
        {/* Botón Empezar Actividad o Próxima actividad */}
        {!hasStarted ? (
          <div className="space-y-2">
            <Button 
              onClick={handleStartActivity}
              className="w-full bg-[#FF7939] hover:bg-[#E66829] text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              {startInfo.message}
            </Button>
            <p className="text-xs text-gray-400 text-center">
              {startInfo.subMessage}
            </p>
            {!startInfo.canStartToday && (
              <p className="text-xs text-gray-500 text-center">
                Te recomendamos empezar los lunes para seguir el programa completo
              </p>
            )}
          </div>
        ) : (
          nextActivity && (
            <div className="flex items-center justify-between text-xs mb-2">
              <div className="flex items-center space-x-1">
                <Play className="h-3 w-3 text-[#FF7939]" />
                <span className="text-gray-300">Próxima:</span>
                <span className="text-white font-medium">{nextActivity.title}</span>
              </div>
              <div className="flex items-center space-x-1 text-gray-400">
                <Clock className="h-3 w-3" />
                <span>Día {nextActivity.day}</span>
              </div>
            </div>
          )
        )}

        {/* Fecha de compra */}
        <div className="flex items-center space-x-1 text-xs text-gray-400">
          <Calendar className="h-3 w-3" />
          <span>{formatPurchaseDate(enrollment.created_at)}</span>
          {hasStarted && enrollment.start_date && (
            <>
              <span className="mx-1">•</span>
              <span>Iniciado: {formatPurchaseDate(enrollment.start_date)}</span>
            </>
          )}
        </div>
        
      </div>
    </Card>
  )
}