"use client"

import { useState } from "react"
import { ChevronLeft, Star, Calendar, Zap, UtensilsCrossed, Users, MapPin, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { VimeoPlayer } from '@/components/shared/video/vimeo-player'
import { extractVimeoId } from "@/utils/vimeo-utils"
// Hook removed - functionality to be reimplemented if needed
// import { useProductStats } from '@/hooks/coach/use-product-stats'
import type { Activity } from "@/types/activity"

interface ActivityDetailExpandedProps {
  activity: Activity
  onBack: () => void
}

export function ActivityDetailExpanded({ activity, onBack }: ActivityDetailExpandedProps) {
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false)
  // Hook removed - using default values
  // const { stats, loading, product } = useProductStats(activity.id)
  const stats = { totalSessions: 0, uniqueExercises: 0 }
  const loading = false
  
  const vimeoId = extractVimeoId(activity.video_url || '')
  
  // Usar las estadísticas del hook o los valores por defecto
  const totalSessions = stats.totalSessions || activity.totalSessions || 0
  const uniqueExercises = stats.uniqueExercises || activity.exercisesCount || 0
  
  const productCapacity = (activity as any).capacity
  const productModality = (activity as any).modality
  const locationName = (activity as any).location_name
  const locationUrl = (activity as any).location_url
  
  // Parsear objetivos
  let objetivos = []
  if (activity.workshop_type) {
    try {
      let parsed: any = activity.workshop_type
      if (typeof activity.workshop_type === 'string') {
        const ws = activity.workshop_type.trim()
        if (ws.startsWith('{') || ws.startsWith('[')) {
          parsed = JSON.parse(ws)
        } else {
          parsed = ws
        }
      }

      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed) && parsed.objetivos) {
        objetivos = String(parsed.objetivos)
          .split(';')
          .map((obj: string) => obj.trim())
          .filter((obj: string) => obj.length > 0)
      } else if (Array.isArray(parsed)) {
        objetivos = parsed
      }
    } catch (e) {
      console.warn('Error parseando objetivos:', e)
      objetivos = []
    }
  }

  const getCategoryIcon = (categoria?: string) => {
    if (categoria === 'nutricion' || categoria === 'nutrition') {
      return <UtensilsCrossed className="w-4 h-4 text-[#FF7939]" />
    }
    return <Zap className="w-4 h-4 text-[#FF7939]" />
  }

  const getCategoryLabel = (categoria?: string) => {
    if (categoria === 'nutricion' || categoria === 'nutrition') {
      return 'Platos'
    }
    return 'Ejercicios'
  }

  const getModalityIcon = (modality?: string) => {
    if (modality === 'presencial') {
      return <MapPin className="w-4 h-4 text-red-500" />
    }
    return <Calendar className="w-4 h-4 text-white" />
  }

  const getModalityLabel = (modality?: string) => {
    if (modality === 'presencial') {
      return 'Presencial'
    }
    return 'Online'
  }

  const handleLocationClick = () => {
    if (locationUrl) {
      // Si es una dirección (no un link), convertirla a link de Google Maps
      let mapsUrl = locationUrl
      if (!locationUrl.startsWith('http://') && !locationUrl.startsWith('https://')) {
        // Es una dirección, convertirla a link de Google Maps
        mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locationUrl)}`
      }
      window.open(mapsUrl, '_blank')
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-sm px-4 py-3 flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-white hover:text-[#FF7939] transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
          <span>Volver</span>
        </button>
        
        <div className="flex items-center space-x-2">
          <Star className="h-4 w-4 text-yellow-400 fill-current" />
          <span className="text-sm font-medium">{activity.coach_rating?.toFixed(1) || 'N/A'}</span>
          <span className="text-xs text-gray-400">({activity.total_coach_reviews || 0})</span>
        </div>
      </div>

      {/* Content */}
      <div className="pt-16 pb-20">
        {/* Hero Video/Image */}
        <div className="relative h-64 md:h-80 bg-gray-900">
          {vimeoId ? (
            <VimeoPlayer 
              videoId={vimeoId}
              autoplay={false}
              className="w-full h-full"
            />
          ) : activity.image_url ? (
            <img
              src={activity.image_url}
              alt={activity.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#FF7939] to-[#FF5722] flex items-center justify-center">
              <span className="text-2xl font-bold">🎯</span>
            </div>
          )}
          
          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          
          {/* Price Badge */}
          <div className="absolute top-4 right-4">
            <div className="bg-[#FF7939] text-white px-3 py-1 rounded-full font-bold">
              ${activity.price}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6">
          {/* Title and Coach */}
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">{activity.title}</h1>
            
            {/* Coach Info */}
            <div className="flex items-center space-x-3 text-left">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-700">
                <img
                  src={activity.coach_avatar_url || '/placeholder.svg'}
                  alt={activity.coach_name || 'Coach'}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <p className="font-medium">{activity.coach_name || 'Coach'}</p>
                <div className="flex items-center space-x-1 text-sm text-gray-400">
                  <Star className="h-3 w-3 text-yellow-400 fill-current" />
                  <span>{activity.coach_rating?.toFixed(1) || 'N/A'}</span>
                  <span>({activity.total_coach_reviews || 0} reseñas)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Description with expand/collapse */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Descripción</h3>
            <div className="text-gray-300 leading-relaxed">
              {isDescriptionExpanded ? (
                <p>{activity.description || 'No hay descripción disponible.'}</p>
              ) : (
                <div>
                  <p 
                    className="overflow-hidden"
                    style={{
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      lineHeight: '1.5em',
                      height: '4.5em'
                    }}
                  >
                    {activity.description || 'No hay descripción disponible.'}
                  </p>
                  {activity.description && activity.description.length > 150 && (
                    <button
                      onClick={() => setIsDescriptionExpanded(true)}
                      className="text-[#FF7939] hover:text-[#FF6B00] text-sm mt-2"
                    >
                      ...ver más
                    </button>
                  )}
                </div>
              )}
              {isDescriptionExpanded && (
                <button
                  onClick={() => setIsDescriptionExpanded(false)}
                  className="text-[#FF7939] hover:text-[#FF6B00] text-sm mt-2"
                >
                  ...ver menos
                </button>
              )}
            </div>
          </div>

          {/* Statistics with words */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-[#FF7939]" />
              <span className="text-gray-300">Sesiones: {loading ? '...' : totalSessions}</span>
            </div>
            
            <div className="flex items-center space-x-2">
              {getCategoryIcon(activity.categoria ?? undefined)}
              <span className="text-gray-300">{getCategoryLabel(activity.categoria ?? undefined)}: {loading ? '...' : uniqueExercises}</span>
            </div>
            
            {productCapacity && (
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-[#FF7939]" />
                <span className="text-gray-300">
                  Cupos: {parseInt(productCapacity.toString()) >= 999 ? 'Ilimitados' : productCapacity}
                </span>
              </div>
            )}
            
            <div className="flex items-center space-x-2">
              {getModalityIcon(productModality ?? undefined)}
              <span className="text-gray-300">{getModalityLabel(productModality ?? undefined)}</span>
            </div>
          </div>

          {/* Objectives in horizontal scrollable row */}
          {objetivos && objetivos.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Objetivos</h3>
              <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2">
                {objetivos.map((objetivo, index) => (
                  <span 
                    key={index}
                    className="bg-[#FF7939]/20 text-[#FF7939] text-sm px-3 py-1 rounded-full font-medium border border-[#FF7939]/30 whitespace-nowrap flex-shrink-0"
                  >
                    {objetivo}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Location for presencial activities */}
          {productModality === 'presencial' && locationName && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Ubicación</h3>
              <button
                onClick={handleLocationClick}
                className="flex items-center space-x-2 text-[#FF7939] hover:text-[#FF6B00] transition-colors"
              >
                <MapPin className="h-4 w-4" />
                <span className="underline">{locationName}</span>
              </button>
            </div>
          )}

          {/* Comments and Rating */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Comentarios</h3>
            <div className="flex items-center space-x-2 text-gray-400">
              <MessageCircle className="h-4 w-4" />
              <span>No hay comentarios aún</span>
            </div>
            {activity.program_rating && activity.program_rating > 0 && (
              <div className="flex items-center space-x-2 mt-2">
                <Star className="h-4 w-4 text-yellow-400 fill-current" />
                <span className="text-gray-300">Rating del producto: {activity.program_rating.toFixed(1)}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}












