"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Clock, User, DollarSign, ChevronLeft, Star, ShoppingCart, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { VimeoPlayer } from '@/components/shared/video/vimeo-player'
import { extractVimeoId } from "@/utils/vimeo-utils"
import { ScheduleActivityButton } from '@/components/shared/calendar/schedule-activity-button'
import { PurchaseActivityModal } from '@/components/shared/activities/purchase-activity-modal'
import type { Activity } from "@/types/activity"

interface ActivityDetailPageProps {
  activity: Activity
}

export function ActivityDetailPage({ activity }: ActivityDetailPageProps) {
  const router = useRouter()
  const [showPurchaseModal, setShowPurchaseModal] = useState(false)

  const handleBack = () => {
    router.back()
  }

  const handlePurchase = () => {
    setShowPurchaseModal(true)
  }

  const handleCoachClick = () => {
    if (activity.coach_id) {
      router.push(`/coach/${activity.coach_id}`)
    }
  }

  const vimeoId = extractVimeoId(activity.video_url || '')

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-sm px-4 py-3 flex items-center justify-between">
        <button
          onClick={handleBack}
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
        {/* Hero Image/Video */}
        <div className="relative h-64 md:h-80 bg-gray-900">
          {vimeoId ? (
            <VimeoPlayer 
              videoId={vimeoId}
              autoplay={false}
              className="w-full h-full"
            />
          ) : activity.image_url ? (
            <Image
              src={activity.image_url}
              alt={activity.title}
              fill
              className="object-cover"
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
            <button
              onClick={handleCoachClick}
              className="flex items-center space-x-3 text-left hover:bg-gray-800 p-2 rounded-lg transition-colors"
            >
              <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-700">
                <Image
                  src={activity.coach_avatar_url || '/placeholder.svg'}
                  alt={activity.coach_name || 'Coach'}
                  width={48}
                  height={48}
                  className="object-cover"
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
            </button>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Descripción</h3>
            <p className="text-gray-300 leading-relaxed">
              {activity.description || 'No hay descripción disponible.'}
            </p>
          </div>

          {/* Activity Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Clock className="h-5 w-5 text-[#FF7939]" />
                <span className="font-medium">Duración</span>
              </div>
              <p className="text-gray-300">
                {activity.duration_minutes ? `${activity.duration_minutes} min` : 'No especificada'}
              </p>
            </div>

            <div className="bg-gray-800 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <DollarSign className="h-5 w-5 text-[#FF7939]" />
                <span className="font-medium">Precio</span>
              </div>
              <p className="text-gray-300">${activity.price}</p>
            </div>
          </div>

          {/* Type and Difficulty */}
          <div className="flex space-x-2">
            <span className="bg-[#FF7939]/20 text-[#FF7939] px-3 py-1 rounded-full text-sm">
              {activity.type || 'Actividad'}
            </span>
            <span className="bg-gray-700 text-gray-300 px-3 py-1 rounded-full text-sm">
              {activity.difficulty || 'Intermedio'}
            </span>
          </div>

          {/* Purchase Button */}
          <div className="pt-4">
            <Button
              onClick={handlePurchase}
              className="w-full bg-[#FF7939] hover:bg-[#FF6B00] text-white font-bold py-4 rounded-xl transition-all duration-200 hover:scale-105 flex items-center justify-center space-x-2"
            >
              <ShoppingCart className="h-5 w-5" />
              <span>Comprar Ahora</span>
            </Button>
          </div>

          {/* Contact Coach */}
          <div className="pt-4 border-t border-gray-700">
            <Button
              onClick={handleCoachClick}
              variant="outline"
              className="w-full border-gray-600 text-white hover:bg-gray-800 py-3 rounded-xl flex items-center justify-center space-x-2"
            >
              <MessageCircle className="h-5 w-5" />
              <span>Contactar Coach</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Purchase Modal */}
      {showPurchaseModal && (
        <PurchaseActivityModal
          isOpen={showPurchaseModal}
          onClose={() => setShowPurchaseModal(false)}
          activity={activity}
        />
      )}
    </div>
  )
}
