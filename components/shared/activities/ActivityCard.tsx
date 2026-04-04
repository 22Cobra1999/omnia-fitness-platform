"use client"

import React from 'react'
import Image from 'next/image'
import { Star, Calendar, Users, User, Globe, Dumbbell, Zap, Lock, Unlock, UtensilsCrossed, Flame, MapPin, RotateCcw, Pause, MonitorSmartphone, Video, FileText, Scale, Combine } from 'lucide-react'
import { cn } from '@/lib/utils/utils'
import type { Activity } from '@/types/activity'

interface ActivityCardProps {
  activity: Activity
  size?: 'small' | 'medium' | 'large'
  variant?: 'default' | 'blurred'
  onClick?: (activity: Activity) => void
  priority?: boolean
}

const ActivityCard: React.FC<ActivityCardProps> = ({
  activity,
  size = 'medium',
  variant = 'default',
  onClick,
  priority = false
}) => {
  const loading = false

  const previewStats = (activity as any).previewStats
  const isWorkshop = activity.type === 'workshop'
  const isDocument = activity.type === 'document'
  const cantidadTemas = (activity as any).cantidadTemas
  const cantidadDias = (activity as any).cantidadDias

  const documentDuration = (() => {
    if (!isDocument) return null
    if (!activity.semanas_totales || activity.semanas_totales === 0) {
      return '-'
    }
    const semanas = activity.semanas_totales
    if (semanas < 1) {
      const dias = Math.ceil(semanas * 7)
      return `${dias} d`
    }
    if (semanas > 4) {
      const meses = Math.ceil(semanas / 4)
      return `${meses} m`
    }
    return `${Math.ceil(semanas)} s`
  })()

  const totalSessions = activity.totalSessions || 0

  const sessionsToShow = isDocument && documentDuration
    ? documentDuration
    : isWorkshop
      ? (activity.sesiones_dias_totales || totalSessions || (cantidadDias !== undefined ? cantidadDias : (previewStats?.sesiones || 0)))
      : (previewStats?.sesiones || previewStats?.totalSessions || activity.sesiones_dias_totales || activity.totalSessions || 0)

  const uniqueExercises = (() => {
    if ((isWorkshop || isDocument) && cantidadTemas !== undefined) {
      return cantidadTemas
    }
    if (previewStats !== undefined && previewStats !== null) {
      const previewUnicos = previewStats.ejerciciosUnicos
      if (previewUnicos !== undefined && previewUnicos !== null) {
        return previewUnicos
      }
      if (previewStats.ejerciciosTotales !== undefined && previewStats.ejerciciosTotales !== null) {
        return previewStats.ejerciciosTotales
      }
    }
    if (activity.items_unicos) {
      return activity.items_unicos
    }
    return Number(activity.exercisesCount) || 0
  })()
  const productCapacity = activity.capacity ?? (activity as any).stockQuantity ?? (activity as any).available_slots ?? (activity as any).total_slots
  const productModality = activity.modality || (activity as any).type || null

  let objetivos = (activity as any).objetivos
  if (!objetivos || !Array.isArray(objetivos)) {
    objetivos = []
    if ((activity as any).workshop_type) {
      try {
        let parsed: any = (activity as any).workshop_type
        if (typeof (activity as any).workshop_type === 'string') {
          const ws = (activity as any).workshop_type.trim()
          if (ws.startsWith('{') || ws.startsWith('[')) {
            parsed = JSON.parse(ws)
          }
        }
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed) && parsed.objetivos) {
          objetivos = String(parsed.objetivos).split(';').map((obj: string) => obj.trim()).filter((obj: string) => obj.length > 0)
        } else if (Array.isArray(parsed)) {
          objetivos = parsed
        }
      } catch (e) {
        objetivos = []
      }
    }
  }

  const capacityDisplay = (String(productCapacity) === '∞' || String(productCapacity) === 'Ilimitada' || String(productCapacity) === 'Infinity' || (typeof productCapacity === 'number' && productCapacity > 9999))
    ? '∞'
    : (productCapacity !== undefined && productCapacity !== null && productCapacity !== '' && !isNaN(parseInt(productCapacity.toString())) ? parseInt(productCapacity.toString()) : null)

  const getValidImageUrl = (activity: Activity) => {
    const imageUrl = activity.media?.image_url ||
      activity.image_url ||
      (activity as any).activity_media?.[0]?.image_url
    if (imageUrl &&
      imageUrl.trim() !== '' &&
      !imageUrl.includes('via.placeholder.com') &&
      !imageUrl.includes('placeholder.svg') &&
      !imageUrl.includes('placeholder') &&
      !imageUrl.startsWith('/placeholder')) {
      return imageUrl
    }
    return null
  }

  const getRatingDisplay = (rating?: number | null, totalReviews?: number | null) => {
    if (!rating || rating === 0) return 'NUEVO'
    return `${rating.toFixed(1)} (${totalReviews || 0})`
  }

  const getCategoryBadge = (categoria?: string) => {
    switch (categoria?.toLowerCase()) {
      case 'fitness': return 'FITNESS'
      case 'nutrition':
      case 'nutricion': return 'NUTRICIÓN'
      default: return 'FITNESS'
    }
  }

  const getTypeBadge = (type?: string) => {
    switch (type?.toLowerCase()) {
      case 'program':
      case 'programa': return 'PROGRAMA'
      case 'workshop':
      case 'taller': return 'TALLER'
      case 'document':
      case 'documento': return 'DOCUMENTO'
      default: return 'PROGRAMA'
    }
  }

  const getCategoryColor = (categoria?: string) => {
    switch (categoria?.toLowerCase()) {
      case 'fitness': return 'text-[#FF7939]'
      case 'nutrition':
      case 'nutricion': return 'text-orange-300'
      default: return 'text-[#FF7939]'
    }
  }

  const getTypeColor = (type?: string) => {
    switch (type?.toLowerCase()) {
      case 'program':
      case 'programa': return 'text-[#FF7939]'
      case 'workshop':
      case 'taller': return 'text-orange-300'
      case 'document':
      case 'documento': return 'text-white'
      default: return 'text-[#FF7939]'
    }
  }

  const formatPrice = (price?: number | string | null) => {
    if (!price) return '$0'
    const numPrice = typeof price === 'string'
      ? parseFloat(price.replace(',', '.'))
      : price

    if (isNaN(numPrice)) return '$0'

    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(numPrice)
  }

  const getDifficultyLabel = (difficulty?: string) => {
    switch (difficulty) {
      case 'beginner': return 'Principiante'
      case 'intermediate': return 'Intermedio'
      case 'advanced': return 'Avanzado'
      default: return 'Principiante'
    }
  }

  const getVisibilityIcon = (isPublic?: boolean) => {
    return isPublic ? <Unlock className="w-4 h-4 text-gray-400" /> : <Lock className="w-4 h-4 text-[#FF7939]" />
  }

  const getModalityIcon = (modality?: string | null) => {
    if (!modality) return <Globe className="w-5 h-5" />
    const mod = modality.toLowerCase().trim()
    switch (mod) {
      case 'online': return <Globe className="w-5 h-5" />
      case 'presencial': return <MapPin className="w-5 h-5" />
      case 'híbrido':
      case 'hibrido': return (
        <div className="flex items-center gap-0.5">
          <Globe className="w-4 h-4 opacity-70" />
          <span className="text-[10px] font-black text-white/20">/</span>
          <MapPin className="w-4 h-4 opacity-90" />
        </div>
      )
      default: return <Globe className="w-5 h-5" />
    }
  }

  const getModalityColor = (modality?: string | null) => {
    if (!modality) return 'text-[#FF7939]'
    const mod = modality.toLowerCase().trim()
    switch (mod) {
      case 'online': return 'text-[#FF7939]'
      case 'presencial': return 'text-red-500'
      case 'híbrido':
      case 'hibrido': return 'text-purple-400'
      default: return 'text-[#FF7939]'
    }
  }

  const getDifficultyFires = (difficulty?: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'beginner': return <Flame className="w-4 h-4 text-orange-300" />
      case 'intermediate':
        return (
          <div className="flex gap-1">
            <Flame className="w-4 h-4 text-[#FF7939]" />
            <Flame className="w-4 h-4 text-[#FF7939]" />
          </div>
        )
      case 'advanced':
        return (
          <div className="flex gap-1">
            <Flame className="w-4 h-4 text-red-500" />
            <Flame className="w-4 h-4 text-red-500" />
            <Flame className="w-4 h-4 text-red-500" />
          </div>
        )
      default: return <Flame className="w-4 h-4 text-orange-300" />
    }
  }

  const getDifficultyUtensils = (difficulty?: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'beginner': return <UtensilsCrossed className="w-4 h-4 text-orange-300" />
      case 'intermediate':
        return (
          <div className="flex gap-1">
            <UtensilsCrossed className="w-4 h-4 text-[#FF7939]" />
            <UtensilsCrossed className="w-4 h-4 text-[#FF7939]" />
          </div>
        )
      case 'advanced':
        return (
          <div className="flex gap-1">
            <UtensilsCrossed className="w-4 h-4 text-red-500" />
            <UtensilsCrossed className="w-4 h-4 text-red-500" />
            <UtensilsCrossed className="w-4 h-4 text-red-500" />
          </div>
        )
      default: return <UtensilsCrossed className="w-4 h-4 text-orange-300" />
    }
  }

  const getFriendlyDietName = (diet: string) => {
    switch (diet.toLowerCase()) {
      case 'baja_carbohidratos': return 'Baja en carbohidratos'
      case 'keto': return 'Keto'
      case 'paleo': return 'Paleo'
      case 'vegana': return 'Vegana'
      case 'vegetariana': return 'Vegetariana'
      case 'mediterranea': return 'Mediterránea'
      case 'balanceada': return 'Balanceada'
      default: return diet
    }
  }

  const getDietTypeDisplay = (dietType?: string | null) => {
    if (!dietType) return null
    const friendlyName = getFriendlyDietName(dietType)
    const truncatedName = friendlyName.length > 12 ? `${friendlyName.substring(0, 12)}...` : friendlyName
    return (
      <div className="flex items-center gap-1 text-[#FF7939]">
        <UtensilsCrossed className="w-4 h-4" />
        <span className="text-sm font-medium whitespace-nowrap" title={friendlyName}>{truncatedName}</span>
      </div>
    )
  }

  const getSizeClasses = () => {
    switch (size) {
      case 'small': return 'w-44 md:w-48 h-auto flex flex-col'
      case 'medium': return 'w-64 md:w-72 h-auto flex flex-col'
      case 'large': return 'w-72 md:w-80 h-auto flex flex-col'
      default: return 'w-64 h-auto flex flex-col'
    }
  }

  const isPaused = (activity as any).is_paused || false
  const tallerActivoValue = (activity as any).taller_activo
  const isWorkshopInactive = activity.type === 'workshop' && tallerActivoValue === false
  const includedMeetCredits = (() => {
    const raw = (activity as any).included_meet_credits
    if (typeof raw === 'number') return raw
    const parsed = parseInt(String(raw ?? '0'), 10)
    return Number.isFinite(parsed) ? parsed : 0
  })()
  const shouldShowAsInactive = isPaused || isWorkshopInactive

  return (
    <div
      className={cn(
        getSizeClasses(),
        "cursor-pointer group relative flex-shrink-0 bg-[#121212] overflow-hidden rounded-[2.2rem]"
      )}
      onClick={() => onClick?.(activity)}
    >
      <div className={`rounded-[2.2rem] overflow-hidden border transition-all duration-500 hover:scale-[1.02] h-full flex flex-col relative
        ${variant === 'blurred'
          ? 'bg-white/5 backdrop-blur-md border-white/10 hover:border-[#FF7939]/50'
          : 'bg-black border-white/5 hover:border-[#FF7939]/30'
        }
        ${shouldShowAsInactive ? 'opacity-50 grayscale' : ''}`}>

        <div className="relative w-full h-[260px] flex-shrink-0 overflow-hidden rounded-t-[2.2rem] bg-black">
          {getValidImageUrl(activity) ? (
            <Image
              src={getValidImageUrl(activity)!}
              alt={activity.title || 'Imagen de actividad'}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-103 z-0"
              sizes="(max-width: 768px) 30vw, (max-width: 1200px) 20vw, 15vw"
              priority={priority}
            />
          ) : (
            <div className="w-full h-full bg-[rgba(255,255,255,0.02)] flex items-center justify-center flex-col gap-3">
              <div className="w-16 h-16 bg-[#FF7939] rounded-xl flex items-center justify-center">
                <Flame className="w-8 h-8 text-black" />
              </div>
              <h1 className="text-gray-400 text-xl font-bold">OMNIA</h1>
            </div>
          )}

          {/* Hardcoded Multi-Stop Gradient Overlay: Guaranteed visibility for shading behind coach/title */}
          <div
            className="absolute inset-0 pointer-events-none z-10"
            style={{
              background: 'linear-gradient(to top, #000000 0%, #000000 10%, rgba(0,0,0,0.8) 30%, rgba(0,0,0,0.4) 60%, rgba(0,0,0,0.2) 100%)'
            }}
          />

          {/* Rating Badge */}
          <div className="absolute top-[clamp(8px,2.5vh,16px)] left-[clamp(8px,2.5vh,16px)] z-20">
            <span className="bg-black/60 backdrop-blur-md text-white text-[clamp(9px,1.5vw,10px)] px-[clamp(6px,2vw,10px)] py-1 rounded-full flex items-center gap-1.5 border border-white/10 shadow-xl">
              {activity.program_rating && activity.program_rating > 0 ? (
                <Star className="w-[clamp(8px,1.2vw,10px)] h-[clamp(8px,1.2vw,10px)] fill-yellow-400 text-yellow-400" />
              ) : null}
              <span className="font-bold tracking-tight">
                {getRatingDisplay(activity.program_rating, activity.total_program_reviews)}
              </span>
            </span>
          </div>

          {/* Visibility Icon */}
          <div className="absolute top-4 right-4 z-20">
            <div className="bg-black/60 backdrop-blur-md rounded-full p-2 border border-white/10 shadow-xl">
              {getVisibilityIcon(activity.is_public)}
            </div>
          </div>

          {/* Centered Title and Coach Info Overlay */}
          <div className="absolute inset-x-0 bottom-[2%] z-20 flex flex-col items-center text-center px-0 pb-0 overflow-visible">
            <div className="h-20 flex items-start justify-center mb-0 w-full overflow-visible space-y-1">
              <h3 className={cn(
                "text-white leading-[1.05] drop-shadow-[0_4px_12px_rgba(0,0,0,1)] tracking-tight opacity-90 text-center font-serif italic w-[95%] mx-auto overflow-visible px-0"
              )}>
                {(() => {
                  const title = activity.title || 'Sin título';
                  const words = title.split(' ');
                  if (words.length <= 1) return <span className="text-[1.3rem] font-black opacity-70 underline decoration-orange-500/20 underline-offset-4 truncate block">{title}</span>;
                  
                  // Heuristically split for the requested hierarchy
                  const row1 = words.slice(0, 2).join(' ');
                  const row2 = words.slice(2, 5).join(' ');
                  const row3 = words.slice(5).join(' ');

                  return (
                    <div className="flex flex-col items-center w-full overflow-visible">
                      <span className="text-[1.3rem] font-black block mb-0 opacity-70 whitespace-nowrap overflow-hidden truncate w-full">{row1}</span>
                      {row2 && <span className="text-[1.05rem] font-medium opacity-60 block mb-0 whitespace-nowrap overflow-hidden truncate w-full">{row2}</span>}
                      {row3 && <span className="text-[0.8rem] font-light opacity-45 block whitespace-nowrap overflow-hidden truncate w-full">{row3}</span>}
                    </div>
                  );
                })()}
              </h3>
            </div>

            <div className="flex items-center gap-[clamp(4px,1.5vw,8px)] pl-1 pr-[clamp(8px,3vw,16px)] py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/10 shadow-2xl relative w-fit max-w-[95%]">
              <div className="w-[clamp(18px,4.5vw,22px)] h-[clamp(18px,4.5vw,22px)] rounded-full bg-zinc-800/50 border border-white/20 flex items-center justify-center overflow-hidden shrink-0 relative">
                {activity.coach_avatar_url ? (
                  <Image
                    src={activity.coach_avatar_url}
                    alt={activity.coach_name || 'Coach'}
                    fill
                    sizes="24px"
                    className="object-cover"
                  />
                ) : (
                  <span className="text-[clamp(7px,1.2vw,9px)] font-black text-zinc-400 capitalize">{activity.coach_name?.[0] || 'C'}</span>
                )}
              </div>
              <div className="flex items-center gap-1 min-w-0">
                <span className="text-[clamp(9px,1.8vw,11px)] font-bold text-zinc-100 tracking-tight whitespace-nowrap opacity-95">
                  {(activity.coach_name || 'Coach').substring(0, 11)}
                </span>
                {activity.coach_rating != null && activity.coach_rating > 0 && (
                  <div className="flex items-center gap-0.5 shrink-0 ml-0.5">
                    <Star className="h-[clamp(8px,1.5vw,10px)] w-[clamp(8px,1.5vw,10px)] fill-yellow-400 text-yellow-400" />
                    <span className="text-[clamp(8px,1.5vw,9px)] font-black text-zinc-300">{activity.coach_rating.toFixed(1)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="py-2 px-3.5 flex-1 flex flex-col h-full min-h-0 bg-black rounded-b-[2.2rem]">
          {/* Badge row pulled from the side-by-side style */}
          <div className="flex flex-wrap gap-2 justify-center items-center mb-4 pt-2">
            <span className={`flex items-center justify-center w-7 h-7 bg-white/5 backdrop-blur-md ${getCategoryColor(activity.categoria || 'fitness')} rounded-full border border-white/10 shadow-lg`} title={getCategoryBadge(activity.categoria || 'fitness')}>
              {activity.categoria === 'nutricion' || activity.categoria === 'nutrition' ? <UtensilsCrossed className="w-3.5 h-3.5" /> : <Zap className="w-3.5 h-3.5" />}
            </span>
            <span className={`bg-white/5 backdrop-blur-md ${getTypeColor(activity.type || 'program')} text-[9px] px-3 py-1.5 rounded-full font-black border border-white/10 uppercase tracking-widest shadow-lg`}>
              {getTypeBadge(activity.type || 'program')}
            </span>
          </div>

          <div className="mt-auto flex flex-col justify-end">
            <div className="flex items-center justify-between mb-4 px-1">
              <div className="flex items-center gap-2 text-[#FF7939]">
                {activity.categoria === 'nutricion' || activity.categoria === 'nutrition' ? (
                  <div className="flex items-center gap-0.5 opacity-80 scale-110">{getDifficultyUtensils(activity.difficulty || undefined)}</div>
                ) : (
                  <div className="flex items-center gap-0.5 opacity-80 scale-110">{getDifficultyFires(activity.difficulty || undefined)}</div>
                )}
              </div>
              <div className="flex items-center justify-center flex-1">
                {activity.type === 'workshop' && (() => {
                  const workshopMode = (activity as any).workshop_mode || 'grupal'
                  return workshopMode === 'individual' ? (
                    <div className="flex items-center gap-1.5 text-[#FF7939] scale-110">
                      <User className="h-4 w-4" />
                      <span className="text-[9px] font-black uppercase">1:1</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-red-500 scale-110">
                      <Users className="h-4 w-4" />
                    </div>
                  )
                })()}
                {activity.type !== 'workshop' && includedMeetCredits > 0 && (
                  <div className="flex items-center justify-center scale-110">
                    <Video className="h-4 w-4 text-white/90" />
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1.5 opacity-80 min-w-[20px] justify-end scale-110">
                {getModalityIcon(activity.modality || 'online')}
              </div>
            </div>

            <div className="flex items-center justify-between text-zinc-400 mb-3 px-1 border-t border-white/5 pt-3">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-5 h-5 text-[#FF7939]/80" />
                <span className="text-sm font-black text-zinc-300 tracking-tight">
                  {typeof sessionsToShow === 'string' && sessionsToShow.includes('m') ? (
                    <>
                      {sessionsToShow.split('m')[0]}
                      <span className="text-red-500">m</span>
                      {sessionsToShow.split('m')[1]}
                    </>
                  ) : sessionsToShow}
                  {activity.type !== 'document' && (
                    <span className="text-[#FF7939]/80 text-[10px]"> d</span>
                  )}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {activity.type === 'workshop' ? (
                  <Zap className="w-5 h-5 text-[#FF7939]/80" />
                ) : (
                  activity.categoria === 'nutricion' ? <UtensilsCrossed className="w-5 h-5 text-[#FF7939]/80" /> : <Zap className="w-5 h-5 text-[#FF7939]/80" />
                )}
                <span className="text-sm font-black text-zinc-300 tracking-tight">
                  {activity.items_unicos ?? uniqueExercises}
                </span>
              </div>
              {capacityDisplay !== null && (
                <div className="flex items-center gap-1.5" title="Cupos">
                  <Users className="w-5 h-5 text-[#FF7939]/80" />
                  <span className="text-sm font-black text-zinc-300 tracking-tight">{capacityDisplay}</span>
                </div>
              )}
            </div>

            <div className="flex flex-nowrap gap-1.5 mb-0.5 justify-start overflow-x-auto hide-scrollbar min-h-[1.25rem] pb-0.5">
              {objetivos && Array.isArray(objetivos) && objetivos.length > 0 ? (
                objetivos.slice(0, 3).map((obj, i) => (
                  <span key={i} className="bg-gray-600/20 text-gray-400 text-[10px] px-2 py-0.5 rounded-full font-bold border border-gray-600/30 whitespace-nowrap">{obj}</span>
                ))
              ) : <div className="h-6"></div>}
            </div>

            <div className="border-t border-white/5 text-center pt-1 pb-2 mt-0">
              <span className="text-[#E66829]/80 font-bold text-[1.25rem] tracking-tight">
                {formatPrice(activity.price)}
              </span>
            </div>
          </div>
        </div>

        {isWorkshopInactive && (
          <div className="absolute inset-0 bg-black/80 rounded-[2.2rem] flex items-center justify-center z-10 text-center p-4">
            <RotateCcw className="w-8 h-8 text-[#FF7939] mx-auto mb-2" />
            <p className="text-white font-bold text-base">Taller Finalizado</p>
          </div>
        )}
        {isPaused && !isWorkshopInactive && (
          <div className="absolute inset-0 bg-black/60 rounded-[2.2rem] flex items-center justify-center z-10 text-center p-4">
            <Lock className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
            <p className="text-white font-bold text-base">Pausado</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default React.memo(ActivityCard)
