"use client"

import React from 'react'
import Image from 'next/image'
import { Star, Calendar, Users, Globe, Dumbbell, Zap, Lock, Unlock, UtensilsCrossed, Flame, MapPin, RotateCcw, Pause, MonitorSmartphone, Video } from 'lucide-react'
import type { Activity } from '@/types/activity'

interface ActivityCardProps {
  activity: Activity
  size?: 'small' | 'medium' | 'large'
  variant?: 'default' | 'blurred'
  onClick?: (activity: Activity) => void
}

const ActivityCard: React.FC<ActivityCardProps> = ({
  activity,
  size = 'medium',
  variant = 'default',
  onClick
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
      return `${dias} ${dias === 1 ? 'día' : 'días'}`
    }
    if (semanas > 4) {
      const meses = Math.ceil(semanas / 4)
      return `${meses} ${meses === 1 ? 'mes' : 'meses'}`
    }
    return `${Math.ceil(semanas)} ${semanas === 1 ? 'semana' : 'semanas'}`
  })()

  const sessionsToShow = isDocument && documentDuration
    ? documentDuration
    : isWorkshop && cantidadDias !== undefined
      ? cantidadDias
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
    if (activity.items_unicos !== undefined && activity.items_unicos !== null) {
      return activity.items_unicos
    }
    return activity.exercisesCount || 0
  })()

  const totalSessions = activity.totalSessions || 0
  const productCapacity = activity.capacity
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

  const capacityNumber = productCapacity ? parseInt(productCapacity.toString()) : null

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

  const formatPrice = (price?: number | null) => {
    if (!price) return '$0'
    const priceStr = price.toString()
    const parts = priceStr.split('.')
    if (parts.length === 2) {
      const integerPart = parseInt(parts[0]).toLocaleString('es-ES')
      const decimalPart = parts[1].padEnd(2, '0').substring(0, 2)
      return decimalPart === '00' ? `$${integerPart}` : `$${integerPart},${decimalPart}`
    } else {
      return `$${parseInt(parts[0]).toLocaleString('es-ES')}`
    }
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
      case 'hibrido': return <MonitorSmartphone className="w-5 h-5" />
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
      case 'small': return 'w-40 h-[30rem]'
      case 'medium': return 'w-64 h-[32rem]'
      case 'large': return 'w-80 h-[36rem]'
      default: return 'w-64 h-[32rem]'
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
    <div className={`${getSizeClasses()} cursor-pointer group relative`} onClick={() => onClick?.(activity)}>
      <div className={`rounded-2xl overflow-hidden border transition-all duration-200 hover:scale-[1.02] h-full flex flex-col relative 
        ${variant === 'blurred'
          ? 'bg-white/5 backdrop-blur-md border-white/10 hover:border-[#FF7939]/50'
          : 'bg-[#1A1A1A] border-gray-800 hover:border-[#FF7939]/30'
        }
        ${shouldShowAsInactive ? 'opacity-50 grayscale' : ''}`}>

        <div className="relative w-full h-48 flex-shrink-0">
          {getValidImageUrl(activity) ? (
            <Image
              src={getValidImageUrl(activity)!}
              alt={activity.title || 'Imagen de actividad'}
              width={200} height={200}
              className="object-cover w-full h-full"
              loading="lazy" priority={false}
            />
          ) : (
            <div className="w-full h-full bg-[rgba(255,255,255,0.02)] flex items-center justify-center flex-col gap-3">
              <div className="w-16 h-16 bg-[#FF7939] rounded-xl flex items-center justify-center">
                <Flame className="w-8 h-8 text-black" />
              </div>
              <h1 className="text-gray-400 text-xl font-bold">OMNIA</h1>
            </div>
          )}
          <div className="absolute bottom-3 left-3">
            <span className="bg-black/80 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
              {activity.program_rating && activity.program_rating > 0 ? (
                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              ) : null}
              {getRatingDisplay(activity.program_rating, activity.total_program_reviews)}
            </span>
          </div>
          <div className="absolute top-3 right-3">
            <div className="bg-black/80 rounded-full p-1.5">{getVisibilityIcon(activity.is_public)}</div>
          </div>
        </div>

        <div className="p-4 flex-1 flex flex-col h-full min-h-0">
          <div className="mb-3">
            <h3 className="text-white font-bold leading-tight text-sm sm:text-base md:text-lg overflow-hidden"
              style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', lineHeight: '1.2em', height: '2.4em' }}>
              {activity.title || 'Sin título'}
            </h3>
          </div>

          {(activity.coach_name || (activity.coach_rating && activity.coach_rating > 0)) && (
            <div className="border-t border-b border-gray-700/30 py-2 mb-3">
              <div className="flex items-center gap-2">
                <div className="flex-1 min-w-0 flex items-center gap-2">
                  <p className="text-xs font-medium text-gray-300 truncate">{activity.coach_name || 'Coach'}</p>
                  <div className="flex items-center gap-1 text-[10px] text-gray-400">
                    {activity.coach_rating && activity.coach_rating > 0 ? (
                      <Star className="h-2.5 w-2.5 fill-yellow-400 text-yellow-400" />
                    ) : null}
                    <span>{activity.coach_rating && activity.coach_rating > 0 ? activity.coach_rating.toFixed(1) : '-'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center mb-4 -mx-1">
            <span className={`bg-black/20 ${getCategoryColor(activity.categoria || 'fitness')} text-[9px] px-1.5 py-0.5 rounded-full font-bold border border-[#FF7939]/30`}>
              {getCategoryBadge(activity.categoria || 'fitness')}
            </span>
            <span className={`bg-black/20 ${getTypeColor(activity.type || 'program')} text-[9px] px-1.5 py-0.5 rounded-full font-bold border border-[#FF7939]/30`}>
              {getTypeBadge(activity.type || 'program')}
            </span>
          </div>

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-[#FF7939]">
              {activity.categoria === 'nutricion' || activity.categoria === 'nutrition' ?
                getDietTypeDisplay(((activity as any).dieta ?? undefined) as string | undefined) :
                <div className="flex items-center gap-1">{getDifficultyFires(activity.difficulty || undefined)}</div>
              }
            </div>
            <div className="flex items-center justify-center flex-1">
              {activity.type === 'workshop' && (() => {
                const workshopMode = (activity as any).workshop_mode || 'grupal'
                return workshopMode === 'individual' ? (
                  <span className="bg-yellow-500/20 text-yellow-500 text-[10px] px-1.5 py-0.5 rounded-full font-medium border border-yellow-500/30">1:1</span>
                ) : (
                  <div className="relative flex items-center justify-center text-white"><Users className="h-3 w-3" /></div>
                )
              })()}
              {activity.type !== 'workshop' && includedMeetCredits > 0 && <Video className="h-4 w-4 text-rose-100/90" />}
            </div>
            <div className="flex items-center">{getModalityIcon(activity.modality || 'online')}</div>
          </div>

          <div className="flex items-center justify-between text-gray-300 mb-2">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4 text-[#FF7939]" />
              <span className="text-sm font-medium">{activity.type === 'document' ? (activity.semanas_totales || 0) : (activity.sesiones_dias_totales || totalSessions || 0)}<span className="text-[#FF7939] text-[10px]">{activity.type === 'document' ? ' s' : ' d'}</span></span>
            </div>
            <div className="flex items-center gap-1">
              {activity.categoria === 'nutricion' ? <UtensilsCrossed className="w-4 h-4 text-[#FF7939]" /> : <Zap className="w-4 h-4 text-[#FF7939]" />}
              <span className="text-sm font-medium">{activity.items_unicos ?? uniqueExercises}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4 text-[#FF7939]" />
              <span className="text-sm font-medium">{activity.capacity || '-'}</span>
            </div>
          </div>

          <div className="flex flex-nowrap gap-1 mb-1 justify-start overflow-x-auto hide-scrollbar min-h-[1.5rem] pb-1">
            {objetivos && Array.isArray(objetivos) && objetivos.length > 0 ? (
              objetivos.slice(0, 3).map((obj, i) => (
                <span key={i} className="bg-gray-600/20 text-gray-400 text-[9px] px-1.5 py-0.5 rounded-full font-medium border border-gray-600/30 whitespace-nowrap">{obj}</span>
              ))
            ) : <div className="h-6"></div>}
          </div>

          <div className="border-t border-gray-700 text-center mt-auto pt-2">
            <span className="text-orange-300 font-bold text-xl">{formatPrice(activity.price)}</span>
          </div>
        </div>

        {isWorkshopInactive && (
          <div className="absolute inset-0 bg-black/80 rounded-2xl flex items-center justify-center z-10 text-center p-4">
            <RotateCcw className="w-8 h-8 text-[#FF7939] mx-auto mb-2" />
            <p className="text-white font-bold text-base">Taller Finalizado</p>
          </div>
        )}
        {isPaused && !isWorkshopInactive && (
          <div className="absolute inset-0 bg-black/60 rounded-2xl flex items-center justify-center z-10 text-center p-4">
            <Lock className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
            <p className="text-white font-bold text-base">Pausado</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default React.memo(ActivityCard)
