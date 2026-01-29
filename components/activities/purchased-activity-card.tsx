"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Calendar, User, Play, Clock, Flame, Star, Zap, CheckCircle2, AlertTriangle } from "lucide-react"
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
  // New override props for Coach View
  overridePendingCount?: number
  overrideNextSessionDate?: string | null
  isCoachView?: boolean
  daysCompleted?: number
  daysPassed?: number
  daysMissed?: number
  daysRemainingFuture?: number
  itemsCompletedTotal?: number
  itemsDebtPast?: number
  itemsPendingToday?: number
  amountPaid?: number
}

export function PurchasedActivityCard({
  enrollment,
  nextActivity,
  realProgress,
  onActivityClick,
  size = "medium",
  overridePendingCount,
  overrideNextSessionDate,
  isCoachView = false,
  daysCompleted,
  daysPassed,
  daysMissed,
  daysRemainingFuture,
  itemsCompletedTotal,
  itemsDebtPast,
  itemsPendingToday,
  amountPaid
}: PurchasedActivityCardProps) {
  const { activity } = enrollment
  const [isNavigating, setIsNavigating] = useState(false)

  // Initialize state with overrides if available
  const [pendingCount, setPendingCount] = useState<number | null>(overridePendingCount !== undefined ? overridePendingCount : null)
  const [nextSessionDate, setNextSessionDate] = useState<string | null>(overrideNextSessionDate !== undefined ? overrideNextSessionDate : null)
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
    // If overrides are provided, skip internal fetching and just sync state
    if (overridePendingCount !== undefined || overrideNextSessionDate !== undefined) {
      if (overridePendingCount !== undefined) setPendingCount(overridePendingCount)
      if (overrideNextSessionDate !== undefined) setNextSessionDate(overrideNextSessionDate)
      // Determine finished state loosely based on progress if overrides are used
      if (progress >= 100 && overridePendingCount === 0) setIsFinished(true)
      return
    }

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
          const r = record as any
          const total = r.items_objetivo || 0
          const done = r.items_completados || 0
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

          const u = upcoming as any
          if (u?.fecha_seleccionada) {
            setNextSessionDate(u.fecha_seleccionada)
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

          const u = upcoming as any
          if (u?.fecha) {
            setNextSessionDate(u.fecha)
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
  }, [hasStarted, enrollment.client_id, activity.id, progress, overridePendingCount, overrideNextSessionDate])

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
      case "small": return "w-[165px] h-[30rem]" // Matched to Search Card size (w-40 approx 160px, h-30rem)
      case "large": return "w-[360px] h-[36rem]" // Featured
      default: return "w-[340px] h-[32rem]" // Wider than previous w-80 (320px) -> 340px
    }
  }

  // Adjust image height based on card size
  const getImageHeightClass = () => {
    switch (size) {
      case "small": return isCoachView ? "h-32" : "h-48"
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
        {!isCoachView && (
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
          </div>
        )}

        {/* Content Body */}
        <div className="p-4 flex-1 flex flex-col h-full min-h-0 relative">

          {/* 1. Título */}
          <div className="mb-2">
            <h3 className="text-white font-bold leading-tight text-base h-[2.5em] overflow-hidden line-clamp-2">
              {activity.title}
            </h3>
          </div>

          {/* 2. Coach Info (Hidden in Coach View) */}
          {!isCoachView && (
            <div className="border-t border-b border-gray-700/30 py-2 mb-3">
              <div className="flex items-center gap-2">
                <div className="relative h-4 w-4 rounded-full overflow-hidden bg-gray-700">
                  <Image
                    src={activity.coach_avatar_url || "/placeholder.svg"}
                    alt={activity.coach_name || "Coach"}
                    fill
                    className="object-cover"
                  />
                </div>
                <p className="text-[11px] font-medium text-gray-300 truncate">{activity.coach_name || 'Coach'}</p>
              </div>
            </div>
          )}

          {/* 3. Badges */}
          <div className="flex justify-between items-center mb-2 -mx-0.5">
            <span className={`bg-black/20 ${getCategoryColor(activity.categoria ?? undefined)} text-[9px] px-2 py-0.5 rounded-full font-bold border border-[#FF7939]/20`}>
              {getCategoryBadge(activity.categoria ?? undefined)}
            </span>
            <span className={`bg-black/20 ${getTypeColor(activity.type ?? undefined)} text-[9px] px-1.5 py-0.5 rounded-full font-bold border border-[#FF7939]/20`}>
              {getTypeBadge(activity.type ?? undefined)}
            </span>
          </div>

          {/* 4. Info Dinámica (Progreso / Fechas / Pendientes) */}
          <div className="flex-1 flex flex-col gap-2 text-[11px] text-gray-300">

            {/* Coach View Specific Info - Redesigned for Minimalism & Verticality */}
            {isCoachView && (
              <div className="flex flex-col gap-3 mb-2 border-t border-zinc-800/20 pt-2.5">
                {/* SECCIÓN DÍAS / CLASES / TEMAS */}
                {(() => {
                  const type = activity.type?.toLowerCase() || '';
                  const cat = activity.categoria?.toLowerCase() || '';
                  const isWorkshop = type.includes('workshop') || type.includes('taller') || cat.includes('yoga');
                  const isDocument = type.includes('document') || type.includes('documento') || cat.includes('documento');

                  if (isDocument) {
                    return (
                      <div className="flex flex-col gap-1.5">
                        <div className="text-[9px] uppercase tracking-wider font-bold text-zinc-500 mb-0.5 px-0.5">
                          Items
                        </div>
                        <div className="flex flex-col text-[11px] text-zinc-400 gap-1.5 px-1">
                          <div className="flex justify-between items-center text-orange-200">
                            <span>Completados:</span>
                            <span className="font-bold text-orange-300">{itemsCompletedTotal ?? 0}</span>
                          </div>
                          <div className="flex justify-between items-center opacity-70">
                            <span>Restantes:</span>
                            <span className="text-zinc-400 font-medium">{itemsPendingToday ?? 0}</span>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  // Default view for traditional activities and workshops (Training, Nutrition, Workshops)
                  return (
                    <div className="flex flex-col gap-3">
                      <div className="flex flex-col gap-1.5">
                        <div className="text-[9px] uppercase tracking-wider font-bold text-zinc-500 mb-0.5 px-0.5">
                          Días
                        </div>
                        <div className="flex flex-col text-[11px] text-zinc-400 gap-1.5 px-1">
                          <div className="flex justify-between items-center text-orange-200">
                            <span>Completados:</span>
                            <span className="font-bold text-orange-300">{daysCompleted ?? 0}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span>En curso:</span>
                            <span className="text-zinc-300 font-medium">{daysPassed ?? 0}</span>
                          </div>
                          <div className="flex justify-between items-center opacity-80 text-red-400/60">
                            <span>Ausente:</span>
                            <span className="font-medium">{daysMissed ?? 0}</span>
                          </div>
                          <div className="flex justify-between items-center opacity-70">
                            <span>Próximos:</span>
                            <span className="text-zinc-500 font-medium">{daysRemainingFuture ?? 0}</span>
                          </div>
                        </div>
                      </div>

                      {/* SECCIÓN ITEMS (Only for traditional activities) */}
                      <div className="flex flex-col gap-1.5 border-t border-zinc-800/10 pt-2">
                        <div className="text-[9px] uppercase tracking-wider font-bold text-zinc-500 mb-0.5 px-0.5">
                          Items
                        </div>
                        <div className="flex flex-col text-[11px] text-zinc-400 gap-1.5 px-1">
                          <div className="flex justify-between items-center text-orange-200">
                            <span>Completados:</span>
                            <span className="font-bold text-orange-300">{itemsCompletedTotal ?? 0}</span>
                          </div>
                          <div className="flex justify-between items-center opacity-80 text-red-400/60">
                            <span>No logrados:</span>
                            <span className="font-medium">{itemsDebtPast ?? 0}</span>
                          </div>
                          <div className="flex justify-between items-center opacity-70">
                            <span>Restantes:</span>
                            <span className="text-zinc-400 font-medium">{itemsPendingToday ?? 0}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Fecha Inicio o Countdown */}
            <div className="flex flex-col gap-1 pt-1.5">
              {hasStarted ? (
                <>
                  <div className="flex flex-col gap-2 py-2 border-y border-zinc-800/40 my-1">
                    <div className="flex items-center justify-between text-[10px]">
                      <div className="flex items-center gap-1 text-gray-500 font-bold uppercase tracking-tighter">
                        <Calendar className="w-2.5 h-2.5" />
                        <span>Inicio</span>
                      </div>
                      <span className="text-zinc-300 font-medium">{formatDate(enrollment.start_date ?? '')}</span>
                    </div>

                    {enrollment.program_end_date && (
                      <div className="flex items-center justify-between text-[10px]">
                        <div className="flex items-center gap-1 text-gray-500 font-bold uppercase tracking-tighter">
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          <span>Fin</span>
                        </div>
                        <span className="text-zinc-300 font-medium">{formatDate(enrollment.program_end_date ?? '')}</span>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1.5">
                    <Clock className={`w-3.5 h-3.5 ${isExpired ? 'text-red-500' : 'text-zinc-400'}`} />
                    <span className={`text-[11px] font-bold ${isExpired ? 'text-red-500' : 'text-zinc-400'}`}>
                      {daysRemaining !== null && daysRemaining > 0
                        ? `${daysRemaining}d para iniciar`
                        : 'Expirado'}
                    </span>
                  </div>
                  {expirationDate && (
                    <div className="flex items-center gap-1.5 text-gray-500">
                      <Calendar className="w-2.5 h-2.5" />
                      <span className="text-[10px]">Límite: <span className="text-gray-300">{formatDate(expirationDate.toISOString())}</span></span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Actividades Pendientes Hoy / Next Session */}
            {hasStarted && !isCoachView && (
              <div className="flex flex-col gap-0.5 mt-0.5">
                {/* Logic specific for Programs: Show pending items today */}
                {(activity.type?.toLowerCase() === 'program' || activity.type?.toLowerCase() === 'programa') && (
                  (pendingCount !== null && pendingCount > 0) ? (
                    <div className="flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-[#FF7939]" />
                      <span className="text-[11px] text-white font-medium">
                        {pendingCount} ejercicios/platos hoy
                      </span>
                    </div>
                  ) : null
                )}

                {/* For Documents/Workshops: Only show Next Session if exists (and not finished) */}
                {nextSessionDate && (
                  <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                    <Calendar className="w-3 h-3" />
                    <span>Sig: <span className="text-white font-medium">{formatDate(nextSessionDate)}</span></span>
                  </div>
                )}
              </div>
            )}

            {/* Próxima Sesión */}
            {hasStarted && nextActivity && !isFinished && progress < 100 && !isCoachView && (
              <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-gray-400 bg-gray-800/30 p-1 rounded-md">
                <Play className="w-2.5 h-2.5 text-[rgb(0,255,128)]" />
                <span className="truncate">
                  <span className="font-medium text-white">Próximo:</span> {nextActivity.title}
                </span>
              </div>
            )}
          </div>

          {/* 5. Progreso (Abajo) */}
          <div className="mt-auto pt-1.5 border-t border-zinc-800/20 relative">
            {(() => {
              const isDocOrWorkshop = activity.type?.toLowerCase().includes('document') ||
                activity.type?.toLowerCase().includes('taller') ||
                activity.type?.toLowerCase().includes('workshop');

              // Si es Doc/Workshop y está finalizado (o 100% progreso)
              if (isDocOrWorkshop && (isFinished || progress >= 100)) {
                return (
                  <div className="flex flex-col gap-1">
                    <div className="h-0.5 bg-zinc-800/50 rounded-full overflow-hidden">
                      <div className="h-full bg-[#FF7939] rounded-full" style={{ width: '100%' }} />
                    </div>
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-white font-medium">Finalizado</span>
                      <span className="text-[#FF7939] font-bold">{progress}%</span>
                    </div>
                  </div>
                );
              }

              // Default standard progress view
              return (
                <>
                  <div className="flex justify-between text-[11px] mb-1 text-[#FF7939]">
                    <span className="text-[9px] font-bold uppercase tracking-wider">Progreso</span>
                    <span className="font-black text-[12px]">{progress}%</span>
                  </div>
                  <div className="h-0.5 bg-zinc-800/50 rounded-full overflow-hidden mb-1">
                    <div
                      className="h-full bg-[#FF7939] rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(255,121,57,0.3)]"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </>
              );
            })()}

            {/* Price section - Centered & Simplified */}
            {/* Price section - Centered & Simplified - Removed as per user request */}
            {/* <div className="flex justify-center items-center mt-0.5 pt-0.5 border-t border-zinc-900/30 relative">
              <span className="text-xs font-black text-zinc-200">${Math.round(amountPaid ?? 0)}</span>

              // Delay Alert Icon (Right Corner)
              {isCoachView && (() => {
                const itemsOK = itemsCompletedTotal || 0;
                const itemsDebt = itemsDebtPast || 0;
                const itemsRest = itemsPendingToday || 0;
                const totalItems = itemsOK + itemsDebt + itemsRest;

                const daysOK = daysCompleted || 0;
                const daysPassing = daysPassed || 0;
                const daysMiss = daysMissed || 0;
                const totalDays = daysOK + daysPassing + daysMiss;

                const isDocument = enrollment.activity.type?.toLowerCase().includes('document');
                let delayPercent = 0;

                if (isDocument) {
                  delayPercent = totalItems > 0 ? (itemsDebt / totalItems) * 100 : 0;
                } else {
                  delayPercent = totalDays > 0 ? (daysMiss / totalDays) * 100 : 0;
                }

                if (delayPercent <= 0) return null;

                let alertColor = "text-yellow-400";
                let alertLabel = "Leve";
                if (delayPercent > 50) {
                  alertColor = "text-red-400";
                  alertLabel = "Crítico";
                } else if (delayPercent > 20) {
                  alertColor = "text-orange-400";
                  alertLabel = "Moderado";
                }

                return (
                  <div className="absolute right-0 flex items-center justify-center">
                    <span className={`text-[10px] font-bold uppercase tracking-wide ${alertColor}`}>
                      {alertLabel}
                    </span>
                  </div>
                );
              })()}
            </div> */}
          </div>

        </div>
      </div>
    </div>
  )
}
