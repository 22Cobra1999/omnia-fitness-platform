"use client"

import React from 'react'
import Image from 'next/image'
import { Star, Calendar, Users, Globe, Dumbbell, Zap, Lock, Unlock, UtensilsCrossed, Flame } from 'lucide-react'
import type { Activity } from '@/types/activity'
import { useProductStats } from '@/hooks/use-product-stats'

interface ActivityCardProps {
  activity: Activity
  size?: 'small' | 'medium' | 'large'
  onClick?: (activity: Activity) => void
}

const ActivityCard: React.FC<ActivityCardProps> = ({ 
  activity, 
  size = 'medium', 
  onClick 
}) => {
  // Obtener estadísticas reales del producto
  const { stats, loading } = useProductStats(activity.id)
  
  // ✅ Logs para debugging
  console.log('🎯 ActivityCard: Renderizando para actividad:', {
    id: activity.id,
    title: activity.title,
    categoria: activity.categoria,
    type: activity.type,
    loading,
    stats
  })
  const getValidImageUrl = (activity: Activity) => {
    // Try different possible image sources
    const imageUrl = activity.media?.image_url || 
                    activity.image_url || 
                    activity.activity_media?.[0]?.image_url
    
    if (imageUrl && !imageUrl.includes('via.placeholder.com')) {
      return imageUrl
    }
    
    return '/placeholder.svg?height=200&width=200&query=activity'
  }

  const getRatingDisplay = (rating?: number | null, totalReviews?: number | null) => {
    if (!rating || rating === 0) {
      return 'NUEVO'
    }
    return `${rating.toFixed(1)} (${totalReviews || 0})`
  }

  const getCategoryBadge = (categoria?: string) => {
    switch (categoria?.toLowerCase()) {
      case 'fitness':
        return 'FITNESS'
      case 'nutrition':
      case 'nutricion':
        return 'NUTRICION'
      default:
        return 'FITNESS' // Default a FITNESS
    }
  }

  const getTypeBadge = (type?: string) => {
    switch (type?.toLowerCase()) {
      case 'program':
      case 'programa':
        return 'PROGRAM'
      case 'workshop':
      case 'taller':
        return 'WORKSHOP'
      case 'document':
      case 'documento':
        return 'DOCUMENT'
      default:
        return 'PROGRAM' // Default a PROGRAM
    }
  }

  const formatPrice = (price?: number | null) => {
    if (!price) return '$0'
    
    // Convertir a string y dividir por punto para manejar decimales
    const priceStr = price.toString()
    const parts = priceStr.split('.')
    
    // Si tiene parte decimal, usar coma como separador decimal
    if (parts.length === 2) {
      const integerPart = parseInt(parts[0]).toLocaleString('es-ES')
      const decimalPart = parts[1].padEnd(2, '0').substring(0, 2)
      
      // Si los decimales son 00, no mostrarlos
      if (decimalPart === '00') {
        return `$${integerPart}`
      } else {
        return `$${integerPart},${decimalPart}`
      }
    } else {
      // Solo parte entera, no agregar decimales
      const integerPart = parseInt(parts[0]).toLocaleString('es-ES')
      return `$${integerPart}`
    }
  }

  const getProductTypeBadge = (type?: string) => {
    switch (type?.toLowerCase()) {
      case 'fitness':
        return 'FITNESS'
      case 'nutricion':
        return 'NUTRICION'
      case 'program':
      case 'programa':
        return 'PROGRAM'
      case 'workshop':
      case 'taller':
        return 'WORKSHOP'
      case 'document':
      case 'documento':
        return 'DOCUMENT'
      default:
        return 'ACTIVIDAD'
    }
  }

  const getDifficultyLabel = (difficulty?: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'Principiante'
      case 'intermediate':
        return 'Intermedio'
      case 'advanced':
        return 'Avanzado'
      default:
        return 'Principiante'
    }
  }

  const getCategoryIcon = (type?: string) => {
    switch (type?.toLowerCase()) {
      case 'online':
        return <Globe className="w-4 h-4" />
      case 'fitness':
        return <Dumbbell className="w-4 h-4" />
      case 'nutricion':
        return <UtensilsCrossed className="w-4 h-4" />
      default:
        return <Zap className="w-4 h-4" />
    }
  }

  const getVisibilityIcon = (isPublic?: boolean) => {
    return isPublic ? (
      <Unlock className="w-4 h-4 text-gray-400" />
    ) : (
      <Lock className="w-4 h-4 text-[#FF7939]" />
    )
  }

  const getBadgeStyle = (type?: string) => {
    switch (type?.toLowerCase()) {
      case 'programa':
        return "text-xs bg-[#FF7939] text-white px-2 py-1 rounded-full font-medium"
      case 'documento':
        return "text-sm bg-[#FF7939]/80 text-white px-2 py-1 rounded-full font-medium"
      case 'taller':
        return "text-sm bg-white text-black px-2 py-1 rounded-full font-medium"
      default:
        return "text-sm bg-[#FF7939] text-white px-2 py-1 rounded-full font-medium"
    }
  }

  const getDifficultyFires = (difficulty?: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'beginner':
        return <Flame className="w-4 h-4 text-orange-400" />
      case 'intermediate':
        return (
          <div className="flex gap-1">
            <Flame className="w-4 h-4 text-orange-400" />
            <Flame className="w-4 h-4 text-orange-400" />
          </div>
        )
      case 'advanced':
        return (
          <div className="flex gap-1">
            <Flame className="w-4 h-4 text-orange-400" />
            <Flame className="w-4 h-4 text-orange-400" />
            <Flame className="w-4 h-4 text-orange-400" />
          </div>
        )
      default:
        return <Flame className="w-4 h-4 text-orange-400" />
    }
  }

  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return 'w-40 h-[32rem]'
      case 'medium':
        return 'w-full h-[32rem]'
      case 'large':
        return 'w-full h-[32rem]'
      default:
        return 'w-full h-[32rem]'
    }
  }

  return (
    <div 
      className={`${getSizeClasses()} cursor-pointer group`}
      onClick={() => onClick?.(activity)}
    >
      <div className="bg-[#1A1A1A] rounded-2xl overflow-hidden border border-gray-800 hover:border-[#FF7939]/30 transition-all duration-200 hover:scale-[1.02] h-full flex flex-col">
        {/* Activity Image */}
        <div className="relative w-full h-48 flex-shrink-0">
          <Image
            src={getValidImageUrl(activity)}
            alt={activity.title || 'Imagen de actividad'}
            width={200}
            height={200}
            className="object-cover w-full h-full"
          />
          {/* Badge en la esquina inferior izquierda - Rating */}
          <div className="absolute bottom-3 left-3">
            <span className="bg-black/80 text-white text-xs px-2 py-1 rounded-full">
              {getRatingDisplay(activity.program_rating, activity.total_program_reviews)}
            </span>
          </div>
          
        </div>

        {/* Activity Info */}
        <div className="p-4 flex-1 flex flex-col">
          {/* Título - Letra más pequeña */}
          <div className="mb-3">
            <h3 className="text-white font-bold text-base leading-tight line-clamp-2 min-h-[2.5rem]">
              {activity.title || 'Sin título'}
            </h3>
          </div>
          
          {/* Descripción - Altura fija para alineación */}
          <div className="mb-4 h-10 overflow-hidden">
            <p className="text-gray-400 text-sm leading-relaxed line-clamp-2">
              {activity.description || "Descripción no disponible"}
            </p>
          </div>

          {/* Fuegos de Intensidad y Visibilidad - Sección definida */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-[#FF7939]">
              {getDifficultyFires(activity.difficulty)}
            </div>
            <div className="flex items-center gap-2 text-gray-400">
              {getVisibilityIcon(activity.is_public)}
            </div>
          </div>

          {/* Stats - Sesiones - Sección definida */}
          <div className="flex items-center gap-2 text-gray-300 mb-3">
            <Calendar className="w-4 h-4 text-[#FF7939]" />
            <span className="text-sm">
              Sesiones: {loading ? '...' : stats.totalSessions}
            </span>
          </div>

          {/* Stats - Ejercicios - Sección definida */}
          <div className="flex items-center gap-2 text-gray-300 mb-4">
            <Zap className="w-4 h-4 text-[#FF7939]" />
            <span className="text-sm">
              Ejercicios: {loading ? '...' : stats.uniqueExercises}
            </span>
          </div>
          
          {/* ✅ Logs de debugging para las estadísticas mostradas */}
          {console.log('📊 ActivityCard: Mostrando estadísticas:', {
            actividad: activity.id,
            titulo: activity.title,
            loading,
            totalSessions: stats.totalSessions,
            uniqueExercises: stats.uniqueExercises,
            statsCompleto: stats
          })}

          {/* Badges de Categoría y Tipo */}
          <div className="flex gap-1 mb-3 ml-1">
            {/* Badge de Categoría */}
            <span className="bg-[#FF7939] text-white text-[10px] px-1.5 py-0.5 rounded-full font-medium">
              {getCategoryBadge(activity.categoria)}
            </span>
            {/* Badge de Tipo */}
            <span className="bg-gray-700 text-white text-[10px] px-1.5 py-0.5 rounded-full font-medium">
              {getTypeBadge(activity.type)}
            </span>
          </div>

          {/* Cupos disponibles - Solo si hay capacidad limitada */}
          {activity.capacity && 
           !isNaN(activity.capacity) && 
           activity.capacity > 0 && 
           activity.capacity < 999 && (
            <div className="flex items-center gap-2 text-gray-300 mb-3">
              <Users className="w-4 h-4 text-[#FF7939]" />
              <span className="text-sm">{activity.capacity} cupos</span>
            </div>
          )}

          {/* Precio - Sección definida */}
          <div className="mt-auto pt-3 border-t border-gray-700 text-center">
            <span className="text-[#FF7939] font-bold text-xl">
              {formatPrice(activity.price)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ActivityCard
