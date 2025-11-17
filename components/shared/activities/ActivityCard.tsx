"use client"

import React from 'react'
import Image from 'next/image'
import { Star, Calendar, Users, Globe, Dumbbell, Zap, Lock, Unlock, UtensilsCrossed, Flame, MapPin, RotateCcw, Pause, MonitorSmartphone } from 'lucide-react'
import type { Activity } from '@/types/activity'
// Hooks removed - functionality to be reimplemented if needed
// import { useProductStats } from '@/hooks/coach/use-product-stats'
// import { useWorkshopStatus } from '@/hooks/coach/use-workshop-status'
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
  // Hooks removed - using default values
  // const { stats, loading, product } = useProductStats(activity.id)
  // const { isFinished, canReactivate, loading: workshopLoading } = useWorkshopStatus(activity.id)
  
  // Usar valores por defecto directamente de la actividad
  const loading = false // Hooks removed - no loading state needed
  
  // Si hay previewStats, usar esos valores (paso 6 del modal de creación)
  const previewStats = (activity as any).previewStats
  const totalWeeks = previewStats?.semanas || activity.totalSessions || 0
  const uniqueExercises = previewStats?.ejerciciosUnicos || activity.exercisesCount || 0
  const totalSessions = activity.totalSessions || 0
  
  const productCapacity = activity.capacity
  // Obtener modalidad de diferentes campos posibles (modality o type)
  const productModality = activity.modality || (activity as any).type || null
  const isWorkshopFinished = false // To be reimplemented if needed
  
  
  // Debug: Verificar valores de capacity
  const capacityNumber = productCapacity ? parseInt(productCapacity.toString()) : null
  const shouldShowCapacity = capacityNumber && capacityNumber > 0
  
  
  const getValidImageUrl = (activity: Activity) => {
    // Try different possible image sources
    const imageUrl = activity.media?.image_url || 
                    activity.image_url || 
                    (activity as any).activity_media?.[0]?.image_url
    
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
        return 'NUTRICIÓN'
      default:
        return 'FITNESS' // Default a FITNESS
    }
  }

  const getTypeBadge = (type?: string) => {
    switch (type?.toLowerCase()) {
      case 'program':
      case 'programa':
        return 'PROGRAMA'
      case 'workshop':
      case 'taller':
        return 'TALLER'
      case 'document':
      case 'documento':
        return 'DOCUMENTO'
      default:
        return 'PROGRAMA' // Default a PROGRAMA
    }
  }

  const getCategoryColor = (categoria?: string) => {
    switch (categoria?.toLowerCase()) {
      case 'fitness':
        return 'text-[#FF7939]' // Naranja como está
      case 'nutrition':
      case 'nutricion':
        return 'text-orange-300' // Naranja clarito como el precio
      default:
        return 'text-[#FF7939]' // Default naranja para FITNESS
    }
  }

  const getTypeColor = (type?: string) => {
    switch (type?.toLowerCase()) {
      case 'program':
      case 'programa':
        return 'text-[#FF7939]' // Naranja como está
      case 'workshop':
      case 'taller':
        return 'text-orange-300' // Naranja clarito como el precio
      case 'document':
      case 'documento':
        return 'text-white' // Blanca
      default:
        return 'text-[#FF7939]' // Default naranja para PROGRAMA
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
        return 'NUTRICIÓN'
      case 'program':
      case 'programa':
        return 'PROGRAMA'
      case 'workshop':
      case 'taller':
        return 'TALLER'
      case 'document':
      case 'documento':
        return 'DOCUMENTO'
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

  const getModalityIcon = (modality?: string | null) => {
    if (!modality) return <Globe className="w-5 h-5" />
    const mod = modality.toLowerCase().trim()
    switch (mod) {
      case 'online':
        return <Globe className="w-5 h-5" />
      case 'presencial':
        return <MapPin className="w-5 h-5" />
      case 'híbrido':
      case 'hibrido':
        return <MonitorSmartphone className="w-5 h-5" />
      default:
        return <Globe className="w-5 h-5" />
    }
  }

  const getModalityColor = (modality?: string | null) => {
    if (!modality) return 'text-[#FF7939]'
    const mod = modality.toLowerCase().trim()
    switch (mod) {
      case 'online':
        return 'text-[#FF7939]'
      case 'presencial':
        return 'text-red-500'
      case 'híbrido':
      case 'hibrido':
        return 'text-purple-400'
      default:
        return 'text-[#FF7939]'
    }
  }
  
  const getModalityLabel = (modality?: string | null) => {
    if (!modality) return 'Online'
    const mod = modality.toLowerCase().trim()
    switch (mod) {
      case 'híbrido':
      case 'hibrido':
        return 'Híbrido'
      case 'presencial':
        return 'Presencial'
      case 'online':
        return 'Online'
      default:
        return modality
    }
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
        return <Flame className="w-4 h-4 text-orange-300" />
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
      default:
        return <Flame className="w-4 h-4 text-orange-300" />
    }
  }

  const getDietTypeDisplay = (dietType?: string) => {
    if (!dietType) return null
    
    // Convertir valores técnicos a texto amigable
    const getFriendlyDietName = (diet: string) => {
      switch (diet.toLowerCase()) {
        case 'baja_carbohidratos':
          return 'Baja en carbohidratos'
        case 'keto':
          return 'Keto'
        case 'paleo':
          return 'Paleo'
        case 'vegana':
          return 'Vegana'
        case 'vegetariana':
          return 'Vegetariana'
        case 'mediterranea':
          return 'Mediterránea'
        case 'balanceada':
          return 'Balanceada'
        default:
          return diet
      }
    }
    
    const friendlyName = getFriendlyDietName(dietType)
    const truncatedName = friendlyName.length > 12 ? `${friendlyName.substring(0, 12)}...` : friendlyName
    
    return (
      <div className="flex items-center gap-1 text-[#FF7939]">
        <UtensilsCrossed className="w-4 h-4" />
        <span className="text-sm font-medium whitespace-nowrap" title={friendlyName}>
          {truncatedName}
        </span>
      </div>
    )
  }

        const getSizeClasses = () => {
          switch (size) {
            case 'small':
              return 'w-40 h-[30rem]' // 480px de altura - balanceada
            case 'medium':
              return 'w-full h-[30rem]' // 480px de altura - balanceada
            case 'large':
              return 'w-full h-[32rem]' // 512px de altura - balanceada
            default:
              return 'w-full h-[30rem]'
          }
        }

  // Verificar si el producto está pausado
  const isPaused = (activity as any).is_paused || false
  
  // Para talleres: verificar si está activo (disponible para nuevas ventas)
  // Si es taller y tiene taller_activo = false, está finalizado/inactivo
  const tallerActivoValue = (activity as any).taller_activo
  const isWorkshopInactive = activity.type === 'workshop' && tallerActivoValue === false
  
  // Silenciar logs de diagnóstico en producción
  
  // Determinar si debe mostrarse en gris (pausado o taller inactivo)
  const shouldShowAsInactive = isPaused || isWorkshopInactive
  
  return (
    <div 
      className={`${getSizeClasses()} cursor-pointer group relative`}
      onClick={() => onClick?.(activity)}
    >
      <div className={`bg-[#1A1A1A] rounded-2xl overflow-hidden border border-gray-800 hover:border-[#FF7939]/30 transition-all duration-200 hover:scale-[1.02] h-full flex flex-col relative ${shouldShowAsInactive ? 'opacity-50 grayscale' : ''}`}>
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
          
          {/* Icono de Visibilidad en la esquina superior derecha */}
          <div className="absolute top-3 right-3">
            <div className="bg-black/80 rounded-full p-1.5">
              {getVisibilityIcon(activity.is_public)}
            </div>
          </div>
          
        </div>

        {/* Activity Info - Estructura fija y consistente para todas las cards */}
        <div className="p-4 flex-1 flex flex-col h-full min-h-[600px]">
          
          {/* 1. NOMBRE DEL PROGRAMA - Sección fija */}
          <div className="mb-3">
            <h3 className="text-white font-bold leading-tight text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl overflow-hidden" 
                style={{
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  lineHeight: '1.2em',
                  height: '2.4em'
                }}>
              {activity.title || 'Sin título'}
            </h3>
          </div>

          {/* 2. NOMBRE DEL COACH - Sección fija con líneas separadoras */}
          {activity.coach_name && (
            <div className="border-t border-b border-gray-700/30 py-2 mb-3">
              <div className="flex items-center gap-2">
                <div className="flex-1 min-w-0 flex items-center gap-2">
                  <p className="text-xs font-medium text-gray-300 truncate">{activity.coach_name}</p>
                  <div className="flex items-center gap-1 text-[10px] text-gray-400">
                    <Star className="h-2.5 w-2.5 fill-yellow-400 text-yellow-400" />
                    <span>{activity.coach_rating && activity.coach_rating > 0 ? activity.coach_rating.toFixed(1) : '-'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 3. FITNESS/NUTRI Y TALLER/DOC/PROGRAMA - Sección fija */}
          <div className="flex justify-between items-center mb-4 -mx-2">
            {/* Badge de Categoría - Izquierda */}
            <span className={`bg-black/20 ${getCategoryColor(activity.categoria || 'fitness')} text-[10px] px-1.5 py-0.5 rounded-full font-bold border border-[#FF7939]/30`}>
              {getCategoryBadge(activity.categoria || 'fitness')}
            </span>
            
            {/* Badge de Tipo - Derecha */}
            <span className={`bg-black/20 ${getTypeColor(activity.type || 'program')} text-[10px] px-1.5 py-0.5 rounded-full font-bold border border-[#FF7939]/30`}>
              {getTypeBadge(activity.type || 'program')}
            </span>
          </div>

         {/* 4. INTENSIDAD/DIETA - MODALIDAD - Sección fija */}
         <div className="flex items-center justify-between mb-4">
           <div className="flex items-center gap-2 text-[#FF7939]">
            {/* Para productos de nutrición, mostrar tipo de dieta en lugar de dificultad */}
            {activity.categoria === 'nutricion' || activity.categoria === 'nutrition' ?
              getDietTypeDisplay((activity as any).dieta || undefined) :
              <div className="flex items-center gap-1">
                {getDifficultyFires(activity.difficulty)}
              </div>
            }
           </div>
           <div className="flex items-center gap-2">
             {/* Modalidad - Solo icono, sin texto - Siempre mostrar */}
             {(() => {
               const modalityToShow = productModality || 'online'
               return (
                 <div className={`flex items-center ${getModalityColor(modalityToShow)}`}>
                   {getModalityIcon(modalityToShow)}
             </div>
               )
             })()}
           </div>
         </div>

         {/* 5. 3 ICONOS - Sección fija */}
         <div className="flex items-center justify-between text-gray-300 mb-2">
            {/* Semanas (si hay previewStats) o Sesiones (modo normal) */}
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4 text-[#FF7939]" />
              <span className="text-sm font-medium">
                {loading ? '...' : (previewStats ? totalWeeks : totalSessions)}
              </span>
            </div>
            
            {/* Ejercicios/Platos usados (si hay previewStats) o totales (modo normal) */}
            <div className="flex items-center gap-1">
              {activity.categoria === 'nutricion' || activity.categoria === 'nutrition' ? (
                <UtensilsCrossed className="w-4 h-4 text-[#FF7939]" />
              ) : (
                <Zap className="w-4 h-4 text-[#FF7939]" />
              )}
              <span className="text-sm font-medium">{loading ? '...' : uniqueExercises}</span>
            </div>
            
            {/* Capacidad - Siempre mostrar */}
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4 text-[#FF7939]" />
              <span className="text-sm font-medium">
                {productCapacity && capacityNumber ? (
                  capacityNumber >= 999 ? (
                    <span className="text-lg font-bold">∞</span>
                  ) : (
                    productCapacity
                  )
                ) : (
                  '-'
                )}
              </span>
            </div>
          </div>


         {/* 6. OBJETIVOS/TAGS - Sección fija (siempre presente para mantener alineación) */}
         <div className="flex gap-1 mb-1 justify-start overflow-x-auto h-6">
            {(activity as any).objetivos && Array.isArray((activity as any).objetivos) && (activity as any).objetivos.length > 0 ? (
              (() => {
                // Filtrar objetivos válidos (no vacíos, no nulos, no "Enel" o valores incompletos)
                const objetivosValidos = (activity as any).objetivos.filter((objetivo: string) => 
                  objetivo && 
                  objetivo.trim() !== '' && 
                  objetivo !== 'Enel' && 
                  objetivo !== 'Ene' && 
                  objetivo.length > 2
                )
                
                if (objetivosValidos.length === 0) {
                  return (
                    <div className="h-6"></div>
                  )
                }
                
                // Mostrar máximo 2 objetivos, con "..." si hay más
                const objetivosAMostrar = objetivosValidos.slice(0, 2)
                const hayMas = objetivosValidos.length > 2
                
                return (
                  <>
                    {objetivosAMostrar.map((objetivo: string, index: number) => (
                      <span 
                        key={index}
                        className="bg-[#FF7939]/20 text-[#FF7939] text-[10px] px-1.5 py-0.5 rounded-full font-medium border border-[#FF7939]/30 whitespace-nowrap flex-shrink-0"
                        title={objetivo} // Tooltip con el texto completo
                      >
                        {objetivo.length > 15 ? `${objetivo.substring(0, 15)}...` : objetivo}
                      </span>
                    ))}
                    {hayMas && (
                      <span className="bg-[#FF7939]/20 text-[#FF7939] text-[10px] px-1.5 py-0.5 rounded-full font-medium border border-[#FF7939]/30 whitespace-nowrap flex-shrink-0">
                        ...
                      </span>
                    )}
                  </>
                )
              })()
            ) : (
              <div className="h-6"></div>
            )}
          </div>

         {/* 6.5. UBICACIÓN - Eliminado: solo mantener ícono de modalidad en la fila de intensidad */}

         {/* 7. PRECIO - Sección fija en la parte inferior */}
         <div className="border-t border-gray-700 text-center mt-2">
            <span className="text-orange-300 font-bold text-xl">
              {formatPrice(activity.price)}
            </span>
          </div>
        </div>
        
        {/* Overlay de Reactivación para Talleres Finalizados/Inactivos */}
        {isWorkshopInactive && (
          <div className="absolute inset-0 bg-black/80 rounded-2xl flex items-center justify-center z-10">
            <div className="text-center p-4">
              <RotateCcw className="w-8 h-8 text-[#FF7939] mx-auto mb-2" />
              <p className="text-white font-bold text-base mb-1 drop-shadow-lg">Taller Finalizado</p>
              <p className="text-white font-semibold text-sm drop-shadow-md">Haz click para agregar nuevas fechas</p>
            </div>
          </div>
        )}
        
        {/* Overlay para Productos Pausados (no talleres inactivos) */}
        {isPaused && !isWorkshopInactive && (
          <div className="absolute inset-0 bg-black/60 rounded-2xl flex items-center justify-center z-10">
            <div className="text-center p-4">
              <Lock className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
              <p className="text-white font-bold text-base mb-1 drop-shadow-lg">Producto Pausado</p>
              <p className="text-white font-semibold text-sm drop-shadow-md">Ventas pausadas</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ActivityCard
