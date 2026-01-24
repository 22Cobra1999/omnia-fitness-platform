"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Calendar, User, Play, Clock, Flame, Star, Zap, CheckCircle2, AlertCircle } from "lucide-react"
import Image from "next/image"
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
  size?: "small" | "medium" | "large"
}

export function PurchasedActivityCard({ enrollment, nextActivity, realProgress, onActivityClick, size = "medium" }: PurchasedActivityCardProps) {
  const { activity } = enrollment
  const [isNavigating, setIsNavigating] = useState(false)
  const [pendingCount, setPendingCount] = useState<number | null>(null)
  const [nextSessionDate, setNextSessionDate] = useState<string | null>(null)
  const [isFinished, setIsFinished] = useState(false)

  // Usar el progreso real calculado
  const progress = realProgress !== undefined ? realProgress : 0

  // Verificar si el programa ya ha comenzado
  const hasStarted = !!enrollment.start_date;

  // Calcular días restantes para empezar (Access expiration logic)
  const getDaysRemainingInfo = () => {
    // Fecha de compra
    const purchaseDate = new Date(enrollment.created_at)
    purchaseDate.setHours(0, 0, 0, 0)

    // Días de acceso configurados (default 30)
    const diasAcceso = activity.dias_acceso || 30

    // Fecha límite para iniciar (o fecha de expiración de acceso)
    // Use enrollment.expiration_date if available, otherwise calculate
    let expirationDate: Date
    if (enrollment.expiration_date) {
      expirationDate = new Date(enrollment.expiration_date)
    } else {
      expirationDate = new Date(purchaseDate)
      expirationDate.setDate(purchaseDate.getDate() + diasAcceso)
    }
    expirationDate.setHours(0, 0, 0, 0)

    // Hoy
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Días restantes
    const daysRemaining = Math.ceil((expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    const isExpired = daysRemaining < 0

    return { daysRemaining, isExpired, totalAccessDays: diasAcceso, expirationDate }
  }

  const { daysRemaining, isExpired, expirationDate } = getDaysRemainingInfo()

  // Obtener ejercicios/platos pendientes del día de hoy y próxima sesión
  useEffect(() => {
    const fetchProgressData = async () => {
      if (!hasStarted) {
        setPendingCount(null)
        setNextSessionDate(null)
        return
      }

      try {
        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user) return

        const today = new Date().toISOString().split('T')[0]

        // 1. Pendientes hoy
        const { data: record, error: pendingError } = await supabase
          .from('progreso_diario_actividad')
          .select('items_objetivo, items_completados')
          .eq('cliente_id', enrollment.client_id)
          .eq('actividad_id', activity.id)
          .eq('fecha', today)
          .maybeSingle()

        if (!pendingError && record) {
          const total = record.items_objetivo || 0
          const done = record.items_completados || 0
          setPendingCount(Math.max(0, total - done))
        } else {
          setPendingCount(null)
        }

        // 2. Próxima sesión
        if (activity.type?.toLowerCase() === 'workshop' || activity.type?.toLowerCase() === 'taller') {
          // Buscar próxima clase reservada o pendiente
          const { data: upcoming } = await supabase
            .from('taller_progreso_temas')
            .select('fecha_seleccionada')
            .eq('actividad_id', activity.id)
            .eq('cliente_id', enrollment.client_id)
            .gte('fecha_seleccionada', today)
            .order('fecha_seleccionada', { ascending: true })
            .limit(1)
            .maybeSingle()

          if (upcoming?.fecha_seleccionada) {
            setNextSessionDate(upcoming.fecha_seleccionada)
            setIsFinished(false)
          } else {
            setNextSessionDate(null)
            setIsFinished(true)
          }
        } else if (activity.type?.toLowerCase() === 'program' || activity.type?.toLowerCase() === 'programa') {
          // Buscar próximo día con objetivos
          const { data: upcoming } = await supabase
            .from('progreso_diario_actividad')
            .select('fecha')
            .eq('actividad_id', activity.id)
            .eq('cliente_id', enrollment.client_id)
            .gt('fecha', today)
            .gt('items_objetivo', 0)
            .order('fecha', { ascending: true })
            .limit(1)
            .maybeSingle()

          if (upcoming?.fecha) {
            setNextSessionDate(upcoming.fecha)
            setIsFinished(false)
          } else {
            setNextSessionDate(null)
            setIsFinished(progress >= 100)
          }
        }
      } catch (error) {
        console.error('Error fetching progress data:', error)
      }
    }

    fetchProgressData()
  }, [hasStarted, enrollment.client_id, activity.id, progress])

  const handleCardClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (isExpired && !hasStarted) return // Block if expired and never started

    if (isNavigating) return
    setIsNavigating(true)

    try {
      if (onActivityClick) {
        onActivityClick(activity.id.toString())
      } else {
        localStorage.setItem("openActivityId", activity.id.toString())
        window.location.href = '/?tab=activity'
      }
    } catch (error) {
      console.error("Error navigating:", error)
    } finally {
      setIsNavigating(false)
    }
  }

  // Helpers de estilo (mismos que ActivityCard)
  const getCategoryColor = (categoria?: string) => {
    switch (categoria?.toLowerCase()) {
      case 'fitness': return 'text-[#FF7939]'
      case 'nutrition': case 'nutricion': return 'text-orange-300'
      default: return 'text-[#FF7939]'
    }
  }

  const getCategoryBadge = (categoria?: string) => {
    switch (categoria?.toLowerCase()) {
      case 'fitness': return 'FITNESS'
      case 'nutrition': case 'nutricion': return 'NUTRICIÓN'
      default: return 'FITNESS'
    }
  }

  const getTypeBadge = (type?: string) => {
    switch (type?.toLowerCase()) {
      case 'program': case 'programa': return 'PROGRAMA'
      case 'workshop': case 'taller': return 'TALLER'
      case 'document': case 'documento': return 'DOCUMENTO'
      default: return 'PROGRAMA'
    }
  }

  const getTypeColor = (type?: string) => {
    switch (type?.toLowerCase()) {
      case 'program': case 'programa': return 'text-[#FF7939]'
      case 'workshop': case 'taller': return 'text-orange-300'
      case 'document': case 'documento': return 'text-white'
      default: return 'text-[#FF7939]'
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return ''
    // Handle YYYY-MM-DD explicitly to avoid timezone shifts
    if (dateString.includes('-') && !dateString.includes('T')) {
      const parts = dateString.split('-')
      if (parts.length === 3) {
        // Create date using local year, month (0-indexed), day
        const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]))
        return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
      }
    }
    // Fallback for ISO strings or other formats
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
  }

  // Imagen válida
  const imageUrl = activity.media?.image_url || activity.image_url || null

  // Determine dimensions based on size (matching ActivityCard)
  const getSizeClasses = () => {
    switch (size) {
      case "small": return "w-40 h-[30rem]" // Compact vertical
      case "large": return "w-80 h-[36rem]" // Featured
      default: return "w-64 h-[32rem]" // Standard medium
    }
  }

  // Adjust image height based on card size
  const getImageHeightClass = () => {
    switch (size) {
      case "small": return "h-48"
      case "large": return "h-56"
      default: return "h-48"
    }
  }

  return (
    <div
      className={`${getSizeClasses()} cursor-pointer group relative mx-auto flex-shrink-0`}
      onClick={handleCardClick}
    >
      <div className={`bg-[#1A1A1A] rounded-2xl overflow-hidden border border-gray-800 hover:border-[#FF7939]/30 transition-all duration-200 hover:scale-[1.02] h-full flex flex-col relative ${isExpired && !hasStarted ? 'opacity-50 grayscale' : ''}`}>

        {/* Activity Image (Parte Superior) */}
        <div className={`relative w-full ${getImageHeightClass()} flex-shrink-0`}>
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={activity.title || 'Actividad'}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full bg-[rgba(255,255,255,0.02)] flex items-center justify-center flex-col gap-3">
              <div className="w-16 h-16 bg-[#FF7939] rounded-xl flex items-center justify-center">
                <Flame className="w-8 h-8 text-black" />
              </div>
            </div>
          )}

          {/* Status Badge Removed per user request */}
        </div>

        {/* Content Body */}
        <div className="p-4 flex-1 flex flex-col h-full min-h-0 relative">

          {/* 1. Título */}
          <div className="mb-2">
            <h3 className="text-white font-bold leading-tight text-lg h-[2.5em] overflow-hidden line-clamp-2">
              {activity.title}
            </h3>
          </div>

          {/* 2. Coach Info */}
          <div className="border-t border-b border-gray-700/30 py-2 mb-3">
            <div className="flex items-center gap-2">
              <div className="relative h-5 w-5 rounded-full overflow-hidden bg-gray-700">
                <Image
                  src={activity.coach_avatar_url || "/placeholder.svg"}
                  alt={activity.coach_name || "Coach"}
                  fill
                  className="object-cover"
                />
              </div>
              <p className="text-xs font-medium text-gray-300 truncate">{activity.coach_name || 'Coach'}</p>
            </div>
          </div>

          {/* 3. Badges */}
          <div className="flex justify-between items-center mb-4 -mx-1">
            <span className={`bg-black/20 ${getCategoryColor(activity.categoria)} text-[10px] px-1.5 py-0.5 rounded-full font-bold border border-[#FF7939]/30`}>
              {getCategoryBadge(activity.categoria)}
            </span>
            <span className={`bg-black/20 ${getTypeColor(activity.type)} text-[10px] px-1.5 py-0.5 rounded-full font-bold border border-[#FF7939]/30`}>
              {getTypeBadge(activity.type)}
            </span>
          </div>

          {/* 4. Info Dinámica (Progreso / Fechas / Pendientes) */}
          <div className="flex-1 flex flex-col gap-2 text-sm text-gray-300">

            {/* Fecha Inicio o Countdown */}
            <div className="flex flex-col gap-1">
              {hasStarted ? (
                <>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-gray-400">
                      <Calendar className="w-3.5 h-3.5" />
                      <span className="text-xs">Iniciado: <span className="text-white">{formatDate(enrollment.start_date || '')}</span></span>
                    </div>
                  </div>
                  {enrollment.program_end_date ? (
                    <div className="flex items-center gap-1.5 text-[#FF7939]">
                      <Clock className="w-3.5 h-3.5" />
                      <span className="text-xs font-medium">Vence: <span className="text-white">{formatDate(enrollment.program_end_date)}</span></span>
                    </div>
                  ) : enrollment.expiration_date && (
                    <div className="flex items-center gap-1.5 text-gray-400">
                      <Clock className="w-3.5 h-3.5" />
                      <span className="text-xs">Expira: <span className="text-white">{formatDate(enrollment.expiration_date)}</span></span>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 text-yellow-500">
                    <Clock className="w-3.5 h-3.5" />
                    <span className="text-xs font-medium">
                      {daysRemaining !== null && daysRemaining > 0
                        ? `${daysRemaining} días para iniciar`
                        : 'Acceso expirado'}
                    </span>
                  </div>
                  {expirationDate && (
                    <div className="flex items-center gap-1.5 text-gray-500">
                      <Calendar className="w-3.5 h-3.5" />
                      <span className="text-xs">Límite: <span className="text-gray-300">{formatDate(expirationDate.toISOString())}</span></span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Actividades Pendientes Hoy / Next Session */}
            {hasStarted && (
              <div className="flex flex-col gap-1.5 mt-1">
                {((pendingCount !== null && pendingCount > 0) || isFinished || progress >= 100) && (
                  <div className="flex items-center gap-1.5">
                    <Zap className={`w-3.5 h-3.5 ${pendingCount ? 'text-[#FF7939]' : 'text-gray-500'}`} />
                    <span className="text-xs">
                      {pendingCount !== null && pendingCount > 0
                        ? <span className="text-white font-medium">{pendingCount} pendientes</span>
                        : <span className="text-gray-500 font-medium">Finalizado</span>
                      }
                    </span>
                  </div>
                )}

                {nextSessionDate && (
                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Sig: <span className="text-white font-medium">{formatDate(nextSessionDate)}</span></span>
                  </div>
                )}
              </div>
            )}

            {/* Próxima Sesión */}
            {hasStarted && nextActivity && !isFinished && progress < 100 && (
              <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-400 bg-gray-800/30 p-1.5 rounded-md">
                <Play className="w-3 h-3 text-[rgb(0,255,128)]" />
                <span className="truncate">
                  <span className="font-medium text-white">Próximo:</span> {nextActivity.title}
                </span>
              </div>
            )}
          </div>

          {/* 5. Progreso (Abajo) */}
          <div className="mt-auto pt-3">
            <div className="flex justify-between text-xs mb-1 text-gray-400">
              <span>Progreso</span>
              <span className="text-white font-bold">{progress}%</span>
            </div>
            <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#FF7939] rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
