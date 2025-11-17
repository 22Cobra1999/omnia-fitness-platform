"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Calendar, User, Play, Clock, Flame } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import type { Enrollment } from "@/types/activity"
import { createClient } from '@/lib/supabase/supabase-client'

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
  const [pendingCount, setPendingCount] = useState<number | null>(null)
  
  // Usar el progreso real calculado (enrollment.progress no existe en la base de datos)
  const progress = realProgress !== undefined ? realProgress : 0
  
  // Verificar si el programa ya ha comenzado
  const hasStarted = enrollment.start_date !== null;
  
  // Calcular días restantes para empezar y verificar si está bloqueado
  const getDaysRemainingAndBlocked = () => {
    if (hasStarted) {
      return { daysRemaining: null, isBlocked: false, isLastDay: false }
    }
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const purchaseDate = new Date(enrollment.created_at)
    purchaseDate.setHours(0, 0, 0, 0)
    
    const diasAcceso = activity.dias_acceso || 30 // Default 30 días si no está definido
    const expirationDate = new Date(purchaseDate)
    expirationDate.setDate(purchaseDate.getDate() + diasAcceso)
    
    const daysRemaining = Math.ceil((expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    const isLastDay = daysRemaining === 0
    // Bloquear solo si pasaron los días (el último día puede empezarlo sin problema)
    const isBlocked = daysRemaining < 0
    
    return { daysRemaining, isBlocked, isLastDay }
  }
  
  const { daysRemaining, isBlocked } = getDaysRemainingAndBlocked()

  // Obtener ejercicios/platos pendientes del día de hoy
  useEffect(() => {
    const fetchTodayPending = async () => {
      // Solo obtener pendientes si la actividad ya ha comenzado
      if (!hasStarted) {
        setPendingCount(null)
        return
      }

      try {
        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session?.user) return

        const today = new Date().toISOString().split('T')[0]
        
        // Obtener registro de progreso del día de hoy - usar maybeSingle para evitar error 406
        const { data: progressRecord, error } = await supabase
          .from('progreso_cliente')
          .select('ejercicios_pendientes')
          .eq('cliente_id', enrollment.client_id)
          .eq('actividad_id', activity.id)
          .eq('fecha', today)
          .maybeSingle()

        if (error && error.code !== 'PGRST116') {
          console.error('Error obteniendo pendientes:', error)
          setPendingCount(null)
          return
        }

        if (progressRecord?.ejercicios_pendientes) {
          let pendientes: any = {}
          
          try {
            if (typeof progressRecord.ejercicios_pendientes === 'string') {
              pendientes = JSON.parse(progressRecord.ejercicios_pendientes)
            } else {
              pendientes = progressRecord.ejercicios_pendientes
            }

            const count = Array.isArray(pendientes) ? pendientes.length : Object.keys(pendientes || {}).length
            setPendingCount(count > 0 ? count : null)
          } catch (parseError) {
            console.error('Error parseando pendientes:', parseError)
            setPendingCount(null)
          }
        } else {
          setPendingCount(null)
        }
      } catch (error) {
        console.error('Error obteniendo pendientes del día:', error)
        setPendingCount(null)
      }
    }

    fetchTodayPending()
  }, [hasStarted, enrollment.client_id, activity.id])

  // Función para manejar el click
  const handleCardClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Si está bloqueado, no permitir acceso
    if (isBlocked) {
      return
    }
    
    if (isNavigating) return
    
    setIsNavigating(true)
    
    try {
      if (onActivityClick) {
        // Usar callback si está disponible (para aplicación móvil)
        onActivityClick(activity.id.toString())
      } else {
        // Fallback a navegación al tab de actividades
        try {
          localStorage.setItem("openActivityId", activity.id.toString())
        } catch (e) {
          console.error("Error guardando en localStorage:", e)
        }
        window.location.href = '/?tab=activity'
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

  // Obtener tipo de actividad basado en la categoría - usar categoria directamente de la base de datos
  // La columna en la BD es 'categoria', no 'category'
  const categoria = activity.categoria || (activity as any).category || 'fitness'
  
  // Debug: Log para verificar la categoría
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 PurchasedActivityCard - Activity ID:', activity.id, 'Categoria:', categoria, 'Raw activity:', {
      categoria: activity.categoria,
      category: (activity as any).category,
      type: activity.type
    })
  }
  
  const getActivityTypeDisplay = (category: string) => {
    const cat = category?.toLowerCase() || ''
    switch (cat) {
      case 'fitness':
        return 'Fitness'
      case 'nutrition':
      case 'nutricion':
        return 'Nutrición'
      case 'consultation':
        return 'Consulta'
      default:
        // Si no coincide, intentar inferir del tipo
        if (cat.includes('nutri')) return 'Nutrición'
        if (cat.includes('fit')) return 'Fitness'
        return 'Fitness' // Default a Fitness
    }
  }

  // Formatear fecha de inicio para mostrar solo el día
  const formatStartDate = (dateString: string | null) => {
    if (!dateString) return null
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short'
    })
  }
  
  // Formatear días restantes
  const formatDaysRemaining = (days: number | null) => {
    if (days === null) return null
    if (days < 0) return 'Expirado'
    if (days === 0) return 'Último día para empezar'
    if (days === 1) return '1 día para empezar'
    return `${days} días para empezar`
  }

  // Obtener URL de imagen para el fondo difuminado
  const imageUrl = activity.media?.image_url || null

  return (
    <Card 
      className={`relative overflow-hidden rounded-xl shadow-xl transition-all duration-300 ${
        isBlocked 
          ? 'opacity-50 cursor-not-allowed' 
          : isNavigating 
            ? 'opacity-75 scale-95 cursor-pointer' 
            : 'hover:scale-[1.01] cursor-pointer'
      }`}
      onClick={handleCardClick}
      style={{
        background: 'rgba(30, 30, 30, 0.6)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
      }}
    >
      {/* Imagen horizontal con todo el contenido integrado */}
      <div className="relative w-full h-44 overflow-hidden">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={activity.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#FF7939] to-[#E66829] flex items-center justify-center">
            <span className="text-3xl font-bold text-white">{activity.title.charAt(0)}</span>
          </div>
        )}
        
        {/* Overlay con gradiente para glassmorphism */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        
        {/* Badge de categoría en la esquina superior izquierda - glassmorphism */}
        <div className="absolute top-2 left-2 z-10">
          <Badge 
            className="text-xs font-semibold px-2.5 py-0.5 rounded-full border-0 text-white"
            style={{
              background: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
            }}
          >
            {getActivityTypeDisplay(categoria)}
          </Badge>
        </div>

        {/* Ícono de fuego con pendientes del día en la esquina superior derecha */}
        {hasStarted && pendingCount !== null && pendingCount > 0 && (
          <div 
            className="absolute top-2 right-2 z-10 flex items-center gap-1.5 px-2 py-1 rounded-full"
            style={{
              background: 'rgba(255, 121, 57, 0.2)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 121, 57, 0.3)',
            }}
          >
            <Flame className="w-3.5 h-3.5 text-[#FF7939]" fill="#FF7939" />
            <span className="text-xs font-bold text-white">{pendingCount}</span>
          </div>
        )}
        
        {/* Contenido principal: Título y progreso */}
        <div className="absolute bottom-12 left-0 right-0 p-3 z-10">
          <div className="space-y-1.5">
            <h3 
              className="font-semibold text-base leading-tight text-white drop-shadow-2xl overflow-hidden" 
              style={{
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                lineHeight: '1.2em',
                textShadow: '0 2px 8px rgba(0,0,0,0.8)',
              }}
            >
              {activity.title}
            </h3>
            
            {/* Barra de progreso con glassmorphism - naranja translúcido sin fondo negro */}
            <div className="flex items-center gap-2">
              <div 
                className="relative h-1 flex-1 rounded-full overflow-hidden"
                style={{
                  background: 'rgba(255, 121, 57, 0.2)',
                  backdropFilter: 'blur(5px)',
                  WebkitBackdropFilter: 'blur(5px)',
                }}
              >
                <div 
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${progress}%`,
                    background: 'rgba(255, 121, 57, 0.8)',
                    backdropFilter: 'blur(5px)',
                    WebkitBackdropFilter: 'blur(5px)',
                    boxShadow: '0 0 10px rgba(255, 121, 57, 0.5)',
                  }}
                />
              </div>
              <span className="text-xs font-bold text-white flex-shrink-0">{progress}%</span>
            </div>
          </div>
        </div>

        {/* Contenido del coach en la parte inferior - integrado en la misma imagen */}
        <div className="absolute bottom-0 left-0 right-0 p-3 z-10">
          <div className="flex items-center justify-between gap-2.5 w-full">
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              <div className="relative h-10 w-10 rounded-full overflow-hidden flex-shrink-0">
                <Image
                  src={activity.coach_avatar_url || "/placeholder.svg?height=40&width=40&query=coach"}
                  alt={activity.coach_name || "Coach"}
                  fill
                  className="object-cover"
                />
              </div>
              <p className="text-sm font-normal text-white truncate drop-shadow-lg">
                {activity.coach_name || "Coach"}
              </p>
            </div>
            {/* Fecha de inicio o días restantes en la esquina derecha */}
            {hasStarted && enrollment.start_date ? (
              <span className="text-xs font-medium text-white/90 flex-shrink-0 drop-shadow-lg">
                {formatStartDate(enrollment.start_date)}
              </span>
            ) : daysRemaining !== null ? (
              <span className={`text-xs font-medium flex-shrink-0 drop-shadow-lg ${
                isBlocked ? 'text-red-400' : daysRemaining <= 3 ? 'text-yellow-400' : 'text-white/90'
              }`}>
                {formatDaysRemaining(daysRemaining)}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </Card>
  )
}

