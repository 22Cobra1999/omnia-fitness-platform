"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, Video, Flame, MessageSquare, VideoIcon, Calendar, Users } from "lucide-react" // Importar VideoIcon y MessageSquare
import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { VimeoPlayer } from "@/components/vimeo-player"
import { extractVimeoId } from "@/utils/vimeo-utils"
import type { Activity } from "@/types/activity"

interface ActivityCardProps extends Activity {
  showPurchaseButton?: boolean
  onPurchase?: (activityId: number) => void
  isEnrolled?: boolean // Added to control button text/visibility
  onClick?: (activity: Activity) => void
}

export function ActivityCard({
  id,
  title,
  price,
  type,
  difficulty,
  coach_name,
  coach_rating,
  coach_avatar_url,
  // Removed program_rating and total_program_reviews as they are not directly available in schema
  showPurchaseButton = false,
  onPurchase,
  isEnrolled = false,
  onClick,
  media, // Now comes from the nested media object
  program_info, // Now comes from the nested program_info object
  consultation_info, // Now comes from the nested consultation_info object
}: ActivityCardProps) {
  // Duración del programa: Usamos program_info.program_duration
  const formattedDuration = program_info?.program_duration
    ? `${program_info.program_duration} meses`
    : "Duración variable"

  // Ratings
  // Removed displayProgramRating and displayProgramReviews
  const displayCoachRating = coach_rating ? Number(coach_rating).toFixed(1) : "0.0"

  const [showVideoPreview, setShowVideoPreview] = useState(false)

  const handleClick = () => {
    if (onClick) {
      onClick({
        id,
        title,
        price,
        type,
        difficulty,
        coach_name,
        coach_rating,
        coach_avatar_url,
        media,
        program_info,
        consultation_info,
        coach_id: "",
        is_public: true,
        description: "",
        created_at: "",
        updated_at: "",
        tags: [],
        image_url: null,
        video_url: null,
        vimeo_id: null,
        pdf_url: null,
        rich_description: null,
        duration_minutes: null,
        calories_info: null,
        program_duration_weeks_months: null,
        includes_videocall: null,
        includes_message: null,
        videocall_duration: null,
        available_days: null,
        available_hours: null,
        expiration_date: null,
        is_popular: false,
        total_coach_reviews: 0
      })
    }
  }

  const getActualVimeoId = () => {
    if (media?.vimeo_id) return media.vimeo_id
    if (media?.video_url) {
      try {
        return extractVimeoId(media.video_url)
      } catch (error) {
        console.error("Error extracting Vimeo ID from video_url:", error)
        return null
      }
    }
    return null
  }

  const actualVimeoId = getActualVimeoId()
  const hasVideoContent = !!actualVimeoId

  // Consulta info para videollamada y mensajes
  const includesVideocall = consultation_info?.includes_videocall || false
  const includesMessage = consultation_info?.includes_message || false

  return (
    <Card className="relative overflow-hidden rounded-xl shadow-lg flex flex-col h-full bg-gray-900 text-white">
      {/* Background Image - Made taller */}
      <div className="absolute inset-0">
        {media?.image_url ? (
          <Image
            src={media.image_url || "/placeholder.svg"}
            alt={title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            priority={true}
          />
        ) : (
          <Image
            src="/placeholder.svg?height=400&width=600"
            alt={title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            priority={true}
          />
        )}
        {/* Dark overlay for better text readability */}
        <div className="absolute inset-0 bg-black/40" />
      </div>

      {/* Content Overlay */}
      <div className="relative z-10 flex flex-col h-full p-4">
        {/* Top section: Type badge and optional video/consultation badges */}
        <div className="flex justify-between items-start mb-auto">
          <Badge className="bg-[#FF7939] text-white text-xs font-semibold px-3 py-1 rounded-full">
            {type.toUpperCase()}
          </Badge>
          <div className="flex gap-2">
            {hasVideoContent && (
              <Badge className="bg-black/50 text-white border-white/20 backdrop-blur-sm text-xs px-3 py-1 rounded-full">
                <Video className="h-3 w-3 mr-1" />
                Video
              </Badge>
            )}
            {includesVideocall && (
              <Badge className="bg-black/50 text-white border-white/20 backdrop-blur-sm text-xs px-3 py-1 rounded-full">
                <VideoIcon className="h-3 w-3 mr-1" />
                Videollamada
              </Badge>
            )}
            {includesMessage && (
              <Badge className="bg-black/50 text-white border-white/20 backdrop-blur-sm text-xs px-3 py-1 rounded-full">
                <MessageSquare className="h-3 w-3 mr-1" />
                Mensajes
              </Badge>
            )}
          </div>
        </div>

        {/* Middle section: Title, Category and Duration */}
        <div className="flex flex-col items-center justify-center flex-grow text-center px-4">
          <h3 className="font-extrabold text-3xl md:text-4xl leading-tight mb-4 drop-shadow-lg">{title}</h3>
          
          {/* Category Badge */}
          <div className="mb-4">
            <Badge className="bg-[#FF7939] text-white text-sm font-semibold px-4 py-2 rounded-full">
              {type === 'fitness' || type === 'program' ? 'FITNESS' : 
               type === 'nutrition' ? 'NUTRICIÓN' : 
               type.toUpperCase()}
            </Badge>
          </div>
          
          <div className="bg-white/20 backdrop-blur-md rounded-lg px-6 py-2 text-sm font-medium text-white shadow-md">
            <Clock className="inline-block h-4 w-4 mr-1" />
            {formattedDuration}
          </div>
        </div>

        {/* Bottom section: Program details */}
        <div className="bg-black/70 backdrop-blur-md rounded-lg p-4 mt-auto">
          <div className="flex items-center justify-center mb-4">
            {/* Program Stats */}
            <div className="flex items-center space-x-4 text-sm text-gray-200">
              <div className="flex items-center space-x-1">
                <Calendar className="h-4 w-4 text-[#FF7939]" />
                <span>{formattedDuration}</span>
              </div>
              {program_info?.program_duration && (
                <div className="flex items-center space-x-1">
                  <Users className="h-4 w-4 text-[#FF7939]" />
                  <span>Programa</span>
                </div>
              )}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex space-x-2">
            {onClick ? (
              <Button
                onClick={handleClick}
                variant="outline"
                size="sm"
                className="flex-1 bg-white/20 text-white border-white/30 hover:bg-white/30"
              >
                Ver detalles
              </Button>
            ) : (
              <Button
                asChild
                variant="outline"
                size="sm"
                className="flex-1 bg-white/20 text-white border-white/30 hover:bg-white/30"
              >
                <Link href={`/activities/${id}`}>Ver detalles</Link>
              </Button>
            )}
            {isEnrolled ? (
              <Button asChild size="sm" className="flex-1 bg-green-500 hover:bg-green-600 text-white">
                <Link href={`/program-tracker/${id}`}>Continuar</Link>
              </Button>
            ) : (
              showPurchaseButton &&
              onPurchase && (
                <Button
                  onClick={() => onPurchase(id)}
                  size="sm"
                  className="flex-1 bg-[#FF7939] hover:bg-[#E66829] text-white font-bold"
                >
                  Comprar ${price}
                </Button>
              )
            )}
          </div>
        </div>
      </div>

      {/* Video Preview Dialog */}
      <Dialog open={showVideoPreview} onOpenChange={setShowVideoPreview}>
        <DialogContent className="bg-[#1E1E1E] text-white border-gray-800 sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Video className="h-5 w-5 mr-2 text-[#FF7939]" />
              Vista previa - {title}
            </DialogTitle>
          </DialogHeader>
          <div className="aspect-video w-full">
            {hasVideoContent && <VimeoPlayer videoId={actualVimeoId || ""} title={title} />}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
